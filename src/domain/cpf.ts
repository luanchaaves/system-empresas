/**
 * Validação e formatação oficial de CPF (Cadastro de Pessoas Físicas)
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function cleanCPF(cpf: string | undefined | null): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

/**
 * Valida se um CPF é válido segundo o algoritmo oficial da Receita Federal
 */
export function isValidCPF(cpf: string | undefined | null): boolean {
  const cleaned = cleanCPF(cpf);

  // Deve ter exatamente 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Rejeita sequências com todos os dígitos iguais (ex: 00000000000, 11111111111, etc.)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cleaned.charAt(9), 10)) {
    return false;
  }

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cleaned.charAt(10), 10)) {
    return false;
  }

  return true;
}

/**
 * Formata um CPF no padrão 000.000.000-00
 */
export function formatCPF(cpf: string | undefined | null): string {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

/**
 * Formata enquanto o usuário digita (limita a 11 dígitos numéricos)
 */
export function maskCPFInput(value: string): string {
  const digits = cleanCPF(value).slice(0, 11);
  return formatCPF(digits);
}

/**
 * Gera um CPF matematicamente válido (para testes e preenchimento rápido)
 */
export function generateCPF(): string {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let soma1 = 0;
  for (let i = 0; i < 9; i++) {
    soma1 += n[i] * (10 - i);
  }
  let resto1 = (soma1 * 10) % 11;
  if (resto1 === 10 || resto1 === 11) resto1 = 0;
  n.push(resto1);

  let soma2 = 0;
  for (let i = 0; i < 10; i++) {
    soma2 += n[i] * (11 - i);
  }
  let resto2 = (soma2 * 10) % 11;
  if (resto2 === 10 || resto2 === 11) resto2 = 0;
  n.push(resto2);

  return formatCPF(n.join(''));
}

