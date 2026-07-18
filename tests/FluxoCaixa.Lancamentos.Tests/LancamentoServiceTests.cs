using FluxoCaixa.Lancamentos.Application;
using FluxoCaixa.Lancamentos.Application.Dtos;
using FluxoCaixa.Lancamentos.Domain;
using FluxoCaixa.Shared;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace FluxoCaixa.Lancamentos.Tests;

public class LancamentoServiceTests
{
    private readonly Mock<ILancamentoRepository> _repositoryMock;
    private readonly Mock<IEventOutbox> _eventOutboxMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<ILogger<LancamentoService>> _loggerMock;
    private readonly LancamentoService _service;

    public LancamentoServiceTests()
    {
        _repositoryMock = new Mock<ILancamentoRepository>();
        _eventOutboxMock = new Mock<IEventOutbox>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _loggerMock = new Mock<ILogger<LancamentoService>>();
        _service = new LancamentoService(
            _repositoryMock.Object,
            _eventOutboxMock.Object,
            _unitOfWorkMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task RegistrarAsync_DebitoValido_DeveRetornarSucesso()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Debito,
            Valor: 100.50m,
            Data: DateTime.Today,
            Descricao: "Pagamento fornecedor");

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Lancamento>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventOutboxMock.Setup(p => p.AdicionarLancamentoCriadoAsync(It.IsAny<LancamentoCriadoEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal("Debito", resultado.Dados.Tipo);
        Assert.Equal(100.50m, resultado.Dados.Valor);
        Assert.Equal("Pagamento fornecedor", resultado.Dados.Descricao);

        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Lancamento>(), It.IsAny<CancellationToken>()), Times.Once);
        _eventOutboxMock.Verify(p => p.AdicionarLancamentoCriadoAsync(It.IsAny<LancamentoCriadoEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RegistrarAsync_CreditoValido_DeveRetornarSucesso()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Credito,
            Valor: 500.00m,
            Data: DateTime.Today,
            Descricao: "Venda realizada");

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Lancamento>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventOutboxMock.Setup(p => p.AdicionarLancamentoCriadoAsync(It.IsAny<LancamentoCriadoEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal("Credito", resultado.Dados.Tipo);
        Assert.Equal(500.00m, resultado.Dados.Valor);
    }

    [Fact]
    public async Task RegistrarAsync_ValorZero_DeveRetornarFalha()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Debito,
            Valor: 0,
            Data: DateTime.Today,
            Descricao: "Teste inválido");

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.ValorDeveSerMaiorQueZero, resultado.MensagemErro);
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Lancamento>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RegistrarAsync_ValorNegativo_DeveRetornarFalha()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Credito,
            Valor: -50.00m,
            Data: DateTime.Today,
            Descricao: "Teste inválido");

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.ValorDeveSerMaiorQueZero, resultado.MensagemErro);
    }

    [Fact]
    public async Task RegistrarAsync_TipoInvalido_DeveRetornarFalha()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: 99,
            Valor: 100m,
            Data: DateTime.Today,
            Descricao: "Teste inválido");

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.TipoLancamentoInvalido, resultado.MensagemErro);
    }

    [Fact]
    public async Task RegistrarAsync_DescricaoVazia_DeveRetornarFalha()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Debito,
            Valor: 100m,
            Data: DateTime.Today,
            Descricao: "");

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.DescricaoObrigatoria, resultado.MensagemErro);
    }

    [Fact]
    public async Task RegistrarAsync_DescricaoMuitoLonga_DeveRetornarFalha()
    {
        // Arrange
        var dto = new CriarLancamentoDto(
            Tipo: (int)TipoLancamento.Debito,
            Valor: 100m,
            Data: DateTime.Today,
            Descricao: new string('X', 201));

        // Act
        var resultado = await _service.RegistrarAsync(dto);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.DescricaoTamanhoMaximo, resultado.MensagemErro);
    }

    [Fact]
    public async Task ExcluirAsync_LancamentoExistente_DeveRetornarSucesso()
    {
        // Arrange
        var id = Guid.NewGuid();
        var lancamento = new Lancamento(TipoLancamento.Debito, 100m, DateTime.Today, "Teste");

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lancamento);

        _repositoryMock.Setup(r => r.DeleteAsync(lancamento, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _eventOutboxMock.Setup(p => p.AdicionarLancamentoExcluidoAsync(It.IsAny<LancamentoExcluidoEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var resultado = await _service.ExcluirAsync(id);

        // Assert
        Assert.True(resultado.Sucesso);
        _repositoryMock.Verify(r => r.DeleteAsync(lancamento, It.IsAny<CancellationToken>()), Times.Once);
        _eventOutboxMock.Verify(p => p.AdicionarLancamentoExcluidoAsync(It.IsAny<LancamentoExcluidoEvent>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ExcluirAsync_LancamentoNaoEncontrado_DeveRetornarFalha()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lancamento?)null);

        // Act
        var resultado = await _service.ExcluirAsync(id);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.LancamentoNaoEncontrado, resultado.MensagemErro);
    }

    [Fact]
    public async Task ObterPorIdAsync_LancamentoExistente_DeveRetornarSucesso()
    {
        // Arrange
        var id = Guid.NewGuid();
        var lancamento = new Lancamento(TipoLancamento.Credito, 250m, DateTime.Today, "Venda");

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lancamento);

        // Act
        var resultado = await _service.ObterPorIdAsync(id);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal("Credito", resultado.Dados.Tipo);
        Assert.Equal(250m, resultado.Dados.Valor);
    }

    [Fact]
    public async Task ObterPorIdAsync_LancamentoNaoEncontrado_DeveRetornarFalha()
    {
        // Arrange
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lancamento?)null);

        // Act
        var resultado = await _service.ObterPorIdAsync(id);

        // Assert
        Assert.True(resultado.Falha);
        Assert.Equal(MensagensErro.LancamentoNaoEncontrado, resultado.MensagemErro);
    }

    [Fact]
    public async Task AtualizarAsync_LancamentoExistente_DeveRetornarSucesso()
    {
        // Arrange
        var id = Guid.NewGuid();
        var lancamento = new Lancamento(TipoLancamento.Debito, 100m, DateTime.Today, "Original");

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lancamento);

        _repositoryMock.Setup(r => r.UpdateAsync(It.IsAny<Lancamento>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var dto = new AtualizarLancamentoDto(
            Tipo: (int)TipoLancamento.Credito,
            Valor: 300m,
            Data: DateTime.Today,
            Descricao: "Atualizado");

        // Act
        var resultado = await _service.AtualizarAsync(id, dto);

        // Assert
        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal("Credito", resultado.Dados.Tipo);
        Assert.Equal(300m, resultado.Dados.Valor);
        Assert.Equal("Atualizado", resultado.Dados.Descricao);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AtualizarAsync_MudancaDeData_DeveRegistrarDatasAntigaENovaNoOutbox()
    {
        var id = Guid.NewGuid();
        var dataAntiga = new DateTime(2026, 7, 17);
        var dataNova = new DateTime(2026, 7, 18);
        var lancamento = new Lancamento(TipoLancamento.Debito, 100m, dataAntiga, "Original");

        _repositoryMock.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lancamento);

        var dto = new AtualizarLancamentoDto(
            (int)TipoLancamento.Credito,
            300m,
            dataNova,
            "Atualizado");

        var resultado = await _service.AtualizarAsync(id, dto);

        Assert.True(resultado.Sucesso);
        _eventOutboxMock.Verify(outbox => outbox.AdicionarLancamentoAtualizadoAsync(
            It.Is<LancamentoAtualizadoEvent>(evento =>
                evento.DataAntiga == dataAntiga &&
                evento.DataNova == dataNova &&
                evento.ValorAntigo == 100m &&
                evento.ValorNovo == 300m),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
