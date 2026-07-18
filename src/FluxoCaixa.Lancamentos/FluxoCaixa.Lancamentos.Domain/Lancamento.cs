using FluxoCaixa.Shared;

namespace FluxoCaixa.Lancamentos.Domain;

public sealed class Lancamento
{
    public Guid Id { get; private set; }
    public TipoLancamento Tipo { get; private set; }
    public decimal Valor { get; private set; }
    public DateTime Data { get; private set; }
    public string Descricao { get; private set; } = string.Empty;
    public DateTime CriadoEm { get; private set; }

    private Lancamento() { }

    public Lancamento(TipoLancamento tipo, decimal valor, DateTime data, string descricao)
    {
        Id = Guid.NewGuid();
        Tipo = tipo;
        Valor = valor;
        Data = data.Date;
        Descricao = descricao;
        CriadoEm = DateTime.UtcNow;
    }

    public void Atualizar(TipoLancamento tipo, decimal valor, DateTime data, string descricao)
    {
        Tipo = tipo;
        Valor = valor;
        Data = data.Date;
        Descricao = descricao;
    }
}
