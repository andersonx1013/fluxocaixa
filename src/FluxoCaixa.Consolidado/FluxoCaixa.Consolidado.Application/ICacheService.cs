namespace FluxoCaixa.Consolidado.Application;

public interface ICacheService
{
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoverAsync(string key, CancellationToken cancellationToken = default);
}