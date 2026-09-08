/**
 * Regras de negócios para cálculos financeiros e temporais
 */

export interface PaymentSplit {
  valorTotal: number;
  valorEntrada: number;
  valorRestante: number;
  percentualEntrada: number;
  percentualRestante: number;
}

/**
 * Calcula a divisão do pagamento em 40% de entrada e 60% restante
 * Utiliza cálculo baseado em centavos inteiros para evitar imprecisões de ponto flutuante.
 */
export function calculatePaymentSplit(
  valorTotal: number,
  percentualEntrada = 40
): PaymentSplit {
  if (isNaN(valorTotal) || valorTotal <= 0) {
    return {
      valorTotal: 0,
      valorEntrada: 0,
      valorRestante: 0,
      percentualEntrada: 40,
      percentualRestante: 60,
    };
  }

  const percentualRestante = 100 - percentualEntrada;
  const totalCentavos = Math.round(valorTotal * 100);

  // Entrada = 40% do total arredondado para o centavo mais próximo
  const entradaCentavos = Math.round((totalCentavos * percentualEntrada) / 100);
  
  // Restante = Total - Entrada (garante que entrada + restante == total exato)
  const restanteCentavos = totalCentavos - entradaCentavos;

  return {
    valorTotal: totalCentavos / 100,
    valorEntrada: entradaCentavos / 100,
    valorRestante: restanteCentavos / 100,
    percentualEntrada,
    percentualRestante,
  };
}

/**
 * Formata um valor numérico para a moeda brasileira (ex: "1.500,00" ou "R$ 1.500,00")
 */
export function formatCurrencyBRL(valor: number, includeSymbol = false): string {
  if (isNaN(valor)) valor = 0;
  
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);

  return includeSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Converte string formatada em número seguro (ex: "1.500,00" ou "R$ 1.500,00" -> 1500)
 */
export function parseCurrencyBRL(valorStr: string | number): number {
  if (typeof valorStr === 'number') return isNaN(valorStr) ? 0 : valorStr;
  if (!valorStr) return 0;

  // Remove "R$", espaços e outros símbolos exceto dígitos, vírgula e ponto
  let cleaned = valorStr.replace(/[^\d.,]/g, '').trim();

  // Se tiver formato brasileiro 1.500,00
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calcula o horário de término com base no horário de início (HH:mm) e duração em horas (ex: 1, 1.5, 2)
 */
export function calculateEndTime(horarioInicio: string, duracaoHoras: number): string {
  if (!horarioInicio || !horarioInicio.includes(':')) {
    return '';
  }

  const [hoursStr, minutesStr] = horarioInicio.split(':');
  const startHours = parseInt(hoursStr, 10);
  const startMinutes = parseInt(minutesStr, 10);

  if (isNaN(startHours) || isNaN(startMinutes)) {
    return '';
  }

  const durationMinutes = Math.round(duracaoHoras * 60);
  const totalMinutes = startHours * 60 + startMinutes + durationMinutes;

  // Tratamento de virada de dia (24h)
  const endTotalMinutes = totalMinutes % (24 * 60);
  const endHours = Math.floor(endTotalMinutes / 60);
  const endMins = endTotalMinutes % 60;

  const paddedHours = String(endHours).padStart(2, '0');
  const paddedMins = String(endMins).padStart(2, '0');

  return `${paddedHours}:${paddedMins}`;
}

/**
 * Formata a duração em texto amigável para o contrato
 * Ex: 1 -> "1 hora"
 * Ex: 1.5 -> "1 hora e 30 minutos"
 * Ex: 2 -> "2 horas"
 * Ex: 0.75 -> "45 minutos"
 */
export function formatDurationText(duracaoHoras: number): string {
  if (duracaoHoras === 1) return '1 hora';
  if (duracaoHoras === 1.5) return '1 hora e 30 minutos';
  if (duracaoHoras === 0.75) return '45 minutos';
  if (duracaoHoras % 1 === 0) return `${duracaoHoras} horas`;

  const hours = Math.floor(duracaoHoras);
  const minutes = Math.round((duracaoHoras - hours) * 60);

  if (hours === 0) return `${minutes} minutos`;
  if (hours === 1) return `1 hora e ${minutes} minutos`;
  return `${hours} horas e ${minutes} minutos`;
}
