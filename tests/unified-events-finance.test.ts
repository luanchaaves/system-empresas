import { describe, it, expect, beforeAll } from 'vitest';
import { initDatabase, AttractionRepository, ClientRepository, EventRepository, FinancialRepository } from '../src/server/db/database.js';
import { AttractionService } from '../src/server/services/attraction.service.js';
import { EventService } from '../src/server/services/event.service.js';
import { FinancialService } from '../src/server/services/financial.service.js';
import { ContractService } from '../src/server/services/contract.service.js';

describe('Sistema Unificado: Eventos + Atrações + Financeiro + Contratos', () => {
  beforeAll(() => {
    initDatabase();
  });

  it('deve listar o catálogo de atrações e robôs de LED pré-cadastrados', () => {
    const attractions = AttractionService.list();
    expect(attractions.length).toBeGreaterThanOrEqual(5);

    const robo = attractions.find(a => a.categoria === 'ROBO_LED');
    expect(robo).toBeDefined();
    expect(robo?.valor_base).toBeGreaterThan(0);
  });

  it('deve cadastrar um novo evento com cliente e calcular o fluxo de caixa corretamente', async () => {
    const event = await EventService.create({
      cliente_nome: 'Fernanda Lima Teste',
      cliente_cpf: '444.555.666-77',
      cliente_telefone: '(11) 98765-4321',
      cliente_email: 'fernanda@teste.com',
      nome_evento: 'Festa de 15 Anos Fernanda',
      tipo_evento: 'ANIVERSARIO',
      data: '2026-11-15',
      horario: '21:00',
      duracao: 2,
      endereco: 'Buffet Mansão Real, Rua das Acácias 100, Santo André - SP',
      valor_total: 1000,
    });

    expect(event.id).toBeDefined();
    expect(event.cliente_id).toBeDefined();
    expect(event.cliente?.nome).toBe('Fernanda Lima Teste');

    // Verifica se as parcelas financeiras automáticas foram criadas (40% e 60%)
    const entries = FinancialService.list({ eventoId: event.id });
    expect(entries.length).toBe(2);

    const entrada = entries.find(e => e.tipo_parcela === 'ENTRADA');
    const restante = entries.find(e => e.tipo_parcela === 'RESTANTE');

    expect(entrada?.valor).toBe(400); // 40% de 1000
    expect(restante?.valor).toBe(600); // 60% de 1000
    expect(entrada?.status).toBe('PENDENTE');
  });

  it('deve permitir dar baixa no pagamento do sinal via PIX', async () => {
    const event = await EventService.create({
      cliente_nome: 'Carlos Eduardo Pagamento',
      cliente_cpf: '111.222.333-44',
      nome_evento: 'Casamento Carlos e Patricia',
      tipo_evento: 'CASAMENTO',
      data: '2026-12-01',
      horario: '20:00',
      duracao: 2,
      endereco: 'Espaço Jardim, SBC - SP',
      valor_total: 2000,
    });

    const entries = FinancialService.list({ eventoId: event.id });
    const entrada = entries.find(e => e.tipo_parcela === 'ENTRADA')!;

    // Executa baixa
    const settled = FinancialService.settle(entrada.id, {
      forma_pagamento: 'PIX',
      comprovante_ref: 'COMPROVANTE-PIX-123456',
    });

    expect(settled.status).toBe('PAGO');
    expect(settled.forma_pagamento).toBe('PIX');
    expect(settled.data_pagamento).toBeDefined();

    // Valida estatísticas
    const stats = FinancialService.getStats();
    expect(stats.totalRecebido).toBeGreaterThanOrEqual(800);
  });

  it('deve gerar contrato a partir de um evento e sincronizar o contrato_id', async () => {
    const event = await EventService.create({
      cliente_nome: 'Marcos Vinicius Contrato',
      cliente_cpf: '123.456.789-09',
      nome_evento: 'Aniversário Marcos',
      tipo_evento: 'ANIVERSARIO',
      data: '2026-10-10',
      horario: '19:00',
      duracao: 2,
      endereco: 'Buffet Park, Av. Dom Pedro II, Santo André - SP',
      valor_total: 1200,
    });

    const contract = await ContractService.createContract({
      cliente_nome: event.cliente!.nome,
      cliente_cpf: event.cliente!.cpf,
      cliente_endereco: event.endereco,
      evento_id: event.id,
      evento_data: event.data,
      evento_horario: event.horario,
      evento_endereco: event.endereco,
      evento_duracao: event.duracao,
      tipo: 'ROBO_LED',
      valor_total: event.valor_total,
    });

    expect(contract.numero).toMatch(/^RLP-2026-\d{6}$/);
    expect(contract.evento_id).toBe(event.id);

    // Valida se o evento foi atualizado com o ID do contrato
    const updatedEvent = EventService.getById(event.id);
    expect(updatedEvent.contrato_id).toBe(contract.id);
  });

  it('deve gerenciar custos por evento e calcular lucro líquido do evento', async () => {
    const { CostRepository } = await import('../src/server/db/database.js');

    const event = await EventService.create({
      cliente_nome: 'Juliana Paes Custos',
      cliente_cpf: '222.333.444-55',
      nome_evento: 'Aniversário Juliana',
      tipo_evento: 'ANIVERSARIO',
      data: '2026-11-20',
      horario: '20:00',
      duracao: 2,
      endereco: 'Buffet Espaço Cristal, SBC - SP',
      valor_total: 1000,
    });

    // Salva custos do evento: Cilindro R$ 45, Gasolina R$ 50, Ajudante R$ 70, Monitor R$ 150
    const saved = CostRepository.saveEventCost({
      evento_id: event.id,
      cilindro: 45,
      gerb: 20,
      gasolina: 50,
      pedagio: 10,
      vallet: 0,
      ajudante: 70,
      pago_ajudante: 1,
      monitor: 150,
      pago_monitor: 1,
      status_custos: 'PAGO',
    });

    expect(saved.total_custos).toBe(345); // 45+20+50+10+70+150
    expect(saved.lucro_evento).toBe(655); // 1000 - 345
    expect(saved.margem_lucro).toBe(65.5); // 65.5%
    expect(saved.status_custos).toBe('PAGO');

    // Alternar status de pagamento do ajudante
    const toggled = CostRepository.togglePagoField(event.id, 'pago_ajudante');
    expect(toggled.pago_ajudante).toBe(0);
  });

  it('deve gerenciar compras, investimentos e gerar resumo DRE consolidado', async () => {
    const { CostRepository } = await import('../src/server/db/database.js');

    // Cria uma despesa geral
    const exp = CostRepository.createGeneralExpense({
      item: 'Bateria 12v para Peitoral de LED',
      fornecedor: 'Mercado Livre',
      valor: 180.5,
      data: '2026-09-04',
      pago: 1,
      tipo_gasto: 'MELHORIAS',
      observacoes: 'Bateria de alta performance',
    });

    expect(exp.id).toBeDefined();
    expect(exp.valor).toBe(180.5);
    expect(exp.tipo_gasto).toBe('MELHORIAS');

    // Obter resumo de custos DRE
    const summary = CostRepository.getCostsSummary();
    expect(summary.faturamentoTotalEventos).toBeGreaterThan(0);
    expect(summary.totalDespesasGerais).toBeGreaterThanOrEqual(180.5);
    expect(summary.lucroLiquidoReal).toBeDefined();
    expect(summary.margemGeralPercentual).toBeDefined();
  });
});
