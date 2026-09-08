/**
 * Gerador de identificadores sequenciais de contratos
 * Formato padrão: RLP-ANO-SEQUENCIAL (ex: RLP-2026-000001)
 */

export function generateContractNumber(year: number, sequence: number): string {
  const padded = String(sequence).padStart(6, '0');
  return `RLP-${year}-${padded}`;
}

export function parseContractNumber(contractNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const match = contractNumber.match(/^([A-Z]+)-(\d{4})-(\d{6})$/);
  if (!match) return null;

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}
