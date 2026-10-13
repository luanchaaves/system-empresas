# 🤖 Sistema de Geração Automática de Contratos — Robo Led Partner

Sistema profissional, completo e local-first desenvolvido para a empresa **Robo Led Partner**, especializado na criação, gerenciamento, pré-visualização e geração automática de contratos de prestação de serviços com exportação em PDF de alta resolução e armazenamento em banco de dados SQLite local.

---

## 🌟 Principais Funcionalidades

- **🎭 Suporte aos Dois Modelos Oficiais de Contrato**:
  - **Robô LED**: Performance com lasers, efeitos visuais, operador/artista e interação com os convidados.
  - **Personagens Vivos**: Animação com cosplay/artísticos (ex: *Homem-Aranha*, *Mickey*, *La Casa de Papel*...), quantidade de personagens e parágrafo único de interpretação artística.
- **⚡ Live Preview em Tempo Real**: Pré-visualização instantânea do contrato em formato A4 diretamente na tela antes de salvar.
- **📄 Geração Profissional de PDF com Puppeteer**: Documentos gerados com resolução impecável, cabeçalho degradê magenta/neon da marca, diagramação idêntica ao modelo físico e armazenamento estruturado por ano/mês (`data/contracts/YYYY/MM/`).
- **💰 Cálculo Financeiro Automático (40% / 60%)**:
  - 40% na assinatura do contrato como sinal.
  - 60% no dia do evento.
  - Cálculo executado em centavos inteiros com garantia de soma exata $V_{entrada} + V_{restante} = V_{total}$.
- **🛡️ Validação Estrita de CPF**: Algoritmo oficial dos dois dígitos verificadores da Receita Federal com máscara de digitação e autocomplete de clientes cadastrados.
- **⏰ Cálculo Automático de Término de Evento**: Cálculo dinâmico do horário final baseado na hora de início e duração (ex: 20:00 + 2h = 22:00).
- **📋 Gestão e Histórico Completo de Contratos**:
  - Busca em tempo real por nome do cliente, CPF ou número do contrato.
  - Filtros por tipo de atração e status (Gerado, Finalizado, Rascunho, Cancelado).
  - Ações rápidas: **Visualizar Prévia**, **Baixar PDF**, **Gerar Novamente**, **Duplicar Contrato** (gera novo número sequencial mantendo dados cadastrais), **Editar** e **Excluir**.
- **⚙️ Configurações da Empresa**: Gestão dinâmica dos dados fixos da contratada (Razão Social, Responsável, CNPJ, Endereço e Comarca de Foro).
- **📊 Dashboard de Operações**: Métricas de faturamento contratado, total de contratos, contadores de Robô LED vs Personagens e cronograma de próximos eventos.

---

## 🏗️ Arquitetura Tecnológica

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interface moderna, responsiva, com tema escuro e detalhes neon da marca. |
| **Estilização** | TailwindCSS 3 + Lucide Icons | Design system elegante com feedback visual e micro-interações. |
| **Backend** | Node.js + Express + TypeScript | API REST estruturada em controllers, services e repositories. |
| **Banco de Dados** | SQLite Nativo (`node:sqlite`) | Armazenamento local rápido, sem necessidade de servidores externos. |
| **Motor de PDF** | Puppeteer Headless (Chrome) | Renderização precisa em A4 com logotipo embutido em Base64. |
| **Testes** | Vitest | Suíte de testes automatizados para regras matemáticas, CPF, templates e PDF. |

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- **Node.js**: Versão 22 ou superior (recomendado Node.js v24).
- **NPM**: Versão 10 ou superior.

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Popular Banco de Dados com Dados de Demonstração (Opcional)
```bash
npm run seed
```

### 4. Iniciar em Modo de Desenvolvimento
Para rodar o Frontend e o Backend simultaneamente:
```bash
npm run dev
```
- **Frontend (Vite)**: [http://localhost:5173](http://localhost:5173)
- **Backend API (Express)**: [http://localhost:3001](http://localhost:3001)

### 5. Compilar para Produção
```bash
npm run build
npm start
```

### 6. Executar Testes Automatizados
```bash
npm test
```

### 7. Executar Testes de Aceitação Ponta a Ponta
```bash
npx tsx scripts/acceptance-test.ts
```

---

## 📂 Estrutura de Diretórios

```
sistema-contrato/
├── data/
│   ├── contracts/               # PDFs gerados salvos por YYYY/MM/
│   └── database.sqlite          # Banco de dados relacional SQLite
├── docs/                        # Documentação técnica aprofundada
│   ├── architecture.md          # Arquitetura detalhada do sistema
│   ├── business-rules.md        # Regras de negócio e cálculos
│   ├── contract-templates.md    # Referência jurídica dos modelos
│   └── pdf-generation.md        # Pipeline de renderização do Puppeteer
├── public/
│   └── logo.png                 # Logotipo oficial da Robo Led Partner
├── scripts/
│   └── acceptance-test.ts       # Script de testes ponta a ponta
├── src/
│   ├── client/                  # Frontend SPA React
│   │   ├── api/                 # Cliente HTTP tipado
│   │   ├── components/          # Componentes de UI reutilizáveis
│   │   ├── context/             # ToastContext e notificações
│   │   ├── layouts/             # Layout principal e Sidebar
│   │   ├── pages/               # Dashboard, NovoContrato, Contratos, Configurações
│   │   └── styles/              # CSS global e Tailwind
│   ├── domain/                  # Lógica de domínio pura (sem frameworks)
│   │   ├── calculations.ts      # Cálculos 40/60, horários e BRL
│   │   ├── cpf.ts               # Validador oficial e formatador de CPF
│   │   ├── date.ts              # Manipulação de datas em português
│   │   ├── number-generator.ts  # Gerador sequencial RLP-YYYY-NNNNNN
│   │   └── sanitizer.ts         # Sanitização de nomes de arquivos
│   ├── pdf/
│   │   └── generator.ts         # Motor de renderização Puppeteer
│   ├── server/                  # Backend Express
│   │   ├── controllers/         # Controladores da API REST
│   │   ├── db/                  # Inicialização do SQLite e Repositórios
│   │   ├── routes/              # Roteamento da API
│   │   └── services/            # Serviços de orquestração de contratos
│   ├── templates/               # Templates HTML/CSS dos contratos
│   │   ├── common/              # Estilos A4 e conversão de Logo Base64
│   │   ├── robo-led/            # Template oficial do Robô LED
│   │   └── personagens/         # Template oficial de Personagens Vivos
│   └── types/                   # Interfaces e tipos TypeScript globais
└── tests/                       # Suíte de testes com Vitest
    ├── calculations.test.ts
    ├── cpf.test.ts
    ├── dates-duration.test.ts
    ├── pdf-generation.test.ts
    └── templates.test.ts
```

---

## 📋 Regras Comerciais & Padrões

1. **Formato do Número de Contrato**: `RLP-YYYY-NNNNNN` (ex: `RLP-2026-000001`).
2. **Condição Comercial Padrão**: 40% na assinatura e 60% no dia do evento.
3. **Multa por Atraso no Pagamento**: 2% + juros de 1% ao mês.
4. **Cancelamento (< 7 dias)**: Multa de 40% do valor total contratado.
5. **Tolerância de Atraso no Evento**: 30 minutos.
6. **Dados Oficiais da Empresa (Padrão)**:
   - **Empresa**: Robo Led Partner
   - **Responsável**: Luan Chaves Bispo
   - **CNPJ**: 66.560.196/0001-87
   - **Endereço**: Rua Senador Mario mota n230 - Sao Bernardo do campo
   - **Cidade**: São Bernardo do Campo / SP

---

## 🔒 Segurança e Privacidade
- Sistema 100% **local-first**: Nenhum dado de clientes, contratos ou financeiro é compartilhado com serviços em nuvem externos.
- Banco de dados SQLite local em arquivo único (`data/database.sqlite`).
- Geração de PDF offline utilizando assets embutidos em Base64.
