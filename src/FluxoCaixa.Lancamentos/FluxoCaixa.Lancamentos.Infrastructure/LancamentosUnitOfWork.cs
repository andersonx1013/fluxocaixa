using FluxoCaixa.Lancamentos.Domain;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class LancamentosUnitOfWork : IUnitOfWork
{
    private readonly FluxoCaixaDbContext _context;

    public LancamentosUnitOfWork(FluxoCaixaDbContext context)
    {
        _context = context;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
