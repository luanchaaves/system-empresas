import { Contract, CompanyConfig, ContractTemplateData, CreateContractDTO } from '../types/index.js';
import { formatCPF } from '../domain/cpf.js';
import { formatCurrencyBRL, calculatePaymentSplit, formatDurationText, calculateEndTime } from '../domain/calculations.js';
import { formatDateDescriptive, formatDateExtenso } from '../domain/date.js';
import { getLogoBase64 } from './common/logo-base64.js';
import { renderRoboLedTemplate } from './robo-led/template.js';
import { renderPersonagensTemplate } from './personagens/template.js';

/**
 * Constrói os dados padronizados para alimentar os templates de contrato
 */
export function buildTemplateData(
  contract: Partial<Contract> & {
    cliente_nome?: string;
    cliente_cpf?: string;
    cliente_endereco?: string;
    cliente_telefone?: string;
    cliente_email?: string;
    evento_data?: string;
    evento_horario?: string;
    evento_endereco?: string;
    evento_duracao?: number;
    evento_observacoes?: string;
  },
  empresa: CompanyConfig,
  customLogoBase64?: string
): ContractTemplateData {
  const clienteNome = contract.cliente?.nome || contract.cliente_nome || '';
  const clienteCpf = formatCPF(contract.cliente?.cpf || contract.cliente_cpf || '');
  const clienteEndereco = contract.cliente?.endereco || contract.cliente_endereco || '';
  const clienteTelefone = contract.cliente?.telefone || contract.cliente_telefone || '';
  const clienteEmail = contract.cliente?.email || contract.cliente_email || '';

  const eventoDataRaw = contract.evento?.data || contract.evento_data || '';
  const eventoDataFormatada = formatDateDescriptive(eventoDataRaw);
  const eventoHorario = contract.evento?.horario || contract.evento_horario || '';
  const eventoEndereco = contract.evento?.endereco || contract.evento_endereco || '';
  const eventoDuracao = contract.evento?.duracao || contract.evento_duracao || 2;
  const eventoDuracaoFormatada = formatDurationText(eventoDuracao);
  const eventoHorarioTermino = contract.evento?.horario_termino || calculateEndTime(eventoHorario, eventoDuracao);
  const eventoObs = contract.evento?.observacoes || contract.evento_observacoes || '';

  const valorTotal = contract.valor_total || 0;
  const split = calculatePaymentSplit(valorTotal, contract.percentual_entrada || 40);

  const tipo = contract.tipo || 'ROBO_LED';
  const personagem = contract.personagem || '';
  const quantidade = contract.quantidade_personagens || 1;

  let descricaoPersonagens = '';
  if (tipo === 'PERSONAGEM') {
    if (personagem) {
      const qtdText = quantidade > 1 ? ` (${quantidade} personagens: ${personagem})` : ` (${personagem})`;
      descricaoPersonagens = ` com a atração ${qtdText}`;
    }
  }

  const usoImagemAutorizado = contract.uso_imagem !== 0;
  const dataEmissaoDate = contract.created_at ? new Date(contract.created_at) : new Date();
  const dataEmissaoExtenso = formatDateExtenso(dataEmissaoDate, empresa.cidade || 'São Bernardo do Campo');

  return {
    empresa: {
      nome: empresa.company_name || 'Robo Led Partner',
      responsavel: empresa.responsavel || 'Luan Chaves Bispo',
      documento: empresa.documento || '66.560.196/0001-87',
      endereco: empresa.endereco || 'Rua Senador Mario mota n230 - Sao Bernardo do campo',
      cidade: empresa.cidade || 'São Bernardo do Campo',
      estado: empresa.estado || 'SP',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
    },
    cliente: {
      nome: clienteNome,
      cpf: clienteCpf,
      endereco: clienteEndereco,
      telefone: clienteTelefone,
      email: clienteEmail,
    },
    evento: {
      data: eventoDataRaw,
      data_formatada: eventoDataFormatada,
      horario: eventoHorario,
      horario_termino: eventoHorarioTermino,
      endereco: eventoEndereco,
      duracao: eventoDuracao,
      duracao_formatada: eventoDuracaoFormatada,
      observacoes: eventoObs,
    },
    atracao: {
      tipo,
      tipo_formatado: tipo === 'ROBO_LED' ? 'Robô LED' : 'Personagens',
      personagem,
      quantidade,
      descricao_personagens: descricaoPersonagens,
    },
    financeiro: {
      valor_total: formatCurrencyBRL(split.valorTotal),
      valor_total_numero: split.valorTotal,
      valor_entrada: formatCurrencyBRL(split.valorEntrada),
      valor_entrada_numero: split.valorEntrada,
      valor_restante: formatCurrencyBRL(split.valorRestante),
      valor_restante_numero: split.valorRestante,
      percentual_entrada: split.percentualEntrada,
      percentual_restante: split.percentualRestante,
    },
    contrato: {
      numero: contract.numero || 'RLP-PREVIEW',
      data_emissao: dataEmissaoDate.toISOString(),
      data_emissao_extenso: dataEmissaoExtenso.replace(`${empresa.cidade}, `, '').replace(`${empresa.cidade} - SP, `, ''),
      cidade_emissao: empresa.cidade || 'São Bernardo do Campo',
      uso_imagem_autorizado: usoImagemAutorizado,
    },
  };
}

/**
 * Renderiza o HTML completo do contrato selecionado
 */
export function renderContractHtml(
  contract: Partial<Contract> & Record<string, any>,
  empresa: CompanyConfig,
  customLogoBase64?: string
): string {
  const data = buildTemplateData(contract, empresa, customLogoBase64);
  const logo = customLogoBase64 || getLogoBase64();

  if (data.atracao.tipo === 'ROBO_LED') {
    return renderRoboLedTemplate(data, logo);
  } else {
    return renderPersonagensTemplate(data, logo);
  }
}

/**
 * Converte DTO em dados para renderização de prévia
 */
export function renderPreviewFromDto(dto: CreateContractDTO, empresa: CompanyConfig): string {
  const contractPartial: any = {
    numero: 'RLP-PREVIEW',
    tipo: dto.tipo,
    personagem: dto.personagem,
    quantidade_personagens: dto.quantidade_personagens || 1,
    valor_total: dto.valor_total,
    percentual_entrada: 40,
    percentual_restante: 60,
    uso_imagem: dto.uso_imagem !== false ? 1 : 0,
    cliente_nome: dto.cliente_nome,
    cliente_cpf: dto.cliente_cpf,
    cliente_endereco: dto.cliente_endereco,
    cliente_telefone: dto.cliente_telefone,
    cliente_email: dto.cliente_email,
    evento_data: dto.evento_data,
    evento_horario: dto.evento_horario,
    evento_endereco: dto.evento_endereco,
    evento_duracao: dto.evento_duracao,
    evento_observacoes: dto.evento_observacoes,
  };

  return renderContractHtml(contractPartial, empresa);
}

/**
 * Validador de ausência de placeholders não substituídos
 */
export function validateNoPlaceholders(html: string): { valid: boolean; matches: string[] } {
  const placeholderRegex = /\{\{[^}]+\}\}/g;
  const matches = html.match(placeholderRegex) || [];
  return {
    valid: matches.length === 0,
    matches,
  };
}
