import fs from 'node:fs';
import path from 'node:path';

let cachedLogoBase64: string | null = null;

export function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;

  try {
    const logoPath = path.resolve(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogoBase64;
    }
  } catch (err) {
    console.error('Erro ao carregar logo base64:', err);
  }

  // Fallback SVG if file not found
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100"><polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="%239b0075" stroke="%23ff0099" stroke-width="4"/><text x="50" y="58" font-size="28" font-family="Arial" font-weight="bold" fill="white" text-anchor="middle">RLP</text></svg>`;
}
