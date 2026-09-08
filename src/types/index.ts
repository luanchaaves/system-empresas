export type AttractionType = 'ROBO_LED' | 'PERSONAGEM';

export type AttractionCategory = 'ROBO_LED' | 'PERSONAGEM_VIVO' | 'OUTRO';

export type EventStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'REALIZADO' | 'CANCELADO';

export type EventType = 'CASAMENTO' | 'ANIVERSARIO' | 'DEBUTANTE' | 'CORPORATIVO' | 'INFANTIL' | 'OUTRO';

export type ContractStatus = 'RASCUNHO' | 'GERADO' | 'FINALIZADO' | 'CANCELADO';

export type PaymentStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'TRANSFERENCIA' | 'OUTRO';

export type PaymentInstallmentType = 'ENTRADA' | 'RESTANTE' | 'AVULSO';

export interface CompanyConfig {
  id: number;
  company_name: string;
  responsavel: string;
  documento: string; // CNPJ ou CPF
  endereco: string;
  telefone?: string;
  email?: string;
  cidade: string;
  estado: string;
  cep?: string;
  api_key?: string;
  google_calendar_enabled?: boolean | number;
  google_calendar_id?: string;
  google_calendar_credentials?: string;
  updated_at?: string;
}


export interface Client {
  id: number;
  nome: string;
  cpf: string;
  endereco: string;
  telefone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attraction {
  id: number;
  nome: string;
  categoria: AttractionCategory;
  descricao?: string;
  valor_base: number;
  ativo: number; // 1 = Sim, 0 = Não
  foto_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EventAttraction {
  id: number;
  evento_id: number;
  atracao_id: number;
  quantidade: number;
  valor_unitario: number;
  observacoes?: string;
  atracao?: Attraction;
}

export interface EventDetails {
  id: number;
  cliente_id: number;
  nome_evento?: string;
  tipo_evento?: EventType;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  horario_termino?: string; // HH:mm
  endereco: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  duracao: number; // in hours (e.g., 1, 1.5, 2)
  status: EventStatus;
  valor_total: number;
  observacoes?: string;
  contrato_id?: number | null;
  google_event_id?: string;
  created_at?: string;
  updated_at?: string;

  // Joined relations
  cliente?: Client;
  atracoes?: EventAttraction[];
  contrato?: Contract;
  financeiro?: FinancialEntry[];
}

export interface FinancialEntry {
  id: number;
  evento_id: number;
  contrato_id?: number;
  cliente_id: number;
  descricao: string;
  tipo_parcela: PaymentInstallmentType;
  valor: number;
  data_vencimento: string; // YYYY-MM-DD
  data_pagamento?: string; // YYYY-MM-DD
  status: PaymentStatus;
  forma_pagamento?: PaymentMethod;
  comprovante_ref?: string;
  created_at?: string;
  updated_at?: string;

  cliente?: Client;
  contrato?: Contract;
  evento?: EventDetails;
}

export interface Contract {
  id: number;
  numero: string; // RLP-YYYY-NNNNNN
  tipo: AttractionType;
  cliente_id: number;
  evento_id: number;
  personagem?: string;
  quantidade_personagens: number;
  valor_total: number;
  valor_entrada: number;
  valor_restante: number;
  percentual_entrada?: number; // default 40
  percentual_restante?: number; // default 60
  uso_imagem: number; // 1 = Autorizado, 0 = Não autorizado
  status: ContractStatus;
  pdf_path?: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields for ease of display
  cliente?: Client;
  evento?: EventDetails;
  financeiro?: FinancialEntry[];
}

export interface CreateContractDTO {
  // Cliente
  cliente_nome: string;
  cliente_cpf: string;
  cliente_endereco: string;
  cliente_telefone?: string;
  cliente_email?: string;

  // Evento
  evento_id?: number; // Se selecionou um evento existente da agenda
  nome_evento?: string;
  tipo_evento?: EventType;
  evento_data: string; // YYYY-MM-DD
  evento_horario: string; // HH:mm
  evento_endereco: string;
  evento_cidade?: string;
  evento_estado?: string;
  evento_cep?: string;
  evento_duracao: number;
  evento_observacoes?: string;

  // Atração
  tipo: AttractionType;
  personagem?: string;
  quantidade_personagens?: number;
  atracao_ids?: number[];

  // Financeiro & Opções
  valor_total: number;
  uso_imagem?: boolean; // default true
  status?: ContractStatus;
}

export interface CreateEventDTO {
  cliente_id?: number;
  cliente_nome?: string;
  cliente_cpf?: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  cliente_email?: string;

  nome_evento?: string;
  tipo_evento?: EventType;
  data: string;
  horario: string;
  duracao: number;
  endereco: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status?: EventStatus;
  valor_total: number;
  observacoes?: string;

  // Atrações
  atracao_ids?: number[];
  personagem_nome?: string;
  tipo_atracao?: AttractionType;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
  status?: EventStatus;
  horario_termino?: string;
}

export interface CreateAttractionDTO {
  nome: string;
  categoria: AttractionCategory;
  descricao?: string;
  valor_base: number;
  ativo?: boolean;
  foto_url?: string;
}

export interface UpdateAttractionDTO extends Partial<CreateAttractionDTO> {}

export interface CreateFinancialEntryDTO {
  evento_id: number;
  contrato_id?: number;
  cliente_id: number;
  descricao: string;
  tipo_parcela: PaymentInstallmentType;
  valor: number;
  data_vencimento: string;
  forma_pagamento?: PaymentMethod;
}

export interface SettleFinancialEntryDTO {
  data_pagamento?: string;
  forma_pagamento: PaymentMethod;
  comprovante_ref?: string;
}

export interface FinancialStats {
  totalFaturado: number;
  totalRecebido: number;
  totalAReceber: number;
  totalAtrasado: number;
  taxaRecebimento: number;
  lancamentosPendentes: number;
  lancamentosPagos: number;
  lancamentosAtrasados: number;
}

export interface ContractTemplateData {
  empresa: {
    nome: string;
    responsavel: string;
    documento: string;
    endereco: string;
    cidade: string;
    estado: string;
    telefone: string;
    email: string;
  };
  cliente: {
    nome: string;
    cpf: string;
    endereco: string;
    telefone?: string;
    email?: string;
  };
  evento: {
    data: string;
    data_formatada: string;
    horario: string;
    horario_termino: string;
    endereco: string;
    duracao: number;
    duracao_formatada: string;
    observacoes?: string;
  };
  atracao: {
    tipo: AttractionType;
    tipo_formatado: string;
    personagem: string;
    quantidade: number;
    descricao_personagens: string;
  };
  financeiro: {
    valor_total: string;
    valor_total_numero: number;
    valor_entrada: string;
    valor_entrada_numero: number;
    valor_restante: string;
    valor_restante_numero: number;
    percentual_entrada: number;
    percentual_restante: number;
  };
  contrato: {
    numero: string;
    data_emissao: string;
    data_emissao_extenso: string;
    cidade_emissao: string;
    uso_imagem_autorizado: boolean;
  };
}

export interface MonthlyEventStats {
  mes: string; // '2026-05'
  mesFormatado: string; // 'Mai/2026'
  ano: number;
  totalEventos: number;
  eventosRealizados: number;
  eventosAgendados: number;
  eventosCancelados: number;
  faturamentoTotal: number;
  totalRecebido: number;
  totalPendente: number;
}

export interface YearlyEventStats {
  ano: number;
  totalEventos: number;
  eventosRealizados: number;
  eventosAgendados: number;
  faturamentoTotal: number;
  totalRecebido: number;
  totalPendente: number;
  ticketMedio: number;
}

export interface DashboardStats {
  totalContratos: number;
  totalEventos: number;
  eventosFuturos: number;
  eventosMes: number;
  contratosRoboLed: number;
  contratosPersonagens: number;
  valorTotalContratado: number;
  valorTotalRecebido: number;
  valorPendenteReceber: number;
  eventosPorMes: MonthlyEventStats[];
  metricasPorAno: YearlyEventStats[];
  proximosEventos: Array<{
    id: number;
    numero?: string;
    nome_evento?: string;
    cliente_nome: string;
    tipo: AttractionType;
    personagem?: string;
    data_evento: string;
    horario: string;
    horario_termino?: string;
    endereco: string;
    valor_total: number;
    status_evento: EventStatus;
    status_contrato?: ContractStatus;
    status_financeiro?: PaymentStatus;
    contrato_id?: number;
    pdf_path?: string;
  }>;
}

/**
 * Payload de Importação Externa (LED Partner API / Webhook Integration)
 */
export interface IntegrationImportEventDTO {
  cliente: {
    nome: string;
    email?: string;
    telefone?: string;
    documento: string; // CPF ou CNPJ
    endereco?: string;
  };
  evento: {
    nome_evento?: string;
    tipo_evento?: EventType;
    data_evento: string; // ISO ou YYYY-MM-DDTHH:mm:ss
    local: string;
    duracao?: number;
    personagens?: number[] | string[];
    valor_total: number;
    observacoes?: string;
    criar_contrato?: boolean;
    tipo_contrato?: AttractionType;
  };
}

/**
 * Módulo de Custos & Despesas
 */
export type ExpenseCategory =
  | 'INVESTIMENTO'
  | 'MELHORIAS'
  | 'MANUTENCAO'
  | 'MARKETING'
  | 'IMPREVISTO'
  | 'OUTRO';

export interface EventCost {
  id?: number;
  evento_id: number;
  cilindro: number;
  gerb: number;
  gasolina: number;
  pedagio: number;
  vallet: number;
  ajudante: number;
  pago_ajudante: number; // 1 = Pago, 0 = Pendente
  monitor: number;
  pago_monitor: number; // 1 = Pago, 0 = Pendente
  status_custos: 'PAGO' | 'PENDENTE';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;

  // Campos calculados / expandidos
  total_custos?: number;
  valor_evento?: number;
  lucro_evento?: number;
  margem_lucro?: number; // em %
  evento?: EventDetails;
}

export interface GeneralExpense {
  id?: number;
  item: string;
  fornecedor?: string;
  valor: number;
  data: string; // YYYY-MM-DD
  pago: number; // 1 = Sim, 0 = Não
  tipo_gasto: ExpenseCategory;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CostsSummaryDTO {
  // Totais por linha de custo de evento
  totalCilindro: number;
  totalGerb: number;
  totalGasolina: number;
  totalPedagio: number;
  totalVallet: number;
  totalAjudante: number;
  totalMonitor: number;
  totalCustosEventos: number;

  // Totais de despesas gerais por categoria
  totalInvestimentos: number;
  totalMelhorias: number;
  totalManutencao: number;
  totalMarketing: number;
  totalImprevistos: number;
  totalDespesasGerais: number;

  // DRE Geral
  faturamentoTotalEventos: number;
  lucroBrutoEventos: number; // Faturamento - Custos Diretos
  lucroLiquidoReal: number; // Lucro Bruto - Despesas Gerais
  margemGeralPercentual: number;
}

