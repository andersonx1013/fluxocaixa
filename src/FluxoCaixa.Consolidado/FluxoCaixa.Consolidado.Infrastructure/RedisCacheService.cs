using System.Text.Json;
using FluxoCaixa.Consolidado.Application;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class RedisCacheService : ICacheService, IDisposable
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(string connectionString, ILogger<RedisCacheService> logger)
    {
        var options = ConfigurationOptions.Parse(connectionString);
        options.AbortOnConnectFail = false;
        options.ConnectRetry = 3;
        _redis = ConnectionMultiplexer.Connect(options);
        _logger = logger;
        _logger.LogInformation("Redis conectado com sucesso.");
    }

    public async Task<T?> GetOrSetAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var cachedValue = await db.StringGetAsync(key);
            if (cachedValue.HasValue)
            {
                _logger.LogDebug("Cache hit para chave: {Key}", key);
                return JsonSerializer.Deserialize<T>(cachedValue!);
            }

            _logger.LogDebug("Cache miss para chave: {Key}", key);
            var result = await factory();

            if (result is not null)
            {
                var serialized = JsonSerializer.Serialize(result);
                await db.StringSetAsync(key, serialized, expiration ?? TimeSpan.FromMinutes(5));
            }

            return result;
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis indisponível para a chave {Key}. Usando PostgreSQL sem cache.", key);
            return await factory();
        }
    }

    public async Task RemoverAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            await db.KeyDeleteAsync(key);
            _logger.LogDebug("Cache invalidado para chave: {Key}", key);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis indisponível ao invalidar a chave {Key}.", key);
        }
    }

    public void Dispose()
    {
        _redis?.Dispose();
    }
}
