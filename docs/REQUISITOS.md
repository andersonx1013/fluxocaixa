# Matriz de Rastreabilidade dos Requisitos

Revisão: 18/07/2026.

## Requisitos de negócio

| ID | Requisito | Implementação | Evidência |
|---|---|---|---|
| RN-01 | Controle de lançamentos | `LancamentosController` + `LancamentoService` + PostgreSQL | `Test-Smoke.ps1`, 13 testes unitários |
| RN-02 | Débitos e créditos | `TipoLancamento` e validações de valor/tipo | testes de criação e validação |
| RN-03 | Relatório diário consolidado | `ConsolidadoController` + `ConsolidadoDiario` | `Test-Smoke.ps1`, 10 testes unitários |
| RN-04 | Alterar lançamento | evento contém tipo/valor/data antigos e novos | teste unitário entre datas |
| RN-05 | Excluir lançamento | evento reverte o valor consolidado | testes unitários e cleanup dos scripts |

Fórmula: `SaldoFinal = SaldoInicial - TotalDebitos + TotalCreditos`.

## Requisitos técnicos obrigatórios

| Requisito | Status | Evidência no repositório |
|---|---|---|
| Desenho da solução | Atendido | C4 níveis 1, 2, 3 e 4 + fluxo de resiliência em `docs/diagrams` |
| C# | Atendido | .NET 8 em toda a solução de aplicação |
| Testes | Atendido | 23 testes unitários + 4 scripts de teste operacional |
| Boas práticas | Atendido | Clean Architecture, SOLID, Repository, Unit of Work, Outbox, Inbox, cache-aside, DI |
| README claro | Atendido | início rápido, JWT local, endpoints, testes e troubleshooting |
| Documentação no repositório | Atendido | README, ADR, matriz, relatório e fontes/PNGs dos diagramas |
| Repositório público GitHub | Ação externa pendente | o código local está pronto; falta configurar a URL pública da conta do candidato e fazer push |

O último item não pode ser concluído apenas em `localhost`, pois depende da conta GitHub do candidato.

## Requisitos não funcionais

| ID | Meta | Estratégia | Validação |
|---|---|---|---|
| RNF-01 | Lançamentos disponíveis com consolidado fora | integração somente por Outbox/RabbitMQ; nenhuma chamada síncrona | `Test-Resilience.ps1`: aprovado, 0% de perda |
| RNF-02 | 50 req/s no consolidado | API stateless, Redis, índice/PK por data, leitura `AsNoTracking` | `Test-Load.ps1`: 500/500, 49,86 req/s, 0% de perda |
| RNF-03 | no máximo 5% de perda | cache + fila durável + idempotência | perda medida: 0% no ambiente local |
| RNF-04 | tolerar queda do broker | Transactional Outbox e reconexão em background | `Test-Outbox.ps1` |
| RNF-05 | evitar duplicidade | Inbox transacional por `MessageId` | teste `MensagemDuplicada_NaoDeveAlterarSaldo` |
| RNF-06 | evitar mensagem venenosa | ack manual e DLQ | topologia RabbitMQ e inspeção da fila |
| RNF-07 | cache não obrigatório | fallback Redis -> PostgreSQL | implementação `RedisCacheService` |
| RNF-08 | autenticação/autorização | JWT + policy/role `comerciante` | endpoints retornam 401/403 sem credencial/permissão válida |

## Cenários de falha

| Falha | Comportamento esperado | Limite consciente |
|---|---|---|
| API Consolidado parada | lançamento retorna `201`; fila retém evento; saldo converge após retorno | leitura do consolidado fica indisponível durante a queda |
| RabbitMQ parado | lançamento retorna `201`; evento fica pendente no Outbox | consolidação pausa até o broker voltar |
| Redis parado | consolidado consulta PostgreSQL | maior latência/carga no banco |
| PostgreSQL de Consolidado parado | lançamentos continuam; eventos permanecem sem ack ou vão para DLQ após falha de processamento | relatório fica indisponível |
| PostgreSQL de Lançamentos parado | readiness falha e não é possível aceitar lançamento com segurança | banco é dependência obrigatória do write path |
| Mensagem duplicada | Inbox ignora sem alterar totais | retenção da Inbox deve ser gerenciada em produção |
| Mensagem inválida | `NACK` sem requeue e envio para DLQ | replay é operacional/manual nesta prova |

## Critérios de segurança

- Validação de assinatura HS256, issuer, audience, lifetime e signing key.
- Autorização por policy `Comerciante`.
- DTOs não expõem entidades EF diretamente.
- Consultas LINQ/EF Core parametrizadas.
- Erros internos não retornam stack trace ao cliente.
- Segredo default é apenas local e substituível por `JWT_SECRET_KEY`.
- Produção ainda exige HTTPS, OAuth2/OIDC, secret manager, rate limit e auditoria.

## Métricas recomendadas para produção

- disponibilidade mensal por API;
- p50/p95/p99 e taxa de erro por rota;
- idade e quantidade de mensagens pendentes no Outbox;
- profundidade/lag da fila e quantidade na DLQ;
- cache hit ratio e latência Redis/PostgreSQL;
- tempo de convergência entre lançamento e consolidado;
- conflitos/duplicidades detectados pela Inbox.
