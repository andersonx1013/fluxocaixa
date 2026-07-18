using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Consolidado.Infrastructure;

public static class ConsolidadoDatabaseInitializer
{
    public static async Task InitializeAsync(
        FluxoCaixaConsolidadoDbContext context,
        CancellationToken cancellationToken = default)
    {
        await context.Database.EnsureCreatedAsync(cancellationToken);

        // EnsureCreated does not add new tables to a database created by an older build.
        await context.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS processed_messages (
                id varchar(128) PRIMARY KEY,
                processado_em_utc timestamp with time zone NOT NULL
            );
            """,
            cancellationToken);
    }
}
