import { Request, Response } from 'express';
import { ContractService } from '../services/contract.service.js';

export const DashboardController = {
  getStats(_req: Request, res: Response): void {
    try {
      const stats = ContractService.getDashboardStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas do dashboard:', err);
      res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
    }
  },
};
