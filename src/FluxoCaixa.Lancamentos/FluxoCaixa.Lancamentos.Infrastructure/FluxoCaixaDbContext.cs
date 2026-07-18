using FluxoCaixa.Lancamentos.Domain;
using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class FluxoCaixaDbContext : DbContext
{
    public DbSet<Lancamento> Lancamentos => Set<Lancamento>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    public FluxoCaixaDbContext(DbContextOptions<FluxoCaixaDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Lancamento>(entity =>
        {
            entity.ToTable("lancamentos");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            entity.Property(e => e.Tipo)
                .HasColumnName("tipo")
                .HasConversion<int>()
                .IsRequired();

            entity.Property(e => e.Valor)
                .HasColumnName("valor")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(e => e.Data)
                .HasColumnName("data")
                .HasColumnType("date")
                .IsRequired();

            entity.Property(e => e.Descricao)
                .HasColumnName("descricao")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.CriadoEm)
                .HasColumnName("criado_em")
                .IsRequired();

            entity.HasIndex(e => e.Data)
                .HasDatabaseName("ix_lancamentos_data");
        });

        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("outbox_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedNever();
            entity.Property(e => e.OcorridoEmUtc).HasColumnName("ocorrido_em_utc").IsRequired();
            entity.Property(e => e.RoutingKey).HasColumnName("routing_key").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
            entity.Property(e => e.ProcessadoEmUtc).HasColumnName("processado_em_utc");
            entity.Property(e => e.Tentativas).HasColumnName("tentativas").IsRequired();
            entity.Property(e => e.UltimoErro).HasColumnName("ultimo_erro").HasMaxLength(1000);
            entity.HasIndex(e => new { e.ProcessadoEmUtc, e.OcorridoEmUtc })
                .HasDatabaseName("ix_outbox_pendentes");
        });
    }
}
