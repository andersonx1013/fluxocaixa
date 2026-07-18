namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class OutboxMessage
{
    public Guid Id { get; private set; }
    public DateTime OcorridoEmUtc { get; private set; }
    public string RoutingKey { get; private set; } = string.Empty;
    public string Payload { get; private set; } = string.Empty;
    public DateTime? ProcessadoEmUtc { get; private set; }
    public int Tentativas { get; private set; }
    public string? UltimoErro { get; private set; }

    private OutboxMessage() { }

    public OutboxMessage(string routingKey, string payload)
    {
        Id = Guid.NewGuid();
        OcorridoEmUtc = DateTime.UtcNow;
        RoutingKey = routingKey;
        Payload = payload;
    }

    public void MarcarComoProcessado()
    {
        ProcessadoEmUtc = DateTime.UtcNow;
        UltimoErro = null;
    }

    public void RegistrarFalha(Exception exception)
    {
        Tentativas++;
        UltimoErro = exception.Message.Length <= 1000
            ? exception.Message
            : exception.Message[..1000];
    }
}
