namespace FluxoCaixa.Consolidado.Domain;

public sealed class ConsolidadoDiario
{
    public DateTime Data { get; private set; }
    public decimal SaldoInicial { get; private set; }
    public decimal TotalDebitos { get; private set; }
    public decimal TotalCreditos { get; private set; }
    public decimal SaldoFinal { get; private set; }
    public DateTime UltimaAtualizacao { get; private set; }

    private ConsolidadoDiario() { }

    public ConsolidadoDiario(DateTime data, decimal saldoInicial)
    {
        Data = data.Date;
        SaldoInicial = saldoInicial;
        TotalDebitos = 0;
        TotalCreditos = 0;
        SaldoFinal = saldoInicial;
        UltimaAtualizacao = DateTime.UtcNow;
    }

    public void AdicionarDebito(decimal valor)
    {
        TotalDebitos += valor;
        RecalcularSaldo();
    }

    public void RemoverDebito(decimal valor)
    {
        TotalDebitos -= valor;
        if (TotalDebitos < 0) TotalDebitos = 0;
        RecalcularSaldo();
    }

    public void AdicionarCredito(decimal valor)
    {
        TotalCreditos += valor;
        RecalcularSaldo();
    }

    public void RemoverCredito(decimal valor)
    {
        TotalCreditos -= valor;
        if (TotalCreditos < 0) TotalCreditos = 0;
        RecalcularSaldo();
    }

    private void RecalcularSaldo()
    {
        SaldoFinal = SaldoInicial - TotalDebitos + TotalCreditos;
        UltimaAtualizacao = DateTime.UtcNow;
    }
}