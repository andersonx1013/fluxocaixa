namespace FluxoCaixa.Shared;

public class Resultado<T>
{
    public bool Sucesso { get; }
    public T? Dados { get; }
    public string? MensagemErro { get; }
    public bool Falha => !Sucesso;

    private Resultado(bool sucesso, T? dados, string? mensagemErro)
    {
        Sucesso = sucesso;
        Dados = dados;
        MensagemErro = mensagemErro;
    }

    public static Resultado<T> Ok(T dados) => new(true, dados, null);
    public static Resultado<T> Falhar(string mensagemErro) => new(false, default, mensagemErro);
}

public class Resultado
{
    public bool Sucesso { get; }
    public string? MensagemErro { get; }
    public bool Falha => !Sucesso;

    private Resultado(bool sucesso, string? mensagemErro)
    {
        Sucesso = sucesso;
        MensagemErro = mensagemErro;
    }

    public static Resultado Ok() => new(true, null);
    public static Resultado Falhar(string mensagemErro) => new(false, mensagemErro);
}