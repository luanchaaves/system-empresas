import {
  Contract,
  CreateContractDTO,
  CompanyConfig,
  DashboardStats,
  Client,
  EventDetails,
  CreateEventDTO,
  UpdateEventDTO,
  Attraction,
  CreateAttractionDTO,
  UpdateAttractionDTO,
  FinancialEntry,
  CreateFinancialEntryDTO,
  SettleFinancialEntryDTO,
  FinancialStats,
  AttractionType,
  AttractionCategory,
  EventStatus,
  ContractStatus,
  PaymentStatus,
  EventCost,
  GeneralExpense,
  ExpenseCategory,
  CostsSummaryDTO,
} from '../../types/index.js';

const API_BASE = '/api';

/**
 * Utilitário seguro para requisições HTTP com parsing robusto e tratamento de erros
 */
async function fetchSafe<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error(
      'Não foi possível conectar ao servidor backend (porta 3001). Certifique-se de que a API está rodando.'
    );
  }

  const rawText = await res.text();
  let json: any = null;

  if (rawText && rawText.trim().length > 0) {
    try {
      json = JSON.parse(rawText);
    } catch {
      // Se não for JSON (ex: página de erro HTML 502/504 do Vite ou do Windows)
      json = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      json?.error ||
      (rawText && rawText.length < 200 ? rawText : `Erro no servidor (${res.status}: ${res.statusText})`);
    throw new Error(errorMsg);
  }

  return (json ?? {}) as T;
}

export const api = {
  // ==================== DASHBOARD ====================
  async getDashboard(): Promise<DashboardStats> {
    return fetchSafe<DashboardStats>(`${API_BASE}/dashboard`);
  },

  // ==================== CONTRATOS ====================
  async getContracts(params?: {
    search?: string;
    tipo?: AttractionType;
    status?: ContractStatus;
  }): Promise<Contract[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.tipo) query.set('tipo', params.tipo);
    if (params?.status) query.set('status', params.status);

    const url = `${API_BASE}/contratos${query.toString() ? `?${query.toString()}` : ''}`;
    return fetchSafe<Contract[]>(url);
  },

  async getContract(id: number): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/contratos/${id}`);
  },

  async createContract(dto: CreateContractDTO): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/contratos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async updateContract(id: number, dto: Partial<CreateContractDTO>): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/contratos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async duplicateContract(id: number): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/contratos/${id}/duplicate`, {
      method: 'POST',
    });
  },

  async regeneratePdf(id: number): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/contratos/${id}/regenerate-pdf`, {
      method: 'POST',
    });
  },

  async deleteContract(id: number): Promise<void> {
    await fetchSafe<{ message: string }>(`${API_BASE}/contratos/${id}`, {
      method: 'DELETE',
    });
  },

  async getPreviewHtml(dto: CreateContractDTO): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
    } catch {
      throw new Error('Servidor backend indisponível para renderização da prévia.');
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || 'Erro ao gerar prévia do contrato.');
    }
    return text;
  },

  getContractHtmlUrl(id: number): string {
    return `${API_BASE}/contratos/${id}/html`;
  },

  getContractPdfUrl(id: number): string {
    return `${API_BASE}/contratos/${id}/pdf`;
  },

  // ==================== EVENTOS & AGENDA ====================
  async getEvents(params?: {
    search?: string;
    status?: EventStatus;
    startDate?: string;
    endDate?: string;
    canalB2B?: string;
    tipoEvento?: string;
    isB2B?: boolean;
    isSocial?: boolean;
  }): Promise<EventDetails[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.canalB2B) query.set('canalB2B', params.canalB2B);
    if (params?.tipoEvento) query.set('tipoEvento', params.tipoEvento);
    if (params?.isB2B) query.set('isB2B', 'true');
    if (params?.isSocial) query.set('isSocial', 'true');

    const url = `${API_BASE}/eventos${query.toString() ? `?${query.toString()}` : ''}`;
    return fetchSafe<EventDetails[]>(url);
  },

  async getEvent(id: number): Promise<EventDetails> {
    return fetchSafe<EventDetails>(`${API_BASE}/eventos/${id}`);
  },

  async createEvent(dto: CreateEventDTO): Promise<EventDetails> {
    return fetchSafe<EventDetails>(`${API_BASE}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async updateEvent(id: number, dto: UpdateEventDTO): Promise<EventDetails> {
    return fetchSafe<EventDetails>(`${API_BASE}/eventos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async deleteEvent(id: number): Promise<void> {
    await fetchSafe<{ success: boolean }>(`${API_BASE}/eventos/${id}`, {
      method: 'DELETE',
    });
  },

  async generateContractFromEvent(id: number, data?: { tipo?: AttractionType; valor_total?: number }): Promise<Contract> {
    return fetchSafe<Contract>(`${API_BASE}/eventos/${id}/gerar-contrato`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
  },

  async syncGoogle(id: number): Promise<{ success: boolean; message?: string; web_link?: string }> {
    return fetchSafe<{ success: boolean; message?: string; web_link?: string }>(`${API_BASE}/eventos/${id}/google-sync`, {
      method: 'POST',
    });
  },


  // ==================== FINANCEIRO & FLUXO DE CAIXA ====================
  async getFinancialEntries(params?: {
    status?: PaymentStatus;
    eventoId?: number;
    contratoId?: number;
    clienteId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialEntry[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.eventoId) query.set('eventoId', String(params.eventoId));
    if (params?.contratoId) query.set('contratoId', String(params.contratoId));
    if (params?.clienteId) query.set('clienteId', String(params.clienteId));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const url = `${API_BASE}/financeiro${query.toString() ? `?${query.toString()}` : ''}`;
    return fetchSafe<FinancialEntry[]>(url);
  },

  async getFinancialStats(): Promise<FinancialStats> {
    return fetchSafe<FinancialStats>(`${API_BASE}/financeiro/stats`);
  },

  async createFinancialEntry(dto: CreateFinancialEntryDTO): Promise<FinancialEntry> {
    return fetchSafe<FinancialEntry>(`${API_BASE}/financeiro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async settleFinancialEntry(id: number, dto: SettleFinancialEntryDTO): Promise<FinancialEntry> {
    return fetchSafe<FinancialEntry>(`${API_BASE}/financeiro/${id}/baixar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async updateFinancialEntry(id: number, dto: Partial<FinancialEntry>): Promise<FinancialEntry> {
    return fetchSafe<FinancialEntry>(`${API_BASE}/financeiro/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async deleteFinancialEntry(id: number): Promise<void> {
    await fetchSafe<{ success: boolean; message: string }>(`${API_BASE}/financeiro/${id}`, {
      method: 'DELETE',
    });
  },

  async deduplicateFinancialEntries(): Promise<{ success: boolean; result: { removedCount: number; remainingCount: number } }> {
    return fetchSafe<{ success: boolean; result: { removedCount: number; remainingCount: number } }>(`${API_BASE}/financeiro/deduplicar`, {
      method: 'POST',
    });
  },

  async cancelFinancialEntry(id: number): Promise<FinancialEntry> {
    return fetchSafe<FinancialEntry>(`${API_BASE}/financeiro/${id}/cancelar`, {
      method: 'POST',
    });
  },

  // ==================== ATRAÇÕES & PERSONAGENS ====================
  async getAttractions(params?: { categoria?: AttractionCategory; ativo?: boolean }): Promise<Attraction[]> {
    const query = new URLSearchParams();
    if (params?.categoria) query.set('categoria', params.categoria);
    if (params?.ativo !== undefined) query.set('ativo', String(params.ativo));

    const url = `${API_BASE}/atracoes${query.toString() ? `?${query.toString()}` : ''}`;
    return fetchSafe<Attraction[]>(url);
  },

  async getAttraction(id: number): Promise<Attraction> {
    return fetchSafe<Attraction>(`${API_BASE}/atracoes/${id}`);
  },

  async createAttraction(dto: CreateAttractionDTO): Promise<Attraction> {
    return fetchSafe<Attraction>(`${API_BASE}/atracoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async updateAttraction(id: number, dto: UpdateAttractionDTO): Promise<Attraction> {
    return fetchSafe<Attraction>(`${API_BASE}/atracoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
  },

  async deleteAttraction(id: number): Promise<void> {
    await fetchSafe<{ success: boolean }>(`${API_BASE}/atracoes/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== CLIENTES ====================
  async getClients(search?: string): Promise<Client[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchSafe<Client[]>(`${API_BASE}/clientes${query}`);
  },

  async getClient(id: number): Promise<Client & { eventos?: EventDetails[]; contratos?: Contract[]; financeiro?: FinancialEntry[] }> {
    return fetchSafe<any>(`${API_BASE}/clientes/${id}`);
  },

  async createOrUpdateClient(data: { nome: string; cpf: string; endereco: string; telefone?: string; email?: string }): Promise<Client> {
    return fetchSafe<Client>(`${API_BASE}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteClient(id: number): Promise<void> {
    await fetchSafe<{ success: boolean }>(`${API_BASE}/clientes/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== CONFIGURAÇÕES & API KEY ====================
  async getConfig(): Promise<CompanyConfig> {
    return fetchSafe<CompanyConfig>(`${API_BASE}/configuracoes`);
  },

  async updateConfig(data: Partial<CompanyConfig>): Promise<CompanyConfig> {
    return fetchSafe<CompanyConfig>(`${API_BASE}/configuracoes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async generateApiKey(): Promise<{ api_key: string }> {
    return fetchSafe<{ api_key: string }>(`${API_BASE}/configuracoes/gerar-api-key`, {
      method: 'POST',
    });
  },

  async testGoogleCalendar(): Promise<{ success: boolean; message: string; calendar_title?: string }> {
    return fetchSafe<{ success: boolean; message: string; calendar_title?: string }>(`${API_BASE}/configuracoes/google-test`, {
      method: 'POST',
    });
  },

  // ==================== CUSTOS & DESPESAS (DRE, EVENTOS E COMPRAS) ====================
  async getCostsSummary(): Promise<CostsSummaryDTO> {
    return fetchSafe<CostsSummaryDTO>(`${API_BASE}/custos/kpis`);
  },

  async listEventCosts(search?: string): Promise<EventCost[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetchSafe<EventCost[]>(`${API_BASE}/custos/eventos${query}`);
  },

  async getEventCost(eventoId: number): Promise<EventCost> {
    return fetchSafe<EventCost>(`${API_BASE}/custos/eventos/${eventoId}`);
  },

  async saveEventCost(eventoId: number, data: Partial<EventCost>): Promise<EventCost> {
    return fetchSafe<EventCost>(`${API_BASE}/custos/eventos/${eventoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async toggleCostPagoField(eventoId: number, field: 'pago_ajudante' | 'pago_monitor' | 'status_custos'): Promise<EventCost> {
    return fetchSafe<EventCost>(`${API_BASE}/custos/eventos/${eventoId}/toggle-pago`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field }),
    });
  },

  async listGeneralExpenses(filters?: { tipo?: string; pago?: number; search?: string }): Promise<GeneralExpense[]> {
    const params = new URLSearchParams();
    if (filters?.tipo && filters.tipo !== 'TODOS') params.append('tipo', filters.tipo);
    if (filters?.pago !== undefined && filters.pago !== -1) params.append('pago', String(filters.pago));
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchSafe<GeneralExpense[]>(`${API_BASE}/custos/despesas-gerais${query}`);
  },

  async createGeneralExpense(data: Omit<GeneralExpense, 'id'>): Promise<GeneralExpense> {
    return fetchSafe<GeneralExpense>(`${API_BASE}/custos/despesas-gerais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateGeneralExpense(id: number, data: Partial<GeneralExpense>): Promise<GeneralExpense> {
    return fetchSafe<GeneralExpense>(`${API_BASE}/custos/despesas-gerais/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async deleteGeneralExpense(id: number): Promise<void> {
    await fetchSafe<{ success: boolean }>(`${API_BASE}/custos/despesas-gerais/${id}`, {
      method: 'DELETE',
    });
  },
};


