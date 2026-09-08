import { Request, Response } from 'express';
import { EventService } from '../services/event.service.js';
import { ContractService } from '../services/contract.service.js';
import { FinancialService } from '../services/financial.service.js';
import { ClientRepository, AttractionRepository, FinancialRepository, EventRepository } from '../db/database.js';
import { IntegrationImportEventDTO, AttractionType } from '../../types/index.js';

export const IntegrationController = {
  /**
   * Fluxo A: POST /api/v1/eventos/importar
   * Recebe payload padronizado do LED Partner / sistemas externos
   */
  async importEvent(req: Request, res: Response): Promise<void> {
    try {
      const payload: IntegrationImportEventDTO = req.body;

      if (!payload.cliente || !payload.cliente.nome || !payload.cliente.documento) {
        res.status(400).json({
          error: 'Dados do cliente inválidos. Campos obrigatórios: "cliente.nome" e "cliente.documento".',
        });
        return;
      }

      if (!payload.evento || !payload.evento.data_evento || !payload.evento.local) {
        res.status(400).json({
          error: 'Dados do evento inválidos. Campos obrigatórios: "evento.data_evento" e "evento.local".',
        });
        return;
      }

      // 1. Extrai data e horário (suporta ISO string ou 'YYYY-MM-DDTHH:mm:ss' ou 'YYYY-MM-DD')
      let eventDate = payload.evento.data_evento;
      let eventTime = '20:00';
      if (payload.evento.data_evento.includes('T')) {
        const parts = payload.evento.data_evento.split('T');
        eventDate = parts[0];
        eventTime = parts[1].substring(0, 5);
      }

      // 2. Cria ou atualiza o cliente
      const client = ClientRepository.createOrUpdate({
        nome: payload.cliente.nome.trim(),
        cpf: payload.cliente.documento.trim(),
        endereco: payload.cliente.endereco?.trim() || payload.evento.local.trim(),
        telefone: payload.cliente.telefone?.trim(),
        email: payload.cliente.email?.trim(),
      });

      // 3. Mapeia IDs de personagens/atrações
      const attractionIds: number[] = [];
      if (payload.evento.personagens && Array.isArray(payload.evento.personagens)) {
        for (const p of payload.evento.personagens) {
          if (typeof p === 'number') {
            attractionIds.push(p);
          } else if (typeof p === 'string') {
            const parsed = parseInt(p, 10);
            if (!isNaN(parsed)) {
              attractionIds.push(parsed);
            } else {
              // Procura atração pelo nome
              const allAttractions = AttractionRepository.list();
              const found = allAttractions.find(a => a.nome.toLowerCase().includes(p.toLowerCase()));
              if (found) attractionIds.push(found.id);
            }
          }
        }
      }

      // 4. Cria o Evento
      const event = await EventService.create({
        cliente_id: client.id,
        nome_evento: payload.evento.nome_evento || `Evento ${client.nome}`,
        tipo_evento: payload.evento.tipo_evento || 'OUTRO',
        data: eventDate,
        horario: eventTime,
        duracao: payload.evento.duracao || 2,
        endereco: payload.evento.local.trim(),
        valor_total: Number(payload.evento.valor_total) || 0,
        observacoes: payload.evento.observacoes || 'Importado via API Externa (LED Partner)',
        atracao_ids: attractionIds,
      });

      // 5. Opcional: Gerar Contrato PDF imediatamente se solicitado
      let contract = null;
      if (payload.evento.criar_contrato) {
        const tipo: AttractionType = payload.evento.tipo_contrato || (attractionIds.length > 0 ? 'PERSONAGEM' : 'ROBO_LED');
        contract = await ContractService.createContract({
          cliente_nome: client.nome,
          cliente_cpf: client.cpf,
          cliente_endereco: client.endereco,
          cliente_telefone: client.telefone,
          cliente_email: client.email,
          evento_id: event.id,
          nome_evento: event.nome_evento,
          evento_data: event.data,
          evento_horario: event.horario,
          evento_endereco: event.endereco,
          evento_duracao: event.duracao,
          tipo,
          valor_total: event.valor_total || 600,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Evento e cliente importados com sucesso.',
        cliente: client,
        evento: event,
        contrato: contract,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Erro ao processar importação de evento.',
      });
    }
  },

  /**
   * Fluxo B: POST /api/v1/financeiro/webhook ou PATCH /api/v1/financeiro/:id
   * Atualiza status de pagamento quando uma transação for confirmada externamente
   */
  async financialWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { lancamento_id, evento_id, status, forma_pagamento, comprovante_ref } = req.body;

      let entry = null;
      if (lancamento_id) {
        entry = FinancialRepository.findById(Number(lancamento_id));
      } else if (evento_id) {
        const entries = FinancialRepository.list({ eventoId: Number(evento_id) });
        entry = entries.find(e => e.status === 'PENDENTE') || entries[0];
      }

      if (!entry) {
        res.status(404).json({ error: 'Lançamento financeiro correspondente não foi encontrado.' });
        return;
      }

      if (status === 'PAGO' || status === 'Pago') {
        const updated = FinancialService.settle(entry.id, {
          forma_pagamento: forma_pagamento || 'PIX',
          comprovante_ref: comprovante_ref || 'Webhook Automático',
        });
        res.json({ success: true, message: 'Status financeiro atualizado para PAGO.', lancamento: updated });
      } else if (status === 'CANCELADO' || status === 'Cancelado') {
        const updated = FinancialService.cancel(entry.id);
        res.json({ success: true, message: 'Status financeiro cancelado.', lancamento: updated });
      } else {
        res.status(400).json({ error: `Status "${status}" não reconhecido.` });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao processar webhook financeiro.' });
    }
  },
};
