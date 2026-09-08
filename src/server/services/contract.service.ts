import {
  ContractRepository,
  ClientRepository,
  EventRepository,
  CompanyRepository,
  FinancialRepository,
} from '../db/database.js';
import {
  Contract,
  CreateContractDTO,
  DashboardStats,
  AttractionType,
  ContractStatus,
} from '../../types/index.js';
import { isValidCPF, cleanCPF, formatCPF } from '../../domain/cpf.js';
import { calculatePaymentSplit, calculateEndTime } from '../../domain/calculations.js';
import { generateContractNumber } from '../../domain/number-generator.js';
import { generateContractPdf } from '../../pdf/generator.js';
import { renderContractHtml, renderPreviewFromDto } from '../../templates/renderer.js';
import { FinancialService } from './financial.service.js';

export class ContractService {
  /**
   * Obtém estatísticas consolidadas para o Dashboard Unificado (Contratos + Eventos + Financeiro)
   */
  static getDashboardStats(): DashboardStats {
    const allContracts = ContractRepository.list();
    const allEvents = EventRepository.list();
    const finStats = FinancialRepository.getStats();
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    const totalContratos = allContracts.length;
    const totalEventos = allEvents.length;
    let contratosRoboLed = 0;
    let contratosPersonagens = 0;
    let valorTotalContratado = 0;
    let eventosFuturosCount = 0;
    let eventosMesCount = 0;

    for (const c of allContracts) {
      if (c.tipo === 'ROBO_LED') contratosRoboLed++;
      if (c.tipo === 'PERSONAGEM') contratosPersonagens++;
      if (c.status !== 'CANCELADO') {
        valorTotalContratado += c.valor_total;
      }
    }

    const proximosEventosList: DashboardStats['proximosEventos'] = [];

    for (const e of allEvents) {
      if (e.data >= todayStr && e.status !== 'CANCELADO') {
        eventosFuturosCount++;
      }
      if (e.data.startsWith(currentMonthPrefix) && e.status !== 'CANCELADO') {
        eventosMesCount++;
      }

      if (e.data >= todayStr && e.status !== 'CANCELADO') {
        const contrato = ContractRepository.findByEventoId(e.id);
        const finEntries = FinancialRepository.list({ eventoId: e.id });
        const hasPending = finEntries.some(f => f.status === 'PENDENTE' || f.status === 'ATRASADO');
        const hasPaid = finEntries.some(f => f.status === 'PAGO');

        let statusFin: 'PENDENTE' | 'PAGO' | 'ATRASADO' = 'PENDENTE';
        if (finEntries.length > 0) {
          if (!hasPending && hasPaid) statusFin = 'PAGO';
          else if (finEntries.some(f => f.status === 'ATRASADO' || (f.status === 'PENDENTE' && f.data_vencimento < todayStr))) statusFin = 'ATRASADO';
        }

        proximosEventosList.push({
          id: e.id,
          numero: contrato?.numero,
          nome_evento: e.nome_evento,
          cliente_nome: e.cliente?.nome || 'Cliente',
          tipo: (contrato?.tipo || 'ROBO_LED') as AttractionType,
          personagem: contrato?.personagem,
          data_evento: e.data,
          horario: e.horario,
          horario_termino: e.horario_termino,
          endereco: e.endereco,
          valor_total: e.valor_total || contrato?.valor_total || 0,
          status_evento: e.status,
          status_contrato: contrato?.status,
          status_financeiro: statusFin,
          contrato_id: contrato?.id,
          pdf_path: contrato?.pdf_path,
        });
      }
    }

    // Ordena próximos eventos por data crescente
    proximosEventosList.sort((a, b) => a.data_evento.localeCompare(b.data_evento));

    // Agrupamento por Mês e por Ano
    const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyMap = new Map<string, {
      mes: string;
      mesFormatado: string;
      ano: number;
      totalEventos: number;
      eventosRealizados: number;
      eventosAgendados: number;
      eventosCancelados: number;
      faturamentoTotal: number;
      totalRecebido: number;
      totalPendente: number;
    }>();

    const yearlyMap = new Map<number, {
      ano: number;
      totalEventos: number;
      eventosRealizados: number;
      eventosAgendados: number;
      faturamentoTotal: number;
      totalRecebido: number;
      totalPendente: number;
    }>();

    const allFin = FinancialRepository.list();

    for (const e of allEvents) {
      if (!e.data || e.data.length < 7) continue;
      const mesKey = e.data.substring(0, 7); // YYYY-MM
      const anoNum = parseInt(e.data.substring(0, 4), 10);
      const monthIndex = parseInt(e.data.substring(5, 7), 10) - 1;
      const mesFormatado = `${MONTH_ABBR[monthIndex] || 'Mês'}/${String(anoNum).substring(2)}`;

      if (!monthlyMap.has(mesKey)) {
        monthlyMap.set(mesKey, {
          mes: mesKey,
          mesFormatado,
          ano: anoNum,
          totalEventos: 0,
          eventosRealizados: 0,
          eventosAgendados: 0,
          eventosCancelados: 0,
          faturamentoTotal: 0,
          totalRecebido: 0,
          totalPendente: 0,
        });
      }

      if (!yearlyMap.has(anoNum)) {
        yearlyMap.set(anoNum, {
          ano: anoNum,
          totalEventos: 0,
          eventosRealizados: 0,
          eventosAgendados: 0,
          faturamentoTotal: 0,
          totalRecebido: 0,
          totalPendente: 0,
        });
      }

      const m = monthlyMap.get(mesKey)!;
      const y = yearlyMap.get(anoNum)!;

      m.totalEventos++;
      y.totalEventos++;

      if (e.status === 'REALIZADO') {
        m.eventosRealizados++;
        y.eventosRealizados++;
      } else if (e.status === 'CANCELADO') {
        m.eventosCancelados++;
      } else {
        m.eventosAgendados++;
        y.eventosAgendados++;
      }

      m.faturamentoTotal += e.valor_total;
      y.faturamentoTotal += e.valor_total;
    }

    // Calcula recebido e pendente de lançamentos financeiros
    for (const f of allFin) {
      if (f.status === 'CANCELADO') continue;
      const dateStr = f.data_pagamento || f.data_vencimento || f.created_at;
      if (!dateStr || dateStr.length < 7) continue;
      const mesKey = dateStr.substring(0, 7);
      const anoNum = parseInt(dateStr.substring(0, 4), 10);

      const m = monthlyMap.get(mesKey);
      const y = yearlyMap.get(anoNum);

      if (f.status === 'PAGO') {
        if (m) m.totalRecebido += f.valor;
        if (y) y.totalRecebido += f.valor;
      } else {
        if (m) m.totalPendente += f.valor;
        if (y) y.totalPendente += f.valor;
      }
    }

    const eventosPorMes = Array.from(monthlyMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));
    const metricasPorAno = Array.from(yearlyMap.values())
      .map((y) => ({
        ...y,
        ticketMedio: y.totalEventos > 0 ? Math.round((y.faturamentoTotal / y.totalEventos) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.ano - b.ano);

    return {
      totalContratos,
      totalEventos,
      eventosFuturos: eventosFuturosCount,
      eventosMes: eventosMesCount,
      contratosRoboLed,
      contratosPersonagens,
      valorTotalContratado: finStats.totalFaturado || valorTotalContratado,
      valorTotalRecebido: finStats.totalRecebido,
      valorPendenteReceber: finStats.totalAReceber + finStats.totalAtrasado,
      eventosPorMes,
      metricasPorAno,
      proximosEventos: proximosEventosList.slice(0, 10),
    };
  }

  /**
   * Cria um novo contrato com validação, geração de número, parcelas financeiras e PDF
   */
  static async createContract(dto: CreateContractDTO): Promise<Contract> {
    // 1. Validação de CPF
    const rawCpf = cleanCPF(dto.cliente_cpf);
    if (!isValidCPF(rawCpf)) {
      throw new Error(`CPF inválido: "${dto.cliente_cpf || ''}". Por favor, forneça um CPF válido.`);
    }

    if (!dto.cliente_nome || !dto.cliente_nome.trim()) {
      throw new Error('O nome do cliente é obrigatório.');
    }

    if (!dto.evento_data) {
      throw new Error('A data do evento é obrigatória.');
    }

    const enderecoEvento = (dto.evento_endereco || '').trim() || (dto.cliente_endereco || '').trim() || 'A definir';
    const enderecoCliente = (dto.cliente_endereco || '').trim() || enderecoEvento;

    if (!dto.valor_total || dto.valor_total <= 0) {
      throw new Error('O valor do contrato deve ser maior que zero.');
    }

    // 2. Cria ou atualiza cliente
    const cliente = ClientRepository.createOrUpdate({
      nome: dto.cliente_nome.trim(),
      cpf: formatCPF(rawCpf),
      endereco: enderecoCliente,
      telefone: dto.cliente_telefone ? dto.cliente_telefone.trim() : '',
      email: dto.cliente_email ? dto.cliente_email.trim() : '',
    });

    // 3. Calcula horários do evento
    const duracao = Number(dto.evento_duracao) || 2;
    const horarioInicio = dto.evento_horario || '20:00';
    const horarioTermino = calculateEndTime(horarioInicio, duracao);

    let eventoId = dto.evento_id;
    if (eventoId) {
      // Reutiliza evento existente da agenda
      EventRepository.update(eventoId, {
        data: dto.evento_data,
        horario: horarioInicio,
        horario_termino: horarioTermino,
        endereco: enderecoEvento,
        cidade: (dto.evento_cidade || 'São Bernardo do Campo').trim(),
        estado: (dto.evento_estado || 'SP').trim(),
        cep: (dto.evento_cep || '').trim(),
        duracao,
        status: 'CONFIRMADO',
        valor_total: dto.valor_total,
        observacoes: (dto.evento_observacoes || '').trim(),
      });
    } else {
      // Cria novo evento
      const novoEvento = EventRepository.create({
        cliente_id: cliente.id,
        nome_evento: dto.nome_evento || `Evento ${dto.cliente_nome.trim()} (${dto.tipo})`,
        tipo_evento: dto.tipo_evento || 'OUTRO',
        data: dto.evento_data,
        horario: horarioInicio,
        horario_termino: horarioTermino,
        endereco: enderecoEvento,
        cidade: (dto.evento_cidade || 'São Bernardo do Campo').trim(),
        estado: (dto.evento_estado || 'SP').trim(),
        cep: (dto.evento_cep || '').trim(),
        duracao,
        status: 'CONFIRMADO',
        valor_total: dto.valor_total,
        observacoes: (dto.evento_observacoes || '').trim(),
      });
      eventoId = novoEvento.id;
    }

    // 4. Gera número sequencial do contrato
    const currentYear = new Date().getFullYear();
    const nextSeq = ContractRepository.getNextSequence(currentYear);
    const numero = generateContractNumber(currentYear, nextSeq);

    // 5. Calcula divisão de pagamento (40% entrada, 60% restante)
    const split = calculatePaymentSplit(dto.valor_total, 40);

    // 6. Insere contrato no banco
    let contract = ContractRepository.create({
      numero,
      tipo: dto.tipo,
      cliente_id: cliente.id,
      evento_id: eventoId,
      personagem: dto.personagem ? dto.personagem.trim() : '',
      quantidade_personagens: dto.quantidade_personagens || 1,
      valor_total: split.valorTotal,
      valor_entrada: split.valorEntrada,
      valor_restante: split.valorRestante,
      percentual_entrada: split.percentualEntrada,
      percentual_restante: split.percentualRestante,
      uso_imagem: dto.uso_imagem !== false ? 1 : 0,
      status: dto.status || 'GERADO',
    });

    // 7. Gera automaticamente as duas parcelas no módulo financeiro (se ainda não existirem para o evento)
    const existingFin = FinancialRepository.list({ eventoId });
    if (existingFin.length === 0) {
      FinancialService.generateStandardInstallments({
        eventoId,
        contratoId: contract.id,
        clienteId: cliente.id,
        totalValue: split.valorTotal,
        eventDate: dto.evento_data,
        percentualEntrada: split.percentualEntrada,
        percentualRestante: split.percentualRestante,
        contratoNumero: contract.numero,
      });
    } else {
      for (const f of existingFin) {
        FinancialRepository.update(f.id, {
          contrato_id: contract.id,
          cliente_id: cliente.id,
          descricao: f.descricao.includes('Contrato') ? f.descricao : `${f.descricao} - Contrato ${contract.numero}`,
        });
      }
    }

    // 8. Gera PDF profissional vetorial
    try {
      const empresa = CompanyRepository.get();
      const pdfResult = await generateContractPdf(contract, empresa);
      contract = ContractRepository.update(contract.id, {
        pdf_path: pdfResult.relativeFilePath,
      });
    } catch (pdfErr) {
      console.error('Erro ao gerar PDF inicial do contrato:', pdfErr);
    }

    return contract;
  }

  /**
   * Atualiza um contrato existente e regenera o PDF
   */
  static async updateContract(id: number, dto: Partial<CreateContractDTO>): Promise<Contract> {
    const existing = ContractRepository.findById(id);
    if (!existing) {
      throw new Error(`Contrato com ID ${id} não encontrado.`);
    }

    // Atualiza cliente se fornecido
    if (dto.cliente_nome || dto.cliente_cpf || dto.cliente_endereco) {
      const rawCpf = dto.cliente_cpf ? cleanCPF(dto.cliente_cpf) : existing.cliente?.cpf;
      if (rawCpf && !isValidCPF(rawCpf)) {
        throw new Error('CPF informado é inválido.');
      }

      ClientRepository.createOrUpdate({
        nome: dto.cliente_nome?.trim() || existing.cliente?.nome || '',
        cpf: formatCPF(rawCpf || ''),
        endereco: dto.cliente_endereco?.trim() || existing.cliente?.endereco || '',
        telefone: dto.cliente_telefone !== undefined ? dto.cliente_telefone : existing.cliente?.telefone,
        email: dto.cliente_email !== undefined ? dto.cliente_email : existing.cliente?.email,
      });
    }

    // Atualiza evento se fornecido
    if (dto.evento_data || dto.evento_horario || dto.evento_duracao || dto.evento_endereco) {
      const duracao = dto.evento_duracao !== undefined ? Number(dto.evento_duracao) : (existing.evento?.duracao || 2);
      const horarioInicio = dto.evento_horario || existing.evento?.horario || '20:00';
      const horarioTermino = calculateEndTime(horarioInicio, duracao);

      EventRepository.update(existing.evento_id, {
        data: dto.evento_data || existing.evento?.data,
        horario: horarioInicio,
        horario_termino: horarioTermino,
        endereco: dto.evento_endereco?.trim() || existing.evento?.endereco,
        cidade: dto.evento_cidade !== undefined ? dto.evento_cidade : existing.evento?.cidade,
        estado: dto.evento_estado !== undefined ? dto.evento_estado : existing.evento?.estado,
        cep: dto.evento_cep !== undefined ? dto.evento_cep : existing.evento?.cep,
        duracao,
        valor_total: dto.valor_total !== undefined ? dto.valor_total : existing.valor_total,
        observacoes: dto.evento_observacoes !== undefined ? dto.evento_observacoes : existing.evento?.observacoes,
      });
    }

    // Atualiza contrato
    const valorTotal = dto.valor_total !== undefined ? dto.valor_total : existing.valor_total;
    const split = calculatePaymentSplit(valorTotal, 40);

    let updated = ContractRepository.update(id, {
      tipo: dto.tipo || existing.tipo,
      personagem: dto.personagem !== undefined ? dto.personagem : existing.personagem,
      quantidade_personagens: dto.quantidade_personagens !== undefined ? dto.quantidade_personagens : existing.quantidade_personagens,
      valor_total: split.valorTotal,
      valor_entrada: split.valorEntrada,
      valor_restante: split.valorRestante,
      uso_imagem: dto.uso_imagem !== undefined ? (dto.uso_imagem ? 1 : 0) : existing.uso_imagem,
      status: dto.status || existing.status,
    });

    // Regenera PDF
    try {
      const empresa = CompanyRepository.get();
      const pdfResult = await generateContractPdf(updated, empresa);
      updated = ContractRepository.update(updated.id, {
        pdf_path: pdfResult.relativeFilePath,
      });
    } catch (pdfErr) {
      console.error('Erro ao regenerar PDF do contrato:', pdfErr);
    }

    return updated;
  }

  /**
   * Duplica um contrato existente gerando um novo identificador e novo PDF
   */
  static async duplicateContract(id: number): Promise<Contract> {
    const original = ContractRepository.findById(id);
    if (!original) {
      throw new Error(`Contrato com ID ${id} não encontrado para duplicação.`);
    }

    const currentYear = new Date().getFullYear();
    const nextSeq = ContractRepository.getNextSequence(currentYear);
    const novoNumero = generateContractNumber(currentYear, nextSeq);

    // Cria novo evento duplicado
    const novoEvento = EventRepository.create({
      cliente_id: original.cliente_id,
      nome_evento: `Evento (Cópia de ${original.numero})`,
      tipo_evento: original.evento?.tipo_evento || 'OUTRO',
      data: original.evento?.data || new Date().toISOString().split('T')[0],
      horario: original.evento?.horario || '20:00',
      horario_termino: original.evento?.horario_termino || '22:00',
      endereco: original.evento?.endereco || '',
      cidade: original.evento?.cidade || '',
      estado: original.evento?.estado || '',
      cep: original.evento?.cep || '',
      duracao: original.evento?.duracao || 2,
      status: 'CONFIRMADO',
      valor_total: original.valor_total,
      observacoes: original.evento?.observacoes ? `(Cópia de ${original.numero}) ${original.evento.observacoes}` : `(Cópia de ${original.numero})`,
    });

    let novoContrato = ContractRepository.create({
      numero: novoNumero,
      tipo: original.tipo,
      cliente_id: original.cliente_id,
      evento_id: novoEvento.id,
      personagem: original.personagem,
      quantidade_personagens: original.quantidade_personagens,
      valor_total: original.valor_total,
      valor_entrada: original.valor_entrada,
      valor_restante: original.valor_restante,
      percentual_entrada: original.percentual_entrada,
      percentual_restante: original.percentual_restante,
      uso_imagem: original.uso_imagem,
      status: 'GERADO',
    });

    // Gera parcelas financeiras para a duplicação
    FinancialService.generateStandardInstallments({
      eventoId: novoEvento.id,
      contratoId: novoContrato.id,
      clienteId: original.cliente_id,
      totalValue: original.valor_total,
      eventDate: novoEvento.data,
      contratoNumero: novoContrato.numero,
    });

    // Gera PDF do contrato duplicado
    try {
      const empresa = CompanyRepository.get();
      const pdfResult = await generateContractPdf(novoContrato, empresa);
      novoContrato = ContractRepository.update(novoContrato.id, {
        pdf_path: pdfResult.relativeFilePath,
      });
    } catch (pdfErr) {
      console.error('Erro ao gerar PDF do contrato duplicado:', pdfErr);
    }

    return novoContrato;
  }

  /**
   * Gera novamente o PDF para um contrato existente
   */
  static async regeneratePdf(id: number): Promise<Contract> {
    const contract = ContractRepository.findById(id);
    if (!contract) {
      throw new Error(`Contrato com ID ${id} não encontrado.`);
    }

    const empresa = CompanyRepository.get();
    const pdfResult = await generateContractPdf(contract, empresa);

    return ContractRepository.update(id, {
      pdf_path: pdfResult.relativeFilePath,
      status: 'GERADO',
    });
  }

  /**
   * Obtém a visualização HTML de um contrato existente ou de um DTO para preview
   */
  static getPreviewHtml(contractOrDto: Contract | CreateContractDTO): string {
    const empresa = CompanyRepository.get();

    if ('numero' in contractOrDto && contractOrDto.numero) {
      return renderContractHtml(contractOrDto as Contract, empresa);
    } else {
      return renderPreviewFromDto(contractOrDto as CreateContractDTO, empresa);
    }
  }
}

