import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { CompanyRepository } from '../db/database.js';
import { EventDetails } from '../../types/index.js';
import { calculateEndTime, formatCurrencyBRL } from '../../domain/calculations.js';

export interface GoogleSyncResult {
  success: boolean;
  google_event_id?: string;
  web_link?: string;
  message?: string;
}

const formatEventDateBR = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const formatDurationHoursMinutes = (dur: number): string => {
  const h = Math.floor(dur);
  const m = Math.round((dur - h) * 60);
  return `${h}:${String(m).padStart(2, '0')}`;
};

export const GoogleCalendarService = {
  /**
   * Constrói o texto padronizado conforme o modelo visual da Robô LED Partner
   */
  buildFormattedDescription(event: EventDetails): string {
    const atracaoName =
      event.atracoes && event.atracoes.length > 0
        ? event.atracoes.map((a) => `${a.atracao?.nome || 'ROBO DE LED'}`).join(', ')
        : event.nome_evento?.includes('Personagem')
        ? 'PERSONAGENS VIVOS'
        : 'ROBO DE LED';

    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const formattedDate = formatEventDateBR(event.data);
    const duracaoStr = formatDurationHoursMinutes(event.duracao || 1);

    const lines = [
      `📌 Atração: ${atracaoName}`,
      `🗓️ Data: ${formattedDate}`,
      `⏰ Horário: ${event.horario} as ${endTime}`,
      `⌛ Duração: ${duracaoStr}`,
      `👤 Cliente/Responsável: ${event.cliente?.nome || event.nome_evento || 'Cliente'}`,
      `🎈 Endereço: ${event.endereco || 'A definir'}`,
      `🏢 Local/Nome do espaço: ${event.loja_unidade || event.cidade || ''}`,
      `🎯 Tipo de evento: ${event.tipo_evento || 'Festa / Show'}`,
      `🤝 Parceria (Se houver): ${event.canal_b2b && event.canal_b2b !== 'PARTICULAR' ? event.canal_b2b : ''}`,
      `🔔 Lembrete: ${event.observacoes || 'Com bazuca e gerb'}`,
      ``,
      `📅 roboledpartner@gmail.com`,
    ];

    return lines.join('\n');
  },

  /**
   * Gera o link direto para adicionar o evento ao Google Calendar via navegador com 1 clique.
   */
  generateDirectWebUrl(event: EventDetails): string {
    const title = encodeURIComponent(
      `EVENTO ROBO DE LED - ${event.cliente?.nome || event.loja_unidade || event.nome_evento || 'Show'}`
    );

    const dateClean = (event.data || '').replace(/-/g, '');
    const startTimeClean = (event.horario || '20:00').replace(/:/g, '') + '00';
    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const endTimeClean = (endTime || '22:00').replace(/:/g, '') + '00';

    const dates = `${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}`;

    const locationText = `${event.endereco || ''}${event.cidade ? `, ${event.cidade}` : ''}${event.estado ? ` - ${event.estado}` : ''}`;
    const location = encodeURIComponent(locationText);

    const descriptionText = this.buildFormattedDescription(event);
    const details = encodeURIComponent(descriptionText);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=roboledpartner@gmail.com`;
  },

  /**
   * Obtém a instância autenticada da API do Google Calendar
   */
  async getAuthClient(): Promise<{ calendar: any; calendarId: string } | null> {
    const config = CompanyRepository.get();
    const calendarId = config.google_calendar_id || 'roboledpartner@gmail.com';

    // 1. Tenta carregar arquivo data/google-credentials.json
    const credentialsPath = path.resolve(process.cwd(), 'data', 'google-credentials.json');
    let credentialsJson: any = null;

    if (fs.existsSync(credentialsPath)) {
      try {
        const raw = fs.readFileSync(credentialsPath, 'utf-8');
        credentialsJson = JSON.parse(raw);
      } catch (err) {
        console.warn('Erro ao ler data/google-credentials.json:', err);
      }
    } else if (config.google_calendar_credentials && config.google_calendar_credentials.trim().startsWith('{')) {
      try {
        credentialsJson = JSON.parse(config.google_calendar_credentials);
      } catch (err) {
        console.warn('Erro ao ler credenciais salvas no banco:', err);
      }
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        credentialsJson = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      } catch (err) {
        console.warn('Erro ao ler GOOGLE_SERVICE_ACCOUNT_KEY do ambiente:', err);
      }
    }

    if (!credentialsJson) {
      return null;
    }

    try {
      const auth = new google.auth.JWT({
        email: credentialsJson.client_email,
        key: credentialsJson.private_key,
        scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
      });

      const calendar = google.calendar({ version: 'v3', auth });
      return { calendar, calendarId };
    } catch (err) {
      console.error('Erro ao autenticar JWT do Google Calendar:', err);
      return null;
    }
  },

  /**
   * Cria um evento na conta Google Calendar oficial (roboledpartner@gmail.com)
   */
  async createEvent(event: EventDetails): Promise<GoogleSyncResult> {
    const webLink = this.generateDirectWebUrl(event);
    const authData = await this.getAuthClient();

    if (!authData) {
      return {
        success: true,
        web_link: webLink,
        message: 'Link padrão do Google Calendar gerado com sucesso.',
      };
    }

    const { calendar, calendarId } = authData;

    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const startDateTime = `${event.data}T${event.horario}:00`;
    const endDateTime = `${event.data}T${endTime}:00`;

    const description = this.buildFormattedDescription(event);

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `EVENTO ROBO DE LED - ${event.cliente?.nome || event.loja_unidade || event.nome_evento || 'Show'}`,
          description,
          location: `${event.endereco || ''}, ${event.cidade || 'São Paulo'} - ${event.estado || 'SP'}`,
          colorId: '3', // Roxo / Grape (Cor oficial da Robo Led Partner)
          start: {
            dateTime: new Date(startDateTime).toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: new Date(endDateTime).toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          attendees: event.cliente?.email ? [{ email: event.cliente.email }] : undefined,
        },
      });

      return {
        success: true,
        google_event_id: response.data.id || undefined,
        web_link: response.data.htmlLink || webLink,
        message: 'Evento sincronizado com sucesso no Google Agenda (roboledpartner@gmail.com)!',
      };
    } catch (err: any) {
      console.error('Erro ao inserir evento na API do Google Calendar:', err);
      return {
        success: false,
        web_link: webLink,
        message: `Erro na API do Google Calendar: ${err.message || err}`,
      };
    }
  },

  /**
   * Atualiza um evento existente no Google Calendar
   */
  async updateEvent(googleEventId: string, event: EventDetails): Promise<GoogleSyncResult> {
    const webLink = this.generateDirectWebUrl(event);
    const authData = await this.getAuthClient();

    if (!authData || !googleEventId) {
      return { success: true, web_link: webLink };
    }

    const { calendar, calendarId } = authData;
    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const startDateTime = `${event.data}T${event.horario}:00`;
    const endDateTime = `${event.data}T${endTime}:00`;

    const description = this.buildFormattedDescription(event);

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId: googleEventId,
        requestBody: {
          summary: `EVENTO ROBO DE LED - ${event.cliente?.nome || event.loja_unidade || event.nome_evento || 'Show'}`,
          description,
          location: `${event.endereco || ''}, ${event.cidade || 'São Paulo'} - ${event.estado || 'SP'}`,
          colorId: '3',
          start: {
            dateTime: new Date(startDateTime).toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: new Date(endDateTime).toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
        },
      });

      return {
        success: true,
        google_event_id: response.data.id,
        web_link: response.data.htmlLink || webLink,
      };
    } catch (err: any) {
      console.error('Erro ao atualizar no Google Calendar:', err);
      return { success: false, web_link: webLink };
    }
  },

  /**
   * Deleta um evento do Google Calendar
   */
  async deleteEvent(googleEventId: string): Promise<boolean> {
    const authData = await this.getAuthClient();
    if (!authData || !googleEventId) return false;

    const { calendar, calendarId } = authData;
    try {
      await calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      });
      return true;
    } catch (err) {
      console.error('Erro ao deletar do Google Calendar:', err);
      return false;
    }
  },

  /**
   * Testa a conexão com a API do Google Calendar
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    const authData = await this.getAuthClient();
    if (!authData) {
      return {
        success: false,
        message: 'Credenciais de Service Account não encontradas. Configure o JSON nas configurações.',
      };
    }

    const { calendar, calendarId } = authData;
    try {
      const res = await calendar.calendarList.get({ calendarId });
      return {
        success: true,
        message: `Conectado com sucesso à agenda: ${res.data.summary || calendarId}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Erro na autenticação com o Google Agenda: ${err.message || err}`,
      };
    }
  },
};
