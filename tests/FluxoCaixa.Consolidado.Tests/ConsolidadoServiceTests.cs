using FluxoCaixa.Consolidado.Application;
using FluxoCaixa.Consolidado.Application.Dtos;
using FluxoCaixa.Consolidado.Domain;
using FluxoCaixa.Shared;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FluxoCaixa.Consolidado.Tests;

public class ConsolidadoServiceTests
{
    private readonly Mock<IConsolidadoRepository> _repositoryMock;
    private readonly Mock<ICacheService> _cacheServiceMock;
    private readonly Mock<IProcessedMessageStore> _processedMessageStoreMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ILogger<ConsolidadoService>> _loggerMock;
    private readonly ConsolidadoService _service;

    public ConsolidadoServiceTests()
    {
        _repositoryMock = new Mock<IConsolidadoRepository>();
        _cacheServiceMock = new Mock<ICacheService>();
        _processedMessageStoreMock = new Mock<IProcessedMessageStore>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _loggerMock = new Mock<ILogger<ConsolidadoService>>();
        _service = new ConsolidadoService(
            _repositoryMock.Object,
            _cacheServiceMock.Object,
            _processedMessageStoreMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task ObterSaldoDiarioAsync_CacheHit_DeveRetornarDoCache()
    {
        // Arrange
        var data = DateTime.Today;
        var cacheKey = $"consolidado:{data:yyyy-MM-dd}";
        var consolidadoCache = new ConsolidadoResponseDto(data, 0, 100, 500, 400, DateTime.UtcNow);

        _cacheServiceMock.Setup(c => c.GetOrSetAsync(
                cacheKey,
                It.IsAny<Func<Task<ConsolidadoResponseDto?>>>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidadoCache);

        // Act
        var resultado = await _service.ObterSaldoDiarioAsync(data);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal(400, resultado.Dados.SaldoFinal);
        Assert.Equal(100, resultado.Dados.TotalDebitos);
        Assert.Equal(500, resultado.Dados.TotalCreditos);

        _repositoryMock.Verify(r => r.GetByDataAsync(It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ObterSaldoDiarioAsync_CacheMiss_DeveConsultarBanco()
    {
        // Arrange
        var data = DateTime.Today;
        var cacheKey = $"consolidado:{data:yyyy-MM-dd}";
        var consolidado = new ConsolidadoDiario(data, 1000);

        _cacheServiceMock.Setup(c => c.GetOrSetAsync(
                cacheKey,
                It.IsAny<Func<Task<ConsolidadoResponseDto?>>>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .Returns((string key, Func<Task<ConsolidadoResponseDto?>> factory, TimeSpan? expiration, CancellationToken ct) => factory());

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidado);

        // Act
        var resultado = await _service.ObterSaldoDiarioAsync(data);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal(1000, resultado.Dados.SaldoFinal);
        _repositoryMock.Verify(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ObterSaldoDiarioAsync_NaoEncontrado_DeveRetornarFalha()
    {
        // Arrange
        var data = DateTime.Today;
        var cacheKey = $"consolidado:{data:yyyy-MM-dd}";

        _cacheServiceMock.Setup(c => c.GetOrSetAsync(
                cacheKey,
                It.IsAny<Func<Task<ConsolidadoResponseDto?>>>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConsolidadoResponseDto?)null);

        // Act
        var resultado = await _service.ObterSaldoDiarioAsync(data);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.ConsolidadoNaoEncontrado, resultado.MensagemErro);
    }

    [Fact]
    public async Task ProcessarLancamentoCriadoAsync_Debito_DeveAtualizarSaldo()
    {
        // Arrange
        var data = DateTime.Today;
        var consolidado = new ConsolidadoDiario(data, 1000);
        var evento = new LancamentoCriadoEvent(Guid.NewGuid(), TipoLancamento.Debito, 200m, data, "Pagamento", DateTime.UtcNow);

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidado);

        _repositoryMock.Setup(r => r.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _cacheServiceMock.Setup(c => c.RemoverAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.ProcessarLancamentoCriadoAsync("msg-debito", evento);

        // Assert
        _repositoryMock.Verify(r => r.UpsertAsync(It.Is<ConsolidadoDiario>(c =>
            c.TotalDebitos == 200m &&
            c.SaldoFinal == 800m), It.IsAny<CancellationToken>()), Times.Once);

        _cacheServiceMock.Verify(c => c.RemoverAsync($"consolidado:{data:yyyy-MM-dd}", It.IsAny<CancellationToken>()), Times.Once);
        _processedMessageStoreMock.Verify(store => store.AddAsync("msg-debito", It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessarLancamentoCriadoAsync_Credito_DeveAtualizarSaldo()
    {
        // Arrange
        var data = DateTime.Today;
        var consolidado = new ConsolidadoDiario(data, 500);
        var evento = new LancamentoCriadoEvent(Guid.NewGuid(), TipoLancamento.Credito, 300m, data, "Venda", DateTime.UtcNow);

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidado);

        _repositoryMock.Setup(r => r.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _cacheServiceMock.Setup(c => c.RemoverAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.ProcessarLancamentoCriadoAsync("msg-credito", evento);

        // Assert
        _repositoryMock.Verify(r => r.UpsertAsync(It.Is<ConsolidadoDiario>(c =>
            c.TotalCreditos == 300m &&
            c.SaldoFinal == 800m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessarLancamentoCriadoAsync_NovoConsolidado_DeveCriar()
    {
        // Arrange
        var data = DateTime.Today;
        var evento = new LancamentoCriadoEvent(Guid.NewGuid(), TipoLancamento.Credito, 500m, data, "Venda", DateTime.UtcNow);

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConsolidadoDiario?)null);

        _repositoryMock.Setup(r => r.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _cacheServiceMock.Setup(c => c.RemoverAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.ProcessarLancamentoCriadoAsync("msg-novo", evento);

        // Assert
        _repositoryMock.Verify(r => r.UpsertAsync(It.Is<ConsolidadoDiario>(c =>
            c.SaldoInicial == 0 &&
            c.TotalCreditos == 500m &&
            c.SaldoFinal == 500m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessarLancamentoExcluidoAsync_Debito_DeveReverter()
    {
        // Arrange
        var data = DateTime.Today;
        var consolidado = new ConsolidadoDiario(data, 1000);
        consolidado.AdicionarDebito(200m); // Saldo: 800

        var evento = new LancamentoExcluidoEvent(Guid.NewGuid(), TipoLancamento.Debito, 200m, data);

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidado);

        _repositoryMock.Setup(r => r.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _cacheServiceMock.Setup(c => c.RemoverAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.ProcessarLancamentoExcluidoAsync("msg-exclusao", evento);

        // Assert
        _repositoryMock.Verify(r => r.UpsertAsync(It.Is<ConsolidadoDiario>(c =>
            c.TotalDebitos == 0 &&
            c.SaldoFinal == 1000m), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessarLancamentoExcluidoAsync_ConsolidadoNaoEncontrado_NaoDeveFalhar()
    {
        // Arrange
        var data = DateTime.Today;
        var evento = new LancamentoExcluidoEvent(Guid.NewGuid(), TipoLancamento.Debito, 200m, data);

        _repositoryMock.Setup(r => r.GetByDataAsync(data.Date, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConsolidadoDiario?)null);

        // Act
        await _service.ProcessarLancamentoExcluidoAsync("msg-exclusao-inexistente", evento);

        // Assert
        _repositoryMock.Verify(r => r.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()), Times.Never);
        _processedMessageStoreMock.Verify(
            store => store.AddAsync("msg-exclusao-inexistente", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessarLancamentoCriadoAsync_MensagemDuplicada_NaoDeveAlterarSaldo()
    {
        var evento = new LancamentoCriadoEvent(
            Guid.NewGuid(),
            TipoLancamento.Credito,
            500m,
            DateTime.Today,
            "Venda",
            DateTime.UtcNow);

        _processedMessageStoreMock.Setup(store => store.ExistsAsync("msg-duplicada", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await _service.ProcessarLancamentoCriadoAsync("msg-duplicada", evento);

        _repositoryMock.Verify(
            repository => repository.UpsertAsync(It.IsAny<ConsolidadoDiario>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _unitOfWorkMock.Verify(unit => unit.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessarLancamentoAtualizadoAsync_MudancaDeData_DeveCorrigirOsDoisDias()
    {
        var dataAntiga = new DateTime(2026, 7, 17);
        var dataNova = new DateTime(2026, 7, 18);
        var consolidadoAntigo = new ConsolidadoDiario(dataAntiga, 0);
        consolidadoAntigo.AdicionarDebito(100m);

        _repositoryMock.Setup(repository => repository.GetByDataAsync(dataAntiga, It.IsAny<CancellationToken>()))
            .ReturnsAsync(consolidadoAntigo);
        _repositoryMock.Setup(repository => repository.GetByDataAsync(dataNova, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ConsolidadoDiario?)null);

        var evento = new LancamentoAtualizadoEvent(
            Guid.NewGuid(),
            TipoLancamento.Debito,
            100m,
            dataAntiga,
            TipoLancamento.Credito,
            300m,
            dataNova);

        await _service.ProcessarLancamentoAtualizadoAsync("msg-mudanca-data", evento);

        _repositoryMock.Verify(repository => repository.UpsertAsync(
            It.Is<ConsolidadoDiario>(item =>
                item.Data == dataAntiga && item.TotalDebitos == 0m && item.SaldoFinal == 0m),
            It.IsAny<CancellationToken>()), Times.Once);
        _repositoryMock.Verify(repository => repository.UpsertAsync(
            It.Is<ConsolidadoDiario>(item =>
                item.Data == dataNova && item.TotalCreditos == 300m && item.SaldoFinal == 300m),
            It.IsAny<CancellationToken>()), Times.Once);
        _cacheServiceMock.Verify(cache => cache.RemoverAsync(
            $"consolidado:{dataAntiga:yyyy-MM-dd}", It.IsAny<CancellationToken>()), Times.Once);
        _cacheServiceMock.Verify(cache => cache.RemoverAsync(
            $"consolidado:{dataNova:yyyy-MM-dd}", It.IsAny<CancellationToken>()), Times.Once);
    }
}
