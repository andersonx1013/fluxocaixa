# Architecture Decision Records

Data da revisão: 18/07/2026.

## ADR-001 - Dois microsserviços por capacidade de negócio

**Status:** aceito.

**Decisão:** separar Controle de Lançamentos e Consolidado Diário, cada um com API, domínio e persistência próprios.

**Motivos:** o enunciado exige que a queda do consolidado não indisponibilize lançamentos; a separação permite deploy, capacidade e recuperação independentes.

**Trade-off:** maior custo operacional e consistência eventual em comparação com um monólito modular. Para o escopo pequeno, um monólito seria mais simples, mas não demonstraria tão claramente o isolamento solicitado.

## ADR-002 - Integração assíncrona com RabbitMQ

**Status:** aceito.

**Decisão:** publicar eventos `lancamento.criado`, `lancamento.atualizado` e `lancamento.excluido` em exchange topic durável.

**Motivos:** remove dependência síncrona do consolidado, absorve indisponibilidade e picos, e permite reprocessamento controlado.

**Trade-off:** o saldo não é imediatamente consistente. A API documenta esse comportamento e os testes fazem polling com timeout.

## ADR-003 - Transactional Outbox no serviço de lançamentos

**Status:** aceito e implementado.

**Decisão:** persistir o lançamento e `outbox_messages` no mesmo `DbContext`/commit. Um `BackgroundService` publica pendências com `MessageId` estável, mensagem persistente e publisher confirm.

**Motivos:** elimina a janela em que o lançamento era confirmado e a publicação falhava. A API permanece disponível mesmo sem RabbitMQ.

**Semântica:** entrega pelo menos uma vez. Se ocorrer falha após o broker confirmar e antes de marcar o Outbox, a mensagem pode ser repetida; a Inbox do consumidor torna a repetição segura.

**Trade-off:** polling de 500 ms adiciona pequena latência e a tabela precisa de política futura de retenção/limpeza.

## ADR-004 - Inbox idempotente, ack manual e DLQ

**Status:** aceito e implementado.

**Decisão:** salvar `processed_messages` e o consolidado no mesmo commit antes do `ACK`. Mensagens inválidas recebem `NACK` sem requeue e seguem para `fluxocaixa.consolidado.dlq`.

**Motivos:** impedir dupla contabilização e poison-message loop.

**Concorrência:** a fila usa `x-single-active-consumer`. Isso serializa alterações do agregado e permite failover para outra réplica sem permitir duas escritas concorrentes para o mesmo dia. A escala de leitura HTTP permanece independente.

**Trade-off:** o processamento de eventos escala por otimização/particionamento da fila, não apenas adicionando consumidores. Em volume muito maior, a evolução seria particionar por hash da data e usar update atômico/controle otimista.

## ADR-005 - Database per service

**Status:** aceito.

**Decisão:** PostgreSQL independente para lançamentos e consolidado. Nenhum serviço consulta tabelas do outro.

**Motivos:** autonomia, isolamento de falha e ausência de lock compartilhado entre domínios.

**Trade-off:** duplicação deliberada de dados e necessidade de eventos para sincronização.

## ADR-006 - Redis com cache-aside e fallback

**Status:** aceito e implementado.

**Decisão:** cachear `consolidado:{yyyy-MM-dd}` por cinco minutos e invalidar após eventos. Falhas Redis caem para consulta PostgreSQL.

**Motivos:** reduzir latência/carga nas leituras de pico sem tornar cache uma dependência obrigatória.

**Trade-off:** pode haver cache stampede após expiração. Evoluções possíveis: lock por chave, TTL com jitter e stale-while-revalidate.

## ADR-007 - JWT local com autorização por role

**Status:** aceito para a prova local.

**Decisão:** JWT HS256 validando assinatura, issuer, audience e expiração; endpoints exigem policy `Comerciante` e role `comerciante`. O token é gerado offline por `scripts/New-LocalJwt.ps1`.

**Motivos:** demonstra autenticação e autorização sem depender de cloud/Identity Provider.

**Trade-off:** chave simétrica compartilhada, sem refresh/revogação/rotação automática. Produção deve adotar OAuth2/OIDC, HTTPS e secret manager.

## ADR-008 - Inicialização de schema orientada à avaliação local

**Status:** aceito para a prova.

**Decisão:** usar `EnsureCreated` e DDL idempotente para adicionar Outbox/Inbox também em volumes criados por versões anteriores.

**Motivos:** permitir `docker compose up` em uma máquina de avaliação sem ferramenta adicional e sem apagar dados automaticamente.

**Trade-off:** não há histórico de migrations. Antes de produção, substituir por migrations EF Core versionadas e processo de rollback/backup.

## ADR-009 - Health checks separados por propósito

**Status:** aceito e implementado.

**Decisão:** `/health/live` verifica processo, `/health/ready` verifica o PostgreSQL obrigatório e `/health` detalha todas as dependências, inclusive RabbitMQ e Redis.

**Motivos:** uma dependência degradável não deve retirar a API de lançamentos do balanceador quando o Outbox ainda aceita trabalho, nem retirar o consolidado quando o fallback de cache atende leituras.

## Evoluções priorizadas

1. Migrations EF Core e testes de integração com Testcontainers.
2. OpenTelemetry, Prometheus/Grafana e alertas para idade/tamanho do Outbox, lag da fila e DLQ.
3. Retenção automática de Outbox/Inbox e ferramenta autenticada para replay da DLQ.
4. OAuth2/OIDC, HTTPS, rotação de segredo e rate limiting por cliente.
5. CI no GitHub Actions com build, testes, renderização dos diagramas e scan de dependências/imagens.
