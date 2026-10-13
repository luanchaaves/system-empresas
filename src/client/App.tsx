import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { MainLayout } from './layouts/MainLayout.js';
import { NavTab } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EventosPage } from './pages/EventosPage.js';
import { BurgerKingPage } from './pages/BurgerKingPage.js';
import { NovoContratoPage } from './pages/NovoContratoPage.js';
import { ContratosPage } from './pages/ContratosPage.js';
import { FinanceiroPage } from './pages/FinanceiroPage.js';
import { CustosPage } from './pages/CustosPage.js';
import { AtracoesPage } from './pages/AtracoesPage.js';
import { ClientesPage } from './pages/ClientesPage.js';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage.js';
import { Client } from '../types/index.js';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientForEvent, setSelectedClientForEvent] = useState<Client | undefined>(undefined);

  // Tela de Carregamento Inicial Clean
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f2f5fb] text-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-clean-md animate-bounce">
            <Sparkles className="w-7 h-7 text-primary-600 animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-black tracking-tight text-slate-900">Robô LED Partner</h2>
            <p className="text-xs text-slate-500 mt-0.5">Carregando painel...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se não autenticado, renderiza a tela de login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <MainLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setCurrentTab(tab);
        setSearchQuery('');
        if (tab !== 'eventos') {
          setSelectedClientForEvent(undefined);
        }
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToNew={() => setCurrentTab('novo-contrato')}
          onNavigateToContracts={() => setCurrentTab('contratos')}
          onNavigateToEvents={() => setCurrentTab('eventos')}
          onNavigateToFinancial={() => setCurrentTab('financeiro')}
        />
      )}

      {currentTab === 'eventos' && (
        <EventosPage
          searchQuery={searchQuery}
          initialClient={selectedClientForEvent}
          onNavigateToNewContractWithEvent={(_event) => {
            setCurrentTab('novo-contrato');
          }}
        />
      )}

      {currentTab === 'burger-king' && (
        <BurgerKingPage
          searchQuery={searchQuery}
          onNavigateToFinancial={() => setCurrentTab('financeiro')}
        />
      )}

      {currentTab === 'novo-contrato' && (
        <NovoContratoPage
          onContractCreated={(_id) => {
            setCurrentTab('contratos');
          }}
        />
      )}

      {currentTab === 'contratos' && (
        <ContratosPage
          onNavigateToNew={() => setCurrentTab('novo-contrato')}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {currentTab === 'financeiro' && <FinanceiroPage />}

      {currentTab === 'custos' && <CustosPage />}

      {currentTab === 'atracoes' && <AtracoesPage />}

      {currentTab === 'clientes' && (
        <ClientesPage
          searchQuery={searchQuery}
          onNavigateToEvents={(client) => {
            setSelectedClientForEvent(client);
            setCurrentTab('eventos');
          }}
        />
      )}

      {currentTab === 'configuracoes' && <ConfiguracoesPage />}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
