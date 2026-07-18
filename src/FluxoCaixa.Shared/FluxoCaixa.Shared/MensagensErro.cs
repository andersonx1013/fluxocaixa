namespace FluxoCaixa.Shared;

public static class MensagensErro
{
    public const string ValorDeveSerMaiorQueZero = "O valor do lançamento deve ser maior que zero.";
    public const string TipoLancamentoInvalido = "O tipo de lançamento informado é inválido. Use 1 para Débito ou 2 para Crédito.";
    public const string DescricaoObrigatoria = "A descrição do lançamento é obrigatória.";
    public const string DescricaoTamanhoMaximo = "A descrição do lançamento deve ter no máximo 200 caracteres.";
    public const string DataObrigatoria = "A data do lançamento é obrigatória.";
    public const string LancamentoNaoEncontrado = "Lançamento não encontrado.";
    public const string ConsolidadoNaoEncontrado = "Consolidado diário não encontrado para a data informada.";
    public const string ErroInternoServidor = "Ocorreu um erro interno no servidor. Tente novamente mais tarde.";
    public const string ErroAoPublicarEvento = "Erro ao publicar evento de integração.";
    public const string ErroAoConsumirEvento = "Erro ao consumir evento de integração.";
}