import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  DollarSign,
  Bot,
  Users,
  ArrowUpRight,
  Eye,
  Download,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { StatsCard } from '../components/StatsCard.js';
import { StatusBadge, AttractionBadge } from '../components/Badge.js';
import { ContractPreviewModal } from '../components/ContractPreviewModal.js';
import { api } from '../api/index.js';
import { DashboardStats, Contract, MonthlyEventStats, YearlyEventStats } from '../../types/index.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';
import { formatDateBR } from '../../domain/date.js';

interface DashboardPageProps {
  onNavigateToNew: () => void;
  onNavigateToContracts: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToFinancial?: () => void;
}

type DashboardTab = 'geral' | 'eventos_mes' | 'faturamento_mes' | 'resumo_anual';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToNew,
  onNavigateToContracts,
  onNavigateToEvents,
  onNavigateToFinancial,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('geral');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [previewContractId, setPreviewContractId] = useState<number | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string>('');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, contractsData] = await Promise.all([
        api.getDashboard(),
        api.getContracts(),
      ]);
      setStats(statsData);
      setRecentContracts(contractsData.slice(0, 8));
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

  // Anos disponíveis
  const availableYears = useMemo(() => {
    if (!stats?.eventosPorMes) return [];
    const years = Array.from(new Set(stats.eventosPorMes.map((m) => m.ano))).sort((a, b) => a - b);
    return years;
  }, [stats]);

  // Eventos por mês filtrados pelo ano selecionado
  const filteredMonthlyStats = useMemo(() => {
    if (!stats?.eventosPorMes) return [];
    if (selectedYear === 'ALL') return stats.eventosPorMes;
    return stats.eventosPorMes.filter((m) => m.ano === selectedYear);
  }, [stats, selectedYear]);

  // Faturamento máximo mensal para escala de gráfico
  const maxMonthlyRevenue = useMemo(() => {
    if (!filteredMonthlyStats.length) return 1000;
    const max = Math.max(...filteredMonthlyStats.map((m) => m.faturamentoTotal));
    return max > 0 ? max : 1000;
  }, [filteredMonthlyStats]);

  // Eventos máximo mensal para escala de gráfico
  const maxMonthlyEvents = useMemo(() => {
    if (!filteredMonthlyStats.length) return 10;
    const max = Math.max(...filteredMonthlyStats.map((m) => m.totalEventos));
    return max > 0 ? max : 10;
  }, [filteredMonthlyStats]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-dark-800/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl bg-dark-800/60" />
          <div className="h-72 rounded-2xl bg-dark-800/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Top Banner Quick Overview */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800 to-brand-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Ambient Glow Background Effect */}
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-brand-600/10 via-purple-600/5 to-transparent pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative w-16 h-16 rounded-2xl bg-dark-900 border border-brand-500/40 shadow-lg shadow-brand-500/25 overflow-hidden shrink-0 flex items-center justify-center group">
            <img
              src="/assets/branding/robo-avatar.png"
              alt="Robo Led Partner"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" /> Gestão Operacional & Inteligência de Eventos
            </div>
            <h2 className="text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
              <span>Painel Geral da Robo Led Partner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe a evolução mensal e anual de eventos, faturamento contratado e contratos gerados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap relative z-10">
          <button
            onClick={handleGenerateAllContracts}
            disabled={isGeneratingBatch}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Gera contrato e PDF para todos os eventos da base"
          >
            <FileText className="w-3.5 h-3.5 text-brand-400" />
            {isGeneratingBatch ? 'Gerando...' : 'Padronizar Contratos'}
          </button>
          <button
            onClick={onNavigateToNew}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-pink-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            + Criar Novo Contrato
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Contratos Gerados"
          value={stats?.totalContratos || 0}
          subtitle="Documentos emitidos"
          icon={FileText}
          iconColor="text-brand-400"
        />
        <StatsCard
          title="Total de Eventos"
          value={stats?.totalEventos || 0}
          subtitle={`${stats?.eventosFuturos || 0} futuros`}
          icon={Calendar}
          iconColor="text-emerald-400"
          accentGradient="from-emerald-600/20 to-teal-600/10"
        />
        <StatsCard
          title="Contratos Robô LED"
          value={stats?.contratosRoboLed || 0}
          subtitle="Apresentações"
          icon={Bot}
          iconColor="text-cyan-400"
          accentGradient="from-cyan-600/20 to-blue-600/10"
        />
        <StatsCard
          title="Personagens Vivos"
          value={stats?.contratosPersonagens || 0}
          subtitle="La Casa / Cosplays"
          icon={Users}
          iconColor="text-purple-400"
          accentGradient="from-purple-600/20 to-pink-600/10"
        />
        <StatsCard
          title="Faturamento Total"
          value={formatCurrencyBRL(stats?.valorTotalContratado || 0, true)}
          subtitle={`${formatCurrencyBRL(stats?.valorTotalRecebido || 0, true)} recebido`}
          icon={DollarSign}
          iconColor="text-amber-400"
          accentGradient="from-amber-600/20 to-orange-600/10"
        />
      </div>

      {/* Tabs Switcher for Monthly / Yearly Analytics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 bg-dark-800/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'geral'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('eventos_mes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'eventos_mes'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Eventos por Mês
          </button>
          <button
            onClick={() => setActiveTab('faturamento_mes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'faturamento_mes'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Faturamento por Mês
          </button>
          <button
            onClick={() => setActiveTab('resumo_anual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'resumo_anual'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Resumo por Ano
          </button>
        </div>

        {/* Seletor de Ano quando nas abas mensais */}
        {(activeTab === 'eventos_mes' || activeTab === 'faturamento_mes') && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Filtrar Ano:</span>
            <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setSelectedYear('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  selectedYear === 'ALL' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedYear === yr ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= ABA 1: VISÃO GERAL ================= */}
      {activeTab === 'geral' && (
        <div className="space-y-8">
          {/* Main Grid: Próximos Eventos & Últimos Contratos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Próximos Eventos */}
            <div className="card-glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Próximos Eventos</h3>
                      <p className="text-[11px] text-slate-400">Cronograma de apresentações confirmadas</p>
                    </div>
                  </div>
                  {onNavigateToEvents && (
                    <button
                      onClick={onNavigateToEvents}
                      className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {stats?.proximosEventos && stats.proximosEventos.length > 0 ? (
                  <div className="space-y-3">
                    {stats.proximosEventos.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-700/50 flex items-center justify-between hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-slate-800 text-center min-w-[52px] border border-slate-700">
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              {new Date(ev.data_evento + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                            </div>
                            <div className="text-base font-black text-white leading-tight">
                              {new Date(ev.data_evento + 'T00:00:00').getDate()}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {ev.cliente_nome}
                              {ev.numero && (
                                <span className="text-[10px] text-brand-400 font-mono">({ev.numero})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <AttractionBadge tipo={ev.tipo} personagem={ev.personagem} />
                              {ev.horario && (
                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-slate-400" /> {ev.horario}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="text-xs font-bold text-white">{formatCurrencyBRL(ev.valor_total, true)}</div>
                            <StatusBadge status={ev.status_evento} />
                          </div>
                          {ev.contrato_id && (
                            <button
                              onClick={() => {
                                setPreviewContractId(ev.contrato_id!);
                                setPreviewNumber(ev.numero || '');
                              }}
                              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                              title="Visualizar Contrato"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Nenhum evento futuro agendado no momento.
                  </div>
                )}
              </div>
            </div>

            {/* Últimos Contratos Gerados */}
            <div className="card-glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Contratos Padronizados</h3>
                      <p className="text-[11px] text-slate-400">Documentos emitidos vinculados aos eventos</p>
                    </div>
                  </div>
                  <button
                    onClick={onNavigateToContracts}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                  >
                    Histórico completo <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentContracts.length > 0 ? (
                  <div className="space-y-3">
                    {recentContracts.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-700/50 flex items-center justify-between hover:border-slate-600 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-brand-400 font-mono">{c.numero}</span>
                            <span className="text-xs font-semibold text-white">{c.cliente?.nome}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <AttractionBadge tipo={c.tipo} personagem={c.personagem} quantidade={c.quantidade_personagens} />
                            <span className="text-[11px] text-slate-400">
                              Evento: {formatDateBR(c.evento?.data)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <div className="text-xs font-bold text-white">{formatCurrencyBRL(c.valor_total, true)}</div>
                            <div className="text-[10px] text-slate-400">40% / 60%</div>
                          </div>
                          <button
                            onClick={() => {
                              setPreviewContractId(c.id);
                              setPreviewNumber(c.numero);
                            }}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Visualizar Contrato"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={api.getContractPdfUrl(c.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-brand-600/30 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                            title="Baixar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Nenhum contrato gerado ainda. Clique em "Padronizar Contratos" ou "Novo Contrato".
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 2: EVENTOS POR MÊS ================= */}
      {activeTab === 'eventos_mes' && (
        <div className="space-y-6">
          {/* Header informativo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Total no Período</div>
                <div className="text-xl font-black text-white">
                  {filteredMonthlyStats.reduce((acc, m) => acc + m.totalEventos, 0)} Eventos
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Eventos Realizados</div>
                <div className="text-xl font-black text-emerald-400">
                  {filteredMonthlyStats.reduce((acc, m) => acc + m.eventosRealizados, 0)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Eventos Agendados</div>
                <div className="text-xl font-black text-cyan-400">
                  {filteredMonthlyStats.reduce((acc, m) => acc + m.eventosAgendados, 0)}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Cancelados</div>
                <div className="text-xl font-black text-rose-400">
                  {filteredMonthlyStats.reduce((acc, m) => acc + m.eventosCancelados, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras de Eventos por Mês */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-400" /> Volume de Eventos por Mês
                </h3>
                <p className="text-xs text-slate-400">Distribuição mensal do volume de festas e apresentações</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {filteredMonthlyStats.map((m) => {
                const heightPercent = Math.max(12, Math.round((m.totalEventos / maxMonthlyEvents) * 100));
                return (
                  <div
                    key={m.mes}
                    className="p-3.5 rounded-xl bg-dark-800/90 border border-slate-700/60 hover:border-brand-500/50 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-brand-300 font-mono">{m.mesFormatado}</span>
                        <span className="text-sm font-black text-white">{m.totalEventos}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {formatCurrencyBRL(m.faturamentoTotal, true)}
                      </div>
                    </div>

                    {/* Barra visual de eventos */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                        <div
                          style={{ width: `${(m.eventosRealizados / (m.totalEventos || 1)) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Realizados: ${m.eventosRealizados}`}
                        />
                        <div
                          style={{ width: `${(m.eventosAgendados / (m.totalEventos || 1)) * 100}%` }}
                          className="bg-cyan-500 h-full"
                          title={`Agendados: ${m.eventosAgendados}`}
                        />
                        <div
                          style={{ width: `${(m.eventosCancelados / (m.totalEventos || 1)) * 100}%` }}
                          className="bg-rose-500 h-full"
                          title={`Cancelados: ${m.eventosCancelados}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                        <span className="text-emerald-400">✓ {m.eventosRealizados}</span>
                        <span className="text-cyan-400">⏱ {m.eventosAgendados}</span>
                        {m.eventosCancelados > 0 && <span className="text-rose-400">✕ {m.eventosCancelados}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela Detalhada Mês a Mês */}
          <div className="card-glass rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-sm font-bold text-white mb-4">Detalhamento Mensal de Operações</h3>
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Mês / Ano</th>
                  <th className="py-3 px-3 text-center">Total Eventos</th>
                  <th className="py-3 px-3 text-center">Realizados</th>
                  <th className="py-3 px-3 text-center">Agendados</th>
                  <th className="py-3 px-3 text-center">Cancelados</th>
                  <th className="py-3 px-3 text-right">Faturamento</th>
                  <th className="py-3 px-3 text-right">Recebido</th>
                  <th className="py-3 px-3 text-right">A Receber</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMonthlyStats.map((m) => (
                  <tr key={m.mes} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{m.mesFormatado}</td>
                    <td className="py-3 px-3 text-center font-bold text-brand-400">{m.totalEventos}</td>
                    <td className="py-3 px-3 text-center text-emerald-400 font-semibold">{m.eventosRealizados}</td>
                    <td className="py-3 px-3 text-center text-cyan-400 font-semibold">{m.eventosAgendados}</td>
                    <td className="py-3 px-3 text-center text-rose-400 font-semibold">{m.eventosCancelados}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-white">{formatCurrencyBRL(m.faturamentoTotal)}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-semibold">{formatCurrencyBRL(m.totalRecebido)}</td>
                    <td className="py-3 px-3 text-right text-amber-400 font-semibold">{formatCurrencyBRL(m.totalPendente)}</td>
                    <td className="py-3 px-3 text-center">
                      {onNavigateToEvents && (
                        <button
                          onClick={onNavigateToEvents}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Ver Eventos →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ABA 3: FATURAMENTO POR MÊS ================= */}
      {activeTab === 'faturamento_mes' && (
        <div className="space-y-6">
          {/* Cards de Métricas Financeiras Consolidadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Faturamento Total Contratado</div>
              <div className="text-2xl font-black text-white mt-1">
                {formatCurrencyBRL(filteredMonthlyStats.reduce((acc, m) => acc + m.faturamentoTotal, 0))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Soma de todos os contratos e apresentações</p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Total Já Recebido</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {formatCurrencyBRL(filteredMonthlyStats.reduce((acc, m) => acc + m.totalRecebido, 0))}
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">Quitados via PIX ou Sinal</p>
            </div>

            <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Total Pendente a Receber</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {formatCurrencyBRL(filteredMonthlyStats.reduce((acc, m) => acc + m.totalPendente, 0))}
              </div>
              <p className="text-[11px] text-amber-400/80 mt-1">Saldos restantes e eventos futuros</p>
            </div>
          </div>

          {/* Gráfico Comparativo de Faturamento Mês a Mês */}
          <div className="card-glass rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Fluxo de Faturamento Mensal (R$)
            </h3>
            <p className="text-xs text-slate-400 mb-6">Comparação do valor faturado, recebido e pendente por mês</p>

            <div className="space-y-4">
              {filteredMonthlyStats.map((m) => {
                const percentFaturado = Math.round((m.faturamentoTotal / maxMonthlyRevenue) * 100);
                const percentRecebido = m.faturamentoTotal > 0 ? Math.round((m.totalRecebido / m.faturamentoTotal) * 100) : 0;

                return (
                  <div key={m.mes} className="p-4 rounded-xl bg-dark-800/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-white font-mono min-w-[70px]">{m.mesFormatado}</span>
                        <span className="text-[11px] text-slate-400">({m.totalEventos} eventos)</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-slate-400">
                          Total: <strong className="text-white">{formatCurrencyBRL(m.faturamentoTotal)}</strong>
                        </span>
                        <span className="text-emerald-400 font-medium">
                          Recebido: {formatCurrencyBRL(m.totalRecebido)}
                        </span>
                        {m.totalPendente > 0 && (
                          <span className="text-amber-400 font-medium">
                            Pendente: {formatCurrencyBRL(m.totalPendente)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de Progresso Financeira */}
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden flex border border-slate-800">
                      <div
                        style={{ width: `${(m.totalRecebido / (m.faturamentoTotal || 1)) * 100}%` }}
                        className="bg-emerald-500 h-full transition-all"
                        title={`Recebido: ${formatCurrencyBRL(m.totalRecebido)}`}
                      />
                      <div
                        style={{ width: `${(m.totalPendente / (m.faturamentoTotal || 1)) * 100}%` }}
                        className="bg-amber-500/80 h-full transition-all"
                        title={`Pendente: ${formatCurrencyBRL(m.totalPendente)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: RESUMO POR ANO ================= */}
      {activeTab === 'resumo_anual' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats?.metricasPorAno.map((y) => (
              <div
                key={y.ano}
                className="p-6 rounded-2xl bg-gradient-to-b from-dark-800/90 to-dark-900/90 border border-slate-800 hover:border-brand-500/40 shadow-xl transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-brand-400">Exercício</span>
                    <h3 className="text-3xl font-black text-white tracking-tight">{y.ano}</h3>
                  </div>
                  <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Total de Eventos:</span>
                    <span className="text-base font-extrabold text-white">{y.totalEventos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Eventos Realizados:</span>
                    <span className="font-bold text-emerald-400">{y.eventosRealizados}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Eventos Agendados / Futuros:</span>
                    <span className="font-bold text-cyan-400">{y.eventosAgendados}</span>
                  </div>
                  <div className="h-px bg-slate-800 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Faturamento Anual:</span>
                    <span className="text-sm font-black text-white">{formatCurrencyBRL(y.faturamentoTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Total Já Recebido:</span>
                    <span className="font-bold text-emerald-400">{formatCurrencyBRL(y.totalRecebido)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Total a Receber:</span>
                    <span className="font-bold text-amber-400">{formatCurrencyBRL(y.totalPendente)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Ticket Médio por Evento:</span>
                    <span className="font-bold text-purple-400">{formatCurrencyBRL(y.ticketMedio)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Prévia de Contrato */}
      {previewContractId && (
        <ContractPreviewModal
          isOpen={true}
          onClose={() => setPreviewContractId(null)}
          contractId={previewContractId}
          contractNumber={previewNumber}
          onRegenerated={loadData}
        />
      )}
    </div>
  );
};
