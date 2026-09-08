import { ContractService } from '../src/server/services/contract.service.js';
import { CompanyRepository, ContractRepository, initDatabase } from '../src/server/db/database.js';
import { closeBrowser } from '../src/pdf/generator.js';
import fs from 'node:fs';
import path from 'node:path';

async function runAcceptanceTests() {
  console.log('🚀 Iniciando Testes de Aceitação Ponta a Ponta...\n');
  initDatabase();

  const empresa = CompanyRepository.get();
  console.log(`🏢 Empresa: ${empresa.company_name} | Responsável: ${empresa.responsavel} | CNPJ: ${empresa.documento}`);

  // TESTE 1: Robô LED - Maria da Silva
  console.log('\n========================================');
  console.log('📌 EXECUTANDO TESTE 1: Robô LED (Maria da Silva)');
  console.log('========================================');

  const contract1 = await ContractService.createContract({
    tipo: 'ROBO_LED',
    cliente_nome: 'Maria da Silva',
    cliente_cpf: '123.456.789-09',
    cliente_endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
    cliente_telefone: '(11) 98888-1111',
    cliente_email: 'maria.silva@exemplo.com',
    evento_data: '2026-09-15',
    evento_horario: '20:00',
    evento_duracao: 2,
    evento_endereco: 'Espaço de Eventos XYZ, Rua das Flores 500, São Paulo - SP',
    evento_cidade: 'São Paulo',
    evento_estado: 'SP',
    evento_observacoes: 'Aniversário de 15 anos.',
    valor_total: 1500,
    uso_imagem: true,
    status: 'GERADO',
  });

  console.log(`✅ Contrato Gerado: ${contract1.numero}`);
  console.log(`   - Cliente: ${contract1.cliente?.nome} (CPF: ${contract1.cliente?.cpf})`);
  console.log(`   - Atração: ${contract1.tipo}`);
  console.log(`   - Evento: ${contract1.evento?.data} às ${contract1.evento?.horario} (Término: ${contract1.evento?.horario_termino})`);
  console.log(`   - Valor Total: R$ ${contract1.valor_total.toFixed(2)}`);
  console.log(`   - Entrada (40%): R$ ${contract1.valor_entrada.toFixed(2)} | Restante (60%): R$ ${contract1.valor_restante.toFixed(2)}`);
  console.log(`   - PDF Path: ${contract1.pdf_path}`);

  if (contract1.pdf_path) {
    const fullPath1 = path.resolve(process.cwd(), contract1.pdf_path);
    if (fs.existsSync(fullPath1)) {
      const stats1 = fs.statSync(fullPath1);
      console.log(`   - PDF Verificado no Disco: ${stats1.size} bytes (${fullPath1})`);
    } else {
      throw new Error(`PDF não encontrado no disco: ${fullPath1}`);
    }
  }

  // TESTE 2: Personagem Homem-Aranha - João da Silva
  console.log('\n========================================');
  console.log('📌 EXECUTANDO TESTE 2: Personagem Homem-Aranha (João da Silva)');
  console.log('========================================');

  const contract2 = await ContractService.createContract({
    tipo: 'PERSONAGEM',
    personagem: 'Homem-Aranha',
    quantidade_personagens: 1,
    cliente_nome: 'João da Silva',
    cliente_cpf: '529.982.247-25',
    cliente_endereco: 'Rua das Palmeiras, 250 - Santo André - SP',
    cliente_telefone: '(11) 97777-2222',
    cliente_email: 'joao.silva@exemplo.com',
    evento_data: '2026-10-20',
    evento_horario: '16:00',
    evento_duracao: 1,
    evento_endereco: 'Buffet Infantil Magia, Av. Kennedy 1200, São Bernardo do Campo - SP',
    evento_cidade: 'São Bernardo do Campo',
    evento_estado: 'SP',
    evento_observacoes: 'Entrada na hora do parabéns com o Homem-Aranha.',
    valor_total: 800,
    uso_imagem: false, // Imagem não autorizada
    status: 'GERADO',
  });

  console.log(`✅ Contrato Gerado: ${contract2.numero}`);
  console.log(`   - Cliente: ${contract2.cliente?.nome} (CPF: ${contract2.cliente?.cpf})`);
  console.log(`   - Atração: ${contract2.tipo} (${contract2.personagem})`);
  console.log(`   - Evento: ${contract2.evento?.data} às ${contract2.evento?.horario} (Término: ${contract2.evento?.horario_termino})`);
  console.log(`   - Valor Total: R$ ${contract2.valor_total.toFixed(2)}`);
  console.log(`   - Entrada (40%): R$ ${contract2.valor_entrada.toFixed(2)} | Restante (60%): R$ ${contract2.valor_restante.toFixed(2)}`);
  console.log(`   - Uso de Imagem: ${contract2.uso_imagem ? 'Autorizado' : 'NÃO Autorizado'}`);
  console.log(`   - PDF Path: ${contract2.pdf_path}`);

  if (contract2.pdf_path) {
    const fullPath2 = path.resolve(process.cwd(), contract2.pdf_path);
    if (fs.existsSync(fullPath2)) {
      const stats2 = fs.statSync(fullPath2);
      console.log(`   - PDF Verificado no Disco: ${stats2.size} bytes (${fullPath2})`);
    } else {
      throw new Error(`PDF não encontrado no disco: ${fullPath2}`);
    }
  }

  // TESTE 3: Duplicação de Contrato
  console.log('\n========================================');
  console.log('📌 EXECUTANDO TESTE 3: Duplicação de Contrato');
  console.log('========================================');

  const duplicated = await ContractService.duplicateContract(contract1.id);
  console.log(`✅ Contrato Duplicado com Sucesso!`);
  console.log(`   - Original: ${contract1.numero} -> Novo: ${duplicated.numero}`);
  console.log(`   - Novo PDF: ${duplicated.pdf_path}`);

  await closeBrowser();
  console.log('\n🎉 TODOS OS TESTES DE ACEITAÇÃO FORAM CONCLUÍDOS COM 100% DE SUCESSO!\n');
}

runAcceptanceTests().catch((err) => {
  console.error('❌ Erro nos testes de aceitação:', err);
  process.exit(1);
});
