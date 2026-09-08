import { describe, it, expect } from 'vitest';
import { GoogleCalendarService } from '../src/server/services/google-calendar.service.js';
import { EventService } from '../src/server/services/event.service.js';
import { CompanyRepository } from '../src/server/db/database.js';
import { EventDetails } from '../src/types/index.js';

describe('Google Calendar Integration (eventos.agenda.demo@gmail.com)', () => {
  it('deve gerar a URL direta de 1-clique para adicionar ao Google Agenda com email eventos.agenda.demo@gmail.com', () => {
    const mockEvent: EventDetails = {
      id: 999,
      cliente_id: 1,
      nome_evento: 'Festa 15 Anos Gabriela',
      tipo_evento: 'ANIVERSARIO_15_ANOS',
      data: '2026-12-20',
      horario: '21:00',
      duracao: 2,
      horario_termino: '23:00',
      endereco: 'Espaço Jardim Encantado - Av. Kennedy, 500',
      cidade: 'São Paulo',
      estado: 'SP',
      status: 'CONFIRMADO',
      valor_total: 1500,
      cliente: {
        id: 1,
        nome: 'Gabriela Lima',
        cpf: '123.456.789-00',
        telefone: '(11) 98765-4321',
        email: 'gabriela@email.com',
        endereco: 'Rua das Flores, 123',
        created_at: '2026-08-26',
        updated_at: '2026-08-26',
      },
      atracoes: [
        {
          id: 1,
          evento_id: 999,
          atracao_id: 1,
          quantidade: 1,
          valor_unitario: 1500,
          atracao: {
            id: 1,
            nome: 'Robô LED Titan Purple 2.80m',
            categoria: 'ROBO_LED',
            valor_base: 1500,
            duracao_padrao: 2,
            ativo: 1,
            created_at: '2026-08-26',
            updated_at: '2026-08-26',
          },
        },
      ],
      created_at: '2026-08-26',
      updated_at: '2026-08-26',
    };

    const url = GoogleCalendarService.generateDirectWebUrl(mockEvent);

    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(url).toContain('eventos.agenda.demo@gmail.com');
    expect(url).toContain('Rob%C3%B4%20LED%20Partner');
    expect(url).toContain('20261220T210000');
    expect(url).toContain('20261220T230000');
  });

  it('deve incluir o link do Google Calendar ao listar ou criar eventos no EventService', async () => {
    const event = await EventService.create({
      cliente_nome: 'Marcos Vinicius',
      cliente_cpf: '444.555.666-77',
      cliente_telefone: '(11) 97777-8888',
      nome_evento: 'Casamento Marcos e Juliana',
      tipo_evento: 'CASAMENTO',
      data: '2026-11-15',
      horario: '22:00',
      duracao: 2.5,
      endereco: 'Buffet Mansão Real, R. das Palmeiras 400',
      cidade: 'Santo André',
      estado: 'SP',
      valor_total: 1800,
    });

    expect(event).toBeDefined();
    expect(event.google_calendar_link).toBeDefined();
    expect(event.google_calendar_link).toContain('https://calendar.google.com/calendar/render');
    expect(event.horario_termino).toBe('00:30');
  });

  it('deve responder ao teste de conexão com o Google Agenda', async () => {
    const result = await GoogleCalendarService.testConnection();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});
