import { ContractTemplateData } from '../../types/index.js';
import { contractStyles } from '../common/styles.js';

export function renderPersonagensTemplate(data: ContractTemplateData, logoBase64: string): string {
  const usoImagemHtml = data.contrato.uso_imagem_autorizado
    ? `<p>O <strong>CONTRATANTE</strong> autoriza o uso de imagens e vídeos captados durante o evento para fins de divulgação da <strong>PRESTADORA</strong>.</p>
       <p style="margin-top: 4px; font-size: 12px; color: #555;">Caso não autorize, deverá informar previamente por escrito.</p>`
    : `<p>O <strong>CONTRATANTE</strong> declara expressamente a <strong>NÃO autorização</strong> do uso de imagens e vídeos captados durante o evento para fins de divulgação da <strong>PRESTADORA</strong>.</p>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Contrato Personagens — ${data.contrato.numero}</title>
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
          <p>O presente contrato tem como objeto a prestação de serviços de animação e interação com <strong>personagens vivos (cosplay/artísticos)</strong>${data.atracao.descricao_personagens} durante evento do <strong>CONTRATANTE</strong>, conforme previamente acordado.</p>
          <div class="clause-paragraph">
            <strong>Parágrafo único:</strong> Os personagens apresentados são interpretações artísticas, não possuindo vínculo oficial com marcas, empresas ou franquias.
          </div>
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
          <p style="margin-bottom: 4px;">A <strong>PRESTADORA</strong> compromete-se a:</p>
          <ul>
            <li><strong>a)</strong> Disponibilizar os personagens caracterizados conforme combinado;</li>
            <li><strong>b)</strong> Garantir figurinos em bom estado de conservação e apresentação;</li>
            <li><strong>c)</strong> Fornecer equipe/atores preparados para interação com o público;</li>
            <li><strong>d)</strong> Cumprir os horários acordados;</li>
            <li><strong>e)</strong> Responsabilizar-se pelo transporte, preparação e organização dos personagens.</li>
          </ul>
        </div>
      </div>

      <!-- Cláusula 4ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 4ª – Obrigações do Contratante</div>
        <div class="clause-body">
          <p style="margin-bottom: 4px;">O <strong>CONTRATANTE</strong> compromete-se a:</p>
          <ul>
            <li><strong>a)</strong> Disponibilizar espaço adequado e seguro para atuação dos personagens;</li>
            <li><strong>b)</strong> Garantir acesso ao local do evento;</li>
            <li><strong>c)</strong> Zelar pela integridade física dos artistas e figurinos;</li>
            <li><strong>d)</strong> Evitar ações inadequadas por parte dos convidados (puxões, empurrões, etc.);</li>
            <li><strong>e)</strong> Efetuar o pagamento conforme estipulado.</li>
          </ul>
        </div>
      </div>

      <!-- Cláusula 5ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 5ª – Valor e Forma de Pagamento</div>
        <div class="clause-body">
          <p>O valor total do serviço será de <strong>R$ ${data.financeiro.valor_total}</strong>.</p>
          <p style="margin-top: 4px;"><strong>Forma de pagamento:</strong></p>
          <ul class="bullet-list">
            <li><strong>${data.financeiro.percentual_entrada}% (R$ ${data.financeiro.valor_entrada})</strong> na assinatura do contrato</li>
            <li><strong>${data.financeiro.percentual_restante}% (R$ ${data.financeiro.valor_restante})</strong> no dia do evento</li>
          </ul>
          <p style="margin-top: 6px;"><strong>Em caso de atraso:</strong><br>Multa de 2% + juros de 1% ao mês.</p>
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
          <p>Em caso de cancelamento com menos de 7 dias de antecedência, será cobrada multa de <strong>40% do valor total</strong>.</p>
          <p>O não comparecimento no dia não isenta o pagamento integral.</p>
          <p style="margin-top: 6px;"><strong>Tolerância de atraso:</strong> 30 minutos.</p>
          <p style="margin-top: 4px;">Após esse prazo:</p>
          <ul class="bullet-list">
            <li>A apresentação poderá não ocorrer, mantendo a retenção de 40% do valor, ou</li>
            <li>O tempo de atraso poderá ser descontado da apresentação.</li>
          </ul>
        </div>
      </div>

      <!-- Cláusula 7ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 7ª – Responsabilidade</div>
        <div class="clause-body">
          <p>A <strong>PRESTADORA</strong> não se responsabiliza por danos causados por terceiros durante o evento.</p>
          <p>O <strong>CONTRATANTE</strong> será responsável por danos causados aos figurinos, acessórios ou aos artistas por ação de convidados.</p>
        </div>
      </div>

      <!-- Cláusula 8ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 8ª – Uso de Imagem</div>
        <div class="clause-body">
          ${usoImagemHtml}
        </div>
      </div>

      <!-- Cláusula 9ª -->
      <div class="clause">
        <div class="clause-title">Cláusula 9ª – Foro</div>
        <div class="clause-body">
          <p>Fica eleito o foro da comarca de <strong>${data.empresa.cidade}</strong>, renunciando a qualquer outro.</p>
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
