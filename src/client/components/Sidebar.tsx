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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';

export type NavTab =
  | 'dashboard'
  | 'agenda'
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
  companyName = 'Robô LED Partner',
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral & métricas',
    },
    {
      id: 'agenda' as NavTab,
      label: 'Agenda de Shows',
      icon: CalendarDays,
      description: 'Google Agenda & Calendário',
      badge: 'Google',
      highlight: true,
    },
    {
      id: 'eventos' as NavTab,
      label: 'Eventos & Festas',
      icon: CalendarDays,
      description: 'Casamentos, 15 anos & lista',
    },
    {
      id: 'burger-king' as NavTab,
      label: 'Burger King & B2B',
      icon: Store,
      description: 'Lojas, fotos & recebíveis',
      badge: 'BK',
    },
    {
      id: 'novo-contrato' as NavTab,
      label: 'Novo Contrato',
      icon: FilePlus2,
      description: 'Gerador ágil de contrato',
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
      description: 'Custos por show & Lucro Real',
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
      label: 'Configurações',
      icon: Settings,
      description: 'Empresa & API',
    },
  ];

  const handleSelect = (id: NavTab) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-slate-900 select-none transition-colors">
      <div>
        {/* Brand Top Header com Logo Transparente Flutuando */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/branding/logo.png"
              alt="Robô LED Partner"
              className="h-10 sm:h-11 w-auto object-contain shrink-0 filter drop-shadow-md hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback se não encontrar
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="overflow-hidden">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                Robô LED Partner
              </h1>
              <p className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Painel de Gestão Pro
              </p>
            </div>
          </div>

          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                className={`w-full group flex items-center justify-between p-2.5 rounded-2xl text-left font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 text-white shadow-primary-glow font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`p-2 rounded-xl transition-all shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/60 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-none truncate">{item.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 font-normal truncate ${
                        isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {item.badge && !isActive && (
                    <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
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
      <div className="p-3 m-3 space-y-2 border-t border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'R'}
            </div>
            <div className="overflow-hidden min-w-0">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                {user?.name || 'Robô LED Partner'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono block truncate">
                {user?.email || 'roboledpartner@gmail.com'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              className="p-1.5 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>
            <button
              onClick={logout}
              title="Sair do Sistema / Desconectar"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-100 transition-all shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400 truncate">{companyName}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] font-bold">ONLINE</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-clean flex-col justify-between shrink-0 select-none overflow-y-auto z-30 transition-colors">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm md:hidden flex"
          onClick={onCloseMobile}
        >
          <aside
            className="w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col justify-between select-none overflow-y-auto animate-slideRight"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
