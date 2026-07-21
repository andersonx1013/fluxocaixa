# Glossário Técnico e de Domínio

Revisão: 18/07/2026.

Este dicionário explica as expressões usadas no código, nos diagramas e na documentação do FluxoCaixa. As definições descrevem o significado no contexto desta solução.

## Domínio financeiro

| Expressão | Definição no projeto |
|---|---|
| Lançamento | Registro financeiro individual contendo identificador, tipo, valor, data e descrição. |
| Débito | Lançamento que reduz o saldo diário. |
| Crédito | Lançamento que aumenta o saldo diário. |
| Fluxo de caixa | Conjunto de entradas e saídas financeiras ao longo do tempo. |
| Consolidado diário | Agregado dos débitos, créditos e saldo de uma data. |
| Saldo inicial | Valor disponível antes dos movimentos do dia; nesta prova começa em zero. |
| Saldo final | Resultado de `SaldoInicial - TotalDebitos + TotalCreditos`. |
| Projeção de leitura | Modelo derivado dos eventos de lançamentos, otimizado para consultar o consolidado. |
| Consistência eventual | Um lançamento é confirmado antes de o consolidado ser atualizado; os dados convergem após o processamento do evento. |
| Comerciante | Papel autorizado a registrar lançamentos e consultar consolidados. |

## Arquitetura e design

| Expressão | Definição no projeto |
|---|---|
| ADR | Architecture Decision Record; documento que registra decisão, motivação e trade-offs arquiteturais. |
| API | Interface HTTP/JSON usada pelos clientes para executar operações do sistema. |
| API Gateway | Ponto de entrada da arquitetura-alvo responsável por TLS, roteamento, rate limit e proteções de borda. |
| Bounded Context | Limite de responsabilidade de um domínio; lançamentos e consolidado possuem modelos e bancos independentes. |
| C4 Model | Modelo de diagramas que descreve contexto, containers, componentes, código e implantação. |
| C4 Nível 1 | Diagrama de contexto que mostra pessoas e o sistema como um todo. |
| C4 Nível 2 | Diagrama de containers que mostra APIs, bancos, broker e cache. |
| C4 Nível 3 | Diagrama dos componentes internos de cada serviço. |
| C4 Nível 4 | Visão das classes e contratos principais do código. |
| C4 Deployment | Visão de onde os containers seriam implantados e como teriam redundância em produção. |
| Clean Architecture | Separação entre Domain, Application, Infrastructure e API, mantendo regras de negócio independentes de tecnologia. |
| Domain | Camada com entidades, regras e contratos centrais do negócio. |
| Application | Camada que coordena casos de uso e regras de aplicação. |
| Infrastructure | Camada que implementa persistência, mensageria, cache e integrações técnicas. |
| API layer | Camada de entrada HTTP, autenticação, autorização, controllers e health checks. |
| Dependency Injection | Fornecimento de dependências por configuração, reduzindo acoplamento e facilitando testes. |
| SOLID | Princípios de design para responsabilidades claras, extensibilidade e baixo acoplamento. |
| Microsserviço | Serviço implantável de forma independente e responsável por uma capacidade de negócio. |
| Stateless | API que não mantém sessão local entre requisições e pode ser replicada horizontalmente. |
| Escala horizontal | Aumento de capacidade pela adição de réplicas, em vez de somente aumentar CPU ou memória. |
| Balanceador de carga | Componente que distribui requisições entre réplicas saudáveis. |
| Sticky session | Afinidade que mantém um cliente na mesma réplica; não é necessária nas APIs stateless deste desenho. |
| Alta disponibilidade (HA) | Capacidade de continuar operando quando uma instância ou zona falha. |
| Redundância | Existência de mais de uma instância de um componente crítico. |
| Failover | Troca automática ou controlada para uma réplica saudável após falha. |
| Autoscaling | Ajuste automático da quantidade de réplicas conforme carga, latência ou uso de recursos. |
| Trade-off | Consequência positiva e negativa considerada ao tomar uma decisão técnica. |

## Integração e resiliência

| Expressão | Definição no projeto |
|---|---|
| Comunicação assíncrona | Integração em que o produtor não espera o consumidor processar o evento para responder. |
| Evento | Mensagem que informa algo já ocorrido, como criação, alteração ou exclusão de lançamento. |
| Broker | Servidor intermediário que recebe, armazena e entrega mensagens; nesta solução, RabbitMQ. |
| RabbitMQ | Broker AMQP usado para desacoplar lançamentos e consolidado. |
| AMQP | Protocolo utilizado para publicar e consumir eventos no RabbitMQ. |
| Fila durável | Fila cuja definição sobrevive à reinicialização do broker. |
| Mensagem persistente | Mensagem gravada pelo broker para reduzir risco de perda durante reinicialização. |
| Quorum queue | Fila replicada entre nós RabbitMQ, prevista na arquitetura-alvo de produção. |
| Publisher confirm | Confirmação do RabbitMQ de que recebeu a publicação antes de o Outbox marcá-la como processada. |
| ACK | Confirmação do consumidor de que a mensagem foi processada com sucesso. |
| NACK | Rejeição explícita de uma mensagem que não pôde ser processada. |
| Redelivery | Nova entrega de uma mensagem que não foi confirmada. |
| DLQ | Dead Letter Queue; fila separada para mensagens rejeitadas ou inválidas. |
| Mensagem venenosa | Mensagem que falha repetidamente e poderia bloquear ou degradar o consumidor. |
| Transactional Outbox | Persistência do lançamento e do evento na mesma transação do PostgreSQL. |
| Outbox publisher | Serviço em background que publica eventos pendentes do Outbox no RabbitMQ. |
| Claim/lease de trabalho | Reserva temporária de um item para uma única réplica processá-lo, evitando concorrência entre publishers. Pode usar bloqueio com `FOR UPDATE SKIP LOCKED` ou coluna de lease. |
| Idempotent Inbox | Registro transacional das mensagens já processadas pelo consolidado. |
| Idempotência | Garantia de que processar a mesma mensagem novamente não altera o resultado após a primeira execução. |
| MessageId | Identificador único usado para correlacionar e deduplicar eventos. |
| Single active consumer | Configuração que mantém um consumidor ativo por fila e promove outro em caso de falha. |
| Retry | Nova tentativa após falha transitória. |
| Backoff | Intervalo crescente ou controlado entre tentativas para evitar sobrecarga. |
| Desacoplamento | Ausência de chamada síncrona do serviço de lançamentos para o consolidado. |

## Dados e cache

| Expressão | Definição no projeto |
|---|---|
| Database per service | Cada microsserviço possui banco e schema próprios, sem acesso direto às tabelas do outro. |
| PostgreSQL | Banco relacional usado como fonte da verdade dos dois serviços. |
| Redis | Armazenamento em memória usado somente como cache de leitura do consolidado. |
| Cache-aside | A aplicação consulta o cache, busca no banco em caso de miss e então preenche o cache. |
| Cache hit | Consulta respondida diretamente pelo Redis. |
| Cache miss | Chave ausente no Redis, exigindo consulta ao PostgreSQL. |
| TTL | Time To Live; período de cinco minutos antes de a chave do cache expirar. |
| Fallback | Caminho alternativo; se o Redis falha, o consolidado consulta o PostgreSQL. |
| Fonte da verdade | Armazenamento autoritativo; Redis não é fonte da verdade, PostgreSQL é. |
| Repository | Abstração das operações de persistência das entidades. |
| Unit of Work | Coordenação das alterações que devem ser confirmadas na mesma transação. |
| EF Core | ORM .NET usado para mapear entidades e executar operações no PostgreSQL. |
| `AsNoTracking` | Consulta EF Core sem rastreamento, apropriada para leituras e com menor custo. |
| Índice | Estrutura de banco que acelera localização e ordenação de dados. |
| Primária | Instância de banco que recebe escritas. |
| Standby | Réplica preparada para assumir após falha da primária. |
| Replicação síncrona | Confirmação da escrita somente após uma réplica também persistir o dado. |
| WAL | Write-Ahead Log do PostgreSQL, utilizado para recuperação e replicação. |
| PITR | Point-in-Time Recovery; restauração do banco para um instante específico. |

## Segurança

| Expressão | Definição no projeto |
|---|---|
| Autenticação | Verificação de quem está fazendo a requisição. |
| Autorização | Verificação do que uma identidade autenticada pode executar. |
| JWT | Token assinado com claims de identidade, validade e permissões. |
| HS256 | Algoritmo HMAC-SHA256 usado para assinar o JWT local da prova. |
| Issuer | Claim que identifica quem emitiu o token. |
| Audience | Claim que identifica para qual API o token foi emitido. |
| Claim | Informação contida no token, como papel, emissor ou expiração. |
| Role | Papel de autorização; os endpoints exigem `comerciante`. |
| Policy | Regra ASP.NET Core que reúne requisitos de autorização. |
| OAuth2 | Framework de autorização previsto para substituir o emissor JWT local em produção. |
| OIDC | Camada de identidade sobre OAuth2 usada para autenticação federada. |
| TLS | Criptografia do tráfego entre cliente e serviços. |
| Criptografia em repouso | Proteção criptográfica de bancos, backups e volumes armazenados. |
| Secret Manager | Serviço da arquitetura-alvo que entrega segredos sem gravá-los em código ou imagem. |
| Identidade de workload | Identidade atribuída à aplicação para acessar recursos sem segredo estático. |
| Menor privilégio | Concessão apenas das permissões necessárias para cada identidade. |
| Rate limit | Limite de requisições por cliente e intervalo para conter abuso e sobrecarga. |
| WAF | Web Application Firewall; proteção de borda contra padrões comuns de ataque HTTP. |
| Supply chain | Dependências, imagens e etapas usadas para construir e distribuir o software. |

## Observabilidade e confiabilidade

| Expressão | Definição no projeto |
|---|---|
| Observabilidade | Capacidade de entender o estado interno por logs, métricas e traces. |
| Log estruturado | Evento de log com campos pesquisáveis, em vez de apenas texto livre. |
| Métrica | Valor numérico ao longo do tempo, como latência, erros ou tamanho do Outbox. |
| Trace distribuído | Caminho correlacionado de uma operação entre APIs, broker e consumidor. |
| OpenTelemetry | Padrão previsto para coletar e exportar logs, métricas e traces. |
| OTLP | Protocolo usado para enviar telemetria ao OpenTelemetry Collector. |
| TraceId | Identificador que correlaciona etapas da mesma operação. |
| Health check | Endpoint que informa saúde do processo e de suas dependências. |
| Liveness | `/health/live`; indica se o processo está vivo e deve permanecer em execução. |
| Readiness | `/health/ready`; indica se a API pode receber tráfego com segurança. |
| SLI | Service Level Indicator; medição real, como disponibilidade ou p95. |
| SLO | Service Level Objective; meta definida para um SLI. |
| SLA | Service Level Agreement; compromisso contratual, não definido por esta prova. |
| RTO | Recovery Time Objective; tempo máximo desejado para restaurar o serviço. |
| RPO | Recovery Point Objective; quantidade máxima aceitável de dados perdidos no tempo. |
| Error budget | Parcela de falhas permitida pelo SLO em uma janela. |
| Latência | Tempo entre enviar uma requisição e receber a resposta. |
| p95 | Percentil abaixo do qual estão 95% das medições. |
| p99 | Percentil abaixo do qual estão 99% das medições. |
| Throughput | Quantidade de operações processadas por unidade de tempo. |
| RPS | Requests Per Second; requisições por segundo. |
| Taxa de erro | Percentual de requisições sem resultado válido. |
| Perda de requisições | Requisições enviadas que não foram concluídas com sucesso. |
| Lag | Atraso entre produção e processamento de uma mensagem. |
| Alerta | Regra que notifica quando uma métrica ultrapassa um limite. |
| Runbook | Procedimento operacional para diagnóstico, recuperação ou replay. |

## Testes e entrega

| Expressão | Definição no projeto |
|---|---|
| Teste unitário | Validação isolada de uma regra ou classe usando dependências simuladas. |
| Mock | Implementação simulada de uma dependência usada em testes unitários. |
| Teste de integração | Validação conjunta de código e infraestrutura real, como banco ou broker. |
| Smoke test | Verificação rápida do fluxo principal, segurança e consolidação eventual. |
| Teste de resiliência | Interrupção controlada de um componente para verificar continuidade e recuperação. |
| Teste de carga | Envio programado de volume de requisições para medir sucesso e vazão. |
| Soak test | Teste de carga prolongado para encontrar degradação ou vazamentos. |
| Chaos testing | Introdução controlada de falhas para validar hipóteses de resiliência. |
| Testcontainers | Biblioteca sugerida para iniciar dependências Docker durante testes de integração. |
| CI | Continuous Integration; build, testes, diagramas e auditoria executados automaticamente. |
| CD | Continuous Delivery/Deployment; entrega ou implantação automatizada, fora do escopo local. |
| Auditoria NuGet | Verificação de vulnerabilidades conhecidas em pacotes diretos e transitivos. |
| Pipeline local | `Test-All.ps1`, que executa validações e cenários reproduzíveis em sequência. |

## Docker e ambiente local

| Expressão | Definição no projeto |
|---|---|
| Container | Processo isolado criado a partir de uma imagem Docker. |
| Imagem | Pacote imutável com aplicação, runtime e arquivos necessários. |
| Docker Compose | Arquivo que define e inicia os seis serviços locais da prova. |
| Projeto Compose | Namespace `carrefour-fluxocaixa-prova` que separa os recursos dos demais containers. |
| Rede bridge | Rede Docker dedicada usada para comunicação entre os containers da prova. |
| Volume | Armazenamento persistente de PostgreSQL, RabbitMQ e Redis. |
| Porta publicada | Mapeamento de uma porta do container para a máquina Windows. |
| Loopback | Interface `127.0.0.1`, acessível somente pela própria máquina. |
| Localhost | Nome local usado para acessar as APIs e dependências publicadas. |
| Health status Docker | Estado dos health checks de infraestrutura exibido por `docker compose ps`. |
