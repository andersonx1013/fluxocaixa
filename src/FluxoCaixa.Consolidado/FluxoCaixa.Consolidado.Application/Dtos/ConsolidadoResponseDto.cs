namespace FluxoCaixa.Consolidado.Application.Dtos;

public sealed record ConsolidadoResponseDto(
    DateTime Data,
    decimal SaldoInicial,
    decimal TotalDebitos,
    decimal TotalCreditos,
    decimal SaldoFinal,
    DateTime UltimaAtualizacao);