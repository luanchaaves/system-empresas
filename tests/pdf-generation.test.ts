import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import { generateContractPdf, closeBrowser } from '../src/pdf/generator.js';
import { Contract, CompanyConfig } from '../src/types/index.js';

describe('PDF Generation Engine (Puppeteer)', () => {
  const testCompany: CompanyConfig = {
    id: 1,
    company_name: 'Robo Led Partner',
    responsavel: 'Carlos Henrique Silva',
    documento: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1500 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
  };

  const testContract: Contract = {
    id: 99,
    numero: 'RLP-2026-TEST01',
    tipo: 'ROBO_LED',
    cliente_id: 1,
    evento_id: 1,
    personagem: '',
    quantidade_personagens: 1,
    valor_total: 1500,
    valor_entrada: 600,
    valor_restante: 900,
    percentual_entrada: 40,
    percentual_restante: 60,
    uso_imagem: 1,
    status: 'GERADO',
    created_at: '2026-08-26T10:00:00Z',
    updated_at: '2026-08-26T10:00:00Z',
    cliente: {
      id: 1,
      nome: 'Maria da Silva',
      cpf: '529.982.247-25',
      endereco: 'Rua das Flores, 123, São Paulo - SP',
      created_at: '2026-08-26T10:00:00Z',
      updated_at: '2026-08-26T10:00:00Z',
    },
    evento: {
      id: 1,
      cliente_id: 1,
      data: '2026-09-15',
      horario: '20:00',
      horario_termino: '22:00',
      endereco: 'Buffet Estrela Dourada, Av. Principal 500',
      duracao: 2,
      created_at: '2026-08-26T10:00:00Z',
      updated_at: '2026-08-26T10:00:00Z',
    },
  };

  afterAll(async () => {
    await closeBrowser();
  });

  it('deve gerar um arquivo PDF físico válido e não vazio no disco', async () => {
    const result = await generateContractPdf(testContract, testCompany);

    expect(result.filePath).toBeDefined();
    expect(fs.existsSync(result.filePath)).toBe(true);
    expect(result.fileSizeBytes).toBeGreaterThan(1000); // Mais de 1KB
    expect(result.fileName).toContain('RLP-2026-TEST01');
    expect(result.fileName.endsWith('.pdf')).toBe(true);
  }, 20000);
});
