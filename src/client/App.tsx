import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { LoginPage } from './pages/LoginPage.js';
import { MainLayout } from './layouts/MainLayout.js';
import { NavTab } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AgendaPage } from './pages/AgendaPage.js';
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
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f2f5fb] p-6 text-slate-800">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-slate-100 shadow-clean-lg text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Algo inesperado ocorreu</h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'Ocorreu um erro temporário na renderização do painel.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-extrabold text-xs shadow-primary-glow hover:opacity-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Painel
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
          onNavigateToEvents={() => setCurrentTab('agenda')}
          onNavigateToFinancial={() => setCurrentTab('financeiro')}
        />
      )}

      {currentTab === 'agenda' && (
        <AgendaPage
          onNavigateToNewContract={() => setCurrentTab('novo-contrato')}
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
