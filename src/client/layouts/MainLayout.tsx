import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from '../components/Sidebar.js';
import { Header } from '../components/Header.js';
import { api } from '../api/index.js';
import {
  LayoutDashboard,
  CalendarDays,
  FilePlus2,
  DollarSign,
  Menu,
} from 'lucide-react';

interface MainLayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  searchQuery,
  onSearchChange,
}) => {
  const [companyName, setCompanyName] = useState<string>('Robo Led Partner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    api
      .getConfig()
      .then((cfg) => setCompanyName(cfg.company_name))
      .catch(() => {});
  }, [currentTab]);

  return (
    <div className="flex h-screen w-full bg-dark-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar (Desktop Fixed + Mobile Off-Canvas Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        companyName={companyName}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <Header
          currentTab={currentTab}
          onNewContractClick={() => onSelectTab('novo-contrato')}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 min-w-0 bg-gradient-to-b from-dark-900 via-dark-850 to-dark-900">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Shown only on small screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-dark-850/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'dashboard' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1">Painel</span>
        </button>

        <button
          onClick={() => onSelectTab('eventos')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'eventos' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span className="text-[10px] mt-1">Agenda</span>
        </button>

        {/* Central Glowing Action Button */}
        <button
          onClick={() => onSelectTab('novo-contrato')}
          className="flex flex-col items-center justify-center -top-3 relative px-3 transition-transform active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 via-pink-600 to-purple-600 shadow-lg shadow-brand-600/40 flex items-center justify-center text-white border-2 border-dark-900">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-white mt-0.5">Contrato</span>
        </button>

        <button
          onClick={() => onSelectTab('financeiro')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'financeiro' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px] mt-1">Financeiro</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1">Mais</span>
        </button>
      </nav>
    </div>
  );
};
