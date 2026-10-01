import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  CreditCard,
  Plus,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Trash2,
  Edit,
  Sparkles,
  RefreshCw,
  Layers,
  AlertCircle,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Wallet,
  Activity,
  Receipt,
  CalendarRange,
} from 'lucide-react';
import { api } from '../api/index.js';
import { FinancialEntry, FinancialStats, PaymentStatus, PaymentMethod } from '../../types/index.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

export const FinanceiroPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARDS' | 'LANCAMENTOS' | 'FLUXO_MENSAL'>('DASHBOARDS');
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);

  // Modal Dar Baixa
  const [settlingEntry, setSettlingEntry] = useState<FinancialEntry | null>(null);
  const [settleForm, setSettleForm] = useState<{
    forma_pagamento: PaymentMethod;
    data_pagamento: string;
    comprovante_ref: string;
  }>({
    forma_pagamento: 'PIX',
    data_pagamento: new Date().toISOString().split('T')[0],
    comprovante_ref: '',
  });

  // Modal Editar / Alterar Status
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [editForm, setEditForm] = useState<{
    descricao: string;
    valor: number;
    status: PaymentStatus;
    data_vencimento: string;
    data_pagamento: string;
    forma_pagamento: PaymentMethod;
    comprovante_ref: string;
  }>({
    descricao: '',
    valor: 0,
    status: 'PENDENTE',
    data_vencimento: '',
    data_pagamento: '',
    forma_pagamento: 'PIX',
    comprovante_ref: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, statsData] = await Promise.all([
        api.getFinancialEntries({
          status: selectedStatus !== 'TODOS' ? (selectedStatus as PaymentStatus) : undefined,
        }),
        api.getFinancialStats(),
      ]);
      setEntries(entriesData);
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  // Limpeza de duplicados
  const handleDeduplicate = async () => {
    if (!confirm('Deseja analisar e limpar todos os lançamentos financeiros duplicados automaticamente?')) return;
    try {
      setIsCleaningDuplicates(true);
      const res = await api.deduplicateFinancialEntries();
      alert(`Limpeza concluída! ${res.result.removedCount} lançamentos duplicados foram removidos.`);
      await loadData();
    } catch (err: any) {
      alert('Erro ao limpar duplicidades: ' + err.message);
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  // Abrir Modal de Baixa
  const handleOpenSettle = (entry: FinancialEntry) => {
    setSettlingEntry(entry);
    setSettleForm({
      forma_pagamento: entry.forma_pagamento || 'PIX',
      data_pagamento: new Date().toISOString().split('T')[0],
      comprovante_ref: entry.comprovante_ref || '',
    });
  };

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingEntry) return;

    try {
      await api.settleFinancialEntry(settlingEntry.id, settleForm);
      setSettlingEntry(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar baixa de pagamento.');
    }
  };

  // Abrir Modal de Edição / Alteração de Status
  const handleOpenEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setEditForm({
      descricao: entry.descricao || '',
      valor: entry.valor || 0,
      status: entry.status || 'PENDENTE',
      data_vencimento: entry.data_vencimento || '',
      data_pagamento: entry.data_pagamento || (entry.status === 'PAGO' ? new Date().toISOString().split('T')[0] : ''),
      forma_pagamento: entry.forma_pagamento || 'PIX',
      comprovante_ref: entry.comprovante_ref || '',
    });
  };

  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      await api.updateFinancialEntry(editingEntry.id, {
        descricao: editForm.descricao,
        valor: Number(editForm.valor),
        status: editForm.status,
        data_vencimento: editForm.data_vencimento,
        data_pagamento: editForm.status === 'PAGO' ? (editForm.data_pagamento || new Date().toISOString().split('T')[0]) : null,
        forma_pagamento: editForm.status === 'PAGO' ? editForm.forma_pagamento : null,
        comprovante_ref: editForm.comprovante_ref,
      } as any);
      setEditingEntry(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar lançamento.');
    }
  };

  // Excluir Lançamento
  const handleDeleteEntry = async (entry: FinancialEntry) => {
    if (
      !confirm(
        `Tem certeza que deseja EXCLUIR este lançamento de ${formatCurrencyBRL(entry.valor)} (${entry.descricao})?\nEsta ação não poderá ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await api.deleteFinancialEntry(entry.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir lançamento financeiro.');
    }
  };

  // Filtragem por busca (nome do cliente, descrição ou contrato)
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.descricao?.toLowerCase().includes(q) ||
        e.cliente?.nome?.toLowerCase().includes(q) ||
        e.cliente?.documento?.toLowerCase().includes(q) ||
        e.contrato?.numero?.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Estatísticas calculadas em tempo real com base nos lançamentos carregados
  const calculatedStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalFaturado = 0;
    let totalRecebido = 0;
    let totalAReceber = 0;
    let totalAtrasado = 0;
    let countPagos = 0;
    let countPendentes = 0;
    let countAtrasados = 0;

    for (const e of entries) {
      if (e.status === 'CANCELADO') continue;
      const v = Number(e.valor) || 0;
      totalFaturado += v;

      if (e.status === 'PAGO') {
        totalRecebido += v;
        countPagos++;
      } else if (e.status === 'PENDENTE') {
        if (e.data_vencimento && e.data_vencimento < today) {
          totalAtrasado += v;
          countAtrasados++;
        } else {
          totalAReceber += v;
          countPendentes++;
        }
      } else if (e.status === 'ATRASADO') {
        totalAtrasado += v;
        countAtrasados++;
      }
    }

    const taxaRecebimento = totalFaturado > 0 ? (totalRecebido / totalFaturado) * 100 : 0;
    const ticketMedio = entries.length > 0 ? totalFaturado / entries.length : 0;

    return {
      totalFaturado: stats?.totalFaturado || stats?.total_geral || totalFaturado,
      totalRecebido: stats?.totalRecebido || stats?.total_pago || totalRecebido,
      totalAReceber: stats?.totalAReceber || stats?.total_pendente || totalAReceber,
      totalAtrasado: stats?.totalAtrasado || stats?.total_atrasado || totalAtrasado,
      taxaRecebimento,
      ticketMedio,
      countPagos,
      countPendentes,
      countAtrasados,
      totalCount: entries.length,
    };
  }, [entries, stats]);

  // Análise Mensal de Fluxo de Caixa (Agrupado por YYYY-MM)
  const monthlyFlow = useMemo(() => {
    const map: { [monthKey: string]: { month: string; faturado: number; recebido: number; pendente: number; atrasado: number; count: number } } = {};
    const today = new Date().toISOString().split('T')[0];

    for (const e of entries) {
      if (e.status === 'CANCELADO') continue;
      const dateStr = e.data_vencimento || e.data_pagamento || e.created_at;
      if (!dateStr) continue;
      const key = dateStr.substring(0, 7); // YYYY-MM
      if (!map[key]) {
        const [year, month] = key.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        map[key] = {
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          faturado: 0,
          recebido: 0,
          pendente: 0,
          atrasado: 0,
          count: 0,
        };
      }

      const v = Number(e.valor) || 0;
      map[key].faturado += v;
      map[key].count++;

      if (e.status === 'PAGO') {
        map[key].recebido += v;
      } else if (e.status === 'PENDENTE') {
        if (e.data_vencimento && e.data_vencimento < today) {
          map[key].atrasado += v;
        } else {
          map[key].pendente += v;
        }
      } else if (e.status === 'ATRASADO') {
        map[key].atrasado += v;
      }
    }

    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0])) // mais recentes primeiro
      .map(([key, val]) => ({ key, ...val }));
  }, [entries]);

  // Análise de Métodos de Pagamento
  const paymentMethodsBreakdown = useMemo(() => {
    const map: { [method: string]: { label: string; count: number; total: number; color: string } } = {
      PIX: { label: 'PIX Instantâneo', count: 0, total: 0, color: 'bg-emerald-500' },
      TRANSFERENCIA: { label: 'Transferência / TED', count: 0, total: 0, color: 'bg-blue-500' },
      CARTAO_CREDITO: { label: 'Cartão de Crédito', count: 0, total: 0, color: 'bg-purple-500' },
      CARTAO_DEBITO: { label: 'Cartão de Débito', count: 0, total: 0, color: 'bg-indigo-500' },
      DINHEIRO: { label: 'Dinheiro em Mãos', count: 0, total: 0, color: 'bg-amber-500' },
      OUTRO: { label: 'Outras Formas', count: 0, total: 0, color: 'bg-slate-500' },
    };

    let totalGeral = 0;
    for (const e of entries) {
      if (e.status !== 'PAGO') continue;
      const method = e.forma_pagamento || 'PIX';
      const v = Number(e.valor) || 0;
      if (!map[method]) {
        map[method] = { label: method, count: 0, total: 0, color: 'bg-slate-500' };
      }
      map[method].count++;
      map[method].total += v;
      totalGeral += v;
    }

    return {
      totalGeral,
      items: Object.entries(map)
        .map(([key, val]) => ({
          key,
          ...val,
          percent: totalGeral > 0 ? (val.total / totalGeral) * 100 : 0,
        }))
        .filter((item) => item.count > 0 || item.total > 0),
    };
  }, [entries]);

  // Tipos de Parcela (Sinal vs Saldo vs Avulso)
  const installmentTypesBreakdown = useMemo(() => {
    let entradaVal = 0;
    let restanteVal = 0;
    let avulsoVal = 0;

    for (const e of entries) {
      if (e.status === 'CANCELADO') continue;
      const v = Number(e.valor) || 0;
      if (e.tipo_parcela === 'ENTRADA') entradaVal += v;
      else if (e.tipo_parcela === 'RESTANTE') restanteVal += v;
      else avulsoVal += v;
    }

    const total = entradaVal + restanteVal + avulsoVal || 1;
    return [
      { label: 'Sinal de Entrada (40%)', val: entradaVal, percent: (entradaVal / total) * 100, color: 'bg-cyan-500' },
      { label: 'Saldo Quitação (60%)', val: restanteVal, percent: (restanteVal / total) * 100, color: 'bg-emerald-500' },
      { label: 'Lançamentos Avulsos / BK', val: avulsoVal, percent: (avulsoVal / total) * 100, color: 'bg-amber-500' },
    ];
  }, [entries]);

  // Ranking Top Clientes
  const topClients = useMemo(() => {
    const map: { [id: string]: { nome: string; total: number; count: number; doc: string } } = {};
    for (const e of entries) {
      if (e.status === 'CANCELADO') continue;
      const clientName = e.cliente?.nome || 'Cliente Não Identificado';
      const key = `${e.cliente_id || clientName}`;
      if (!map[key]) {
        map[key] = {
          nome: clientName,
          doc: e.cliente?.documento || '',
          total: 0,
          count: 0,
        };
      }
      map[key].total += Number(e.valor) || 0;
      map[key].count++;
    }

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [entries]);

  const getStatusBadge = (status: PaymentStatus, vencimento: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isLate = status === 'PENDENTE' && vencimento < today;

    if (status === 'PAGO') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" /> Pago
        </span>
      );
    }
    if (isLate || status === 'ATRASADO') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Atrasado
        </span>
      );
    }
    if (status === 'CANCELADO') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-slate-500/10 border-slate-500/30 text-slate-400 flex items-center gap-1 w-fit">
          <X className="w-3 h-3" /> Cancelado
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-400 flex items-center gap-1 w-fit">
        <Clock className="w-3 h-3" /> Pendente
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800 to-emerald-950/30 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
            <DollarSign className="w-4 h-4" /> Gestão de Fluxo de Caixa & Contas
          </div>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
            Financeiro & Contas a Receber
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dashboards analíticos, inteligência de fluxo de caixa, recebimentos e controle de parcelas.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDeduplicate}
            disabled={isCleaningDuplicates}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Remove duplicidades geradas ao criar eventos e contratos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCleaningDuplicates ? 'animate-spin' : ''}`} />
            {isCleaningDuplicates ? 'Limpando...' : 'Limpar Duplicados'}
          </button>
        </div>
      </div>

      {/* Seletor de Sub-Abas do Módulo Financeiro */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DASHBOARDS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'DASHBOARDS'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboards & Indicadores
        </button>
        <button
          onClick={() => setActiveTab('LANCAMENTOS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'LANCAMENTOS'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-lg shadow-brand-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Fila & Lançamentos ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab('FLUXO_MENSAL')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'FLUXO_MENSAL'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          Fluxo Mensal & Projeções ({monthlyFlow.length} meses)
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Faturado</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrencyBRL(calculatedStats.totalFaturado)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{calculatedStats.totalCount} parcelas</span>
            <span>Ticket: {formatCurrencyBRL(calculatedStats.ticketMedio)}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Recebido</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrencyBRL(calculatedStats.totalRecebido)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center justify-between">
            <span>{calculatedStats.countPagos} liquidados</span>
            <span className="font-bold">{calculatedStats.taxaRecebimento.toFixed(1)}% recebido</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">A Receber (No Prazo)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {formatCurrencyBRL(calculatedStats.totalAReceber)}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            {calculatedStats.countPendentes} parcelas aguardando vencimento
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inadimplente / Atrasado</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatCurrencyBRL(calculatedStats.totalAtrasado)}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            {calculatedStats.countAtrasados} parcelas com prazo ultrapassado
          </div>
        </div>
      </div>

      {/* ==================== ABA 1: DASHBOARDS & INTELIGÊNCIA FINANCEIRA ==================== */}
      {activeTab === 'DASHBOARDS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card Principal: Distribuição e Conversão de Receita */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Composição do Fluxo de Caixa Global
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proporção de valores quitados em conta versus valores em aberto e inadimplência.
                </p>
              </div>
              <div className="text-xs font-mono font-bold text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                Taxa de Liquidação: <span className="text-emerald-400">{calculatedStats.taxaRecebimento.toFixed(1)}%</span>
              </div>
            </div>

            {/* Barra Visual de Distribuição */}
            <div className="w-full h-8 rounded-xl bg-slate-950 overflow-hidden flex border border-slate-800 shadow-inner">
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (calculatedStats.totalRecebido / (calculatedStats.totalFaturado || 1)) * 100)
                  )}%`,
                }}
                className="bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center text-[10px] font-black text-black"
                title={`Recebido: ${formatCurrencyBRL(calculatedStats.totalRecebido)}`}
              >
                {((calculatedStats.totalRecebido / (calculatedStats.totalFaturado || 1)) * 100).toFixed(0)}%
              </div>
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (calculatedStats.totalAReceber / (calculatedStats.totalFaturado || 1)) * 100)
                  )}%`,
                }}
                className="bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center text-[10px] font-black text-black"
                title={`A Receber: ${formatCurrencyBRL(calculatedStats.totalAReceber)}`}
              >
                {((calculatedStats.totalAReceber / (calculatedStats.totalFaturado || 1)) * 100).toFixed(0)}%
              </div>
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (calculatedStats.totalAtrasado / (calculatedStats.totalFaturado || 1)) * 100)
                  )}%`,
                }}
                className="bg-rose-500 hover:bg-rose-400 transition-all flex items-center justify-center text-[10px] font-black text-white"
                title={`Atrasado: ${formatCurrencyBRL(calculatedStats.totalAtrasado)}`}
              >
                {((calculatedStats.totalAtrasado / (calculatedStats.totalFaturado || 1)) * 100).toFixed(0)}%
              </div>
            </div>

            {/* Legenda com Indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Recebido / Liquidado</div>
                  <div className="text-sm font-bold text-emerald-400">{formatCurrencyBRL(calculatedStats.totalRecebido)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">A Receber (No Prazo)</div>
                  <div className="text-sm font-bold text-amber-400">{formatCurrencyBRL(calculatedStats.totalAReceber)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-md bg-rose-500 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Inadimplente / Atrasado</div>
                  <div className="text-sm font-bold text-rose-400">{formatCurrencyBRL(calculatedStats.totalAtrasado)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de 2 Colunas: Formas de Pagamento & Tipos de Parcela */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formas de Pagamento */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                Formas de Pagamento dos Valores Recebidos
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Total de {formatCurrencyBRL(paymentMethodsBreakdown.totalGeral)} recebidos discriminados por meio.
              </p>

              <div className="space-y-3.5">
                {paymentMethodsBreakdown.items.map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.label}</span>
                      <span className="text-white font-mono font-bold">
                        {formatCurrencyBRL(item.total)} ({item.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipos de Parcela */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Estrutura de Cobrança por Tipo de Parcela
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Distribuição dos contratos padrão (Sinal 40% / Saldo 60%) e faturamento corporativo avulso.
              </p>

              <div className="space-y-4">
                {installmentTypesBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <div>
                        <div className="text-xs font-bold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">Representa {item.percent.toFixed(1)}% do faturamento</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{formatCurrencyBRL(item.val)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Clientes / Contratos */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Top 5 Clientes em Volume Financeiro
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Clientes e parceiros corporativos com maior faturamento contratado acumulado.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topClients.map((client, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] text-slate-500">{client.count} parcelas</span>
                    </div>
                    <div className="font-bold text-xs text-white line-clamp-1" title={client.nome}>
                      {client.nome}
                    </div>
                    {client.doc && (
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{client.doc}</div>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800">
                    <div className="text-xs font-black text-emerald-400">{formatCurrencyBRL(client.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: FILA & LANÇAMENTOS DETALHADOS ==================== */}
      {activeTab === 'LANCAMENTOS' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card-glass rounded-2xl p-4">
            {/* Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
              {[
                { key: 'TODOS', label: 'Todos' },
                { key: 'PENDENTE', label: 'Pendentes' },
                { key: 'PAGO', label: 'Pagos' },
                { key: 'ATRASADO', label: 'Atrasados' },
                { key: 'CANCELADO', label: 'Cancelados' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setSelectedStatus(item.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedStatus === item.key
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, contrato ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700/80 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="card-glass rounded-2xl overflow-hidden border border-slate-800">
            {loading ? (
              <div className="p-8 space-y-4 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-dark-800/60" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-16 text-center">
                <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum lançamento encontrado</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Não há registros com os filtros selecionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-dark-800/40">
                      <th className="py-3 px-4">Lançamento / Tipo</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Forma / Pagto</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEntries.map((entry) => {
                      const isPaid = entry.status === 'PAGO';
                      return (
                        <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Lançamento / Tipo */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {entry.descricao}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                              {entry.contrato?.numero ? (
                                <span className="text-brand-400 font-mono flex items-center gap-0.5">
                                  <FileText className="w-3 h-3" /> Contrato {entry.contrato.numero}
                                </span>
                              ) : entry.evento_id ? (
                                <span className="text-slate-400">Evento #{entry.evento_id}</span>
                              ) : null}
                              {entry.tipo_parcela && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                  {entry.tipo_parcela}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cliente */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{entry.cliente?.nome || '—'}</div>
                            {entry.cliente?.documento && (
                              <div className="text-[10px] text-slate-400 font-mono">{entry.cliente.documento}</div>
                            )}
                          </td>

                          {/* Vencimento */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-white flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {entry.data_vencimento ? entry.data_vencimento.split('-').reverse().join('/') : '—'}
                            </div>
                          </td>

                          {/* Valor */}
                          <td className="py-3.5 px-4 text-right font-black text-sm text-white">
                            {formatCurrencyBRL(entry.valor)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(entry.status, entry.data_vencimento)}
                          </td>

                          {/* Forma / Pagto */}
                          <td className="py-3.5 px-4 text-slate-300">
                            {entry.forma_pagamento ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-[11px] text-slate-200">
                                  {entry.forma_pagamento}
                                </span>
                                {entry.data_pagamento && (
                                  <span className="text-[10px] text-emerald-400 font-mono">
                                    Pago em {entry.data_pagamento.split('-').reverse().join('/')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isPaid && (
                                <button
                                  onClick={() => handleOpenSettle(entry)}
                                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                  title="Dar baixa no pagamento"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(entry)}
                                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                                title="Editar ou alterar status"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ABA 3: FLUXO MENSAL & PROJEÇÕES ==================== */}
      {activeTab === 'FLUXO_MENSAL' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-400" />
              Cronograma Mensal de Recebimentos & Faturamento
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Acompanhamento mês a mês das receitas realizadas versus valores pendentes e atrasados.
            </p>

            <div className="space-y-4">
              {monthlyFlow.map((m) => {
                const totalMonth = m.faturado || 1;
                const percPago = (m.recebido / totalMonth) * 100;
                const percPendente = (m.pendente / totalMonth) * 100;
                const percAtrasado = (m.atrasado / totalMonth) * 100;

                return (
                  <div
                    key={m.key}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 font-mono">
                          {m.month}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{m.count} lançamentos</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-slate-400">
                          Total: <strong className="text-white">{formatCurrencyBRL(m.faturado)}</strong>
                        </span>
                        <span className="text-emerald-400">
                          Recebido: <strong>{formatCurrencyBRL(m.recebido)}</strong>
                        </span>
                        {m.pendente > 0 && (
                          <span className="text-amber-400">
                            Aguardando: <strong>{formatCurrencyBRL(m.pendente)}</strong>
                          </span>
                        )}
                        {m.atrasado > 0 && (
                          <span className="text-rose-400">
                            Atrasado: <strong>{formatCurrencyBRL(m.atrasado)}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar do Mês */}
                    <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${percPago}%` }}
                        className="bg-emerald-500 hover:bg-emerald-400 transition-all"
                        title={`Recebido: ${formatCurrencyBRL(m.recebido)}`}
                      />
                      <div
                        style={{ width: `${percPendente}%` }}
                        className="bg-amber-500 hover:bg-amber-400 transition-all"
                        title={`Pendente: ${formatCurrencyBRL(m.pendente)}`}
                      />
                      <div
                        style={{ width: `${percAtrasado}%` }}
                        className="bg-rose-500 hover:bg-rose-400 transition-all"
                        title={`Atrasado: ${formatCurrencyBRL(m.atrasado)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dar Baixa */}
      {settlingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-glass border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Dar Baixa de Pagamento
              </div>
              <button
                onClick={() => setSettlingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1">
              <div className="text-slate-400">Descrição:</div>
              <div className="font-bold text-white">{settlingEntry.descricao}</div>
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-700 text-xs">
                <span className="text-slate-400">Valor a liquidar:</span>
                <span className="font-black text-emerald-400 text-sm">
                  {formatCurrencyBRL(settlingEntry.valor)}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Forma de Pagamento *</label>
                <select
                  required
                  value={settleForm.forma_pagamento}
                  onChange={(e) => setSettleForm({ ...settleForm, forma_pagamento: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="PIX">PIX (Chave / QrCode)</option>
                  <option value="DINHEIRO">Dinheiro (Em Mãos)</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="TRANSFERENCIA">Transferência Bancária / TED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Data do Pagamento *</label>
                <input
                  type="date"
                  required
                  value={settleForm.data_pagamento}
                  onChange={(e) => setSettleForm({ ...settleForm, data_pagamento: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Comprovante / Código de Transação</label>
                <input
                  type="text"
                  placeholder="Ex: E2E PIX 123456789 ou detalhes"
                  value={settleForm.comprovante_ref}
                  onChange={(e) => setSettleForm({ ...settleForm, comprovante_ref: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSettlingEntry(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/30 transition-all active:scale-[0.98]"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Lançamento */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-glass border border-brand-500/30 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
                <Edit className="w-5 h-5" /> Editar Lançamento Financeiro
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.valor}
                    onChange={(e) => setEditForm({ ...editForm, valor: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Status *</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white font-bold focus:outline-none focus:border-brand-500"
                  >
                    <option value="PENDENTE">🟡 PENDENTE</option>
                    <option value="PAGO">🟢 PAGO</option>
                    <option value="ATRASADO">🔴 ATRASADO</option>
                    <option value="CANCELADO">⚪ CANCELADO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    required
                    value={editForm.data_vencimento}
                    onChange={(e) => setEditForm({ ...editForm, data_vencimento: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Forma de Pagamento</label>
                  <select
                    value={editForm.forma_pagamento}
                    onChange={(e) => setEditForm({ ...editForm, forma_pagamento: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="PIX">PIX (Chave / QrCode)</option>
                    <option value="DINHEIRO">Dinheiro (Em Mãos)</option>
                    <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                    <option value="CARTAO_DEBITO">Cartão de Débito</option>
                    <option value="TRANSFERENCIA">Transferência Bancária / TED</option>
                  </select>
                </div>
              </div>

              {editForm.status === 'PAGO' && (
                <div>
                  <label className="block text-xs text-emerald-400 font-medium mb-1">Data do Pagamento *</label>
                  <input
                    type="date"
                    required
                    value={editForm.data_pagamento}
                    onChange={(e) => setEditForm({ ...editForm, data_pagamento: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-emerald-500/50 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Comprovante / Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Comprovante Pix anexado ou detalhes de pagamento"
                  value={editForm.comprovante_ref}
                  onChange={(e) => setEditForm({ ...editForm, comprovante_ref: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const entry = editingEntry;
                    setEditingEntry(null);
                    handleDeleteEntry(entry);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600/30 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Registro
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all active:scale-[0.98]"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
