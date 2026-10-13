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
import { formatDateBR } from '../../domain/date.js';

interface DashboardPageProps {
  onNavigateToNew: () => void;
  onNavigateToContracts: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToFinancial?: () => void;
}

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
      const [statsData, contractsData, eventsData] = await Promise.all([
        api.getDashboard(),
        api.getContracts(),
        api.getEvents({ onlyUpcoming: true }),
      ]);
      setStats(statsData);
      setRecentContracts(contractsData.slice(0, 8));
      setUpcomingEvents(eventsData.slice(0, 8));
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
      alert('Erro ao gerar contratos: ' + err.message);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

  // Dias da semana para o Mini-Calendário (Ex: Seg, Ter, Qua, Qui, Sex, Sáb, Dom)
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    // Gera 7 dias a partir de 3 dias atrás até 3 dias à frente
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayNum = d.getDate();
      const weekName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;
      const isSelected = i === selectedDayOffset;

      // Conta quantos eventos tem neste dia
      const eventsOnDay = upcomingEvents.filter((e) => e.data === dateStr);

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
    return upcomingEvents.filter((e) => e.data === selected.dateStr);
  }, [weekDays, selectedDayOffset, upcomingEvents]);

  // Mensal Faturamento para gráfico de colunas
  const monthlyStats = useMemo(() => {
    if (!stats?.eventosPorMes) return [];
    return stats.eventosPorMes.slice(-6); // últimos 6 meses
  }, [stats]);

  const maxRevenue = useMemo(() => {
    if (!monthlyStats.length) return 1000;
    const max = Math.max(...monthlyStats.map((m) => m.faturamentoTotal));
    return max > 0 ? max : 1000;
  }, [monthlyStats]);

  // Saudação de acordo com a hora
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="h-44 rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-slate-200" />
          <div className="h-96 rounded-3xl bg-slate-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* ==================== GRID PRINCIPAL ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* ==================== COLUNA ESQUERDA (8 COLUNAS) ==================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Hero Greeting Banner */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#7052ff] via-[#7c5cfc] to-[#9274fc] text-white shadow-primary-glow">
            {/* Soft decorative background circles */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 right-24 w-48 h-48 rounded-full bg-white/15 blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-md">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-md inline-block uppercase tracking-wider">
                  {todayFormatted}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {greeting}, Luan Chaves!
                </h1>
                <p className="text-xs sm:text-sm text-purple-100 font-medium leading-relaxed">
                  Tudo pronto para as apresentações de hoje. Acompanhe os contratos, shows do Burger King e fluxo financeiro em tempo real.
                </p>

                <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                  <button
                    onClick={onNavigateToNew}
                    className="px-4 py-2 rounded-xl bg-white text-primary-700 font-bold text-xs shadow-md hover:bg-purple-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo Contrato
                  </button>
                  {onNavigateToEvents && (
                    <button
                      onClick={onNavigateToEvents}
                      className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
                    >
                      <CalendarDays className="w-3.5 h-3.5" /> Ver Agenda de Shows
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar / Robot Illustration */}
              <div className="hidden sm:flex relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-white/20 p-2 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center">
                  <img
                    src="/assets/branding/robo-avatar.png"
                    alt="Robô LED Partner"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <Bot className="w-12 h-12 text-white absolute hidden" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Weekly Reports / Resumo Operacional (4 Cards Pastel) */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>Resumo Operacional & Métricas</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">Tempo Real</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Clientes / Atendimentos (Yellow Pastel) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Base Clientes</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{stats?.totalClientes || 0}</div>
                  <span className="text-[10px] text-amber-600 font-bold mt-0.5 block">Cadastrados</span>
                </div>
              </div>

              {/* Card 2: Contratos Emitidos (Rose/Coral Pastel) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Contratos</span>
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{stats?.totalContratos || 0}</div>
                  <span className="text-[10px] text-rose-600 font-bold mt-0.5 block">Gerados</span>
                </div>
              </div>

              {/* Card 3: Shows / Eventos Confirmados (Mint Pastel) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">Shows / Agenda</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{stats?.totalEventos || 0}</div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Confirmados</span>
                </div>
              </div>

              {/* Card 4: Faturamento Total (Purple Pastel) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all flex flex-col justify-between">
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

          {/* 3. Work with Clients / Tabela Principal de Eventos & Contratos */}
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
                      <th className="py-3.5 px-5">Cliente / Loja</th>
                      <th className="py-3.5 px-4">Local / Cidade</th>
                      <th className="py-3.5 px-4">Data & Horário</th>
                      <th className="py-3.5 px-4">Valor</th>
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
                        const isBK = Boolean(evt.loja_unidade);
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
                                    {evt.cliente_nome ? evt.cliente_nome.charAt(0).toUpperCase() : 'E'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-[180px]">
                                    {evt.loja_unidade || evt.cliente_nome || evt.nome_evento}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {evt.tipo_evento === 'CORPORATIVO_BK' ? 'Burger King B2B' : evt.tipo_evento}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[140px]">{evt.cidade || evt.endereco || 'São Paulo'}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-slate-800">{evt.data.split('-').reverse().join('/')}</div>
                              <div className="text-[11px] text-slate-400">{evt.horario} ({evt.duracao}h)</div>
                            </td>

                            <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                              {formatCurrencyBRL(evt.valor_total)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <StatusBadge status={evt.status} />
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
                            {formatDateBR(c.data_evento)}
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                            {formatCurrencyBRL(c.valor_total)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => {
                                setPreviewContractId(c.id);
                                setPreviewNumber(c.numero_contrato);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold text-[11px] transition-colors"
                            >
                              Ver Contrato
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ==================== COLUNA DIREITA (4 COLUNAS) ==================== */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. Mini-Calendário Interativo (Schedule Calendar) */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-clean p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Schedule Calendar</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Escala de shows da semana</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase()}
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
                          {evt.loja_unidade || evt.cliente_nome || evt.nome_evento}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-primary-600" /> {evt.horario} ({evt.duracao}h)
                        </p>
                      </div>
                      <span className="font-black text-primary-700 text-xs font-mono shrink-0">
                        {formatCurrencyBRL(evt.valor_total)}
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
                    const heightPercent = Math.max(12, Math.round((m.faturamentoTotal / maxRevenue) * 100));
                    const isLast = idx === monthlyStats.length - 1;

                    return (
                      <div key={`${m.ano}-${m.mes}`} className="flex-1 flex flex-col items-center gap-1.5 group">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-primary-700 bg-purple-50 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          {formatCurrencyBRL(m.faturamentoTotal)}
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[28px] bg-slate-100 rounded-xl h-28 flex items-end p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-lg transition-all duration-500 ${
                              isLast
                                ? 'bg-gradient-to-t from-[#7052ff] to-[#9274fc] shadow-md shadow-primary-500/30'
                                : 'bg-gradient-to-t from-sky-400 to-indigo-400'
                            }`}
                          />
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {m.mesNome.substring(0, 3)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 3. Ações Rápidas & Atalhos */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-clean p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações Rápidas</h4>
            
            <div className="space-y-2">
              <button
                onClick={onNavigateToNew}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#7052ff] to-[#8b5cf6] text-white font-bold text-xs shadow-primary-glow flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Criar Novo Contrato
                </span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </button>

              <button
                onClick={handleGenerateAllContracts}
                disabled={isGeneratingBatch}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/80 flex items-center justify-between transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  {isGeneratingBatch ? 'Gerando Contratos...' : 'Padronizar Contratos & PDFs'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de Prévia do Contrato */}
      {previewContractId && (
        <ContractPreviewModal
          contractId={previewContractId}
          contractNumber={previewNumber}
          onClose={() => setPreviewContractId(null)}
        />
      )}
    </div>
  );
};
