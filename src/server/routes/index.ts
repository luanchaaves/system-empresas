import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller.js';
import { ConfigController } from '../controllers/config.controller.js';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { EventController } from '../controllers/event.controller.js';
import { FinancialController } from '../controllers/financial.controller.js';
import { AttractionController } from '../controllers/attraction.controller.js';
import { ClientController } from '../controllers/client.controller.js';
import { IntegrationController } from '../controllers/integration.controller.js';
import { CostController } from '../controllers/cost.controller.js';
import { requireApiKey } from '../middlewares/auth.middleware.js';

export const apiRouter = Router();

// 1. Dashboard
apiRouter.get('/dashboard', DashboardController.getStats);

// 2. Contratos
apiRouter.get('/contratos', ContractController.list);
apiRouter.post('/contratos', ContractController.create);
apiRouter.get('/contratos/:id', ContractController.getById);
apiRouter.put('/contratos/:id', ContractController.update);
apiRouter.delete('/contratos/:id', ContractController.delete);
apiRouter.post('/contratos/:id/duplicate', ContractController.duplicate);
apiRouter.post('/contratos/:id/regenerate-pdf', ContractController.regeneratePdf);
apiRouter.get('/contratos/:id/html', ContractController.getHtml);
apiRouter.get('/contratos/:id/pdf', ContractController.downloadPdf);
apiRouter.post('/preview', ContractController.preview);
apiRouter.post('/contratos/gerar-todos', async (_req, res) => {
  try {
    const { generateAllContractsForEvents } = await import('../db/generate-all-contracts.js');
    const result = await generateAllContractsForEvents();
    res.json({ success: true, message: 'Contratos gerados com sucesso!', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Eventos & Agenda
apiRouter.get('/eventos', EventController.list);
apiRouter.post('/eventos', EventController.create);
apiRouter.get('/eventos/:id', EventController.getById);
apiRouter.put('/eventos/:id', EventController.update);
apiRouter.delete('/eventos/:id', EventController.delete);
apiRouter.post('/eventos/:id/gerar-contrato', EventController.generateContractFromEvent);
apiRouter.post('/eventos/:id/google-sync', EventController.syncGoogle);

// 4. Financeiro & Fluxo de Caixa
apiRouter.get('/financeiro/stats', FinancialController.getStats);
apiRouter.get('/financeiro', FinancialController.list);
apiRouter.post('/financeiro', FinancialController.create);
apiRouter.post('/financeiro/deduplicar', FinancialController.deduplicate);
apiRouter.get('/financeiro/:id', FinancialController.getById);
apiRouter.put('/financeiro/:id', FinancialController.update);
apiRouter.delete('/financeiro/:id', FinancialController.delete);
apiRouter.post('/financeiro/:id/baixar', FinancialController.settle);
apiRouter.post('/financeiro/:id/cancelar', FinancialController.cancel);

// 4.1. Custos & Despesas (DRE, Custos por Evento e Compras/Investimentos)
apiRouter.get('/custos/kpis', CostController.getSummary);
apiRouter.get('/custos/eventos', CostController.listEventCosts);
apiRouter.get('/custos/eventos/:eventoId', CostController.getEventCost);
apiRouter.post('/custos/eventos/:eventoId', CostController.saveEventCost);
apiRouter.post('/custos/eventos/:eventoId/toggle-pago', CostController.togglePagoField);
apiRouter.get('/custos/despesas-gerais', CostController.listGeneralExpenses);
apiRouter.post('/custos/despesas-gerais', CostController.createGeneralExpense);
apiRouter.put('/custos/despesas-gerais/:id', CostController.updateGeneralExpense);
apiRouter.delete('/custos/despesas-gerais/:id', CostController.deleteGeneralExpense);

// 5. Catálogo de Atrações & Personagens
apiRouter.get('/atracoes', AttractionController.list);
apiRouter.post('/atracoes', AttractionController.create);
apiRouter.get('/atracoes/:id', AttractionController.getById);
apiRouter.put('/atracoes/:id', AttractionController.update);
apiRouter.delete('/atracoes/:id', AttractionController.delete);

// 6. Clientes & Histórico
apiRouter.get('/clientes', ClientController.list);
apiRouter.post('/clientes', ClientController.createOrUpdate);
apiRouter.get('/clientes/:id', ClientController.getById);
apiRouter.delete('/clientes/:id', ClientController.delete);

// 7. Configurações da Empresa
apiRouter.get('/configuracoes', ConfigController.get);
apiRouter.put('/configuracoes', ConfigController.update);
apiRouter.post('/configuracoes/gerar-api-key', ConfigController.generateApiKey);
apiRouter.post('/configuracoes/google-test', ConfigController.testGoogleCalendar);


// 8. Integração Externa API REST v1 (LED Partner / Webhooks)
apiRouter.post('/v1/eventos/importar', requireApiKey, IntegrationController.importEvent);
apiRouter.post('/v1/financeiro/webhook', requireApiKey, IntegrationController.financialWebhook);
apiRouter.get('/v1/eventos', requireApiKey, EventController.list);
apiRouter.get('/v1/clientes', requireApiKey, ClientController.list);

// 9. Carga de Eventos das Planilhas
apiRouter.post('/seed/import-sheet-events', async (_req, res) => {
  try {
    const { seedSheetEvents } = await import('../db/seedSheetEvents.js');
    const result = seedSheetEvents();
    res.json({ success: true, message: 'Eventos importados com sucesso!', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

