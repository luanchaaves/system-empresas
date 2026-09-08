import { describe, it, expect } from 'vitest';
import {
  formatDateBR,
  formatDateDescriptive,
  formatDateExtenso,
  isValidISODate,
} from '../src/domain/date.js';

describe('Date Domain Module', () => {
  it('deve formatar datas para o padrão DD/MM/YYYY', () => {
    expect(formatDateBR('2026-09-15')).toBe('15/09/2026');
    expect(formatDateBR('2026-12-01')).toBe('01/12/2026');
    expect(formatDateBR('')).toBe('');
  });

  it('deve formatar data descritiva em português', () => {
    expect(formatDateDescriptive('2026-09-15')).toBe('15 de setembro de 2026');
    expect(formatDateDescriptive('2026-01-05')).toBe('5 de janeiro de 2026');
  });

  it('deve gerar data por extenso completa com localidade para o rodapé', () => {
    const fixedDate = new Date('2026-08-26T12:00:00Z');
    const result = formatDateExtenso(fixedDate, 'São Bernardo do Campo');
    expect(result).toBe('São Bernardo do Campo, 26 de agosto de 2026');
  });

  it('deve validar datas no formato ISO YYYY-MM-DD', () => {
    expect(isValidISODate('2026-08-26')).toBe(true);
    expect(isValidISODate('2026-02-29')).toBe(false); // 2026 não é bissexto
    expect(isValidISODate('data-invalida')).toBe(false);
  });
});
