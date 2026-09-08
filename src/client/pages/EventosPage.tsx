import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '../api/index.js';
import { EventDetails, EventStatus, Attraction, CreateEventDTO, Client } from '../../types/index.js';
import { useToast } from '../context/ToastContext.js';
import { maskCPFInput, cleanCPF, isValidCPF, formatCPF } from '../../domain/cpf.js';

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
  }, [selectedStatus, searchQuery]);

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

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setSelectedClientId('');
    setClientMode(clients.length > 0 ? 'EXISTING' : 'NEW');
    setClientFilterQuery('');
    setFormData({
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
    setShowModal(true);
  };

  const handleOpenEditModal = (event: EventDetails) => {
    setEditingEventId(event.id);
    setSelectedClientId(event.cliente_id || '');
    setClientMode('EXISTING');
    setClientFilterQuery('');
    setFormData({
      cliente_nome: event.cliente?.nome || '',
      cliente_cpf: event.cliente?.cpf || '',
      cliente_telefone: event.cliente?.telefone || '',
      cliente_email: event.cliente?.email || '',
      nome_evento: event.nome_evento || '',
      tipo_evento: event.tipo_evento || 'ANIVERSARIO',
      data: event.data,
      horario: event.horario,
      duracao: event.duracao,
      endereco: event.endereco,
      cidade: event.cidade || 'São Bernardo do Campo',
      estado: event.estado || 'SP',
      status: event.status,
      valor_total: event.valor_total,
      observacoes: event.observacoes || '',
      atracao_ids: event.atracoes?.map((a) => a.atracao_id) || [],
    });
    setShowModal(true);
  };

  const handleSelectExistingClient = (cId: number | '') => {
    setSelectedClientId(cId);
    if (!cId) return;

    const selected = clients.find((c) => c.id === Number(cId));
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        cliente_nome: selected.nome,
        cliente_cpf: selected.cpf,
        cliente_telefone: selected.telefone || prev.cliente_telefone,
        cliente_email: selected.email || prev.cliente_email,
        endereco: prev.endereco || selected.endereco || '',
      }));
      success('Cliente Selecionado', `Dados de ${selected.nome} preenchidos automaticamente.`);
    }
  };

  const handleCpfChange = (val: string) => {
    const masked = maskCPFInput(val);
    setFormData((prev) => ({ ...prev, cliente_cpf: masked }));

    // Tenta encontrar cliente existente pelo CPF digitado
    const cleaned = cleanCPF(masked);
    if (cleaned.length === 11 || cleaned.length === 14) {
      const match = clients.find((c) => cleanCPF(c.cpf) === cleaned);
      if (match) {
        setSelectedClientId(match.id);
        setFormData((prev) => ({
          ...prev,
          cliente_nome: match.nome,
          cliente_telefone: match.telefone || prev.cliente_telefone,
          cliente_email: match.email || prev.cliente_email,
          endereco: prev.endereco || match.endereco || '',
        }));
        info('Cliente Reconhecido', `Localizado cadastro existente de: ${match.nome}`);
      }
    }
  };

  const toggleAttraction = (id: number) => {
    setFormData((prev) => {
      const exists = prev.atracao_ids.includes(id);
      const newIds = exists ? prev.atracao_ids.filter((item) => item !== id) : [...prev.atracao_ids, id];

      // Auto-recalcula valor sugerido se estiver adicionando
      const totalBase = newIds.reduce((sum, attId) => {
        const att = attractions.find((a) => a.id === attId);
        return sum + (att?.valor_base || 0);
      }, 0);

      return {
        ...prev,
        atracao_ids: newIds,
        valor_total: totalBase > 0 ? totalBase : prev.valor_total,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        await api.updateEvent(editingEventId, formData as any);
        success('Evento Atualizado!', 'As informações e sincronização com o Google Agenda foram atualizadas.');
      } else {
        await api.createEvent(formData as CreateEventDTO);
        success(
          'Evento Agendado com Sucesso!',
          'Evento salvo no sistema e sincronizado com a agenda Google Agenda.'
        );
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
      success('Google Agenda', res.message || 'Evento sincronizado com sucesso na agenda Google Agenda!');
    } catch (err: any) {
      // Fallback para link direto
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Banner Notice */}
      <div className="card-glass rounded-2xl p-4 sm:p-5 border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
              <span>Agenda de Apresentações</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                Google Calendar
              </span>
            </h4>
            <p className="text-slate-400 mt-1">
              Gerencie a escala dos Robôs de LED e Personagens, sincronize a agenda e gere contratos em 1 clique.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Agendar Apresentação
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {['TODOS', 'AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'REALIZADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedStatus === st
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {st === 'TODOS' ? 'Todos os Eventos' : st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total: <strong className="text-white">{events.length}</strong> evento(s)
        </div>
      </div>

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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => {
            const hasContract = Boolean(event.contrato_id || event.contrato?.id);
            const contractNum = event.contrato?.numero || `ID #${event.contrato_id}`;

            return (
              <div
                key={event.id}
                className="bg-dark-850 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-400 transition-colors">
                        {event.nome_evento || `Evento de ${event.cliente?.nome}`}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{event.cliente?.nome || 'Cliente não identificado'}</span>
                      </div>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>

                  {/* Event Details Grid */}
                  <div className="space-y-2 py-3 border-y border-slate-800/60 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" /> Data:
                      </span>
                      <span className="font-semibold text-white">
                        {event.data.split('-').reverse().join('/')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-brand-400" /> Horário:
                      </span>
                      <span>
                        {event.horario} às {event.horario_termino || '22:00'} ({event.duracao}h)
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-slate-300 gap-2">
                      <span className="flex items-center gap-1.5 text-slate-400 shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-brand-400" /> Local:
                      </span>
                      <span className="text-right text-slate-300 truncate" title={event.endereco}>
                        {event.endereco}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Valor Total:
                      </span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        R$ {event.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Attractions Badges */}
                  {event.atracoes && event.atracoes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {event.atracoes.map((ea) => (
                        <span
                          key={ea.id}
                          className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-medium flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          {ea.atracao?.nome || 'Atração'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Botão Google Agenda */}
                    <button
                      onClick={() => handleSyncGoogle(event)}
                      disabled={syncingGoogleId === event.id}
                      className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-lg transition-colors flex items-center gap-1"
                      title="Abrir / Sincronizar com Google Agenda (Google Agenda)"
                    >
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-[10px] font-bold hidden sm:inline">Google</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(event)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar Evento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {hasContract ? (
                    <a
                      href={api.getContractPdfUrl(event.contrato?.id || event.contrato_id!)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {contractNum}
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleGenerateContract(event)}
                      disabled={generatingContractId === event.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-bold shadow-sm shadow-brand-600/25 transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {generatingContractId === event.id ? 'Gerando...' : 'Gerar Contrato'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agendar / Editar Evento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingEventId ? 'Editar Evento' : 'Agendar Novo Evento'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre os dados da festa, cliente e atrações contratadas.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Google Calendar Notice */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2.5 text-xs text-purple-300">
                <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>Google Agenda Ativo:</strong> Este evento será sincronizado na conta <code>Google Agenda</code>.
                </span>
              </div>

              {/* SEÇÃO DADOS DO CLIENTE COM SELETOR DE CLIENTE EXISTENTE */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Dados do Cliente
                  </h4>

                  {/* Toggle entre Cliente Cadastrado e Novo Cliente */}
                  {clients.length > 0 && !editingEventId && (
                    <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-xl border border-slate-750">
                      <button
                        type="button"
                        onClick={() => setClientMode('EXISTING')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          clientMode === 'EXISTING'
                            ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-600/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Cliente Cadastrado ({clients.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode('NEW');
                          setSelectedClientId('');
                          setFormData((prev) => ({
                            ...prev,
                            cliente_nome: '',
                            cliente_cpf: '',
                            cliente_telefone: '',
                            cliente_email: '',
                          }));
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          clientMode === 'NEW'
                            ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-600/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Novo Cliente
                      </button>
                    </div>
                  )}
                </div>

                {/* Seleção de Cliente da Base Cadastrada */}
                {clientMode === 'EXISTING' && clients.length > 0 && !editingEventId && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-brand-950/40 to-purple-950/20 border border-brand-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-brand-300 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-brand-400" /> Selecione o cliente salvo na base:
                      </label>
                      {selectedClientId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId('');
                            setFormData((prev) => ({
                              ...prev,
                              cliente_nome: '',
                              cliente_cpf: '',
                              cliente_telefone: '',
                              cliente_email: '',
                            }));
                          }}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Limpar seleção
                        </button>
                      )}
                    </div>

                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectExistingClient(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500 font-medium"
                    >
                      <option value="">-- Clique aqui para escolher um cliente existente --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} • CPF/CNPJ: {c.cpf} {c.telefone ? `• ${c.telefone}` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedClientId ? (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[11px] text-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          Dados de <strong>{formData.cliente_nome}</strong> vinculados ao evento!
                        </span>
                        <span className="text-[10px] text-emerald-400/80">Recontratação / Festa repetida</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Dica: Escolha um cliente acima para não precisar digitar o nome, CPF e telefone novamente.
                      </p>
                    )}
                  </div>
                )}

                {/* Campos com os dados do cliente (auto-preenchidos ou editáveis) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={formData.cliente_nome}
                      onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
                      placeholder="Ex: Roberto Silva"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">CPF / CNPJ *</label>
                    <input
                      type="text"
                      required
                      value={formData.cliente_cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.cliente_telefone}
                      onChange={(e) => setFormData({ ...formData, cliente_telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.cliente_email}
                      onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Evento */}
              <div className="pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">
                  Dados do Evento & Local
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Data do Show *</label>
                    <input
                      type="date"
                      required
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Horário Início *</label>
                    <input
                      type="time"
                      required
                      value={formData.horario}
                      onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 font-medium mb-1">Duração (horas)</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-300 font-medium mb-1">Endereço / Buffet *</label>
                    <input
                      type="text"
                      required
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      placeholder="Ex: Buffet Estrela Encantada - Av. Paulista, 1000"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
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
                    Gera automaticamente Sinal de 40% (R${' '}
                    {((formData.valor_total || 0) * 0.4).toFixed(2)}) e Saldo de 60% (R${' '}
                    {((formData.valor_total || 0) * 0.6).toFixed(2)}).
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
