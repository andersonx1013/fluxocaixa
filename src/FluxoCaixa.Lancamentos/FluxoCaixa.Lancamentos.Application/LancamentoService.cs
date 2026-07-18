using FluxoCaixa.Lancamentos.Application.Dtos;
using FluxoCaixa.Lancamentos.Domain;
using FluxoCaixa.Shared;
using Microsoft.Extensions.Logging;

namespace FluxoCaixa.Lancamentos.Application;

public sealed class LancamentoService
{
    private readonly ILancamentoRepository _repository;
    private readonly IEventOutbox _eventOutbox;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<LancamentoService> _logger;

    public LancamentoService(
        ILancamentoRepository repository,
        IEventOutbox eventOutbox,
        IUnitOfWork unitOfWork,
        ILogger<LancamentoService> logger)
    {
        _repository = repository;
        _eventOutbox = eventOutbox;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Resultado<LancamentoResponseDto>> RegistrarAsync(
        CriarLancamentoDto dto,
        CancellationToken cancellationToken = default)
    {
        var validacao = ValidarCriacao(dto);
        if (validacao.Falha)
            return Resultado<LancamentoResponseDto>.Falhar(validacao.MensagemErro!);

        var tipo = (TipoLancamento)dto.Tipo;

        var lancamento = new Lancamento(tipo, dto.Valor, dto.Data, dto.Descricao);

        await _repository.AddAsync(lancamento, cancellationToken);

        var evento = new LancamentoCriadoEvent(
            lancamento.Id,
            lancamento.Tipo,
            lancamento.Valor,
            lancamento.Data,
            lancamento.Descricao,
            lancamento.CriadoEm);

        await _eventOutbox.AdicionarLancamentoCriadoAsync(evento, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Lançamento {Id} registrado com sucesso. Tipo: {Tipo}, Valor: {Valor}",
            lancamento.Id, lancamento.Tipo, lancamento.Valor);

        return Resultado<LancamentoResponseDto>.Ok(MapearParaDto(lancamento));
    }

    public async Task<Resultado<LancamentoResponseDto>> AtualizarAsync(
        Guid id,
        AtualizarLancamentoDto dto,
        CancellationToken cancellationToken = default)
    {
        var validacao = ValidarAtualizacao(dto);
        if (validacao.Falha)
            return Resultado<LancamentoResponseDto>.Falhar(validacao.MensagemErro!);

        var lancamento = await _repository.GetByIdAsync(id, cancellationToken);
        if (lancamento is null)
            return Resultado<LancamentoResponseDto>.Falhar(MensagensErro.LancamentoNaoEncontrado);

        var tipo = (TipoLancamento)dto.Tipo;
        var tipoAntigo = lancamento.Tipo;
        var valorAntigo = lancamento.Valor;
        var dataAntiga = lancamento.Data;
        lancamento.Atualizar(tipo, dto.Valor, dto.Data, dto.Descricao);

        await _repository.UpdateAsync(lancamento, cancellationToken);

        var eventoAtualizado = new LancamentoAtualizadoEvent(
            lancamento.Id,
            tipoAntigo,
            valorAntigo,
            dataAntiga,
            lancamento.Tipo,
            lancamento.Valor,
            lancamento.Data);

        await _eventOutbox.AdicionarLancamentoAtualizadoAsync(eventoAtualizado, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Lançamento {Id} atualizado com sucesso.", id);

        return Resultado<LancamentoResponseDto>.Ok(MapearParaDto(lancamento));
    }

    public async Task<Resultado> ExcluirAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var lancamento = await _repository.GetByIdAsync(id, cancellationToken);
        if (lancamento is null)
            return Resultado.Falhar(MensagensErro.LancamentoNaoEncontrado);

        var evento = new LancamentoExcluidoEvent(
            lancamento.Id,
            lancamento.Tipo,
            lancamento.Valor,
            lancamento.Data);

        await _repository.DeleteAsync(lancamento, cancellationToken);
        await _eventOutbox.AdicionarLancamentoExcluidoAsync(evento, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Lançamento {Id} excluído com sucesso.", id);

        return Resultado.Ok();
    }

    public async Task<Resultado<LancamentoResponseDto>> ObterPorIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var lancamento = await _repository.GetByIdAsync(id, cancellationToken);
        if (lancamento is null)
            return Resultado<LancamentoResponseDto>.Falhar(MensagensErro.LancamentoNaoEncontrado);

        return Resultado<LancamentoResponseDto>.Ok(MapearParaDto(lancamento));
    }

    public async Task<Resultado<IEnumerable<LancamentoResponseDto>>> ObterPorDataAsync(
        DateTime data,
        CancellationToken cancellationToken = default)
    {
        var lancamentos = await _repository.GetByDateRangeAsync(data.Date, cancellationToken);
        var dtos = lancamentos.Select(MapearParaDto);
        return Resultado<IEnumerable<LancamentoResponseDto>>.Ok(dtos);
    }

    private static Resultado ValidarCriacao(CriarLancamentoDto dto)
    {
        if (dto.Valor <= 0)
            return Resultado.Falhar(MensagensErro.ValorDeveSerMaiorQueZero);

        if (dto.Tipo != (int)TipoLancamento.Debito && dto.Tipo != (int)TipoLancamento.Credito)
            return Resultado.Falhar(MensagensErro.TipoLancamentoInvalido);

        if (string.IsNullOrWhiteSpace(dto.Descricao))
            return Resultado.Falhar(MensagensErro.DescricaoObrigatoria);

        if (dto.Descricao.Length > 200)
            return Resultado.Falhar(MensagensErro.DescricaoTamanhoMaximo);

        if (dto.Data == default)
            return Resultado.Falhar(MensagensErro.DataObrigatoria);

        return Resultado.Ok();
    }

    private static Resultado ValidarAtualizacao(AtualizarLancamentoDto dto)
    {
        if (dto.Valor <= 0)
            return Resultado.Falhar(MensagensErro.ValorDeveSerMaiorQueZero);

        if (dto.Tipo != (int)TipoLancamento.Debito && dto.Tipo != (int)TipoLancamento.Credito)
            return Resultado.Falhar(MensagensErro.TipoLancamentoInvalido);

        if (string.IsNullOrWhiteSpace(dto.Descricao))
            return Resultado.Falhar(MensagensErro.DescricaoObrigatoria);

        if (dto.Descricao.Length > 200)
            return Resultado.Falhar(MensagensErro.DescricaoTamanhoMaximo);

        return Resultado.Ok();
    }

    private static LancamentoResponseDto MapearParaDto(Lancamento lancamento)
    {
        return new LancamentoResponseDto(
            lancamento.Id,
            lancamento.Tipo == TipoLancamento.Debito ? "Debito" : "Credito",
            lancamento.Valor,
            lancamento.Data,
            lancamento.Descricao,
            lancamento.CriadoEm);
    }
}
