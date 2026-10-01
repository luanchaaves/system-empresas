import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  Store,
  FileText,
  Check,
  X,
  CreditCard,
  Share2,
} from 'lucide-react';
import { api } from '../api/index.js';
import { EventDetails, EventStatus, Attraction, CreateEventDTO, B2BChannel, PaymentMethod } from '../../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

interface BurgerKingPageProps {
  searchQuery?: string;
  onNavigateToFinancial?: () => void;
}

export const BurgerKingPage: React.FC<BurgerKingPageProps> = ({
  searchQuery = '',
  onNavigateToFinancial,
}) => {
  const { success, error, info } = useToast();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-aba ativa
  const [activeTab, setActiveTab] = useState<'FILA' | 'TABELA' | 'LOJAS'>('FILA');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterCanal, setFilterCanal] = useState<string>('TODOS');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('TODOS');

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDetails | null>(null);
  const [settlingEntryId, setSettlingEntryId] = useState<number | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('PIX');

  // Form State
  const [formData, setFormData] = useState({
    loja_unidade: '',
    canal_b2b: 'DIRETO_BK' as B2BChannel,
    data: new Date().toISOString().split('T')[0],
    horario: '14:00',
    duracao: 2,
    endereco: '',
    cidade: 'São Bernardo do Campo',
    estado: 'SP',
    valor_total: 500,
    prazo_pagamento_dias: 60,
    nota_fiscal_ref: '',
    observacoes: '',
    atracao_ids: [] as number[],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, attractionsData] = await Promise.all([
        api.getEvents({ isB2B: true }),
        api.getAttractions({ onlyActive: true }),
      ]);
      setEvents(eventsData);
      setAttractions(attractionsData);
    } catch (err: any) {
      error(err.message || 'Erro ao carregar eventos do Burger King.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Métricas Consolidadas BK
  const metrics = useMemo(() => {
    let faturadoTotal = 0;
    let recebidoTotal = 0;
    let aReceberTotal = 0;
    let atrasadoTotal = 0;
    const lojasSet = new Set<string>();

    const now = new Date();

    events.forEach((evt) => {
      faturadoTotal += evt.valor_total || 0;
      if (evt.loja_unidade) lojasSet.add(evt.loja_unidade.trim().toLowerCase());
      else if (evt.endereco) lojasSet.add(evt.endereco.trim().toLowerCase());

      const fins = evt.financeiro || [];
      if (fins.length === 0) {
        // Se ainda não gerou parcela, conta como a receber
        aReceberTotal += evt.valor_total || 0;
      } else {
        fins.forEach((fin) => {
          if (fin.status === 'PAGO') {
            recebidoTotal += fin.valor;
          } else {
            aReceberTotal += fin.valor;
            const venc = new Date(fin.data_vencimento + 'T23:59:59');
            if (venc < now) {
              atrasadoTotal += fin.valor;
            }
          }
        });
      }
    });

    return {
      faturadoTotal,
      recebidoTotal,
      aReceberTotal,
      atrasadoTotal,
      totalLojas: lojasSet.size,
      totalAcoes: events.length,
    };
  }, [events]);

  // Eventos Filtrados
  const filteredEvents = useMemo(() => {
    const term = (searchQuery || search).toLowerCase().trim();

    return events.filter((evt) => {
      // Filtro de Busca
      const matchSearch =
        !term ||
        (evt.loja_unidade && evt.loja_unidade.toLowerCase().includes(term)) ||
        (evt.nome_evento && evt.nome_evento.toLowerCase().includes(term)) ||
        (evt.endereco && evt.endereco.toLowerCase().includes(term)) ||
        (evt.cliente?.nome && evt.cliente.nome.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Filtro de Canal
      if (filterCanal !== 'TODOS') {
        if (evt.canal_b2b !== filterCanal) return false;
      }

      // Filtro de Pagamento
      if (filterPaymentStatus !== 'TODOS') {
        const isPaid = evt.financeiro?.every((f) => f.status === 'PAGO') && (evt.financeiro?.length || 0) > 0;
        if (filterPaymentStatus === 'PAGO' && !isPaid) return false;
        if (filterPaymentStatus === 'PENDENTE' && isPaid) return false;
      }

      return true;
    });
  }, [events, searchQuery, search, filterCanal, filterPaymentStatus]);

  // Fila de Espera / Recebíveis com Aging (30, 60, 90 dias)
  const agingGroups = useMemo(() => {
    const now = new Date();
    const upTo30: Array<{ event: EventDetails; fin?: any; diasRestantes: number }> = [];
    const from31To60: Array<{ event: EventDetails; fin?: any; diasRestantes: number }> = [];
    const from61To90: Array<{ event: EventDetails; fin?: any; diasRestantes: number }> = [];
    const overdue: Array<{ event: EventDetails; fin?: any; diasAtraso: number }> = [];

    filteredEvents.forEach((evt) => {
      const pendingFins = (evt.financeiro || []).filter((f) => f.status !== 'PAGO');

      if (pendingFins.length > 0) {
        pendingFins.forEach((fin) => {
          const venc = new Date(fin.data_vencimento + 'T12:00:00');
          const diffMs = venc.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            overdue.push({ event: evt, fin, diasAtraso: Math.abs(diffDays) });
          } else if (diffDays <= 30) {
            upTo30.push({ event: evt, fin, diasRestantes: diffDays });
          } else if (diffDays <= 60) {
            from31To60.push({ event: evt, fin, diasRestantes: diffDays });
          } else {
            from61To90.push({ event: evt, fin, diasRestantes: diffDays });
          }
        });
      } else if (!evt.financeiro || evt.financeiro.length === 0) {
        // Sem financeiro cadastrado -> calcula pelo prazo da data do evento
        const evtDate = new Date(evt.data + 'T12:00:00');
        const prazo = evt.prazo_pagamento_dias || 60;
        evtDate.setDate(evtDate.getDate() + prazo);
        const diffMs = evtDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          overdue.push({ event: evt, diasAtraso: Math.abs(diffDays) });
        } else if (diffDays <= 30) {
          upTo30.push({ event: evt, diasRestantes: diffDays });
        } else if (diffDays <= 60) {
          from31To60.push({ event: evt, diasRestantes: diffDays });
        } else {
          from61To90.push({ event: evt, diasRestantes: diffDays });
        }
      }
    });

    return { upTo30, from31To60, from61To90, overdue };
  }, [filteredEvents]);

  // Agrupamento por Loja
  const lojaGroups = useMemo(() => {
    const map = new Map<string, { total: number; count: number; canal: string; events: EventDetails[] }>();
    events.forEach((evt) => {
      const nomeLoja = evt.loja_unidade || evt.endereco || 'Loja Não Identificada';
      const existing = map.get(nomeLoja) || { total: 0, count: 0, canal: evt.canal_b2b || 'DIRETO_BK', events: [] };
      existing.total += evt.valor_total || 0;
      existing.count += 1;
      existing.events.push(evt);
      map.set(nomeLoja, existing);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [events]);

  const handleOpenCreate = () => {
    setFormData({
      loja_unidade: '',
      canal_b2b: 'DIRETO_BK',
      data: new Date().toISOString().split('T')[0],
      horario: '14:00',
      duracao: 2,
      endereco: '',
      cidade: 'São Paulo',
      estado: 'SP',
      valor_total: 500,
      prazo_pagamento_dias: 60,
      nota_fiscal_ref: '',
      observacoes: '',
      atracao_ids: attractions.length > 0 ? [attractions[0].id] : [],
    });
    setShowCreateModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loja_unidade.trim()) {
      error('Informe o nome da loja ou shopping do Burger King.');
      return;
    }

    try {
      let clienteNome = 'Burger King Brasil (Direto)';
      if (formData.canal_b2b === 'REI_DOS_ADESIVOS') clienteNome = 'Rei dos Adesivos (Burger King)';
      else if (formData.canal_b2b === 'OG_GRAFICA') clienteNome = 'OG Gráfica (Burger King)';

      const payload: CreateEventDTO = {
        cliente_nome: clienteNome,
        cliente_cpf: '00.000.000/0001-00',
        nome_evento: `Burger King - ${formData.loja_unidade.trim()}`,
        tipo_evento: 'CORPORATIVO_BK',
        canal_b2b: formData.canal_b2b,
        loja_unidade: formData.loja_unidade.trim(),
        data: formData.data,
        horario: formData.horario,
        duracao: Number(formData.duracao),
        endereco: formData.endereco.trim() || formData.loja_unidade.trim(),
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim(),
        valor_total: Number(formData.valor_total),
        prazo_pagamento_dias: Number(formData.prazo_pagamento_dias),
        nota_fiscal_ref: formData.nota_fiscal_ref.trim(),
        observacoes: formData.observacoes.trim(),
        atracao_ids: formData.atracao_ids,
        status: 'CONFIRMADO',
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
        success('Evento do Burger King atualizado com sucesso!');
      } else {
        await api.createEvent(payload);
        success('Evento do Burger King cadastrado na fila!');
      }

      setShowCreateModal(false);
      setEditingEvent(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar evento do Burger King.');
    }
  };

  const handleSettleEventOrFin = async (event: EventDetails, finId?: number) => {
    try {
      if (finId) {
        await api.settleFinancialEntry(finId, {
          forma_pagamento: settleMethod,
          data_pagamento: new Date().toISOString().split('T')[0],
        });
      } else {
        const val = (event.valor_total && event.valor_total > 0) ? event.valor_total : 550;
        await api.createFinancialEntry({
          evento_id: event.id,
          cliente_id: event.cliente_id,
          tipo_parcela: 'RESTANTE',
          valor: val,
          data_vencimento: event.data,
          data_pagamento: new Date().toISOString().split('T')[0],
          status: 'PAGO',
          forma_pagamento: settleMethod,
          descricao: `Recebimento BK - ${event.loja_unidade || event.endereco || 'Loja'}`,
        } as any);
      }
      success(`Pagamento baixado com sucesso para ${event.loja_unidade || event.endereco || 'evento'}!`);
      setSettlingEntryId(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao dar baixa no pagamento.');
    }
  };

  const getCanalBadge = (canal?: B2BChannel) => {
    switch (canal) {
      case 'REI_DOS_ADESIVOS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Rei dos Adesivos</span>;
      case 'OG_GRAFICA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">OG Gráfica</span>;
      case 'DIRETO_BK':
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Direto BK (Homologado)</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-red-950/40 via-amber-950/20 to-neutral-900 border border-amber-600/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Burger King & B2B</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-black">HOMOLOGADO</span>
            </div>
            <p className="text-sm text-neutral-400 mt-1">
              Fila de recebíveis corporativos (30/60/90 dias), controle de lojas e faturamento B2B via Direto, Rei dos Adesivos e OG Gráfica.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          + Novo Evento BK Express
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Faturamento Total BK</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white mt-3">{formatCurrencyBRL(metrics.faturadoTotal)}</div>
          <div className="text-xs text-neutral-400 mt-1">{metrics.totalAcoes} ações e eventos realizados</div>
        </div>

        {/* Fila a Receber */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Fila a Receber (A Prazo)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-3">{formatCurrencyBRL(metrics.aReceberTotal)}</div>
          <div className="text-xs text-neutral-400 mt-1">Aguardando liquidação (30 a 90d)</div>
        </div>

        {/* Já Recebido */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Já Liquidado / Pago</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-3">{formatCurrencyBRL(metrics.recebidoTotal)}</div>
          <div className="text-xs text-neutral-400 mt-1">Valores recebidos em conta</div>
        </div>

        {/* Lojas Atendidas */}
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Lojas & Unidades</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-3">{metrics.totalLojas} Lojas</div>
          <div className="text-xs text-neutral-400 mt-1">Shoppings e lojas de rua</div>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3">
        {/* Sub-Abas */}
        <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800/80">
          <button
            onClick={() => setActiveTab('FILA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'FILA'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            ⏳ Fila de Recebíveis (30/60/90d)
          </button>
          <button
            onClick={() => setActiveTab('TABELA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'TABELA'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            📊 Planilha / Todos os Eventos
          </button>
          <button
            onClick={() => setActiveTab('LOJAS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'LOJAS'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4" />
            🏢 Consolidado por Loja
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar loja, shopping..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Canal Filter */}
          <select
            value={filterCanal}
            onChange={(e) => setFilterCanal(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos os Canais</option>
            <option value="DIRETO_BK">Direto BK (Homologado)</option>
            <option value="REI_DOS_ADESIVOS">Rei dos Adesivos</option>
            <option value="OG_GRAFICA">OG Gráfica</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-neutral-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos os Pagamentos</option>
            <option value="PENDENTE">Aguardando Pagamento</option>
            <option value="PAGO">Liquidados / Pagos</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-neutral-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mb-3" />
          <p>Carregando dados do Burger King...</p>
        </div>
      ) : activeTab === 'FILA' ? (
        /* ==================== FILA DE RECEBÍVEIS (AGING) ==================== */
        <div className="space-y-6">
          {/* Alertas de Vencimento / Aging Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Atrasados (+90d) */}
            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Vencidos (+90 dias)
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                  {agingGroups.overdue.length}
                </span>
              </div>
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {agingGroups.overdue.length === 0 ? (
                  <div className="text-xs text-neutral-500 text-center py-8">Nenhum recebível atrasado 🎉</div>
                ) : (
                  agingGroups.overdue.map(({ event, fin, diasAtraso }) => (
                    <div
                      key={`${event.id}-${fin?.id || 0}`}
                      className="p-3.5 bg-neutral-900/90 border border-red-500/40 rounded-xl space-y-2 hover:border-red-400 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-white line-clamp-1">
                          {event.loja_unidade || event.endereco}
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                          +{diasAtraso}d atraso
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2">
                        <span>Data: {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        {getCanalBadge(event.canal_b2b)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <span className="font-black text-amber-400 text-sm">
                          {formatCurrencyBRL(fin?.valor || (event.valor_total > 0 ? event.valor_total : 550))}
                        </span>
                        <button
                          onClick={() => {
                            if (fin?.id) setSettlingEntryId(fin.id);
                            handleSettleEventOrFin(event, fin?.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Até 30 dias */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Vencendo em até 30d
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
                  {agingGroups.upTo30.length}
                </span>
              </div>
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {agingGroups.upTo30.length === 0 ? (
                  <div className="text-xs text-neutral-500 text-center py-8">Nenhum evento nesta faixa</div>
                ) : (
                  agingGroups.upTo30.map(({ event, fin, diasRestantes }) => (
                    <div
                      key={`${event.id}-${fin?.id || 0}`}
                      className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2 hover:border-amber-500/50 transition-all shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-white line-clamp-1">
                          {event.loja_unidade || event.endereco}
                        </div>
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {diasRestantes}d restantes
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2">
                        <span>Data: {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        {getCanalBadge(event.canal_b2b)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <span className="font-black text-amber-400 text-sm">
                          {formatCurrencyBRL(fin?.valor || (event.valor_total > 0 ? event.valor_total : 550))}
                        </span>
                        <button
                          onClick={() => {
                            if (fin?.id) setSettlingEntryId(fin.id);
                            handleSettleEventOrFin(event, fin?.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 31 a 60 dias */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 31 a 60 dias
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400">
                  {agingGroups.from31To60.length}
                </span>
              </div>
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {agingGroups.from31To60.length === 0 ? (
                  <div className="text-xs text-neutral-500 text-center py-8">Nenhum evento nesta faixa</div>
                ) : (
                  agingGroups.from31To60.map(({ event, fin, diasRestantes }) => (
                    <div
                      key={`${event.id}-${fin?.id || 0}`}
                      className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-white line-clamp-1">
                          {event.loja_unidade || event.endereco}
                        </div>
                        <span className="text-xs text-neutral-400">{diasRestantes}d prazo</span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2">
                        <span>Data: {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        {getCanalBadge(event.canal_b2b)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <span className="font-black text-neutral-200 text-sm">
                          {formatCurrencyBRL(fin?.valor || (event.valor_total > 0 ? event.valor_total : 550))}
                        </span>
                        <button
                          onClick={() => {
                            if (fin?.id) setSettlingEntryId(fin.id);
                            handleSettleEventOrFin(event, fin?.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 61 a 90 dias */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> 61 a 90 dias
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400">
                  {agingGroups.from61To90.length}
                </span>
              </div>
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {agingGroups.from61To90.length === 0 ? (
                  <div className="text-xs text-neutral-500 text-center py-8">Nenhum evento nesta faixa</div>
                ) : (
                  agingGroups.from61To90.map(({ event, fin, diasRestantes }) => (
                    <div
                      key={`${event.id}-${fin?.id || 0}`}
                      className="p-3.5 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2 hover:border-neutral-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-sm text-white line-clamp-1">
                          {event.loja_unidade || event.endereco}
                        </div>
                        <span className="text-xs text-neutral-500">{diasRestantes}d prazo</span>
                      </div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2">
                        <span>Data: {new Date(event.data + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span>•</span>
                        {getCanalBadge(event.canal_b2b)}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                        <span className="font-black text-neutral-300 text-sm">
                          {formatCurrencyBRL(fin?.valor || (event.valor_total > 0 ? event.valor_total : 550))}
                        </span>
                        <button
                          onClick={() => {
                            if (fin?.id) setSettlingEntryId(fin.id);
                            handleSettleEventOrFin(event, fin?.id);
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Dar Baixa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'TABELA' ? (
        /* ==================== TABELA PLANILHA COMPACTA (EXCEL STYLE) ==================== */
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300 border-collapse">
              <thead className="bg-neutral-950 text-xs uppercase font-bold text-neutral-400 tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3.5 px-4">Data / Horário</th>
                  <th className="py-3.5 px-4">Loja / Shopping / Local</th>
                  <th className="py-3.5 px-4">Canal B2B</th>
                  <th className="py-3.5 px-4">Atração</th>
                  <th className="py-3.5 px-4 text-right">Valor Total</th>
                  <th className="py-3.5 px-4 text-center">Prazo Faturamento</th>
                  <th className="py-3.5 px-4 text-center">Status Pagamento</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-medium">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                      Nenhum evento do Burger King encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => {
                    const isPaid = evt.financeiro?.every((f) => f.status === 'PAGO') && (evt.financeiro?.length || 0) > 0;
                    const fin = evt.financeiro?.[0];

                    return (
                      <tr key={evt.id} className="hover:bg-neutral-800/40 transition-colors group">
                        <td className="py-3 px-4 text-white font-mono text-xs">
                          <div className="font-bold">{new Date(evt.data + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                          <div className="text-neutral-500">{evt.horario} ({evt.duracao}h)</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <span>{evt.loja_unidade || evt.endereco}</span>
                          </div>
                          {evt.nota_fiscal_ref && (
                            <span className="text-[10px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              NF: {evt.nota_fiscal_ref}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">{getCanalBadge(evt.canal_b2b)}</td>
                        <td className="py-3 px-4 text-xs text-neutral-300">
                          {evt.atracoes?.map((a) => a.atracao?.nome || 'Robô Nextrom').join(', ') || 'Robô Nextrom'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-amber-400">
                          {formatCurrencyBRL(evt.valor_total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs text-neutral-300 bg-neutral-800/80 px-2.5 py-1 rounded-full border border-neutral-700">
                            {evt.prazo_pagamento_dias || 60} dias
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5" /> Aguardando
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <button
                                onClick={() => handleSettleEventOrFin(evt, fin?.id)}
                                title="Dar baixa no pagamento"
                                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingEvent(evt);
                                setFormData({
                                  loja_unidade: evt.loja_unidade || evt.endereco,
                                  canal_b2b: evt.canal_b2b || 'DIRETO_BK',
                                  data: evt.data,
                                  horario: evt.horario,
                                  duracao: evt.duracao || 2,
                                  endereco: evt.endereco,
                                  cidade: evt.cidade || 'São Paulo',
                                  estado: evt.estado || 'SP',
                                  valor_total: evt.valor_total || 500,
                                  prazo_pagamento_dias: evt.prazo_pagamento_dias || 60,
                                  nota_fiscal_ref: evt.nota_fiscal_ref || '',
                                  observacoes: evt.observacoes || '',
                                  atracao_ids: evt.atracoes?.map((a) => a.atracao_id) || [],
                                });
                                setShowCreateModal(true);
                              }}
                              title="Editar Evento BK"
                              className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ==================== CONSOLIDADO POR LOJA ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lojaGroups.map(([nomeLoja, info]) => (
            <div
              key={nomeLoja}
              className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{nomeLoja}</h3>
                    <p className="text-xs text-neutral-400">{info.count} evento(s) realizados</p>
                  </div>
                </div>
                {getCanalBadge(info.canal as B2BChannel)}
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Total Faturado:</span>
                <span className="font-black text-amber-400 text-lg">{formatCurrencyBRL(info.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL DE CADASTRO / EDIÇÃO BK EXPRESS ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 bg-gradient-to-r from-amber-950/40 to-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingEvent ? 'Editar Evento Burger King' : 'Novo Evento Burger King (Express)'}
                  </h2>
                  <p className="text-xs text-neutral-400">Preenchimento ágil focado em faturamento B2B</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Loja / Shopping */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Loja / Shopping / Unidade BK *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Shopping Gran Plaza, Loja Radial Leste, Loja Santo André..."
                  value={formData.loja_unidade}
                  onChange={(e) => setFormData({ ...formData, loja_unidade: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Canal Intermediador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Canal / Intermediador *
                  </label>
                  <select
                    value={formData.canal_b2b}
                    onChange={(e) => setFormData({ ...formData, canal_b2b: e.target.value as B2BChannel })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="DIRETO_BK">🍔 Direto Burger King (Homologado)</option>
                    <option value="REI_DOS_ADESIVOS">🏷️ Rei dos Adesivos (Terceiro)</option>
                    <option value="OG_GRAFICA">🖨️ OG Gráfica (Terceiro)</option>
                    <option value="OUTRO_B2B">🏢 Outra Agência / B2B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Prazo Pagamento (Dias) *
                  </label>
                  <select
                    value={formData.prazo_pagamento_dias}
                    onChange={(e) => setFormData({ ...formData, prazo_pagamento_dias: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value={30}>30 Dias</option>
                    <option value={60}>60 Dias (Padrão BK)</option>
                    <option value={90}>90 Dias (Até 3 meses)</option>
                  </select>
                </div>
              </div>

              {/* Data, Horário e Duração */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Duração (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.duracao}
                    onChange={(e) => setFormData({ ...formData, duracao: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Valor Total & Atração */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Valor Cobrado (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-amber-400 font-bold text-base focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Atração Principal
                  </label>
                  <select
                    value={formData.atracao_ids[0] || ''}
                    onChange={(e) => setFormData({ ...formData, atracao_ids: [Number(e.target.value)] })}
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    {attractions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Número da NF ou Referência */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Número da Nota Fiscal / Pedido (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: NF-e 1204 / Pedido BK #992"
                  value={formData.nota_fiscal_ref}
                  onChange={(e) => setFormData({ ...formData, nota_fiscal_ref: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Inauguração de loja com efeito CO2, contatar gerente às 13h..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
                >
                  {editingEvent ? 'Salvar Alterações' : 'Confirmar e Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
