import { initDatabase, ClientRepository, EventRepository, ContractRepository, CompanyRepository } from './database.js';

export function runSeed(): void {
  initDatabase();

  console.log('🌱 Executando seed de demonstração...');

  // 1. Garante empresa
  CompanyRepository.update({
    company_name: 'Robo Led Partner',
    responsavel: 'Carlos Henrique Silva',
    documento: '12.345.678/0001-90',
    endereco: 'Av. Paulista, 1500 - Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    telefone: '(11) 99999-9999',
    email: 'contato@roboledpartner.com.br',
  });

  // 2. Cliente Demo 1 - Maria da Silva
  const cliente1 = ClientRepository.createOrUpdate({
    nome: 'Maria da Silva',
    cpf: '123.456.789-09',
    endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    telefone: '(11) 98888-1111',
    email: 'maria.silva@exemplo.com',
  });

  const evento1 = EventRepository.create({
    cliente_id: cliente1.id,
    nome_evento: 'Aniversário de 15 Anos - Maria da Silva',
    tipo_evento: 'ANIVERSARIO',
    data: '2026-09-15',
    horario: '20:00',
    horario_termino: '22:00',
    endereco: 'Espaço de Eventos XYZ, Rua das Flores 500, São Paulo - SP',
    cidade: 'São Paulo',
    estado: 'SP',
    duracao: 2,
    status: 'CONFIRMADO',
    valor_total: 1500,
    observacoes: 'Aniversário de 15 anos. Apresentação na pista principal.',
  });

  if (!ContractRepository.findByNumero('RLP-2026-000001')) {
    ContractRepository.create({
      numero: 'RLP-2026-000001',
      tipo: 'ROBO_LED',
      cliente_id: cliente1.id,
      evento_id: evento1.id,
      personagem: '',
      quantidade_personagens: 1,
      valor_total: 1500,
      valor_entrada: 600,
      valor_restante: 900,
      percentual_entrada: 40,
      percentual_restante: 60,
      uso_imagem: 1,
      status: 'GERADO',
      pdf_path: 'data/contracts/2026/09/RLP-2026-000001_Maria-da-Silva_RoboLED.pdf',
    });
  }

  // 3. Cliente Demo 2 - João da Silva
  const cliente2 = ClientRepository.createOrUpdate({
    nome: 'João da Silva',
    cpf: '987.654.321-00',
    endereco: 'Rua das Palmeiras, 250 - Santo André - SP',
    telefone: '(11) 97777-2222',
    email: 'joao.silva@exemplo.com',
  });

  const evento2 = EventRepository.create({
    cliente_id: cliente2.id,
    nome_evento: 'Festa Infantil - João da Silva',
    tipo_evento: 'INFANTIL',
    data: '2026-10-20',
    horario: '16:00',
    horario_termino: '17:00',
    endereco: 'Buffet Infantil Magia, Av. Kennedy 1200, São Paulo - SP',
    cidade: 'São Paulo',
    estado: 'SP',
    duracao: 1,
    status: 'CONFIRMADO',
    valor_total: 800,
    observacoes: 'Entrada na hora do parabéns com o Homem-Aranha.',
  });


  if (!ContractRepository.findByNumero('RLP-2026-000002')) {
    ContractRepository.create({
      numero: 'RLP-2026-000002',
      tipo: 'PERSONAGEM',
      cliente_id: cliente2.id,
      evento_id: evento2.id,
      personagem: 'Homem-Aranha',
      quantidade_personagens: 1,
      valor_total: 800,
      valor_entrada: 320,
      valor_restante: 480,
      percentual_entrada: 40,
      percentual_restante: 60,
      uso_imagem: 1,
      status: 'GERADO',
      pdf_path: 'data/contracts/2026/10/RLP-2026-000002_Joao-da-Silva_Personagem-Homem-Aranha.pdf',
    });
  }

  console.log('✅ Seed finalizado com sucesso!');
}

if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeed();
}
