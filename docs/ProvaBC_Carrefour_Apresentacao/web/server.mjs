import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env.FLUXO_CAIXA_ROOT
  ? path.resolve(process.env.FLUXO_CAIXA_ROOT)
  : path.resolve(appRoot, "..", "..", "..");
const scriptsRoot = path.join(projectRoot, "scripts");
const diagramsRoot = path.join(projectRoot, "docs", "diagrams");
const host = "127.0.0.1";
const port = Number(process.env.APRESENTACAO_PORT || 4177);
const maxBodyBytes = 1_000_000;
const jobs = new Map();
let activeJobId = null;

const testCatalog = {
  smoke: { label: "Smoke CRUD + segurança", script: "Test-Smoke.ps1", args: [] },
  resilience: { label: "Queda do consolidado", script: "Test-Resilience.ps1", args: [] },
  outbox: { label: "Queda do RabbitMQ", script: "Test-Outbox.ps1", args: [] },
  load: {
    label: "Carga 50 req/s",
    script: "Test-Load.ps1",
    args: ["-RequestsPerSecond", "50", "-DurationSeconds", "10"],
  },
  dependencies: { label: "Auditoria NuGet", script: "Test-Dependencies.ps1", args: [] },
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function sendText(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(value),
    "Cache-Control": "no-store",
  });
  response.end(value);
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBodyBytes) {
      throw new Error("Corpo da requisição excede o limite local.");
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createLocalToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: "apresentacao-local",
      name: "Apresentação Local",
      role: "comerciante",
      iss: "FluxoCaixa",
      aud: "FluxoCaixaAPI",
      iat: now,
      nbf: now - 5,
      exp: now + 3600,
      jti: randomUUID(),
    }),
  );
  const unsigned = `${header}.${payload}`;
  const secret = process.env.JWT_SECRET_KEY || "CarrefourFluxoCaixaSecretKey2024!@#$%";
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

async function fetchJson(url, options = {}, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    return { ok: response.ok, status: response.status, data };
  } finally {
    clearTimeout(timer);
  }
}

async function getStatus() {
  const targets = [
    ["lancamentos", "http://127.0.0.1:5101/health"],
    ["consolidado", "http://127.0.0.1:5102/health"],
  ];
  const entries = await Promise.all(
    targets.map(async ([name, url]) => {
      const started = performance.now();
      try {
        const result = await fetchJson(url, {}, 3_000);
        return [name, { online: result.ok, status: result.status, latencyMs: Math.round(performance.now() - started), details: result.data }];
      } catch (error) {
        return [name, { online: false, status: 0, latencyMs: Math.round(performance.now() - started), error: error.message }];
      }
    }),
  );
  return { checkedAt: new Date().toISOString(), services: Object.fromEntries(entries) };
}

async function runDemo() {
  const token = createLocalToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const offset = Math.floor(Math.random() * 3_000);
  const date = new Date(Date.UTC(2160, 0, 1 + offset)).toISOString().slice(0, 10);
  const requests = [
    { tipo: 2, valor: 500, data: date, descricao: "Apresentação - crédito" },
    { tipo: 1, valor: 125.5, data: date, descricao: "Apresentação - débito" },
  ];
  const created = [];

  for (const body of requests) {
    const result = await fetchJson("http://127.0.0.1:5101/api/lancamentos", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!result.ok) {
      throw new Error(`Falha ao criar lançamento: HTTP ${result.status}`);
    }
    created.push(result.data);
  }

  let consolidated = null;
  const attempts = [];
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const result = await fetchJson(
      `http://127.0.0.1:5102/api/consolidado?data=${encodeURIComponent(date)}`,
      { headers: { Authorization: `Bearer ${token}` } },
      4_000,
    );
    attempts.push({ attempt, status: result.status });
    if (
      result.ok &&
      Number(result.data?.dados?.totalCreditos) === 500 &&
      Number(result.data?.dados?.totalDebitos) === 125.5
    ) {
      consolidated = result.data;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  if (!consolidated) {
    throw new Error("O consolidado não convergiu dentro do prazo da demonstração.");
  }

  return { date, created, consolidated, attempts: attempts.length };
}

async function runApiRequest(payload) {
  const token = createLocalToken();
  const authHeaders = { Authorization: `Bearer ${token}` };
  const date = String(payload.date || "").trim();
  const routes = {
    lancamentosHealth: ["http://127.0.0.1:5101/health", {}],
    consolidadoHealth: ["http://127.0.0.1:5102/health", {}],
    listarLancamentos: [
      `http://127.0.0.1:5101/api/lancamentos?data=${encodeURIComponent(date)}`,
      { headers: authHeaders },
    ],
    consultarConsolidado: [
      `http://127.0.0.1:5102/api/consolidado?data=${encodeURIComponent(date)}`,
      { headers: authHeaders },
    ],
  };
  if (!routes[payload.action]) throw new Error("Ação de API não autorizada.");
  const [url, options] = routes[payload.action];
  return { url, ...(await fetchJson(url, options)) };
}

function emitJob(job, event, payload) {
  const entry = { event, payload, at: new Date().toISOString() };
  job.events.push(entry);
  if (job.events.length > 1_500) job.events.shift();
  for (const client of job.clients) {
    client.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  }
}

function startTest(testId) {
  const definition = testCatalog[testId];
  if (!definition) throw new Error("Teste não autorizado.");
  if (activeJobId) throw new Error("Já existe um teste em execução.");

  const id = randomUUID();
  const scriptPath = path.join(scriptsRoot, definition.script);
  const job = {
    id,
    testId,
    label: definition.label,
    status: "running",
    startedAt: new Date().toISOString(),
    events: [],
    clients: new Set(),
  };
  jobs.set(id, job);
  activeJobId = id;

  const command = [
    "[Console]::OutputEncoding=[Text.UTF8Encoding]::new();",
    `$ErrorActionPreference='Stop'; & '${scriptPath.replaceAll("'", "''")}' ${definition.args.join(" ")}`,
  ].join(" ");
  const psCmd = process.platform === "win32" ? "powershell.exe" : "pwsh";
  const child = spawn(psCmd, [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    command,
  ], { cwd: projectRoot, windowsHide: true });

  emitJob(job, "status", { status: "running", label: definition.label });
  child.stdout.on("data", (chunk) => emitJob(job, "log", chunk.toString("utf8")));
  child.stderr.on("data", (chunk) => emitJob(job, "log", chunk.toString("utf8")));
  child.on("error", (error) => emitJob(job, "log", `Falha ao iniciar: ${error.message}\n`));
  child.on("close", (code) => {
    job.status = code === 0 ? "passed" : "failed";
    job.finishedAt = new Date().toISOString();
    activeJobId = null;
    emitJob(job, "done", { status: job.status, exitCode: code });
    for (const client of job.clients) client.end();
    job.clients.clear();
  });

  while (jobs.size > 8) {
    const oldest = jobs.keys().next().value;
    if (oldest !== activeJobId) jobs.delete(oldest);
    else break;
  }
  return job;
}

async function serveStatic(response, relativePath, root = appRoot) {
  const safeRelative = path.normalize(relativePath).replace(/^(\.\.(\\|\/|$))+/, "");
  const fullPath = path.resolve(root, safeRelative);
  if (!fullPath.startsWith(path.resolve(root))) {
    sendText(response, 403, "Acesso negado.");
    return;
  }
  try {
    const info = await stat(fullPath);
    if (!info.isFile()) throw new Error("not-file");
    const data = await readFile(fullPath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(fullPath).toLowerCase()] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": path.extname(fullPath) === ".png" ? "public, max-age=60" : "no-cache",
    });
    response.end(data);
  } catch {
    sendText(response, 404, "Arquivo não encontrado.");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/status") {
      sendJson(response, 200, await getStatus());
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/demo") {
      sendJson(response, 200, { ok: true, result: await runDemo() });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/request") {
      sendJson(response, 200, await runApiRequest(await readJsonBody(request)));
      return;
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/tests/")) {
      const testId = decodeURIComponent(url.pathname.split("/").pop());
      const job = startTest(testId);
      sendJson(response, 202, { jobId: job.id, label: job.label });
      return;
    }
    if (request.method === "GET" && /^\/api\/jobs\/[^/]+\/events$/.test(url.pathname)) {
      const jobId = url.pathname.split("/")[3];
      const job = jobs.get(jobId);
      if (!job) {
        sendJson(response, 404, { error: "Execução não encontrada." });
        return;
      }
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      for (const entry of job.events) {
        response.write(`event: ${entry.event}\ndata: ${JSON.stringify(entry.payload)}\n\n`);
      }
      if (job.status === "running") {
        job.clients.add(response);
        request.on("close", () => job.clients.delete(response));
      } else {
        response.end();
      }
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/project-diagrams/")) {
      await serveStatic(response, decodeURIComponent(url.pathname.slice("/project-diagrams/".length)), diagramsRoot);
      return;
    }
    if (request.method === "GET") {
      const relative = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      await serveStatic(response, relative);
      return;
    }
    sendJson(response, 405, { error: "Método não permitido." });
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Erro local inesperado." });
  }
});

server.listen(port, host, () => {
  console.log(`Apresentação FluxoCaixa disponível em http://${host}:${port}`);
  console.log(`Projeto consultado em ${projectRoot}`);
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
