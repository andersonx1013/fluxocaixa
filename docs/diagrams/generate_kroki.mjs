import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const diagramsToGenerate = [
  {
    filename: '12-processo-e2e-bpmn.png',
    type: 'plantuml',
    format: 'png',
    source: `@startuml
skinparam backgroundColor #ffffff
skinparam shadowing false
skinparam fontName Arial
skinparam fontSize 13

skinparam actor {
    BackgroundColor #f0f4f8
    BorderColor #0a192f
    FontColor #0a192f
}
skinparam participant {
    BackgroundColor #e6f0ff
    BorderColor #0055ff
    FontColor #001133
    FontSize 13
    FontStyle bold
}
skinparam sequence {
    ArrowColor #0055ff
    ArrowFontColor #001133
    ArrowFontSize 12
    ActorBorderColor #0a192f
    LifeLineBorderColor #0055ff
    LifeLineBackgroundColor #ffffff
    BoxBorderColor #008800
    BoxFontColor #004400
    BoxFontSize 12
}

actor Operador as "🏪 Comerciante / PDV"
participant Conciliacao as "📊 Motor de Conciliação"
participant Tesouraria as "🏛️ Tesouraria & Risco"
participant ERP as "💼 ERP Contábil Corporativo"

autonumber
box "1. OPERAÇÃO DIÁRIA DE CAIXA" #eef9ee
Operador -> Operador: Lança Entradas (Vendas) e Saídas (Despesas)
Operador -> Conciliacao: Solicita Posição do Fluxo de Caixa
Conciliacao --> Operador: Retorna Saldo Consolidado em Tempo Real
end box

box "2. FECHAMENTO DE TURNO & AUDITORIA" #fff4ee
Operador -> Conciliacao: Executa Fechamento do Dia
Conciliacao -> Tesouraria: Envia Apuração do Saldo Diário
Tesouraria -> ERP: Registra Lançamentos no Livro Razão
end box
@enduml`
  },
  {
    filename: '13-mapa-capacidades.png',
    type: 'plantuml',
    format: 'png',
    source: `@startwbs
skinparam backgroundColor #ffffff
skinparam useLineStyle true
skinparam shadowing false
skinparam wbs {
    BackgroundColor #f0f4f8
    BorderColor #0a192f
    FontColor #000000
    FontName Arial
    FontSize 13
    LineColor #0055ff
}
* <color:#0a192f><b>[ECOSSISTEMA CORPORATIVO CARREFOUR]</b></color>
** <color:#cc2200><b>1. DOMÍNIO COMERCIAL / PDV</b></color>
*** <color:#000000>Frente de Loja & E-commerce</color>
*** <color:#000000>Captura de Vendas e Cobranças</color>
** <color:#008800><b>2. DOMÍNIO FINANCEIRO (FLUXOCAIXA)</b></color>
*** <color:#000000>Gestão de Lançamentos Diários</color>
*** <color:#000000>Motor de Consolidação de Saldo</color>
*** <color:#000000>Apuração em Tempo Real</color>
** <color:#0055ff><b>3. DOMÍNIO CORPORATIVO / ERP & BI</b></color>
*** <color:#000000>ERP Contábil (Livro Razão & Fiscal)</color>
*** <color:#000000>Dashboards Executivos de Tesouraria</color>
@endwbs`
  },
  {
    filename: '14-ritmos-negocio-pace-layered.png',
    type: 'graphviz',
    format: 'png',
    source: `digraph BusinessGovernance {
    bgcolor="#ffffff";
    pad="0.6";
    rankdir=TB;
    node [shape=box, style="filled,rounded", fontname="Arial", fontsize=12, margin="0.3,0.15"];
    
    subgraph cluster_critico {
        label = "1. CRITICIDADE VITAL (Continuidade de Vendas)";
        style="filled,dashed"; color="#cc2200"; fillcolor="#fff0ee"; fontcolor="#cc2200"; fontname="Arial"; fontsize=13;
        PDV [label="Operação de Caixa & Registro de Lançamentos\\n(Risco: Perda de Faturamento | SLA: Zero Downtime)", fillcolor="#ffe5e0", fontcolor="#000000", stroke="#cc2200", penwidth=2];
    }
    
    subgraph cluster_medio {
        label = "2. CRITICIDADE MÉDIA (Apoio à Decisão)";
        style="filled,dashed"; color="#008800"; fillcolor="#eef9ee"; fontcolor="#008800"; fontname="Arial"; fontsize=13;
        Saldo [label="Consulta de Saldo Consolidado Diário\\n(Risco: Atraso Informativo | SLA: Tolerância de Minutos)", fillcolor="#e0f5e0", fontcolor="#000000", stroke="#008800", penwidth=2];
    }
    
    subgraph cluster_baixo {
        label = "3. CRITICIDADE DIFERIDA (Fechamento Fiscal)";
        style="filled,dashed"; color="#0055ff"; fillcolor="#eef4ff"; fontcolor="#0055ff"; fontname="Arial"; fontsize=13;
        ERP [label="Integração Contábil & Fechamento no ERP\\n(Risco: Retrabalho Noturno | SLA: Processamento Batch)", fillcolor="#d9e6ff", fontcolor="#000000", stroke="#0055ff", penwidth=2];
    }
    
    PDV -> Saldo [label=" Alimenta Posição", fontcolor="#008800", color="#008800", penwidth=2];
    Saldo -> ERP [label=" Fechamento Diário", fontcolor="#0055ff", color="#0055ff", penwidth=2];
}`
  }
];

async function generate() {
  for (const diagram of diagramsToGenerate) {
    console.log(`Gerando ${diagram.filename} com fundo branco nítido via Kroki API...`);
    try {
      const response = await fetch(`https://kroki.io/${diagram.type}/${diagram.format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagram_source: diagram.source,
          diagram_type: diagram.type,
          output_format: diagram.format
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const targetPath = path.join(__dirname, diagram.filename);
      fs.writeFileSync(targetPath, buffer);
      console.log(`✅ Salvo com fundo branco nítido: ${targetPath} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`❌ Erro ao gerar ${diagram.filename}:`, err);
    }
  }
}

generate();
