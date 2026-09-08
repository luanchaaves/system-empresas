import React, { useState, useEffect } from 'react';
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
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
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">Todos os status</option>
              <option value="GERADO">Gerado</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadContracts}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            title="Atualizar Lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          <button
            onClick={onNavigateToNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Novo Contrato
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="card-glass rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-dark-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Nº Contrato</th>
                <th className="py-3.5 px-4">Cliente & CPF</th>
                <th className="py-3.5 px-4">Atração</th>
                <th className="py-3.5 px-4">Evento (Data/Hora)</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
                    Carregando contratos...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    Nenhum contrato encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Nº Contrato */}
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-400 whitespace-nowrap">
                      {c.numero}
                    </td>

                    {/* Cliente & CPF */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white leading-tight">{c.cliente?.nome}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.cliente?.cpf}</div>
                    </td>

                    {/* Atração */}
                    <td className="py-3.5 px-4">
                      <AttractionBadge tipo={c.tipo} personagem={c.personagem} quantidade={c.quantidade_personagens} />
                    </td>

                    {/* Evento */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">
                        {formatDateBR(c.evento?.data)}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        {c.evento?.horario && `às ${c.evento.horario}`}
                        {c.evento?.cidade && ` • ${c.evento.cidade}`}
                      </div>
                    </td>

                    {/* Valor Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white">
                        {formatCurrencyBRL(c.valor_total, true)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        40%: {formatCurrencyBRL(c.valor_entrada)} | 60%: {formatCurrencyBRL(c.valor_restante)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Visualizar */}
                        <button
                          onClick={() => {
                            setPreviewContractId(c.id);
                            setPreviewNumber(c.numero);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Visualizar Contrato / Imprimir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Baixar PDF */}
                        <a
                          href={api.getContractPdfUrl(c.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-brand-600/30 text-brand-300 hover:bg-brand-600 hover:text-white transition-colors"
                          title="Baixar PDF Oficial"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Duplicar */}
                        <button
                          onClick={() => handleDuplicate(c)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Duplicar Contrato (Criar novo número mantendo dados)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Editar Contrato"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Excluir */}
                        <button
                          onClick={() => setContractToDelete(c)}
                          className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors"
                          title="Excluir Contrato"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal de Prévia */}
      {previewContractId && (
        <ContractPreviewModal
          isOpen={true}
          onClose={() => setPreviewContractId(null)}
          contractId={previewContractId}
          contractNumber={previewNumber}
          onRegenerated={loadContracts}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={!!contractToDelete}
        onClose={() => setContractToDelete(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-xs text-slate-200">
              Tem certeza que deseja excluir o contrato{' '}
              <strong className="text-white font-mono">{contractToDelete?.numero}</strong> do cliente{' '}
              <strong className="text-white">{contractToDelete?.cliente?.nome}</strong>?
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            Esta ação removerá o registro do sistema.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setContractToDelete(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição Rápida */}
      <Modal
        isOpen={!!contractToEdit}
        onClose={() => setContractToEdit(null)}
        title={`Editar Contrato ${contractToEdit?.numero}`}
        size="lg"
      >
        {contractToEdit && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={editFormData.cliente_nome || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, cliente_nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Data do Evento</label>
                <input
                  type="date"
                  value={editFormData.evento_data || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, evento_data: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Horário de Início</label>
                <input
                  type="time"
                  value={editFormData.evento_horario || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, evento_horario: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  value={editFormData.valor_total || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, valor_total: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-300 mb-1">Local do Evento</label>
                <input
                  type="text"
                  value={editFormData.evento_endereco || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, evento_endereco: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Status do Contrato</label>
                <select
                  value={editFormData.status || 'GERADO'}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as ContractStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800 border border-slate-700 text-slate-100"
                >
                  <option value="GERADO">Gerado</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="RASCUNHO">Rascunho</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setContractToEdit(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors disabled:opacity-50"
              >
                {isSavingEdit ? 'Salvando & Gerando PDF...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
