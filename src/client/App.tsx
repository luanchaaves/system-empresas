import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext.js';
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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientForEvent, setSelectedClientForEvent] = useState<Client | undefined>(undefined);

  return (
    <ToastProvider>
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
    </ToastProvider>
  );
};

export default App;
