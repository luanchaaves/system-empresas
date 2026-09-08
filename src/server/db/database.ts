import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  CompanyConfig,
  Client,
  EventDetails,
  EventAttraction,
  Attraction,
  FinancialEntry,
  Contract,
  AttractionType,
  AttractionCategory,
  EventStatus,
  EventType,
  ContractStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentInstallmentType,
  FinancialStats,
  DashboardStats,
  EventCost,
  GeneralExpense,
  ExpenseCategory,
  CostsSummaryDTO,
} from '../../types/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

// Garante que o diretório data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 5000;');

/**
 * Inicializa o banco de dados criando as tabelas unificadas e migrações seguras
 */
export function initDatabase(): void {
  // 1. Configuração da Empresa & Integrações
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      company_name TEXT NOT NULL DEFAULT 'Robo Led Partner',
      responsavel TEXT NOT NULL DEFAULT 'Carlos Henrique Silva',
      documento TEXT NOT NULL DEFAULT '12.345.678/0001-90',
      endereco TEXT NOT NULL DEFAULT 'Av. Paulista, 1500 - Bela Vista',
      telefone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      cidade TEXT NOT NULL DEFAULT 'São Paulo',
      estado TEXT NOT NULL DEFAULT 'SP',
      cep TEXT DEFAULT '',
      api_key TEXT DEFAULT 'demo_showcase_key_2026',
      google_calendar_enabled INTEGER DEFAULT 1,
      google_calendar_id TEXT DEFAULT 'eventos.agenda.demo@gmail.com',
      google_calendar_credentials TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações seguras de colunas em configuracoes
  try { db.exec('ALTER TABLE configuracoes ADD COLUMN api_key TEXT DEFAULT "demo_showcase_key_2026";'); } catch {}
  try { db.exec('ALTER TABLE configuracoes ADD COLUMN google_calendar_enabled INTEGER DEFAULT 1;'); } catch {}
  try { db.exec('ALTER TABLE configuracoes ADD COLUMN google_calendar_id TEXT DEFAULT "eventos.agenda.demo@gmail.com";'); } catch {}
  try { db.exec('ALTER TABLE configuracoes ADD COLUMN google_calendar_credentials TEXT DEFAULT "";'); } catch {}


  // 2. Clientes
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf TEXT NOT NULL,
      endereco TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
    CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
  `);

  // 3. Catálogo de Atrações & Personagens
  db.exec(`
    CREATE TABLE IF NOT EXISTS atracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL CHECK (categoria IN ('ROBO_LED', 'PERSONAGEM_VIVO', 'OUTRO')),
      descricao TEXT,
      valor_base REAL DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      foto_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_atracoes_categoria ON atracoes(categoria);
    CREATE INDEX IF NOT EXISTS idx_atracoes_ativo ON atracoes(ativo);
  `);

  // 4. Eventos
  db.exec(`
    CREATE TABLE IF NOT EXISTS eventos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      nome_evento TEXT,
      tipo_evento TEXT DEFAULT 'OUTRO',
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      horario_termino TEXT,
      endereco TEXT NOT NULL,
      cidade TEXT DEFAULT 'São Paulo',
      estado TEXT DEFAULT 'SP',
      cep TEXT,
      duracao REAL NOT NULL DEFAULT 2,
      status TEXT NOT NULL DEFAULT 'AGENDADO' CHECK (status IN ('AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'REALIZADO', 'CANCELADO')),
      valor_total REAL NOT NULL DEFAULT 0,
      observacoes TEXT,
      google_event_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrações seguras em eventos
  try { db.exec('ALTER TABLE eventos ADD COLUMN nome_evento TEXT;'); } catch {}
  try { db.exec("ALTER TABLE eventos ADD COLUMN tipo_evento TEXT DEFAULT 'OUTRO';"); } catch {}
  try { db.exec("ALTER TABLE eventos ADD COLUMN status TEXT NOT NULL DEFAULT 'AGENDADO';"); } catch {}
  try { db.exec('ALTER TABLE eventos ADD COLUMN valor_total REAL NOT NULL DEFAULT 0;'); } catch {}
  try { db.exec('ALTER TABLE eventos ADD COLUMN google_event_id TEXT;'); } catch {}

  // Índices em eventos
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos(data);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_eventos_cliente ON eventos(cliente_id);'); } catch {}


  // 5. Associação Evento <-> Atrações
  db.exec(`
    CREATE TABLE IF NOT EXISTS evento_atracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
      atracao_id INTEGER NOT NULL REFERENCES atracoes(id) ON DELETE CASCADE,
      quantidade INTEGER DEFAULT 1,
      valor_unitario REAL NOT NULL DEFAULT 0,
      observacoes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_evento_atracoes_evento ON evento_atracoes(evento_id);
  `);

  // 6. Contratos
  db.exec(`
    CREATE TABLE IF NOT EXISTS contratos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL CHECK (tipo IN ('ROBO_LED', 'PERSONAGEM')),
      cliente_id INTEGER NOT NULL REFERENCES clientes(id),
      evento_id INTEGER NOT NULL REFERENCES eventos(id),
      personagem TEXT,
      quantidade_personagens INTEGER DEFAULT 1,
      valor_total REAL NOT NULL,
      valor_entrada REAL NOT NULL,
      valor_restante REAL NOT NULL,
      percentual_entrada INTEGER DEFAULT 40,
      percentual_restante INTEGER DEFAULT 60,
      uso_imagem INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'GERADO' CHECK (status IN ('RASCUNHO', 'GERADO', 'FINALIZADO', 'CANCELADO')),
      pdf_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contratos(numero);
    CREATE INDEX IF NOT EXISTS idx_contratos_tipo ON contratos(tipo);
    CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);
  `);

  // 7. Lançamentos Financeiros (Fluxo de Caixa & Parcelas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
      contrato_id INTEGER REFERENCES contratos(id) ON DELETE SET NULL,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id),
      descricao TEXT NOT NULL,
      tipo_parcela TEXT NOT NULL CHECK (tipo_parcela IN ('ENTRADA', 'RESTANTE', 'AVULSO')),
      valor REAL NOT NULL,
      data_vencimento TEXT NOT NULL,
      data_pagamento TEXT,
      status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
      forma_pagamento TEXT CHECK (forma_pagamento IN ('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'OUTRO')),
      comprovante_ref TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lancamentos_evento ON lancamentos_financeiros(evento_id);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_contrato ON lancamentos_financeiros(contrato_id);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_status ON lancamentos_financeiros(status);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_vencimento ON lancamentos_financeiros(data_vencimento);
  `);

  // 8. Custos Diretos por Evento
  db.exec(`
    CREATE TABLE IF NOT EXISTS custos_evento (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evento_id INTEGER NOT NULL UNIQUE,
      cilindro REAL DEFAULT 0,
      gerb REAL DEFAULT 0,
      gasolina REAL DEFAULT 0,
      pedagio REAL DEFAULT 0,
      vallet REAL DEFAULT 0,
      ajudante REAL DEFAULT 0,
      pago_ajudante INTEGER DEFAULT 1,
      monitor REAL DEFAULT 0,
      pago_monitor INTEGER DEFAULT 0,
      status_custos TEXT DEFAULT 'PAGO',
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_custos_evento ON custos_evento(evento_id);
  `);

  // 9. Compras, Investimentos, Manutenção e Marketing
  db.exec(`
    CREATE TABLE IF NOT EXISTS despesas_gerais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item TEXT NOT NULL,
      fornecedor TEXT,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      pago INTEGER DEFAULT 1,
      tipo_gasto TEXT NOT NULL,
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_despesas_tipo ON despesas_gerais(tipo_gasto);
    CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas_gerais(data);
  `);

  // 10. Garante dados padrão da empresa
  const checkConfig = db.prepare('SELECT id FROM configuracoes WHERE id = 1').get() as { id: number } | undefined;
  if (!checkConfig) {
    db.prepare(`
      INSERT INTO configuracoes (id, company_name, responsavel, documento, endereco, cidade, estado, api_key)
      VALUES (1, 'Robo Led Partner', 'Carlos Henrique Silva', '12.345.678/0001-90', 'Av. Paulista, 1500 - Bela Vista', 'São Paulo', 'SP', 'demo_showcase_key_2026')
    `).run();
  }

  // 9. Seed e Sincronização Oficial de Atrações & Personagens (com fotos reais)
  const officialCatalog = [
    {
      nome: 'Robô Nextron LED',
      categoria: 'ROBO_LED',
      descricao: 'Robô de LED com 2,80m de altura, efeitos luminosos RGB/magenta, lasers e canhão de CO2.',
      valor_base: 550,
      foto_url: '/assets/attractions/robo-led-real.png',
      ativo: 1,
    },
    {
      nome: 'Robô Caveira Mexicana LED',
      categoria: 'ROBO_LED',
      descricao: 'Robô temático com Sombrero iluminado em LED vermelho, máscara de caveira com olhos acesos e peitoral neon.',
      valor_base: 650,
      foto_url: '/assets/attractions/caveira-mexicana.png',
      ativo: 1,
    },
    {
      nome: 'Robô Zeus LED (Em Construção)',
      categoria: 'ROBO_LED',
      descricao: 'Novo Robô Zeus LED Gigante de Alta Performance (Em breve no catálogo).',
      valor_base: 750,
      foto_url: '/assets/branding/robo-corpo-inteiro.png',
      ativo: 1,
    },
    {
      nome: 'Mickey Mouse',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Personagem vivo clássico Mickey Mouse em fraque de gala preto e gravata borboleta amarela para recepção e fotos.',
      valor_base: 500,
      foto_url: '/assets/attractions/mickey.jpg',
      ativo: 1,
    },
    {
      nome: 'Minnie Mouse',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Personagem viva Minnie Mouse com vestido vermelho de bolinhas brancas, laço e luvas.',
      valor_base: 500,
      foto_url: '/assets/attractions/minnie.jpg',
      ativo: 1,
    },
    {
      nome: 'Chase (Patrulha Canina)',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Pastor-alemão policial da Patrulha Canina com uniforme azul e quepe.',
      valor_base: 500,
      foto_url: '/assets/attractions/chase.jpg',
      ativo: 1,
    },
    {
      nome: 'Marshall (Patrulha Canina)',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Dálmata bombeiro da Patrulha Canina com capacete e uniforme vermelho de resgate.',
      valor_base: 500,
      foto_url: '/assets/attractions/marshall.jpg',
      ativo: 1,
    },
    {
      nome: 'Skye (Patrulha Canina)',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Cockapoo aviadora da Patrulha Canina com jaqueta rosa e orelhinhas amarelas.',
      valor_base: 500,
      foto_url: '/assets/attractions/skye.jpg',
      ativo: 1,
    },
    {
      nome: 'Sonic The Hedgehog',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Personagem vivo Sonic o ouriço em tamanho real com tênis vermelhos clássicos.',
      valor_base: 550,
      foto_url: '/assets/attractions/sonic.jpg',
      ativo: 1,
    },
    {
      nome: 'Homem-Aranha',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Super-herói Homem-Aranha acrobático para animação de pista, fotos e entrada de aniversariante.',
      valor_base: 500,
      foto_url: '/assets/attractions/homem-aranha.jpg',
      ativo: 1,
    },
    {
      nome: 'La Casa de Papel (Dupla)',
      categoria: 'PERSONAGEM_VIVO',
      descricao: 'Dupla de assaltantes temáticos com macacões vermelhos, máscaras de Salvador Dalí e maleta de dinheiro cenográfica.',
      valor_base: 700,
      foto_url: '/assets/attractions/la-casa-de-papel.jpg',
      ativo: 1,
    },
  ];

  for (const item of officialCatalog) {
    const existing = db.prepare('SELECT id FROM atracoes WHERE nome LIKE ? OR nome = ?').get(`%${item.nome.split(' ')[0]}%`, item.nome) as { id: number } | undefined;
    if (existing) {
      db.prepare(`
        UPDATE atracoes 
        SET nome = ?, categoria = ?, descricao = ?, valor_base = ?, foto_url = ?, ativo = ?
        WHERE id = ?
      `).run(item.nome, item.categoria, item.descricao, item.valor_base, item.foto_url, item.ativo, existing.id);
    } else {
      db.prepare(`
        INSERT INTO atracoes (nome, categoria, descricao, valor_base, foto_url, ativo)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(item.nome, item.categoria, item.descricao, item.valor_base, item.foto_url, item.ativo);
    }
  }

  // 10. Seed Automático da Programação de Eventos e Clientes (Planilhas)
  try {
    const { seedSheetEvents } = require('./seedSheetEvents.js');
    seedSheetEvents();
  } catch {
    // Caso seja ES module
    import('./seedSheetEvents.js')
      .then((m) => {
        m.seedSheetEvents();
        // Gera contratos padronizados se ainda não existirem
        const contractCount = (db.prepare('SELECT COUNT(*) as c FROM contratos').get() as { c: number }).c;
        if (contractCount === 0) {
          import('./generate-all-contracts.js').then((gc) => gc.generateAllContractsForEvents()).catch(() => {});
        }
      })
      .catch(() => {});
  }

  // 11. Seed de Custos de Eventos (#01 a #47) e Despesas Gerais / Compras
  try {
    seedCustosAndExpenses();
  } catch (err) {
    console.error('Erro ao rodar seed de custos:', err);
  }
}

// ==================== REPOSITÓRIOS ====================

export const CompanyRepository = {
  get(): CompanyConfig {
    try {
      const config = db.prepare('SELECT * FROM configuracoes WHERE id = 1').get() as unknown as CompanyConfig;
      if (config) return config;
    } catch {
      // fallback
    }
    return {
      id: 1,
      company_name: 'Robo Led Partner',
      responsavel: 'Carlos Henrique Silva',
      documento: '12.345.678/0001-90',
      endereco: 'Av. Paulista, 1500 - Bela Vista',
      telefone: '',
      email: '',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '',
      api_key: 'demo_showcase_key_2026',
      google_calendar_enabled: true,
      google_calendar_id: 'eventos.agenda.demo@gmail.com',
      google_calendar_credentials: '',
    };
  },
  update(data: Partial<CompanyConfig>): CompanyConfig {
    const current = this.get();
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    db.prepare(`
      UPDATE configuracoes
      SET company_name = ?, responsavel = ?, documento = ?, endereco = ?, telefone = ?, email = ?, cidade = ?, estado = ?, cep = ?, api_key = ?, google_calendar_enabled = ?, google_calendar_id = ?, google_calendar_credentials = ?, updated_at = ?
      WHERE id = 1
    `).run(
      updated.company_name,
      updated.responsavel,
      updated.documento,
      updated.endereco,
      updated.telefone || '',
      updated.email || '',
      updated.cidade,
      updated.estado,
      updated.cep || '',
      updated.api_key || current.api_key || 'demo_showcase_key_2026',
      updated.google_calendar_enabled ? 1 : 0,
      updated.google_calendar_id || 'eventos.agenda.demo@gmail.com',
      updated.google_calendar_credentials || '',
      updated.updated_at
    );
    return updated;
  },

  generateApiKey(): string {
    const newKey = `rlp_live_${crypto.randomBytes(16).toString('hex')}`;
    this.update({ api_key: newKey });
    return newKey;
  },
};

export const ClientRepository = {
  findByCPF(cpf: string): Client | undefined {
    return db.prepare('SELECT * FROM clientes WHERE cpf = ?').get(cpf) as unknown as Client | undefined;
  },
  findById(id: number): Client | undefined {
    return db.prepare('SELECT * FROM clientes WHERE id = ?').get(id) as unknown as Client | undefined;
  },
  createOrUpdate(data: { nome: string; cpf: string; endereco: string; telefone?: string; email?: string }): Client {
    const existing = this.findByCPF(data.cpf);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE clientes
        SET nome = ?, endereco = ?, telefone = ?, email = ?, updated_at = ?
        WHERE id = ?
      `).run(data.nome, data.endereco, data.telefone || '', data.email || '', now, existing.id);
      return { ...existing, ...data, updated_at: now };
    }

    const result = db.prepare(`
      INSERT INTO clientes (nome, cpf, endereco, telefone, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.nome, data.cpf, data.endereco, data.telefone || '', data.email || '', now, now);

    return {
      id: Number(result.lastInsertRowid),
      nome: data.nome,
      cpf: data.cpf,
      endereco: data.endereco,
      telefone: data.telefone,
      email: data.email,
      created_at: now,
      updated_at: now,
    };
  },
  list(search?: string): Client[] {
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      return db.prepare('SELECT * FROM clientes WHERE nome LIKE ? OR cpf LIKE ? OR email LIKE ? ORDER BY nome ASC').all(term, term, term) as unknown as Client[];
    }
    return db.prepare('SELECT * FROM clientes ORDER BY nome ASC').all() as unknown as Client[];
  },
  delete(id: number): boolean {
    const client = this.findById(id);
    if (!client) return false;
    db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    return true;
  },
};

export const AttractionRepository = {
  list(category?: AttractionCategory, onlyActive = false): Attraction[] {
    let query = 'SELECT * FROM atracoes WHERE 1=1';
    const params: (string | number)[] = [];
    if (category) {
      query += ' AND categoria = ?';
      params.push(category);
    }
    if (onlyActive) {
      query += ' AND ativo = 1';
    }
    query += ' ORDER BY categoria ASC, nome ASC';
    return db.prepare(query).all(...params) as unknown as Attraction[];
  },
  findById(id: number): Attraction | undefined {
    return db.prepare('SELECT * FROM atracoes WHERE id = ?').get(id) as unknown as Attraction | undefined;
  },
  create(data: Omit<Attraction, 'id' | 'created_at' | 'updated_at'>): Attraction {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO atracoes (nome, categoria, descricao, valor_base, ativo, foto_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.nome,
      data.categoria,
      data.descricao || '',
      data.valor_base || 0,
      data.ativo ?? 1,
      data.foto_url || '',
      now,
      now
    );
    return {
      id: Number(result.lastInsertRowid),
      ...data,
      created_at: now,
      updated_at: now,
    };
  },
  update(id: number, data: Partial<Attraction>): Attraction {
    const current = this.findById(id);
    if (!current) throw new Error(`Atração ${id} não encontrada`);
    const now = new Date().toISOString();
    const updated = { ...current, ...data, updated_at: now };
    db.prepare(`
      UPDATE atracoes
      SET nome = ?, categoria = ?, descricao = ?, valor_base = ?, ativo = ?, foto_url = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.nome,
      updated.categoria,
      updated.descricao || '',
      updated.valor_base,
      updated.ativo,
      updated.foto_url || '',
      now,
      id
    );
    return updated;
  },
  delete(id: number): boolean {
    const atracao = this.findById(id);
    if (!atracao) return false;
    db.prepare('DELETE FROM atracoes WHERE id = ?').run(id);
    return true;
  },
};

export const EventRepository = {
  findById(id: number): EventDetails | undefined {
    const row = db.prepare(`
      SELECT 
        e.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        c.id as contrato_id, c.numero as contrato_numero, c.status as contrato_status, c.pdf_path as contrato_pdf_path
      FROM eventos e
      LEFT JOIN clientes cl ON e.cliente_id = cl.id
      LEFT JOIN contratos c ON c.evento_id = e.id
      WHERE e.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.mapEventRow(row);
  },
  create(data: Omit<EventDetails, 'id' | 'created_at' | 'updated_at'>): EventDetails {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO eventos (cliente_id, nome_evento, tipo_evento, data, horario, horario_termino, endereco, cidade, estado, cep, duracao, status, valor_total, observacoes, google_event_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.cliente_id,
      data.nome_evento || '',
      data.tipo_evento || 'OUTRO',
      data.data,
      data.horario,
      data.horario_termino || '',
      data.endereco,
      data.cidade || 'São Paulo',
      data.estado || 'SP',
      data.cep || '',
      data.duracao || 2,
      data.status || 'AGENDADO',
      data.valor_total || 0,
      data.observacoes || '',
      data.google_event_id || '',
      now,
      now
    );

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  },
  update(id: number, data: Partial<EventDetails>): EventDetails {
    const current = this.findById(id);
    if (!current) throw new Error(`Evento ${id} não encontrado`);
    const now = new Date().toISOString();
    const updated = { ...current, ...data, updated_at: now };
    db.prepare(`
      UPDATE eventos
      SET nome_evento = ?, tipo_evento = ?, data = ?, horario = ?, horario_termino = ?, endereco = ?, cidade = ?, estado = ?, cep = ?, duracao = ?, status = ?, valor_total = ?, observacoes = ?, google_event_id = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.nome_evento || '',
      updated.tipo_evento || 'OUTRO',
      updated.data,
      updated.horario,
      updated.horario_termino || '',
      updated.endereco,
      updated.cidade || 'São Paulo',
      updated.estado || 'SP',
      updated.cep || '',
      updated.duracao,
      updated.status,
      updated.valor_total,
      updated.observacoes || '',
      updated.google_event_id || '',
      now,
      id
    );
    return this.findById(id)!;
  },
  delete(id: number): boolean {
    const event = this.findById(id);
    if (!event) return false;
    db.prepare('DELETE FROM eventos WHERE id = ?').run(id);
    return true;
  },
  list(filters?: {
    search?: string;
    status?: EventStatus;
    startDate?: string;
    endDate?: string;
  }): EventDetails[] {
    let query = `
      SELECT 
        e.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        c.id as contrato_id, c.numero as contrato_numero, c.status as contrato_status, c.pdf_path as contrato_pdf_path
      FROM eventos e
      LEFT JOIN clientes cl ON e.cliente_id = cl.id
      LEFT JOIN contratos c ON c.evento_id = e.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (filters?.status) {
      query += ' AND e.status = ?';
      params.push(filters.status);
    }
    if (filters?.startDate) {
      query += ' AND e.data >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND e.data <= ?';
      params.push(filters.endDate);
    }
    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += ' AND (cl.nome LIKE ? OR e.nome_evento LIKE ? OR e.endereco LIKE ?)';
      params.push(term, term, term);
    }

    query += ' ORDER BY e.data ASC, e.horario ASC';
    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.mapEventRow(r));
  },
  getAttractions(eventoId: number): EventAttraction[] {
    const rows = db.prepare(`
      SELECT ea.*, a.nome as atracao_nome, a.categoria as atracao_categoria, a.descricao as atracao_descricao, a.valor_base as atracao_valor_base
      FROM evento_atracoes ea
      JOIN atracoes a ON ea.atracao_id = a.id
      WHERE ea.evento_id = ?
    `).all(eventoId) as Record<string, unknown>[];

    return rows.map((r) => ({
      id: Number(r.id),
      evento_id: Number(r.evento_id),
      atracao_id: Number(r.atracao_id),
      quantidade: Number(r.quantidade || 1),
      valor_unitario: Number(r.valor_unitario || 0),
      observacoes: r.observacoes ? String(r.observacoes) : undefined,
      atracao: {
        id: Number(r.atracao_id),
        nome: String(r.atracao_nome),
        categoria: String(r.atracao_categoria) as AttractionCategory,
        descricao: r.atracao_descricao ? String(r.atracao_descricao) : undefined,
        valor_base: Number(r.atracao_valor_base || 0),
        ativo: 1,
      },
    }));
  },
  setAttractions(eventoId: number, attractions: Array<{ atracao_id: number; quantidade?: number; valor_unitario?: number; observacoes?: string }>): void {
    db.prepare('DELETE FROM evento_atracoes WHERE evento_id = ?').run(eventoId);
    const stmt = db.prepare(`
      INSERT INTO evento_atracoes (evento_id, atracao_id, quantidade, valor_unitario, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const a of attractions) {
      stmt.run(eventoId, a.atracao_id, a.quantidade || 1, a.valor_unitario || 0, a.observacoes || '');
    }
  },
  mapEventRow(row: Record<string, unknown>): EventDetails {
    const event: EventDetails = {
      id: Number(row.id),
      cliente_id: Number(row.cliente_id),
      nome_evento: row.nome_evento ? String(row.nome_evento) : undefined,
      tipo_evento: (row.tipo_evento as EventType) || 'OUTRO',
      data: String(row.data),
      horario: String(row.horario),
      horario_termino: row.horario_termino ? String(row.horario_termino) : undefined,
      endereco: String(row.endereco),
      cidade: row.cidade ? String(row.cidade) : 'São Paulo',
      estado: row.estado ? String(row.estado) : 'SP',
      cep: row.cep ? String(row.cep) : undefined,
      duracao: Number(row.duracao || 2),
      status: (row.status as EventStatus) || 'AGENDADO',
      valor_total: Number(row.valor_total || 0),
      observacoes: row.observacoes ? String(row.observacoes) : undefined,
      google_event_id: row.google_event_id ? String(row.google_event_id) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };

    if (row.cliente_nome) {
      event.cliente = {
        id: Number(row.cliente_id),
        nome: String(row.cliente_nome),
        cpf: String(row.cliente_cpf || ''),
        endereco: String(row.cliente_endereco || ''),
        telefone: row.cliente_telefone ? String(row.cliente_telefone) : undefined,
        email: row.cliente_email ? String(row.cliente_email) : undefined,
      };
    }

    if (row.contrato_id) {
      event.contrato_id = Number(row.contrato_id);
      event.contrato = {
        id: Number(row.contrato_id),
        numero: String(row.contrato_numero),
        status: (row.contrato_status as ContractStatus) || 'GERADO',
        pdf_path: row.contrato_pdf_path ? String(row.contrato_pdf_path) : undefined,
      } as unknown as Contract;
    }

    return event;
  },

};

export const FinancialRepository = {
  findById(id: number): FinancialEntry | undefined {
    const row = db.prepare(`
      SELECT lf.*, cl.nome as cliente_nome, cl.cpf as cliente_cpf, c.numero as contrato_numero
      FROM lancamentos_financeiros lf
      JOIN clientes cl ON lf.cliente_id = cl.id
      LEFT JOIN contratos c ON lf.contrato_id = c.id
      WHERE lf.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.mapFinancialRow(row);
  },
  list(filters?: {
    status?: PaymentStatus;
    eventoId?: number;
    contratoId?: number;
    clienteId?: number;
    startDate?: string;
    endDate?: string;
  }): FinancialEntry[] {
    let query = `
      SELECT lf.*, cl.nome as cliente_nome, cl.cpf as cliente_cpf, c.numero as contrato_numero
      FROM lancamentos_financeiros lf
      JOIN clientes cl ON lf.cliente_id = cl.id
      LEFT JOIN contratos c ON lf.contrato_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (filters?.status) {
      query += ' AND lf.status = ?';
      params.push(filters.status);
    }
    if (filters?.eventoId) {
      query += ' AND lf.evento_id = ?';
      params.push(filters.eventoId);
    }
    if (filters?.contratoId) {
      query += ' AND lf.contrato_id = ?';
      params.push(filters.contratoId);
    }
    if (filters?.clienteId) {
      query += ' AND lf.cliente_id = ?';
      params.push(filters.clienteId);
    }
    if (filters?.startDate) {
      query += ' AND lf.data_vencimento >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND lf.data_vencimento <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY lf.data_vencimento ASC, lf.id ASC';
    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.mapFinancialRow(r));
  },
  create(data: Omit<FinancialEntry, 'id' | 'created_at' | 'updated_at'>): FinancialEntry {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO lancamentos_financeiros (evento_id, contrato_id, cliente_id, descricao, tipo_parcela, valor, data_vencimento, data_pagamento, status, forma_pagamento, comprovante_ref, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.evento_id,
      data.contrato_id || null,
      data.cliente_id,
      data.descricao,
      data.tipo_parcela,
      data.valor,
      data.data_vencimento,
      data.data_pagamento || null,
      data.status || 'PENDENTE',
      data.forma_pagamento || null,
      data.comprovante_ref || null,
      now,
      now
    );
    return this.findById(Number(result.lastInsertRowid))!;
  },
  settle(id: number, data: { forma_pagamento: PaymentMethod; data_pagamento?: string; comprovante_ref?: string }): FinancialEntry {
    const current = this.findById(id);
    if (!current) throw new Error(`Lançamento financeiro ${id} não encontrado`);
    const paymentDate = data.data_pagamento || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE lancamentos_financeiros
      SET status = 'PAGO', forma_pagamento = ?, data_pagamento = ?, comprovante_ref = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.forma_pagamento,
      paymentDate,
      data.comprovante_ref || current.comprovante_ref || '',
      now,
      id
    );
    return this.findById(id)!;
  },
  cancel(id: number): FinancialEntry {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE lancamentos_financeiros
      SET status = 'CANCELADO', updated_at = ?
      WHERE id = ?
    `).run(now, id);
    return this.findById(id)!;
  },
  update(id: number, data: Partial<FinancialEntry>): FinancialEntry {
    const current = this.findById(id);
    if (!current) throw new Error(`Lançamento financeiro ${id} não encontrado`);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE lancamentos_financeiros
      SET 
        descricao = COALESCE(?, descricao),
        tipo_parcela = COALESCE(?, tipo_parcela),
        valor = COALESCE(?, valor),
        data_vencimento = COALESCE(?, data_vencimento),
        data_pagamento = ?,
        status = COALESCE(?, status),
        forma_pagamento = ?,
        comprovante_ref = ?,
        contrato_id = COALESCE(?, contrato_id),
        updated_at = ?
      WHERE id = ?
    `).run(
      data.descricao !== undefined ? data.descricao : null,
      data.tipo_parcela !== undefined ? data.tipo_parcela : null,
      data.valor !== undefined ? data.valor : null,
      data.data_vencimento !== undefined ? data.data_vencimento : null,
      data.data_pagamento !== undefined ? data.data_pagamento : current.data_pagamento || null,
      data.status !== undefined ? data.status : null,
      data.forma_pagamento !== undefined ? data.forma_pagamento : current.forma_pagamento || null,
      data.comprovante_ref !== undefined ? data.comprovante_ref : current.comprovante_ref || null,
      data.contrato_id !== undefined ? data.contrato_id : null,
      now,
      id
    );
    return this.findById(id)!;
  },
  delete(id: number): boolean {
    const res = db.prepare('DELETE FROM lancamentos_financeiros WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  },
  getStats(): FinancialStats {
    const rows = db.prepare('SELECT status, valor, data_vencimento FROM lancamentos_financeiros').all() as Array<{ status: PaymentStatus; valor: number; data_vencimento: string }>;
    const today = new Date().toISOString().split('T')[0];

    let totalFaturado = 0;
    let totalRecebido = 0;
    let totalAReceber = 0;
    let totalAtrasado = 0;
    let lancamentosPendentes = 0;
    let lancamentosPagos = 0;
    let lancamentosAtrasados = 0;

    for (const r of rows) {
      if (r.status === 'CANCELADO') continue;
      totalFaturado += r.valor;

      if (r.status === 'PAGO') {
        totalRecebido += r.valor;
        lancamentosPagos++;
      } else if (r.status === 'PENDENTE') {
        if (r.data_vencimento < today) {
          totalAtrasado += r.valor;
          lancamentosAtrasados++;
        } else {
          totalAReceber += r.valor;
          lancamentosPendentes++;
        }
      } else if (r.status === 'ATRASADO') {
        totalAtrasado += r.valor;
        lancamentosAtrasados++;
      }
    }

    const taxaRecebimento = totalFaturado > 0 ? (totalRecebido / totalFaturado) * 100 : 100;

    return {
      totalFaturado,
      totalRecebido,
      totalAReceber,
      totalAtrasado,
      total_geral: totalFaturado,
      total_pago: totalRecebido,
      total_pendente: totalAReceber,
      total_atrasado: totalAtrasado,
      taxaRecebimento: Math.round(taxaRecebimento * 10) / 10,
      lancamentosPendentes,
      lancamentosPagos,
      lancamentosAtrasados,
    } as any;
  },
  mapFinancialRow(row: Record<string, unknown>): FinancialEntry {
    return {
      id: Number(row.id),
      evento_id: Number(row.evento_id),
      contrato_id: row.contrato_id ? Number(row.contrato_id) : undefined,
      cliente_id: Number(row.cliente_id),
      descricao: String(row.descricao),
      tipo_parcela: String(row.tipo_parcela) as PaymentInstallmentType,
      valor: Number(row.valor),
      data_vencimento: String(row.data_vencimento),
      data_pagamento: row.data_pagamento ? String(row.data_pagamento) : undefined,
      status: String(row.status) as PaymentStatus,
      forma_pagamento: row.forma_pagamento ? (String(row.forma_pagamento) as PaymentMethod) : undefined,
      comprovante_ref: row.comprovante_ref ? String(row.comprovante_ref) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      cliente: {
        id: Number(row.cliente_id),
        nome: String(row.cliente_nome),
        cpf: String(row.cliente_cpf || ''),
        endereco: '',
      },
    };
  },
};

export const ContractRepository = {
  getNextSequence(year: number): number {
    const pattern = `RLP-${year}-%`;
    const last = db.prepare('SELECT numero FROM contratos WHERE numero LIKE ? ORDER BY id DESC LIMIT 1').get(pattern) as { numero: string } | undefined;
    if (!last) return 1;

    const parts = last.numero.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      return isNaN(seq) ? 1 : seq + 1;
    }
    return 1;
  },
  findById(id: number): Contract | undefined {
    const row = db.prepare(`
      SELECT 
        c.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        e.data as evento_data, e.horario as evento_horario, e.horario_termino as evento_horario_termino, e.endereco as evento_endereco,
        e.cidade as evento_cidade, e.estado as evento_estado, e.cep as evento_cep, e.duracao as evento_duracao, e.observacoes as evento_observacoes
      FROM contratos c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN eventos e ON c.evento_id = e.id
      WHERE c.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.mapContractRow(row);
  },
  findByNumero(numero: string): Contract | undefined {
    const row = db.prepare(`
      SELECT 
        c.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        e.data as evento_data, e.horario as evento_horario, e.horario_termino as evento_horario_termino, e.endereco as evento_endereco,
        e.cidade as evento_cidade, e.estado as evento_estado, e.cep as evento_cep, e.duracao as evento_duracao, e.observacoes as evento_observacoes
      FROM contratos c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN eventos e ON c.evento_id = e.id
      WHERE c.numero = ?
    `).get(numero) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.mapContractRow(row);
  },
  findByEventoId(eventoId: number): Contract | undefined {
    const row = db.prepare(`
      SELECT 
        c.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        e.data as evento_data, e.horario as evento_horario, e.horario_termino as evento_horario_termino, e.endereco as evento_endereco,
        e.cidade as evento_cidade, e.estado as evento_estado, e.cep as evento_cep, e.duracao as evento_duracao, e.observacoes as evento_observacoes
      FROM contratos c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN eventos e ON c.evento_id = e.id
      WHERE c.evento_id = ?
      ORDER BY c.id DESC LIMIT 1
    `).get(eventoId) as Record<string, unknown> | undefined;

    if (!row) return undefined;
    return this.mapContractRow(row);
  },
  create(data: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'evento'>): Contract {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO contratos (
        numero, tipo, cliente_id, evento_id, personagem, quantidade_personagens,
        valor_total, valor_entrada, valor_restante, percentual_entrada, percentual_restante,
        uso_imagem, status, pdf_path, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.numero,
      data.tipo,
      data.cliente_id,
      data.evento_id,
      data.personagem || '',
      data.quantidade_personagens || 1,
      data.valor_total,
      data.valor_entrada,
      data.valor_restante,
      data.percentual_entrada || 40,
      data.percentual_restante || 60,
      data.uso_imagem ?? 1,
      data.status || 'GERADO',
      data.pdf_path || '',
      now,
      now
    );

    const createdId = Number(result.lastInsertRowid);
    return this.findById(createdId)!;
  },
  update(id: number, data: Partial<Contract>): Contract {
    const current = this.findById(id);
    if (!current) throw new Error(`Contrato ${id} não encontrado`);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE contratos
      SET tipo = ?, personagem = ?, quantidade_personagens = ?, valor_total = ?, valor_entrada = ?, valor_restante = ?,
          percentual_entrada = ?, percentual_restante = ?, uso_imagem = ?, status = ?, pdf_path = ?, updated_at = ?
      WHERE id = ?
    `).run(
      data.tipo || current.tipo,
      data.personagem !== undefined ? data.personagem : current.personagem || '',
      data.quantidade_personagens || current.quantidade_personagens || 1,
      data.valor_total ?? current.valor_total,
      data.valor_entrada ?? current.valor_entrada,
      data.valor_restante ?? current.valor_restante,
      data.percentual_entrada ?? current.percentual_entrada ?? 40,
      data.percentual_restante ?? current.percentual_restante ?? 60,
      data.uso_imagem !== undefined ? data.uso_imagem : current.uso_imagem,
      data.status || current.status,
      data.pdf_path !== undefined ? data.pdf_path : current.pdf_path || '',
      now,
      id
    );

    return this.findById(id)!;
  },
  delete(id: number): boolean {
    const contract = this.findById(id);
    if (!contract) return false;
    db.prepare('DELETE FROM contratos WHERE id = ?').run(id);
    return true;
  },
  list(filters?: {
    search?: string;
    tipo?: AttractionType;
    status?: ContractStatus;
  }): Contract[] {
    let query = `
      SELECT 
        c.*,
        cl.nome as cliente_nome, cl.cpf as cliente_cpf, cl.endereco as cliente_endereco, cl.telefone as cliente_telefone, cl.email as cliente_email,
        e.data as evento_data, e.horario as evento_horario, e.horario_termino as evento_horario_termino, e.endereco as evento_endereco,
        e.cidade as evento_cidade, e.estado as evento_estado, e.cep as evento_cep, e.duracao as evento_duracao, e.observacoes as evento_observacoes
      FROM contratos c
      JOIN clientes cl ON c.cliente_id = cl.id
      JOIN eventos e ON c.evento_id = e.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (filters?.tipo) {
      query += ` AND c.tipo = ?`;
      params.push(filters.tipo);
    }

    if (filters?.status) {
      query += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += ` AND (cl.nome LIKE ? OR cl.cpf LIKE ? OR c.numero LIKE ? OR c.personagem LIKE ?)`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY c.id DESC`;

    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.mapContractRow(r));
  },
  mapContractRow(row: Record<string, unknown>): Contract {
    return {
      id: Number(row.id),
      numero: String(row.numero),
      tipo: String(row.tipo) as AttractionType,
      cliente_id: Number(row.cliente_id),
      evento_id: Number(row.evento_id),
      personagem: row.personagem ? String(row.personagem) : undefined,
      quantidade_personagens: Number(row.quantidade_personagens || 1),
      valor_total: Number(row.valor_total),
      valor_entrada: Number(row.valor_entrada),
      valor_restante: Number(row.valor_restante),
      percentual_entrada: Number(row.percentual_entrada || 40),
      percentual_restante: Number(row.percentual_restante || 60),
      uso_imagem: Number(row.uso_imagem ?? 1),
      status: String(row.status) as ContractStatus,
      pdf_path: row.pdf_path ? String(row.pdf_path) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      cliente: {
        id: Number(row.cliente_id),
        nome: String(row.cliente_nome),
        cpf: String(row.cliente_cpf),
        endereco: String(row.cliente_endereco),
        telefone: row.cliente_telefone ? String(row.cliente_telefone) : undefined,
        email: row.cliente_email ? String(row.cliente_email) : undefined,
      },
      evento: {
        id: Number(row.evento_id),
        cliente_id: Number(row.cliente_id),
        data: String(row.evento_data),
        horario: String(row.evento_horario),
        horario_termino: row.evento_horario_termino ? String(row.evento_horario_termino) : undefined,
        endereco: String(row.evento_endereco),
        cidade: row.evento_cidade ? String(row.evento_cidade) : undefined,
        estado: row.evento_estado ? String(row.evento_estado) : undefined,
        cep: row.evento_cep ? String(row.evento_cep) : undefined,
        duracao: Number(row.evento_duracao),
        status: 'CONFIRMADO',
        valor_total: Number(row.valor_total),
        observacoes: row.evento_observacoes ? String(row.evento_observacoes) : undefined,
      },
    };
  },
};

/**
 * Seed das planilhas de Custos por Evento (#01 a #47) e Compras/Investimentos
 */
export function seedCustosAndExpenses(): void {
  try {
    const countCustos = (db.prepare('SELECT COUNT(*) as count FROM custos_evento').get() as { count: number }).count;
    if (countCustos === 0) {
      const historicalCosts = [
        { evento_id: 1, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 2, cilindro: 45, gerb: 20, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 3, cilindro: 45, gerb: 20, gasolina: 50, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 4, cilindro: 45, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 5, cilindro: 45, gerb: 0, gasolina: 70, pedagio: 10, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 6, cilindro: 0, gerb: 0, gasolina: 100, pedagio: 0, vallet: 0, ajudante: 0, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 7, cilindro: 0, gerb: 0, gasolina: 200, pedagio: 60, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 8, cilindro: 0, gerb: 0, gasolina: 50, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 9, cilindro: 0, gerb: 0, gasolina: 50, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 10, cilindro: 45, gerb: 20, gasolina: 50, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 150, pago_monitor: 1, status_custos: 'PAGO' },
        { evento_id: 11, cilindro: 45, gerb: 20, gasolina: 20, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 12, cilindro: 45, gerb: 20, gasolina: 50, pedagio: 10, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 13, cilindro: 0, gerb: 30, gasolina: 30, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 14, cilindro: 25, gerb: 0, gasolina: 20, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 15, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 16, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 17, cilindro: 0, gerb: 0, gasolina: 100, pedagio: 10, vallet: 0, ajudante: 450, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 18, cilindro: 0, gerb: 0, gasolina: 50, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 19, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 20, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 21, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 22, cilindro: 22, gerb: 0, gasolina: 50, pedagio: 60, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 23, cilindro: 0, gerb: 0, gasolina: 50, pedagio: 10, vallet: 50, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 24, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 25, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 26, cilindro: 0, gerb: 0, gasolina: 30, pedagio: 0, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 27, cilindro: 0, gerb: 0, gasolina: 50, pedagio: 0, vallet: 0, ajudante: 0, pago_ajudante: 1, monitor: 200, pago_monitor: 1, status_custos: 'PAGO' },
        { evento_id: 28, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 29, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 30, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 31, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 32, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 33, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 34, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 35, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 36, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 37, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 38, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 39, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 40, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 41, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 42, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 43, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 44, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 45, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 46, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
        { evento_id: 47, cilindro: 0, gerb: 20, gasolina: 70, pedagio: 80, vallet: 0, ajudante: 70, pago_ajudante: 1, monitor: 0, pago_monitor: 0, status_custos: 'PAGO' },
      ];

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO custos_evento 
        (evento_id, cilindro, gerb, gasolina, pedagio, vallet, ajudante, pago_ajudante, monitor, pago_monitor, status_custos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const c of historicalCosts) {
        const evExists = db.prepare('SELECT id FROM eventos WHERE id = ?').get(c.evento_id);
        if (evExists) {
          stmt.run(
            c.evento_id,
            c.cilindro,
            c.gerb,
            c.gasolina,
            c.pedagio,
            c.vallet,
            c.ajudante,
            c.pago_ajudante,
            c.monitor,
            c.pago_monitor,
            c.status_custos
          );
        }
      }
    }

    const countDespesas = (db.prepare('SELECT COUNT(*) as count FROM despesas_gerais').get() as { count: number }).count;
    if (countDespesas === 0) {
      const historicalExpenses = [
        { item: 'Compra do robô de léd, cilindro, pistola e escada.', fornecedor: 'Roberto', valor: 2400.0, data: '2025-08-22', pago: 1, tipo_gasto: 'INVESTIMENTO', observacoes: '' },
        { item: 'Cilindro, Eva, Acrílico e manequim.', fornecedor: 'Roberto', valor: 400.0, data: '2025-08-30', pago: 1, tipo_gasto: 'INVESTIMENTO', observacoes: '' },
        { item: 'Personagens: Mickey, Minnei, Sonic, 3 patrulhas canina', fornecedor: 'Estudio Mascotes SP', valor: 10000.0, data: '2026-05-10', pago: 0, tipo_gasto: 'INVESTIMENTO', observacoes: 'Parcelamento fornecedor mascotes' },
        { item: '2 La casa de papel completo - 3 pistolas - 1 maleta', fornecedor: 'Mercado Livre', valor: 1270.0, data: '2026-04-21', pago: 1, tipo_gasto: 'INVESTIMENTO', observacoes: '' },
        { item: 'Fantasia do Homem aranha', fornecedor: 'Mercado Livre', valor: 190.0, data: '2026-04-24', pago: 1, tipo_gasto: 'INVESTIMENTO', observacoes: '' },
        { item: 'Bateria nova, Robo.', fornecedor: 'Mercado Livre', valor: 241.0, data: '2025-10-20', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Bateria de Moto, Robo', fornecedor: 'Mercado Livre', valor: 160.0, data: '2026-01-21', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Leds novos do Robo', fornecedor: 'Mercado Livre', valor: 75.0, data: '2026-01-20', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: '2 Carregadores de bateria / Robo', fornecedor: 'Mercado Livre', valor: 100.0, data: '2026-03-04', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Bateria de moto 2', fornecedor: 'Mercado Livre', valor: 231.0, data: '2026-03-06', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Compra de materiais: Eva, cola, velcro, tecido, agulha, linho, trava.', fornecedor: 'EVA Moinho fabrini', valor: 77.92, data: '2025-08-30', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Mochila robo', fornecedor: 'Tiara Bolsas', valor: 80.0, data: '2025-10-09', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Fita isolante, cola e alicate.', fornecedor: 'Mercado Livre', valor: 150.0, data: '2025-10-09', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Compra de materiais: Ferro de solda, fios, parafusos, broca, fita isolante.', fornecedor: 'Mercado Livre', valor: 146.0, data: '2025-08-30', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Pistola Gerbs - Fogo eletronico', fornecedor: 'Mercado Livre', valor: 79.0, data: '2026-03-21', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Cabeça do tequileiro - Chapeu + Mascara', fornecedor: 'Mercado Livre', valor: 105.0, data: '2026-04-26', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Carrinho para Cilindro', fornecedor: 'Mercado Livre', valor: 190.0, data: '2026-04-26', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Eva para Carrinho do Cilindro', fornecedor: 'Mercado Livre', valor: 60.0, data: '2026-04-26', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Compra de materiais: Tinta automotiva 900ml, 10 conectores e pincel. (mercado livre)', fornecedor: 'Mercado Livre', valor: 194.0, data: '2025-09-03', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Capacete do Robo', fornecedor: 'Tapeceiro', valor: 60.0, data: '2025-09-15', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Cola quente, pistola e palmilha ortopedica.', fornecedor: 'Mercado Livre', valor: 116.0, data: '2026-01-20', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Tela do capacete + frete', fornecedor: 'Jose Robo', valor: 75.0, data: '2026-02-06', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Ziper na perna', fornecedor: 'Sapataria', valor: 180.0, data: '2026-03-06', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Velcro da perna', fornecedor: 'Mercado Livre', valor: 50.0, data: '2026-03-07', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Leds do Robo + 30m fios', fornecedor: 'Mercado Livre', valor: 53.0, data: '2026-04-26', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: '1.000 cartoes de visita', fornecedor: 'Atual Card', valor: 144.9, data: '2026-04-26', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: '1.000 Panfletos para divulgação', fornecedor: 'Atual Card', valor: 162.0, data: '2025-11-24', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Banner e Suporte', fornecedor: 'NilArts', valor: 130.0, data: '2025-12-12', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de FEVEREIRO', fornecedor: 'Instagram', valor: 100.0, data: '2025-12-22', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Janeiro', fornecedor: 'Instagram', valor: 180.0, data: '2026-02-18', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Abril', fornecedor: 'Instagram', valor: 100.0, data: '2026-04-20', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Maio', fornecedor: 'Instagram', valor: 200.0, data: '2026-03-30', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Imposto personagens: Mickey, Minnei, Sonic, 3 patrulhas canina', fornecedor: 'Correios', valor: 1250.0, data: '2026-06-17', pago: 1, tipo_gasto: 'IMPREVISTO', observacoes: '' },
        { item: 'Pistola cola quente, luvas, tocas e fita isolante', fornecedor: 'Mercado Livre', valor: 300.0, data: '2026-06-26', pago: 1, tipo_gasto: 'MANUTENCAO', observacoes: '' },
        { item: 'Seguidores', fornecedor: 'UP insta', valor: 36.0, data: '2026-06-27', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Cabideira, malas, saco transparente e cabides', fornecedor: 'Shopee', valor: 315.0, data: '2026-06-29', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Pernas mecanicas', fornecedor: 'Mercado Livre', valor: 815.0, data: '2026-07-01', pago: 1, tipo_gasto: 'MELHORIAS', observacoes: '' },
        { item: 'Trafego Pago de Julho', fornecedor: 'Instagram', valor: 100.0, data: '2026-07-01', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Agosto', fornecedor: 'Instagram', valor: 100.0, data: '2026-08-01', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Agosto', fornecedor: 'Instagram', valor: 100.0, data: '2026-08-15', pago: 1, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Setembro', fornecedor: 'Instagram', valor: 100.0, data: '2026-09-01', pago: 0, tipo_gasto: 'MARKETING', observacoes: '' },
        { item: 'Trafego Pago de Setembro', fornecedor: 'Instagram', valor: 100.0, data: '2026-09-15', pago: 0, tipo_gasto: 'MARKETING', observacoes: '' },
      ];

      const stmtD = db.prepare(`
        INSERT INTO despesas_gerais (item, fornecedor, valor, data, pago, tipo_gasto, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const d of historicalExpenses) {
        stmtD.run(d.item, d.fornecedor, d.valor, d.data, d.pago, d.tipo_gasto, d.observacoes);
      }
    }
  } catch (err) {
    console.error('Erro ao semear custos e despesas:', err);
  }
}

// ==================== REPOSITÓRIO DE CUSTOS & DESPESAS ====================

export const CostRepository = {
  getEventCosts(eventoId: number): EventCost | null {
    const row = db.prepare(`
      SELECT 
        ce.*,
        e.id as ev_id, e.valor_total as ev_valor_total, e.data as ev_data, e.horario as ev_horario,
        e.endereco as ev_endereco, e.status as ev_status, e.nome_evento as ev_nome_evento,
        cl.id as cl_id, cl.nome as cl_nome, cl.cpf as cl_cpf, cl.telefone as cl_telefone
      FROM custos_evento ce
      JOIN eventos e ON e.id = ce.evento_id
      JOIN clientes cl ON cl.id = e.cliente_id
      WHERE ce.evento_id = ?
    `).get(eventoId) as Record<string, unknown> | undefined;

    if (!row) {
      // Retorna objeto padrão caso evento exista mas sem registro em custos_evento
      const ev = EventRepository.findById(eventoId);
      if (!ev) return null;
      return {
        evento_id: eventoId,
        cilindro: 0,
        gerb: 0,
        gasolina: 0,
        pedagio: 0,
        vallet: 0,
        ajudante: 0,
        pago_ajudante: 0,
        monitor: 0,
        pago_monitor: 0,
        status_custos: 'PENDENTE',
        total_custos: 0,
        valor_evento: ev.valor_total,
        lucro_evento: ev.valor_total,
        margem_lucro: 100,
        evento: ev,
      };
    }

    return this.mapEventCostRow(row);
  },

  listEventCosts(searchQuery?: string): EventCost[] {
    let query = `
      SELECT 
        e.id as ev_id, e.valor_total as ev_valor_total, e.data as ev_data, e.horario as ev_horario,
        e.endereco as ev_endereco, e.status as ev_status, e.nome_evento as ev_nome_evento,
        cl.id as cl_id, cl.nome as cl_nome, cl.cpf as cl_cpf, cl.telefone as cl_telefone,
        ce.id as id, ce.evento_id,
        COALESCE(ce.cilindro, 0) as cilindro,
        COALESCE(ce.gerb, 0) as gerb,
        COALESCE(ce.gasolina, 0) as gasolina,
        COALESCE(ce.pedagio, 0) as pedagio,
        COALESCE(ce.vallet, 0) as vallet,
        COALESCE(ce.ajudante, 0) as ajudante,
        COALESCE(ce.pago_ajudante, 0) as pago_ajudante,
        COALESCE(ce.monitor, 0) as monitor,
        COALESCE(ce.pago_monitor, 0) as pago_monitor,
        COALESCE(ce.status_custos, 'PENDENTE') as status_custos,
        ce.observacoes,
        ce.created_at,
        ce.updated_at
      FROM eventos e
      JOIN clientes cl ON cl.id = e.cliente_id
      LEFT JOIN custos_evento ce ON ce.evento_id = e.id
    `;

    const params: (string | number)[] = [];
    if (searchQuery && searchQuery.trim()) {
      const term = `%${searchQuery.trim()}%`;
      query += ` WHERE cl.nome LIKE ? OR cl.cpf LIKE ? OR e.id = ? OR e.nome_evento LIKE ?`;
      params.push(term, term, isNaN(Number(searchQuery)) ? -1 : Number(searchQuery), term);
    }

    query += ` ORDER BY e.id ASC`;

    const rows = (db.prepare(query).all as any)(...params) as Record<string, unknown>[];
    return rows.map((r) => this.mapEventCostRow(r));
  },

  saveEventCost(data: Partial<EventCost> & { evento_id: number }): EventCost {
    const existing = db.prepare('SELECT id FROM custos_evento WHERE evento_id = ?').get(data.evento_id) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE custos_evento
        SET cilindro = ?, gerb = ?, gasolina = ?, pedagio = ?, vallet = ?, ajudante = ?, 
            pago_ajudante = ?, monitor = ?, pago_monitor = ?, status_custos = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE evento_id = ?
      `).run(
        data.cilindro ?? 0,
        data.gerb ?? 0,
        data.gasolina ?? 0,
        data.pedagio ?? 0,
        data.vallet ?? 0,
        data.ajudante ?? 0,
        data.pago_ajudante ?? 0,
        data.monitor ?? 0,
        data.pago_monitor ?? 0,
        data.status_custos ?? 'PENDENTE',
        data.observacoes ?? '',
        data.evento_id
      );
    } else {
      db.prepare(`
        INSERT INTO custos_evento 
        (evento_id, cilindro, gerb, gasolina, pedagio, vallet, ajudante, pago_ajudante, monitor, pago_monitor, status_custos, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.evento_id,
        data.cilindro ?? 0,
        data.gerb ?? 0,
        data.gasolina ?? 0,
        data.pedagio ?? 0,
        data.vallet ?? 0,
        data.ajudante ?? 0,
        data.pago_ajudante ?? 0,
        data.monitor ?? 0,
        data.pago_monitor ?? 0,
        data.status_custos ?? 'PENDENTE',
        data.observacoes ?? ''
      );
    }

    const saved = this.getEventCosts(data.evento_id);
    if (!saved) throw new Error('Falha ao salvar custos do evento.');
    return saved;
  },

  togglePagoField(eventoId: number, field: 'pago_ajudante' | 'pago_monitor' | 'status_custos'): EventCost {
    // Garante que o registro de custos existe
    let current = this.getEventCosts(eventoId);
    if (!current || !current.id) {
      current = this.saveEventCost({ evento_id: eventoId });
    }

    if (field === 'pago_ajudante') {
      const newVal = current.pago_ajudante === 1 ? 0 : 1;
      db.prepare('UPDATE custos_evento SET pago_ajudante = ?, updated_at = CURRENT_TIMESTAMP WHERE evento_id = ?').run(newVal, eventoId);
    } else if (field === 'pago_monitor') {
      const newVal = current.pago_monitor === 1 ? 0 : 1;
      db.prepare('UPDATE custos_evento SET pago_monitor = ?, updated_at = CURRENT_TIMESTAMP WHERE evento_id = ?').run(newVal, eventoId);
    } else if (field === 'status_custos') {
      const newVal = current.status_custos === 'PAGO' ? 'PENDENTE' : 'PAGO';
      db.prepare('UPDATE custos_evento SET status_custos = ?, updated_at = CURRENT_TIMESTAMP WHERE evento_id = ?').run(newVal, eventoId);
    }

    return this.getEventCosts(eventoId)!;
  },

  listGeneralExpenses(filters?: { tipo?: string; pago?: number; search?: string }): GeneralExpense[] {
    let query = `SELECT * FROM despesas_gerais WHERE 1=1`;
    const params: (string | number)[] = [];
    if (filters?.tipo && filters.tipo !== 'TODOS') {
      query += ` AND tipo_gasto = ?`;
      params.push(filters.tipo);
    }

    if (filters?.pago !== undefined && filters.pago !== -1) {
      query += ` AND pago = ?`;
      params.push(filters.pago);
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query += ` AND (item LIKE ? OR fornecedor LIKE ? OR observacoes LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY data DESC, id DESC`;
    return ((db.prepare(query).all as any)(...params) as unknown[]) as GeneralExpense[];
  },

  getGeneralExpenseById(id: number): GeneralExpense | null {
    const row = db.prepare('SELECT * FROM despesas_gerais WHERE id = ?').get(id) as GeneralExpense | undefined;
    return row || null;
  },

  createGeneralExpense(data: Omit<GeneralExpense, 'id'>): GeneralExpense {
    const res = db.prepare(`
      INSERT INTO despesas_gerais (item, fornecedor, valor, data, pago, tipo_gasto, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.item,
      data.fornecedor ?? '',
      data.valor,
      data.data,
      data.pago ?? 1,
      data.tipo_gasto,
      data.observacoes ?? ''
    );

    const created = this.getGeneralExpenseById(Number(res.lastInsertRowid));
    if (!created) throw new Error('Erro ao criar despesa geral.');
    return created;
  },

  updateGeneralExpense(id: number, data: Partial<GeneralExpense>): GeneralExpense | null {
    const current = this.getGeneralExpenseById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE despesas_gerais 
      SET item = ?, fornecedor = ?, valor = ?, data = ?, pago = ?, tipo_gasto = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.item ?? current.item,
      data.fornecedor ?? (current.fornecedor || ''),
      data.valor ?? current.valor,
      data.data ?? current.data,
      data.pago !== undefined ? data.pago : current.pago,
      data.tipo_gasto ?? current.tipo_gasto,
      data.observacoes ?? (current.observacoes || ''),
      id
    );

    return this.getGeneralExpenseById(id);
  },

  deleteGeneralExpense(id: number): boolean {
    const res = db.prepare('DELETE FROM despesas_gerais WHERE id = ?').run(id);
    return res.changes > 0;
  },

  getCostsSummary(): CostsSummaryDTO {
    // 1. Totais de custos de eventos
    const sumsEventos = db.prepare(`
      SELECT 
        SUM(cilindro) as totalCilindro,
        SUM(gerb) as totalGerb,
        SUM(gasolina) as totalGasolina,
        SUM(pedagio) as totalPedagio,
        SUM(vallet) as totalVallet,
        SUM(ajudante) as totalAjudante,
        SUM(monitor) as totalMonitor
      FROM custos_evento
    `).get() as Record<string, number | null>;

    const totalCilindro = Number(sumsEventos.totalCilindro || 0);
    const totalGerb = Number(sumsEventos.totalGerb || 0);
    const totalGasolina = Number(sumsEventos.totalGasolina || 0);
    const totalPedagio = Number(sumsEventos.totalPedagio || 0);
    const totalVallet = Number(sumsEventos.totalVallet || 0);
    const totalAjudante = Number(sumsEventos.totalAjudante || 0);
    const totalMonitor = Number(sumsEventos.totalMonitor || 0);
    const totalCustosEventos = totalCilindro + totalGerb + totalGasolina + totalPedagio + totalVallet + totalAjudante + totalMonitor;

    // 2. Totais de despesas gerais
    const sumsDespesas = db.prepare(`
      SELECT 
        tipo_gasto,
        SUM(valor) as total
      FROM despesas_gerais
      GROUP BY tipo_gasto
    `).all() as { tipo_gasto: string; total: number }[];

    let totalInvestimentos = 0;
    let totalMelhorias = 0;
    let totalManutencao = 0;
    let totalMarketing = 0;
    let totalImprevistos = 0;

    for (const d of sumsDespesas) {
      if (d.tipo_gasto === 'INVESTIMENTO') totalInvestimentos += Number(d.total || 0);
      else if (d.tipo_gasto === 'MELHORIAS') totalMelhorias += Number(d.total || 0);
      else if (d.tipo_gasto === 'MANUTENCAO') totalManutencao += Number(d.total || 0);
      else if (d.tipo_gasto === 'MARKETING') totalMarketing += Number(d.total || 0);
      else if (d.tipo_gasto === 'IMPREVISTO') totalImprevistos += Number(d.total || 0);
    }

    const totalDespesasGerais = totalInvestimentos + totalMelhorias + totalManutencao + totalMarketing + totalImprevistos;

    // 3. Faturamento total de eventos
    const sumFaturamento = db.prepare(`
      SELECT SUM(valor_total) as totalFaturamento FROM eventos
    `).get() as { totalFaturamento: number | null };

    const faturamentoTotalEventos = Number(sumFaturamento.totalFaturamento || 0);
    const lucroBrutoEventos = faturamentoTotalEventos - totalCustosEventos;
    const lucroLiquidoReal = lucroBrutoEventos - totalDespesasGerais;
    const margemGeralPercentual = faturamentoTotalEventos > 0 ? (lucroLiquidoReal / faturamentoTotalEventos) * 100 : 0;

    return {
      totalCilindro,
      totalGerb,
      totalGasolina,
      totalPedagio,
      totalVallet,
      totalAjudante,
      totalMonitor,
      totalCustosEventos,
      totalInvestimentos,
      totalMelhorias,
      totalManutencao,
      totalMarketing,
      totalImprevistos,
      totalDespesasGerais,
      faturamentoTotalEventos,
      lucroBrutoEventos,
      lucroLiquidoReal,
      margemGeralPercentual,
    };
  },

  mapEventCostRow(row: Record<string, unknown>): EventCost {
    const cilindro = Number(row.cilindro || 0);
    const gerb = Number(row.gerb || 0);
    const gasolina = Number(row.gasolina || 0);
    const pedagio = Number(row.pedagio || 0);
    const vallet = Number(row.vallet || 0);
    const ajudante = Number(row.ajudante || 0);
    const monitor = Number(row.monitor || 0);
    const totalCustos = cilindro + gerb + gasolina + pedagio + vallet + ajudante + monitor;
    const valorEvento = Number(row.ev_valor_total || 0);
    const lucroEvento = valorEvento - totalCustos;
    const margemLucro = valorEvento > 0 ? (lucroEvento / valorEvento) * 100 : 0;

    return {
      id: row.id ? Number(row.id) : undefined,
      evento_id: Number(row.evento_id || row.ev_id),
      cilindro,
      gerb,
      gasolina,
      pedagio,
      vallet,
      ajudante,
      pago_ajudante: Number(row.pago_ajudante || 0),
      monitor,
      pago_monitor: Number(row.pago_monitor || 0),
      status_custos: String(row.status_custos || 'PENDENTE') as 'PAGO' | 'PENDENTE',
      observacoes: row.observacoes ? String(row.observacoes) : undefined,
      created_at: row.created_at ? String(row.created_at) : undefined,
      updated_at: row.updated_at ? String(row.updated_at) : undefined,
      total_custos: totalCustos,
      valor_evento: valorEvento,
      lucro_evento: lucroEvento,
      margem_lucro: Number(margemLucro.toFixed(1)),
      evento: {
        id: Number(row.ev_id),
        cliente_id: Number(row.cl_id),
        nome_evento: row.ev_nome_evento ? String(row.ev_nome_evento) : undefined,
        data: String(row.ev_data),
        horario: String(row.ev_horario),
        endereco: String(row.ev_endereco),
        duracao: 1,
        status: String(row.ev_status || 'CONFIRMADO') as EventStatus,
        valor_total: valorEvento,
        cliente: {
          id: Number(row.cl_id),
          nome: String(row.cl_nome),
          cpf: String(row.cl_cpf),
          endereco: '',
          telefone: row.cl_telefone ? String(row.cl_telefone) : undefined,
        },
      },
    };
  },
};

// Inicializa o banco automaticamente ao carregar o módulo
initDatabase();


