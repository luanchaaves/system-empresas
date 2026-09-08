import { Request, Response } from 'express';
import { CostRepository } from '../db/database.js';

export const CostController = {
  getSummary(_req: Request, res: Response): void {
    try {
      const summary = CostRepository.getCostsSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar resumo de custos.' });
    }
  },

  listEventCosts(req: Request, res: Response): void {
    try {
      const { search } = req.query;
      const list = CostRepository.listEventCosts(search as string);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar custos dos eventos.' });
    }
  },

  getEventCost(req: Request, res: Response): void {
    try {
      const eventoId = parseInt(String(req.params.eventoId), 10);
      const cost = CostRepository.getEventCosts(eventoId);
      if (!cost) {
        res.status(404).json({ error: 'Custos do evento não encontrados.' });
        return;
      }
      res.json(cost);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao obter custos do evento.' });
    }
  },

  saveEventCost(req: Request, res: Response): void {
    try {
      const eventoId = parseInt(String(req.params.eventoId), 10);
      const saved = CostRepository.saveEventCost({ ...req.body, evento_id: eventoId });
      res.json(saved);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao salvar custos do evento.' });
    }
  },

  togglePagoField(req: Request, res: Response): void {
    try {
      const eventoId = parseInt(String(req.params.eventoId), 10);
      const { field } = req.body;
      if (!['pago_ajudante', 'pago_monitor', 'status_custos'].includes(field)) {
        res.status(400).json({ error: 'Campo inválido para toggle de pagamento.' });
        return;
      }
      const updated = CostRepository.togglePagoField(eventoId, field);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao alternar status de pagamento.' });
    }
  },

  listGeneralExpenses(req: Request, res: Response): void {
    try {
      const { tipo, pago, search } = req.query;
      const list = CostRepository.listGeneralExpenses({
        tipo: tipo as string,
        pago: pago !== undefined ? parseInt(String(pago), 10) : undefined,
        search: search as string,
      });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar despesas gerais.' });
    }
  },

  createGeneralExpense(req: Request, res: Response): void {
    try {
      const { item, fornecedor, valor, data, pago, tipo_gasto, observacoes } = req.body;
      if (!item || !valor || !data || !tipo_gasto) {
        res.status(400).json({ error: 'Item, valor, data e tipo de gasto são obrigatórios.' });
        return;
      }
      const created = CostRepository.createGeneralExpense({
        item,
        fornecedor,
        valor: Number(valor),
        data,
        pago: pago !== undefined ? Number(pago) : 1,
        tipo_gasto,
        observacoes,
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar despesa geral.' });
    }
  },

  updateGeneralExpense(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = CostRepository.updateGeneralExpense(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Despesa não encontrada.' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar despesa.' });
    }
  },

  deleteGeneralExpense(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const success = CostRepository.deleteGeneralExpense(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao excluir despesa.' });
    }
  },
};
