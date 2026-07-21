# 🏦 FluxoCaixa — Arquitetura de Microsserviços e Consolidação Financeira

![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat&logo=dotnet)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-AMQP-FF6600?style=flat&logo=rabbitmq)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=flat&logo=redis)

Solução robusta e resiliente desenvolvida em **.NET 8** para gestão de lançamentos financeiros (débitos e créditos) e consolidação analítica de saldo diário. Projetada sob os princípios de **Clean Architecture**, **CQRS**, **Transactional Outbox**, **Idempotent Inbox** e tolerância ativa a falhas.

---

## 📺 Como Rodar a Apresentação Interativa (Quick Start)

O projeto conta com um **portal web interativo** (`http://127.0.0.1:4177`) que inicializa automaticamente os containers Docker, exibe a arquitetura C4, simuladores e permite executar testes ao vivo:

### 🪟 No Windows (CMD ou PowerShell)
```cmd
Iniciar-Apresentacao.cmd
```

### 🐧 No Linux / macOS (Terminal Bash)
```bash
chmod +x docs/ProvaBC_Carrefour_Apresentacao/Iniciar-Apresentacao.sh
./docs/ProvaBC_Carrefour_Apresentacao/Iniciar-Apresentacao.sh
```

---

## 📐 Arquitetura

O sistema é composto por dois microsserviços desacoplados com bancos de dados independentes e mensageria assíncrona:

![Arquitetura do Sistema de Fluxo de Caixa](docs/Infograficos/Vis%C3%A3o%20Geral.png)

- **API Lançamentos (`:5101`)**: Processa criações, edições e exclusões de débitos/créditos. Persiste eventos na mesma transação via **Transactional Outbox**.
- **API Consolidado (`:5102`)**: Projeção de leitura do saldo diário. Consome eventos de forma assíncrona com **Inbox Idempotente** e cache em **Redis**.

---

## 🚀 Subindo Apenas os Containers (Docker Compose)

Caso deseje subir apenas a infraestrutura backend sem a interface de apresentação visual:

```bash
docker compose up -d --build
```

---

## 🔗 Endpoints & Links Úteis

| Serviço | URL | Descrição |
|---|---|---|
| **Apresentação Web** | `http://127.0.0.1:4177` | Dashboard e simuladores visuais |
| **Swagger Lançamentos** | `http://localhost:5101/swagger` | Documentação OpenAPI de escritas |
| **Swagger Consolidado** | `http://localhost:5102/swagger` | Documentação OpenAPI de leituras |
| **RabbitMQ Dashboard** | `http://localhost:15674` | Painel da fila (`guest` / `guest`) |
| **Health Lançamentos** | `http://localhost:5101/health` | Liveness & Readiness da API |
| **Health Consolidado** | `http://localhost:5102/health` | Liveness & Readiness da API |

---

## 🧪 Testes & Validações

O projeto inclui scripts automatizados para validação de resiliência e carga:

```powershell
# Executar suíte completa de testes
.\scripts\Test-All.ps1

# Teste de resiliência (queda do RabbitMQ / Outbox)
.\scripts\Test-Outbox.ps1

# Teste de carga no consolidado
.\scripts\Test-Load.ps1 -RequestsPerSecond 50 -DurationSeconds 10
```

---

## 📚 Documentação Complementar

- 📋 [Requisitos e Evidências](docs/REQUISITOS.md)
- 🏛️ [Decisões Arquiteturais (ADRs)](docs/ADR.md)
- 🎯 [SLOs, RTO e RPO](docs/SLOS.md)
- 📖 [Glossário Técnico](docs/GLOSSARIO.md)
- 📊 [Diagramas C4 em Alta Resolução](docs/diagrams/)
- 🎨 [Infográficos de Arquitetura, SOLID e Design Patterns](docs/Infograficos/)
