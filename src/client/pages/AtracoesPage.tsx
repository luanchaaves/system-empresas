import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  X,
  Layers,
  Image as ImageIcon,
  ZoomIn,
  Hammer,
} from 'lucide-react';
import { api } from '../api/index.js';
import { Attraction, AttractionCategory, CreateAttractionDTO } from '../../types/index.js';

export const AtracoesPage: React.FC = () => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const [formData, setFormData] = useState<CreateAttractionDTO & { foto_url?: string }>({
    nome: '',
    categoria: 'ROBO_LED',
    descricao: '',
    valor_base: 550,
    ativo: true,
    foto_url: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAttractions({
        categoria: selectedCategory !== 'TODOS' ? (selectedCategory as AttractionCategory) : undefined,
      });
      setAttractions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar catálogo de atrações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      nome: '',
      categoria: 'ROBO_LED',
      descricao: '',
      valor_base: 550,
      ativo: true,
      foto_url: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Attraction) => {
    setEditingId(item.id);
    setFormData({
      nome: item.nome,
      categoria: item.categoria,
      descricao: item.descricao || '',
      valor_base: item.valor_base,
      ativo: item.ativo === 1,
      foto_url: item.foto_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAttraction(editingId, formData);
      } else {
        await api.createAttraction(formData);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar atração.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover esta atração do catálogo?')) return;
    try {
      await api.deleteAttraction(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir atração.');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Top Banner Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-dark-800 via-dark-800 to-purple-950/30 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-dark-900 border border-brand-500/40 shadow-lg shadow-brand-500/20 overflow-hidden shrink-0 flex items-center justify-center">
            <img
              src="/assets/branding/robo-avatar.png"
              alt="Robô LED"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" /> Portfólio & Elenco
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
              Catálogo de Robôs & Personagens
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestão visual de robôs de LED, personagens vivos, figurinos e cachês.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-pink-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Nova Atração
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto w-full">
        {[
          { id: 'TODOS', label: 'Todas as Atrações', count: attractions.length },
          {
            id: 'ROBO_LED',
            label: 'Robôs de LED',
            count: attractions.filter((a) => a.categoria === 'ROBO_LED').length,
          },
          {
            id: 'PERSONAGEM_VIVO',
            label: 'Personagens Vivos',
            count: attractions.filter((a) => a.categoria === 'PERSONAGEM_VIVO').length,
          },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-700/60 text-slate-300'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Attractions Cards with Photos */}
      {loading ? (
        <div className="py-24 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto animate-spin text-brand-500 mb-3" />
          <p className="text-sm font-medium">Carregando catálogo de atrações...</p>
        </div>
      ) : attractions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-dark-850/60 border border-slate-800">
          <Sparkles className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma atração encontrada</h3>
          <p className="text-xs text-slate-400 mt-1">Cadastre seus robôs de led ou personagens vivos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {attractions.map((item) => {
            const isZeus = item.nome.toLowerCase().includes('zeus');
            const isRobo = item.categoria === 'ROBO_LED';

            return (
              <div
                key={item.id}
                className="bg-dark-850 border border-slate-800/90 hover:border-brand-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-brand-600/10 group"
              >
                {/* Photo Top Container */}
                <div className="relative aspect-[4/3] bg-dark-900 overflow-hidden select-none border-b border-slate-800/80">
                  {item.foto_url ? (
                    <img
                      src={item.foto_url}
                      alt={item.nome}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => setZoomImage({ url: item.foto_url!, title: item.nome })}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-850 to-dark-900 text-slate-600">
                      {isRobo ? <Bot className="w-12 h-12" /> : <Sparkles className="w-12 h-12" />}
                      <span className="text-[11px] font-medium mt-2">Sem foto cadastrada</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-black/40 pointer-events-none" />

                  {/* Category & Status Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${
                        isRobo
                          ? 'bg-brand-500/80 border-brand-400/50 text-white shadow-md shadow-brand-500/30'
                          : 'bg-purple-500/80 border-purple-400/50 text-white shadow-md shadow-purple-500/30'
                      }`}
                    >
                      {isRobo ? 'Robô LED' : 'Personagem Vivo'}
                    </span>

                    {isZeus && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/90 border border-amber-400/50 text-black font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <Hammer className="w-3 h-3" /> Em Construção
                      </span>
                    )}
                  </div>

                  {/* Zoom Action Icon */}
                  {item.foto_url && (
                    <button
                      onClick={() => setZoomImage({ url: item.foto_url!, title: item.nome })}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0"
                      title="Ver Foto em Tamanho Real"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-brand-400 transition-colors leading-snug">
                      {item.nome}
                    </h4>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.descricao || 'Atração oficial Robo Led Partner.'}
                    </p>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">Cachê Sugerido</div>
                      <div className="text-base font-black text-emerald-400">
                        R$ {item.valor_base.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                        title="Editar Atração"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Excluir Atração"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] bg-dark-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-dark-850">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                {zoomImage.title}
              </h3>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black overflow-auto">
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-dark-850 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/15 text-brand-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingId ? 'Editar Atração' : 'Cadastrar Nova Atração'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure nome, foto e cachê da atração.</p>
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
                <label className="block text-xs text-slate-300 font-medium mb-1">Nome da Atração *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Robô Nextron LED ou Mickey Mouse"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as AttractionCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ROBO_LED">Robô de LED</option>
                    <option value="PERSONAGEM_VIVO">Personagem Vivo</option>
                    <option value="OUTRO">Outra Atração</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 font-medium mb-1">Valor Base (R$)</label>
                  <input
                    type="number"
                    step="50"
                    value={formData.valor_base}
                    onChange={(e) => setFormData({ ...formData, valor_base: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-emerald-400 font-bold focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">URL / Caminho da Foto</label>
                <input
                  type="text"
                  placeholder="/assets/attractions/exemplo.jpg"
                  value={formData.foto_url || ''}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">Descrição & Detalhes</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Robô com 2,80m de altura, canhão de CO2 e iluminação RGB."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-dark-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-0"
                />
                <label htmlFor="ativo" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Atração ativa para agendamentos e contratos
                </label>
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
                  Salvar Atração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
