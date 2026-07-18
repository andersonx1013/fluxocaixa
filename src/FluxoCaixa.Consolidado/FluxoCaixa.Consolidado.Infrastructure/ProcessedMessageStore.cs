using FluxoCaixa.Consolidado.Application;
using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class ProcessedMessageStore : IProcessedMessageStore
{
    private readonly FluxoCaixaConsolidadoDbContext _context;

    public ProcessedMessageStore(FluxoCaixaConsolidadoDbContext context)
    {
        _context = context;
    }

    public Task<bool> ExistsAsync(string messageId, CancellationToken cancellationToken = default)
    {
        return _context.ProcessedMessages.AnyAsync(message => message.Id == messageId, cancellationToken);
    }

    public async Task AddAsync(string messageId, CancellationToken cancellationToken = default)
    {
        await _context.ProcessedMessages.AddAsync(new ProcessedMessage(messageId), cancellationToken);
    }
}
