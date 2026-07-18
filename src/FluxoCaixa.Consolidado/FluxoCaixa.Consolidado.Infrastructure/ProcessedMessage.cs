namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class ProcessedMessage
{
    public string Id { get; private set; } = string.Empty;
    public DateTime ProcessadoEmUtc { get; private set; }

    private ProcessedMessage() { }

    public ProcessedMessage(string id)
    {
        Id = id;
        ProcessadoEmUtc = DateTime.UtcNow;
    }
}
