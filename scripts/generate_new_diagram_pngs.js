import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const pumlDir = path.join(projectRoot, "docs", "diagrams", "PUML");
const diagramsDir = path.join(projectRoot, "docs", "diagrams");

const targetDiagrams = [
  { puml: "09-observabilidade-distribuida.puml.txt", png: "09-observabilidade-distribuida.png" },
  { puml: "10-seguranca-borda-secrets.puml.txt", png: "10-seguranca-borda-secrets.png" },
  { puml: "11-pipeline-cicd-dlq-audit.puml.txt", png: "11-pipeline-cicd-dlq-audit.png" },
];

async function renderDiagram(pumlFile, pngFile) {
  const pumlPath = path.join(pumlDir, pumlFile);
  const pngPath = path.join(diagramsDir, pngFile);

  console.log(`Lendo ${pumlFile}...`);
  const code = await readFile(pumlPath, "utf-8");

  console.log(`Renderizando via Kroki API...`);
  const response = await fetch("https://kroki.io/plantuml/png", {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: code,
  });

  if (!response.ok) {
    throw new Error(`Falha na Kroki API (${response.status}): ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await writeFile(pngPath, buffer);
  console.log(`✅ Salvo com sucesso em ${pngFile} (${buffer.length} bytes)`);
}

async function main() {
  for (const item of targetDiagrams) {
    try {
      await renderDiagram(item.puml, item.png);
    } catch (err) {
      console.error(`❌ Erro ao processar ${item.puml}:`, err);
      process.exitCode = 1;
    }
  }
}

main();
