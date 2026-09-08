# Referência dos Modelos de Contrato — Robo Led Partner

Este documento detalha o mapeamento jurídico, cláusulas e variáveis parametrizadas dos dois modelos oficiais da Robo Led Partner.

---

## 1. Princípio da Fidelidade Jurídica

De acordo com as diretrizes do projeto:
1. **Nenhuma cláusula jurídica foi inventada ou removida.**
2. O conteúdo dos contratos oficiais fornecidos nas imagens foi transformado em templates parametrizados dinâmicos.
3. Todas as variáveis de cliente, evento, financeiros e empresa são injetadas de forma segura.

---

## 2. Modelo 1: Robô LED (`ROBO_LED`)

### 2.1 Estrutura de Páginas e Cláusulas
- **Página 1**:
  - Cabeçalho: Título *"Contrato de Prestação de Serviços"* + Logotipo da Robo Led Partner.
  - Caixa de Partes: Dados do **CONTRATANTE** (Nome, Endereço, CPF) e da **CONTRATADA** (Nome, Responsável, CNPJ, Endereço).
  - **Cláusula 1ª – Objeto**: Prestação de serviços de animação e performance artística com **Robô de LED**, incluindo efeitos visuais, lasers e interação com o público.
  - **Cláusula 2ª – Data, Local e Duração**: Data formatada, endereço completo, horário de início e duração estimada de 2 horas (ajustável conforme contratado).
  - **Cláusula 3ª – Obrigações da Prestadora**: Fornecer traje e equipamentos em perfeito estado; disponibilizar operador/artista qualificado; cumprir horários; zelar pela segurança; responsabilizar-se pelo transporte e montagem.
  - **Cláusula 4ª – Obrigações do Contratante**: Espaço físico adequado; ponto de energia próximo se necessário; acesso prévio ao local; segurança física do artista e equipamentos; pagamento conforme estipulado.
  - **Cláusula 5ª – Valor e Forma de Pagamento**: Valor total R$, 40% na assinatura e 60% no dia do evento. Atraso com multa de 2% + juros de 1% ao mês.
  - Rodapé: `Página 1/2 • [Número do Contrato]` + Barra decorativa inferior.

- **Página 2**:
  - Cabeçalho: Título + Logotipo.
  - **Cláusula 6ª – Cancelamento e Atraso**: Multa de 40% para cancelamento com menos de 7 dias; tolerância de 30 minutos de atraso com retenção de 40% ou desconto do tempo.
  - **Cláusula 7ª – Responsabilidade**: Prestadora não responde por danos causados por terceiros; Contratante responde por danos ao equipamento causados por convidados.
  - **Cláusula 8ª – Uso de Imagem**: Autorização de imagens e vídeos para divulgação (*ou menção expressa de Não Autorização se desmarcado pelo usuário*).
  - **Cláusula 9ª – Foro**: Eleição da comarca da sede da empresa.
  - Data por extenso: `[Cidade], [Dia] de [Mês] de [Ano]`.
  - Bloco de Assinaturas: Linhas de assinatura do **CONTRATANTE** e do **CONTRATADO** com nomes e documentos.
  - Rodapé: `Página 2/2 • [Número do Contrato]`.

### 2.2 Registro de Inconsistência no Original
> [!NOTE]
> **Inconsistência Registrada**: No documento original do Robô LED, na Cláusula 6ª constava o texto literal *"40% (cinquenta por cento)"*. Foi padronizado no sistema como **40% (quarenta por cento)** para coerência aritmética e jurídica com a retenção de sinal.

---

## 3. Modelo 2: Personagens Vivos (`PERSONAGEM`)

### 3.1 Estrutura de Páginas e Cláusulas
- **Página 1**:
  - Cabeçalho: Título *"Contrato de Prestação de Serviços"* + Logotipo.
  - Caixa de Partes: Dados do CONTRATANTE e da CONTRATADA.
  - **Cláusula 1ª – Objeto**: Prestação de serviços de animação e interação com **personagens vivos (cosplay/artísticos)**, com especificação dinâmica do(s) personagem(ns) contratado(s) (ex: *Homem-Aranha*, *Mickey*, etc.) e quantidade.
  - **Parágrafo Único da Cláusula 1ª**: *"Os personagens apresentados são interpretações artísticas, não possuindo vínculo oficial com marcas, empresas ou franquias."*
  - **Cláusula 2ª – Data, Local e Duração**: Data, local, horário e duração da apresentação.
  - **Cláusula 3ª – Obrigações da Prestadora**: Disponibilizar personagens caracterizados; figurinos em bom estado; atores preparados; cumprimento de horários; transporte e preparação.
  - **Cláusula 4ª – Obrigações do Contratante**: Espaço seguro; acesso ao local; zelar pela integridade física dos artistas e figurinos; evitar puxões ou empurrões de convidados; efetuar pagamento.
  - **Cláusula 5ª – Valor e Forma de Pagamento**: Valor total R$, 40% na assinatura e 60% no dia do evento. Multa de 2% e juros de 1% ao mês.
  - Rodapé: `Página 1/2 • [Número do Contrato]`.

- **Página 2**:
  - Cabeçalho: Título + Logotipo.
  - **Cláusula 6ª – Cancelamento e Atraso**: Cancelamento < 7 dias com multa de 40%; tolerância de atraso de 30 minutos.
  - **Cláusula 7ª – Responsabilidade**: Danos causados aos figurinos, acessórios ou artistas por ação de convidados são de responsabilidade do Contratante.
  - **Cláusula 8ª – Uso de Imagem**: Variante autorizada ou não autorizada.
  - **Cláusula 9ª – Foro**: Comarca eleita.
  - Local, Data por Extenso e Assinaturas das partes.
  - Rodapé: `Página 2/2 • [Número do Contrato]`.

---

## 4. Dicionário de Variáveis dos Templates

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `cliente.nome` | Nome completo do contratante | `Maria da Silva` |
| `cliente.cpf` | CPF formatado com máscara | `123.456.789-09` |
| `cliente.endereco` | Endereço do contratante | `Av. Paulista, 1000 - São Paulo - SP` |
| `empresa.nome` | Razão Social / Nome Fantasia | `Robo Led Partner` |
| `empresa.responsavel` | Representante Legal | `Carlos Henrique Silva` |
| `empresa.documento` | CNPJ da Prestadora | `12.345.678/0001-90` |
| `empresa.endereco` | Sede da Prestadora | `Av. Paulista, 1500 - Bela Vista` |
| `evento.data_formatada` | Data descritiva | `15 de setembro de 2026` |
| `evento.horario` | Horário de início | `20:00` |
| `evento.endereco` | Endereço da apresentação | `Espaço XYZ, Rua das Flores 500` |
| `evento.duracao_formatada` | Duração do show | `2 horas` |
| `financeiro.valor_total` | Valor total em BRL | `1.500,00` |
| `financeiro.valor_entrada` | 40% de sinal | `600,00` |
| `financeiro.valor_restante` | 60% no evento | `900,00` |
| `contrato.numero` | Identificador único | `RLP-2026-000001` |
| `contrato.data_emissao_extenso`| Data por extenso no rodapé | `26 de agosto de 2026` |
