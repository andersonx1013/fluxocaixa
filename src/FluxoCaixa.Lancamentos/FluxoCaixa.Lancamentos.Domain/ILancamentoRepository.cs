namespace FluxoCaixa.Lancamentos.Domain;

public interface ILancamentoRepository
{
    Task AddAsync(Lancamento lancamento, CancellationToken cancellationToken = default);
    Task UpdateAsync(Lancamento lancamento, CancellationToken cancellationToken = default);
    Task<Lancamento?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Lancamento>> GetByDateRangeAsync(DateTime data, CancellationToken cancellationToken = default);
    Task DeleteAsync(Lancamento lancamento, CancellationToken cancellationToken = default);
}