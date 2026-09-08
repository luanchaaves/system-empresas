import { ContractTemplateData } from '../../types/index.js';
import { contractStyles } from '../common/styles.js';

export function renderRoboLedTemplate(data: ContractTemplateData, logoBase64: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato Robô LED — ${data.contrato.numero}</title>
  <style>
    ${contractStyles}
  </style>
</head>
<body>

  <!-- PÁGINA 1 -->
  <div class="contract-page">
    <div class="header-banner">
      <h1>Contrato de<br>Prestação de<br>Serviços</h1>
      <div class="logo-container">
        <img src="${logoBase64}" alt="Robo Led Partner Logo">
      </div>
    </div>

    <div class="contract-content">
      <!-- Caixa de Partes -->
      <div class="parties-box">
        <div class="party-column">
          <div class="party-row">
            <span class="party-label">CONTRATANTE:</span>
            <span class="party-value">${data.cliente.nome}</span>
          </div>
          <div class="party-row">
            <span class="party-label">ENDEREÇO:</span>
            <span class="party-value">${data.cliente.endereco}</span>
          </div>
          <div class="party-row">
            <span class="party-label">CPF:</span>
            <span class="party-value">${data.cliente.cpf}</span>
          </div>
        </div>

        <div class="party-column">
          <div class="party-row">
            <span class="party-label">CONTRATADO:</span>
            <span class="party-value">${data.empresa.nome}</span>
          </div>
          <div class="party-row">
            <span class="party-label">RESPONSÁVEL/CNPJ:</span>
            <span class="party-value">${data.empresa.responsavel} / ${data.empresa.documento}</span>
          </div>
          <div class="party-row">
            <span class="party-label">ENDEREÇO:</span>
            <span class="party-value">${data.empresa.endereco}</span>
          </div>
        </div>
      </div>

      <!-- Cláusula 1ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 1ª – Objeto</div>
        <div class="clause-body">
          <p>O presente contrato tem como objeto a prestação de serviços de apresentação de <strong>Robô de LED</strong> em evento organizado pelo <strong>CONTRATANTE</strong>, conforme especificações acordadas previamente.</p>
        </div>
      </div>

      <!-- Cláusula 2ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 2ª – Data, Local e Duração</div>
        <div class="clause-body">
          <p>O serviço será prestado no dia <strong>${data.evento.data_formatada}</strong>, no endereço <strong>${data.evento.endereco}</strong>${data.evento.horario ? `, no horário <strong>${data.evento.horario}</strong>` : ''}.</p>
          <p>A duração da apresentação será de aproximadamente <strong>${data.evento.duracao_formatada}</strong>, podendo ser ajustada conforme programação do evento.</p>
        </div>
      </div>

      <!-- Cláusula 3ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 3ª – Obrigações da Prestadora</div>
        <div class="clause-body">
          <ul>
            <li><strong>a)</strong> Disponibilizar o Robô de LED em perfeito funcionamento, com equipamentos revisados e testados;</li>
            <li><strong>b)</strong> Fornecer operador devidamente treinado para conduzir a performance;</li>
            <li><strong>c)</strong> Cumprir os horários acordados;</li>
            <li><strong>d)</strong> Responsabilizar-se pelo transporte, montagem e desmontagem dos equipamentos necessários.</li>
          </ul>
        </div>
      </div>

      <!-- Cláusula 4ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 4ª – Obrigações do Contratante</div>
        <div class="clause-body">
          <ul>
            <li><strong>a)</strong> Disponibilizar espaço adequado e seguro para a apresentação do Robô de LED;</li>
            <li><strong>b)</strong> Garantir condições de acesso;</li>
            <li><strong>c)</strong> Zelar pela integridade do equipamento durante o evento, evitando contato indevido por parte dos convidados;</li>
            <li><strong>d)</strong> Efetuar o pagamento conforme estipulado neste contrato.</li>
          </ul>
        </div>
      </div>

      <!-- Cláusula 5ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 5ª – Valor e Forma de Pagamento</div>
        <div class="clause-body">
          <p>O valor total do serviço será de <strong>R$ ${data.financeiro.valor_total}</strong>.</p>
          <p>O pagamento deverá ser realizado da seguinte forma: <strong>${data.financeiro.percentual_entrada}% (R$ ${data.financeiro.valor_entrada})</strong> na assinatura do contrato e <strong>${data.financeiro.percentual_restante}% (R$ ${data.financeiro.valor_restante})</strong> no dia do evento.</p>
          <p>Em caso de atraso no pagamento, incidirá multa de 2% sobre o valor devido, mais juros de 1% ao mês.</p>
        </div>
      </div>
    </div>

    <div class="contract-number-tag">Página 1/2 • ${data.contrato.numero}</div>
    <div class="footer-bar"></div>
  </div>

  <!-- PÁGINA 2 -->
  <div class="contract-page">
    <div class="header-banner">
      <h1>Contrato de<br>Prestação de<br>Serviços</h1>
      <div class="logo-container">
        <img src="${logoBase64}" alt="Robo Led Partner Logo">
      </div>
    </div>

    <div class="contract-content">
      <!-- Cláusula 6ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 6ª – Cancelamento e Atraso</div>
        <div class="clause-body">
          <p>Caso o <strong>CONTRATANTE</strong> cancele o evento com antecedência inferior a 7 dias, ficará sujeito a multa de percentual, <strong>40% do valor contratado</strong>. O não comparecimento do <strong>CONTRATANTE</strong> no dia e horário acordado não desobriga o pagamento integral.</p>
          <p style="margin-top: 8px;">O limite máximo de tolerância para atraso do <strong>CONTRATANTE</strong> é de 30 (trinta) minutos após o horário previamente combinado. Ultrapassado esse prazo, a apresentação não será realizada e a <strong>PRESTADORA</strong> terá direito a reter <strong>40% (quarenta por cento)</strong> do valor total contratado, a título de cobertura de custos operacionais ou será descontado o atraso no tempo de apresentação.</p>
        </div>
      </div>

      <!-- Cláusula 7ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 7ª – Responsabilidade</div>
        <div class="clause-body">
          <p>A <strong>PRESTADORA</strong> não se responsabiliza por danos causados por terceiros ao Robô de LED durante o evento.</p>
          <p>O <strong>CONTRATANTE</strong> será responsável por indenizar eventuais danos decorrentes de mau uso ou imprudência de convidados.</p>
        </div>
      </div>

      <!-- Cláusula 8ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 8ª – Foro</div>
        <div class="clause-body">
          <p>Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o foro da comarca de <strong>${data.empresa.cidade}</strong>, renunciando a qualquer outro, por mais privilegiado que seja.</p>
          <p style="margin-top: 10px;">E por estarem de acordo, assinam o presente contrato em duas vias de igual teor e forma.</p>
        </div>
      </div>

      <!-- Seção de Assinaturas -->
      <div class="signature-section">
        <div class="date-location">
          ${data.contrato.cidade_emissao}, ${data.contrato.data_emissao_extenso}
        </div>

        <div class="signatures-grid">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">CONTRATANTE</div>
            <div class="signature-detail">${data.cliente.nome}</div>
            <div class="signature-detail">CPF: ${data.cliente.cpf}</div>
          </div>

          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-name">CONTRATADO</div>
            <div class="signature-detail">${data.empresa.responsavel}</div>
            <div class="signature-detail">${data.empresa.nome}</div>
            <div class="signature-detail">CNPJ: ${data.empresa.documento}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="contract-number-tag">Página 2/2 • ${data.contrato.numero}</div>
    <div class="footer-bar"></div>
  </div>

</body>
</html>`;
}
