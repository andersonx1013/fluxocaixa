using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace FluxoCaixa.Lancamentos.Infrastructure;

public sealed class OutboxPublisherService : BackgroundService
{
    private const string ExchangeName = "fluxocaixa.lancamentos";
    private const string QueueName = "fluxocaixa.consolidado.v2";
    private const string DeadLetterExchangeName = "fluxocaixa.lancamentos.dlx";
    private const string DeadLetterQueueName = "fluxocaixa.consolidado.dlq";
    private static readonly TimeSpan PollingInterval = TimeSpan.FromMilliseconds(500);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OutboxPublisherService> _logger;

    public OutboxPublisherService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<OutboxPublisherService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var publicou = await PublicarLoteAsync(stoppingToken);
                if (!publicou)
                    await Task.Delay(PollingInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha no processamento do Outbox. Uma nova tentativa será feita.");
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }

    private async Task<bool> PublicarLoteAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<FluxoCaixaDbContext>();
        var messages = await context.OutboxMessages
            .Where(message => message.ProcessadoEmUtc == null)
            .OrderBy(message => message.OcorridoEmUtc)
            .Take(100)
            .ToListAsync(cancellationToken);

        if (messages.Count == 0)
            return false;

        try
        {
            var factory = CriarConnectionFactory();
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();
            DeclararTopologia(channel);
            channel.ConfirmSelect();

            foreach (var message in messages)
            {
                var properties = channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.ContentType = "application/json";
                properties.MessageId = message.Id.ToString();

                channel.BasicPublish(
                    exchange: ExchangeName,
                    routingKey: message.RoutingKey,
                    mandatory: true,
                    basicProperties: properties,
                    body: Encoding.UTF8.GetBytes(message.Payload));

                channel.WaitForConfirmsOrDie(TimeSpan.FromSeconds(5));
                message.MarcarComoProcessado();
                await context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Evento do Outbox publicado. MessageId: {MessageId}, RoutingKey: {RoutingKey}",
                    message.Id,
                    message.RoutingKey);
            }
        }
        catch (Exception ex)
        {
            foreach (var message in messages.Where(message => message.ProcessadoEmUtc == null))
                message.RegistrarFalha(ex);

            await context.SaveChangesAsync(cancellationToken);
            throw;
        }

        return true;
    }

    private ConnectionFactory CriarConnectionFactory()
    {
        return new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
            Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
            UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest",
            AutomaticRecoveryEnabled = true
        };
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
