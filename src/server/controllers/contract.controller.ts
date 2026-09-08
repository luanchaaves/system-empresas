import { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { ContractRepository, ClientRepository } from '../db/database.js';
import { ContractService } from '../services/contract.service.js';
import { CreateContractDTO, AttractionType, ContractStatus } from '../../types/index.js';

export const ContractController = {
  /**
   * GET /api/contratos
   */
  list(req: Request, res: Response): void {
    try {
      const search = req.query.search as string | undefined;
      const tipo = req.query.tipo as AttractionType | undefined;
      const status = req.query.status as ContractStatus | undefined;

      const contracts = ContractRepository.list({ search, tipo, status });
      res.json(contracts);
    } catch (err: any) {
      console.error('Erro ao listar contratos:', err);
      res.status(500).json({ error: 'Não foi possível carregar os contratos. Tente novamente mais tarde.' });
    }
  },

  /**
   * GET /api/contratos/:id
   */
  getById(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID do contrato inválido.' });
        return;
      }

      const contract = ContractRepository.findById(id);
      if (!contract) {
        res.status(404).json({ error: 'Contrato não encontrado.' });
        return;
      }

      res.json(contract);
    } catch (err: any) {
      console.error('Erro ao obter contrato:', err);
      res.status(500).json({ error: 'Erro ao buscar detalhes do contrato.' });
    }
  },

  /**
   * POST /api/contratos
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateContractDTO = req.body;
      const contract = await ContractService.createContract(dto);
      res.status(201).json(contract);
    } catch (err: any) {
      console.error('Erro ao criar contrato:', err);
      res.status(400).json({ error: err.message || 'Não foi possível gerar o contrato. Verifique os dados informados.' });
    }
  },

  /**
   * PUT /api/contratos/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const updated = await ContractService.updateContract(id, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Erro ao atualizar contrato:', err);
      res.status(400).json({ error: err.message || 'Erro ao atualizar contrato.' });
    }
  },

  /**
   * POST /api/contratos/:id/duplicate
   */
  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const duplicated = await ContractService.duplicateContract(id);
      res.status(201).json(duplicated);
    } catch (err: any) {
      console.error('Erro ao duplicar contrato:', err);
      res.status(400).json({ error: err.message || 'Erro ao duplicar contrato.' });
    }
  },

  /**
   * POST /api/contratos/:id/regenerate-pdf
   */
  async regeneratePdf(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const updated = await ContractService.regeneratePdf(id);
      res.json(updated);
    } catch (err: any) {
      console.error('Erro ao regenerar PDF:', err);
      res.status(500).json({ error: err.message || 'Erro ao regenerar arquivo PDF.' });
    }
  },

  /**
   * DELETE /api/contratos/:id
   */
  delete(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido.' });
        return;
      }

      const success = ContractRepository.delete(id);
      if (!success) {
        res.status(404).json({ error: 'Contrato não encontrado.' });
        return;
      }

      res.json({ message: 'Contrato excluído com sucesso.' });
    } catch (err: any) {
      console.error('Erro ao excluir contrato:', err);
      res.status(500).json({ error: 'Erro ao excluir contrato.' });
    }
  },

  /**
   * GET /api/contratos/:id/html
   */
  getHtml(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const contract = ContractRepository.findById(id);
      if (!contract) {
        res.status(404).send('Contrato não encontrado.');
        return;
      }

      const html = ContractService.getPreviewHtml(contract);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) {
      console.error('Erro ao gerar HTML do contrato:', err);
      res.status(500).send('Erro ao renderizar visualização do contrato.');
    }
  },

  /**
   * GET /api/contratos/:id/pdf
   */
  downloadPdf(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const contract = ContractRepository.findById(id);
      if (!contract || !contract.pdf_path) {
        res.status(404).json({ error: 'Arquivo PDF não encontrado.' });
        return;
      }

      const fullPath = path.resolve(process.cwd(), contract.pdf_path);
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ error: 'O arquivo PDF não existe fisicamente no disco.' });
        return;
      }

      const fileName = path.basename(fullPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      fs.createReadStream(fullPath).pipe(res);
    } catch (err: any) {
      console.error('Erro ao servir PDF:', err);
      res.status(500).json({ error: 'Erro ao abrir o arquivo PDF.' });
    }
  },

  /**
   * POST /api/preview
   */
  preview(req: Request, res: Response): void {
    try {
      const dto: CreateContractDTO = req.body;
      const html = ContractService.getPreviewHtml(dto);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err: any) {
      console.error('Erro no preview:', err);
      res.status(400).send(`Erro ao gerar prévia: ${err.message}`);
    }
  },

  /**
   * GET /api/clientes
   */
  listClients(_req: Request, res: Response): void {
    try {
      const clients = ClientRepository.list();
      res.json(clients);
    } catch (err: any) {
      console.error('Erro ao listar clientes:', err);
      res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
  },
};
