import { describe, it, expect } from 'vitest';
import {
  calculatePaymentSplit,
  formatCurrencyBRL,
  parseCurrencyBRL,
  calculateEndTime,
  formatDurationText,
} from '../src/domain/calculations.js';

describe('Calculations & Financial Domain', () => {
  it('deve calcular divisão 40%/60% sem perda de centavos (soma exata)', () => {
    // Exemplo 1: R$ 1.500,00
    const split1 = calculatePaymentSplit(1500, 40);
    expect(split1.valorTotal).toBe(1500);
    expect(split1.valorEntrada).toBe(600);
    expect(split1.valorRestante).toBe(900);
    expect(split1.valorEntrada + split1.valorRestante).toBe(1500);

    // Exemplo 2: R$ 1.250,50
    const split2 = calculatePaymentSplit(1250.50, 40);
    expect(split2.valorEntrada).toBe(500.20);
    expect(split2.valorRestante).toBe(750.30);
    expect(Number((split2.valorEntrada + split2.valorRestante).toFixed(2))).toBe(1250.50);

    // Exemplo 3: R$ 1.333,33 (número ímpar com centavos)
    const split3 = calculatePaymentSplit(1333.33, 40);
    expect(Number((split3.valorEntrada + split3.valorRestante).toFixed(2))).toBe(1333.33);
  });

  it('deve formatar valores monetários para padrão BRL (1.500,00)', () => {
    expect(formatCurrencyBRL(1500)).toBe('1.500,00');
    expect(formatCurrencyBRL(1500, true)).toBe('R$ 1.500,00');
    expect(formatCurrencyBRL(600.5)).toBe('600,50');
    expect(formatCurrencyBRL(0)).toBe('0,00');
  });

  it('deve converter strings em números com precisão', () => {
    expect(parseCurrencyBRL('1.500,00')).toBe(1500);
    expect(parseCurrencyBRL('R$ 1.250,50')).toBe(1250.5);
    expect(parseCurrencyBRL('600')).toBe(600);
  });

  it('deve calcular horário de término a partir do início e duração', () => {
    expect(calculateEndTime('20:00', 2)).toBe('22:00');
    expect(calculateEndTime('20:30', 1.5)).toBe('22:00');
    expect(calculateEndTime('21:00', 0.75)).toBe('21:45');
    // Virada de meia-noite
    expect(calculateEndTime('23:00', 2)).toBe('01:00');
  });

  it('deve formatar texto de duração descritiva', () => {
    expect(formatDurationText(2)).toBe('2 horas');
    expect(formatDurationText(1)).toBe('1 hora');
    expect(formatDurationText(1.5)).toBe('1 hora e 30 minutos');
    expect(formatDurationText(0.75)).toBe('45 minutos');
  });
});
