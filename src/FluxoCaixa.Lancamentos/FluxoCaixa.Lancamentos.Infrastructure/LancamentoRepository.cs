using FluxoCaixa.Lancamentos.Domain;
using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class LancamentoRepository : ILancamentoRepository
{
    private readonly FluxoCaixaDbContext _context;

    public LancamentoRepository(FluxoCaixaDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Lancamento lancamento, CancellationToken cancellationToken = default)
    {
        await _context.Lancamentos.AddAsync(lancamento, cancellationToken);
    }

    public Task UpdateAsync(Lancamento lancamento, CancellationToken cancellationToken = default)
    {
        _context.Lancamentos.Update(lancamento);
        return Task.CompletedTask;
    }

    public async Task<Lancamento?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Lancamentos
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Lancamento>> GetByDateRangeAsync(DateTime data, CancellationToken cancellationToken = default)
    {
        return await _context.Lancamentos
            .AsNoTracking()
            .Where(l => l.Data == data.Date)
            .OrderByDescending(l => l.CriadoEm)
            .ToListAsync(cancellationToken);
    }

    public Task DeleteAsync(Lancamento lancamento, CancellationToken cancellationToken = default)
    {
        _context.Lancamentos.Remove(lancamento);
        return Task.CompletedTask;
    }
}
