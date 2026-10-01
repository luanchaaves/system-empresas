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

export const GoogleCalendarService = {
  /**
   * Gera o link direto para adicionar o evento ao Google Calendar via navegador com 1 clique.
   * Não requer chaves de API imediatas.
   */
  generateDirectWebUrl(event: EventDetails): string {
    const title = encodeURIComponent(
      `Robô LED Partner - ${event.nome_evento || 'Apresentação'} (${event.cliente?.nome || 'Cliente'})`
    );

    // Formata datas para o formato ISO compacto do Google Calendar: YYYYMMDDTHHmmSS
    const dateClean = (event.data || '').replace(/-/g, '');
    const startTimeClean = (event.horario || '20:00').replace(/:/g, '') + '00';
    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const endTimeClean = (endTime || '22:00').replace(/:/g, '') + '00';

    const dates = `${dateClean}T${startTimeClean}/${dateClean}T${endTimeClean}`;

    const locationText = `${event.endereco}, ${event.cidade || 'São Bernardo do Campo'} - ${event.estado || 'SP'}`;
    const location = encodeURIComponent(locationText);

    const atracoesText = event.atracoes && event.atracoes.length > 0
      ? event.atracoes.map((a) => `- ${a.atracao?.nome || 'Atração'} (x${a.quantidade})`).join('\n')
      : 'Robô LED / Personagens Vivos';

    const detailsText = [
      `ROBO LED PARTNER - APRESENTAÇÃO`,
      `---------------------------------------`,
      `Cliente: ${event.cliente?.nome || 'Não informado'}`,
      `Telefone/WhatsApp: ${event.cliente?.telefone || 'Não informado'}`,
      `E-mail: ${event.cliente?.email || 'Não informado'}`,
      `Tipo de Evento: ${event.tipo_evento || 'Evento'}`,
      `Horário: ${event.horario} às ${endTime} (${event.duracao}h de apresentação)`,
      `Valor Total: ${formatCurrencyBRL(event.valor_total, true)}`,
      ``,
      `Atrações Confirmadas:`,
      atracoesText,
      ``,
      event.observacoes ? `Observações:\n${event.observacoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const details = encodeURIComponent(detailsText);

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
      console.error('Falha ao instanciar JWT do Google Calendar:', err);
      return null;
    }
  },

  /**
   * Cria o evento diretamente no Google Calendar (roboledpartner@gmail.com)
   */
  async createEvent(event: EventDetails): Promise<GoogleSyncResult> {
    const webLink = this.generateDirectWebUrl(event);
    const authData = await this.getAuthClient();

    if (!authData) {
      return {
        success: true,
        web_link: webLink,
        message: 'Evento preparado. Chave Service Account não configurada, link direto gerado.',
      };
    }

    const { calendar, calendarId } = authData;

    const endTime = event.horario_termino || calculateEndTime(event.horario || '20:00', event.duracao || 2);
    const startDateTime = `${event.data}T${event.horario}:00`;
    const endDateTime = `${event.data}T${endTime}:00`;

    const atracoesText = event.atracoes && event.atracoes.length > 0
      ? event.atracoes.map((a) => `- ${a.atracao?.nome || 'Atração'} (x${a.quantidade})`).join('\n')
      : 'Robô LED / Personagens Vivos';

    const description = [
      `⚡ ROBO LED PARTNER - APRESENTAÇÃO`,
      `---------------------------------------`,
      `Cliente: ${event.cliente?.nome || 'Não informado'}`,
      `Telefone/WhatsApp: ${event.cliente?.telefone || 'Não informado'}`,
      `E-mail: ${event.cliente?.email || 'Não informado'}`,
      `Tipo: ${event.tipo_evento || 'Evento'}`,
      `Valor Total: ${formatCurrencyBRL(event.valor_total, true)}`,
      ``,
      `Atrações:`,
      atracoesText,
      ``,
      event.observacoes ? `Observações:\n${event.observacoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `⚡ Robô LED Partner - ${event.nome_evento || 'Apresentação'} (${event.cliente?.nome || 'Cliente'})`,
          description,
          location: `${event.endereco}, ${event.cidade || 'São Bernardo do Campo'} - ${event.estado || 'SP'}`,
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

    const atracoesText = event.atracoes && event.atracoes.length > 0
      ? event.atracoes.map((a) => `- ${a.atracao?.nome || 'Atração'} (x${a.quantidade})`).join('\n')
      : 'Robô LED / Personagens Vivos';

    const description = [
      `⚡ ROBO LED PARTNER - APRESENTAÇÃO`,
      `---------------------------------------`,
      `Cliente: ${event.cliente?.nome || 'Não informado'}`,
      `Telefone/WhatsApp: ${event.cliente?.telefone || 'Não informado'}`,
      `E-mail: ${event.cliente?.email || 'Não informado'}`,
      `Tipo: ${event.tipo_evento || 'Evento'}`,
      `Valor Total: ${formatCurrencyBRL(event.valor_total, true)}`,
      ``,
      `Atrações:`,
      atracoesText,
      ``,
      event.observacoes ? `Observações:\n${event.observacoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await calendar.events.update({
        calendarId,
        eventId: googleEventId,
        requestBody: {
          summary: `⚡ Robô LED Partner - ${event.nome_evento || 'Apresentação'} (${event.cliente?.nome || 'Cliente'})`,
          description,
          location: `${event.endereco}, ${event.cidade || 'São Bernardo do Campo'} - ${event.estado || 'SP'}`,
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
        google_event_id: response.data.id || googleEventId,
        web_link: response.data.htmlLink || webLink,
        message: 'Evento atualizado no Google Agenda!',
      };
    } catch (err: any) {
      console.error('Erro ao atualizar evento no Google Calendar:', err);
      return {
        success: false,
        web_link: webLink,
        message: `Erro ao atualizar no Google Calendar: ${err.message}`,
      };
    }
  },

  /**
   * Remove o evento do Google Calendar
   */
  async deleteEvent(googleEventId: string): Promise<boolean> {
    const authData = await this.getAuthClient();
    if (!authData || !googleEventId) return true;

    const { calendar, calendarId } = authData;
    try {
      await calendar.events.delete({
        calendarId,
        eventId: googleEventId,
      });
      return true;
    } catch (err) {
      console.warn('Erro ao deletar evento do Google Calendar:', err);
      return false;
    }
  },

  /**
   * Testa a conexão com a API do Google Calendar
   */
  async testConnection(): Promise<{ success: boolean; message: string; calendar_title?: string }> {
    const config = CompanyRepository.get();
    const calendarId = config.google_calendar_id || 'roboledpartner@gmail.com';
    const authData = await this.getAuthClient();

    if (!authData) {
      return {
        success: false,
        message:
          'Nenhum arquivo de credencial encontrado em data/google-credentials.json ou nas configurações. Insira o JSON da conta de serviço para sincronização automática em segundo plano.',
      };
    }

    try {
      const res = await authData.calendar.calendars.get({ calendarId });
      return {
        success: true,
        message: `Conexão estabelecida com sucesso com o Google Agenda (${calendarId})!`,
        calendar_title: res.data.summary || calendarId,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha ao conectar na agenda ${calendarId}: ${err.message || err}. Certifique-se de que a agenda foi compartilhada com a Conta de Serviço.`,
      };
    }
  },
};
