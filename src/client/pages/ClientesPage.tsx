import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  ChevronRight,
  UserCheck,
  Edit2,
  Trash2,
  Clock,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/index.js';
import { Client, EventDetails, Contract, FinancialEntry } from '../../types/index.js';

interface ClientesPageProps {
  searchQuery?: string;
  onNavigateToEvents?: (client?: Client) => void;
}

export const ClientesPage: React.FC<ClientesPageProps> = ({
  searchQuery = '',
  onNavigateToEvents,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client Details Drawer / Modal
  const [selectedClient, setSelectedClient] = useState<
    (Client & { eventos?: EventDetails[]; contratos?: Contract[]; financeiro?: FinancialEntry[] }) | null
  >(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit / Create Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    endereco: '',
    telefone: '',
    email: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getClients(searchQuery);
      setClients(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleOpenDetails = async (client: Client) => {
    setLoadingDetails(true);
    try {
      const full = await api.getClient(client.id);
      setSelectedClient(full);
    } catch (err: any) {
      alert(err.message || 'Erro ao buscar histórico do cliente.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      nome: '',
      cpf: '',
      endereco: '',
      telefone: '',
      email: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrUpdateClient(formData);
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cliente.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir este cliente do cadastro?')) return;
    try {
      await api.deleteClient(id);
      if (selectedClient?.id === id) setSelectedClient(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-300">
          Total de Clientes: <span className="text-white font-bold">{clients.length}</span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Cliente
        </button>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-3" />
          <p className="text-sm">Carregando base de clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-dark-850/60 border border-slate-800">
          <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-slate-400 mt-1">Clientes são cadastrados automaticamente ao gerar contratos ou agendar eventos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleOpenDetails(client)}
              className="bg-dark-850 border border-slate-800/80 hover:border-brand-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-extrabold flex items-center justify-center text-sm">
                      {client.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                        {client.nome}
                      </h4>
                      <div className="text-[11px] text-slate-400">CPF: {client.cpf}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
                </div>

                <div className="space-y-1.5 py-2.5 border-t border-slate-800/60 text-xs text-slate-300">
                  {client.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-brand-400" />
                      <span>{client.telefone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-brand-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.endereco && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-400" />
                      <span className="truncate">{client.endereco}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Cadastrado em {client.created_at?.split('T')[0]?.split('-').reverse().join('/') || 'Recente'}</span>
                <span className="text-brand-400 font-semibold group-hover:underline">Ver Histórico</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer / Modal Histórico Completo do Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-400 font-black flex items-center justify-center text-base">
                  {selectedClient.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedClient.nome}</h3>
                  <p className="text-xs text-slate-400">CPF: {selectedClient.cpf}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Contato */}
              <div className="p-4 rounded-xl bg-dark-800 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Telefone / WhatsApp:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedClient.telefone || 'Não informado'}</div>
                </div>
                <div>
                  <span className="text-slate-400">E-mail:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedClient.email || 'Não informado'}</div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Endereço Residencial:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedClient.endereco || 'Não informado'}</div>
                </div>
              </div>

              {/* Contratos */}
              <div>
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Contratos Gerados ({selectedClient.contratos?.length || 0})
                </h4>
                {selectedClient.contratos && selectedClient.contratos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.contratos.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-dark-800/80 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{c.numero}</span>
                          <span className="text-slate-400 ml-2">
                            {c.evento_data.split('-').reverse().join('/')} ({c.personagem || c.tipo})
                          </span>
                        </div>
                        <a
                          href={api.getContractPdfUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold flex items-center gap-1 hover:bg-emerald-500/25"
                        >
                          Ver PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum contrato formal gerado ainda.</p>
                )}
              </div>

              {/* Eventos */}
              <div>
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Eventos Agendados ({selectedClient.eventos?.length || 0})
                </h4>
                {selectedClient.eventos && selectedClient.eventos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.eventos.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-dark-800/80 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{ev.nome_evento || 'Festa / Show'}</div>
                          <div className="text-slate-400">
                            {ev.data.split('-').reverse().join('/')} às {ev.horario} • {ev.endereco}
                          </div>
                        </div>
                        <div className="font-extrabold text-emerald-400">
                          R$ {ev.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum evento registrado.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDelete(selectedClient.id)}
                className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold"
              >
                Excluir Cadastro
              </button>
              <div className="flex items-center gap-2">
                {onNavigateToEvents && (
                  <button
                    onClick={() => {
                      const c = selectedClient;
                      setSelectedClient(null);
                      onNavigateToEvents(c);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 rounded-xl shadow-md shadow-brand-600/30 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Agendar Nova Festa
                  </button>
                )}
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Novo Cliente</h3>
                  <p className="text-xs text-slate-400">Cadastre os dados pessoais do contratante.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Ana Clara Souza"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">CPF *</label>
                <input
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Endereço Residencial</label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all active:scale-[0.98]"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
