namespace FluxoCaixa.Shared;

public sealed record LancamentoCriadoEvent(
    Guid LancamentoId,
    TipoLancamento Tipo,
    decimal Valor,
    DateTime Data,
    string Descricao,
    DateTime CriadoEm);

public sealed record LancamentoExcluidoEvent(
    Guid LancamentoId,
    TipoLancamento Tipo,
    decimal Valor,
    DateTime Data);

public sealed record LancamentoAtualizadoEvent(
    Guid LancamentoId,
    TipoLancamento TipoAntigo,
    decimal ValorAntigo,
    DateTime DataAntiga,
    TipoLancamento TipoNovo,
    decimal ValorNovo,
    DateTime DataNova);
