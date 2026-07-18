namespace FluxoCaixa.Consolidado.Domain;

public interface IConsolidadoRepository
{
    Task<ConsolidadoDiario?> GetByDataAsync(DateTime data, CancellationToken cancellationToken = default);
    Task UpsertAsync(ConsolidadoDiario consolidado, CancellationToken cancellationToken = default);
}