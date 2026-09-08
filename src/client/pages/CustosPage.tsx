import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Fuel,
  Wrench,
  Megaphone,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import { api } from '../api/index.js';
import { EventCost, GeneralExpense, ExpenseCategory, CostsSummaryDTO } from '../../types/index.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

export const CustosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EVENTOS' | 'COMPRAS' | 'DRE'>('EVENTOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Dados
  const [costsSummary, setCostsSummary] = useState<CostsSummaryDTO | null>(null);
  const [eventCosts, setEventCosts] = useState<EventCost[]>([]);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);

  // Filtros - Eventos
  const [searchEvent, setSearchEvent] = useState('');
  const [filterEventStatus, setFilterEventStatus] = useState<string>('TODOS');

  // Filtros - Compras / Geral
  const [searchExpense, setSearchExpense] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('TODOS');
  const [filterExpenseStatus, setFilterExpenseStatus] = useState<string>('TODOS');

  // Modal Editar Custos de Evento
  const [editingCost, setEditingCost] = useState<EventCost | null>(null);
  const [costForm, setCostForm] = useState<{
    cilindro: number;
    gerb: number;
    gasolina: number;
    pedagio: number;
    vallet: number;
    ajudante: number;
    pago_ajudante: number;
    monitor: number;
    pago_monitor: number;
    status_custos: 'PAGO' | 'PENDENTE';
    observacoes: string;
  }>({
    cilindro: 0,
    gerb: 0,
    gasolina: 0,
    pedagio: 0,
    vallet: 0,
    ajudante: 0,
    pago_ajudante: 1,
    monitor: 0,
    pago_monitor: 0,
    status_custos: 'PAGO',
    observacoes: '',
  });

  // Modal Nova/Editar Despesa Geral
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseForm, setExpenseForm] = useState<{
    item: string;
    fornecedor: string;
    valor: number;
    data: string;
    pago: number;
    tipo_gasto: ExpenseCategory;
    observacoes: string;
  }>({
    item: '',
    fornecedor: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    pago: 1,
    tipo_gasto: 'MELHORIAS',
    observacoes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summary, events, expenses] = await Promise.all([
        api.getCostsSummary(),
        api.listEventCosts(),
        api.listGeneralExpenses(),
      ]);
      setCostsSummary(summary);
      setEventCosts(events);
      setGeneralExpenses(expenses);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados financeiros de custos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para Custos de Evento
  const handleOpenEditCost = (cost: EventCost) => {
    setEditingCost(cost);
    setCostForm({
      cilindro: cost.cilindro,
      gerb: cost.gerb,
      gasolina: cost.gasolina,
      pedagio: cost.pedagio,
      vallet: cost.vallet,
      ajudante: cost.ajudante,
      pago_ajudante: cost.pago_ajudante,
      monitor: cost.monitor,
      pago_monitor: cost.pago_monitor,
      status_custos: cost.status_custos,
      observacoes: cost.observacoes || '',
    });
  };

  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost) return;
    try {
      await api.saveEventCost(editingCost.evento_id, costForm);
      setEditingCost(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar custos do evento.');
    }
  };

  const handleTogglePago = async (eventoId: number, field: 'pago_ajudante' | 'pago_monitor' | 'status_custos') => {
    try {
      await api.toggleCostPagoField(eventoId, field);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status de pagamento.');
    }
  };

  // Handlers para Despesas Gerais
  const handleOpenNewExpense = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      item: '',
      fornecedor: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      pago: 1,
      tipo_gasto: 'MELHORIAS',
      observacoes: '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (exp: GeneralExpense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      item: exp.item,
      fornecedor: exp.fornecedor || '',
      valor: exp.valor,
      data: exp.data,
      pago: exp.pago,
      tipo_gasto: exp.tipo_gasto,
      observacoes: exp.observacoes || '',
    });
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpenseId) {
        await api.updateGeneralExpense(editingExpenseId, expenseForm);
      } else {
        await api.createGeneralExpense(expenseForm);
      }
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar despesa.');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await api.deleteGeneralExpense(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir despesa.');
    }
  };

  // Filtros Computados
  const filteredEvents = useMemo(() => {
    return eventCosts.filter((item) => {
      const matchSearch =
        !searchEvent.trim() ||
        String(item.evento_id).includes(searchEvent.trim()) ||
        (item.evento?.cliente?.nome && item.evento.cliente.nome.toLowerCase().includes(searchEvent.toLowerCase())) ||
        (item.evento?.nome_evento && item.evento.nome_evento.toLowerCase().includes(searchEvent.toLowerCase()));

      const matchStatus =
        filterEventStatus === 'TODOS' ||
        (filterEventStatus === 'PAGO' && item.status_custos === 'PAGO') ||
        (filterEventStatus === 'PENDENTE' && item.status_custos === 'PENDENTE') ||
        (filterEventStatus === 'AJUDANTE_PENDENTE' && item.ajudante > 0 && item.pago_ajudante === 0) ||
        (filterEventStatus === 'MONITOR_PENDENTE' && item.monitor > 0 && item.pago_monitor === 0);

      return matchSearch && matchStatus;
    });
  }, [eventCosts, searchEvent, filterEventStatus]);

  const filteredExpenses = useMemo(() => {
    return generalExpenses.filter((item) => {
      const matchSearch =
        !searchExpense.trim() ||
        item.item.toLowerCase().includes(searchExpense.toLowerCase()) ||
        (item.fornecedor && item.fornecedor.toLowerCase().includes(searchExpense.toLowerCase()));

      const matchCategory = filterCategory === 'TODOS' || item.tipo_gasto === filterCategory;
      const matchStatus =
        filterExpenseStatus === 'TODOS' ||
        (filterExpenseStatus === 'PAGO' && item.pago === 1) ||
        (filterExpenseStatus === 'PENDENTE' && item.pago === 0);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [generalExpenses, searchExpense, filterCategory, filterExpenseStatus]);

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'INVESTIMENTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">💼 Investimento</span>;
      case 'MELHORIAS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">⚡ Melhorias</span>;
      case 'MANUTENCAO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">🔧 Manutenção</span>;
      case 'MARKETING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">📢 Marketing</span>;
      case 'IMPREVISTO':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">⚠️ Imprevisto</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Outro</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header com Título e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            Custos, Despesas & DRE
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Controle de custos diretos por evento (#01 a #{eventCosts.length || 47}), compras, investimentos e cálculo do Lucro Líquido Real.
          </p>
        </div>

        {activeTab === 'COMPRAS' && (
          <button
            onClick={handleOpenNewExpense}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Compra / Despesa
          </button>
        )}
      </div>

      {/* Alerta de Erro */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cards de Métricas e KPIs Principais */}
      {costsSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento Bruto */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>FATURAMENTO BRUTO (EVENTOS)</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {formatCurrencyBRL(costsSummary.faturamentoTotalEventos)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span className="text-blue-400 font-semibold">{eventCosts.length}</span> eventos computados
            </div>
          </div>

          {/* Card 2: Custos Diretos de Eventos */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>CUSTOS DIRETOS (EVENTOS)</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 tracking-tight">
              - {formatCurrencyBRL(costsSummary.totalCustosEventos)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>Gasolina, Ajudantes, Pedágio, etc.</span>
            </div>
          </div>

          {/* Card 3: Despesas Gerais & Investimentos */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>COMPRAS & INVESTIMENTOS</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400 tracking-tight">
              - {formatCurrencyBRL(costsSummary.totalDespesasGerais)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
              <span>Robô, Mascotes, Marketing e Baterias</span>
            </div>
          </div>

          {/* Card 4: Lucro Líquido Real */}
          <div className={`border rounded-2xl p-4 sm:p-5 backdrop-blur-md relative overflow-hidden group transition-all ${
            costsSummary.lucroLiquidoReal >= 0 
              ? 'bg-emerald-950/20 border-emerald-500/30' 
              : 'bg-rose-950/20 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between text-slate-300 text-xs font-medium mb-2">
              <span>LUCRO LÍQUIDO REAL (DRE)</span>
              <div className={`p-2 rounded-xl ${
                costsSummary.lucroLiquidoReal >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-black tracking-tight ${
              costsSummary.lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatCurrencyBRL(costsSummary.lucroLiquidoReal)}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Margem Líquida Real:</span>
              <span className={`font-bold ${
                costsSummary.margemGeralPercentual >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {costsSummary.margemGeralPercentual.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navegação por Abas */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('EVENTOS')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'EVENTOS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Fuel className="w-4 h-4" />
          Custos Diretos por Evento ({eventCosts.length})
        </button>

        <button
          onClick={() => setActiveTab('COMPRAS')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'COMPRAS'
              ? 'border-purple-400 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Compras & Investimentos ({generalExpenses.length})
        </button>

        <button
          onClick={() => setActiveTab('DRE')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'DRE'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <PieChart className="w-4 h-4" />
          DRE & Lucro Líquido Real
        </button>
      </div>

      {/* ==================== ABA 1: CUSTOS POR EVENTO ==================== */}
      {activeTab === 'EVENTOS' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por # evento, cliente..."
                value={searchEvent}
                onChange={(e) => setSearchEvent(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0 ml-1" />
              <select
                value={filterEventStatus}
                onChange={(e) => setFilterEventStatus(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os Eventos</option>
                <option value="PAGO">Custos 100% Pagos</option>
                <option value="PENDENTE">Custos Pendentes</option>
                <option value="AJUDANTE_PENDENTE">Ajudante a Pagar</option>
                <option value="MONITOR_PENDENTE">Monitor a Pagar</option>
              </select>
            </div>
          </div>

          {/* Tabela de Custos de Eventos */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 font-bold"># Evento & Cliente</th>
                    <th className="p-3.5 font-bold">Valor Evento</th>
                    <th className="p-3.5 font-bold text-center">Cilindro</th>
                    <th className="p-3.5 font-bold text-center">Gerb</th>
                    <th className="p-3.5 font-bold text-center">Gasolina</th>
                    <th className="p-3.5 font-bold text-center">Pedágio</th>
                    <th className="p-3.5 font-bold text-center">Vallet</th>
                    <th className="p-3.5 font-bold text-center">Ajudante</th>
                    <th className="p-3.5 font-bold text-center">Monitor</th>
                    <th className="p-3.5 font-bold">Total Custos</th>
                    <th className="p-3.5 font-bold">Lucro Evento</th>
                    <th className="p-3.5 font-bold text-center">Margem %</th>
                    <th className="p-3.5 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="text-center py-12 text-slate-500">
                        Carregando custos dos eventos...
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-12 text-slate-500">
                        Nenhum evento encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((item) => {
                      const lucro = item.lucro_evento ?? (item.valor_evento - item.total_custos);
                      const margem = item.margem_lucro ?? (item.valor_evento > 0 ? (lucro / item.valor_evento) * 100 : 0);

                      return (
                        <tr key={item.evento_id} className="hover:bg-slate-800/30 transition-colors group">
                          {/* # Evento e Cliente */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-[11px] border border-cyan-500/20">
                                #{String(item.evento_id).padStart(2, '0')}
                              </span>
                              <div>
                                <div className="font-bold text-white text-xs">
                                  {item.evento?.cliente?.nome || 'Cliente'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {item.evento?.data || 'Data N/D'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Valor Evento */}
                          <td className="p-3.5 whitespace-nowrap font-bold text-white">
                            {formatCurrencyBRL(item.valor_evento)}
                          </td>

                          {/* Cilindro */}
                          <td className="p-3.5 whitespace-nowrap text-center text-slate-300">
                            {item.cilindro > 0 ? formatCurrencyBRL(item.cilindro) : <span className="text-slate-600">-</span>}
                          </td>

                          {/* Gerb */}
                          <td className="p-3.5 whitespace-nowrap text-center text-slate-300">
                            {item.gerb > 0 ? formatCurrencyBRL(item.gerb) : <span className="text-slate-600">-</span>}
                          </td>

                          {/* Gasolina */}
                          <td className="p-3.5 whitespace-nowrap text-center text-slate-300">
                            {item.gasolina > 0 ? formatCurrencyBRL(item.gasolina) : <span className="text-slate-600">-</span>}
                          </td>

                          {/* Pedagio */}
                          <td className="p-3.5 whitespace-nowrap text-center text-slate-300">
                            {item.pedagio > 0 ? formatCurrencyBRL(item.pedagio) : <span className="text-slate-600">-</span>}
                          </td>

                          {/* Vallet */}
                          <td className="p-3.5 whitespace-nowrap text-center text-slate-300">
                            {item.vallet > 0 ? formatCurrencyBRL(item.vallet) : <span className="text-slate-600">-</span>}
                          </td>

                          {/* Ajudante */}
                          <td className="p-3.5 whitespace-nowrap text-center">
                            {item.ajudante > 0 ? (
                              <button
                                onClick={() => handleTogglePago(item.evento_id, 'pago_ajudante')}
                                title="Clique para alternar Pago/Pendente"
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                  item.pago_ajudante === 1
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                }`}
                              >
                                {item.pago_ajudante === 1 ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                {formatCurrencyBRL(item.ajudante)}
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Monitor */}
                          <td className="p-3.5 whitespace-nowrap text-center">
                            {item.monitor > 0 ? (
                              <button
                                onClick={() => handleTogglePago(item.evento_id, 'pago_monitor')}
                                title="Clique para alternar Pago/Pendente"
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                  item.pago_monitor === 1
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                }`}
                              >
                                {item.pago_monitor === 1 ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                {formatCurrencyBRL(item.monitor)}
                              </button>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>

                          {/* Total Custos */}
                          <td className="p-3.5 whitespace-nowrap font-bold text-amber-400">
                            {formatCurrencyBRL(item.total_custos)}
                          </td>

                          {/* Lucro Evento */}
                          <td className="p-3.5 whitespace-nowrap font-bold text-emerald-400">
                            {formatCurrencyBRL(lucro)}
                          </td>

                          {/* Margem % */}
                          <td className="p-3.5 whitespace-nowrap text-center font-semibold text-slate-300">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                              margem >= 60 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {margem.toFixed(0)}%
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleOpenEditCost(item)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                              title="Editar custos deste evento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: COMPRAS, INVESTIMENTOS E MARKETING ==================== */}
      {activeTab === 'COMPRAS' && (
        <div className="space-y-4">
          {/* Cards Resumo por Categoria */}
          {costsSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-purple-400 mb-1 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" /> INVESTIMENTOS
                </div>
                <div className="text-base font-bold text-white">
                  {formatCurrencyBRL(costsSummary.totalInvestimentos)}
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> MELHORIAS
                </div>
                <div className="text-base font-bold text-white">
                  {formatCurrencyBRL(costsSummary.totalMelhorias)}
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" /> MANUTENÇÃO
                </div>
                <div className="text-base font-bold text-white">
                  {formatCurrencyBRL(costsSummary.totalManutencao)}
                </div>
              </div>

              <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" /> MARKETING
                </div>
                <div className="text-base font-bold text-white">
                  {formatCurrencyBRL(costsSummary.totalMarketing)}
                </div>
              </div>

              <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3.5 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> IMPREVISTOS
                </div>
                <div className="text-base font-bold text-white">
                  {formatCurrencyBRL(costsSummary.totalImprevistos)}
                </div>
              </div>
            </div>
          )}

          {/* Filtros de Compras */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar item, fornecedor..."
                value={searchExpense}
                onChange={(e) => setSearchExpense(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todas as Categorias</option>
                <option value="INVESTIMENTO">Investimentos</option>
                <option value="MELHORIAS">Melhorias</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="MARKETING">Marketing</option>
                <option value="IMPREVISTO">Imprevistos</option>
              </select>

              <select
                value={filterExpenseStatus}
                onChange={(e) => setFilterExpenseStatus(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PAGO">Pago</option>
                <option value="PENDENTE">Pendente</option>
              </select>
            </div>
          </div>

          {/* Tabela de Compras & Despesas */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 font-bold">Item / Descrição</th>
                    <th className="p-3.5 font-bold">Categoria</th>
                    <th className="p-3.5 font-bold">Fornecedor</th>
                    <th className="p-3.5 font-bold">Data</th>
                    <th className="p-3.5 font-bold">Valor</th>
                    <th className="p-3.5 font-bold text-center">Status</th>
                    <th className="p-3.5 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        Carregando despesas...
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        Nenhuma despesa encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-3.5 max-w-xs sm:max-w-md">
                          <div className="font-bold text-white text-xs">{exp.item}</div>
                          {exp.observacoes && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {exp.observacoes}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">{getCategoryBadge(exp.tipo_gasto)}</td>
                        <td className="p-3.5 whitespace-nowrap text-slate-300">{exp.fornecedor || '-'}</td>
                        <td className="p-3.5 whitespace-nowrap text-slate-400">{exp.data}</td>
                        <td className="p-3.5 whitespace-nowrap font-bold text-white">
                          {formatCurrencyBRL(exp.valor)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          {exp.pago === 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Pago
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditExpense(exp)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors"
                              title="Editar despesa"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                              title="Excluir despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 3: DRE & VISÃO GERENCIAL ==================== */}
      {activeTab === 'DRE' && costsSummary && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Demonstração do Resultado do Exercício (DRE Operacional)
            </h2>

            <div className="space-y-3 font-mono text-sm">
              {/* 1. Receita Bruta */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="text-blue-400 font-extrabold">(+)</span> RECEITA BRUTA DE EVENTOS
                </span>
                <span className="font-bold text-blue-400 text-base">
                  {formatCurrencyBRL(costsSummary.faturamentoTotalEventos)}
                </span>
              </div>

              {/* 2. Custos Diretos dos Eventos */}
              <div className="pl-4 pr-3 py-2 space-y-1.5 border-l-2 border-amber-500/30 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                  <span>(-) Custos Variáveis Diretos</span>
                  <span className="text-amber-400 font-bold">- {formatCurrencyBRL(costsSummary.totalCustosEventos)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Combustível & Gasolina:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalGasolina)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Ajudantes de Pista:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalAjudante)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Pedágios Rodoviários:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalPedagio)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Efeitos Gerb (Fogo Frio):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalGerb)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Estacionamento / Vallet:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalVallet)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Cilindro CO2:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalCilindro)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Monitores:</span>
                  <span>{formatCurrencyBRL(costsSummary.totalMonitor)}</span>
                </div>
              </div>

              {/* 3. Lucro Bruto de Eventos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">(=)</span> LUCRO BRUTO OPERACIONAL
                </span>
                <span className="font-bold text-amber-400 text-base">
                  {formatCurrencyBRL(costsSummary.lucroBrutoEventos)}
                </span>
              </div>

              {/* 4. Despesas Gerais, Investimentos e Marketing */}
              <div className="pl-4 pr-3 py-2 space-y-1.5 border-l-2 border-purple-500/30 text-xs">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                  <span>(-) Despesas Gerais & Investimentos</span>
                  <span className="text-purple-400 font-bold">- {formatCurrencyBRL(costsSummary.totalDespesasGerais)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Investimentos (Robô, Mascotes, Equipamentos):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalInvestimentos)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Melhorias (Baterias, Leds, Ferramentas):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalMelhorias)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Marketing & Tráfego Pago (Instagram, Panfletos):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalMarketing)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Manutenção (Tintas, Capacetes, Colas):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalManutencao)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>• Imprevistos (Imposto de Importação):</span>
                  <span>{formatCurrencyBRL(costsSummary.totalImprevistos)}</span>
                </div>
              </div>

              {/* 5. Lucro Líquido Real */}
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                costsSummary.lucroLiquidoReal >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div>
                  <div className={`font-black text-base flex items-center gap-2 ${
                    costsSummary.lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>(=)</span> LUCRO LÍQUIDO REAL ACUMULADO
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Margem Líquida sobre Faturamento: {costsSummary.margemGeralPercentual.toFixed(1)}%
                  </div>
                </div>
                <span className={`font-black text-xl sm:text-2xl ${
                  costsSummary.lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrencyBRL(costsSummary.lucroLiquidoReal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDITAR CUSTOS DO EVENTO ==================== */}
      {editingCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingCost(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-cyan-400" />
              Custos do Evento #{String(editingCost.evento_id).padStart(2, '0')}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Cliente: <span className="text-white font-medium">{editingCost.evento?.cliente?.nome}</span> | Valor: <span className="text-emerald-400 font-bold">{formatCurrencyBRL(editingCost.valor_evento)}</span>
            </p>

            <form onSubmit={handleSaveCost} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cilindro CO2 (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.cilindro}
                    onChange={(e) => setCostForm({ ...costForm, cilindro: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gerb (Fogo Frio) (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.gerb}
                    onChange={(e) => setCostForm({ ...costForm, gerb: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gasolina / Combustível (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.gasolina}
                    onChange={(e) => setCostForm({ ...costForm, gasolina: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pedágio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.pedagio}
                    onChange={(e) => setCostForm({ ...costForm, pedagio: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vallet / Estacionamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.vallet}
                    onChange={(e) => setCostForm({ ...costForm, vallet: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Geral Custos</label>
                  <select
                    value={costForm.status_custos}
                    onChange={(e) => setCostForm({ ...costForm, status_custos: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="PAGO">PAGO</option>
                    <option value="PENDENTE">PENDENTE</option>
                  </select>
                </div>
              </div>

              {/* Seção Ajudante */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Ajudante (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.ajudante}
                    onChange={(e) => setCostForm({ ...costForm, ajudante: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ajudante Pago?</label>
                  <select
                    value={costForm.pago_ajudante}
                    onChange={(e) => setCostForm({ ...costForm, pago_ajudante: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={1}>Sim (Pago)</option>
                    <option value={0}>Não (Pendente)</option>
                  </select>
                </div>
              </div>

              {/* Seção Monitor */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Monitor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costForm.monitor}
                    onChange={(e) => setCostForm({ ...costForm, monitor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monitor Pago?</label>
                  <select
                    value={costForm.pago_monitor}
                    onChange={(e) => setCostForm({ ...costForm, pago_monitor: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value={1}>Sim (Pago)</option>
                    <option value={0}>Não (Pendente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={costForm.observacoes}
                  onChange={(e) => setCostForm({ ...costForm, observacoes: e.target.value })}
                  placeholder="Anotações sobre custos específicos deste evento..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCost(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
                >
                  Salvar Custos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: NOVA/EDITAR DESPESA GERAL ==================== */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              {editingExpenseId ? 'Editar Despesa / Compra' : 'Nova Compra / Despesa'}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Cadastre compras de equipamentos, baterias, marketing, manutenção ou investimentos.
            </p>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item / Descrição *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bateria nova Robô, Cartões de visita..."
                  value={expenseForm.item}
                  onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria *</label>
                  <select
                    value={expenseForm.tipo_gasto}
                    onChange={(e) => setExpenseForm({ ...expenseForm, tipo_gasto: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                  >
                    <option value="INVESTIMENTO">INVESTIMENTO</option>
                    <option value="MELHORIAS">MELHORIAS</option>
                    <option value="MANUTENCAO">MANUTENÇÃO</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="IMPREVISTO">IMPREVISTO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fornecedor / Loja</label>
                  <input
                    type="text"
                    placeholder="Ex: Mercado Livre, Instagram..."
                    value={expenseForm.fornecedor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, fornecedor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.valor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, valor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.data}
                    onChange={(e) => setExpenseForm({ ...expenseForm, data: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status do Pagamento</label>
                <select
                  value={expenseForm.pago}
                  onChange={(e) => setExpenseForm({ ...expenseForm, pago: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value={1}>Pago</option>
                  <option value={0}>Pendente / A Pagar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={expenseForm.observacoes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, observacoes: e.target.value })}
                  placeholder="Detalhes adicionais, saldo devedor, link do produto..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium hover:from-purple-400 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/20"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};