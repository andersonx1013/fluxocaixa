using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public static class LancamentosDatabaseInitializer
{
    public static async Task InitializeAsync(
        FluxoCaixaDbContext context,
        CancellationToken cancellationToken = default)
    {
        await context.Database.EnsureCreatedAsync(cancellationToken);

        // EnsureCreated does not add new tables to a database created by an older build.
        await context.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS outbox_messages (
                id uuid PRIMARY KEY,
                ocorrido_em_utc timestamp with time zone NOT NULL,
                routing_key varchar(100) NOT NULL,
                payload jsonb NOT NULL,
                processado_em_utc timestamp with time zone NULL,
                tentativas integer NOT NULL DEFAULT 0,
                ultimo_erro varchar(1000) NULL
            );
            CREATE INDEX IF NOT EXISTS ix_outbox_pendentes
                ON outbox_messages (processado_em_utc, ocorrido_em_utc);
            """,
            cancellationToken);
    }
}
