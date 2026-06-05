# Precificador — Resultado por quilo + remover pesquisa de mercado

**Data:** 2026-06-04
**Arquivo alvo:** `precificador-receitas.html` (arquivo único)

## Objetivo

Duas mudanças pedidas pelo usuário:

1. **Remover** o recurso "Pesquisa de preço de mercado" (só funciona dentro do Claude;
   atrapalha quando o arquivo é compartilhado).
2. Permitir que o **resultado** seja expresso **por quilo**, além de por unidade. A mãe
   do usuário vende por peso: ela informa o peso total que a receita rende (ex.: a
   fornada deu 2 kg) e quer ver o **custo por quilo** e o **preço por quilo**.

**Importante (decidido no brainstorming):** os ingredientes e custos adicionais
continuam EXATAMENTE como hoje (custo direto digitado). A mudança é só em **como o
custo total é dividido e rotulado no resultado** (por unidade OU por quilo), escolhido
por receita.

## Restrição

- Continua arquivo único, leve, sem backend. Compatível com dados já salvos.

## Mudança 1 — Remover "Pesquisa de preço de mercado"

Remover por completo, sem deixar resíduo:
- A função `pesquisarMercado` e os estados `pesqLoading`, `pesqResult`, `pesqErro`.
- As referências a `setPesqResult(null)` / `setPesqErro(null)` em `reset()` e `carregar()`.
- O bloco JSX inteiro "Preço de mercado" dentro do card de Resultado (título, texto,
  botão, mensagens de erro e o cartão de resultado da pesquisa).
- O parágrafo "OBSERVAÇÃO sobre a 'Pesquisa de preço de mercado'" no comentário do topo.

Não remover ícones do objeto `ICONS` (podem ficar; YAGNI não exige limpeza arriscada),
mas remover os que ficarem comprovadamente sem uso é aceitável se trivial (`cart`,
`search`, `loader`). Em caso de dúvida, manter para não quebrar nada.

## Mudança 2 — Rendimento e resultado por unidade OU por quilo

### Modelo de dados (estado da receita `st`)
- Novo campo `tipoRend`: `"un"` (padrão) ou `"kg"`.
- O campo `rendimento` passa a ser interpretado conforme `tipoRend`:
  - `"un"`: número inteiro de peças (como hoje; mínimo 1).
  - `"kg"`: peso total em quilos, aceitando decimais com vírgula (ex.: `2`, `2,5`, `0,5`).
- `receitaVazia` ganha `tipoRend: "un"`.

### Cálculo (`calc`, no `useMemo`)
- Substituir `unids` por uma `quantidade` calculada conforme o tipo:
  - `"un"`: `Math.max(parseInt(rendimento) || 1, 1)`.
  - `"kg"`: `Math.max(parseNum(rendimento), 0.001)` (aceita decimal; evita divisão por zero).
- `custoPorMedida = custoTotal / quantidade`.
- Cada linha de margem: `preco = custoPorMedida * (1 + m/100)`,
  `lucroMedida = custoPorMedida * (m/100)`, `lucroTotal = lucroMedida * quantidade`.
- A lógica de soma de custos (ingredientes, embalagem, gás, mão de obra) NÃO muda.

### Interface — bloco "Produto"
- Ao lado do campo de rendimento, um seletor com duas opções: **por unidade** / **por quilo**
  (dois botõezinhos no estilo das abas/linha de margem, sem biblioteca nova).
- O rótulo e a dica do campo mudam conforme o tipo:
  - `"un"`: rótulo "Rendimento (unidades)", dica "Quantas peças a receita rende?", placeholder "Ex: 30".
  - `"kg"`: rótulo "Rendimento (quilos)", dica "Quanto a receita rende em kg?", placeholder "Ex: 2,5".
- No modo `"kg"`, o input aceita decimais (não força inteiro).

### Interface — bloco "Resultado"
- "Custo por unidade (N un.)" vira, no modo kg, "Custo por quilo (N kg)".
- Cabeçalho e linhas da tabela de margens: "Preço/un." → "Preço/kg", "Lucro/un." → "Lucro/kg"
  quando `tipoRend === "kg"`. A coluna "Lucro total" continua igual (lucro do lote inteiro).
- "Preço escolhido (margem%)" continua, agora coerente com a medida escolhida.
- Texto auxiliar adaptado (ex.: unidade da composição permanece a mesma).

### Salvar / carregar / lista de salvos
- O registro salvo passa a incluir `tipoRend`. `carregar(p)` lê `p.tipoRend` (default `"un"`).
- Para não quebrar dados já salvos nem o backup, os nomes dos campos salvos
  `custoPorUn` e `precoVenda` permanecem (passam a significar "por medida", seja un ou kg).
  Internamente o cálculo pode chamar a variável de `custoPorMedida`, mas o registro
  gravado continua usando a chave `custoPorUn`.
- Compatibilidade: produtos antigos sem `tipoRend` são tratados como `"un"`.
- Na lista "Produtos salvos":
  - "Preço de venda (margem%)" ganha sufixo "por kg" quando o produto é kg.
  - "Custo/un." → "Custo/kg" quando kg.
  - "{rendimento} unidades" → "{rendimento} kg" quando kg (sem `parseInt`, para não cortar decimais).

## Critérios de sucesso

- A seção/recursos de "preço de mercado" desaparecem por completo; o app abre sem erros.
- Uma receita em modo "por unidade" produz exatamente os mesmos números de antes.
- Em modo "por quilo": digitando peso total (ex.: 2 kg) e custos, o resultado mostra
  custo/kg e preço/kg corretos (custo total ÷ kg), com rótulos "/kg".
- Decimais com vírgula funcionam no rendimento em kg (ex.: 2,5).
- Salvar e reabrir preserva o tipo (un/kg). Produtos antigos continuam como unidade.
- Nenhuma mudança na soma de custos (ingredientes/embalagem/gás/mão de obra).
- Backup/importar continua funcionando (o novo campo viaja junto no JSON).

## Tradeoffs / decisões

- Mantemos o seletor por receita (un/kg) em vez de trocar tudo para kg, para a
  ferramenta servir tanto à mãe (kg) quanto a quem precifica por peça.
- Não convertemos automaticamente receitas antigas para kg — elas permanecem em
  unidade, preservando os números já salvos.
