using FluxoCaixa.Shared;

namespace FluxoCaixa.Lancamentos.Application;

public interface IEventOutbox
{
    Task AdicionarLancamentoCriadoAsync(LancamentoCriadoEvent evento, CancellationToken cancellationToken = default);
    Task AdicionarLancamentoExcluidoAsync(LancamentoExcluidoEvent evento, CancellationToken cancellationToken = default);
    Task AdicionarLancamentoAtualizadoAsync(LancamentoAtualizadoEvent evento, CancellationToken cancellationToken = default);
}
