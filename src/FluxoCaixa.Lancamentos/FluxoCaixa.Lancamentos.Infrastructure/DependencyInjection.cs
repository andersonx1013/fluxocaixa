using FluxoCaixa.Lancamentos.Application;
using FluxoCaixa.Lancamentos.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddLancamentosInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("LancamentosDb")
            ?? throw new InvalidOperationException("Connection string 'LancamentosDb' não encontrada.");

        services.AddDbContext<FluxoCaixaDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            }));

        services.AddScoped<ILancamentoRepository, LancamentoRepository>();
        services.AddScoped<IEventOutbox, OutboxEventWriter>();
        services.AddScoped<IUnitOfWork, LancamentosUnitOfWork>();
        services.AddScoped<LancamentoService>();
        services.AddHostedService<OutboxPublisherService>();

        return services;
    }
}
