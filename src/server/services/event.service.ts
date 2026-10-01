import { EventRepository, ClientRepository, AttractionRepository, ContractRepository, FinancialRepository, CompanyRepository } from '../db/database.js';
import {
  EventDetails,
  CreateEventDTO,
  UpdateEventDTO,
  EventStatus,
} from '../../types/index.js';
import { calculateEndTime } from '../../domain/calculations.js';
import { FinancialService } from './financial.service.js';
import { GoogleCalendarService, GoogleSyncResult } from './google-calendar.service.js';

export const EventService = {
  list(filters?: {
    search?: string;
    status?: EventStatus;
    startDate?: string;
    endDate?: string;
    canalB2B?: string;
    tipoEvento?: any;
    isB2B?: boolean;
    isSocial?: boolean;
  }): (EventDetails & { google_calendar_link: string })[] {
    const events = EventRepository.list(filters);
    return events.map((event) => {
      const fullEvent: EventDetails = {
        ...event,
        atracoes: EventRepository.getAttractions(event.id),
        financeiro: FinancialRepository.list({ eventoId: event.id }),
      };
      return {
        ...fullEvent,
        google_calendar_link: GoogleCalendarService.generateDirectWebUrl(fullEvent),
      };
    });
  },

  getById(id: number): EventDetails & { google_calendar_link: string } {
    const event = EventRepository.findById(id);
    if (!event) {
      throw new Error(`Evento com ID ${id} não encontrado.`);
    }

    event.atracoes = EventRepository.getAttractions(id);
    event.financeiro = FinancialRepository.list({ eventoId: id });
    return {
      ...event,
      google_calendar_link: GoogleCalendarService.generateDirectWebUrl(event),
    };
  },

  async create(data: CreateEventDTO): Promise<EventDetails & { google_calendar_link: string; google_sync?: GoogleSyncResult }> {
    // 1. Garante ou cria o cliente
    let clienteId = data.cliente_id;
    if (!clienteId) {
      if (!data.cliente_nome) {
        throw new Error('Nome do cliente ou loja é obrigatório para agendar um evento.');
      }
      const client = ClientRepository.createOrUpdate({
        nome: data.cliente_nome.trim(),
        cpf: data.cliente_cpf ? data.cliente_cpf.trim() : '00.000.000/0001-00',
        endereco: data.cliente_endereco?.trim() || data.endereco.trim(),
        telefone: data.cliente_telefone?.trim(),
        email: data.cliente_email?.trim(),
      });
      clienteId = client.id;
    }

    const duracao = Number(data.duracao) || 2;
    const horarioTermino = calculateEndTime(data.horario, duracao);

    const isB2B = data.tipo_evento === 'CORPORATIVO_BK' || (data.canal_b2b && data.canal_b2b !== 'PARTICULAR');
    const prazo = data.prazo_pagamento_dias || (isB2B ? 30 : 0);

    // 2. Cria o Evento
    const event = EventRepository.create({
      cliente_id: clienteId,
      nome_evento: data.nome_evento?.trim() || `Evento ${data.data}`,
      tipo_evento: data.tipo_evento || (isB2B ? 'CORPORATIVO_BK' : 'OUTRO'),
      data: data.data,
      horario: data.horario,
      horario_termino: horarioTermino,
      duracao,
      endereco: data.endereco.trim(),
      cidade: data.cidade?.trim() || 'São Bernardo do Campo',
      estado: data.estado?.trim() || 'SP',
      cep: data.cep?.trim(),
      status: data.status || 'AGENDADO',
      valor_total: Number(data.valor_total) || 0,
      observacoes: data.observacoes?.trim(),
      canal_b2b: data.canal_b2b || (isB2B ? 'DIRETO_BK' : 'PARTICULAR'),
      loja_unidade: data.loja_unidade?.trim(),
      prazo_pagamento_dias: prazo,
      data_previsao_pagamento: data.data_previsao_pagamento?.trim(),
      nota_fiscal_ref: data.nota_fiscal_ref?.trim(),
    });

    // 3. Associa atrações se fornecidas
    if (data.atracao_ids && data.atracao_ids.length > 0) {
      const attractionsData = data.atracao_ids.map((atracaoId) => {
        const atracao = AttractionRepository.findById(atracaoId);
        return {
          atracao_id: atracaoId,
          quantidade: 1,
          valor_unitario: atracao ? atracao.valor_base : 0,
        };
      });
      EventRepository.setAttractions(event.id, attractionsData);
    }

    // 4. Cria parcelas financeiras automáticas se tiver valor > 0
    if (event.valor_total > 0) {
      if (isB2B) {
        FinancialService.generateB2BInstallment({
          eventoId: event.id,
          clienteId,
          totalValue: event.valor_total,
          eventDate: event.data,
          prazoDias: prazo,
          lojaUnidade: event.loja_unidade || event.nome_evento,
          canalB2B: event.canal_b2b,
        });
      } else {
        FinancialService.generateStandardInstallments({
          eventoId: event.id,
          clienteId,
          totalValue: event.valor_total,
          eventDate: event.data,
        });
      }
    }

    const fullEvent = this.getById(event.id);

    // 5. Sincroniza automaticamente com o Google Calendar (roboledpartner@gmail.com)
    let syncResult: GoogleSyncResult | undefined;
    const config = CompanyRepository.get();
    if (config.google_calendar_enabled) {
      try {
        syncResult = await GoogleCalendarService.createEvent(fullEvent);
        if (syncResult.google_event_id) {
          EventRepository.update(event.id, { google_event_id: syncResult.google_event_id });
          fullEvent.google_event_id = syncResult.google_event_id;
        }
      } catch (err) {
        console.warn('Google Calendar sync warning:', err);
      }
    }

    return {
      ...fullEvent,
      google_sync: syncResult,
    };
  },

  async update(id: number, data: UpdateEventDTO): Promise<EventDetails & { google_calendar_link: string }> {
    const current = this.getById(id);
    const duracao = data.duracao !== undefined ? Number(data.duracao) : current.duracao;
    const horario = data.horario || current.horario;
    const horarioTermino = calculateEndTime(horario, duracao);

    EventRepository.update(id, {
      ...data,
      horario_termino: horarioTermino,
      duracao,
      nome_evento: data.nome_evento !== undefined ? data.nome_evento.trim() : current.nome_evento,
      endereco: data.endereco !== undefined ? data.endereco.trim() : current.endereco,
      cidade: data.cidade !== undefined ? data.cidade.trim() : current.cidade,
      estado: data.estado !== undefined ? data.estado.trim() : current.estado,
      observacoes: data.observacoes !== undefined ? data.observacoes.trim() : current.observacoes,
      valor_total: data.valor_total !== undefined ? Number(data.valor_total) : current.valor_total,
      canal_b2b: data.canal_b2b !== undefined ? data.canal_b2b : current.canal_b2b,
      loja_unidade: data.loja_unidade !== undefined ? data.loja_unidade.trim() : current.loja_unidade,
      prazo_pagamento_dias: data.prazo_pagamento_dias !== undefined ? Number(data.prazo_pagamento_dias) : current.prazo_pagamento_dias,
      data_previsao_pagamento: data.data_previsao_pagamento !== undefined ? data.data_previsao_pagamento.trim() : current.data_previsao_pagamento,
      nota_fiscal_ref: data.nota_fiscal_ref !== undefined ? data.nota_fiscal_ref.trim() : current.nota_fiscal_ref,
    });

    // Atualiza atrações se fornecidas
    if (data.atracao_ids) {
      const attractionsData = data.atracao_ids.map((atracaoId) => {
        const atracao = AttractionRepository.findById(atracaoId);
        return {
          atracao_id: atracaoId,
          quantidade: 1,
          valor_unitario: atracao ? atracao.valor_base : 0,
        };
      });
      EventRepository.setAttractions(id, attractionsData);
    }

    const fullUpdated = this.getById(id);

    // Sincroniza update com o Google Calendar
    if (fullUpdated.google_event_id) {
      try {
        await GoogleCalendarService.updateEvent(fullUpdated.google_event_id, fullUpdated);
      } catch (err) {
        console.warn('Erro ao atualizar Google Calendar:', err);
      }
    }

    return fullUpdated;
  },

  async delete(id: number): Promise<boolean> {
    try {
      const current = EventRepository.findById(id);
      if (current?.google_event_id) {
        await GoogleCalendarService.deleteEvent(current.google_event_id);
      }
    } catch {}
    return EventRepository.delete(id);
  },

  async syncGoogleCalendar(id: number): Promise<GoogleSyncResult> {
    const event = this.getById(id);
    if (event.google_event_id) {
      return await GoogleCalendarService.updateEvent(event.google_event_id, event);
    } else {
      const result = await GoogleCalendarService.createEvent(event);
      if (result.google_event_id) {
        EventRepository.update(id, { google_event_id: result.google_event_id });
      }
      return result;
    }
  },
};
