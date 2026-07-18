using FluxoCaixa.Consolidado.Application;
using FluxoCaixa.Consolidado.Application.Dtos;
using FluxoCaixa.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FluxoCaixa.Consolidado.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "Comerciante")]
public sealed class ConsolidadoController : ControllerBase
{
    private readonly ConsolidadoService _service;
    private readonly ILogger<ConsolidadoController> _logger;

    public ConsolidadoController(ConsolidadoService service, ILogger<ConsolidadoController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtém o saldo consolidado diário para uma data específica.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ConsolidadoResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ObterSaldo(
        [FromQuery] DateTime data,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Consultando saldo consolidado para data: {Data}", data.ToString("yyyy-MM-dd"));

        var resultado = await _service.ObterSaldoDiarioAsync(data, cancellationToken);

        if (resultado.Falha)
            return NotFound(new { sucesso = false, mensagemErro = resultado.MensagemErro });

        return Ok(new { sucesso = true, dados = resultado.Dados });
    }
}
