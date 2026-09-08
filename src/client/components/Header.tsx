import React from 'react';
import { PlusCircle, Search, Menu } from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface HeaderProps {
  currentTab: NavTab;
  onNewContractClick: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNewContractClick,
  searchQuery = '',
  onSearchChange,
  onOpenMobileMenu,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string; searchPlaceholder?: string }> = {
    dashboard: {
      title: 'Dashboard de Operações',
      subtitle: 'Acompanhe eventos, faturamento contratado, fluxo de caixa e agenda em tempo real.',
    },
    eventos: {
      title: 'Agenda & Gestão de Eventos',
      subtitle: 'Visualize cronograma, status do show, atrações escaladas e gere contratos com 1 clique.',
      searchPlaceholder: 'Buscar evento, cliente ou local...',
    },
    'novo-contrato': {
      title: 'Novo Contrato de Prestação de Serviços',
      subtitle: 'Preencha os dados, visualize a prévia e gere o PDF assinado automaticamente.',
    },
    contratos: {
      title: 'Histórico de Contratos',
      subtitle: 'Consulte, filtre, visualize, duplique e baixe contratos gerados.',
      searchPlaceholder: 'Buscar cliente, CPF ou nº do contrato...',
    },
    financeiro: {
      title: 'Financeiro & Fluxo de Caixa',
      subtitle: 'Controle de recebimentos, sinais de 40%, saldos de 60% e baixas de pagamentos.',
    },
    custos: {
      title: 'Custos, Despesas & DRE Operacional',
      subtitle: 'Custos diretos por evento (#01 a #47), compras, investimentos e cálculo do Lucro Líquido Real.',
    },
    atracoes: {
      title: 'Catálogo de Atrações & Personagens',
      subtitle: 'Gerenciamento de robôs de LED, personagens vivos, figurinos e valores base.',
    },
    clientes: {
      title: 'Base de Clientes',
      subtitle: 'Histórico completo de contratações, dados cadastrais e eventos de cada cliente.',
      searchPlaceholder: 'Buscar cliente por nome ou CPF...',
    },
    configuracoes: {
      title: 'Configurações & Chave de API',
      subtitle: 'Gerencie os dados da empresa e a chave de API para integração externa.',
    },
  };

  const currentInfo = titles[currentTab] || titles.dashboard;
  const showSearch = ['contratos', 'eventos', 'clientes'].includes(currentTab);

  return (
    <header className="h-16 sm:h-20 bg-dark-850/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors shrink-0"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight leading-tight truncate">
            {currentInfo.title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {showSearch && onSearchChange && (
          <div className="relative w-36 sm:w-64">
            <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={currentInfo.searchPlaceholder || 'Buscar...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs rounded-xl bg-dark-800 border border-slate-700/70 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>
        )}

        {currentTab !== 'novo-contrato' && (
          <button
            onClick={onNewContractClick}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-brand-600/30 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline">Novo Contrato</span>
            <span className="sm:hidden text-[11px] font-bold">Novo</span>
          </button>
        )}
      </div>
    </header>
  );
};

