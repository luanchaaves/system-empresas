import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Trash2,
  Edit2,
  Calendar,
  X,
  Share2,
  Check,
  Table,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  PieChart,
  Award,
  Music,
  PartyPopper,
  Compass,
} from 'lucide-react';
import { api } from '../api/index.js';
import { EventDetails, EventStatus, Attraction, CreateEventDTO, Client } from '../../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { maskCPFInput, cleanCPF, isValidCPF, formatCPF } from '../../domain/cpf.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

interface EventosPageProps {
  onNavigateToNewContractWithEvent?: (event: EventDetails) => void;
  searchQuery?: string;
  initialClient?: Client;
}

export const EventosPage: React.FC<EventosPageProps> = ({
  onNavigateToNewContractWithEvent,
  searchQuery = '',
  initialClient,
}) => {
  const { success, error, info } = useToast();
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [typeCategory, setTypeCategory] = useState<'TODOS' | 'SOCIAIS' | 'CORPORATIVOS'>('SOCIAIS');
  const [viewMode, setViewMode] = useState<'DASHBOARDS' | 'TABLE' | 'CARDS'>('DASHBOARDS');
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [generatingContractId, setGeneratingContractId] = useState<number | null>(null);
  const [syncingGoogleId, setSyncingGoogleId] = useState<number | null>(null);

  // Seleção de Cliente Existente no Modal
  const [clientMode, setClientMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [clientFilterQuery, setClientFilterQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    cliente_nome: string;
    cliente_cpf: string;
    cliente_telefone: string;
    cliente_email: string;
    nome_evento: string;
    tipo_evento: string;
    data: string;
    horario: string;
    duracao: number;
    endereco: string;
    cidade: string;
    estado: string;
    status: EventStatus;
    valor_total: number;
    observacoes: string;
    atracao_ids: number[];
  }>({
    cliente_nome: '',
    cliente_cpf: '',
    cliente_telefone: '',
    cliente_email: '',
    nome_evento: '',
    tipo_evento: 'ANIVERSARIO',
    data: new Date().toISOString().split('T')[0],
    horario: '20:00',
    duracao: 2,
    endereco: '',
    cidade: 'São Bernardo do Campo',
    estado: 'SP',
    status: 'AGENDADO',
    valor_total: 700,
    observacoes: '',
    atracao_ids: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsData, attractionsData, clientsData] = await Promise.all([
        api.getEvents({
          status: selectedStatus !== 'TODOS' ? (selectedStatus as EventStatus) : undefined,
          search: searchQuery || undefined,
          isSocial: typeCategory === 'SOCIAIS' ? true : undefined,
          isB2B: typeCategory === 'CORPORATIVOS' ? true : undefined,
        }),
        api.getAttractions({ ativo: true }),
        api.getClients(),
      ]);
      setEvents(eventsData);
      setAttractions(attractionsData);
      setClients(clientsData);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, searchQuery, typeCategory]);

  useEffect(() => {
    if (initialClient) {
      setEditingEventId(null);
      setSelectedClientId(initialClient.id);
      setClientMode('EXISTING');
      setFormData({
        cliente_nome: initialClient.nome,
        cliente_cpf: initialClient.cpf,
        cliente_telefone: initialClient.telefone || '',
        cliente_email: initialClient.email || '',
        nome_evento: `Festa de ${initialClient.nome}`,
        tipo_evento: 'ANIVERSARIO',
        data: new Date().toISOString().split('T')[0],
        horario: '20:00',
        duracao: 2,
        endereco: initialClient.endereco || '',
        cidade: 'São Bernardo do Campo',
        estado: 'SP',
        status: 'AGENDADO',
        valor_total: 700,
        observacoes: '',
        atracao_ids: [],
      });
      setShowModal(true);
    }
  }, [initialClient]);

  // ==================== DASHBOARD ANALYTICS COMPUTATIONS ====================
  const eventAnalytics = useMemo(() => {
    let totalValor = 0;
    let totalHoras = 0;
    let realizados = 0;
    let agendados = 0;
    let confirmados = 0;
    let cancelados = 0;
    let emAndamento = 0;

    const partyMap: { [key: string]: { label: string; count: number; total: number; color: string; icon: string } } = {
      CASAMENTO: { label: 'Casamentos & Bodas', count: 0, total: 0, color: 'bg-rose-500', icon: '💍' },
      DEBUTANTE: { label: '15 Anos & Debutantes', count: 0, total: 0, color: 'bg-pink-500', icon: '👑' },
      INFANTIL: { label: 'Aniversários Infantis', count: 0, total: 0, color: 'bg-cyan-500', icon: '🎈' },
      ANIVERSARIO: { label: 'Aniversários & Adultos', count: 0, total: 0, color: 'bg-purple-500', icon: '🎉' },
      CORPORATIVO: { label: 'Corporativos & B2B', count: 0, total: 0, color: 'bg-amber-500', icon: '🏢' },
      OUTRO: { label: 'Outras Apresentações', count: 0, total: 0, color: 'bg-slate-500', icon: '✨' },
    };

    const weekdayMap = [
      { name: 'Domingo', count: 0, total: 0, isWeekend: true },
      { name: 'Segunda-feira', count: 0, total: 0, isWeekend: false },
      { name: 'Terça-feira', count: 0, total: 0, isWeekend: false },
      { name: 'Quarta-feira', count: 0, total: 0, isWeekend: false },
      { name: 'Quinta-feira', count: 0, total: 0, isWeekend: false },
      { name: 'Sexta-feira', count: 0, total: 0, isWeekend: true },
      { name: 'Sábado', count: 0, total: 0, isWeekend: true },
    ];

    const cidadesMap: { [key: string]: { cidade: string; count: number; total: number } } = {};

    for (const ev of events) {
      const v = Number(ev.valor_total) || 0;
      const h = Number(ev.duracao) || 2;
      totalValor += v;
      totalHoras += h;

      if (ev.status === 'REALIZADO') realizados++;
      else if (ev.status === 'CONFIRMADO') confirmados++;
      else if (ev.status === 'AGENDADO') agendados++;
      else if (ev.status === 'EM_ANDAMENTO') emAndamento++;
      else if (ev.status === 'CANCELADO') cancelados++;

      // Mix de Festas
      const rawTipo = (ev.tipo_evento || 'OUTRO').toUpperCase();
      let tipoKey = 'OUTRO';
      if (rawTipo.includes('CASAMENTO')) tipoKey = 'CASAMENTO';
      else if (rawTipo.includes('DEBUTANTE') || rawTipo.includes('15')) tipoKey = 'DEBUTANTE';
      else if (rawTipo.includes('INFANTIL')) tipoKey = 'INFANTIL';
      else if (rawTipo.includes('ANIVERSARIO')) tipoKey = 'ANIVERSARIO';
      else if (rawTipo.includes('CORPORATIVO') || rawTipo.includes('B2B') || rawTipo.includes('BK') || rawTipo.includes('OG') || rawTipo.includes('REI')) tipoKey = 'CORPORATIVO';

      partyMap[tipoKey].count++;
      partyMap[tipoKey].total += v;

      // Dia da Semana
      if (ev.data) {
        const parts = ev.data.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const dayIndex = d.getDay();
          if (weekdayMap[dayIndex]) {
            weekdayMap[dayIndex].count++;
            weekdayMap[dayIndex].total += v;
          }
        }
      }

      // Cidades
      const cid = ev.cidade?.trim() || 'São Bernardo do Campo';
      if (!cidadesMap[cid]) {
        cidadesMap[cid] = { cidade: cid, count: 0, total: 0 };
      }
      cidadesMap[cid].count++;
      cidadesMap[cid].total += v;
    }

    const totalCount = events.length;
    const ticketMedio = totalCount > 0 ? totalValor / totalCount : 0;

    const topCidades = Object.values(cidadesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const partyTypes = Object.values(partyMap).filter((item) => item.count > 0);

    return {
      totalCount,
      totalHoras,
      totalValor,
      ticketMedio,
      realizados,
      confirmados,
      agendados,
      cancelados,
      emAndamento,
      partyTypes,
      weekdayMap,
      topCidades,
    };
  }, [events]);

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setSelectedClientId('');
    setClientMode('EXISTING');
    
    // Auto-seleciona a primeira atração por padrão se houver
    const defaultAtt = attractions.length > 0 ? attractions[0] : null;
    const initialAttIds = defaultAtt ? [defaultAtt.id] : [];
    const initialVal = defaultAtt?.valor_base || 700;

    setFormData({
      cliente_nome: '',
      cliente_cpf: '',
      cliente_telefone: '',
      cliente_email: '',
      nome_evento: defaultAtt ? `${defaultAtt.nome}` : '',
      tipo_evento: 'ANIVERSARIO',
      data: new Date().toISOString().split('T')[0],
      horario: '20:00',
      duracao: 2,
      endereco: '',
      cidade: 'São Bernardo do Campo',
      estado: 'SP',
      status: 'AGENDADO',
      valor_total: initialVal,
      observacoes: '',
      atracao_ids: initialAttIds,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (event: EventDetails) => {
    setEditingEventId(event.id);
    setSelectedClientId(event.cliente_id || '');
    setClientMode('EXISTING');
    setFormData({
      cliente_nome: event.cliente?.nome || '',
      cliente_cpf: event.cliente?.cpf || '',
      cliente_telefone: event.cliente?.telefone || '',
      cliente_email: event.cliente?.email || '',
      nome_evento: event.nome_evento,
      tipo_evento: event.tipo_evento || 'ANIVERSARIO',
      data: event.data,
      horario: event.horario,
      duracao: event.duracao,
      endereco: event.endereco,
      cidade: event.cidade,
      estado: event.estado,
      status: event.status,
      valor_total: event.valor_total,
      observacoes: event.observacoes || '',
      atracao_ids: event.atracoes && event.atracoes.length > 0 
        ? event.atracoes.map((a) => a.id) 
        : (attractions.length > 0 ? [attractions[0].id] : []),
    });
    setShowModal(true);
  };

  const handleSelectClient = (clientId: number) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => {
        const selectedAtts = attractions.filter(a => prev.atracao_ids.includes(a.id)).map(a => a.nome).join(' + ');
        const prefix = selectedAtts || 'Robô LED';
        const autoTitle = `${prefix} - ${client.nome}`;

        return {
          ...prev,
          cliente_nome: client.nome,
          cliente_cpf: client.cpf,
          cliente_telefone: client.telefone || '',
          cliente_email: client.email || '',
          endereco: prev.endereco || client.endereco || '',
          cidade: prev.cidade || client.cidade || 'São Bernardo do Campo',
          estado: prev.estado || client.estado || 'SP',
          nome_evento: prev.nome_evento && !prev.nome_evento.startsWith('Evento ') && !prev.nome_evento.startsWith('Apresentação')
            ? prev.nome_evento
            : autoTitle,
        };
      });
    }
  };

  const toggleAttraction = (id: number) => {
    setFormData((prev) => {
      const exists = prev.atracao_ids.includes(id);
      const newIds = exists ? prev.atracao_ids.filter((item) => item !== id) : [...prev.atracao_ids, id];

      const selectedAtts = attractions.filter(a => newIds.includes(a.id));
      const totalBase = selectedAtts.reduce((sum, att) => sum + (att?.valor_base || 0), 0);
      const attNames = selectedAtts.map(a => a.nome).join(' + ') || 'Robô LED';
      const cName = prev.cliente_nome || (clientMode === 'EXISTING' && selectedClientId ? clients.find(c => c.id === selectedClientId)?.nome : '');

      let autoTitle = prev.nome_evento;
      if (!autoTitle || autoTitle.startsWith('Evento ') || autoTitle.includes(' - ') || autoTitle.startsWith('Apresentação')) {
        autoTitle = cName ? `${attNames} - ${cName}` : `${attNames}`;
      }

      return {
        ...prev,
        atracao_ids: newIds,
        valor_total: totalBase > 0 ? totalBase : prev.valor_total,
        nome_evento: autoTitle,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cName = clientMode === 'EXISTING' && selectedClientId
        ? clients.find(c => c.id === Number(selectedClientId))?.nome || formData.cliente_nome
        : formData.cliente_nome;

      const selectedAtts = attractions.filter(a => formData.atracao_ids.includes(a.id)).map(a => a.nome).join(' + ');
      const finalTitle = formData.nome_evento?.trim() || (cName ? `${selectedAtts || 'Robô LED'} - ${cName}` : `Apresentação ${formData.data}`);

      const payload: CreateEventDTO = {
        ...formData,
        cliente_id: clientMode === 'EXISTING' && selectedClientId ? Number(selectedClientId) : undefined,
        cliente_nome: cName || 'Cliente Particular',
        nome_evento: finalTitle,
        valor_total: Number(formData.valor_total) || 0,
        atracao_ids: formData.atracao_ids.length > 0 ? formData.atracao_ids : (attractions.length > 0 ? [attractions[0].id] : []),
      };

      if (editingEventId) {
        await api.updateEvent(editingEventId, payload as any);
        success('Evento Atualizado!', 'As informações e sincronização foram salvas com sucesso.');
      } else {
        await api.createEvent(payload);
        success(
          'Evento Agendado com Sucesso!',
          'Evento salvo no sistema e disponível na sua agenda em tempo real.'
        );
        // Reseta filtros para garantir visibilidade imediata
        setSelectedStatus('TODOS');
        setTypeCategory('TODOS');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      error('Erro ao salvar', err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await api.deleteEvent(id);
      success('Evento Excluído', 'O agendamento foi removido do banco e do Google Agenda.');
      loadData();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    }
  };

  const handleSyncGoogle = async (event: EventDetails) => {
    setSyncingGoogleId(event.id);
    try {
      const res = await api.syncGoogle(event.id);
      if (res.web_link) {
        window.open(res.web_link, '_blank');
      }
      success('Google Agenda', res.message || 'Evento sincronizado com sucesso na agenda roboledpartner@gmail.com!');
    } catch (err: any) {
      const webUrl = (event as any).google_calendar_link;
      if (webUrl) {
        window.open(webUrl, '_blank');
        info('Google Agenda', 'Abrindo link direto no Google Calendar...');
      } else {
        error('Erro ao sincronizar', err.message);
      }
    } finally {
      setSyncingGoogleId(null);
    }
  };

  const handleGenerateContract = async (event: EventDetails) => {
    if (onNavigateToNewContractWithEvent) {
      onNavigateToNewContractWithEvent(event);
      return;
    }

    setGeneratingContractId(event.id);
    try {
      const contract = await api.generateContractFromEvent(event.id);
      success('Contrato Gerado com Sucesso!', `Contrato Nº ${contract.numero} emitido e pronto em PDF.`);
      loadData();
    } catch (err: any) {
      error('Erro ao gerar contrato', err.message);
    } finally {
      setGeneratingContractId(null);
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'AGENDADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Agendado
          </span>
        );
      case 'CONFIRMADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Confirmado
          </span>
        );
      case 'EM_ANDAMENTO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3" /> Em Show
          </span>
        );
      case 'REALIZADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Realizado
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const filteredClients = clients.filter((c) => {
    if (!clientFilterQuery) return true;
    const q = clientFilterQuery.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      (c.telefone && c.telefone.includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner Notice */}
      <div className="card-glass rounded-2xl p-6 border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-dark-800 via-dark-800 to-purple-950/30 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2 flex-wrap">
              <span>Agenda & Gestão de Eventos</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                Google Calendar Sync
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Dashboards analíticos de ocupação, escala de Robôs de LED, controle de pista e sincronização de datas.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agendar Apresentação
        </button>
      </div>

      {/* Category Pills & View Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-dark-850/80 border border-slate-800 p-3 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setTypeCategory('SOCIAIS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              typeCategory === 'SOCIAIS'
                ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Festas Sociais (15 Anos, Casamentos...)
          </button>
          <button
            onClick={() => setTypeCategory('TODOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              typeCategory === 'TODOS'
                ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos os Eventos
          </button>
          <button
            onClick={() => setTypeCategory('CORPORATIVOS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              typeCategory === 'CORPORATIVOS'
                ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-600/30'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Corporativos & B2B
          </button>
        </div>

        {/* View Switcher (Dashboards vs Table vs Cards) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-dark-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('DASHBOARDS')}
              title="Dashboards e Inteligência de Eventos"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'DASHBOARDS'
                  ? 'bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboards</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              title="Visualização em Planilha (Tabela Compacta)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Planilha</span>
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              title="Visualização em Cards"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'CARDS'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium pl-2">
            Total: <strong className="text-white">{events.length}</strong>
          </div>
        </div>
      </div>

      {/* KPI Cards de Eventos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total de Apresentações</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {eventAnalytics.totalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{eventAnalytics.realizados} realizadas</span>
            <span className="text-emerald-400 font-bold">{eventAnalytics.confirmados} confirmadas</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Horas de Show em Pista</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-400">
            {eventAnalytics.totalHoras} hrs
          </div>
          <div className="text-[11px] text-brand-400/80 mt-1">
            Tempo acumulado de animação
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Faturamento Total</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrencyBRL(eventAnalytics.totalValor)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Ticket Médio: {formatCurrencyBRL(eventAnalytics.ticketMedio)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Cidades & Regiões</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {eventAnalytics.topCidades.length}+ Cidades
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            Grande SP, ABC, Litoral e Interior
          </div>
        </div>
      </div>

      {/* ==================== VISÃO 1: DASHBOARDS & ANALYTICS DE EVENTOS ==================== */}
      {viewMode === 'DASHBOARDS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Grid 1: Mix de Festas & Ocupação por Dia da Semana */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mix de Festas e Comemorações */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-pink-400" />
                Mix de Comemorações & Tipos de Festa
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Distribuição das apresentações por perfil de evento social e corporativo.
              </p>

              <div className="space-y-4">
                {eventAnalytics.partyTypes.map((item, idx) => {
                  const perc = eventAnalytics.totalValor > 0 ? (item.total / eventAnalytics.totalValor) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-bold flex items-center gap-1.5">
                          <span>{item.icon}</span> {item.label}
                        </span>
                        <span className="text-slate-300 font-mono">
                          {item.count} shows • <strong>{formatCurrencyBRL(item.total)}</strong> ({perc.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ocupação da Agenda por Dia da Semana */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Densidade de Apresentações por Dia da Semana
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Concentração de shows na pista (Picos nos Finais de Semana).
              </p>

              <div className="space-y-3">
                {eventAnalytics.weekdayMap.map((d, idx) => {
                  const maxCount = Math.max(...eventAnalytics.weekdayMap.map((w) => w.count), 1);
                  const perc = (d.count / maxCount) * 100;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-semibold ${d.isWeekend ? 'text-white' : 'text-slate-400'}`}>
                          {d.name} {d.isWeekend ? '🔥' : ''}
                        </span>
                        <span className="font-mono text-slate-300">
                          {d.count} eventos ({formatCurrencyBRL(d.total)})
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            d.isWeekend ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-700'
                          }`}
                          style={{ width: `${perc}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid 2: Status Operacional & Top Cidades Atendidas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Operacional */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Status Operacional da Agenda
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Acompanhamento dos shows realizados, confirmados e pendentes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-500/30 text-center">
                  <div className="text-xl font-black text-blue-400">{eventAnalytics.realizados}</div>
                  <div className="text-[11px] font-bold text-white mt-0.5">Realizados</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
                  <div className="text-xl font-black text-emerald-400">{eventAnalytics.confirmados}</div>
                  <div className="text-[11px] font-bold text-white mt-0.5">Confirmados</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center">
                  <div className="text-xl font-black text-amber-400">{eventAnalytics.agendados}</div>
                  <div className="text-[11px] font-bold text-white mt-0.5">Agendados</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 text-center">
                  <div className="text-xl font-black text-rose-400">{eventAnalytics.cancelados}</div>
                  <div className="text-[11px] font-bold text-white mt-0.5">Cancelados</div>
                </div>
              </div>
            </div>

            {/* Top Cidades Atendidas */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Principais Cidades & Praças Atendidas
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Cidades com maior volume de apresentações e shows contratados.
              </p>

              <div className="space-y-3">
                {eventAnalytics.topCidades.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{c.cidade}</div>
                        <div className="text-[10px] text-slate-500">{c.count} apresentações</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-white">{formatCurrencyBRL(c.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter Sub-Tabs for List & Table */}
      {viewMode !== 'DASHBOARDS' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['TODOS', 'AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'REALIZADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedStatus === st
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-dark-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st === 'TODOS' ? 'Todos os Status' : st}
            </button>
          ))}
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-3" />
          <p className="text-sm">Carregando eventos e agenda...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-dark-850/60 border border-slate-800">
          <CalendarDays className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum evento encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `Nenhum resultado para "${searchQuery}". Tente outro termo.`
              : 'Clique no botão acima para agendar um novo show ou apresentação de robô LED.'}
          </p>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* ==================== SPREADSHEET / TABLE VIEW ==================== */
        <div className="bg-dark-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-dark-900 text-[11px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Evento / Tipo</th>
                  <th className="py-3 px-4">Cliente & Contato</th>
                  <th className="py-3 px-4">Local / Buffet</th>
                  <th className="py-3 px-4">Atração</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Contrato</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {events.map((event) => {
                  const hasContract = Boolean(event.contrato_id || event.contrato?.id);
                  const contractNum = event.contrato?.numero || `ID #${event.contrato_id}`;

                  return (
                    <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono">
                        <div className="font-bold text-white">{event.data.split('-').reverse().join('/')}</div>
                        <div className="text-slate-500 text-[11px]">{event.horario} ({event.duracao}h)</div>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">
                        <div className="truncate max-w-[180px]">{event.nome_evento || `Festa de ${event.cliente?.nome}`}</div>
                        <span className="text-[10px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 inline-block mt-0.5">
                          {event.tipo_evento || 'FESTA'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-200">{event.cliente?.nome || '—'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{event.cliente?.telefone || '—'}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="truncate max-w-[160px] text-slate-300" title={event.endereco}>
                          {event.endereco || '—'}
                        </div>
                        <div className="text-[10px] text-slate-500">{event.cidade} - {event.estado}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        {event.atracoes && event.atracoes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[140px]">
                            {event.atracoes.map((a) => (
                              <span key={a.id} className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/20 font-bold truncate">
                                {a.nome}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Robô LED Padrão</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-400 font-mono text-xs">
                        {formatCurrencyBRL(event.valor_total)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {hasContract ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {contractNum}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleGenerateContract(event)}
                            disabled={generatingContractId === event.id}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-600/20 text-brand-300 hover:bg-brand-600 hover:text-white border border-brand-500/30 transition-all flex items-center gap-1 mx-auto"
                            title="Gerar contrato a partir deste evento"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            {generatingContractId === event.id ? 'Gerando...' : 'Gerar'}
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSyncGoogle(event)}
                            disabled={syncingGoogleId === event.id}
                            className="p-1 rounded bg-slate-800 text-purple-400 hover:bg-purple-900/50 hover:text-white transition-all"
                            title="Sincronizar / Abrir no Google Agenda"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(event)}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                            title="Editar Evento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-900/50 hover:text-white transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'CARDS' ? (
        /* ==================== CARD GRID VIEW ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
          {events.map((event) => {
            const hasContract = Boolean(event.contrato_id || event.contrato?.id);
            const contractNum = event.contrato?.numero || `ID #${event.contrato_id}`;

            return (
              <div
                key={event.id}
                className="card-glass rounded-2xl p-5 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-dark-900 text-brand-400 border border-brand-500/20">
                      {event.data.split('-').reverse().join('/')} às {event.horario}
                    </span>
                    {getStatusBadge(event.status)}
                  </div>

                  <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-brand-300 transition-colors">
                    {event.nome_evento || `Apresentação ${event.cliente?.nome}`}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-200 font-semibold">{event.cliente?.nome || '—'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{event.endereco ? `${event.endereco}, ${event.cidade}` : `${event.cidade} - ${event.estado}`}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{event.duracao} hora(s) de apresentação</span>
                    </div>
                  </div>

                  {event.atracoes && event.atracoes.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {event.atracoes.map((att) => (
                        <span key={att.id} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
                          {att.nome}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                        Robô LED Neon
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Valor Acordado</span>
                    <span className="font-bold text-emerald-400 text-sm">{formatCurrencyBRL(event.valor_total)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSyncGoogle(event)}
                      disabled={syncingGoogleId === event.id}
                      className="p-2 rounded-xl bg-dark-900 border border-slate-800 text-purple-400 hover:text-white hover:bg-purple-600 transition-colors"
                      title="Sincronizar no Google Agenda"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>

                    {!hasContract ? (
                      <button
                        onClick={() => handleGenerateContract(event)}
                        disabled={generatingContractId === event.id}
                        className="p-2 rounded-xl bg-dark-900 border border-slate-800 text-brand-400 hover:text-white hover:bg-brand-600 transition-colors"
                        title="Gerar Contrato"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {contractNum}
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(event)}
                      className="p-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 rounded-xl bg-dark-900 border border-slate-800 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Modal Agendar / Editar Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-glass border border-purple-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-400" />
                {editingEventId ? 'Editar Evento / Apresentação' : 'Agendar Nova Apresentação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Cliente do Evento *
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setClientMode('EXISTING')}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                      clientMode === 'EXISTING'
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-dark-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Selecionar Cadastrado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode('NEW');
                      setSelectedClientId('');
                    }}
                    className={`text-xs px-3 py-1 rounded-lg border font-medium transition-all ${
                      clientMode === 'NEW'
                        ? 'bg-brand-600 text-white border-brand-500'
                        : 'bg-dark-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Cadastrar Novo no Agendamento
                  </button>
                </div>

                {clientMode === 'EXISTING' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Filtrar por nome, CPF ou fone..."
                      value={clientFilterQuery}
                      onChange={(e) => setClientFilterQuery(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClient(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white font-medium focus:outline-none focus:border-brand-500"
                      required
                    >
                      <option value="">-- Selecione o Cliente --</option>
                      {filteredClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.cpf ? `CPF: ${c.cpf}` : 'Sem CPF'}) {c.telefone ? `- ${c.telefone}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-dark-800/60 border border-slate-700">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Matheus Chiccae ou Juliana Paes"
                        value={formData.cliente_nome}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => {
                            const selectedAtts = attractions.filter(a => prev.atracao_ids.includes(a.id)).map(a => a.nome).join(' + ') || 'Robô LED';
                            const autoTitle = val ? `${selectedAtts} - ${val}` : '';
                            return {
                              ...prev,
                              cliente_nome: val,
                              nome_evento: prev.nome_evento && !prev.nome_evento.startsWith('Evento ') && !prev.nome_evento.startsWith('Apresentação') && !prev.nome_evento.includes(' - ')
                                ? prev.nome_evento
                                : autoTitle,
                            };
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">CPF / Documento *</label>
                      <input
                        type="text"
                        required
                        value={formData.cliente_cpf}
                        onChange={(e) => setFormData({ ...formData, cliente_cpf: maskCPFInput(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Telefone / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={formData.cliente_telefone}
                        onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">E-mail</label>
                      <input
                        type="email"
                        value={formData.cliente_email}
                        onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-dark-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Informações do Evento */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Título do Evento / Identificação *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Casamento Beatriz & Lucas ou Festa 15 Anos"
                      value={formData.nome_evento}
                      onChange={(e) => setFormData({ ...formData, nome_evento: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Tipo de Evento</label>
                    <select
                      value={formData.tipo_evento}
                      onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="ANIVERSARIO">Aniversário Adulto</option>
                      <option value="INFANTIL">Aniversário Infantil</option>
                      <option value="DEBUTANTE">15 Anos / Debutante</option>
                      <option value="CASAMENTO">Casamento / Bodas</option>
                      <option value="CORPORATIVO">Evento Corporativo</option>
                      <option value="FORMATURA">Formatura</option>
                      <option value="OUTRO">Outro Tipo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Data *</label>
                    <input
                      type="date"
                      required
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Horário de Início *</label>
                    <input
                      type="time"
                      required
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Duração (Horas)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duracao}
                      onChange={(e) => setFormData({ ...formData, duracao: parseFloat(e.target.value) || 2 })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Endereço / Buffet</label>
                    <input
                      type="text"
                      placeholder="Ex: Buffet Villa Kids, Av. Kennedy, 500"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Cidade</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Atrações */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
                  Atrações & Personagens Escalados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attractions.map((att) => {
                    const isSelected = formData.atracao_ids.includes(att.id);
                    return (
                      <div
                        key={att.id}
                        onClick={() => toggleAttraction(att.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-600/20 border-brand-500 text-white'
                            : 'bg-dark-800 border-slate-700/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{att.nome}</div>
                          <div className="text-[10px] text-slate-400">
                            Base: R$ {att.valor_base.toFixed(2)} • {att.categoria}
                          </div>
                        </div>
                        <input type="checkbox" checked={isSelected} readOnly className="rounded text-brand-600" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financeiro e Status */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Valor Total Negociado (R$)</label>
                  <input
                    type="number"
                    value={formData.valor_total}
                    onChange={(e) => setFormData({ ...formData, valor_total: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-emerald-400 font-bold focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gera automaticamente Sinal de 40% (R$ {((formData.valor_total || 0) * 0.4).toFixed(2)}) e Saldo de 60% (R$ {((formData.valor_total || 0) * 0.6).toFixed(2)}).
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Status do Evento</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="AGENDADO">Agendado (Aguardando Sinal)</option>
                    <option value="CONFIRMADO">Confirmado (Sinal Pago / Contratado)</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="REALIZADO">Realizado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Botões */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-brand-600/30"
                >
                  {editingEventId ? 'Salvar Alterações' : 'Salvar & Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
