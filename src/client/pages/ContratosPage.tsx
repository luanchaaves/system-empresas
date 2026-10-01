import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  PlusCircle,
  Calendar,
  DollarSign,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Award,
  Camera,
  MapPin,
  Users,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Contract, AttractionType, ContractStatus, CreateContractDTO } from '../../types/index.js';
import { StatusBadge, AttractionBadge } from '../components/Badge.js';
import { ContractPreviewModal } from '../components/ContractPreviewModal.js';
import { Modal } from '../components/Modal.js';
import { api } from '../api/index.js';
import { useToast } from '../context/ToastContext.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';
import { formatDateBR } from '../../domain/date.js';

interface ContratosPageProps {
  onNavigateToNew: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const ContratosPage: React.FC<ContratosPageProps> = ({
  onNavigateToNew,
  searchQuery = '',
  onSearchChange,
}) => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'DASHBOARDS' | 'LISTA'>('DASHBOARDS');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modais
  const [previewContractId, setPreviewContractId] = useState<number | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string>('');

  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [contractToEdit, setContractToEdit] = useState<Contract | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CreateContractDTO>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const data = await api.getContracts({
        search: searchQuery || undefined,
        tipo: tipoFilter !== 'ALL' ? (tipoFilter as AttractionType) : undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ContractStatus) : undefined,
      });
      setContracts(data);
    } catch (err: any) {
      console.error('Erro ao carregar contratos:', err);
      error('Erro ao carregar contratos', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [searchQuery, tipoFilter, statusFilter]);

  const handleDuplicate = async (contract: Contract) => {
    try {
      const duplicated = await api.duplicateContract(contract.id);
      success('Contrato Duplicado!', `Novo contrato ${duplicated.numero} gerado.`);
      loadContracts();
    } catch (err: any) {
      error('Erro ao duplicar contrato', err.message);
    }
  };

  const handleRegenerate = async (contract: Contract) => {
    try {
      await api.regeneratePdf(contract.id);
      success('PDF Atualizado', `O PDF de ${contract.numero} foi gerado novamente.`);
      loadContracts();
    } catch (err: any) {
      error('Erro ao regenerar PDF', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteContract(contractToDelete.id);
      success('Contrato Excluído', `O contrato ${contractToDelete.numero} foi removido.`);
      setContractToDelete(null);
      loadContracts();
    } catch (err: any) {
      error('Erro ao excluir', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (contract: Contract) => {
    setContractToEdit(contract);
    setEditFormData({
      tipo: contract.tipo,
      personagem: contract.personagem,
      quantidade_personagens: contract.quantidade_personagens,
      cliente_nome: contract.cliente?.nome,
      cliente_cpf: contract.cliente?.cpf,
      cliente_endereco: contract.cliente?.endereco,
      cliente_telefone: contract.cliente?.telefone,
      cliente_email: contract.cliente?.email,
      evento_data: contract.evento?.data,
      evento_horario: contract.evento?.horario,
      evento_duracao: contract.evento?.duracao,
      evento_endereco: contract.evento?.endereco,
      evento_cidade: contract.evento?.cidade,
      evento_observacoes: contract.evento?.observacoes,
      valor_total: contract.valor_total,
      uso_imagem: contract.uso_imagem !== 0,
      status: contract.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!contractToEdit) return;
    setIsSavingEdit(true);
    try {
      await api.updateContract(contractToEdit.id, editFormData);
      success('Contrato Atualizado', `Contrato ${contractToEdit.numero} atualizado com sucesso.`);
      setContractToEdit(null);
      loadContracts();
    } catch (err: any) {
      error('Erro ao salvar alterações', err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ==================== DASHBOARD ANALYTICS COMPUTATIONS ====================
  const dashboardStats = useMemo(() => {
    let totalValor = 0;
    let geradosCount = 0;
    let finalizadosCount = 0;
    let rascunhoCount = 0;
    let usoImagemCount = 0;
    let totalPersonagens = 0;

    const atracaoMap: { [key: string]: { label: string; count: number; total: number; color: string } } = {
      ROBO_LED: { label: 'Robô LED Neon', count: 0, total: 0, color: 'bg-brand-500' },
      PERSONAGEM: { label: 'Personagens Vivos', count: 0, total: 0, color: 'bg-purple-500' },
      DUPLA_ROBO: { label: 'Dupla Robôs LED', count: 0, total: 0, color: 'bg-cyan-500' },
      OUTRO: { label: 'Outras Atrações', count: 0, total: 0, color: 'bg-amber-500' },
    };

    const monthlyMap: { [key: string]: { label: string; count: number; total: number } } = {};
    const cidadesMap: { [key: string]: { cidade: string; count: number; total: number } } = {};

    for (const c of contracts) {
      const v = Number(c.valor_total) || 0;
      totalValor += v;

      if (c.status === 'GERADO') geradosCount++;
      else if (c.status === 'FINALIZADO') finalizadosCount++;
      else rascunhoCount++;

      if (c.uso_imagem) usoImagemCount++;
      totalPersonagens += c.quantidade_personagens || 1;

      // Atração
      const tipo = c.tipo || 'ROBO_LED';
      if (!atracaoMap[tipo]) {
        atracaoMap[tipo] = { label: tipo, count: 0, total: 0, color: 'bg-slate-500' };
      }
      atracaoMap[tipo].count++;
      atracaoMap[tipo].total += v;

      // Mensal
      const dataStr = c.evento?.data || c.created_at;
      if (dataStr) {
        const monthKey = dataStr.substring(0, 7); // YYYY-MM
        if (!monthlyMap[monthKey]) {
          const [year, month] = monthKey.split('-');
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          monthlyMap[monthKey] = {
            label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            count: 0,
            total: 0,
          };
        }
        monthlyMap[monthKey].count++;
        monthlyMap[monthKey].total += v;
      }

      // Cidade
      const cidade = c.evento?.cidade?.trim() || 'São Paulo / Capital';
      if (!cidadesMap[cidade]) {
        cidadesMap[cidade] = { cidade, count: 0, total: 0 };
      }
      cidadesMap[cidade].count++;
      cidadesMap[cidade].total += v;
    }

    const totalCount = contracts.length;
    const ticketMedio = totalCount > 0 ? totalValor / totalCount : 0;
    const taxaUsoImagem = totalCount > 0 ? (usoImagemCount / totalCount) * 100 : 0;

    const monthlyTimeline = Object.entries(monthlyMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, val]) => ({ key, ...val }));

    const topCidades = Object.values(cidadesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalValor,
      totalCount,
      ticketMedio,
      taxaUsoImagem,
      geradosCount,
      finalizadosCount,
      rascunhoCount,
      totalPersonagens,
      atracaoBreakdown: Object.values(atracaoMap).filter((item) => item.count > 0),
      monthlyTimeline,
      topCidades,
    };
  }, [contracts]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800 to-brand-950/30 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
            <FileText className="w-4 h-4" /> Gestão Jurídica & Contratual
          </div>
          <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
            Histórico & Inteligência de Contratos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dashboards analíticos, indicadores de ticket médio, geração de PDFs e emissão de contratos.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToNew}
            className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Seletor de Sub-Abas do Módulo de Contratos */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('DASHBOARDS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'DASHBOARDS'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-lg shadow-brand-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboards & Métricas de Contratos
        </button>
        <button
          onClick={() => setActiveTab('LISTA')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'LISTA'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40 shadow-lg shadow-brand-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Lista de Contratos ({contracts.length})
        </button>
      </div>

      {/* KPI Cards de Contratos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-brand-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total em Contratos</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrencyBRL(dashboardStats.totalValor)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {dashboardStats.totalCount} contratos formalizados
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Ticket Médio por Contrato</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrencyBRL(dashboardStats.ticketMedio)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Média por fechamento de evento
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Atrações Escaladas</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400">
            {dashboardStats.totalPersonagens}
          </div>
          <div className="text-[11px] text-purple-400/80 mt-1">
            Robôs e personagens contratados
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Autorização de Imagem</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {dashboardStats.taxaUsoImagem.toFixed(0)}%
          </div>
          <div className="text-[11px] text-cyan-400/80 mt-1">
            Liberados para marketing & Instagram
          </div>
        </div>
      </div>

      {/* ==================== ABA 1: DASHBOARDS ANALÍTICOS DE CONTRATOS ==================== */}
      {activeTab === 'DASHBOARDS' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Grid: Mix de Atrações & Status dos Contratos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mix de Atrações */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-400" />
                Mix de Atrações Contratadas
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Proporção de contratos fechados por tipo de atração artística e robôs.
              </p>

              <div className="space-y-4">
                {dashboardStats.atracaoBreakdown.map((item, idx) => {
                  const perc = dashboardStats.totalValor > 0 ? (item.total / dashboardStats.totalValor) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-bold">{item.label}</span>
                        <span className="text-slate-300 font-mono">
                          {item.count} contratos • <strong>{formatCurrencyBRL(item.total)}</strong> ({perc.toFixed(1)}%)
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

            {/* Status dos Contratos */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Ciclo de Vida dos Contratos
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Status formal de emissão, finalização e rascunhos.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center">
                  <div className="text-2xl font-black text-emerald-400">{dashboardStats.geradosCount}</div>
                  <div className="text-xs font-bold text-white mt-1">Gerados / Ativos</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">PDFs emitidos</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 text-center">
                  <div className="text-2xl font-black text-blue-400">{dashboardStats.finalizadosCount}</div>
                  <div className="text-xs font-bold text-white mt-1">Finalizados</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Eventos concluídos</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700 text-center">
                  <div className="text-2xl font-black text-slate-400">{dashboardStats.rascunhoCount}</div>
                  <div className="text-xs font-bold text-white mt-1">Rascunhos</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Em elaboração</div>
                </div>
              </div>

              {/* Informações de Autorização */}
              <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Cláusula de Direito de Imagem</div>
                    <div className="text-[10px] text-slate-400">Autorizados para vídeos e portfólio</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-cyan-400 text-sm">
                  {dashboardStats.taxaUsoImagem.toFixed(0)}% aceites
                </div>
              </div>
            </div>
          </div>

          {/* Grid 2: Linha do Tempo de Contratos & Principais Cidades */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Linha do Tempo Mensal */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Histórico & Evolução por Mês
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Volume de contratos formalizados por período.
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {dashboardStats.monthlyTimeline.map((item) => (
                  <div
                    key={item.key}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.count} contratos</span>
                    </div>
                    <div className="text-sm font-black text-emerald-400">{formatCurrencyBRL(item.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cidades / Regiões */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-400" />
                Concentração por Cidade / Região
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Cidades com maior volume de contratos fechados.
              </p>

              <div className="space-y-3">
                {dashboardStats.topCidades.map((cid, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{cid.cidade}</div>
                        <div className="text-[10px] text-slate-500">{cid.count} contratos realizados</div>
                      </div>
                    </div>
                    <div className="text-sm font-black text-white">{formatCurrencyBRL(cid.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ABA 2: LISTA DE CONTRATOS ==================== */}
      {activeTab === 'LISTA' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Controls Bar */}
          <div className="card-glass rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente, CPF ou nº..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Tipo Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                  <Filter className="w-3.5 h-3.5" /> Atração:
                </span>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">Todas as atrações</option>
                  <option value="ROBO_LED">Robô LED</option>
                  <option value="PERSONAGEM">Personagens</option>
                  <option value="DUPLA_ROBO">Dupla de Robôs</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">Todos os status</option>
                  <option value="GERADO">Gerado</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="RASCUNHO">Rascunho</option>
                </select>
              </div>
            </div>

            <button
              onClick={loadContracts}
              className="p-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-300 hover:text-white transition-all self-end md:self-auto"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table / List */}
          <div className="card-glass rounded-2xl overflow-hidden border border-slate-800">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-dark-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Nenhum contrato encontrado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Tente alterar os filtros de busca ou crie um novo contrato.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-dark-800/40">
                      <th className="py-3 px-4 font-bold">Nº Contrato</th>
                      <th className="py-3 px-4 font-bold">Cliente & CPF</th>
                      <th className="py-3 px-4 font-bold">Atração</th>
                      <th className="py-3 px-4 font-bold">Evento (Data/Hora)</th>
                      <th className="py-3 px-4 font-bold">Valor Total</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {contracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-brand-400">
                          {c.numero}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.cliente?.nome || '—'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {c.cliente?.cpf || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <AttractionBadge tipo={c.tipo} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-medium">
                            {c.evento?.data ? formatDateBR(c.evento.data) : '—'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.evento?.horario ? `às ${c.evento.horario}` : ''} • {c.evento?.cidade || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-100">
                          <div>{formatCurrencyBRL(c.valor_total)}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            40%: {formatCurrencyBRL(c.valor_sinal || c.valor_total * 0.4)} | 60%: {formatCurrencyBRL(c.valor_restante || c.valor_total * 0.6)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setPreviewContractId(c.id);
                                setPreviewNumber(c.numero);
                              }}
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-brand-400 hover:bg-dark-750 transition-colors"
                              title="Visualizar PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={api.getContractPdfUrl(c.id)}
                              download
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-emerald-400 hover:bg-dark-750 transition-colors"
                              title="Baixar PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDuplicate(c)}
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-cyan-400 hover:bg-dark-750 transition-colors"
                              title="Duplicar Contrato"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRegenerate(c)}
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-amber-400 hover:bg-dark-750 transition-colors"
                              title="Regenerar PDF"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-indigo-400 hover:bg-dark-750 transition-colors"
                              title="Editar Contrato"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setContractToDelete(c)}
                              className="p-1.5 rounded-lg bg-dark-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Visualização de PDF */}
      {previewContractId && (
        <ContractPreviewModal
          contractId={previewContractId}
          contractNumber={previewNumber}
          onClose={() => setPreviewContractId(null)}
        />
      )}

      {/* Modal Confirmação de Exclusão */}
      {contractToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setContractToDelete(null)}
          title="Confirmar Exclusão"
        >
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Tem certeza que deseja excluir o contrato{' '}
              <strong className="text-white">{contractToDelete.numero}</strong> do cliente{' '}
              <strong className="text-white">{contractToDelete.cliente?.nome}</strong>?
            </p>
            <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Esta ação removerá o arquivo PDF e o registro no banco de dados permanentemente.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setContractToDelete(null)}
                className="btn-secondary px-4 py-2 text-xs"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Excluir Contrato
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Edição de Contrato */}
      {contractToEdit && (
        <Modal
          isOpen={true}
          onClose={() => setContractToEdit(null)}
          title={`Editar Contrato ${contractToEdit.numero}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Nome do Cliente</label>
                <input
                  type="text"
                  value={editFormData.cliente_nome || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cliente_nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">CPF do Cliente</label>
                <input
                  type="text"
                  value={editFormData.cliente_cpf || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cliente_cpf: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Telefone</label>
                <input
                  type="text"
                  value={editFormData.cliente_telefone || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cliente_telefone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Email</label>
                <input
                  type="email"
                  value={editFormData.cliente_email || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cliente_email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Data Evento</label>
                <input
                  type="date"
                  value={editFormData.evento_data || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, evento_data: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Horário</label>
                <input
                  type="time"
                  value={editFormData.evento_horario || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, evento_horario: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Valor Total (R$)</label>
                <input
                  type="number"
                  value={editFormData.valor_total || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, valor_total: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Cidade</label>
              <input
                type="text"
                value={editFormData.evento_cidade || ''}
                onChange={(e) => setEditFormData({ ...editFormData, evento_cidade: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold mb-1 block">Endereço do Evento</label>
              <input
                type="text"
                value={editFormData.evento_endereco || ''}
                onChange={(e) => setEditFormData({ ...editFormData, evento_endereco: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setContractToEdit(null)}
                className="btn-secondary px-4 py-2 text-xs"
                disabled={isSavingEdit}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
                disabled={isSavingEdit}
              >
                {isSavingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Salvar Alterações
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
