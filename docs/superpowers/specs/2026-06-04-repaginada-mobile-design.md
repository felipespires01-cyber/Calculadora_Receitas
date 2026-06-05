# Precificador — Repaginada mobile-first

**Data:** 2026-06-04
**Arquivo fonte:** `src/precificador-receitas.source.html` (build gera os distribuíveis)

## Objetivo

Uso será ~100% no **celular (iPhone)**. Deixar a interface confortável e bonita em tela
estreita, sem piorar no computador. Decisão do usuário: **repaginada caprichada** (não só
o mínimo).

## Restrições

- Sem mudar nenhuma lógica (login, cálculo un/kg, backup, salvos). Só apresentação.
- Mantém tema claro **e** escuro e a identidade coral.
- Continua passando pelo build (gera `index.html`/`precificador-receitas.html` + PWA).

## Abordagem técnica

O app usa estilos inline (sem classes). Estilos inline não aceitam media queries, então a
responsividade entra via **classes CSS no `<style>` + media query**, aplicadas aos
contêineres de grade. Onde uma grade vira responsiva, o `gridTemplateColumns` inline é
substituído por uma `className` (a CSS cuida das colunas e do empilhamento no mobile).

Breakpoint: **`max-width: 560px`** = "modo celular".

## Mudanças

### 1. Grades que empilham no celular
- **Produto** (`2fr 1fr` → classe `.grid-produto`): no mobile vira **1 coluna** (nome em cima,
  rendimento + seletor un/kg embaixo, largura cheia).
- **Custos adicionais** (`repeat(3,1fr)` → `.grid-3`): no mobile vira **1 coluna**.
- **Mão de obra** (`repeat(3,1fr)` → `.grid-mo`): no mobile vira **2 colunas** (Horas | Minutos)
  e o campo "Valor por hora" (classe `.mo-full`) ocupa a **linha inteira** abaixo.
- No desktop (acima de 560px) todas mantêm o layout atual em colunas.

### 2. Tabela de margem cabendo bem
- Mantém as 4 colunas (Margem, Preço, Lucro/un|kg, Lucro total). Ajustes para caber no
  celular: coluna da margem mais estreita (~52px) e a grade via classe `.grid-margem`
  com fontes/padding levemente reduzidos no mobile. Nada de informação é removido.

### 3. Conforto de toque + anti-zoom do iOS
- **Inputs com fonte 16px** (o componente `Inp` passa de 14 para 16): impede o zoom
  automático do iPhone ao focar um campo. Padding maior (altura confortável ~44px).
- Botões com área de toque maior (mín. ~40px de altura): "Adicionar ingrediente",
  "Salvar/Atualizar", "Nova receita", abas, seletor un/kg, e o botão de excluir
  ingrediente (de 32 para ~38px).

### 4. Encaixe de app no iPhone (safe areas)
- Já existe `viewport-fit=cover`. Aplicar padding com `env(safe-area-inset-*)` no container
  principal para não grudar/cortar no notch (topo) e na barra inferior em modo standalone.
- Respiro mobile-first: espaçamento vertical confortável entre seções.

### 5. Tipografia/visual
- Pequenos ajustes de espaçamento e tamanho para leitura no celular, mantendo a estética.
  Sem trocar a paleta nem a estrutura das seções.

## Onde mexe no código (fonte)

- `<style>`: novas classes (`.grid-produto`, `.grid-3`, `.grid-mo`, `.mo-full`,
  `.grid-margem`) + media query `max-width:560px`; ajuste de safe-area; (opcional) altura
  mínima de inputs/botões.
- Componente `Inp`: fonte 16, padding maior.
- JSX dos contêineres de grade: trocar `style={{display:"grid", gridTemplateColumns:...}}`
  pela `className` correspondente (mantendo `gap` na CSS).
- Botão de excluir ingrediente e demais botões: leve aumento de tamanho.
- Container principal do `App`: padding com safe-area.

## Critérios de sucesso

- Em **largura de iPhone (~390px)**: nenhuma seção fica espremida; Custos adicionais e
  Produto em 1 coluna; Mão de obra com Horas|Minutos e Valor embaixo; tabela de margem
  legível e completa.
- Focar um campo no iPhone **não dá zoom** (fonte ≥16px).
- Toques confortáveis (campos/botões maiores).
- No **desktop** o layout em colunas continua bom.
- Claro e escuro OK. Nenhuma mudança de cálculo.
- Verificado via preview em largura de celular (prints antes/depois).

## Fora de escopo

- Não reorganizar/esconder seções (o usuário escolheu repaginar, não simplificar/recolher).
- Não mexer na lógica nem nos textos de conteúdo.
