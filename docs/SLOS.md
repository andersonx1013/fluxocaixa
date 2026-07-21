# SLOs, Capacidade e Recuperação

Revisão: 18/07/2026.

Este documento define metas para uma implantação de produção. O Compose local reproduz os fluxos funcionais e os cenários de falha da prova, mas não simula múltiplas zonas, réplicas de banco ou um provedor de identidade.

## O que é dinâmico

| Informação | Atualização | Evidência |
|---|---|---|
| Saúde atual dos processos | dinâmica, a cada consulta | `/health/live` |
| Prontidão do PostgreSQL obrigatório | dinâmica, a cada consulta | `/health/ready` |
| Estado detalhado de PostgreSQL, RabbitMQ e Redis | dinâmico, a cada consulta | `/health` |
| Resultado dos testes de fluxo, falha e carga | dinâmico durante cada execução | `Test-Smoke.ps1`, `Test-Resilience.ps1`, `Test-Outbox.ps1` e `Test-Load.ps1` |
| Vulnerabilidades NuGet conhecidas | dinâmicas durante a auditoria | `Test-Dependencies.ps1` consulta as fontes configuradas |
| SLO mensal, p95/p99 histórico e error budget | meta documentada, sem coleta contínua local | requer plataforma de métricas da arquitetura-alvo |
| Alertas, RTO e RPO | objetivos documentados, não alarmes ativos no Compose | exigem monitoramento, réplicas, backups e ensaios de recuperação em produção |

Portanto, o ambiente local mostra saúde e resultados de teste em tempo real, mas não simula um mês de SLO nem mantém dashboards e alertas ativos. Essa separação evita apresentar metas arquiteturais como funcionalidades já implementadas.

## Indicadores e objetivos

| SLI | SLO de produção | Como medir |
|---|---:|---|
| Disponibilidade da API de lançamentos | >= 99,9% ao mês | respostas válidas / total de requisições, excluindo `4xx` do cliente |
| Disponibilidade da API de consolidado | >= 99,9% ao mês | respostas válidas / total de requisições, excluindo `4xx` do cliente |
| Sucesso do consolidado a 50 req/s | >= 95% | requisições `2xx` / requisições enviadas em janela mínima de 10 s |
| Latência de lançamentos | p95 <= 300 ms; p99 <= 800 ms | histograma HTTP no ponto de entrada |
| Latência do consolidado em cache | p95 <= 200 ms; p99 <= 500 ms | histograma HTTP separado por cache hit/miss |
| Convergência lançamento -> consolidado | p95 <= 5 s; p99 <= 30 s | diferença entre `OccurredOnUtc` e processamento da Inbox |
| Perda de eventos confirmados | 0 | reconciliação Outbox, fila e Inbox por `MessageId` |

Uma disponibilidade mensal de 99,9% permite aproximadamente 43 minutos e 49 segundos de indisponibilidade em 30 dias. Alertas usam consumo rápido e lento do error budget para evitar que uma média mensal esconda uma falha em andamento.

## RTO e RPO

| Falha | RTO alvo | RPO alvo | Estratégia da arquitetura-alvo |
|---|---:|---:|---|
| Réplica de API | <= 60 s | 0 | balanceador remove instância sem readiness e mantém outra réplica ativa |
| PostgreSQL de lançamentos | <= 5 min | 0 para falha de uma instância | primária + standby síncrona, failover e backups com PITR |
| PostgreSQL de consolidado | <= 15 min | <= 5 min em desastre | standby, backup/PITR e reconciliação a partir dos lançamentos |
| RabbitMQ | <= 5 min | 0 para mensagem confirmada | três nós, quorum queue, publisher confirms e DLQ |
| Redis | <= 5 min | não aplicável | cache reconstruível; leitura faz fallback para PostgreSQL |
| Perda total da região | <= 60 min | <= 5 min | backups fora da região e runbook de restauração validado |

## Alertas proativos

| Sinal | Alerta | Crítico | Ação inicial |
|---|---:|---:|---|
| Requisições sem sucesso no consolidado | > 1% por 5 min | > 5% por 2 min | verificar saturação, banco, Redis e readiness |
| Idade do evento mais antigo no Outbox | > 30 s | > 2 min | verificar publisher e RabbitMQ |
| Lag da fila de consolidação | > 30 s | > 5 min | escalar consumidor e investigar mensagens lentas |
| Mensagens na DLQ | primeira mensagem | crescimento contínuo | bloquear descarte, diagnosticar e executar replay controlado |
| Latência HTTP p95 acima do SLO | 5 min | 15 min | analisar cache hit, pool de conexões e recursos |
| Uso de CPU das APIs | > 65% por 10 min | > 85% por 5 min | escalar horizontalmente e investigar regressão |
| Conexões de banco utilizadas | > 70% | > 85% | revisar pool, consultas e capacidade do banco |

Os painéis devem exibir taxa, erros e duração por rota, uso de recursos, cache hit ratio, idade/tamanho do Outbox, lag da fila, redeliveries, DLQ e tempo de convergência. Logs, métricas e traces compartilham `TraceId`, `MessageId` e identificador do lançamento.

## Escalabilidade e capacidade

- APIs executam com no mínimo duas réplicas e permanecem stateless; o balanceador distribui HTTP apenas para instâncias prontas.
- A API de consolidado escala as leituras horizontalmente. `x-single-active-consumer` mantém uma única escrita ordenada por fila e realiza failover para outra réplica.
- O autoscaling inicia acima de 65% de CPU por 10 minutos ou quando p95 excede o SLO; scale-in exige 20 minutos estáveis.
- RabbitMQ usa três nós e quorum queue. Redis usa primária, réplica e failover. Cada PostgreSQL usa primária, standby e backup com restauração testada.
- A aceitação mínima reproduz 50 req/s e perda <= 5%. Antes de produção, o teste deve durar pelo menos 30 minutos e validar 2x a carga esperada para margem de crescimento.

## Segurança da arquitetura-alvo

- TLS 1.2 ou superior em tráfego externo e interno sensível; criptografia em repouso para bancos, backups e volumes.
- OAuth2/OIDC com tokens curtos, roles de menor privilégio e rotação automática de chaves; o JWT HS256 local existe apenas para avaliação offline.
- Segredos ficam fora da imagem e do repositório, fornecidos por secret manager e identidades de workload.
- Gateway aplica rate limit por cliente, limite de payload, timeout, validação de cabeçalhos e proteção WAF quando exposto à internet.
- Redes separam entrada, aplicação e dados; bancos, broker, cache e telemetria não possuem endpoints públicos.
- Dependências e imagens passam por scan; acessos administrativos e replay da DLQ geram trilha de auditoria.

## Evidência local e limites

O script `Test-Load.ps1` programa 50 req/s por 10 segundos e reprova perda acima de 5%. `Test-Resilience.ps1` valida a independência do serviço de lançamentos, e `Test-Outbox.ps1` valida a recuperação quando o broker retorna. Os resultados medidos estão em `docs/relatorio-teste-carga-2026-07-18.md`.

Essas evidências não substituem teste prolongado no hardware alvo, chaos testing, restauração real de backup nem validação de failover entre zonas.
