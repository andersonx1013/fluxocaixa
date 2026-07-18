using FluxoCaixa.Consolidado.Domain;
using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class ConsolidadoRepository : IConsolidadoRepository
{
    private readonly FluxoCaixaConsolidadoDbContext _context;

    public ConsolidadoRepository(FluxoCaixaConsolidadoDbContext context)
    {
        _context = context;
    }

    public async Task<ConsolidadoDiario?> GetByDataAsync(DateTime data, CancellationToken cancellationToken = default)
    {
        return await _context.Consolidados
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Data == data.Date, cancellationToken);
    }

    public async Task UpsertAsync(ConsolidadoDiario consolidado, CancellationToken cancellationToken = default)
    {
        var existente = await _context.Consolidados
            .FirstOrDefaultAsync(c => c.Data == consolidado.Data, cancellationToken);

        if (existente is null)
        {
            await _context.Consolidados.AddAsync(consolidado, cancellationToken);
        }
        else
        {
            _context.Entry(existente).CurrentValues.SetValues(consolidado);
        }
    }
}
