import { describe, it, expect } from 'vitest';
import { isValidCPF, cleanCPF, formatCPF, maskCPFInput } from '../src/domain/cpf.js';

describe('CPF Domain Module', () => {
  it('deve validar CPFs válidos conhecidos', () => {
    // CPFs válidos matematicamente segundo a regra da Receita Federal
    expect(isValidCPF('52998224725')).toBe(true);
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('12345678909')).toBe(true);
    expect(isValidCPF('123.456.789-09')).toBe(true);
  });

  it('deve rejeitar CPFs com dígitos repetidos inválidos', () => {
    expect(isValidCPF('000.000.000-00')).toBe(false);
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('222.222.222-22')).toBe(false);
    expect(isValidCPF('999.999.999-99')).toBe(false);
  });

  it('deve rejeitar CPFs com dígitos verificadores incorretos ou tamanho inválido', () => {
    expect(isValidCPF('123.456.789-00')).toBe(false);
    expect(isValidCPF('123456789')).toBe(false);
    expect(isValidCPF('1234567890123')).toBe(false);
    expect(isValidCPF('')).toBe(false);
    expect(isValidCPF(null as any)).toBe(false);
  });

  it('deve limpar caracteres não numéricos corretamente', () => {
    expect(cleanCPF('123.456.789-09')).toBe('12345678909');
    expect(cleanCPF('abc 123 - 456 . 789 / 09')).toBe('12345678909');
    expect(cleanCPF('')).toBe('');
  });

  it('deve formatar CPFs no padrão 000.000.000-00', () => {
    expect(formatCPF('12345678909')).toBe('123.456.789-09');
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });

  it('deve aplicar máscara progressiva enquanto o usuário digita', () => {
    expect(maskCPFInput('123')).toBe('123');
    expect(maskCPFInput('1234')).toBe('123.4');
    expect(maskCPFInput('123456')).toBe('123.456');
    expect(maskCPFInput('12345678909111')).toBe('123.456.789-09');
  });
});
