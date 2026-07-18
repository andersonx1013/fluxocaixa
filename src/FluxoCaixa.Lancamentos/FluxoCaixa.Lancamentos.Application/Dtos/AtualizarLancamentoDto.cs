namespace FluxoCaixa.Lancamentos.Application.Dtos;

public sealed record AtualizarLancamentoDto(
    int Tipo,
    decimal Valor,
    DateTime Data,
    string Descricao);