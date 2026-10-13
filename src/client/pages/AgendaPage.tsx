import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Bot,
  Users,
  Store,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  CalendarCheck,
  CalendarDays,
  FileText,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../api/index.js';
import { useToast } from '../context/ToastContext.js';
import { EventDetails, AttractionType, CreateEventDTO } from '../../types/index.js';
import { formatCurrencyBRL, calculateEndTime } from '../../domain/calculations.js';

interface AgendaPageProps {
  onNavigateToNewContract?: () => void;
  onNavigateToEventDetails?: (eventId: number) => void;
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

export const AgendaPage: React.FC<AgendaPageProps> = ({
  onNavigateToNewContract,
}) => {
  const { success, error } = useToast();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('TODOS');

  // Controle de Navegação no Calendário (Mês atual selecionado)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'MES' | 'LISTA'>('MES');

  // Modal de Detalhes do Evento
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Modal Rápido de Criar Novo Evento na Agenda
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    cliente_nome: '',
    tipo_evento: 'ROBO_LED',
    data: getLocalDateKey(new Date()),
    horario: '20:00',
    duracao: 1,
    endereco: '',
    loja_unidade: '',
    valor_total: 1500,
    observacoes: 'Com bazuca e gerb',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err: any) {
      console.error('Erro ao carregar eventos da agenda:', err);
      error('Erro ao carregar agenda', err.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Navegação de Mês
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Filtra eventos pela busca e tipo
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        !searchQuery.trim() ||
        (e.cliente?.nome && e.cliente.nome.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.cliente_nome && e.cliente_nome.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.nome_evento && e.nome_evento.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.loja_unidade && e.loja_unidade.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.endereco && e.endereco.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType =
        selectedTypeFilter === 'TODOS' ||
        (selectedTypeFilter === 'ROBO_LED' && (!e.tipo_evento || e.tipo_evento.includes('ROBO') || e.nome_evento?.includes('Robô'))) ||
        (selectedTypeFilter === 'PERSONAGEM' && (e.tipo_evento === 'PERSONAGEM' || e.nome_evento?.includes('Personagem'))) ||
        (selectedTypeFilter === 'BK' && (e.tipo_evento === 'CORPORATIVO_BK' || Boolean(e.loja_unidade)));

      return matchSearch && matchType;
    });
  }, [events, searchQuery, selectedTypeFilter]);

  // Constrói os dias da grade mensal
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Dias do mês anterior para completar a semana
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const d = new Date(year, month - 1, dayNum);
      const dateKey = getLocalDateKey(d);
      days.push({
        dayNum,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        events: filteredEvents.filter((e) => e.data && String(e.data).split('T')[0] === dateKey && e.status !== 'CANCELADO'),
      });
    }

    // Dias do mês atual
    const todayStr = getLocalDateKey(new Date());
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateKey = getLocalDateKey(d);
      days.push({
        dayNum: i,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        events: filteredEvents.filter((e) => e.data && String(e.data).split('T')[0] === dateKey && e.status !== 'CANCELADO'),
      });
    }

    // Dias do próximo mês para completar a grade de 35 ou 42 células
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const dateKey = getLocalDateKey(d);
      days.push({
        dayNum: i,
        dateKey,
        isCurrentMonth: false,
        isToday: false,
        events: filteredEvents.filter((e) => e.data && String(e.data).split('T')[0] === dateKey && e.status !== 'CANCELADO'),
      });
    }

    return days;
  }, [currentDate, filteredEvents]);

  // Estatísticas do Mês Atual
  const monthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthEvents = events.filter((e) => {
      if (!e.data || e.status === 'CANCELADO') return false;
      const d = new Date(e.data);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const totalFaturamento = monthEvents.reduce((acc, e) => acc + (Number(e.valor_total) || 0), 0);
    const totalHoras = monthEvents.reduce((acc, e) => acc + (Number(e.duracao) || 1), 0);

    return {
      total: monthEvents.length,
      totalFaturamento,
      totalHoras,
    };
  }, [currentDate, events]);

  // Constrói a descrição oficial padronizada para cópia / exibição
  const getFormattedEventDescription = (evt: EventDetails): string => {
    const atracaoName =
      evt.atracoes && evt.atracoes.length > 0
        ? evt.atracoes.map((a) => a.atracao?.nome || 'ROBO DE LED').join(', ')
        : evt.tipo_evento === 'PERSONAGEM'
        ? 'PERSONAGENS VIVOS'
        : 'ROBO DE LED - Nextrom';

    const endTime = evt.horario_termino || calculateEndTime(evt.horario || '20:00', evt.duracao || 1);
    const duracaoH = evt.duracao ? `${Math.floor(evt.duracao)}:${String(Math.round((evt.duracao % 1) * 60)).padStart(2, '0')}` : '1:00';

    return [
      `📌 Atração: ${atracaoName}`,
      `🗓️ Data: ${safeFormatDate(evt.data)}`,
      `⏰ Horário: ${evt.horario || '20:00'} as ${endTime}`,
      `⌛ Duração: ${duracaoH}`,
      `👤 Cliente/Responsável: ${evt.cliente?.nome || evt.cliente_nome || evt.nome_evento || 'Cliente'}`,
      `🎈 Endereço: ${evt.endereco || 'A definir'}`,
      `🏢 Local/Nome do espaço: ${evt.loja_unidade || evt.cidade || ''}`,
      `🎯 Tipo de evento: ${evt.tipo_evento || 'Debutante / Festa'}`,
      `🤝 Parceria (Se houver): ${evt.canal_b2b && evt.canal_b2b !== 'PARTICULAR' ? evt.canal_b2b : ''}`,
      `🔔 Lembrete: ${evt.observacoes || 'Com bazuca e gerb'}`,
      ``,
      `📅 roboledpartner@gmail.com`,
    ].join('\n');
  };

  const handleCopyDescription = (evt: EventDetails) => {
    const text = getFormattedEventDescription(evt);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    success('Copiado!', 'Formatação oficial copiada para a área de transferência.');
  };

  const handleCreateNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventData.cliente_nome.trim() || !newEventData.data || !newEventData.endereco.trim()) {
      error('Campos Obrigatórios', 'Preencha o nome do cliente/loja, data e endereço.');
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const dto: CreateEventDTO = {
        cliente_nome: newEventData.cliente_nome.trim(),
        tipo_evento: newEventData.tipo_evento,
        data: newEventData.data,
        horario: newEventData.horario,
        duracao: Number(newEventData.duracao) || 1,
        endereco: newEventData.endereco.trim(),
        loja_unidade: newEventData.loja_unidade.trim() || undefined,
        valor_total: Number(newEventData.valor_total) || 0,
        observacoes: newEventData.observacoes.trim() || 'Com bazuca e gerb',
        status: 'CONFIRMADO',
      };

      const created = await api.createEvent(dto);
      success('Show Agendado com Sucesso!', 'O evento foi adicionado à Mini-Agenda, à Agenda Principal e sincronizado com o Google Agenda.');
      setIsNewEventModalOpen(false);
      loadEvents();

      // Se gerou link do google calendar, abre se desejado
      if (created.google_calendar_link) {
        setSelectedEvent(created);
      }
    } catch (err: any) {
      console.error('Erro ao agendar evento:', err);
      error('Erro ao agendar', err.message || 'Tente novamente.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto transition-colors">
      {/* 1. Header Hero da Agenda com Google Calendar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-primary-600 dark:text-primary-400 text-xs font-bold border border-purple-200 dark:border-purple-800">
              📅 Sincronização Google Agenda
            </span>
            <span className="text-slate-400 text-xs font-semibold">
              roboledpartner@gmail.com
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            Agenda Oficial & Shows
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Todos os shows e eventos integrados em tempo real com a Mini-Agenda, Agenda Geral e Google Agenda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold shadow-clean transition-all"
          >
            <ExternalLink className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            Abrir Google Agenda
          </a>

          <button
            onClick={() => setIsNewEventModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7052ff] to-[#8261ff] hover:opacity-95 text-white font-extrabold text-xs shadow-primary-glow transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Agendar Novo Show
          </button>
        </div>
      </div>

      {/* 2. Cards de Métricas do Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Shows no Mês</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">{monthStats.total}</span>
            <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold capitalize">{currentMonthName}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60">
            <Bot className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Horas de Apresentação</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{monthStats.totalHoras}h</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Pista & Efeitos</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento Agendado</span>
            <span className="text-xl sm:text-2xl font-black text-primary-600 dark:text-primary-400 mt-0.5 block">
              {formatCurrencyBRL(monthStats.totalFaturamento)}
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Total Previsto</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Barra de Controles: Navegação por Mês + Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navegador de Mês */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white capitalize">
            {currentMonthName}
          </h2>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-primary-600 dark:text-primary-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente, loja, local..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary-500"
          >
            <option value="TODOS">Todas Atrações</option>
            <option value="ROBO_LED">Robô LED</option>
            <option value="PERSONAGEM">Personagens Vivos</option>
            <option value="BK">Burger King B2B</option>
          </select>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('MES')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'MES'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Grade Mensal
            </button>
            <button
              onClick={() => setViewMode('LISTA')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'LISTA'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Lista ({filteredEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* 4. Grade Calendário Visual (Modo Mês) */}
      {viewMode === 'MES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-3xl p-4 sm:p-6 overflow-hidden">
          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Grid dos Dias */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarGrid.map((day, idx) => (
              <div
                key={`${day.dateKey}-${idx}`}
                className={`min-h-[90px] sm:min-h-[120px] rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all border ${
                  day.isToday
                    ? 'bg-purple-50/60 dark:bg-purple-950/30 border-primary-500/50 ring-1 ring-primary-500/30 shadow-sm'
                    : day.isCurrentMonth
                    ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    : 'bg-transparent border-transparent opacity-30'
                }`}
              >
                {/* Cabeçalho da Célula (Número do dia) */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-black rounded-lg px-1.5 py-0.5 ${
                      day.isToday
                        ? 'bg-primary-600 text-white'
                        : day.isCurrentMonth
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.dayNum}
                  </span>

                  {day.events.length > 0 && (
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                      {day.events.length} {day.events.length === 1 ? 'show' : 'shows'}
                    </span>
                  )}
                </div>

                {/* Eventos Dentro da Célula */}
                <div className="space-y-1 my-1 overflow-y-auto max-h-[85px] no-scrollbar">
                  {day.events.map((evt) => {
                    const isBK = Boolean(evt.loja_unidade);
                    const isPersonagem = evt.tipo_evento === 'PERSONAGEM';

                    return (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`w-full text-left p-1.5 rounded-xl text-[10px] font-bold truncate transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] ${
                          isBK
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                            : isPersonagem
                            ? 'bg-pink-100 dark:bg-pink-950/80 text-pink-900 dark:text-pink-200 border border-pink-300 dark:border-pink-800'
                            : 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800'
                        }`}
                        title={`${evt.horario} - ${evt.cliente?.nome || evt.loja_unidade || evt.nome_evento}`}
                      >
                        <span className="font-mono opacity-80">{evt.horario || '20h'}</span>
                        <span className="truncate">{evt.loja_unidade || evt.cliente?.nome || evt.cliente_nome || evt.nome_evento}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Célula */}
                <div className="text-[9px] text-slate-400 text-right">
                  {day.events.length > 0 && (
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                      {formatCurrencyBRL(day.events.reduce((a, b) => a + (Number(b.valor_total) || 0), 0))}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Visualização em Lista (Modo Lista) */}
      {viewMode === 'LISTA' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-clean rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Data & Horário</th>
                  <th className="py-3.5 px-4">Atração / Evento</th>
                  <th className="py-3.5 px-4">Cliente / Responsável</th>
                  <th className="py-3.5 px-4">Local / Endereço</th>
                  <th className="py-3.5 px-4">Valor</th>
                  <th className="py-3.5 px-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhum evento encontrado no período.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono">
                        <div className="font-black text-slate-900 dark:text-white">{safeFormatDate(evt.data)}</div>
                        <div className="text-[11px] text-slate-400">{evt.horario} ({evt.duracao || 1}h)</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {evt.loja_unidade || evt.nome_evento || 'Robô LED'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {evt.tipo_evento === 'CORPORATIVO_BK' ? 'Burger King B2B' : evt.tipo_evento}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {evt.cliente?.nome || evt.cliente_nome || '-'}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {evt.cliente?.telefone || evt.cliente_telefone || ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 truncate max-w-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{evt.endereco || evt.cidade || 'São Paulo'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrencyBRL(evt.valor_total || 0)}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-primary-600 dark:text-primary-400 font-bold hover:bg-purple-100 transition-colors"
                        >
                          Ver Padrão
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Modal / Slide-over com Detalhes Formatados conforme o Padrão Oficial do Usuário */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden space-y-4 p-6 relative">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse" />
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  EVENTO ROBO DE LED
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Caixa de Texto Padronizada Oficial */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans text-xs text-slate-800 dark:text-slate-200 space-y-2 whitespace-pre-wrap leading-relaxed select-all">
              {getFormattedEventDescription(selectedEvent)}
            </div>

            {/* Ações: Copiar Formatação + Abrir no Google Calendar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                onClick={() => handleCopyDescription(selectedEvent)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedText ? 'Copiado!' : 'Copiar Texto Padronizado'}
              </button>

              <a
                href={selectedEvent.google_calendar_link || `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`EVENTO ROBO DE LED - ${selectedEvent.cliente?.nome || selectedEvent.nome_evento}`)}&details=${encodeURIComponent(getFormattedEventDescription(selectedEvent))}&location=${encodeURIComponent(selectedEvent.endereco || '')}&add=roboledpartner@gmail.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-primary-glow transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Adicionar no Google Agenda
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Rápido: Agendar Novo Evento */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Agendar Novo Show na Agenda
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewEvent} className="space-y-3.5">
              <div>
                <label className="input-label">Cliente / Responsável / Loja *</label>
                <input
                  type="text"
                  placeholder="Ex: DJ Fernando / BK Aricanduva / Maria"
                  value={newEventData.cliente_nome}
                  onChange={(e) => setNewEventData({ ...newEventData, cliente_nome: e.target.value })}
                  className="input-clean"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Data do Evento *</label>
                  <input
                    type="date"
                    value={newEventData.data}
                    onChange={(e) => setNewEventData({ ...newEventData, data: e.target.value })}
                    className="input-clean"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Horário de Início *</label>
                  <input
                    type="time"
                    value={newEventData.horario}
                    onChange={(e) => setNewEventData({ ...newEventData, horario: e.target.value })}
                    className="input-clean"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Duração (Horas)</label>
                  <select
                    value={newEventData.duracao}
                    onChange={(e) => setNewEventData({ ...newEventData, duracao: parseFloat(e.target.value) })}
                    className="input-clean"
                  >
                    <option value={1}>1 hora (1:00)</option>
                    <option value={1.5}>1h30 (1:30)</option>
                    <option value={2}>2 horas (2:00)</option>
                    <option value={3}>3 horas (3:00)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Valor Total (R$)</label>
                  <input
                    type="number"
                    value={newEventData.valor_total}
                    onChange={(e) => setNewEventData({ ...newEventData, valor_total: parseFloat(e.target.value) || 0 })}
                    className="input-clean"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Endereço Completo do Show *</label>
                <input
                  type="text"
                  placeholder="Ex: Estrada do Yamane 1093, Buffet XYZ"
                  value={newEventData.endereco}
                  onChange={(e) => setNewEventData({ ...newEventData, endereco: e.target.value })}
                  className="input-clean"
                  required
                />
              </div>

              <div>
                <label className="input-label">Lembrete & Observações (Bazuca, Gerb, etc.)</label>
                <input
                  type="text"
                  placeholder="Ex: Com bazuca e gerb"
                  value={newEventData.observacoes}
                  onChange={(e) => setNewEventData({ ...newEventData, observacoes: e.target.value })}
                  className="input-clean"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-extrabold text-xs shadow-primary-glow hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {isSubmittingEvent ? 'Salvando...' : 'Confirmar & Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
