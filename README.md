# 🚀 EventMaster ERP — Sistema Completo de Gestão de Eventos, Contratos & Finanças

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-green?logo=node.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![SQLite](https://img.shields.io/badge/SQLite-node:sqlite-003B57?logo=sqlite)
![Puppeteer](https://img.shields.io/badge/Puppeteer-PDF%20Engine-brightgreen?logo=puppeteer)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![License](https://img.shields.io/badge/License-MIT-purple)

Sistema ERP e financeiro corporativo full-stack projetado para empresas de entretenimento, shows, eventos sociais/corporativos, robôs de LED e atrações artísticas. O sistema unifica o ciclo de vida completo da operação: **Agendamento de Eventos**, **Geração Automática de Contratos em PDF**, **Sincronização com Google Calendar**, **Fluxo de Caixa 40%/60%**, **Acompanhamento de Custos Operacionais Diretos** e **DRE Gerencial com Lucro Líquido Real**.

---

## 🌟 Módulos e Funcionalidades

### 1. 📊 Dashboard Executivo & Analytics
- **KPIs em Tempo Real**: Faturamento total, eventos realizados e confirmados, total de contratos emitidos e taxa de conversão.
- **Gráficos e Estatísticas**: Distribuição por tipo de atração, faturamento mensal, comparativo ano a ano e linha do tempo de eventos.
- **Filtros Temporais**: Análise por mês, ano e período customizado.

### 2. 📅 Gestão de Eventos & Google Calendar
- Agendamento completo com cliente, local, data, horários com cálculo de término automático e atrações contratadas.
- **Integração Google Calendar**: Criação de eventos na agenda, geração de links diretos de navegação no mapa e sincronização bidirecional.
- Status do evento: *Confirmado*, *Realizado*, *Pendente* ou *Cancelado*.

### 3. 📄 Emissão Automática de Contratos (PDF Engine)
- Geração de contratos formatados em **A4 profissional** com Puppeteer Headless.
- Modelos customizados com cláusulas jurídicas para:
  - **Robô de LED / Shows Tecnológicos**
  - **Personagens Vivos & Artistas**
- Cálculo automático das cláusulas financeiras (Entrada 40% + Restante 60% com divisão exata de centavos).
- Validação estrita de CPF com algoritmo oficial da Receita Federal.
- Armazenamento estruturado e download instantâneo do PDF.

### 4. 💰 Controle Financeiro & Fluxo de Caixa
- Geração automática de parcelas de Sinal (40%) e Saldo (60%) no ato do agendamento.
- Registro de baixas com forma de pagamento (PIX, Cartão, Dinheiro, Boleto, Transferência) e código de comprovante.
- Filtros por status de recebimento (*Pago*, *Pendente*, *Atrasado*).

### 5. 💸 Custos Operacionais por Evento
- Rastreamento dos custos variáveis diretos por evento:
  - **Cilindros de CO2**
  - **Gerbs / Fogos Indoor (Faísca Fria)**
  - **Combustível / Deslocamento**
  - **Pedágios**
  - **Vallet / Estacionamento**
  - **Ajudantes / Roadies** (com controle de status Pago/Pendente)
  - **Monitores de Personagem** (com controle de status Pago/Pendente)
- Cálculo automático de **Margem de Lucro por Evento (%)** e **Lucro Líquido Operacional**.

### 6. 📈 Compras, Investimentos & DRE Consolidado
- Registro e categorização de despesas:
  - **Investimentos** (Aquisição de robôs, estruturas, personagens)
  - **Melhorias** (Baterias, conectores, pistolas de efeitos, cases)
  - **Manutenção** (Pintura, solda, substituição de LEDs, trajes)
  - **Marketing** (Tráfego pago, panfletos, branding)
  - **Imprevistos**
- **DRE Operacional em Cascata**:
  - `(+) Receita Operacional Bruta`
  - `(-) Custos Variáveis Operacionais`
  - `(=) Lucro Bruto Operacional`
  - `(-) Despesas Estruturais e Marketing`
  - `(=) Lucro Operacional (EBITDA)`
  - `(-) Investimentos em Patrimônio`
  - `(=) Lucro Líquido Real`

### 7. 🎭 Catálogo de Atrações & Personagens
- Gestão visual de robôs de LED, personagens e serviços adicionais.
- Galeria de fotos, valores base, tempo de apresentação e personalizações.

---

## 🛠️ Arquitetura Tecnológica

| Camada | Tecnologia | Destaques |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interface Dark Glass Neon, responsiva (Desktop & Mobile) |
| **Estilização** | TailwindCSS 3 + Lucide Icons | Componentes modulares, animações fluidas e micro-interações |
| **Backend** | Node.js 22+ & Express | Arquitetura limpa (Controllers, Services, Repositories) |
| **Banco de Dados** | SQLite Nativo (`node:sqlite`) | Rápido, ACID compliant, sem overhead de configuração |
| **Geração de PDF** | Puppeteer Headless | Renderização vetorial e diagramação milimétrica A4 |
| **Testes** | Vitest | Testes unitários para cálculos financeiros, CPF e templates |
| **DevOps** | Docker + Docker Compose | Deploy em container pronto para produção |

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- **Node.js**: Versão 22 ou superior
- **NPM**: Versão 10 ou superior

### 2. Instalação
```bash
git clone https://github.com/luanchaaves/system-empresas.git
cd system-empresas
npm install
```

### 3. Execução em Desenvolvimento
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3001](http://localhost:3001)

### 4. Execução via Docker
```bash
docker compose up -d --build
```
Acesse em: [http://localhost:3001](http://localhost:3001)

### 5. Executar Suíte de Testes
```bash
npm test
```

---

## 📂 Estrutura de Diretórios

```
system-empresas/
├── data/
│   ├── contracts/               # PDFs gerados salvos por YYYY/MM/
│   └── database.sqlite          # Banco de dados relacional SQLite
├── docs/                        # Documentação técnica e regras de negócio
├── public/                      # Assets estáticos, logos e fotos das atrações
├── src/
│   ├── client/                  # SPA React 19 (Dashboard, Eventos, Contratos, Custos, DRE)
│   ├── domain/                  # Lógica de negócio pura (Cálculos 40/60, CPF, Horários)
│   ├── pdf/                     # Motor de renderização Puppeteer A4
│   ├── server/                  # API REST Express e Repositórios SQLite
│   ├── templates/               # Templates HTML/CSS e Estilos para Impressão
│   └── types/                   # Tipagens TypeScript globais
└── tests/                       # Suíte de testes automatizados com Vitest
```

---

## 🔒 Segurança e Privacidade
- Sistema 100% **local-first**: Nenhum dado de clientes, contratos ou financeiro é compartilhado com serviços em nuvem externos sem consentimento.
- Banco de dados SQLite local em arquivo único (`data/database.sqlite`).
- Geração de PDF offline utilizando assets embutidos em Base64.
- Ambiente com separação de configurações e suporte a Docker.

---

## 📄 Licença

Distribuído sob a licença MIT.
