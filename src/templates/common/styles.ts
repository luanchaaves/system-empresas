/**
 * Estilos CSS padronizados para renderização em A4 (HTML e PDF)
 */

export const contractStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  @page {
    size: A4;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background-color: #ffffff;
    font-size: 13.5px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .contract-page {
    width: 210mm;
    min-height: 297mm;
    height: 297mm;
    position: relative;
    padding: 0 0 35px 0;
    box-sizing: border-box;
    background: #ffffff;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .contract-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  /* Cabeçalho Topo */
  .header-banner {
    background: linear-gradient(135deg, #70005a 0%, #9b0075 40%, #520042 100%);
    color: #ffffff;
    padding: 22px 35px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #ff0099;
  }

  .header-banner h1 {
    font-size: 26px;
    font-weight: 900;
    text-transform: uppercase;
    line-height: 1.1;
    letter-spacing: -0.5px;
  }

  .header-banner .logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-banner .logo-container img {
    height: 60px;
    width: auto;
    object-fit: contain;
    filter: drop-shadow(0 0 8px rgba(255, 0, 153, 0.6));
  }

  /* Conteúdo Principal */
  .contract-content {
    padding: 20px 35px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* Caixa de Partes Contratantes */
  .parties-box {
    background-color: #f7eaf8;
    border: 1px solid #e7c5ec;
    border-radius: 6px;
    padding: 12px 18px;
    margin-bottom: 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 12.5px;
  }

  .party-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .party-row {
    display: flex;
    gap: 6px;
    line-height: 1.35;
  }

  .party-label {
    font-weight: 800;
    color: #800060;
    min-width: 100px;
    text-transform: uppercase;
    font-size: 11.5px;
  }

  .party-value {
    color: #222222;
    font-weight: 500;
    word-break: break-word;
  }

  /* Cláusulas */
  .clause {
    margin-bottom: 14px;
  }

  .clause-title {
    font-weight: 800;
    font-size: 13.5px;
    color: #111111;
    margin-bottom: 4px;
    display: flex;
    align-items: baseline;
  }

  .clause-body {
    font-size: 13px;
    color: #222222;
    text-align: justify;
    line-height: 1.45;
  }

  .clause-body p {
    margin-bottom: 6px;
  }

  .clause-body p:last-child {
    margin-bottom: 0;
  }

  .clause-body ul {
    list-style-type: none;
    padding-left: 0;
    margin-top: 4px;
  }

  .clause-body ul li {
    margin-bottom: 3px;
    padding-left: 12px;
    position: relative;
  }

  .clause-body ul.bullet-list li {
    padding-left: 14px;
  }

  .clause-body ul.bullet-list li::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #800060;
    font-weight: bold;
  }

  .clause-paragraph {
    margin-top: 5px;
    font-size: 12.5px;
    color: #333333;
    font-style: italic;
  }

  /* Rodapé e Assinaturas */
  .signature-section {
    margin-top: auto;
    padding-top: 25px;
  }

  .date-location {
    font-size: 13.5px;
    color: #111111;
    margin-bottom: 45px;
    font-weight: 500;
  }

  .signatures-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 15px;
  }

  .signature-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .signature-line {
    width: 100%;
    border-top: 1.5px solid #a8328c;
    margin-bottom: 6px;
  }

  .signature-name {
    font-size: 12px;
    font-weight: 800;
    color: #9b0075;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .signature-detail {
    font-size: 11px;
    color: #444444;
    font-weight: 500;
  }

  /* Barra Inferior Decorativa */
  .footer-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 12px;
    background: linear-gradient(90deg, #70005a 0%, #ff0099 50%, #70005a 100%);
  }

  .contract-number-tag {
    position: absolute;
    bottom: 16px;
    right: 35px;
    font-size: 10px;
    color: #777777;
    font-weight: 600;
  }
`;
