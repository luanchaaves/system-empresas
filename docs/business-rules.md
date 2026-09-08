# Regras de Negócio do Sistema — Robo Led Partner

Este documento especifica formalmente as regras de validação, cálculos financeiros, numeração sequencial e regras contratuais implementadas no sistema.

---

## 1. Identificação Sequencial de Contratos

Cada contrato gerado recebe um identificador único no formato:
$$\text{RLP-YYYY-NNNNNN}$$
- **RLP**: Prefixo oficial da Robo Led Partner.
- **YYYY**: Ano civil de criação do contrato (ex: `2026`).
- **NNNNNN**: Sequencial numérico de 6 dígitos formatado com zeros à esquerda (ex: `000001`, `000002`).

### 1.1 Duplicação de Contratos
Ao utilizar a funcionalidade de duplicação:
- O contrato duplicado **sempre recebe um novo número sequencial**, garantindo que não existam dois contratos com o mesmo identificador.
- Os dados do cliente, local e condições comerciais são preservados para agilizar a criação de aditivos ou novas datas para o mesmo contratante.

---

## 2. Validação Estrita de CPF

O sistema implementa o algoritmo oficial da Receita Federal do Brasil para validação de CPF:

1. **Limpeza de Caracteres**: Remove todos os pontos, traços e espaços, mantendo apenas dígitos numéricos.
2. **Checagem de Tamanho**: Deve conter exatamente 11 dígitos.
3. **Rejeição de Dígitos Repetidos**: CPFs compostos por 11 números idênticos (`000.000.000-00`, `111.111.111-11`, etc.) são sumariamente rejeitados.
4. **Cálculo do 1º Dígito Verificador ($D_1$)**:
   $$S_1 = \sum_{i=1}^{9} d_i \times (11 - i)$$
   $$R_1 = S_1 \pmod{11}$$
   $$D_1 = \begin{cases} 0, & \text{se } R_1 < 2 \\ 11 - R_1, & \text{se } R_1 \ge 2 \end{cases}$$
5. **Cálculo do 2º Dígito Verificador ($D_2$)**:
   $$S_2 = \sum_{i=1}^{10} d_i \times (12 - i)$$
   $$R_2 = S_2 \pmod{11}$$
   $$D_2 = \begin{cases} 0, & \text{se } R_2 < 2 \\ 11 - R_2, & \text{se } R_2 \ge 2 \end{cases}$$

---

## 3. Cálculos Financeiros e Divisão de Parcelas

Para evitar erros de arredondamento de ponto flutuante, todos os cálculos são executados com precisão de centavos inteiros:

$$\text{Cents}_{total} = \text{round}(V_{total} \times 100)$$
$$\text{Cents}_{entrada} = \text{round}\left(\text{Cents}_{total} \times \frac{40}{100}\right)$$
$$\text{Cents}_{restante} = \text{Cents}_{total} - \text{Cents}_{entrada}$$

### 3.1 Garantia de Soma Exata
$$V_{entrada} = \frac{\text{Cents}_{entrada}}{100}, \quad V_{restante} = \frac{\text{Cents}_{restante}}{100}$$
$$V_{entrada} + V_{restante} \equiv V_{total}$$

- **Sinal (Entrada)**: 40% pago na assinatura do contrato.
- **Restante**: 60% pago no dia da apresentação do evento.
- **Multa por Atraso**: 2% sobre o montante em atraso + juros moratórios de 1% ao mês.
- **Multa por Cancelamento (< 7 dias)**: 40% do valor total contratado.

---

## 4. Cálculos de Horário e Duração do Evento

- **Duração Suportada**: De 45 minutos (0.75h) a 4 horas (ex: 1h, 1.5h, 2h, 2.5h, 3h).
- **Cálculo do Horário de Término**:
  $$\text{Minutos}_{inicio} = H \times 60 + M$$
  $$\text{Minutos}_{fim} = (\text{Minutos}_{inicio} + \text{Duração} \times 60) \pmod{1440}$$
  $$\text{Horário}_{termino} = \text{padStart}\left(\left\lfloor\frac{\text{Minutos}_{fim}}{60}\right\rfloor, 2, \text{'0'}\right) : \text{padStart}(\text{Minutos}_{fim} \pmod{60}, 2, \text{'0'})$$

---

## 5. Regras de Uso de Imagem

- **Autorizado (Padrão)**: Permite que a Robo Led Partner utilize fotos e gravações da apresentação para fins de divulgação e portfólio.
- **Não Autorizado**: Caso o cliente solicite restrição, a Cláusula 8ª é alterada automaticamente para expressar a vedação formal ao uso de imagens do evento.
