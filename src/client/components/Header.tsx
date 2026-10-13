import React from 'react';
import { PlusCircle, Search, Menu, Sun, Moon } from 'lucide-react';
import { NavTab } from './Sidebar.js';
import { useTheme } from '../context/ThemeContext.js';

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
  const { theme, toggleTheme } = useTheme();

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
    'burger-king': {
      title: 'Burger King & Faturamento B2B',
      subtitle: 'Controle de lojas, fotos de fachada, ordens de serviço e fluxo de recebíveis.',
      searchPlaceholder: 'Buscar loja, shopping ou NF...',
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
  const showSearch = ['contratos', 'eventos', 'clientes', 'burger-king'].includes(currentTab);

  return (
    <header className="h-16 sm:h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
            {currentInfo.title}
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {showSearch && onSearchChange && (
          <div className="relative w-36 sm:w-60">
            <Search className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={currentInfo.searchPlaceholder || 'Buscar...'}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
        )}

        {/* Botão de Alternar Modo Claro / Modo Escuro */}
        <button
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all active:scale-95"
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {currentTab !== 'novo-contrato' && (
          <button
            onClick={onNewContractClick}
            className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs shadow-primary-glow transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Novo Contrato</span>
            <span className="sm:hidden">Novo</span>
          </button>
        )}
      </div>
    </header>
  );
};
