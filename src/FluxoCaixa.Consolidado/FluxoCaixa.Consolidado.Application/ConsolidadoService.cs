using FluxoCaixa.Consolidado.Application.Dtos;
using FluxoCaixa.Consolidado.Domain;
using FluxoCaixa.Shared;
using Microsoft.Extensions.Logging;

namespace FluxoCaixa.Consolidado.Application;

public sealed class ConsolidadoService
{
    private readonly IConsolidadoRepository _repository;
    private readonly ICacheService _cacheService;
    private readonly IProcessedMessageStore _processedMessageStore;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ConsolidadoService> _logger;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public ConsolidadoService(
        IConsolidadoRepository repository,
        ICacheService cacheService,
        IProcessedMessageStore processedMessageStore,
        IUnitOfWork unitOfWork,
        ILogger<ConsolidadoService> logger)
    {
        _repository = repository;
        _cacheService = cacheService;
        _processedMessageStore = processedMessageStore;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Resultado<ConsolidadoResponseDto>> ObterSaldoDiarioAsync(
        DateTime data,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = CriarCacheKey(data);

        var consolidado = await _cacheService.GetOrSetAsync(
            cacheKey,
            async () =>
            {
                _logger.LogInformation("Cache miss para data {Data}. Consultando banco de dados.", data.ToString("yyyy-MM-dd"));
                var entity = await _repository.GetByDataAsync(data.Date, cancellationToken);
                return entity is null ? null : MapearParaDto(entity);
            },
            CacheTtl,
            cancellationToken);

        return consolidado is null
            ? Resultado<ConsolidadoResponseDto>.Falhar(MensagensErro.ConsolidadoNaoEncontrado)
            : Resultado<ConsolidadoResponseDto>.Ok(consolidado);
    }

    public async Task ProcessarLancamentoCriadoAsync(
        string messageId,
        LancamentoCriadoEvent evento,
        CancellationToken cancellationToken = default)
    {
        if (await JaFoiProcessadaAsync(messageId, cancellationToken))
            return;

        var consolidado = await ObterOuCriarAsync(evento.Data, cancellationToken);
        Adicionar(consolidado, evento.Tipo, evento.Valor);

        await _repository.UpsertAsync(consolidado, cancellationToken);
        await FinalizarProcessamentoAsync(messageId, cancellationToken);
        await InvalidarCacheAsync(evento.Data, cancellationToken);

        _logger.LogInformation(
            "Lançamento criado consolidado. MessageId: {MessageId}, Data: {Data}, SaldoFinal: {Saldo}",
            messageId,
            evento.Data.ToString("yyyy-MM-dd"),
            consolidado.SaldoFinal);
    }

    public async Task ProcessarLancamentoExcluidoAsync(
        string messageId,
        LancamentoExcluidoEvent evento,
        CancellationToken cancellationToken = default)
    {
        if (await JaFoiProcessadaAsync(messageId, cancellationToken))
            return;

        var consolidado = await _repository.GetByDataAsync(evento.Data.Date, cancellationToken);
        if (consolidado is not null)
        {
            Remover(consolidado, evento.Tipo, evento.Valor);
            await _repository.UpsertAsync(consolidado, cancellationToken);
        }
        else
        {
            _logger.LogWarning("Consolidado não encontrado ao excluir lançamento da data {Data}.", evento.Data.ToString("yyyy-MM-dd"));
        }

        await FinalizarProcessamentoAsync(messageId, cancellationToken);
        await InvalidarCacheAsync(evento.Data, cancellationToken);
    }

    public async Task ProcessarLancamentoAtualizadoAsync(
        string messageId,
        LancamentoAtualizadoEvent evento,
        CancellationToken cancellationToken = default)
    {
        if (await JaFoiProcessadaAsync(messageId, cancellationToken))
            return;

        var consolidadoAntigo = await _repository.GetByDataAsync(evento.DataAntiga.Date, cancellationToken);

        if (evento.DataAntiga.Date == evento.DataNova.Date)
        {
            var consolidado = consolidadoAntigo ?? new ConsolidadoDiario(evento.DataNova.Date, 0);
            Remover(consolidado, evento.TipoAntigo, evento.ValorAntigo);
            Adicionar(consolidado, evento.TipoNovo, evento.ValorNovo);
            await _repository.UpsertAsync(consolidado, cancellationToken);
        }
        else
        {
            if (consolidadoAntigo is not null)
            {
                Remover(consolidadoAntigo, evento.TipoAntigo, evento.ValorAntigo);
                await _repository.UpsertAsync(consolidadoAntigo, cancellationToken);
            }

            var consolidadoNovo = await ObterOuCriarAsync(evento.DataNova, cancellationToken);
            Adicionar(consolidadoNovo, evento.TipoNovo, evento.ValorNovo);
            await _repository.UpsertAsync(consolidadoNovo, cancellationToken);
        }

        await FinalizarProcessamentoAsync(messageId, cancellationToken);
        await InvalidarCacheAsync(evento.DataAntiga, cancellationToken);

        if (evento.DataAntiga.Date != evento.DataNova.Date)
            await InvalidarCacheAsync(evento.DataNova, cancellationToken);

        _logger.LogInformation(
            "Lançamento atualizado no consolidado. MessageId: {MessageId}, DataAntiga: {DataAntiga}, DataNova: {DataNova}",
            messageId,
            evento.DataAntiga.ToString("yyyy-MM-dd"),
            evento.DataNova.ToString("yyyy-MM-dd"));
    }

    private async Task<ConsolidadoDiario> ObterOuCriarAsync(DateTime data, CancellationToken cancellationToken)
    {
        return await _repository.GetByDataAsync(data.Date, cancellationToken)
               ?? new ConsolidadoDiario(data.Date, 0);
    }

    private async Task<bool> JaFoiProcessadaAsync(string messageId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(messageId))
            throw new ArgumentException("MessageId é obrigatório para garantir idempotência.", nameof(messageId));

        var processada = await _processedMessageStore.ExistsAsync(messageId, cancellationToken);
        if (processada)
            _logger.LogInformation("Mensagem duplicada ignorada. MessageId: {MessageId}", messageId);

        return processada;
    }

    private async Task FinalizarProcessamentoAsync(string messageId, CancellationToken cancellationToken)
    {
        await _processedMessageStore.AddAsync(messageId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task InvalidarCacheAsync(DateTime data, CancellationToken cancellationToken)
    {
        await _cacheService.RemoverAsync(CriarCacheKey(data), cancellationToken);
    }

    private static string CriarCacheKey(DateTime data) => $"consolidado:{data:yyyy-MM-dd}";

    private static void Adicionar(ConsolidadoDiario consolidado, TipoLancamento tipo, decimal valor)
    {
        if (tipo == TipoLancamento.Debito)
            consolidado.AdicionarDebito(valor);
        else
            consolidado.AdicionarCredito(valor);
    }

    private static void Remover(ConsolidadoDiario consolidado, TipoLancamento tipo, decimal valor)
    {
        if (tipo == TipoLancamento.Debito)
            consolidado.RemoverDebito(valor);
        else
            consolidado.RemoverCredito(valor);
    }

    private static ConsolidadoResponseDto MapearParaDto(ConsolidadoDiario entity)
    {
        return new ConsolidadoResponseDto(
            entity.Data,
            entity.SaldoInicial,
            entity.TotalDebitos,
            entity.TotalCreditos,
            entity.SaldoFinal,
            entity.UltimaAtualizacao);
    }
}
