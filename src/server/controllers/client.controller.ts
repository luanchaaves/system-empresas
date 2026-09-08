import { Request, Response } from 'express';
import { ClientRepository, EventRepository, ContractRepository, FinancialRepository } from '../db/database.js';

export const ClientController = {
  list(req: Request, res: Response): void {
    try {
      const search = req.query.search as string | undefined;
      const clients = ClientRepository.list(search);
      res.json(clients);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar clientes.' });
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const client = ClientRepository.findById(id);
      if (!client) {
        res.status(404).json({ error: 'Cliente não encontrado.' });
        return;
      }

      // Adiciona histórico de eventos, contratos e financeiro
      const events = EventRepository.list().filter(e => e.cliente_id === id);
      const contracts = ContractRepository.list().filter(c => c.cliente_id === id);
      const finance = FinancialRepository.list({ clienteId: id });

      res.json({
        ...client,
        eventos: events,
        contratos: contracts,
        financeiro: finance,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao carregar detalhes do cliente.' });
    }
  },

  createOrUpdate(req: Request, res: Response): void {
    try {
      const { nome, cpf, endereco, telefone, email } = req.body;
      if (!nome || !cpf) {
        res.status(400).json({ error: 'Nome e CPF são obrigatórios.' });
        return;
      }
      const client = ClientRepository.createOrUpdate({
        nome: nome.trim(),
        cpf: cpf.trim(),
        endereco: endereco?.trim() || 'A definir',
        telefone: telefone?.trim(),
        email: email?.trim(),
      });
      res.status(200).json(client);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao salvar cliente.' });
    }
  },

  delete(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const success = ClientRepository.delete(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao excluir cliente.' });
    }
  },
};

