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
} from 'lucide-react';
import { api } from '../api/index.js';
import { FinancialEntry, FinancialStats, PaymentStatus, PaymentMethod } from '../../types/index.js';
import { formatCurrencyBRL } from '../../domain/calculations.js';

export const FinanceiroPage: React.FC = () => {
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

    for (const e of entries) {
      if (e.status === 'CANCELADO') continue;
      totalFaturado += (Number(e.valor) || 0);

      if (e.status === 'PAGO') {
        totalRecebido += (Number(e.valor) || 0);
      } else if (e.status === 'PENDENTE') {
        if (e.data_vencimento && e.data_vencimento < today) {
          totalAtrasado += (Number(e.valor) || 0);
        } else {
          totalAReceber += (Number(e.valor) || 0);
        }
      } else if (e.status === 'ATRASADO') {
        totalAtrasado += (Number(e.valor) || 0);
      }
    }

    return {
      totalFaturado: stats?.totalFaturado || stats?.total_geral || totalFaturado,
      totalRecebido: stats?.totalRecebido || stats?.total_pago || totalRecebido,
      totalAReceber: stats?.totalAReceber || stats?.total_pendente || totalAReceber,
      totalAtrasado: stats?.totalAtrasado || stats?.total_atrasado || totalAtrasado,
    };
  }, [entries, stats]);

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
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
            Controle de recebimentos, sinais de 40%, saldos de 60%, baixas e edição de status.
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

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Faturado</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrencyBRL(calculatedStats.totalFaturado)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Soma de todos os contratos</div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Recebido</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {formatCurrencyBRL(calculatedStats.totalRecebido)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Valores quitados</div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">A Receber (No Prazo)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {formatCurrencyBRL(calculatedStats.totalAReceber)}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Aguardando vencimento</div>
        </div>

        <div className="p-5 rounded-2xl bg-dark-850 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Inadimplente / Atrasado</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">
            {formatCurrencyBRL(calculatedStats.totalAtrasado)}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">Vencimento ultrapassado</div>
        </div>
      </div>

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
                      <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                        {formatCurrencyBRL(entry.valor)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(entry.status, entry.data_vencimento)}</td>

                      {/* Forma / Pagto */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 font-semibold text-[10px] border border-emerald-500/20">
                              {entry.forma_pagamento || 'PIX'}
                            </span>
                            {entry.data_pagamento && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Pago em {entry.data_pagamento.split('-').reverse().join('/')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Aguardando</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão Dar Baixa */}
                          {!isPaid && (
                            <button
                              onClick={() => handleOpenSettle(entry)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-1"
                              title="Dar Baixa"
                            >
                              <Check className="w-3.5 h-3.5" /> Baixar
                            </button>
                          )}

                          {/* Botão Editar / Alterar Status */}
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Editar / Alterar Status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Excluir Lançamento"
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
        )}
      </div>

      {/* Modal Dar Baixa Rápida */}
      {settlingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dar Baixa no Pagamento</h3>
                  <p className="text-xs text-slate-400">Confirme o recebimento do valor.</p>
                </div>
              </div>
              <button
                onClick={() => setSettlingEntry(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-700/60">
                <div className="text-xs text-slate-400 font-medium">Lançamento:</div>
                <div className="text-sm font-bold text-white mt-0.5">{settlingEntry.descricao}</div>
                <div className="text-base font-black text-emerald-400 mt-1">
                  {formatCurrencyBRL(settlingEntry.valor)}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Forma de Pagamento *</label>
                <select
                  value={settleForm.forma_pagamento}
                  onChange={(e) => setSettleForm({ ...settleForm, forma_pagamento: e.target.value as PaymentMethod })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="PIX">PIX (Chave / QrCode)</option>
                  <option value="DINHEIRO">Dinheiro (Em Mãos)</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="TRANSFERENCIA">Transferência Bancária / TED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Data do Recebimento *</label>
                <input
                  type="date"
                  required
                  value={settleForm.data_pagamento}
                  onChange={(e) => setSettleForm({ ...settleForm, data_pagamento: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Comprovante / Referência</label>
                <input
                  type="text"
                  placeholder="Ex: Comprovante Pix enviado no WhatsApp"
                  value={settleForm.comprovante_ref}
                  onChange={(e) => setSettleForm({ ...settleForm, comprovante_ref: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
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

      {/* Modal Editar / Alterar Status Completo */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Editar Lançamento / Alterar Status</h3>
                  <p className="text-xs text-slate-400">Ajuste status, valores, vencimento e dados de pagamento.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEdit} className="p-6 space-y-4">
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
