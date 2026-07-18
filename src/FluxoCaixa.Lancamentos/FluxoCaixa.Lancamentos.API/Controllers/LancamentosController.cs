using System.Text.Json;
using FluxoCaixa.Lancamentos.Application;
using FluxoCaixa.Lancamentos.Application.Dtos;
using FluxoCaixa.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FluxoCaixa.Lancamentos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Comerciante")]
public sealed class LancamentosController : ControllerBase
{
    private readonly LancamentoService _service;
    private readonly ILogger<LancamentosController> _logger;

    public LancamentosController(LancamentoService service, ILogger<LancamentosController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Cria um novo lançamento (débito ou crédito).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(LancamentoResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Criar(
        [FromBody] CriarLancamentoDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Recebendo requisição para criar lançamento: {@Dto}", dto);

        var resultado = await _service.RegistrarAsync(dto, cancellationToken);

        if (resultado.Falha)
            return BadRequest(new { sucesso = false, mensagemErro = resultado.MensagemErro });

        return CreatedAtAction(nameof(ObterPorId), new { id = resultado.Dados!.Id }, resultado.Dados);
    }

    /// <summary>
    /// Obtém lançamentos por data.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<LancamentoResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObterPorData(
        [FromQuery] DateTime data,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando lançamentos para data: {Data}", data.ToString("yyyy-MM-dd"));

        var resultado = await _service.ObterPorDataAsync(data, cancellationToken);

        return Ok(new { sucesso = true, dados = resultado.Dados });
    }

    /// <summary>
    /// Obtém um lançamento por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(LancamentoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObterPorId(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando lançamento: {Id}", id);

        var resultado = await _service.ObterPorIdAsync(id, cancellationToken);

        if (resultado.Falha)
            return NotFound(new { sucesso = false, mensagemErro = resultado.MensagemErro });

        return Ok(new { sucesso = true, dados = resultado.Dados });
    }

    /// <summary>
    /// Atualiza um lançamento existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(LancamentoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Atualizar(
        Guid id,
        [FromBody] AtualizarLancamentoDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Atualizando lançamento {Id}: {@Dto}", id, dto);

        var resultado = await _service.AtualizarAsync(id, dto, cancellationToken);

        if (resultado.Falha)
        {
            if (resultado.MensagemErro == MensagensErro.LancamentoNaoEncontrado)
                return NotFound(new { sucesso = false, mensagemErro = resultado.MensagemErro });

            return BadRequest(new { sucesso = false, mensagemErro = resultado.MensagemErro });
        }

        return Ok(new { sucesso = true, dados = resultado.Dados });
    }

    /// <summary>
    /// Exclui um lançamento.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Excluir(
        Guid id,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Excluindo lançamento: {Id}", id);

        var resultado = await _service.ExcluirAsync(id, cancellationToken);

        if (resultado.Falha)
            return NotFound(new { sucesso = false, mensagemErro = resultado.MensagemErro });

        return NoContent();
    }
}
