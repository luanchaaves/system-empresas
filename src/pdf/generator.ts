import puppeteer, { Browser } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { Contract, CompanyConfig } from '../types/index.js';
import { renderContractHtml, validateNoPlaceholders } from '../templates/renderer.js';
import { generateContractFileName } from '../domain/sanitizer.js';

let browserInstance: Browser | null = null;

/**
 * Obtém ou reutiliza a instância do navegador Puppeteer para velocidade máxima
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  return browserInstance;
}

export interface PdfGenerationResult {
  filePath: string;
  relativeFilePath: string;
  fileName: string;
  fileSizeBytes: number;
  totalPages: number;
}

/**
 * Gera o arquivo PDF profissional do contrato e salva no disco
 */
export async function generateContractPdf(
  contract: Contract,
  empresa: CompanyConfig
): Promise<PdfGenerationResult> {
  const html = renderContractHtml(contract, empresa);

  // Validação estrita de placeholders
  const validation = validateNoPlaceholders(html);
  if (!validation.valid) {
    throw new Error(`Placeholders não substituídos encontrados no contrato: ${validation.matches.join(', ')}`);
  }

  // Define diretório de destino baseado na data de criação do contrato
  const contractDate = contract.created_at ? new Date(contract.created_at) : new Date();
  const yearStr = String(contractDate.getFullYear());
  const monthStr = String(contractDate.getMonth() + 1).padStart(2, '0');

  const contractsBaseDir = path.resolve(process.cwd(), 'data', 'contracts', yearStr, monthStr);
  if (!fs.existsSync(contractsBaseDir)) {
    fs.mkdirSync(contractsBaseDir, { recursive: true });
  }

  const fileName = generateContractFileName(
    contract.numero,
    contract.cliente?.nome || 'Cliente',
    contract.tipo,
    contract.personagem
  );

  const fullFilePath = path.join(contractsBaseDir, fileName);
  const relativeFilePath = `data/contracts/${yearStr}/${monthStr}/${fileName}`;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    await page.pdf({
      path: fullFilePath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
      timeout: 20000,
    });

    const stats = fs.statSync(fullFilePath);

    return {
      filePath: fullFilePath,
      relativeFilePath,
      fileName,
      fileSizeBytes: stats.size,
      totalPages: 2,
    };
  } finally {
    await page.close();
  }
}

/**
 * Fecha a instância do Puppeteer (usado em testes ou encerramento do servidor)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
