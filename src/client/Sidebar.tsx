import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  FilePlus2,
  FileText,
  DollarSign,
  Coins,
  Sparkles,
  Users,
  Settings,
  Bot,
  ChevronRight,
  X,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export type NavTab =
  | 'dashboard'
  | 'eventos'
  | 'burger-king'
  | 'novo-contrato'
  | 'contratos'
  | 'financeiro'
  | 'custos'
  | 'atracoes'
  | 'clientes'
  | 'configuracoes';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  companyName?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  companyName = 'Robo Led Partner',
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral & métricas',
    },
    {
      id: 'eventos' as NavTab,
      label: 'Eventos & Festas',
      icon: CalendarDays,
      description: 'Casamentos, 15 anos & agenda',
      highlight: true,
    },
    {
      id: 'burger-king' as NavTab,
      label: 'Burger King & B2B',
      icon: Store,
      description: 'Fila 90d & Faturamento BK',
      badge: 'BK',
    },
    {
      id: 'novo-contrato' as NavTab,
      label: 'Novo Contrato',
      icon: FilePlus2,
      description: 'Gerar contrato & PDF',
    },
    {
      id: 'contratos' as NavTab,
      label: 'Contratos',
      icon: FileText,
      description: 'Histórico & arquivos PDF',
    },
    {
      id: 'financeiro' as NavTab,
      label: 'Financeiro',
      icon: DollarSign,
      description: 'Fluxo de caixa & baixas',
    },
    {
      id: 'custos' as NavTab,
      label: 'Custos & DRE',
      icon: Coins,
      description: 'Custos por evento & DRE',
    },
    {
      id: 'atracoes' as NavTab,
      label: 'Robôs & Personagens',
      icon: Sparkles,
      description: 'Catálogo de atrações',
    },
    {
      id: 'clientes' as NavTab,
      label: 'Clientes',
      icon: Users,
      description: 'Base de contatos',
    },
    {
      id: 'configuracoes' as NavTab,
      label: 'Configurações & API',
      icon: Settings,
      description: 'Empresa & integração',
    },
  ];

  const handleSelect = (id: NavTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Brand Top Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-dark-850 to-dark-800">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-dark-900 border border-brand-500/40 shadow-lg shadow-brand-500/20 overflow-hidden shrink-0 group">
              <img
                src="/assets/branding/robo-avatar.png"
                alt="Robo Led Partner"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Bot className="w-6 h-6 text-brand-400 absolute hidden pointer-events-none" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-black tracking-tight text-white leading-none truncate flex items-center gap-1.5">
                <span>Robo Led Partner</span>
              </h1>
              <p className="text-[11px] font-semibold text-brand-400 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline text-brand-400 animate-pulse" /> Eventos & Contratos
              </p>
            </div>
          </div>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full group flex items-center justify-between p-2.5 rounded-xl text-left font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 via-pink-600 to-purple-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.highlight
                        ? 'bg-brand-500/15 text-brand-400 group-hover:bg-brand-500/25'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-none truncate">{item.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-normal truncate ${
                        isActive ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {item.badge && !isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-white/90" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session & Logout */}
      <div className="p-3 m-3 mb-1 rounded-2xl bg-dark-900/90 border border-slate-800 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-brand-500/20">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="overflow-hidden min-w-0">
              <span className="text-[11px] font-bold text-white block truncate">
                {user?.name || 'Robo Led Partner'}
              </span>
              <span className="text-[10px] text-brand-300/80 font-mono block truncate">
                {user?.email || 'roboledpartner@gmail.com'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sair do Sistema / Desconectar"
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer Info Badge */}
      <div className="p-3.5 m-3 mt-1 rounded-2xl bg-gradient-to-b from-dark-800 to-dark-850 border border-slate-800/90 text-xs shadow-inner">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="font-bold text-slate-200 truncate">{companyName}</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>Sistema Operacional</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-mono font-bold">v2.0 PRO</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-72 bg-dark-850 border-r border-slate-800/80 flex-col justify-between shrink-0 select-none overflow-y-auto">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden flex"
          onClick={onCloseMobile}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-dark-850 border-r border-slate-800 shadow-2xl flex flex-col justify-between select-none overflow-y-auto animate-slideRight"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};


