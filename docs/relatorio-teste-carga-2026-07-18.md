# Relatório de Validação Local

Data: 18/07/2026

Ambiente: Windows, Docker Desktop, APIs .NET 8 em containers

Escopo: evidência reproduzível para a prova, não certificação de produção.

## Resultado resumido

| Cenário | Resultado |
|---|---:|
| Testes unitários | 23/23 aprovados |
| Auditoria NuGet | 0 pacotes vulneráveis conhecidos |
| Smoke CRUD/consolidado | aprovado |
| API Consolidado parada | lançamento aceito e 0% de perda após retorno |
| RabbitMQ parado | lançamento aceito no Outbox e convergência após retorno |
| Carga no GET consolidado | 500/500 sucessos |
| Taxa programada | 50 req/s durante 10 s |
| Vazão observada | 49,99 req/s |
| Perda observada | 0% (limite: 5%) |

## Comandos

```powershell
docker compose up -d --build
dotnet test FluxoCaixa.sln --configuration Release
.\scripts\Test-Dependencies.ps1
.\scripts\Test-Smoke.ps1
.\scripts\Test-Resilience.ps1
.\scripts\Test-Outbox.ps1
.\scripts\Test-Load.ps1 -RequestsPerSecond 50 -DurationSeconds 10
```

## Evidência de resiliência do consolidado

O script parou `api-consolidado`, criou e consultou um lançamento na API de lançamentos, iniciou novamente o consumidor e aguardou o saldo.

```text
Status                 : APROVADO
SaldoAposRecuperacao   : 777,77
PerdaDeEventos         : 0%
```

Esse cenário valida diretamente: “o serviço de controle de lançamento não deve ficar indisponível se o sistema de consolidado diário cair”.

## Evidência de carga

O script preparou uma data consolidada e enviou requisições HTTP autenticadas com espaçamento de 20 ms por 10 segundos.

```text
Status            : APROVADO
Requisicoes       : 500
Sucessos          : 500
Falhas            : 0
PerdaPercentual   : 0%
VazaoObservadaRps : 49,99
MetaRps           : 50
```

## Estado da mensageria após os testes

```text
fluxocaixa.consolidado.v2   ready=0  unacked=0
fluxocaixa.consolidado.dlq  ready=0  unacked=0
outbox pendente=0
```

## Interpretação responsável

- A meta foi atendida no ambiente local medido, com margem de perda total de cinco pontos percentuais.
- O resultado não autoriza afirmar “pronto para produção”: faltam teste prolongado, perfil de hardware alvo, múltiplas réplicas, observabilidade e ensaio de recuperação de banco.
- O teste mede disponibilidade HTTP e perda de respostas no endpoint de leitura. O fluxo de eventos é validado separadamente pelos testes de resiliência/Outbox.
- O cache influencia o resultado, mas sua queda não interrompe a leitura; aumenta a carga no PostgreSQL.
