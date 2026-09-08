import { Request, Response } from 'express';
import { AttractionService } from '../services/attraction.service.js';
import { AttractionCategory } from '../../types/index.js';

export const AttractionController = {
  list(req: Request, res: Response): void {
    try {
      const category = req.query.categoria as AttractionCategory | undefined;
      const onlyActive = req.query.ativo === 'true';
      const attractions = AttractionService.list(category, onlyActive);
      res.json(attractions);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar atrações.' });
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const attraction = AttractionService.getById(id);
      res.json(attraction);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Atração não encontrada.' });
    }
  },

  create(req: Request, res: Response): void {
    try {
      const attraction = AttractionService.create(req.body);
      res.status(201).json(attraction);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar atração.' });
    }
  },

  update(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const attraction = AttractionService.update(id, req.body);
      res.json(attraction);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar atração.' });
    }
  },

  delete(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const success = AttractionService.delete(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao excluir atração.' });
    }
  },
};

