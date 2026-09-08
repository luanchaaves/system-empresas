import { describe, it, expect } from 'vitest';
import { renderContractHtml, validateNoPlaceholders } from '../src/templates/renderer.js';
import { generateContractNumber } from '../src/domain/number-generator.js';
import { generateContractFileName, sanitizeFileName } from '../src/domain/sanitizer.js';
import { Contract, CompanyConfig } from '../src/types/index.js';

describe('Templates and Compilation Engine', () => {
  const dummyEmpresa: CompanyConfig = {
    id: 1,
    company_name: 'Robo Led Partner',
    responsavel: 'Carlos Henrique Silva',
    documento: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1500 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    telefone: '(11) 99999-9999',
    email: 'contato@roboledpartner.com.br',
  };

  const dummyRoboContract: Contract = {
    id: 1,
    numero: 'RLP-2026-000001',
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

  const dummyPersonagemContract: Contract = {
    ...dummyRoboContract,
    id: 2,
    numero: 'RLP-2026-000002',
    tipo: 'PERSONAGEM',
    personagem: 'Homem-Aranha',
    quantidade_personagens: 1,
    uso_imagem: 0, // Não autorizado
  };

  it('deve compilar contrato de Robô LED sem nenhum placeholder {{...}} não resolvido', () => {
    const html = renderContractHtml(dummyRoboContract, dummyEmpresa);
    const validation = validateNoPlaceholders(html);

    expect(validation.valid).toBe(true);
    expect(validation.matches).toHaveLength(0);

    // Deve conter dados reais do contratante e contratado
    expect(html).toContain('Maria da Silva');
    expect(html).toContain('529.982.247-25');
    expect(html).toContain('Robo Led Partner');
    expect(html).toContain('Carlos Henrique Silva');
    expect(html).toContain('12.345.678/0001-90');
    expect(html).toContain('R$ 1.500,00');
    expect(html).toContain('40% (R$ 600,00)');
    expect(html).toContain('60% (R$ 900,00)');
    expect(html).toContain('RLP-2026-000001');
    expect(html).toContain('Página 1/2');
    expect(html).toContain('Página 2/2');
  });

  it('deve compilar contrato de Personagens com atração e cláusula de uso de imagem não autorizado', () => {
    const html = renderContractHtml(dummyPersonagemContract, dummyEmpresa);
    const validation = validateNoPlaceholders(html);

    expect(validation.valid).toBe(true);
    expect(validation.matches).toHaveLength(0);
    expect(html).toContain('Homem-Aranha');
    expect(html).toContain('NÃO autorização');
    expect(html).toContain('RLP-2026-000002');
  });

  it('deve formatar número sequencial de contrato com 6 dígitos RLP-YYYY-NNNNNN', () => {
    expect(generateContractNumber(2026, 1)).toBe('RLP-2026-000001');
    expect(generateContractNumber(2026, 42)).toBe('RLP-2026-000042');
    expect(generateContractNumber(2027, 1005)).toBe('RLP-2027-001005');
  });

  it('deve sanitizar nomes de arquivos para Windows', () => {
    const raw = 'Maria da Silva: Contrato / * ?';
    const sanitized = sanitizeFileName(raw);
    expect(sanitized).not.toMatch(/[\/\\:*?"<>|]/);

    const pdfName = generateContractFileName('RLP-2026-000001', 'Maria da Silva', 'ROBO_LED');
    expect(pdfName).toBe('RLP-2026-000001_Maria-da-Silva_RoboLED.pdf');
  });
});
