namespace FluxoCaixa.Consolidado.Application;

public interface IProcessedMessageStore
{
    Task<bool> ExistsAsync(string messageId, CancellationToken cancellationToken = default);
    Task AddAsync(string messageId, CancellationToken cancellationToken = default);
}
