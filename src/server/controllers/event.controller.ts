import { Request, Response } from 'express';
import { EventService } from '../services/event.service.js';
import { ContractService } from '../services/contract.service.js';
import { EventStatus, AttractionType } from '../../types/index.js';

export const EventController = {
  list(req: Request, res: Response): void {
    try {
      const { search, status, startDate, endDate, canalB2B, tipoEvento, isB2B, isSocial } = req.query;
      const events = EventService.list({
        search: search as string,
        status: status as EventStatus,
        startDate: startDate as string,
        endDate: endDate as string,
        canalB2B: canalB2B as string,
        tipoEvento: tipoEvento as any,
        isB2B: isB2B === 'true' || isB2B === '1',
        isSocial: isSocial === 'true' || isSocial === '1',
      });
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao listar eventos.' });
    }
  },

  getById(req: Request, res: Response): void {
    try {
      const id = parseInt(String(req.params.id), 10);
      const event = EventService.getById(id);
      res.json(event);
    } catch (err: any) {
      res.status(404).json({ error: err.message || 'Evento não encontrado.' });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const event = await EventService.create(req.body);
      res.status(201).json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar evento.' });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const event = await EventService.update(id, req.body);
      res.json(event);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar evento.' });
    }
  },

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const success = await EventService.delete(id);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao excluir evento.' });
    }
  },

  /**
   * Sincroniza manualmente o evento com o Google Calendar
   */
  async syncGoogle(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await EventService.syncGoogleCalendar(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao sincronizar com Google Agenda.' });
    }
  },

  /**
   * 1-Click: Gera Contrato PDF oficial a partir de um Evento existente
   */
  async generateContractFromEvent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const event = EventService.getById(id);

      if (!event.cliente) {
        res.status(400).json({ error: 'Evento não possui dados completos do cliente para gerar contrato.' });
        return;
      }

      const tipo: AttractionType = req.body.tipo || (event.atracoes?.some(a => a.atracao?.categoria === 'ROBO_LED') ? 'ROBO_LED' : 'PERSONAGEM');
      const personagem = req.body.personagem || event.atracoes?.map(a => a.atracao?.nome).join(', ') || '';
      const valorTotal = req.body.valor_total || event.valor_total || 600;

      const contract = await ContractService.createContract({
        cliente_nome: event.cliente.nome,
        cliente_cpf: event.cliente.cpf,
        cliente_endereco: event.cliente.endereco || event.endereco,
        cliente_telefone: event.cliente.telefone,
        cliente_email: event.cliente.email,
        evento_id: event.id,
        nome_evento: event.nome_evento,
        tipo_evento: event.tipo_evento,
        evento_data: event.data,
        evento_horario: event.horario,
        evento_endereco: event.endereco,
        evento_cidade: event.cidade,
        evento_estado: event.estado,
        evento_duracao: event.duracao,
        evento_observacoes: event.observacoes,
        tipo,
        personagem,
        quantidade_personagens: event.atracoes?.length || 1,
        valor_total: valorTotal,
      });

      res.status(201).json(contract);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao gerar contrato a partir do evento.' });
    }
  },
};
