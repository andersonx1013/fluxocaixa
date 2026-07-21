const world = document.querySelector("#world");
const frames = [...document.querySelectorAll(".frame")];
const sceneTitle = document.querySelector("#sceneTitle");
const sceneCode = document.querySelector("#sceneCode");
const sceneDots = document.querySelector("#sceneDots");
const liveStatus = document.querySelector("#liveStatus");
const mediaDialog = document.querySelector("#mediaDialog");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogContent = document.querySelector("#dialogContent");
const glossaryDrawer = document.querySelector("#glossaryDrawer");
const securityInfoDrawer = document.querySelector("#securityInfoDrawer");
const glossaryList = document.querySelector("#glossaryList");
const glossarySearch = document.querySelector("#glossarySearch");
const terminal = document.querySelector("#testTerminal");
const terminalState = document.querySelector("#terminalState");
const responseStatus = document.querySelector("#responseStatus");
const responseTime = document.querySelector("#responseTime");
const responseMethod = document.querySelector("#responseMethod");
const apiResponse = document.querySelector("#apiResponse");
const fileModeNotice = document.querySelector("#fileModeNotice");
const footerMapButton = document.querySelector("#footerMapButton");
const footerSceneCounter = document.querySelector("#footerSceneCounter");
const runningFromFile = location.protocol === "file:";
const presentationUrl = "http://127.0.0.1:4177";
const diagramBaseUrl = runningFromFile
  ? "../../diagrams/"
  : "/project-diagrams/";

const diagrams = [
  ["01", "Contexto", "01-contexto.png", "contexto", "Visão macro do ecossistema do sistema \"FluxoCaixa\", mostrando quem interage com ele externamente (Comerciante) e os limites do sistema.", "Alinhar o escopo e as integrações do sistema com stakeholders técnicos e de negócio sem expor detalhes de infraestrutura ou implementação.", "Mostrar as fronteiras do sistema, identificando os usuários e os fluxos de entrada/saída principais de dados."],
  ["02", "Containers", "02-container.png", "containers", "Mapeamento lógico de nível 2 (C4 Model) que divide o sistema nos contêineres de software que rodam de forma independente (APIs e Bancos).", "Ilustrar o desacoplamento físico e lógico das APIs de Lançamento e Consolidado, seus respectivos bancos PostgreSQL, RabbitMQ e o cache com Redis.", "Demonstrar como a escrita (Lançamentos) e a leitura (Consolidado) são isoladas em nível de processo e rede, eliminando pontos únicos de falha e permitindo escala independente."],
  ["03", "Componentes L", "03-componentes-lancamentos.png", "componentes-l", "Visão de nível 3 (C4 Model) focada na arquitetura de software interna do Microsserviço de Lançamentos.", "Detalhar a organização interna do código (Clean Architecture) que processa as escritas, mapeando o fluxo entre Controllers, Use Cases, Repositories e o Worker do Outbox.", "Mostrar como o padrão Transactional Outbox é acoplado transacionalmente ao banco de lançamentos para publicar eventos de forma assíncrona e altamente resiliente."],
  ["04", "Componentes C", "04-componentes-consolidado.png", "componentes-c", "Visão de nível 3 (C4 Model) focada na arquitetura interna do Microsserviço de Consolidado (leitura).", "Explicar o processador assíncrono de eventos, a validação de idempotência com a Inbox Store, a persistência de saldos no PostgreSQL e o gerenciamento de cache com Redis.", "Mostrar os componentes responsáveis por ler as mensagens do RabbitMQ, impedir dupla contabilização e gerenciar o cache-aside para garantir leituras eficientes e consistência eventual rápida."],
  ["05", "Código", "05-codigo.png", "codigo", "Representação de nível 4 (C4 Model) detalhando a estrutura física do código-fonte (.NET 8).", "Guiar desenvolvedores e auditores sobre a implementação direta de classes, interfaces, agregados e as relações estruturais do ecossistema de software.", "Prover um mapa preciso de tradução dos diagramas conceituais para arquivos físicos e classes de domínio do projeto."],
  ["06", "Resiliência", "06-fluxo-resiliencia.png", "resiliencia-c4", "Diagrama de fluxo e sequência que descreve o comportamento do sistema durante falhas de infraestrutura.", "Demonstrar a tolerância ativa a falhas, como a queda do broker de mensageria RabbitMQ ou da API de Consolidado, e como o sistema retém os dados e sincroniza após o restabelecimento.", "Provar de forma lógica o requisito não funcional de continuidade operacional e consistência garantida em cenários degradados."],
  ["07", "Escala horizontal", "07-deployment-producao.png", "escala-horizontal", "Diagrama de Implantação (C4 Deployment Model) que planeja a topologia de alta disponibilidade do sistema em produção.", "Projetar a topologia física ideal com balanceadores de carga, múltiplas zonas de disponibilidade (Multi-AZ), réplicas do Redis, clusters de RabbitMQ e replicação do PostgreSQL.", "Demonstrar como o sistema concebido localmente está pronto para ser escalado horizontalmente na nuvem de maneira segura e robusta."],
  ["08", "Padrões e Boas Práticas", "08-Padroes e Boas Praticas do FluxoCaixa.png", "padroes-boas-praticas", "Compilação visual das diretrizes, padrões e regras de negócio e de tecnologia adotadas ao longo do projeto.", "Servir como referência rápida das boas práticas seguidas no desenvolvimento, incluindo SOLID, Clean Code, Clean Architecture, CQRS, Outbox/Inbox, Cache-aside e defesa em camadas.", "Evidenciar a qualidade técnica, conformidade arquitetural e manutenibilidade contínua da base de código desenvolvida."],
  ["09", "Observabilidade", "09-observabilidade-distribuida.png", "observabilidade-distribuida", "Diagrama C4 de infraestrutura de apoio cobrindo a instrumentação e coleta de telemetria distribuída.", "Ilustrar como o OpenTelemetry SDK coleta métricas, logs e traces nas APIs de Lançamentos e Consolidado, enviando via OTLP para Jaeger, Prometheus e Grafana, incluindo o monitoramento de Lag de Fila no RabbitMQ.", "Garantir rastreabilidade de ponta a ponta e monitoramento de latência e saúde operacional em arquiteturas baseadas em eventos."],
  ["10", "Segurança & Secrets", "10-seguranca-borda-secrets.png", "seguranca-borda-secrets", "Diagrama C4 de segurança perimetral e gestão dinâmica de segredos para padrões enterprise de alta maturidade.", "Ilustrar a presença de WAF e API Gateway na borda e a obtenção de credenciais de banco e chaves JWT via HashiCorp Vault / Azure Key Vault em tempo de execução sem hardcoding.", "Proteger a borda contra ataques comuns (OWASP Top 10 / DDoS) e impedir que segredos ou chaves fiquem armazenados em código ou variáveis de ambiente dos contêineres."],
  ["11", "Pipeline & DLQ", "11-pipeline-cicd-dlq-audit.png", "pipeline-cicd-dlq-audit", "Diagrama C4 de esteira de integração e entrega contínua (CI/CD) e suporte operacional a Dead Letter Queue (DLQ).", "Explicar o fluxo de compilação .NET 8, varredura de vulnerabilidades com Trivy/SonarQube, publicação de imagem imutável e deploy Blue/Green, junto com o portal de auditoria e replay de mensagens da DLQ.", "Garantir governança e segurança no ciclo de vida de software e resolutividade operacional rápida para exceções na mensageria sem perda de dados."],
  ["12", "Processo E2E (BPMN)", "12-processo-e2e-bpmn.png", "processo-e2e", "Diagrama de Sequência e Processo E2E gerado via Kroki API.", "Demonstrar a jornada transacional síncrona com resposta imediata HTTP 201 ao comerciante e consolidação assíncrona desacoplada.", "Explicar como o desacoplamento de ritmos garante que a loja nunca pare de vender mesmo durante falhas no motor analítico."],
  ["13", "Capacidades de Negócio", "13-mapa-capacidades.png", "mapa-capacidades", "Mapa de Capacidades de Negócio (Business Capability Map - TOGAF) gerado via Kroki API.", "Mapear o ecossistema corporativo em 3 níveis de criticidade (Core OLTP 99.99%, Integração e Analítico OLAP).", "Demonstrar maturidade em arquitetura corporativa separando o faturamento transacional das consultas analíticas de saldo."],
  ["14", "Ritmos de Negócio", "14-ritmos-negocio-pace-layered.png", "ritmos-negocio", "Modelo Pace-Layered Architecture do Gartner gerado via Kroki API.", "Classificar o ecossistema em System of Record (Postgres), System of Integration (RabbitMQ) e System of Insight (Redis).", "Demonstrar governança corporativa de tecnologia e alinhamento com padrões internacionais de Arquitetura de Negócio."]
];

const glossary = [
  ["ACK", "Confirmação de que o consumidor processou a mensagem com sucesso."],
  ["AMQP", "Protocolo usado na comunicação com o RabbitMQ."],
  ["API Gateway", "Ponto de entrada na borda perimetral que gerencia TLS termination, roteamento, rate limit e validação de tokens."],
  ["AUTHN", "Authentication (Autenticação): Verificação da identidade do usuário (ex: validação do token JWT)."],
  ["AUTHZ", "Authorization (Autorização): Verificação dos privilégios e permissões do usuário autenticado (ex: validação de Roles/Claims)."],
  ["Blue/Green", "Estratégia de deploy sem downtime que mantém duas versões em paralelo (Azul e Verde) alternando o tráfego."],
  ["C4 Model", "Diagramas de contexto, containers, componentes, código e implantação."],
  ["Cache-aside", "A aplicação consulta o cache e usa o banco em caso de miss."],
  ["Claim/lease", "Reserva temporária de um item para uma única réplica processá-lo, evitando publishers concorrentes."],
  ["Consistência eventual", "A escrita é confirmada antes de a projeção de leitura convergir."],
  ["Cosign", "Ferramenta para assinatura e verificação digital de imagens Docker no Container Registry."],
  ["DLQ", "Dead Letter Queue; fila isolada para mensagens com falhas permanentes ou inválidas."],
  ["Escala horizontal", "Aumento de capacidade pela adição de réplicas, em vez de ampliar uma única máquina."],
  ["Failover", "Troca para uma réplica saudável após a falha da instância ativa."],
  ["GitOps", "Prática operacional em que o estado desejado da infraestrutura e deploys é declarado via Git (ex: ArgoCD)."],
  ["Health check", "Endpoint que informa o estado do processo e das dependências."],
  ["Idempotência", "Reprocessar a mesma mensagem não altera o resultado novamente."],
  ["Inbox", "Registro das mensagens já processadas pelo consolidado."],
  ["Jaeger", "Ferramenta de rastreamento distribuído (Distributed Tracing) para monitorar requisições entre microsserviços."],
  ["JWKS", "JSON Web Key Set; conjunto de chaves públicas para validação de assinaturas JWT sem segredo compartilhado."],
  ["JWT", "Token assinado que carrega identidade, validade e papel."],
  ["KMS", "Key Management Service; serviço gerenciado de gerenciamento de chaves criptográficas."],
  ["Lag", "Atraso entre a produção e o processamento de uma mensagem."],
  ["Liveness", "Indica se o processo está vivo e deve continuar em execução."],
  ["Load balancer", "Componente que distribui requisições somente entre réplicas consideradas prontas."],
  ["mTLS", "Mutual TLS; autenticação e criptografia de rede de via dupla exigindo certificados digitais em ambas as pontas."],
  ["OpenTelemetry", "Padrão aberto e SDK para coleta de métricas, logs e traces distribuídos nas aplicações."],
  ["OTel", "Abreviação oficial de OpenTelemetry; padrão aberto para observabilidade e telemetria distribuída."],
  ["OTel Collector", "Agente intermediário que recebe, processa e exporta dados OTLP para backends como Jaeger e Prometheus."],
  ["OTLP", "OpenTelemetry Protocol; protocolo padrão gRPC/HTTP para exportação e coleta de dados de telemetria."],
  ["Outbox", "Evento salvo na mesma transação do lançamento e publicado depois."],
  ["p95", "Valor abaixo do qual estão 95% das medições de latência."],
  ["PITR", "Restauração do banco para um instante específico."],
  ["Publisher confirm", "Confirmação do RabbitMQ antes de marcar o Outbox como publicado."],
  ["Quorum queue", "Fila RabbitMQ replicada entre nós para alta disponibilidade."],
  ["Readiness", "Indica se a API está pronta para receber tráfego."],
  ["Replay de DLQ", "Reinjeção operacional de mensagens represadas na Dead Letter Queue de volta para a fila principal após correção."],
  ["RPO", "Quantidade máxima aceitável de dados perdidos no tempo."],
  ["RPS", "Requests per second; quantidade de requisições por segundo."],
  ["RTO", "Tempo máximo desejado para restaurar um serviço."],
  ["SLI", "Indicador medido, como disponibilidade ou latência p95."],
  ["SLO", "Meta definida para um SLI em uma janela."],
  ["SonarQube", "Ferramenta de análise estática de código (SAST) integrada ao CI/CD para detectar bugs e vulnerabilidades."],
  ["Span", "Unidade individual de trabalho dentro de um trace do OpenTelemetry (ex: consulta ao banco ou chamada HTTP)."],
  ["Stateless", "API sem sessão local, apta a receber múltiplas réplicas."],
  ["Sticky session", "Afinidade que prende um cliente a uma réplica; não é necessária nas APIs stateless deste desenho."],
  ["TraceId", "Identificador único propagado entre chamadas HTTP e filas para correlacionar spanz de uma transação."],
  ["Transactional Outbox", "Padrão que evita perder o evento entre banco e broker."],
  ["Trivy", "Scanner de segurança de código aberto para analisar imagens Docker e pacotes em busca de vulnerabilidades."],
  ["TTL", "Tempo de vida de uma chave no cache."],
  ["Vault", "Cofre de segredos (ex: HashiCorp Vault / Azure Key Vault) para injeção e rotação dinâmica de credenciais em runtime."],
  ["WAF", "Proteção de borda contra padrões comuns de ataque HTTP."],
  ["WAL", "Log antecipado do PostgreSQL usado em replicação e recuperação."],
];

const questions = [
  ["Por que dois serviços e não um monólito?", "Porque o requisito exige que lançamentos permaneçam disponíveis durante a queda do consolidado. A separação cria limites independentes de falha e escala, com o custo de consistência eventual e maior operação."],
  ["Como você evita perder o evento depois de salvar o lançamento?", "Lancamento e Outbox são persistidos no mesmo commit. Um BackgroundService publica pendências e só marca a mensagem após publisher confirm."],
  ["E se o RabbitMQ cair?", "O POST continua gravando no PostgreSQL. O evento permanece no Outbox e é republicado quando o broker retorna."],
  ["Como evita duplicar o saldo?", "O consolidado grava o MessageId na Inbox na mesma transação do agregado. Redelivery encontra o ID e não reaplica o movimento."],
  ["Por que Redis não é ponto único de falha?", "Ele é apenas cache-aside. Em falha, a aplicação consulta o PostgreSQL, com maior latência, mas sem perder a leitura."],
  ["O teste prova produção?", "Não. Ele comprova o requisito no ambiente local. Produção exige soak test, hardware alvo, telemetria, múltiplas réplicas e ensaio de recuperação."],
  ["Por que JWT local em vez de um provedor real?", "Para manter a prova offline e reproduzível. A arquitetura-alvo documenta OIDC, TLS, secret manager e rotação de chaves."],
  ["Qual é o principal trade-off?", "A autonomia entre serviços traz consistência eventual, mensageria e complexidade operacional. O ganho é isolar falhas e escalar leitura e escrita independentemente."],
  ["Como funcionaria o balanceamento de carga?", "Um gateway consulta readiness e distribui requisições entre as APIs stateless. Se uma réplica falha, ela sai da rotação; novas réplicas entram sem afinidade de sessão porque o estado permanece nas dependências compartilhadas."],
  ["Já posso subir várias réplicas do serviço de lançamentos?", "As requisições HTTP são stateless, mas o publisher do Outbox ainda deve receber claim/lease, por exemplo com FOR UPDATE SKIP LOCKED, ou ser separado em um worker antes de escalar horizontalmente a escrita com segurança operacional."],
];

const scaleScenarios = {
  normal: {
    state: "CAPACIDADE ESTÁVEL",
    incoming: "50 RPS",
    routes: "2 ROTAS",
    active: "2 / 3",
    routed: "50 RPS",
    scenario: "NORMAL",
    replicas: [
      { className: "is-online", status: "READY", load: "25 RPS" },
      { className: "is-online", status: "READY", load: "25 RPS" },
      { className: "is-standby", status: "STANDBY", load: "0 RPS" },
    ],
  },
  peak: {
    state: "ESCALA DE 2 PARA 3 RÉPLICAS",
    incoming: "90 RPS",
    routes: "3 ROTAS",
    active: "3 / 3",
    routed: "90 RPS",
    scenario: "PICO",
    replicas: [
      { className: "is-online", status: "READY", load: "30 RPS" },
      { className: "is-online", status: "READY", load: "30 RPS" },
      { className: "is-online", status: "READY", load: "30 RPS" },
    ],
  },
  failure: {
    state: "API 01 REMOVIDA DA ROTA",
    incoming: "50 RPS",
    routes: "2 ROTAS",
    active: "2 / 3",
    routed: "50 RPS",
    scenario: "FAILOVER",
    replicas: [
      { className: "is-failed", status: "NOT READY", load: "0 RPS" },
      { className: "is-online", status: "READY", load: "25 RPS" },
      { className: "is-online", status: "READY", load: "25 RPS" },
    ],
  },
};

let currentIndex = 0;
let overview = false;
let selectedDiagram = diagrams[0];
let healthTimer = null;
let touchStartX = null;
let activeViewerCleanup = null;

function diagramUrl(name) {
  return `${diagramBaseUrl}${encodeURIComponent(name)}`;
}

function showToast(title, bodyText, type = "warning") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const header = document.createElement("div");
  header.className = "toast-header";

  const titleEl = document.createElement("strong");
  titleEl.className = "toast-title";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toast-close";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => {
    toast.style.animation = "fadeOutToast 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
    toast.addEventListener("animationend", () => toast.remove());
  });

  header.append(titleEl, closeBtn);

  const body = document.createElement("div");
  body.className = "toast-body";
  body.innerHTML = bodyText;

  toast.append(header, body);
  container.append(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = "fadeOutToast 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards";
      toast.addEventListener("animationend", () => toast.remove());
    }
  }, 5500);
}

function showServerRequired(feature) {
  const container = document.createElement("div");
  container.className = "server-required";

  const heading = document.createElement("h2");
  heading.textContent = `${feature} precisa do servidor local`;

  const message = document.createElement("p");
  message.textContent = "Execute Iniciar-Apresentacao.cmd na pasta da apresentação e use o endereço localhost.";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "primary-action";
  button.textContent = "ABRIR LOCALHOST";
  button.addEventListener("click", () => location.assign(presentationUrl));

  container.append(heading, message, button);
  showDialog("MODO ARQUIVO // RECURSO AO VIVO", container);
}

function initializeFileMode() {
  if (!runningFromFile) return;

  document.body.classList.add("file-mode");
  fileModeNotice.hidden = false;
  document.querySelector("#openLocalhostButton").addEventListener("click", () => location.assign(presentationUrl));

  document.querySelectorAll('img[src^="/project-diagrams/"]').forEach((image) => {
    image.src = diagramUrl(image.src.split("/").pop());
  });

  // An image probe is allowed from file:// and avoids redirecting to a server that is offline.
  const probe = new Image();
  let redirected = false;
  probe.onload = () => {
    if (redirected) return;
    redirected = true;
    location.replace(`${presentationUrl}/${location.hash || "#1"}`);
  };
  probe.src = `${presentationUrl}/project-diagrams/01-contexto.png?probe=${Date.now()}`;

  setTimeout(() => {
    showToast(
      "MODO ARQUIVO ATIVO",
      "A navegação funciona, mas recursos dinâmicos (testes, API Lab, Swagger) necessitam que o arquivo <code>Iniciar-Apresentacao.cmd</code> esteja executado.",
      "warning"
    );
  }, 800);
}

function frameGeometry(frame) {
  return {
    x: Number(frame.dataset.x || 0),
    y: Number(frame.dataset.y || 0),
    rotate: Number(frame.dataset.rotate || 0),
    scale: Number(frame.dataset.scale || 1),
  };
}

function placeFrames() {
  for (const frame of frames) {
    const geometry = frameGeometry(frame);
    frame.style.left = `${geometry.x}px`;
    frame.style.top = `${geometry.y}px`;
    frame.style.transform = `translate(-50%, -50%) rotate(${geometry.rotate}deg) scale(${geometry.scale})`;
  }
}

function cameraScale(frame) {
  const style = getComputedStyle(frame);
  const nominalWidth = Number.parseFloat(style.width);
  const nominalHeight = Number.parseFloat(style.height);
  const compactPortrait = window.innerWidth <= 900 && window.innerHeight > 600;
  const landscapeShort = window.innerHeight <= 600;
  const topInset = compactPortrait ? 72 : landscapeShort ? 54 : 0;
  const bottomInset = compactPortrait ? 82 : landscapeShort ? 58 : 0;
  const sideInset = compactPortrait ? 12 : landscapeShort ? 16 : 0;
  const availableWidth = window.innerWidth - sideInset * 2;
  const availableHeight = window.innerHeight - topInset - bottomInset;
  const allowance = compactPortrait || landscapeShort ? 0.98 : 0.86;

  return {
    scale: Math.max(0.2, Math.min(availableWidth / nominalWidth, availableHeight / nominalHeight) * allowance),
    centerX: sideInset + availableWidth / 2,
    centerY: topInset + availableHeight / 2,
    nominalWidth,
    nominalHeight,
    topInset,
    bottomInset,
  };
}

function updateSceneChrome() {
  sceneTitle.textContent = frames[currentIndex].dataset.title;
  sceneCode.textContent = `${String(currentIndex).padStart(2, "0")} / ${String(frames.length - 1).padStart(2, "0")}`;
  footerSceneCounter.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(frames.length).padStart(2, "0")}`;
  [...sceneDots.children].forEach((dot, index) => dot.classList.toggle("is-active", index === currentIndex));
}

function goTo(index, { instant = false } = {}) {
  overview = false;
  document.body.classList.remove("is-overview");
  footerMapButton.classList.remove("is-active");
  currentIndex = (index + frames.length) % frames.length;
  const frame = frames[currentIndex];
  const { x, y, rotate, scale } = frameGeometry(frame);
  frames.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === currentIndex));
  if (instant) world.classList.add("no-transition");
  const camera = cameraScale(frame);
  const fit = camera.scale / scale;
  world.style.transform = `translate(${camera.centerX}px, ${camera.centerY}px) scale(${fit}) rotate(${-rotate}deg) translate(${-x}px, ${-y}px)`;
  updateSceneChrome();
  if (typeof setProfileAnimationState === "function") {
    setProfileAnimationState(currentIndex === 0);
  }
  history.replaceState(null, "", `#${currentIndex + 1}`);
  if (instant) requestAnimationFrame(() => world.classList.remove("no-transition"));

  // Exibe toast de alerta de recurso local dependente caso esteja rodando diretamente do arquivo
  if (runningFromFile && !instant) {
    const slideNumber = String(currentIndex + 1).padStart(2, "0");
    const title = frame.dataset.title || "";
    // Slides interativos que usam backend ou docker:
    // 04: Swagger
    // 05: Scripts ao vivo
    // 07: API Lab
    // 08: Segurança em camadas (usa JWT local validado pelas APIs)
    if (currentIndex === 4 || currentIndex === 5 || currentIndex === 7 || currentIndex === 8) {
      showToast(
        "RECURSO LOCAL REQUERIDO",
        `O slide <strong>${slideNumber} (${title})</strong> necessita do servidor local. Lembre-se de iniciar o ambiente executando o arquivo <code>Iniciar-Apresentacao.cmd</code>.`,
        "warning"
      );
    }
  }
}

function showOverview() {
  overview = true;
  document.body.classList.add("is-overview");
  footerMapButton.classList.add("is-active");
  frames.forEach((frame) => frame.classList.remove("is-active"));
  const positions = frames.map(frameGeometry);
  const camera = cameraScale(frames[currentIndex]);
  const minX = Math.min(...positions.map((item) => item.x)) - camera.nominalWidth / 2 - 120;
  const maxX = Math.max(...positions.map((item) => item.x)) + camera.nominalWidth / 2 + 120;
  const minY = Math.min(...positions.map((item) => item.y)) - camera.nominalHeight / 2 - 120;
  const maxY = Math.max(...positions.map((item) => item.y)) + camera.nominalHeight / 2 + 120;
  const width = maxX - minX;
  const height = maxY - minY;
  const availableHeight = window.innerHeight - camera.topInset - camera.bottomInset;
  const scale = Math.min(window.innerWidth / width, availableHeight / height) * 0.88;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  world.style.transform = `translate(${window.innerWidth / 2}px, ${camera.topInset + availableHeight / 2}px) scale(${scale}) translate(${-centerX}px, ${-centerY}px)`;
  sceneTitle.textContent = "Mapa da apresentação";
  sceneCode.textContent = "OVERVIEW";
  footerSceneCounter.textContent = "MAPA";
}

function buildDots() {
  frames.forEach((frame, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.title = frame.dataset.title;
    button.addEventListener("click", () => goTo(index));
    
    const shape = document.createElement("span");
    shape.className = "dot-shape";
    
    const num = document.createElement("span");
    num.className = "dot-number";
    num.textContent = String(index + 1).padStart(2, "0");
    
    button.appendChild(num);
    button.appendChild(shape);
    sceneDots.append(button);
  });
}

function showDialog(title, content) {
  if (activeViewerCleanup) {
    activeViewerCleanup();
    activeViewerCleanup = null;
  }
  dialogTitle.textContent = title;
  dialogContent.dataset.mode = content.classList.contains("image-viewer")
    ? "image"
    : content.classList.contains("scale-simulation") ? "simulation" : "default";
  dialogContent.replaceChildren(content);
  mediaDialog.showModal();
}

function applyScaleScenario(simulator, mode) {
  const scenario = scaleScenarios[mode] || scaleScenarios.normal;
  simulator.dataset.scaleState = mode;
  for (const [field, value] of Object.entries(scenario)) {
    if (field === "replicas") continue;
    const target = simulator.querySelector(`[data-scale-field="${field}"]`);
    if (target) target.textContent = value;
  }
  scenario.replicas.forEach((replicaState, index) => {
    const replica = simulator.querySelector(`[data-scale-replica="${index}"]`);
    replica.classList.remove("is-online", "is-standby", "is-failed");
    replica.classList.add(replicaState.className);
    replica.querySelector('[data-replica-field="status"]').textContent = replicaState.status;
    replica.querySelector('[data-replica-field="load"]').textContent = replicaState.load;
  });
  simulator.querySelectorAll("[data-scale-mode]").forEach((button) => {
    const selected = button.dataset.scaleMode === mode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function showScaleSimulation() {
  const template = document.querySelector("#scaleSimulationTemplate");
  const simulator = template.content.firstElementChild.cloneNode(true);
  simulator.querySelectorAll("[data-scale-mode]").forEach((button) => {
    button.addEventListener("click", () => applyScaleScenario(simulator, button.dataset.scaleMode));
  });
  applyScaleScenario(simulator, "normal");
  showDialog("SIMULAÇÃO VISUAL // CENÁRIO CONCEITUAL", simulator);
}

function showImage(name, title = "DIAGRAMA C4") {
  const initialDiagram = diagrams.find((diagram) => diagram[2] === name);
  const resolvedTitle = initialDiagram ? `C4 // ${initialDiagram[1].toUpperCase()}` : title;
  const viewer = document.createElement("div");
  viewer.className = "image-viewer";

  const toolbar = document.createElement("div");
  toolbar.className = "image-toolbar";
  toolbar.innerHTML = `
    <div class="viewer-group viewer-navigation">
      <button type="button" data-viewer-action="previous" title="Imagem anterior">←</button>
      <button type="button" data-viewer-action="next" title="Próxima imagem">→</button>
    </div>
    <div class="viewer-group viewer-modes">
      <button type="button" data-viewer-action="fit" class="is-active">AJUSTAR</button>
      <button type="button" data-viewer-action="width">LARGURA</button>
      <button type="button" data-viewer-action="actual">1:1</button>
    </div>
    <div class="viewer-group viewer-zoom">
      <button type="button" data-viewer-action="zoom-out" title="Diminuir zoom">−</button>
      <input type="range" min="10" max="400" step="1" value="100" aria-label="Nível de zoom">
      <button type="button" data-viewer-action="zoom-in" title="Aumentar zoom">+</button>
      <output>100%</output>
    </div>
    <div class="viewer-meta"><strong></strong><span></span></div>`;

  const stage = document.createElement("div");
  stage.className = "image-stage";
  stage.tabIndex = 0;
  stage.setAttribute("aria-label", "Visualizador de diagrama. Arraste para mover e use a roda para aplicar zoom.");
  const image = new Image();
  image.draggable = false;
  image.alt = initialDiagram?.[1] || title;
  stage.append(image);
  viewer.append(toolbar, stage);
  showDialog(resolvedTitle, viewer);

  const slider = toolbar.querySelector('input[type="range"]');
  const zoomOutput = toolbar.querySelector("output");
  const fileOutput = toolbar.querySelector(".viewer-meta strong");
  const dimensionOutput = toolbar.querySelector(".viewer-meta span");
  const modeButtons = [...toolbar.querySelectorAll(".viewer-modes button")];
  let currentName = name;
  let scale = 1;
  let fitScale = 1;
  let x = 0;
  let y = 0;
  let drag = null;

  function setActiveMode(action = "") {
    modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.viewerAction === action));
  }

  function applyTransform() {
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    const percent = Math.round(scale * 100);
    slider.value = String(Math.min(400, Math.max(10, percent)));
    zoomOutput.textContent = `${percent}%`;
  }

  function constrainPosition() {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const margin = 70;

    x = width <= stage.clientWidth
      ? (stage.clientWidth - width) / 2
      : Math.min(margin, Math.max(stage.clientWidth - width - margin, x));
    y = height <= stage.clientHeight
      ? (stage.clientHeight - height) / 2
      : Math.min(margin, Math.max(stage.clientHeight - height - margin, y));
  }

  function fitImage(mode = "fit") {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const padding = 34;
    const availableWidth = Math.max(1, stage.clientWidth - padding * 2);
    const availableHeight = Math.max(1, stage.clientHeight - padding * 2);

    if (mode === "actual") scale = 1;
    else if (mode === "width") scale = Math.min(4, availableWidth / image.naturalWidth);
    else scale = Math.min(1, availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);

    fitScale = Math.min(1, availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
    x = (stage.clientWidth - image.naturalWidth * scale) / 2;
    y = (stage.clientHeight - image.naturalHeight * scale) / 2;
    setActiveMode(mode);
    applyTransform();
  }

  function zoomAt(nextScale, clientX = null, clientY = null) {
    if (!image.naturalWidth || !image.naturalHeight) return;
    const rect = stage.getBoundingClientRect();
    const pivotX = clientX === null ? stage.clientWidth / 2 : clientX - rect.left;
    const pivotY = clientY === null ? stage.clientHeight / 2 : clientY - rect.top;
    const imageX = (pivotX - x) / scale;
    const imageY = (pivotY - y) / scale;

    scale = Math.min(4, Math.max(0.1, nextScale));
    x = pivotX - imageX * scale;
    y = pivotY - imageY * scale;
    constrainPosition();
    setActiveMode();
    applyTransform();
  }

  function changeImage(direction) {
    const currentIndex = Math.max(0, diagrams.findIndex((diagram) => diagram[2] === currentName));
    const nextIndex = (currentIndex + direction + diagrams.length) % diagrams.length;
    const next = diagrams[nextIndex];
    currentName = next[2];
    image.alt = next[1];
    dialogTitle.textContent = `C4 // ${next[1].toUpperCase()}`;
    image.src = diagramUrl(currentName);
  }

  image.addEventListener("load", () => {
    fileOutput.textContent = currentName;
    dimensionOutput.textContent = `${image.naturalWidth} × ${image.naturalHeight}px`;
    requestAnimationFrame(() => fitImage("fit"));
  });

  toolbar.addEventListener("click", (event) => {
    const action = event.target.closest("button")?.dataset.viewerAction;
    if (!action) return;
    if (action === "previous") changeImage(-1);
    else if (action === "next") changeImage(1);
    else if (action === "fit" || action === "width" || action === "actual") fitImage(action);
    else if (action === "zoom-in") zoomAt(scale * 1.2);
    else if (action === "zoom-out") zoomAt(scale / 1.2);
  });

  slider.addEventListener("input", () => zoomAt(Number(slider.value) / 100));
  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomAt(scale * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX, event.clientY);
  }, { passive: false });

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: x, originY: y };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    x = drag.originX + event.clientX - drag.startX;
    y = drag.originY + event.clientY - drag.startY;
    applyTransform();
  });
  const finishDrag = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    constrainPosition();
    applyTransform();
    stage.classList.remove("is-dragging");
  };
  stage.addEventListener("pointerup", finishDrag);
  stage.addEventListener("pointercancel", finishDrag);
  stage.addEventListener("dblclick", () => fitImage(Math.abs(scale - fitScale) < 0.03 ? "actual" : "fit"));
  stage.addEventListener("keydown", (event) => {
    if (["+", "="].includes(event.key)) zoomAt(scale * 1.2);
    else if (event.key === "-") zoomAt(scale / 1.2);
    else if (event.key === "0" || event.key.toLowerCase() === "f") fitImage("fit");
    else if (event.key.toLowerCase() === "w") fitImage("width");
    else return;
    event.preventDefault();
  });

  const observer = new ResizeObserver(() => fitImage("fit"));
  observer.observe(stage);
  activeViewerCleanup = () => observer.disconnect();
  image.src = diagramUrl(name);
}

function showSwagger(url) {
  const wrapper = document.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.position = "relative";
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "Swagger da API";
  wrapper.append(iframe);
  const external = document.createElement("button");
  external.textContent = "ABRIR EM NOVA ABA";
  external.className = "primary-action";
  external.style.position = "absolute";
  external.style.right = "18px";
  external.style.bottom = "18px";
  external.addEventListener("click", () => window.open(url, "_blank", "noopener"));
  wrapper.append(external);
  showDialog("SWAGGER // CONTRATO AO VIVO", wrapper);
}

function showQuestions() {
  const container = document.createElement("div");
  container.className = "question-deck";
  const title = document.createElement("h2");
  title.textContent = "Perguntas que o avaliador pode fazer";
  container.append(title);
  for (const [question, answer] of questions) {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = question;
    const paragraph = document.createElement("p");
    paragraph.textContent = answer;
    details.append(summary, paragraph);
    container.append(details);
  }
  showDialog("MODO ESTUDO // Q&A", container);
}

function renderGlossary(query = "") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const filtered = glossary.filter(([term, definition]) => `${term} ${definition}`.toLocaleLowerCase("pt-BR").includes(normalized));
  glossaryList.replaceChildren(...filtered.map(([term, definition]) => {
    const item = document.createElement("div");
    item.className = "glossary-item";
    const heading = document.createElement("b");
    heading.textContent = term;
    const paragraph = document.createElement("p");
    paragraph.textContent = definition;
    item.append(heading, paragraph);
    return item;
  }));
}

async function refreshStatus() {
  if (runningFromFile) {
    liveStatus.className = "status-chip is-offline";
    liveStatus.querySelector("span").textContent = "ABRIR LOCALHOST";
    liveStatus.title = "Execute Iniciar-Apresentacao.cmd para habilitar recursos ao vivo.";
    return;
  }

  liveStatus.className = "status-chip is-checking";
  liveStatus.querySelector("span").textContent = "VERIFICANDO";
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    const data = await response.json();
    const services = Object.values(data.services || {});
    const online = services.length > 0 && services.every((service) => service.online);
    liveStatus.className = `status-chip ${online ? "is-online" : "is-offline"}`;
    liveStatus.querySelector("span").textContent = online ? "SISTEMA ONLINE" : "SISTEMA DEGRADADO";
    liveStatus.title = services.map((service) => `${service.online ? "online" : "offline"} · ${service.latencyMs} ms`).join(" | ");
  } catch {
    liveStatus.className = "status-chip is-offline";
    liveStatus.querySelector("span").textContent = "SEM CONEXÃO";
  }
}

function cleanTerminalText(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, "").replace(/\r/g, "");
}

async function runTest(testId, button) {
  if (runningFromFile) {
    showServerRequired("A execução de testes");
    return;
  }

  const buttons = [...document.querySelectorAll("[data-run-test]")];
  buttons.forEach((item) => { item.disabled = true; });
  terminal.textContent = `PS C:\\ProvaBC_Carrefour> iniciando ${testId}...\n`;
  terminalState.textContent = "EXECUTANDO";
  terminalState.style.color = "var(--orange)";
  try {
    const response = await fetch(`/api/tests/${encodeURIComponent(testId)}`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha ao iniciar teste.");
    terminal.textContent += `job ${data.jobId}\n\n`;
    const source = new EventSource(`/api/jobs/${data.jobId}/events`);
    source.addEventListener("log", (event) => {
      terminal.textContent += cleanTerminalText(JSON.parse(event.data));
      terminal.scrollTop = terminal.scrollHeight;
    });
    source.addEventListener("done", (event) => {
      const result = JSON.parse(event.data);
      terminal.textContent += `\n\n[${result.status.toUpperCase()}] exit code ${result.exitCode}`;
      terminalState.textContent = result.status === "passed" ? "APROVADO" : "REPROVADO";
      terminalState.style.color = result.status === "passed" ? "var(--acid)" : "var(--red)";
      buttons.forEach((item) => { item.disabled = false; });
      source.close();
      refreshStatus();
    });
    source.onerror = () => {
      if (terminalState.textContent === "EXECUTANDO") terminal.textContent += "\nConexão de eventos encerrada.";
    };
  } catch (error) {
    terminal.textContent += `\nERRO: ${error.message}`;
    terminalState.textContent = "ERRO";
    terminalState.style.color = "var(--red)";
    buttons.forEach((item) => { item.disabled = false; });
  } finally {
    button.blur();
  }
}

async function apiCall(action) {
  if (runningFromFile) {
    showServerRequired("O API Lab");
    return;
  }

  // Atualiza visualmente o Stepper à esquerda para destacar qual passo lógico corresponde a esta ação
  const steps = {
    jwt: document.querySelector("#step-jwt"),
    credito: document.querySelector("#step-credito"),
    debito: document.querySelector("#step-debito"),
    consolidado: document.querySelector("#step-consolidado")
  };
  
  // Reseta todos os passos para o estado padrão
  Object.values(steps).forEach(step => {
    step.className = "stepper-step";
    step.querySelector(".step-icon").textContent = "○";
  });
  
  // Destaca os passos com base na ação individual clicada
  if (action === "listarLancamentos") {
    steps.credito.classList.add("success");
    steps.credito.querySelector(".step-icon").textContent = "✔";
    steps.debito.classList.add("success");
    steps.debito.querySelector(".step-icon").textContent = "✔";
  } else if (action === "consultarConsolidado") {
    steps.consolidado.classList.add("success");
    steps.consolidado.querySelector(".step-icon").textContent = "✔";
  }

  const started = performance.now();
  
  // Mapeia rotas reais para mostrar no terminal superior e no log
  const actionRoutes = {
    lancamentosHealth: { method: "GET", url: "http://localhost:5101/health", label: "HEALTH CHECK (LANÇAMENTOS)" },
    consolidadoHealth: { method: "GET", url: "http://localhost:5102/health", label: "HEALTH CHECK (CONSOLIDADO)" },
    listarLancamentos: { method: "GET", url: `http://localhost:5101/api/lancamentos?data=${document.querySelector("#apiDate").value}`, label: "LISTAR LANÇAMENTOS" },
    consultarConsolidado: { method: "GET", url: `http://localhost:5102/api/consolidado?data=${document.querySelector("#apiDate").value}`, label: "CONSULTAR CONSOLIDADO" }
  };
  
  const explanations = {
    lancamentosHealth: "▶ O microsserviço de Lançamentos executou o Health Check em localhost:5101/health.\n✔ Testou a saúde da API .NET e a conectividade com o banco de dados PostgreSQL do domínio de lançamentos.",
    consolidadoHealth: "▶ O microsserviço de Consolidado executou o Health Check em localhost:5102/health.\n✔ Testou a saúde da API .NET, a conectividade com o banco de dados do domínio do consolidado e o broker RabbitMQ.",
    listarLancamentos: `▶ A API de Lançamentos executou uma busca por dados em localhost:5101/api/lancamentos.\n✔ Realizou um SELECT na tabela de lançamentos do PostgreSQL para filtrar as transações do dia ${document.querySelector("#apiDate").value}.`,
    consultarConsolidado: `▶ A API de Consolidado executou uma busca em localhost:5102/api/consolidado.\n✔ Retornou a projeção de leitura do PostgreSQL consolidada assincronamente via consumo de mensagens no RabbitMQ.`
  };
  
  const routeInfo = actionRoutes[action] || { method: "POST", url: "/api/request", label: "API REQUEST" };
  responseMethod.innerHTML = `<span class="badge get">${routeInfo.method}</span> ${routeInfo.url}`;

  responseStatus.textContent = "...";
  responseStatus.style.color = "var(--orange)";

  // Limpa o terminal completamente para esta nova requisição
  apiResponse.textContent = "🚀 [LOG] INICIANDO REQUISIÇÃO INDIVIDUAL DO FLUXO CAIXA\n";
  apiResponse.textContent += "======================================================================\n";

  // Concatena no terminal o início da chamada com a explicação didática
  apiResponse.textContent += `\n[REQUEST] ${routeInfo.label}\n`;
  apiResponse.textContent += `➔ ${routeInfo.method} ${routeInfo.url}\n`;
  apiResponse.textContent += `${explanations[action] || "⚡ Status: Executando requisição local..."}\n`;
  apiResponse.scrollTop = apiResponse.scrollHeight;

  try {
    const response = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, date: document.querySelector("#apiDate").value }),
    });
    const data = await response.json();
    const statusCode = data.status || response.status;
    const statusText = data.ok ? `${statusCode} OK` : `${statusCode} Error`;
    
    // Atualiza status da barra superior
    responseStatus.textContent = String(statusCode);
    responseStatus.style.color = data.ok ? "var(--acid)" : "var(--red)";
    
    // Concatena o que foi enviado no terminal
    apiResponse.textContent += `[REQUEST HEADERS]:\n  Accept: application/json\n  Authorization: ${action.includes("Health") ? "(Nenhum token necessário para Health Checks)" : "Bearer [JWT_TOKEN_MEMORIA]"}\n`;
    apiResponse.textContent += `[REQUEST BODY]:\n  ${routeInfo.method === "GET" ? "(Vazio - Requisições GET não possuem corpo)" : "{}"}\n\n`;
    
    // Concatena o retorno da API no terminal
    const displayStatus = data.ok ? `✔ STATUS CODE: ${statusText}` : `❌ STATUS CODE: ${statusText}`;
    apiResponse.textContent += `${displayStatus}\n`;
    apiResponse.textContent += `[RESPONSE BODY]:\n`;
    
    // Exibe apenas a resposta nativa do microsserviço (data.data) e não o envelope do proxy Node
    const apiPayload = data.data !== undefined ? data.data : data;
    apiResponse.textContent += `${JSON.stringify(apiPayload, null, 2)}\n`;
    apiResponse.textContent += "----------------------------------------------------------------------\n";
  } catch (error) {
    responseStatus.textContent = "ERR";
    responseStatus.style.color = "var(--red)";
    apiResponse.textContent += `❌ ERRO NA REQUISIÇÃO: ${error.message}\n`;
    apiResponse.textContent += "----------------------------------------------------------------------\n";
  } finally {
    const duration = Math.round(performance.now() - started);
    responseTime.textContent = `${duration} ms`;
    apiResponse.scrollTop = apiResponse.scrollHeight;
  }
}

async function runDemo() {
  if (runningFromFile) {
    showServerRequired("O fluxo completo");
    return;
  }

  const button = document.querySelector("#runDemoButton");
  const stepper = document.querySelector("#demoStepper");
  
  // Exibe o Stepper
  stepper.style.display = "flex";
  const steps = {
    jwt: document.querySelector("#step-jwt"),
    credito: document.querySelector("#step-credito"),
    debito: document.querySelector("#step-debito"),
    consolidado: document.querySelector("#step-consolidado")
  };
  
  // Reset de classes dos passos
  Object.values(steps).forEach(step => {
    step.className = "stepper-step";
    step.querySelector(".step-icon").textContent = "○";
  });

  const started = performance.now();
  button.disabled = true;
  
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Limpa o console superior da barra de status
  responseMethod.innerHTML = `<span class="badge post">POST</span> http://localhost:4177/api/demo`;
  responseStatus.textContent = "RUN";
  responseStatus.style.color = "var(--orange)";
  responseTime.textContent = "0 ms";
  
  // Inicializa o feed de logs no terminal
  apiResponse.textContent = "🚀 [LOG] INICIANDO SIMULAÇÃO INTEGRADA DO FLUXO CAIXA\n";
  apiResponse.textContent += "======================================================================\n";
  apiResponse.scrollTop = apiResponse.scrollHeight;

  // 1. Inicia a chamada backend real em segundo plano imediatamente
  const demoPromise = fetch("/api/demo", { method: "POST" })
    .then(async res => {
      const ok = res.ok;
      const data = await res.json();
      return { ok, status: res.status, data };
    });

  try {
    // 2. Passo 1: Simular a geração de JWT
    steps.jwt.classList.add("active");
    steps.jwt.querySelector(".step-icon").textContent = "●";
    
    apiResponse.textContent += "\n[PASSO 1] GENERATE JWT TOKEN\n";
    apiResponse.textContent += "➔ GET http://localhost:4177/api/jwt\n";
    apiResponse.textContent += "⚡ Status: Gerando JWT offline...\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    await delay(1000);
    
    steps.jwt.classList.remove("active");
    steps.jwt.classList.add("success");
    steps.jwt.querySelector(".step-icon").textContent = "✔";
    
    apiResponse.textContent += "✔ STATUS: 200 OK\n";
    apiResponse.textContent += "{\n  \"header\": { \"alg\": \"HS256\", \"typ\": \"JWT\" },\n  \"payload\": {\n    \"sub\": \"apresentacao-local\",\n    \"role\": \"comerciante\",\n    \"iss\": \"FluxoCaixa\"\n  }\n}\n";
    apiResponse.textContent += "----------------------------------------------------------------------\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    await delay(600);

    // 3. Passo 2: Crédito (Aguardando/Exibindo dados reais do backend)
    steps.credito.classList.add("active");
    steps.credito.querySelector(".step-icon").textContent = "●";
    
    apiResponse.textContent += "\n[PASSO 2] CRIAR LANÇAMENTO CRÉDITO\n";
    apiResponse.textContent += "➔ POST http://localhost:5101/api/lancamentos\n";
    apiResponse.textContent += "⚡ Status: Enviando Crédito (R$ 500,00)...\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;

    // Espera a resposta real do backend
    const backendResult = await demoPromise;
    if (!backendResult.ok || !backendResult.data.ok) {
      throw new Error(backendResult.data.error || "Erro na execução do fluxo pelo backend.");
    }
    
    const demoData = backendResult.data.result;
    
    await delay(400);
    
    steps.credito.classList.remove("active");
    steps.credito.classList.add("success");
    steps.credito.querySelector(".step-icon").textContent = "✔";
    
    apiResponse.textContent += "✔ STATUS: 201 Created\n";
    apiResponse.textContent += `${JSON.stringify(demoData.created[0], null, 2)}\n`;
    apiResponse.textContent += "----------------------------------------------------------------------\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    await delay(1000);

    // 4. Passo 3: Débito
    steps.debito.classList.add("active");
    steps.debito.querySelector(".step-icon").textContent = "●";
    
    apiResponse.textContent += "\n[PASSO 3] CRIAR LANÇAMENTO DÉBITO\n";
    apiResponse.textContent += "➔ POST http://localhost:5101/api/lancamentos\n";
    apiResponse.textContent += "⚡ Status: Enviando Débito (R$ 125,50)...\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    await delay(600);
    
    steps.debito.classList.remove("active");
    steps.debito.classList.add("success");
    steps.debito.querySelector(".step-icon").textContent = "✔";
    
    apiResponse.textContent += "✔ STATUS: 201 Created\n";
    apiResponse.textContent += `${JSON.stringify(demoData.created[1], null, 2)}\n`;
    apiResponse.textContent += "----------------------------------------------------------------------\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    await delay(1000);

    // 5. Passo 4: Consolidado (Polling e Sincronização RabbitMQ)
    steps.consolidado.classList.add("active");
    steps.consolidado.querySelector(".step-icon").textContent = "●";
    
    apiResponse.textContent += "\n[PASSO 4] CONCORDÂNCIA DO SALDO (CONSISTÊNCIA EVENTUAL VIA RABBITMQ)\n";
    apiResponse.textContent += `➔ GET http://localhost:5102/api/consolidado?data=${demoData.date}\n`;
    apiResponse.textContent += "⚡ Status: Verificando replicação assíncrona...";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    const totalAttempts = demoData.attempts || 1;
    for (let i = 1; i <= totalAttempts; i++) {
      await delay(400);
      if (i > 1) {
        apiResponse.textContent += `\n... Tentativa ${i}/${totalAttempts}: Consultando saldo...`;
      } else {
        apiResponse.textContent += `\n... Tentativa 1/${totalAttempts}: Verificando RabbitMQ...`;
      }
      apiResponse.scrollTop = apiResponse.scrollHeight;
    }
    
    steps.consolidado.classList.remove("active");
    steps.consolidado.classList.add("success");
    steps.consolidado.querySelector(".step-icon").textContent = "✔";
    
    responseStatus.textContent = "200";
    responseStatus.style.color = "var(--acid)";
    
    apiResponse.textContent += "\n\n✔ STATUS: 200 OK (Consistência atingida!)\n";
    apiResponse.textContent += `${JSON.stringify(demoData.consolidated, null, 2)}\n`;
    apiResponse.textContent += "======================================================================\n";
    apiResponse.textContent += "➔ SIMULAÇÃO CONCLUÍDA COM SUCESSO!\n";
    apiResponse.scrollTop = apiResponse.scrollHeight;
    
    document.querySelector("#apiDate").value = demoData.date;

    // Habilita os botões de consulta de domínio
    document.querySelectorAll("[data-api-action='listarLancamentos'], [data-api-action='consultarConsolidado']").forEach(btn => {
      btn.disabled = false;
    });

  } catch (error) {
    const activeStep = Object.values(steps).find(step => step.classList.contains("active"));
    if (activeStep) {
      activeStep.classList.remove("active");
      activeStep.classList.add("error");
      activeStep.querySelector(".step-icon").textContent = "✘";
    } else {
      steps.consolidado.classList.add("error");
      steps.consolidado.querySelector(".step-icon").textContent = "✘";
    }
    
    responseStatus.textContent = "ERR";
    responseStatus.style.color = "var(--red)";
    apiResponse.textContent += `\n\n❌ ERRO NA EXECUÇÃO:\n${error.message}\n`;
    apiResponse.scrollTop = apiResponse.scrollHeight;
  } finally {
    responseTime.textContent = `${Math.round(performance.now() - started)} ms`;
    button.disabled = false;
  }
}

function buildDiagramExplorer() {
  const container = document.querySelector("#diagramButtons");
  const image = document.querySelector("#diagramImage");
  const stage = document.querySelector("#diagramStage");
  diagrams.forEach((diagram, index) => {
    const button = document.createElement("button");
    button.type = "button";
    
    const number = document.createElement("span");
    number.className = "diagram-number";
    number.textContent = diagram[0];
    
    const label = document.createTextNode(diagram[1]);
    
    const infoBtn = document.createElement("span");
    infoBtn.className = "info-btn";
    infoBtn.textContent = "[ INFO ]";
    infoBtn.addEventListener("click", (e) => {
      window.toggleDescription(diagram[3], e);
    });
    
    button.append(number, label, infoBtn);
    button.classList.toggle("is-active", index === 0);
    button.addEventListener("click", () => {
      selectedDiagram = diagram;
      image.src = diagramUrl(diagram[2]);
      image.alt = diagram[1];
      stage.setAttribute("aria-label", `Abrir diagrama ${diagram[1]} no visualizador`);
      [...container.querySelectorAll("button")].forEach((item) => item.classList.toggle("is-active", item === button));
    });
    
    const panel = document.createElement("div");
    panel.className = "test-desc-panel";
    panel.id = `desc-${diagram[3]}`;
    
    const rowOque = document.createElement("div");
    rowOque.className = "test-desc-row";
    rowOque.innerHTML = `<strong>O que é:</strong><span>${diagram[4]}</span>`;
    
    const rowServe = document.createElement("div");
    rowServe.className = "test-desc-row";
    rowServe.innerHTML = `<strong>Para que serve:</strong><span>${diagram[5]}</span>`;
    
    const rowProp = document.createElement("div");
    rowProp.className = "test-desc-row";
    rowProp.innerHTML = `<strong>Propósito:</strong><span>${diagram[6]}</span>`;
    
    panel.append(rowOque, rowServe, rowProp);
    
    container.append(button, panel);
  });
}

/* ── Lógica do Efeito Three.js no Slide 0 ──────────────────────────── */
let profileThreeJsActive = false;
let profileAnimFrameId = null;
let profileRenderer, profileScene, profileCamera, profileParticles, profileLines;
let profileMouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const PARTICLE_COUNT = 85;
const MAX_DISTANCE = 85;
let velocities = [];

function initProfileThreeJs() {
  const canvas = document.getElementById("profile-canvas");
  if (!canvas) return;

  const container = canvas.parentElement;
  
  // Criar cena
  profileScene = new THREE.Scene();
  
  // Criar câmera
  profileCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  profileCamera.position.z = 250;

  // Criar renderizador
  profileRenderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  profileRenderer.setSize(container.clientWidth, container.clientHeight);
  profileRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Geometria das partículas
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  velocities = [];
  
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Distribuir na área 3D
    positions[i * 3] = (Math.random() - 0.5) * 350;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

    velocities.push({
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
      z: (Math.random() - 0.5) * 0.4
    });
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Material das partículas - usando cor ciano
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x21d7ff,
    size: 3.5,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  profileParticles = new THREE.Points(particleGeometry, particleMaterial);
  profileScene.add(profileParticles);

  // Criar material para as conexões (linhas)
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x70a3b5,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending
  });

  // Criar geometria para as linhas dinamicamente
  const linePositions = new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  profileLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  profileScene.add(profileLines);

  // Escutar mouse no slide 0
  const slide = document.querySelector(".frame-profile");
  if (slide) {
    slide.addEventListener("mousemove", (e) => {
      const rect = slide.getBoundingClientRect();
      profileMouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      profileMouse.targetY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    
    slide.addEventListener("mouseleave", () => {
      profileMouse.targetX = 0;
      profileMouse.targetY = 0;
    });
  }

  // Iniciar animação se for o slide ativo (ou se iniciar no slide 0)
  const hashIndex = Number(location.hash.slice(1)) - 1;
  const initialIndex = Number.isInteger(hashIndex) && hashIndex >= 0 && hashIndex < frames.length ? hashIndex : 0;
  
  if (initialIndex === 0) {
    profileThreeJsActive = true;
    animateProfile();
  }

  // Tratar resize do canvas
  window.addEventListener("resize", () => {
    if (!profileScene || !container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    profileCamera.aspect = w / h;
    profileCamera.updateProjectionMatrix();
    profileRenderer.setSize(w, h);
  });
}

function animateProfile() {
  if (!profileThreeJsActive) return;
  profileAnimFrameId = requestAnimationFrame(animateProfile);

  const positions = profileParticles.geometry.attributes.position.array;
  const linePos = profileLines.geometry.attributes.position.array;
  let lineIndex = 0;

  // Suavizar mouse
  profileMouse.x += (profileMouse.targetX - profileMouse.x) * 0.05;
  profileMouse.y += (profileMouse.targetY - profileMouse.y) * 0.05;

  // Rotacionar o grupo
  profileParticles.rotation.y = profileMouse.x * 0.18;
  profileParticles.rotation.x = -profileMouse.y * 0.18;
  profileLines.rotation.y = profileMouse.x * 0.18;
  profileLines.rotation.x = -profileMouse.y * 0.18;

  // Atualizar partículas
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    positions[i3] += velocities[i].x;
    positions[i3 + 1] += velocities[i].y;
    positions[i3 + 2] += velocities[i].z;

    if (Math.abs(positions[i3]) > 180) velocities[i].x *= -1;
    if (Math.abs(positions[i3 + 1]) > 110) velocities[i].y *= -1;
    if (Math.abs(positions[i3 + 2]) > 110) velocities[i].z *= -1;
  }

  // Conectar linhas
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const x1 = positions[i3];
    const y1 = positions[i3 + 1];
    const z1 = positions[i3 + 2];

    for (let j = i + 1; j < PARTICLE_COUNT; j++) {
      const j3 = j * 3;
      const x2 = positions[j3];
      const y2 = positions[j3 + 1];
      const z2 = positions[j3 + 2];

      const dx = x1 - x2;
      const dy = y1 - y2;
      const dz = z1 - z2;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < MAX_DISTANCE) {
        linePos[lineIndex++] = x1;
        linePos[lineIndex++] = y1;
        linePos[lineIndex++] = z1;
        linePos[lineIndex++] = x2;
        linePos[lineIndex++] = y2;
        linePos[lineIndex++] = z2;
      }
    }
  }

  profileParticles.geometry.attributes.position.needsUpdate = true;
  profileLines.geometry.attributes.position.needsUpdate = true;
  profileLines.geometry.setDrawRange(0, lineIndex / 3);

  profileRenderer.render(profileScene, profileCamera);
}

function setProfileAnimationState(active) {
  if (active === profileThreeJsActive) return;
  profileThreeJsActive = active;
  if (active) {
    if (profileAnimFrameId) cancelAnimationFrame(profileAnimFrameId);
    animateProfile();
  } else {
    if (profileAnimFrameId) {
      cancelAnimationFrame(profileAnimFrameId);
      profileAnimFrameId = null;
    }
  }
}

function initializeEvents() {
  document.querySelector("#nextButton").addEventListener("click", () => goTo(currentIndex + 1));
  document.querySelector("#prevButton").addEventListener("click", () => goTo(currentIndex - 1));
  document.querySelector("#overviewButton").addEventListener("click", showOverview);
  footerMapButton.addEventListener("click", () => overview ? goTo(currentIndex) : showOverview());
  document.querySelectorAll("[data-overview]").forEach((button) => button.addEventListener("click", showOverview));
  document.querySelectorAll("[data-next]").forEach((button) => button.addEventListener("click", () => goTo(currentIndex + 1)));
  frames.forEach((frame, index) => frame.addEventListener("click", (event) => {
    if (overview && !event.target.closest("button")) goTo(index);
  }));
  document.querySelectorAll("[data-diagram]").forEach((button) => button.addEventListener("click", () => showImage(button.dataset.diagram)));
  document.querySelectorAll("[data-swagger]").forEach((button) => button.addEventListener("click", () => showSwagger(button.dataset.swagger)));
  document.querySelectorAll("[data-run-test]").forEach((button) => button.addEventListener("click", () => runTest(button.dataset.runTest, button)));
  document.querySelectorAll("[data-api-action]").forEach((button) => button.addEventListener("click", () => apiCall(button.dataset.apiAction)));
  document.querySelector("#runDemoButton").addEventListener("click", runDemo);
  document.querySelector("#clearConsoleButton").addEventListener("click", () => {
    apiResponse.textContent = "{\n  \"mensagem\": \"Selecione uma chamada ou execute o fluxo completo.\"\n}";
    responseMethod.textContent = "READY";
    responseStatus.textContent = "--";
    responseStatus.style.color = "var(--muted)";
    responseTime.textContent = "0 ms";
    
    // Reseta todos os passos do stepper para o estado neutro (cinza)
    const steps = {
      jwt: document.querySelector("#step-jwt"),
      credito: document.querySelector("#step-credito"),
      debito: document.querySelector("#step-debito"),
      consolidado: document.querySelector("#step-consolidado")
    };
    Object.values(steps).forEach(step => {
      step.className = "stepper-step";
      step.querySelector(".step-icon").textContent = "○";
    });

    // Desabilita os botões de consulta de domínio novamente
    document.querySelectorAll("[data-api-action='listarLancamentos'], [data-api-action='consultarConsolidado']").forEach(btn => {
      btn.disabled = true;
    });
  });
  document.querySelector("#diagramStage").addEventListener("click", () => showImage(selectedDiagram[2], selectedDiagram[1]));
  document.querySelector("#openQuestions").addEventListener("click", showQuestions);
  document.querySelector("#openScaleSimulation").addEventListener("click", showScaleSimulation);
  document.querySelector("#closeDialog").addEventListener("click", () => mediaDialog.close());
  mediaDialog.addEventListener("click", (event) => { if (event.target === mediaDialog) mediaDialog.close(); });
  mediaDialog.addEventListener("close", () => {
    if (activeViewerCleanup) {
      activeViewerCleanup();
      activeViewerCleanup = null;
    }
  });
  liveStatus.addEventListener("click", () => {
    if (runningFromFile) location.assign(presentationUrl);
    else refreshStatus();
  });
  document.querySelector("#studyButton").addEventListener("click", (event) => {
    document.body.classList.toggle("study-mode");
    event.currentTarget.classList.toggle("is-active");
  });
  const infoDrawersMap = [
    { openBtn: "#openSecurityInfo", closeBtn: "#closeSecurityInfo", drawer: "#securityInfoDrawer" },
    { openBtn: "#openApiInfo", closeBtn: "#closeApiInfo", drawer: "#apiInfoDrawer" },
    { openBtn: "#openScaleInfo", closeBtn: "#closeScaleInfo", drawer: "#scaleInfoDrawer" },
    { openBtn: "#openEvolutionInfo", closeBtn: "#closeEvolutionInfo", drawer: "#evolutionInfoDrawer" },
    { openBtn: "#openProcessInfo", closeBtn: "#closeProcessInfo", drawer: "#processInfoDrawer" },
    { openBtn: "#glossaryButton", closeBtn: "#closeGlossary", drawer: "#glossaryDrawer" }
  ];

  function closeAllInfoDrawers() {
    infoDrawersMap.forEach(item => {
      const drawerEl = document.querySelector(item.drawer);
      if (drawerEl) {
        drawerEl.classList.remove("is-open");
        drawerEl.setAttribute("aria-hidden", "true");
      }
    });
    document.querySelectorAll(".icon-info-btn.is-active").forEach(btn => {
      btn.classList.remove("is-active");
    });
  }

  infoDrawersMap.forEach(item => {
    const openEl = document.querySelector(item.openBtn);
    const closeEl = document.querySelector(item.closeBtn);
    const drawerEl = document.querySelector(item.drawer);

    if (openEl && drawerEl) {
      openEl.addEventListener("click", (event) => {
        const isCurrentlyOpen = drawerEl.classList.contains("is-open");
        closeAllInfoDrawers();
        if (!isCurrentlyOpen) {
          drawerEl.classList.add("is-open");
          drawerEl.setAttribute("aria-hidden", "false");
          if (openEl.classList.contains("icon-info-btn")) {
            openEl.classList.add("is-active");
          }
          if (item.drawer === "#glossaryDrawer") {
            glossarySearch.focus();
          }
        }
      });
    }
    if (closeEl) {
      closeEl.addEventListener("click", () => {
        closeAllInfoDrawers();
      });
    }
  });
  glossarySearch.addEventListener("input", () => renderGlossary(glossarySearch.value));
  document.querySelector("#fullscreenButton").addEventListener("click", async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  });
  window.addEventListener("resize", () => overview ? showOverview() : goTo(currentIndex, { instant: true }));
  window.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea") || mediaDialog.open) return;
    if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); goTo(currentIndex + 1); }
    if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); goTo(currentIndex - 1); }
    if (event.key.toLowerCase() === "o") showOverview();
    if (event.key.toLowerCase() === "e") document.querySelector("#studyButton").click();
    if (event.key === "Escape" && overview) goTo(currentIndex);
  });
  window.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  window.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 70) goTo(currentIndex + (delta < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });

  window.addEventListener("hashchange", () => {
    const { index: targetIndex, diagramCode } = parseHash(location.hash);
    if (targetIndex !== currentIndex) {
      goTo(targetIndex);
    }
    if (targetIndex === 7 && diagramCode) {
      const btn = [...document.querySelectorAll("#diagramButtons button")].find(b => b.querySelector("span")?.textContent === diagramCode);
      if (btn) btn.click();
    }
  });
}

function parseHash(hash) {
  if (!hash) return { index: 0, diagramCode: null };
  let cleanHash = hash;
  let diagramCode = null;
  if (hash.includes("-")) {
    const parts = hash.split("-");
    cleanHash = parts[0];
    diagramCode = parts[1];
  }
  const hashIndex = Number(cleanHash.slice(1)) - 1;
  const index = Number.isInteger(hashIndex) && hashIndex >= 0 && hashIndex < frames.length ? hashIndex : 0;
  return { index, diagramCode };
}

function initBackgroundMusic() {
  const bgMusic = document.querySelector("#bgMusic");
  const bgMusicToggle = document.querySelector("#bgMusicToggle");
  if (!bgMusic || !bgMusicToggle) return;

  const STORAGE_KEY = "fc_bg_music_v3";
  const savedState = localStorage.getItem(STORAGE_KEY);
  // Por padrão está DESATIVADO (false), a menos que o usuário tenha explicitamente ativado ('true')
  let isEnabled = savedState === "true";

  function updateAudioUI(active) {
    if (active) {
      bgMusicToggle.classList.add("is-playing");
      bgMusicToggle.classList.remove("is-paused");
      bgMusicToggle.setAttribute("title", "Música de fundo: Ativada (Clique para desativar)");
      const icon = bgMusicToggle.querySelector(".audio-icon");
      if (icon) icon.textContent = "🎵";
    } else {
      bgMusicToggle.classList.remove("is-playing");
      bgMusicToggle.classList.add("is-paused");
      bgMusicToggle.setAttribute("title", "Música de fundo: Desativada (Clique para ativar)");
      const icon = bgMusicToggle.querySelector(".audio-icon");
      if (icon) icon.textContent = "🔇";
    }
  }

  // Define o estado visual inicial com base no LocalStorage (padrão = desativado)
  updateAudioUI(isEnabled);

  if (isEnabled) {
    bgMusic.play().catch((err) => {
      console.warn("Aguardando primeira interação para reproduzir áudio salvo:", err);
      const playOnUserInteraction = () => {
        if (isEnabled && bgMusic.paused) {
          bgMusic.play().catch(() => {});
        }
        window.removeEventListener("click", playOnUserInteraction);
        window.removeEventListener("touchstart", playOnUserInteraction);
      };
      window.addEventListener("click", playOnUserInteraction, { once: true });
      window.addEventListener("touchstart", playOnUserInteraction, { once: true });
    });
  }

  // Alternância manual pelo clique no botão
  bgMusicToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isEnabled) {
      // Usuário desativa manualmente
      isEnabled = false;
      localStorage.setItem(STORAGE_KEY, "false");
      bgMusic.pause();
      updateAudioUI(false);
    } else {
      // Usuário ativa manualmente
      isEnabled = true;
      localStorage.setItem(STORAGE_KEY, "true");
      updateAudioUI(true);
      bgMusic.play().catch((err) => {
        console.error("Erro ao iniciar áudio pelo botão:", err);
      });
    }
  });
}

function init() {
  initializeFileMode();
  placeFrames();
  buildDots();
  buildDiagramExplorer();
  renderGlossary();
  initializeEvents();
  initBackgroundMusic();

  // Inicializar o canvas interativo no slide 0
  initProfileThreeJs();

  const { index: targetIndex, diagramCode } = parseHash(location.hash);
  goTo(targetIndex, { instant: true });
  if (targetIndex === 7 && diagramCode) {
    requestAnimationFrame(() => {
      const btn = [...document.querySelectorAll("#diagramButtons button")].find(b => b.querySelector("span")?.textContent === diagramCode);
      if (btn) btn.click();
    });
  }
  const today = new Date();
  document.querySelector("#apiDate").value = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  refreshStatus();
  healthTimer = window.setInterval(refreshStatus, 10_000);
}

window.toggleDescription = function(id, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const panel = document.getElementById("desc-" + id);
  const btn = event ? event.currentTarget : null;
  if (!panel) return;
  
  const isOpen = panel.classList.contains("is-open");
  if (isOpen) {
    panel.classList.remove("is-open");
    if (btn) btn.classList.remove("is-active");
  } else {
    // Fechar outros painéis abertos para agir como um acordeão
    document.querySelectorAll(".test-desc-panel.is-open").forEach(other => {
      other.classList.remove("is-open");
    });
    document.querySelectorAll(".info-btn.is-active").forEach(otherBtn => {
      otherBtn.classList.remove("is-active");
    });
    
    panel.classList.add("is-open");
    if (btn) btn.classList.add("is-active");
  }
};

window.addEventListener("beforeunload", () => window.clearInterval(healthTimer));
init();
