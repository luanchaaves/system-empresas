/**
 * Formatação e manipulação de datas no padrão brasileiro
 */

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

/**
 * Valida se uma string é uma data válida no formato YYYY-MM-DD ou DD/MM/YYYY
 */
export function isValidDate(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;

  let year: number;
  let month: number;
  let day: number;

  if (dateStr.includes('-')) {
    // YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false;
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else if (dateStr.includes('/')) {
    // DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    return false;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1900 || year > 2100) return false;
  if (month < 0 || month > 11) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(year, month, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month &&
    date.getDate() === day
  );
}

/**
 * Converte data ISO ou YYYY-MM-DD para objeto Date seguro (evitando offset de timezone UTC)
 */
export function parseDateSafe(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const [yearStr, monthStr, dayStr] = dateInput.split('T')[0].split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    return new Date(year, month, day);
  }

  return new Date(dateInput);
}

/**
 * Formata data no padrão DD/MM/YYYY
 */
export function formatDateBR(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const date = parseDateSafe(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata a data de forma descritiva (ex: "15 de abril de 2027")
 */
export function formatDateDescriptive(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const date = parseDateSafe(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = date.getDate();
  const monthName = MESES[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${monthName} de ${year}`;
}

/**
 * Formata a data de emissão completa para o rodapé do contrato
 * Ex: "São Bernardo do Campo, 26 de agosto de 2026"
 */
export function formatDateExtenso(
  dateInput: string | Date = new Date(),
  cidade = 'São Bernardo do Campo'
): string {
  const date = parseDateSafe(dateInput);
  if (isNaN(date.getTime())) return `${cidade}`;

  const day = date.getDate();
  const monthName = MESES[date.getMonth()];
  const year = date.getFullYear();

  return `${cidade}, ${day} de ${monthName} de ${year}`;
}

export const isValidISODate = isValidDate;
