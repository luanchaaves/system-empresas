import { Request, Response } from 'express';
import { CompanyRepository } from '../db/database.js';
import { GoogleCalendarService } from '../services/google-calendar.service.js';

export const ConfigController = {
  get(_req: Request, res: Response): void {
    try {
      const config = CompanyRepository.get();
      res.json(config);
    } catch (err: any) {
      console.error('Erro ao buscar configurações:', err);
      res.status(500).json({ error: 'Erro ao carregar configurações da empresa.' });
    }
  },

  update(req: Request, res: Response): void {
    try {
      const updated = CompanyRepository.update(req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Erro ao atualizar configurações:', err);
      res.status(400).json({ error: err.message || 'Erro ao salvar configurações.' });
    }
  },

  generateApiKey(_req: Request, res: Response): void {
    try {
      const key = CompanyRepository.generateApiKey();
      res.json({ api_key: key });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao gerar nova Chave de API.' });
    }
  },

  async testGoogleCalendar(_req: Request, res: Response): Promise<void> {
    try {
      const result = await GoogleCalendarService.testConnection();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Erro ao testar Google Agenda.' });
    }
  },
};
