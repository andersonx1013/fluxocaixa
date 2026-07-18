using System.Text.Json;
using FluxoCaixa.Lancamentos.Application;
using FluxoCaixa.Shared;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class OutboxEventWriter : IEventOutbox
{
    private readonly FluxoCaixaDbContext _context;

    public OutboxEventWriter(FluxoCaixaDbContext context)
    {
        _context = context;
    }

    public Task AdicionarLancamentoCriadoAsync(LancamentoCriadoEvent evento, CancellationToken cancellationToken = default)
        => AdicionarAsync("lancamento.criado", evento, cancellationToken);

    public Task AdicionarLancamentoExcluidoAsync(LancamentoExcluidoEvent evento, CancellationToken cancellationToken = default)
        => AdicionarAsync("lancamento.excluido", evento, cancellationToken);

    public Task AdicionarLancamentoAtualizadoAsync(LancamentoAtualizadoEvent evento, CancellationToken cancellationToken = default)
        => AdicionarAsync("lancamento.atualizado", evento, cancellationToken);

    private async Task AdicionarAsync<T>(string routingKey, T evento, CancellationToken cancellationToken)
    {
        var message = new OutboxMessage(routingKey, JsonSerializer.Serialize(evento));
        await _context.OutboxMessages.AddAsync(message, cancellationToken);
    }
}
