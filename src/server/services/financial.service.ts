import { FinancialRepository, ContractRepository, EventRepository } from '../db/database.js';
import {
  FinancialEntry,
  CreateFinancialEntryDTO,
  SettleFinancialEntryDTO,
  FinancialStats,
  PaymentStatus,
  PaymentMethod,
} from '../../types/index.js';
import { calculatePaymentSplit } from '../../domain/calculations.js';

export const FinancialService = {
  list(filters?: {
    status?: PaymentStatus;
    eventoId?: number;
    contratoId?: number;
    clienteId?: number;
    startDate?: string;
    endDate?: string;
  }): FinancialEntry[] {
    return FinancialRepository.list(filters);
  },

  getById(id: number): FinancialEntry {
    const entry = FinancialRepository.findById(id);
    if (!entry) {
      throw new Error(`Lançamento financeiro com ID ${id} não encontrado.`);
    }
    return entry;
  },

  create(data: CreateFinancialEntryDTO): FinancialEntry {
    if (!data.valor || data.valor <= 0) {
      throw new Error('O valor do lançamento financeiro deve ser maior que zero.');
    }
    if (!data.data_vencimento) {
      throw new Error('A data de vencimento é obrigatória.');
    }

    return FinancialRepository.create({
      evento_id: data.evento_id,
      contrato_id: data.contrato_id,
      cliente_id: data.cliente_id,
      descricao: data.descricao.trim(),
      tipo_parcela: data.tipo_parcela,
      valor: Number(data.valor),
      data_vencimento: data.data_vencimento,
      status: 'PENDENTE',
      forma_pagamento: data.forma_pagamento,
    });
  },

  settle(id: number, data: SettleFinancialEntryDTO): FinancialEntry {
    if (!data.forma_pagamento) {
      throw new Error('Informe a forma de pagamento (ex: PIX, Dinheiro, Cartão).');
    }
    return FinancialRepository.settle(id, data);
  },

  update(id: number, data: Partial<FinancialEntry>): FinancialEntry {
    return FinancialRepository.update(id, data);
  },

  delete(id: number): boolean {
    return FinancialRepository.delete(id);
  },

  cancel(id: number): FinancialEntry {
    return FinancialRepository.cancel(id);
  },

  getStats(): FinancialStats {
    return FinancialRepository.getStats();
  },

  /**
   * Remove lançamentos financeiros duplicados no banco de dados mantendo os mais completos/pagos
   */
  deduplicate(): { removedCount: number; remainingCount: number } {
    const allEntries = FinancialRepository.list();
    const eventGroups = new Map<number, FinancialEntry[]>();

    for (const entry of allEntries) {
      if (!entry.evento_id) continue;
      const group = eventGroups.get(entry.evento_id) || [];
      group.push(entry);
      eventGroups.set(entry.evento_id, group);
    }

    let removedCount = 0;

    for (const [eventoId, group] of eventGroups.entries()) {
      // Agrupa por tipo de parcela ('ENTRADA', 'RESTANTE', 'PARCELA_UNICA')
      const typeGroups = new Map<string, FinancialEntry[]>();
      for (const e of group) {
        const typeKey = e.tipo_parcela;
        const list = typeGroups.get(typeKey) || [];
        list.push(e);
        typeGroups.set(typeKey, list);
      }

      for (const [tipo, list] of typeGroups.entries()) {
        if (list.length > 1) {
          // Prioridade para manter:
          // 1. Status 'PAGO'
          // 2. Possui contrato_id preenchido
          // 3. ID mais recente ou mais antigo
          list.sort((a, b) => {
            if (a.status === 'PAGO' && b.status !== 'PAGO') return -1;
            if (b.status === 'PAGO' && a.status !== 'PAGO') return 1;
            if (a.contrato_id && !b.contrato_id) return -1;
            if (!a.contrato_id && b.contrato_id) return 1;
            return b.id - a.id;
          });

          // Mantém o primeiro da lista ordenada e exclui os outros
          const toKeep = list[0];
          const toDelete = list.slice(1);

          for (const d of toDelete) {
            FinancialRepository.delete(d.id);
            removedCount++;
          }
        }
      }
    }

    const remaining = FinancialRepository.list().length;
    return { removedCount, remainingCount: remaining };
  },

  /**
   * Gera automaticamente as duas parcelas padrão (40% de Sinal + 60% Saldo no Evento)
   * Se já existirem parcelas para o evento, apenas atualiza o vínculo do contrato para evitar duplicações!
   */
  generateStandardInstallments(params: {
    eventoId: number;
    contratoId?: number;
    clienteId: number;
    totalValue: number;
    eventDate: string;
    percentualEntrada?: number;
    percentualRestante?: number;
    contratoNumero?: string;
  }): FinancialEntry[] {
    // 1. Verifica se já existem lançamentos para este evento
    const existing = FinancialRepository.list({ eventoId: params.eventoId });
    if (existing.length > 0) {
      const updatedEntries: FinancialEntry[] = [];
      for (const entry of existing) {
        const numRef = params.contratoNumero ? ` - Contrato ${params.contratoNumero}` : '';
        const updated = FinancialRepository.update(entry.id, {
          contrato_id: params.contratoId || entry.contrato_id,
          cliente_id: params.clienteId || entry.cliente_id,
          descricao: entry.descricao.includes('Contrato') ? entry.descricao : `${entry.descricao}${numRef}`,
        });
        updatedEntries.push(updated);
      }
      return updatedEntries;
    }

    const { valorEntrada, valorRestante } = calculatePaymentSplit(
      params.totalValue,
      params.percentualEntrada || 40
    );

    const today = new Date().toISOString().split('T')[0];
    const numRef = params.contratoNumero ? ` - Contrato ${params.contratoNumero}` : '';

    // 1. Parcela de Entrada (40%)
    const entradaEntry = FinancialRepository.create({
      evento_id: params.eventoId,
      contrato_id: params.contratoId,
      cliente_id: params.clienteId,
      descricao: `Sinal de Entrada (${params.percentualEntrada || 40}%)${numRef}`,
      tipo_parcela: 'ENTRADA',
      valor: valorEntrada,
      data_vencimento: today,
      status: 'PENDENTE',
    });

    // 2. Parcela Restante (60%)
    const restanteEntry = FinancialRepository.create({
      evento_id: params.eventoId,
      contrato_id: params.contratoId,
      cliente_id: params.clienteId,
      descricao: `Saldo Restante (${params.percentualRestante || 60}%)${numRef}`,
      tipo_parcela: 'RESTANTE',
      valor: valorRestante,
      data_vencimento: params.eventDate || today,
      status: 'PENDENTE',
    });

    return [entradaEntry, restanteEntry];
  },
};
