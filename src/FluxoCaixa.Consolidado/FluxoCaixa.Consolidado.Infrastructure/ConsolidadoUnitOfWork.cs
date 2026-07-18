using FluxoCaixa.Consolidado.Domain;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class ConsolidadoUnitOfWork : IUnitOfWork
{
    private readonly FluxoCaixaConsolidadoDbContext _context;

    public ConsolidadoUnitOfWork(FluxoCaixaConsolidadoDbContext context)
    {
        _context = context;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
