namespace FluxoCaixa.Lancamentos.Application.Dtos;

public sealed record LancamentoResponseDto(
    Guid Id,
    string Tipo,
    decimal Valor,
    DateTime Data,
    string Descricao,
    DateTime CriadoEm);