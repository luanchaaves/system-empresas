import { Request, Response } from 'express';
import { FinancialService } from '../services/financial.service.js';
import { PaymentStatus } from '../../types/index.js';

export const FinancialController = {
  list(req: Request, res: Response): void {
    try {
      const { status, eventoId, contratoId, clienteId, startDate, endDate } = req.query;
      const entries = FinancialService.list({
        status: status as PaymentStatus,
        eventoId: eventoId ? parseInt(eventoId as string, 10) : undefined,
        contratoId: contratoId ? parseInt(contratoId as string, 10) : undefined,
        clienteId: clienteId ? parseInt(clienteId as string, 10) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar lançamentos financeiros.' });
    }
  },

  getStats(req: Request, res: Response): void {
    try {
      const stats = FinancialService.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao obter métricas financeiras.' });
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const entry = FinancialService.getById(id);
      res.json(entry);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Lançamento não encontrado.' });
    }
  },

  create(req: Request, res: Response): void {
    try {
      const entry = FinancialService.create(req.body);
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar lançamento financeiro.' });
    }
  },

  settle(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const settled = FinancialService.settle(id, req.body);
      res.json(settled);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao dar baixa no pagamento.' });
    }
  },

  update(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = FinancialService.update(id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar lançamento financeiro.' });
    }
  },

  delete(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const success = FinancialService.delete(id);
      res.json({ success, message: 'Lançamento financeiro excluído com sucesso.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao excluir lançamento financeiro.' });
    }
  },

  cancel(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const cancelled = FinancialService.cancel(id);
      res.json(cancelled);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao cancelar lançamento.' });
    }
  },

  deduplicate(_req: Request, res: Response): void {
    try {
      const result = FinancialService.deduplicate();
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao limpar duplicidades financeiras.' });
    }
  },
};

