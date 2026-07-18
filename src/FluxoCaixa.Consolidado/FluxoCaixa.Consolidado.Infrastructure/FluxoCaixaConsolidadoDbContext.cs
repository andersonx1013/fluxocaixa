using FluxoCaixa.Consolidado.Domain;
using Microsoft.EntityFrameworkCore;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class FluxoCaixaConsolidadoDbContext : DbContext
{
    public DbSet<ConsolidadoDiario> Consolidados => Set<ConsolidadoDiario>();
    public DbSet<ProcessedMessage> ProcessedMessages => Set<ProcessedMessage>();

    public FluxoCaixaConsolidadoDbContext(DbContextOptions<FluxoCaixaConsolidadoDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConsolidadoDiario>(entity =>
        {
            entity.ToTable("consolidados_diarios");

            entity.HasKey(e => e.Data);

            entity.Property(e => e.Data)
                .HasColumnName("data")
                .HasColumnType("date")
                .ValueGeneratedNever();

            entity.Property(e => e.SaldoInicial)
                .HasColumnName("saldo_inicial")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(e => e.TotalDebitos)
                .HasColumnName("total_debitos")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(e => e.TotalCreditos)
                .HasColumnName("total_creditos")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(e => e.SaldoFinal)
                .HasColumnName("saldo_final")
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(e => e.UltimaAtualizacao)
                .HasColumnName("ultima_atualizacao")
                .IsRequired();
        });

        modelBuilder.Entity<ProcessedMessage>(entity =>
        {
            entity.ToTable("processed_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasMaxLength(128);
            entity.Property(e => e.ProcessadoEmUtc).HasColumnName("processado_em_utc").IsRequired();
        });
    }
}
