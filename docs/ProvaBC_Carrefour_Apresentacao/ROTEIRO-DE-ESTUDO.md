# Roteiro de Estudo e Apresentação

## Mensagem central

O FluxoCaixa transforma o principal risco do desafio em uma decisão verificável: o serviço de lançamentos continua aceitando trabalho durante falhas do consolidado ou do broker, e o saldo converge após a recuperação sem dupla contabilização.

## Antes de apresentar

```powershell
cd C:\ProvaBC_Carrefour\docs\ProvaBC_Carrefour_Apresentacao
.\Iniciar-Apresentacao.ps1
```

Confirme no topo da apresentação que aparece `SISTEMA ONLINE`. Abra antecipadamente os dois Swagger e execute o Smoke uma vez. Use tela cheia apenas depois dessa verificação.

## Percurso recomendado de 15 minutos

### 00. Abertura

“O desafio não é apenas cadastrar débitos e créditos. A pergunta que guiou o desenho foi: a escrita continua disponível quando o restante do sistema falha?”

### 01. O desafio real

“Há dois requisitos decisivos: independência do consolidado e 50 requisições por segundo com perda máxima de 5%. Portanto, as decisões arquiteturais precisam responder a disponibilidade, desempenho e recuperação.”

### 02. Decomposição

“Separei duas capacidades de negócio. Lançamentos possui seu banco e confirma comandos. Consolidado possui outro banco e mantém uma projeção de leitura. Nenhum serviço consulta as tabelas do outro.”

### 03. Resiliência

“O lançamento e o evento entram no mesmo commit. O publicador do Outbox tenta enviar depois. Se o broker estiver fora, o POST continua funcionando. No consumo, a Inbox usa MessageId para impedir dupla contabilização.”

### 04. Swagger

“O Swagger mostra os contratos reais, autenticação Bearer, payloads e códigos de resposta. Ele é uma forma rápida de exploração, mas os scripts são a evidência reproduzível.”

### 05. Scripts

Execute preferencialmente `Resiliência`.

“O teste interrompe somente a API de consolidado, cria um lançamento, confirma que a escrita permanece disponível, restaura o consumidor e aguarda o saldo convergir. O resultado esperado é 0% de perda.”

### 06. C4

“Usei C4 para responder perguntas diferentes. Contexto mostra quem usa. Containers mostram responsabilidades. Componentes mostram os padrões internos. Código mostra os contratos centrais. Deployment representa a topologia-alvo de produção.”

### 07. API Lab

Clique em `EXECUTAR FLUXO COMPLETO`.

“O laboratório gera um JWT somente em memória, cria crédito e débito e consulta o consolidado até a projeção convergir. O pequeno intervalo ilustra a consistência eventual.”

### 08. Segurança

“Localmente uso JWT HS256 com issuer, audience, expiração e role. Produção está desenhada com OIDC, TLS, secret manager, WAF e menor privilégio. Não simulei cloud apenas para marcar requisito.”

### 09. Desempenho

“Foram programadas 500 requisições em dez segundos. O resultado medido foi 500 sucessos, 49,99 req/s observadas e 0% de perda. É evidência local de aceitação, não certificação de produção.”

### 10. Escala horizontal

Amplie o `C4 // ESCALA HORIZONTAL`.

“Este C4 Deployment é somente conceitual. Reproduzir localmente uma topologia distribuída completa com balanceador, múltiplas réplicas, autoscaling e failover dos dados consumiria tempo desproporcional para a prova. O desenho, porém, parte exatamente dos componentes que foram desenvolvidos.”

“Na entrada, um gateway distribui somente para APIs com `/health/ready` saudável. Lançamentos e Consolidado admitem réplicas HTTP porque são stateless e recebem JWT em cada requisição. PostgreSQL, RabbitMQ e Redis continuam compartilhados por domínio e ganhariam sua própria estratégia de alta disponibilidade.”

“Há dois cuidados específicos. Antes de escalar Lançamentos, o publisher atual da Outbox precisa de claim/lease, como `FOR UPDATE SKIP LOCKED`, ou ser extraído para um worker dedicado. No Consolidado, as réplicas atendem leitura em paralelo, mas o Single Active Consumer mantém um consumidor ativo por fila e outro em standby; para aumentar throughput de eventos seria necessário particionar por comerciante.”

Opcionalmente, feche o C4 e clique em `SIMULAR COMPORTAMENTO`. Alterne entre `NORMAL`, `SIMULAR PICO` e `SIMULAR FALHA` para mostrar novas réplicas entrando na rotação e uma instância `NOT READY` sendo retirada pelo balanceador. Reforce que é uma animação conceitual: não chama APIs, não altera dados e não provisiona infraestrutura no Compose local.

### 11. Conclusão

“A solução permanece disponível para escrever, confiável para consolidar e mensurável para evoluir. As hipóteses principais possuem teste, documentação e limites conscientes.”

## Versão curta de 7 minutos

Apresente as cenas 00, 01, 02, 03, 05, 09, 10 e 11. Execute apenas o teste de Resiliência. Na cena 10, amplie o C4 e diferencie a base implementada da topologia conceitual. Deixe Swagger e API Lab para perguntas.

## Perguntas prováveis

### Por que microsserviços para um domínio pequeno?

Não escolhi microsserviços por moda. O requisito exige independência explícita entre escrita e consolidado. A separação cria limites de falha e escala, mas reconheço o custo de mensageria, observabilidade e consistência eventual.

### Por que não publicar diretamente no RabbitMQ dentro da requisição?

Haveria uma janela de inconsistência: o banco poderia confirmar e o broker falhar, ou o broker confirmar e o banco reverter. O Transactional Outbox mantém lançamento e intenção de publicação no mesmo commit local.

### Outbox garante exatamente uma vez?

Não. A entrega é pelo menos uma vez. Publisher confirms reduzem incerteza de publicação e a Inbox idempotente impede que redelivery altere o saldo duas vezes.

### O que acontece com mensagem inválida?

O consumidor usa ACK manual. Falhas permanentes recebem NACK sem requeue e seguem para a DLQ, evitando loop infinito. Replay é uma operação controlada prevista como evolução.

### O Redis pode deixar o consolidado indisponível?

Não deveria. Redis é cache-aside e não fonte da verdade. Em falha, a leitura consulta PostgreSQL; a consequência é maior latência e carga, não perda de dados.

### Como escalar o consumidor se há single active consumer?

Uma réplica consome e outra fica pronta para failover, preservando ordem de escrita por fila. Se o volume de eventos superar uma única fila, a evolução é particionar por comerciante ou chave de agregação, mantendo ordem dentro de cada partição.

### Como o balanceador sabe que uma réplica falhou?

O gateway consulta o endpoint de readiness e remove da rotação a instância que não está pronta. Liveness responde se o processo deve ser reiniciado; readiness responde se ele pode receber tráfego. Em produção, timeouts, tentativas limitadas e circuit breaker complementariam essa retirada.

### O projeto já pode subir múltiplas réplicas de lançamentos sem ajustes?

A camada HTTP é stateless e está preparada para isso, mas o publicador da Outbox ainda precisa de coordenação concorrente. Antes de aumentar as réplicas, eu implementaria claim/lease das linhas, como `FOR UPDATE SKIP LOCKED`, ou um worker dedicado. A Inbox mantém o consolidado idempotente, mas não substitui essa coordenação do publisher.

### Por que não há Kubernetes, cloud ou provedor de identidade no Compose?

Porque a prova precisa rodar integralmente em localhost. A topologia de produção está representada no C4 Deployment e nos ADRs, sem introduzir serviços externos que o avaliador não conseguiria reproduzir.

### 49,99 req/s não é menor que 50?

A taxa programada é exatamente 50 req/s. A vazão observada divide 500 requisições pelo tempo total, incluindo uma pequena sobrecarga de agendamento e espera da última resposta. O resultado central é 500/500 com 0% de perda.

### Quais são os maiores limites atuais?

O ambiente local usa uma instância por componente, JWT simétrico, `EnsureCreated`, ausência de telemetria persistente e replay manual da DLQ. Todos estão documentados com caminhos de evolução.

## Frases que demonstram maturidade

- “Isto está implementado e testado localmente.”
- “Isto pertence à arquitetura-alvo e está documentado, não simulado.”
- “O trade-off desta decisão é...”
- “A fonte da verdade continua sendo o PostgreSQL.”
- “A entrega é pelo menos uma vez; a idempotência protege o resultado.”
- “Este benchmark valida a prova, não substitui um teste prolongado em produção.”

## Frases a evitar

- “É exatamente uma vez.”
- “Nunca perde dados.”
- “Está pronto para produção.”
- “Redis garante a disponibilidade.”
- “Microsserviços sempre escalam melhor.”
- “O teste de dez segundos prova alta disponibilidade.”

## Plano B para demonstração

Se o status estiver degradado, não improvise alterações no projeto durante a apresentação.

1. Mostre o C4 e explique o fluxo.
2. Abra `docs/relatorio-teste-carga-2026-07-18.md` como evidência registrada.
3. Mostre o código do Outbox ou Inbox somente se perguntarem.
4. Reinicie o ambiente depois, usando `docker compose up -d` no projeto principal.

O PowerPoint funciona sem os serviços e serve como fallback offline completo.
