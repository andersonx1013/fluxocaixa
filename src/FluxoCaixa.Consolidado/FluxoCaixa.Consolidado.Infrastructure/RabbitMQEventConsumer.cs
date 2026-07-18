using System.Text;
using System.Text.Json;
using FluxoCaixa.Consolidado.Application;
using FluxoCaixa.Shared;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace FluxoCaixa.Consolidado.Infrastructure;

public sealed class RabbitMQEventConsumer : BackgroundService
{
    private const string ExchangeName = "fluxocaixa.lancamentos";
    private const string QueueName = "fluxocaixa.consolidado.v2";
    private const string DeadLetterExchangeName = "fluxocaixa.lancamentos.dlx";
    private const string DeadLetterQueueName = "fluxocaixa.consolidado.dlq";

    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RabbitMQEventConsumer> _logger;

    public RabbitMQEventConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory,
        ILogger<RabbitMQEventConsumer> logger)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConsumirAteDesconectarAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Consumidor RabbitMQ indisponível. Reconectando em 5 segundos.");
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task ConsumirAteDesconectarAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
            Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
            UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest",
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true
        };

        using var connection = factory.CreateConnection();
        using var channel = connection.CreateModel();
        DeclararTopologia(channel);
        channel.BasicQos(0, 10, false);

        var disconnected = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        connection.ConnectionShutdown += (_, _) => disconnected.TrySetResult(true);
        channel.CallbackException += (_, args) => disconnected.TrySetException(args.Exception);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.Received += async (_, delivery) =>
        {
            try
            {
                await ProcessarMensagemAsync(delivery, stoppingToken);
                channel.BasicAck(delivery.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Falha ao processar evento. MessageId: {MessageId}. Mensagem enviada para a DLQ.",
                    delivery.BasicProperties.MessageId);
                channel.BasicNack(delivery.DeliveryTag, multiple: false, requeue: false);
            }
        };

        channel.BasicConsume(QueueName, autoAck: false, consumer);
        _logger.LogInformation("Consumidor RabbitMQ ativo. Queue: {Queue}", QueueName);

        using var registration = stoppingToken.Register(() => disconnected.TrySetCanceled(stoppingToken));
        await disconnected.Task;
    }

    private async Task ProcessarMensagemAsync(BasicDeliverEventArgs delivery, CancellationToken cancellationToken)
    {
        var messageId = delivery.BasicProperties.MessageId;
        if (string.IsNullOrWhiteSpace(messageId))
            throw new InvalidOperationException("Mensagem recebida sem MessageId.");

        var json = Encoding.UTF8.GetString(delivery.Body.ToArray());
        using var scope = _scopeFactory.CreateScope();
        var service = scope.ServiceProvider.GetRequiredService<ConsolidadoService>();

        switch (delivery.RoutingKey)
        {
            case "lancamento.criado":
                var criado = JsonSerializer.Deserialize<LancamentoCriadoEvent>(json)
                    ?? throw new JsonException("Evento de criação inválido.");
                await service.ProcessarLancamentoCriadoAsync(messageId, criado, cancellationToken);
                break;

            case "lancamento.excluido":
                var excluido = JsonSerializer.Deserialize<LancamentoExcluidoEvent>(json)
                    ?? throw new JsonException("Evento de exclusão inválido.");
                await service.ProcessarLancamentoExcluidoAsync(messageId, excluido, cancellationToken);
                break;

            case "lancamento.atualizado":
                var atualizado = JsonSerializer.Deserialize<LancamentoAtualizadoEvent>(json)
                    ?? throw new JsonException("Evento de atualização inválido.");
                await service.ProcessarLancamentoAtualizadoAsync(messageId, atualizado, cancellationToken);
                break;

            default:
                throw new InvalidOperationException($"Routing key não suportada: {delivery.RoutingKey}");
        }
    }

    private static void DeclararTopologia(IModel channel)
    {
        channel.ExchangeDeclare(ExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);
        channel.ExchangeDeclare(DeadLetterExchangeName, ExchangeType.Topic, durable: true, autoDelete: false);

        channel.QueueDeclare(
            QueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: new Dictionary<string, object>
            {
                ["x-dead-letter-exchange"] = DeadLetterExchangeName,
                ["x-single-active-consumer"] = true
            });

        channel.QueueBind(QueueName, ExchangeName, "lancamento.*");
        channel.QueueDeclare(DeadLetterQueueName, durable: true, exclusive: false, autoDelete: false);
        channel.QueueBind(DeadLetterQueueName, DeadLetterExchangeName, "#");
    }
}
