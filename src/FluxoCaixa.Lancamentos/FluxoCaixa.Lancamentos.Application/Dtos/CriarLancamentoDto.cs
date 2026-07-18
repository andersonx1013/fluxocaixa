namespace FluxoCaixa.Lancamentos.Application.Dtos;

public sealed record CriarLancamentoDto(
    int Tipo,
    decimal Valor,
    DateTime Data,
    string Descricao);