/**
 * Sanitização e segurança de nomes de arquivos para Windows e Linux
 */

/**
 * Remove acentos e caracteres inválidos para sistemas de arquivos
 */
export function sanitizeFileName(name: string): string {
  if (!name) return 'arquivo';

  return name
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[\\/:*?"<>|]/g, '') // Remove caracteres proibidos no Windows
    .replace(/\s+/g, '-') // Substitui espaços por traço
    .replace(/[^a-zA-Z0-9._-]/g, '') // Remove quaisquer outros símbolos estranhos
    .replace(/-+/g, '-') // Remove traços repetidos
    .trim();
}

/**
 * Gera o nome de arquivo padronizado para o PDF do contrato
 * Exemplos:
 * RLP-2026-000001_Maria-Silva_RoboLED.pdf
 * RLP-2026-000002_Joao-Silva_Personagem-Homem-Aranha.pdf
 */
export function generateContractFileName(
  numero: string,
  clienteNome: string,
  tipo: string,
  personagem?: string
): string {
  const safeNumero = sanitizeFileName(numero);
  const safeCliente = sanitizeFileName(clienteNome);

  let atracaoSuffix = 'RoboLED';
  if (tipo === 'PERSONAGEM') {
    if (personagem && personagem.trim().length > 0) {
      atracaoSuffix = `Personagem-${sanitizeFileName(personagem)}`;
    } else {
      atracaoSuffix = 'Personagens';
    }
  }

  return `${safeNumero}_${safeCliente}_${atracaoSuffix}.pdf`;
}
