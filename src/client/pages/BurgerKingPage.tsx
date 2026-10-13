import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Camera,
  Paperclip,
  Upload,
  Image as ImageIcon,
  Download,
  Eye,
  Maximize2,
} from 'lucide-react';
import { api } from '../api/index.js';
import {
  EventDetails,
  EventStatus,
  Attraction,
  CreateEventDTO,
  B2BChannel,
  PaymentMethod,
  EventAttachment,
} from '../../types/index.js';
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
  const [activeTab, setActiveTab] = useState<'FILA' | 'TABELA' | 'LOJAS'>('LOJAS');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterCanal, setFilterCanal] = useState<string>('TODOS');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('TODOS');

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDetails | null>(null);
  const [settlingEntryId, setSettlingEntryId] = useState<number | null>(null);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('PIX');

  // Modal de Detalhes da Loja & Anexos
  const [selectedLojaName, setSelectedLojaName] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  // Upload States
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const storePhotoInputRef = useRef<HTMLInputElement>(null);
  const storeAttachmentInputRef = useRef<HTMLInputElement>(null);

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
    foto_loja_url: '',
    anexos: [] as EventAttachment[],
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
        aReceberTotal += evt.valor_total || 0;
      } else {
        fins.forEach((fin) => {
          if (fin.status === 'PAGO') {
            recebidoTotal += fin.valor;
          } else {
            aReceberTotal += fin.valor;
            const venc = new Date(fin.data_vencimento + 'T12:00:00');
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
      totalEventos: events.length,
    };
  }, [events]);

  // Filtro de Eventos
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const q = (search || searchQuery).toLowerCase().trim();
      const matchSearch =
        !q ||
        (evt.loja_unidade && evt.loja_unidade.toLowerCase().includes(q)) ||
        (evt.nome_evento && evt.nome_evento.toLowerCase().includes(q)) ||
        (evt.endereco && evt.endereco.toLowerCase().includes(q)) ||
        (evt.nota_fiscal_ref && evt.nota_fiscal_ref.toLowerCase().includes(q));

      const matchCanal =
        filterCanal === 'TODOS' || evt.canal_b2b === filterCanal;

      let matchPayment = true;
      const fins = evt.financeiro || [];
      const hasPending = fins.some((f) => f.status === 'PENDENTE' || f.status === 'ATRASADO');
      const hasPaid = fins.some((f) => f.status === 'PAGO');

      if (filterPaymentStatus === 'PAGO') {
        matchPayment = fins.length > 0 && !hasPending && hasPaid;
      } else if (filterPaymentStatus === 'PENDENTE') {
        matchPayment = fins.length === 0 || hasPending;
      } else if (filterPaymentStatus === 'ATRASADO') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchPayment = fins.some(
          (f) => f.status === 'ATRASADO' || (f.status === 'PENDENTE' && f.data_vencimento < todayStr)
        );
      }

      return matchSearch && matchCanal && matchPayment;
    });
  }, [events, search, searchQuery, filterCanal, filterPaymentStatus]);

  // Agrupamento por Loja
  const lojaGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        count: number;
        canal: string;
        foto_loja_url?: string;
        anexos: EventAttachment[];
        events: EventDetails[];
      }
    >();

    events.forEach((evt) => {
      const nomeLoja = evt.loja_unidade || evt.endereco || 'Loja Burger King';
      const existing = map.get(nomeLoja) || {
        total: 0,
        count: 0,
        canal: evt.canal_b2b || 'DIRETO_BK',
        foto_loja_url: undefined,
        anexos: [],
        events: [],
      };

      existing.total += evt.valor_total || 0;
      existing.count += 1;
      if (!existing.foto_loja_url && evt.foto_loja_url) {
        existing.foto_loja_url = evt.foto_loja_url;
      }
      if (evt.anexos && Array.isArray(evt.anexos)) {
        evt.anexos.forEach((att) => {
          if (!existing.anexos.some((x) => x.url === att.url)) {
            existing.anexos.push(att);
          }
        });
      }
      existing.events.push(evt);
      map.set(nomeLoja, existing);
    });

    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [events]);

  // Agrupamento da Fila de Recebíveis por Prazo
  const agingBuckets = useMemo(() => {
    const now = new Date();
    const upTo30: { event: EventDetails; diasRestantes: number }[] = [];
    const from31To60: { event: EventDetails; diasRestantes: number }[] = [];
    const from61To90: { event: EventDetails; diasRestantes: number }[] = [];
    const overdue: { event: EventDetails; diasAtraso: number }[] = [];

    filteredEvents.forEach((evt) => {
      const fins = evt.financeiro || [];
      const isPaid = fins.length > 0 && fins.every((f) => f.status === 'PAGO');

      if (!isPaid) {
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

  // Helper para Upload de Arquivo
  const handleFileUpload = async (
    file: File,
    tipo: EventAttachment['tipo'] = 'FOTO_LOJA'
  ): Promise<EventAttachment> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const uploadRes = await api.uploadFile({
            filename: file.name,
            dataUrl: base64Data,
          });

          const attachment: EventAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            nome: file.name,
            url: uploadRes.url,
            tipo,
            tamanho: file.size,
            data_upload: new Date().toISOString(),
          };
          resolve(attachment);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleOpenCreate = () => {
    setEditingEvent(null);
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
      foto_loja_url: '',
      anexos: [],
      atracao_ids: attractions.length > 0 ? [attractions[0].id] : [],
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (evt: EventDetails) => {
    setEditingEvent(evt);
    setFormData({
      loja_unidade: evt.loja_unidade || '',
      canal_b2b: evt.canal_b2b || 'DIRETO_BK',
      data: evt.data,
      horario: evt.horario,
      duracao: evt.duracao || 2,
      endereco: evt.endereco || '',
      cidade: evt.cidade || 'São Paulo',
      estado: evt.estado || 'SP',
      valor_total: evt.valor_total || 500,
      prazo_pagamento_dias: evt.prazo_pagamento_dias || 60,
      nota_fiscal_ref: evt.nota_fiscal_ref || '',
      observacoes: evt.observacoes || '',
      foto_loja_url: evt.foto_loja_url || '',
      anexos: evt.anexos || [],
      atracao_ids: evt.atracoes && evt.atracoes.length > 0
        ? evt.atracoes.map((a) => a.atracao_id)
        : (attractions.length > 0 ? [attractions[0].id] : []),
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
        nota_fiscal_ref: formData.nota_fiscal_ref.trim() || undefined,
        observacoes: formData.observacoes.trim() || undefined,
        foto_loja_url: formData.foto_loja_url.trim() || undefined,
        anexos: formData.anexos,
        atracao_ids: formData.atracao_ids,
        status: 'CONFIRMADO',
      };

      if (editingEvent) {
        await api.updateEvent(editingEvent.id, payload);
        success('Evento atualizado', `Evento da loja ${formData.loja_unidade} foi atualizado com sucesso!`);
      } else {
        await api.createEvent(payload);
        success('Apresentação agendada', `Show Burger King em ${formData.loja_unidade} cadastrado com sucesso!`);
      }

      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar apresentação.');
    }
  };

  const handleDeleteEvent = async (id: number, nome: string) => {
    if (confirm(`Deseja realmente remover o evento "${nome}"?`)) {
      try {
        await api.deleteEvent(id);
        success('Evento removido', 'O registro foi excluído com sucesso.');
        loadData();
      } catch (err: any) {
        error(err.message || 'Erro ao excluir evento.');
      }
    }
  };

  const handleSettlePayment = async (entryId: number) => {
    try {
      await api.settleFinancialEntry(entryId, {
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: settleMethod,
      });
      success('Pagamento confirmado', 'Recebimento baixado com sucesso!');
      setSettlingEntryId(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao registrar baixa de pagamento.');
    }
  };

  const getCanalBadge = (canal?: B2BChannel) => {
    switch (canal) {
      case 'DIRETO_BK':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            🍔 Direto BK
          </span>
        );
      case 'REI_DOS_ADESIVOS':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            🏷️ Rei dos Adesivos
          </span>
        );
      case 'OG_GRAFICA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
            🖨️ OG Gráfica
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            🏢 Outro B2B
          </span>
        );
    }
  };

  // Detalhes da loja selecionada
  const selectedLojaData = useMemo(() => {
    if (!selectedLojaName) return null;
    const found = lojaGroups.find(([nome]) => nome === selectedLojaName);
    if (!found) return null;
    return {
      nome: found[0],
      ...found[1],
    };
  }, [selectedLojaName, lojaGroups]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Lightbox / Zoom da Imagem */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImageUrl}
              alt="Visualização ampliada"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}

      {/* Top Banner Burger King B2B */}
      <div className="rounded-3xl p-6 sm:p-8 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-clean-md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-white/20 text-white backdrop-blur-md shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-white text-lg sm:text-xl flex items-center gap-2 flex-wrap">
              <span>Burger King & Faturamento B2B</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold font-mono backdrop-blur-md">
                Recebíveis • Lojas • Anexos
              </span>
            </h4>
            <p className="text-xs text-amber-100 mt-1 max-w-xl">
              Painel exclusivo para controle de lojas, fotos de fachada, ordens de serviço, comprovantes e fila de recebíveis.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-amber-50 text-slate-900 font-bold text-xs tracking-wide shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4 text-amber-600" />
          Novo Evento BK Express
        </button>
      </div>

      {/* KPIs & Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Faturamento Total BK</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatCurrencyBRL(metrics.faturadoTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
            <span>{metrics.totalEventos} apresentações</span>
            <span className="text-amber-700 font-bold">{metrics.totalLojas} lojas</span>
          </div>
        </div>

        {/* Total Recebido */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recebido</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {formatCurrencyBRL(metrics.recebidoTotal)}
          </div>
          <div className="text-[11px] text-emerald-600/90 mt-1 font-semibold">
            Recebimento liquidado em conta
          </div>
        </div>

        {/* A Receber (Fila B2B) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">A Receber (Fila 30-90D)</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-600 font-mono">
            {formatCurrencyBRL(metrics.aReceberTotal)}
          </div>
          <div className="text-[11px] text-sky-600/90 mt-1 font-semibold">
            Fluxo programado de repasses BK
          </div>
        </div>

        {/* Em Atraso (>Prazo) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-clean hover:shadow-clean-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vencidos / Cobrança</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {formatCurrencyBRL(metrics.atrasadoTotal)}
          </div>
          <div className="text-[11px] text-rose-600/90 mt-1 font-semibold">
            {metrics.atrasadoTotal > 0 ? 'Aguardando repasse da matriz/agência' : 'Nenhum valor em atraso'}
          </div>
        </div>
      </div>

      {/* Sub-Aba Switcher & Filtros */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-3 rounded-2xl shadow-clean">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('LOJAS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LOJAS'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Store className="w-4 h-4" />
            Consolidado por Loja ({lojaGroups.length})
          </button>
          <button
            onClick={() => setActiveTab('FILA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'FILA'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Fila de Recebíveis (Aging)
          </button>
          <button
            onClick={() => setActiveTab('TABELA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TABELA'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-dark-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Planilha Completa ({filteredEvents.length})
          </button>
        </div>

        {/* Filtros de Canal e Pagamento */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterCanal}
            onChange={(e) => setFilterCanal(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos os Canais</option>
            <option value="DIRETO_BK">🍔 Direto BK</option>
            <option value="REI_DOS_ADESIVOS">🏷️ Rei dos Adesivos</option>
            <option value="OG_GRAFICA">🖨️ OG Gráfica</option>
            <option value="OUTRO_B2B">🏢 Outro B2B</option>
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-dark-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="TODOS">Todos os Pagamentos</option>
            <option value="PENDENTE">⏳ A Receber</option>
            <option value="PAGO">✅ Pagos</option>
            <option value="ATRASADO">⚠️ Em Atraso</option>
          </select>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto animate-spin text-amber-500 mb-3" />
          <p className="text-sm">Carregando dados e fotos das lojas Burger King...</p>
        </div>
      ) : activeTab === 'LOJAS' ? (
        /* ==================== CONSOLIDADO POR LOJA COM FOTOS E ANEXOS ==================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" />
              Lojas & Unidades Burger King ({lojaGroups.length})
            </h3>
            <span className="text-xs text-slate-500">
              Clique em qualquer loja para gerenciar a foto da fachada, anexos ou visualizar o histórico.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lojaGroups.map(([nomeLoja, info]) => {
              const hasPhoto = Boolean(info.foto_loja_url);
              const attachmentsCount = info.anexos.length;

              return (
                <div
                  key={nomeLoja}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all shadow-xl group flex flex-col justify-between"
                >
                  {/* Banner / Foto da Fachada */}
                  <div className="relative h-40 bg-neutral-950 overflow-hidden border-b border-neutral-800">
                    {hasPhoto ? (
                      <>
                        <img
                          src={info.foto_loja_url}
                          alt={nomeLoja}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                          onClick={() => setLightboxImageUrl(info.foto_loja_url!)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
                        <button
                          onClick={() => setLightboxImageUrl(info.foto_loja_url!)}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white backdrop-blur-sm"
                          title="Ampliar foto da loja"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-amber-950/20 text-neutral-500">
                        <Store className="w-10 h-10 text-neutral-700 mb-2 group-hover:text-amber-500/60 transition-colors" />
                        <span className="text-[11px] text-neutral-400 font-medium">Sem foto da fachada</span>
                        <button
                          onClick={() => setSelectedLojaName(nomeLoja)}
                          className="mt-2 text-[10px] text-amber-400 hover:text-amber-300 font-bold underline"
                        >
                          + Adicionar Foto da Loja
                        </button>
                      </div>
                    )}

                    {/* Badge do Canal sobre o Banner */}
                    <div className="absolute bottom-3 left-3">
                      {getCanalBadge(info.canal as B2BChannel)}
                    </div>

                    {/* Badge de Anexos */}
                    {attachmentsCount > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {attachmentsCount} anexo{attachmentsCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug group-hover:text-amber-400 transition-colors">
                        {nomeLoja}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {info.count} apresentação{info.count > 1 ? 'ões' : ''} realizada{info.count > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400">Total Faturado:</span>
                        <span className="font-black text-amber-400 text-base">
                          {formatCurrencyBRL(info.total)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span>Ticket Médio por Show:</span>
                        <span className="font-semibold text-neutral-200">
                          {formatCurrencyBRL(info.total / info.count)}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <button
                      onClick={() => setSelectedLojaName(nomeLoja)}
                      className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-neutral-700/60 transition-all hover:border-amber-500/40"
                    >
                      <Camera className="w-4 h-4 text-amber-400" />
                      Gerenciar Fotos & Anexos ({attachmentsCount})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'FILA' ? (
        /* ==================== FILA DE RECEBÍVEIS (AGING BUCKETS) ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overdue */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Vencidos ({agingBuckets.overdue.length})
              </span>
              <span className="text-xs font-bold text-rose-300">
                {formatCurrencyBRL(agingBuckets.overdue.reduce((acc, curr) => acc + (curr.event.valor_total || 0), 0))}
              </span>
            </div>
            <div className="space-y-2.5">
              {agingBuckets.overdue.map(({ event: evt, diasAtraso }) => (
                <div key={evt.id} className="p-4 rounded-xl bg-neutral-900 border border-rose-500/40 space-y-2.5 shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {evt.foto_loja_url && (
                        <img
                          src={evt.foto_loja_url}
                          alt="Loja"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 cursor-pointer"
                          onClick={() => setLightboxImageUrl(evt.foto_loja_url!)}
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-white text-xs">{evt.loja_unidade || evt.nome_evento}</h4>
                        <p className="text-[11px] text-slate-400">{evt.data.split('-').reverse().join('/')}</p>
                      </div>
                    </div>
                    {getCanalBadge(evt.canal_b2b)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-rose-400 font-bold">{diasAtraso} dias em atraso</span>
                    <span className="font-black text-white">{formatCurrencyBRL(evt.valor_total)}</span>
                  </div>
                  {evt.financeiro && evt.financeiro.length > 0 && evt.financeiro[0].status !== 'PAGO' && (
                    <button
                      onClick={() => setSettlingEntryId(evt.financeiro![0].id)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Baixar Pagamento
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Up to 30 days */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Até 30 Dias ({agingBuckets.upTo30.length})
              </span>
              <span className="text-xs font-bold text-emerald-300">
                {formatCurrencyBRL(agingBuckets.upTo30.reduce((acc, curr) => acc + (curr.event.valor_total || 0), 0))}
              </span>
            </div>
            <div className="space-y-2.5">
              {agingBuckets.upTo30.map(({ event: evt, diasRestantes }) => (
                <div key={evt.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {evt.foto_loja_url && (
                        <img
                          src={evt.foto_loja_url}
                          alt="Loja"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 cursor-pointer"
                          onClick={() => setLightboxImageUrl(evt.foto_loja_url!)}
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-white text-xs">{evt.loja_unidade || evt.nome_evento}</h4>
                        <p className="text-[11px] text-slate-400">{evt.data.split('-').reverse().join('/')}</p>
                      </div>
                    </div>
                    {getCanalBadge(evt.canal_b2b)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-emerald-400 font-semibold">{diasRestantes} dias restantes</span>
                    <span className="font-black text-white">{formatCurrencyBRL(evt.valor_total)}</span>
                  </div>
                  {evt.financeiro && evt.financeiro.length > 0 && evt.financeiro[0].status !== 'PAGO' && (
                    <button
                      onClick={() => setSettlingEntryId(evt.financeiro![0].id)}
                      className="w-full py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" /> Baixar Pagamento
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 31 to 60 days */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 31 a 60 Dias ({agingBuckets.from31To60.length})
              </span>
              <span className="text-xs font-bold text-amber-300">
                {formatCurrencyBRL(agingBuckets.from31To60.reduce((acc, curr) => acc + (curr.event.valor_total || 0), 0))}
              </span>
            </div>
            <div className="space-y-2.5">
              {agingBuckets.from31To60.map(({ event: evt, diasRestantes }) => (
                <div key={evt.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/30 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{evt.loja_unidade || evt.nome_evento}</h4>
                      <p className="text-[11px] text-slate-400">{evt.data.split('-').reverse().join('/')}</p>
                    </div>
                    {getCanalBadge(evt.canal_b2b)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-amber-400 font-semibold">{diasRestantes} dias restantes</span>
                    <span className="font-black text-white">{formatCurrencyBRL(evt.valor_total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 61 to 90+ days */}
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> 61 a 90+ Dias ({agingBuckets.from61To90.length})
              </span>
              <span className="text-xs font-bold text-purple-300">
                {formatCurrencyBRL(agingBuckets.from61To90.reduce((acc, curr) => acc + (curr.event.valor_total || 0), 0))}
              </span>
            </div>
            <div className="space-y-2.5">
              {agingBuckets.from61To90.map(({ event: evt, diasRestantes }) => (
                <div key={evt.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/30 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-white text-xs">{evt.loja_unidade || evt.nome_evento}</h4>
                      <p className="text-[11px] text-slate-400">{evt.data.split('-').reverse().join('/')}</p>
                    </div>
                    {getCanalBadge(evt.canal_b2b)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-xs">
                    <span className="text-purple-400 font-semibold">{diasRestantes} dias</span>
                    <span className="font-black text-white">{formatCurrencyBRL(evt.valor_total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== TABELA COMPLETA COM FOTOS E AÇÕES ==================== */
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300 border-collapse">
              <thead className="bg-neutral-950 text-[11px] uppercase font-bold text-neutral-400 tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Loja / Shopping BK</th>
                  <th className="py-3 px-4">Canal B2B</th>
                  <th className="py-3 px-4">Atração</th>
                  <th className="py-3 px-4">NF / Pedido</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4 text-center">Prazo / Vencimento</th>
                  <th className="py-3 px-4 text-center">Status Pagamento</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-medium">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-500">
                      Nenhum evento Burger King encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => {
                    const fins = evt.financeiro || [];
                    const isPaid = fins.length > 0 && fins.every((f) => f.status === 'PAGO');
                    const hasAnexos = evt.anexos && evt.anexos.length > 0;

                    return (
                      <tr key={evt.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-white">{evt.data.split('-').reverse().join('/')}</div>
                          <div className="text-neutral-500 text-[11px]">{evt.horario} ({evt.duracao}h)</div>
                        </td>

                        <td className="py-3 px-4 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            {evt.foto_loja_url ? (
                              <img
                                src={evt.foto_loja_url}
                                alt="Fachada"
                                className="w-9 h-9 rounded-lg object-cover border border-neutral-700 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                onClick={() => setLightboxImageUrl(evt.foto_loja_url!)}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-neutral-500 shrink-0">
                                <Store className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="truncate max-w-[200px]">{evt.loja_unidade || evt.nome_evento}</div>
                              {hasAnexos && (
                                <button
                                  onClick={() => setSelectedLojaName(evt.loja_unidade || evt.nome_evento || '')}
                                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Paperclip className="w-3 h-3" /> {evt.anexos!.length} anexo(s)
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">{getCanalBadge(evt.canal_b2b)}</td>

                        <td className="py-3 px-4 text-neutral-300">
                          {evt.atracoes?.map((a) => a.atracao?.nome).join(', ') || 'Robô LED Partner'}
                        </td>

                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {evt.nota_fiscal_ref || '—'}
                        </td>

                        <td className="py-3 px-4 text-right font-black text-amber-400 text-sm font-mono">
                          {formatCurrencyBRL(evt.valor_total)}
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-[11px]">
                          <div className="text-white font-semibold">{evt.prazo_pagamento_dias || 60} dias</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Pago
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> A Receber
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(evt)}
                              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                              title="Editar evento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id, evt.loja_unidade || evt.nome_evento || 'Evento')}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                              title="Excluir evento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ==================== MODAL DE GESTÃO DA LOJA, FOTOS & ANEXOS ==================== */}
      {selectedLojaData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-scaleUp flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-950/40 to-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedLojaData.nome}</h2>
                  <p className="text-xs text-neutral-400">
                    {selectedLojaData.count} apresentação(ões) • Faturamento Total: {formatCurrencyBRL(selectedLojaData.total)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLojaName(null)}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Seção 1: Foto da Fachada / Loja */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-400" /> Foto da Fachada da Loja / Shopping
                  </label>
                  <input
                    type="file"
                    ref={storePhotoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingPhoto(true);
                      try {
                        const att = await handleFileUpload(file, 'FOTO_LOJA');
                        await api.updateStoreDetails(selectedLojaData.nome, {
                          foto_loja_url: att.url,
                        });
                        success('Foto atualizada', 'A foto da fachada foi salva com sucesso para esta loja!');
                        loadData();
                      } catch (err: any) {
                        error(err.message || 'Erro ao enviar foto.');
                      } finally {
                        setIsUploadingPhoto(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => storePhotoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingPhoto ? 'Enviando foto...' : 'Alterar / Fazer Upload'}
                  </button>
                </div>

                {selectedLojaData.foto_loja_url ? (
                  <div className="relative h-48 bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 group">
                    <img
                      src={selectedLojaData.foto_loja_url}
                      alt={selectedLojaData.nome}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => setLightboxImageUrl(selectedLojaData.foto_loja_url!)}
                        className="px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Visualizar Grande
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Deseja remover a foto desta loja?')) {
                            await api.updateStoreDetails(selectedLojaData.nome, { foto_loja_url: '' });
                            loadData();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/80 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => storePhotoInputRef.current?.click()}
                    className="h-36 border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-neutral-950/50 p-4 text-center"
                  >
                    <Camera className="w-8 h-8 text-neutral-600 mb-2" />
                    <p className="text-xs font-bold text-neutral-300">Nenhuma foto de fachada cadastrada</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Clique aqui para enviar uma foto da loja do Burger King</p>
                  </div>
                )}
              </div>

              {/* Seção 2: Galeria de Anexos (Comprovantes, Fotos de Show, OS, NF) */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-cyan-400" /> Anexos da Loja & Apresentações ({selectedLojaData.anexos.length})
                  </label>
                  <input
                    type="file"
                    ref={storeAttachmentInputRef}
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsUploadingAttachment(true);
                      try {
                        const newAttachments: EventAttachment[] = [...selectedLojaData.anexos];
                        for (let i = 0; i < files.length; i++) {
                          const att = await handleFileUpload(files[i], 'DOCUMENTO');
                          newAttachments.push(att);
                        }
                        await api.updateStoreDetails(selectedLojaData.nome, {
                          anexos: newAttachments,
                        });
                        success('Anexos adicionados', 'Os novos arquivos foram vinculados à loja com sucesso!');
                        loadData();
                      } catch (err: any) {
                        error(err.message || 'Erro ao enviar anexos.');
                      } finally {
                        setIsUploadingAttachment(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => storeAttachmentInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isUploadingAttachment ? 'Enviando...' : 'Adicionar Anexo / Comprovante'}
                  </button>
                </div>

                {selectedLojaData.anexos.length === 0 ? (
                  <p className="text-xs text-neutral-500 bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-center">
                    Nenhum comprovante, ordem de serviço ou foto de show anexado para esta loja ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedLojaData.anexos.map((att) => {
                      const isImg = att.url.match(/\.(jpeg|jpg|png|webp)$/i);
                      return (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isImg ? (
                              <img
                                src={att.url}
                                alt={att.nome}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-neutral-700 cursor-pointer"
                                onClick={() => setLightboxImageUrl(att.url)}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 text-cyan-400">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{att.nome}</p>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                {new Date(att.data_upload).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {isImg && (
                              <button
                                onClick={() => setLightboxImageUrl(att.url)}
                                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                                title="Ver imagem"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="p-1.5 text-neutral-400 hover:text-cyan-400 rounded-lg hover:bg-neutral-800"
                              title="Baixar arquivo"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={async () => {
                                if (confirm(`Deseja remover o anexo "${att.nome}"?`)) {
                                  const updatedAnexos = selectedLojaData.anexos.filter((x) => x.id !== att.id);
                                  await api.updateStoreDetails(selectedLojaData.nome, { anexos: updatedAnexos });
                                  loadData();
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800"
                              title="Remover anexo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seção 3: Histórico de Apresentações da Loja */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" /> Apresentações Realizadas ({selectedLojaData.events.length})
                </label>
                <div className="space-y-2">
                  {selectedLojaData.events.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{e.data.split('-').reverse().join('/')}</span>
                        <span className="text-neutral-500 ml-2">às {e.horario} ({e.duracao}h)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-400 font-mono">{formatCurrencyBRL(e.valor_total)}</span>
                        <button
                          onClick={() => {
                            setSelectedLojaName(null);
                            handleOpenEdit(e);
                          }}
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end shrink-0">
              <button
                onClick={() => setSelectedLojaName(null)}
                className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE CADASTRO / EDIÇÃO BK EXPRESS ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-500/40 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-scaleUp flex flex-col">
            <div className="p-6 bg-gradient-to-r from-amber-950/40 to-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingEvent ? 'Editar Evento Burger King' : 'Novo Evento Burger King (Express)'}
                  </h2>
                  <p className="text-xs text-neutral-400">Preenchimento ágil com foto de loja e anexos</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-white p-2 rounded-lg bg-neutral-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Foto da Loja / Fachada */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Foto da Loja / Fachada (Opcional)</span>
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingPhoto(true);
                      try {
                        const att = await handleFileUpload(file, 'FOTO_LOJA');
                        setFormData((prev) => ({ ...prev, foto_loja_url: att.url }));
                        success('Foto carregada', 'Foto da fachada pronta para salvar!');
                      } catch (err: any) {
                        error(err.message || 'Erro ao carregar foto.');
                      } finally {
                        setIsUploadingPhoto(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                  >
                    {isUploadingPhoto ? 'Enviando...' : '+ Upload de Foto'}
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="URL da Foto ou faça upload acima..."
                    value={formData.foto_loja_url}
                    onChange={(e) => setFormData({ ...formData, foto_loja_url: e.target.value })}
                    className="flex-1 px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 font-mono"
                  />
                  {formData.foto_loja_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_loja_url: '' })}
                      className="p-2 text-rose-400 hover:bg-neutral-800 rounded-xl"
                      title="Limpar foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {formData.foto_loja_url && (
                  <div className="mt-2 relative h-28 rounded-xl overflow-hidden border border-neutral-800">
                    <img
                      src={formData.foto_loja_url}
                      alt="Prévia da Loja"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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

              {/* Seção de Anexos do Evento */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Anexos & Documentos do Evento
                  </label>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setIsUploadingAttachment(true);
                      try {
                        const newAtts = [...formData.anexos];
                        for (let i = 0; i < files.length; i++) {
                          const att = await handleFileUpload(files[i], 'DOCUMENTO');
                          newAtts.push(att);
                        }
                        setFormData((prev) => ({ ...prev, anexos: newAtts }));
                        success('Anexos adicionados', 'Arquivos anexados ao evento!');
                      } catch (err: any) {
                        error(err.message || 'Erro ao carregar anexos.');
                      } finally {
                        setIsUploadingAttachment(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold underline"
                  >
                    {isUploadingAttachment ? 'Enviando...' : '+ Anexar Arquivos'}
                  </button>
                </div>

                {formData.anexos.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {formData.anexos.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                      >
                        <span className="text-white truncate max-w-[300px]">{att.nome}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              anexos: prev.anexos.filter((x) => x.id !== att.id),
                            }));
                          }}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Modal de Baixa de Pagamento */}
      {settlingEntryId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/40 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Confirmar Recebimento BK
            </h3>
            <p className="text-xs text-neutral-400">
              Selecione a forma de liquidação para baixar esta parcela no fluxo financeiro:
            </p>
            <div>
              <label className="block text-xs text-neutral-300 mb-1">Forma de Pagamento</label>
              <select
                value={settleMethod}
                onChange={(e) => setSettleMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs"
              >
                <option value="PIX">PIX (Transferência Direta)</option>
                <option value="TRANSFERENCIA_BANCARIA">Transferência / TED</option>
                <option value="BOLETO">Boleto Bancário</option>
                <option value="OUTRO">Outro Método</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSettlingEntryId(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSettlePayment(settlingEntryId)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
