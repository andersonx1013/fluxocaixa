# Apresentação Complementar do FluxoCaixa

Esta pasta fica em `C:\ProvaBC_Carrefour\docs\ProvaBC_Carrefour_Apresentacao` e faz parte da documentação complementar do projeto. Ela não altera nem é necessária para compilar ou executar a solução .NET.

## Início rápido

Opção mais simples para iniciar o ambiente e a apresentação:

### 🪟 No Windows (CMD ou PowerShell)

```cmd
:: Opção 1: Arquivo executável direto
Iniciar-Apresentacao.cmd

:: Opção 2: Via PowerShell
cd docs\ProvaBC_Carrefour_Apresentacao
.\Iniciar-Apresentacao.ps1
```

### 🐧 No Linux / macOS (Bash)

```bash
cd docs/ProvaBC_Carrefour_Apresentacao
chmod +x Iniciar-Apresentacao.sh Parar-Apresentacao.sh
./Iniciar-Apresentacao.sh
```

> [!NOTE]
> Não abra `web/index.html` diretamente para uma demonstração ao vivo. Se isso acontecer, a página tenta conectar em `http://127.0.0.1:4177`; com o servidor desligado, ela permanece navegável em modo offline e indica como iniciar os recursos interativos.

O script de inicialização realiza automaticamente:
1. Inicia os containers Docker da solução (`carrefour-fluxocaixa-prova`);
2. Inicia o servidor visual Node.js em `http://127.0.0.1:4177`;
3. Abre a apresentação interativa no seu navegador padrão.

#### Opções Adicionais de Inicialização:

- **Para não reexecutar o `docker compose up`**:
  - Windows: `.\Iniciar-Apresentacao.ps1 -SkipDocker`
  - Linux/macOS: `./Iniciar-Apresentacao.sh --skip-docker`

- **Para encerrar apenas o servidor visual da apresentação**:
  - Windows: `.\Parar-Apresentacao.ps1`
  - Linux/macOS: `./Parar-Apresentacao.sh`

*(Os containers Docker da prova continuam rodando em segundo plano até você executar `docker compose down` na raiz).*

## Navegação

| Controle | Ação |
|---|---|
| `Seta direita`, `Espaço` ou `PageDown` | próxima cena |
| `Seta esquerda` ou `PageUp` | cena anterior |
| `O` | visão geral estilo Prezi |
| botão `MAPA` no rodapé | abre ou fecha a visão geral em qualquer slide |
| `E` | mostra ou oculta notas de estudo |
| `A–Z` | abre o dicionário rápido |
| botão quadrado no topo | tela cheia |
| gesto horizontal | navegação em tela sensível ao toque |

A interface reorganiza os quadros em formato vertical para celulares e tablets em retrato. Em tablets e celulares na horizontal, ela preserva a composição ampla e reserva espaço para o cabeçalho e o rodapé fixos.

Durante ajustes visuais, `http://127.0.0.1:4177/responsive-preview.html` mostra simultaneamente as versões de celular e tablet e permite trocar o número do slide.

## Estações interativas

| Estação | O que demonstra |
|---|---|
| Swagger | abre as interfaces OpenAPI reais em `:5101` e `:5102` |
| Scripts | executa Smoke, Resiliência, Outbox, Carga ou auditoria NuGet com saída ao vivo |
| C4 | navega e amplia os oito diagramas, incluindo o cenário conceitual de escala horizontal |
| API Lab | realiza health checks, consultas e um fluxo crédito + débito + consolidado |

O C4 de escala horizontal é exclusivamente conceitual e não provisiona balanceador, réplicas ou serviços adicionais. Ele parte da solução implementada e documenta como as APIs, Outbox, consumidor, bancos, RabbitMQ e Redis evoluiriam. O fonte está em `docs\diagrams\PUML\07-deployment-producao.puml.txt` e a imagem reproduzida pela apresentação em `docs\diagrams\07-deployment-producao.png`.

Nesse slide, `SIMULAR COMPORTAMENTO` abre uma demonstração visual opcional dos estados normal, pico e falha. A simulação não chama as APIs, não altera dados e não representa containers ou réplicas realmente executados; sua finalidade é explicar como o balanceador retiraria uma instância sem readiness e redistribuiria o tráfego.

Ao ampliar um diagrama, o visualizador abre sempre em `AJUSTAR`, sem ampliar além do necessário. Ele oferece navegação anterior/próxima, ajuste à tela ou largura, tamanho real, zoom por controles/roda e movimentação por arraste ou toque.

O servidor aceita somente ações pré-definidas. Não há terminal arbitrário, URL arbitrária ou exposição de rede: ele escuta exclusivamente em `127.0.0.1`.

## Arquivos

| Arquivo/pasta | Finalidade |
|---|---|
| `web/` | apresentação HTML, estilos, lógica e servidor local |
| `FluxoCaixa-Apresentacao.pptx` | PowerPoint com a mesma narrativa |
| `ROTEIRO-DE-ESTUDO.md` | fala sugerida, perguntas e plano de demonstração |
| `Iniciar-Apresentacao.ps1` | inicialização do Docker e da experiência visual |
| `Parar-Apresentacao.ps1` | encerra somente o servidor visual |

## Pré-requisitos

- Docker Desktop;
- Node.js 18 ou superior;
- PowerShell 5.1 ou superior;
- projeto principal em `C:\ProvaBC_Carrefour`.

Não há `npm install`, dependências web externas, cloud ou coleta de dados.
