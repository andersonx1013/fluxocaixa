using FluxoCaixa.Consolidado.Application;
using FluxoCaixa.Consolidado.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FluxoCaixa.Consolidado.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddConsolidadoInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ConsolidadoDb")
            ?? throw new InvalidOperationException("Connection string 'ConsolidadoDb' não encontrada.");

        services.AddDbContext<FluxoCaixaConsolidadoDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            }));

        services.AddScoped<IConsolidadoRepository, ConsolidadoRepository>();
        services.AddScoped<IProcessedMessageStore, ProcessedMessageStore>();
        services.AddScoped<IUnitOfWork, ConsolidadoUnitOfWork>();

        var redisConnectionString = configuration.GetConnectionString("Redis")
            ?? "localhost:6379";

        services.AddSingleton<ICacheService>(sp =>
        {
            var logger = sp.GetRequiredService<Microsoft.Extensions.Logging.ILogger<RedisCacheService>>();
            return new RedisCacheService(redisConnectionString, logger);
        });

        services.AddScoped<ConsolidadoService>();
        services.AddHostedService<RabbitMQEventConsumer>();

        return services;
    }
}
