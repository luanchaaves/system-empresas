import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Bot,
  Users,
  Eye,
  Download,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  PhoneCall,
  Mail,
  Check,
  Plus,
  Store,
  MapPin,
  ChevronLeft,
  Settings,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard.js';
import { StatusBadge } from '../components/Badge.js';
import { ContractPreviewModal } from '../components/ContractPreviewModal.js';
import { api } from '../api/index.js';
import { DashboardStats, Contract, EventDetails, MonthlyEventStats } from '../../types/index.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

interface DashboardPageProps {
  onNavigateToNew: () => void;
  onNavigateToContracts: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToFinancial?: () => void;
}

const safeFormatDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return String(dateStr || '-');
  }
};

const getLocalDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToNew,
  onNavigateToContracts,
  onNavigateToEvents,
  onNavigateToFinancial,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewContractId, setPreviewContractId] = useState<number | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string>('');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // Sub-aba ativa na tabela principal
  const [tableTab, setTableTab] = useState<'EVENTOS' | 'CONTRATOS' | 'MENSAL'>('EVENTOS');

  // Mini-Calendário State (Semana atual)
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.getDashboard(),
        api.getContracts(),
        api.getEvents({ onlyUpcoming: true }),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value) {
        setStats(results[0].value);
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        setRecentContracts(results[1].value.slice(0, 8));
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
        setUpcomingEvents(results[2].value.slice(0, 8));
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateAllContracts = async () => {
    if (!confirm('Deseja gerar contratos padronizados e PDFs para todos os eventos pendentes?')) return;
    try {
      setIsGeneratingBatch(true);
      const res = await fetch('/api/contratos/gerar-todos', { method: 'POST' });
      const data = await res.json();
      alert(`Sucesso! ${data.result?.totalCreated || 0} contratos novos gerados.`);
      await loadData();
    } catch (err: any) {
      alert('Erro ao gerar contratos: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Dias da semana para o Mini-Calendário
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    const eventsList = Array.isArray(upcomingEvents) ? upcomingEvents : [];

    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayNum = d.getDate();
      const weekName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
      const dateStr = getLocalDateKey(d);
      const isToday = i === 0;
      const isSelected = i === selectedDayOffset;

      const eventsOnDay = eventsList.filter((e) => {
        if (!e?.data) return false;
        const eDate = String(e.data).split('T')[0];
        return eDate === dateStr;
      });

      days.push({
        offset: i,
        dayNum,
        weekName,
        dateStr,
        isToday,
        isSelected,
        hasEvents: eventsOnDay.length > 0,
        eventCount: eventsOnDay.length,
      });
    }
    return days;
  }, [upcomingEvents, selectedDayOffset]);

  // Eventos do dia selecionado no calendário
  const selectedDayEvents = useMemo(() => {
    const selected = weekDays.find((d) => d.offset === selectedDayOffset);
    if (!selected) return [];
    const eventsList = Array.isArray(upcomingEvents) ? upcomingEvents : [];
    return eventsList.filter((e) => {
      if (!e?.data) return false;
      const eDate = String(e.data).split('T')[0];
      return eDate === selected.dateStr;
    });
  }, [weekDays, selectedDayOffset, upcomingEvents]);

  // Mensal Faturamento para gráfico de colunas
  const monthlyStats = useMemo(() => {
    if (!stats?.eventosPorMes || !Array.isArray(stats.eventosPorMes)) return [];
    return stats.eventosPorMes.slice(-6);
  }, [stats]);

  const maxRevenue = useMemo(() => {
    if (!monthlyStats.length) return 1000;
    const values = monthlyStats.map((m) => Number(m?.faturamentoTotal) || 0);
    const max = Math.max(...values, 1000);
    return max > 0 ? max : 1000;
  }, [monthlyStats]);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Hero / Boas-vindas (Inspirado no Top Banner Moderno Dribbble) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#7052ff] via-[#7c5cfc] to-[#9274fc] text-white shadow-primary-glow overflow-hidden">
        {/* Glow Elements */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-48 h-48 rounded-full bg-purple-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 p-1 backdrop-blur-md border border-white/20 shadow-lg shrink-0 flex items-center justify-center">
              <img
                src="/assets/branding/robo-avatar.png"
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                  ✨ Painel Operacional
                </span>
                <span className="text-purple-200 text-xs font-medium capitalize">
                  {currentMonthName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
                Bom dia, Luan Chaves! 👋
              </h1>
              <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-xl">
                Tudo pronto para os shows e eventos de hoje. Confira a ocupação da agenda, fluxo de faturamento e contratos gerados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 flex-wrap">
            <button
              onClick={onNavigateToNew}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-purple-50 text-[#7052ff] font-extrabold text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Contrato
            </button>
            {onNavigateToEvents && (
              <button
                onClick={onNavigateToEvents}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                Ver Agenda
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Principal: 2 Colunas (Esquerda: Conteúdo / Direita: Schedule & Earnings) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA (2/3 no Desktop): Cards de Métricas + Tabela */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. Weekly Reports / 4 Cards Pastel */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Visão Geral & Indicadores</h3>
                <p className="text-xs text-slate-400">Resumo de desempenho operacional em tempo real</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Card 1: Amarelo - Clientes */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean flex flex-col justify-between hover:shadow-clean-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Clientes</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats?.totalClientes || 0}
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">Cadastrados</span>
                </div>
              </div>

              {/* Card 2: Rosa/Coral - Contratos */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean flex flex-col justify-between hover:shadow-clean-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Contratos</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {stats?.totalContratos || 0}
                  </div>
                  <span className="text-[10px] text-rose-700 font-bold mt-0.5 block">Emitidos</span>
                </div>
              </div>

              {/* Card 3: Verde Menta - Shows */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean flex flex-col justify-between hover:shadow-clean-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Shows</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">
                    {stats?.eventosConfirmados || 0}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">Confirmados</span>
                </div>
              </div>

              {/* Card 4: Roxo Pastel - Faturamento Total */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean flex flex-col justify-between hover:shadow-clean-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Faturamento</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-black text-primary-700 truncate">
                    {formatCurrencyBRL(stats?.faturamentoTotal || 0)}
                  </div>
                  <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">Total Contratado</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tabela Principal de Eventos & Contratos */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-clean overflow-hidden">
            {/* Header da Tabela com Tabs */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Atividades & Próximos Shows</h3>
                <p className="text-xs text-slate-400 mt-0.5">Acompanhamento operacional de clientes e contratos</p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 text-xs font-bold">
                <button
                  onClick={() => setTableTab('EVENTOS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tableTab === 'EVENTOS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Próximos Shows ({upcomingEvents.length})
                </button>
                <button
                  onClick={() => setTableTab('CONTRATOS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tableTab === 'CONTRATOS'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Contratos Recentes ({recentContracts.length})
                </button>
              </div>
            </div>

            {/* Conteúdo da Tabela */}
            <div className="overflow-x-auto">
              {tableTab === 'EVENTOS' ? (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-5">Cliente / Evento</th>
                      <th className="py-3.5 px-4">Local</th>
                      <th className="py-3.5 px-4">Data & Horário</th>
                      <th className="py-3.5 px-4">Valor Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {upcomingEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhum evento futuro agendado no momento.
                        </td>
                      </tr>
                    ) : (
                      upcomingEvents.map((evt) => {
                        const isBK = Boolean(evt?.loja_unidade);
                        return (
                          <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                {isBK ? (
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                                    <Store className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-primary-700 flex items-center justify-center shrink-0 font-bold border border-purple-200">
                                    {evt?.cliente_nome ? evt.cliente_nome.charAt(0).toUpperCase() : 'E'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-[180px]">
                                    {evt?.loja_unidade || evt?.cliente_nome || evt?.nome_evento || 'Evento'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {evt?.tipo_evento === 'CORPORATIVO_BK' ? 'Burger King B2B' : evt?.tipo_evento || 'Social'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{evt?.cidade || evt?.endereco || 'São Paulo'}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-slate-800">{safeFormatDate(evt?.data)}</div>
                              <div className="text-[11px] text-slate-400">{evt?.horario || '18:00'} ({evt?.duracao || 2}h)</div>
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                              {formatCurrencyBRL(evt?.valor_total || 0)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <StatusBadge status={evt?.status || 'CONFIRMADO'} />
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              {onNavigateToEvents && (
                                <button
                                  onClick={onNavigateToEvents}
                                  className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Ver na Agenda"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-5">Nº Contrato</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Data do Show</th>
                      <th className="py-3.5 px-4">Valor Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-5 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recentContracts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Nenhum contrato gerado recentemente.
                        </td>
                      </tr>
                    ) : (
                      recentContracts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5 font-bold font-mono text-primary-700">
                            {c.numero_contrato}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {c.cliente_nome}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {safeFormatDate(c.data_evento)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                            {formatCurrencyBRL(c.valor_total || 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setPreviewContractId(c.id);
                                  setPreviewNumber(c.numero_contrato);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Visualizar Contrato"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer da Tabela com Botão de Ação */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                Mostrando {tableTab === 'EVENTOS' ? upcomingEvents.length : recentContracts.length} itens recentes
              </span>
              <button
                onClick={tableTab === 'EVENTOS' ? onNavigateToEvents : onNavigateToContracts}
                className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 hover:underline"
              >
                Ver listagem completa <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (1/3 no Desktop): Schedule Calendar & Earnings */}
        <div className="space-y-6">
          {/* 1. Schedule Calendar / Mini-Calendário Semanal */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-clean p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Agenda da Semana</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Escala de shows</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Strip de dias horizontais */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {weekDays.map((d) => (
                <button
                  key={d.offset}
                  onClick={() => setSelectedDayOffset(d.offset)}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl transition-all ${
                    d.isSelected
                      ? 'bg-[#7052ff] text-white shadow-primary-glow font-bold'
                      : d.isToday
                      ? 'bg-purple-50 text-primary-700 font-bold border border-purple-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold'
                  }`}
                >
                  <span className={`text-[10px] ${d.isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                    {d.weekName}
                  </span>
                  <span className="text-sm font-black mt-0.5 leading-none">
                    {d.dayNum}
                  </span>
                  {d.hasEvents && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        d.isSelected ? 'bg-amber-300' : 'bg-primary-600'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Card com detalhes do dia selecionado */}
            <div className="pt-2 border-t border-slate-100">
              {selectedDayEvents.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                  Nenhum show agendado para esta data.
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {selectedDayEvents.length} Show(s) nesta data:
                  </span>
                  {selectedDayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {evt?.loja_unidade || evt?.cliente_nome || evt?.nome_evento || 'Evento'}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-primary-600" /> {evt?.horario || '18:00'} ({evt?.duracao || 2}h)
                        </p>
                      </div>
                      <span className="font-black text-primary-700 text-xs font-mono shrink-0">
                        {formatCurrencyBRL(evt?.valor_total || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Earnings / Gráfico de Faturamento */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-clean p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Faturamento</span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {formatCurrencyBRL(stats?.faturamentoTotal || 0)}
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-purple-50 text-primary-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {/* Colunas do Gráfico de Barras com Visual Moderno */}
            <div className="pt-2">
              <div className="h-36 flex items-end justify-between gap-2 px-1">
                {monthlyStats.length === 0 ? (
                  <div className="w-full text-center text-xs text-slate-400 py-10">
                    Aguardando histórico mensal...
                  </div>
                ) : (
                  monthlyStats.map((m, idx) => {
                    const heightPercent = Math.max(12, Math.round(((Number(m?.faturamentoTotal) || 0) / maxRevenue) * 100));
                    const isLast = idx === monthlyStats.length - 1;

                    return (
                      <div key={`${m.ano}-${m.mes}`} className="flex-1 flex flex-col items-center gap-1.5 group">
                        {/* Barra de Coluna Arredondada */}
                        <div className="w-full h-24 bg-slate-100 rounded-xl relative flex items-end p-1 overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-lg transition-all duration-500 ${
                              isLast
                                ? 'bg-gradient-to-t from-[#7052ff] to-[#a78bfa] shadow-primary-glow'
                                : 'bg-gradient-to-t from-slate-300 to-slate-400 group-hover:from-primary-400 group-hover:to-primary-500'
                            }`}
                          />
                        </div>

                        {/* Rótulo do Mês */}
                        <span className={`text-[10px] font-bold uppercase ${isLast ? 'text-primary-700' : 'text-slate-400'}`}>
                          {m.mes_nome ? m.mes_nome.slice(0, 3) : `M${m.mes}`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total de eventos:</span>
              <span className="font-extrabold text-slate-900 font-mono">
                {stats?.totalEventos || 0} apresentações
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Prévia do Contrato */}
      {previewContractId && (
        <ContractPreviewModal
          contractId={previewContractId}
          contractNumber={previewNumber}
          onClose={() => {
            setPreviewContractId(null);
            setPreviewNumber('');
          }}
        />
      )}
    </div>
  );
};
