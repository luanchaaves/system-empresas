import { db, EventRepository, ContractRepository, ClientRepository, CompanyRepository } from './database.js';
import { generateContractFileName } from '../../domain/sanitizer.js';
import { generateContractPdf } from '../../pdf/generator.js';
import { AttractionType, Contract } from '../../types/index.js';

export async function generateAllContractsForEvents(): Promise<{
  totalProcessed: number;
  totalCreated: number;
  errors: Array<{ eventId: number; error: string }>;
}> {
  console.log('📄 Iniciando geração de contratos para todos os eventos cadastrados...');
  const events = EventRepository.list();
  const empresa = CompanyRepository.get();

  let totalProcessed = 0;
  let totalCreated = 0;
  const errors: Array<{ eventId: number; error: string }> = [];

  for (const ev of events) {
    totalProcessed++;

    // Verifica se evento já possui contrato
    const existingContract = ContractRepository.findByEventoId(ev.id);
    if (existingContract) {
      continue;
    }

    try {
      const cliente = ev.cliente || ClientRepository.findById(ev.cliente_id);
      if (!cliente) {
        errors.push({ eventId: ev.id, error: 'Cliente não encontrado' });
        continue;
      }

      const eventYear = parseInt(ev.data.substring(0, 4), 10) || new Date().getFullYear();
      const sequence = ContractRepository.getNextSequence(eventYear);
      const contractNumber = `RLP-${eventYear}-${String(sequence).padStart(3, '0')}`;

      // Determina tipo de atração e descrição
      const hasPersonagem = ev.atracoes?.some(
        (a) => a.atracao?.categoria === 'PERSONAGEM_VIVO' || a.atracao?.nome.toLowerCase().includes('casa')
      );
      const contractType: AttractionType = hasPersonagem ? 'PERSONAGEM' : 'ROBO_LED';

      let personagemDesc = '';
      if (ev.atracoes && ev.atracoes.length > 0) {
        personagemDesc = ev.atracoes.map((a) => a.atracao?.nome || 'Robô LED').join(', ');
      } else {
        personagemDesc = contractType === 'PERSONAGEM' ? 'La Casa de Papel' : 'Robô LED Nextrom';
      }

      const valorTotal = ev.valor_total || 550;
      const valorEntrada = Math.round(valorTotal * 0.4 * 100) / 100;
      const valorRestante = Math.round((valorTotal - valorEntrada) * 100) / 100;

      // Cria contrato no banco
      const now = new Date().toISOString();
      const insertResult = db.prepare(`
        INSERT INTO contratos (
          numero, tipo, cliente_id, evento_id, personagem, quantidade_personagens,
          valor_total, valor_entrada, valor_restante, percentual_entrada, percentual_restante,
          uso_imagem, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 40, 60, 1, 'GERADO', ?, ?)
      `).run(
        contractNumber,
        contractType,
        cliente.id,
        ev.id,
        personagemDesc,
        valorTotal,
        valorEntrada,
        valorRestante,
        now,
        now
      );

      const contractId = Number(insertResult.lastInsertRowid);
      const contract = ContractRepository.findById(contractId);

      if (!contract) {
        throw new Error('Falha ao recuperar contrato recém-criado');
      }

      // Gera o PDF no disco usando Puppeteer
      try {
        const pdfResult = await generateContractPdf(contract, empresa);
        ContractRepository.update(contractId, {
          pdf_path: pdfResult.relativeFilePath,
        });
      } catch (pdfErr: any) {
        console.warn(`Aviso ao gerar PDF para contrato ${contractNumber}:`, pdfErr.message);
      }

      // Atualiza lançamentos financeiros vinculados ao evento com o contrato_id
      db.prepare(`
        UPDATE lancamentos_financeiros
        SET contrato_id = ?, updated_at = ?
        WHERE evento_id = ?
      `).run(contractId, now, ev.id);

      totalCreated++;
      console.log(`✓ [${totalCreated}] Contrato ${contractNumber} criado para evento #${ev.id} (${cliente.nome})`);
    } catch (err: any) {
      console.error(`Erro ao criar contrato para evento #${ev.id}:`, err.message);
      errors.push({ eventId: ev.id, error: err.message });
    }
  }

  console.log(`\n🎉 Concluído! ${totalCreated} contratos padronizados gerados de ${totalProcessed} eventos.`);
  return {
    totalProcessed,
    totalCreated,
    errors,
  };
}

// Execução direta via CLI se chamado diretamente
if (process.argv[1]?.includes('generate-all-contracts')) {
  generateAllContractsForEvents()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
