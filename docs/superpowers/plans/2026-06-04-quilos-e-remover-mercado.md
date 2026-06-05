# Resultado por quilo + remover pesquisa de mercado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover o recurso de pesquisa de preço de mercado e permitir que o resultado seja por unidade OU por quilo (escolhido por receita), em `precificador-receitas.html`.

**Architecture:** Arquivo único (React via Babel, sem build, sem testes). Acrescenta-se um campo `tipoRend` ("un"|"kg") ao estado da receita; o cálculo passa a dividir o custo total por uma `quantidade` (peças ou kg) e os rótulos do resultado/lista se adaptam. A soma de custos não muda. A pesquisa de mercado é removida por completo.

**Tech Stack:** HTML único, React 18 (UMD via CDN), Babel standalone, localStorage.

**Método de teste:** Sem runner automatizado. Verificação **manual no navegador** (passos e resultados esperados exatos). No fim, smoke test real via preview (`py -m http.server 8765`). Commits por tarefa.

---

## Estrutura de arquivos

- **Modify:** `precificador-receitas.html` — único arquivo. Blocos: comentário do topo, Bloco 4 (`receitaVazia`), Bloco 5 (`App`: estados, `reset`, `carregar`, `calc`, `precoEscolhido`, `salvar`, JSX de Produto/Resultado/lista).
- **Referência:** `docs/superpowers/specs/2026-06-04-quilos-e-remover-mercado-design.md`.

> Caminho com espaços/acentos — sempre entre aspas. Git já configurado.

---

## Task 1: Remover a pesquisa de preço de mercado

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Remover os 3 estados de pesquisa**

Remova estas três linhas (estão junto dos `useState` do `App`):

```javascript
  const [pesqLoading, setPesqLoading] = useState(false);
  const [pesqResult, setPesqResult] = useState(null);
  const [pesqErro, setPesqErro] = useState(null);
```

- [ ] **Step 2: Limpar `reset` e `carregar`**

Troque a linha do `reset`:

```javascript
  const reset = () => { setSt(receitaVazia); setEditId(null); setPesqResult(null); setPesqErro(null); };
```
por:
```javascript
  const reset = () => { setSt(receitaVazia); setEditId(null); };
```

E no `carregar`, troque a linha final:
```javascript
    setEditId(p.id); setPesqResult(null); setPesqErro(null); setView("calc");
```
por:
```javascript
    setEditId(p.id); setView("calc");
```

- [ ] **Step 3: Remover a função `pesquisarMercado` inteira**

Remova o bloco completo, do comentário até o fechamento da função (inclusive a linha em branco antes do `return (`):

```javascript
  // --- Pesquisa de preço de mercado (só funciona dentro do Claude) ---
  const pesquisarMercado = async () => {
    if (!st.produto.trim()) return;
    setPesqLoading(true); setPesqErro(null); setPesqResult(null);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: 'Pesquise na web o preço de venda de "' + st.produto + '" feito de forma caseira ou artesanal, no Brasil, em reais (BRL), praticado por pequenos produtores. Responda APENAS com um objeto JSON puro, sem markdown, neste formato: {"precoMin": numero, "precoMax": numero, "precoMedio": numero, "unidade": "texto curto", "observacao": "frase curta"}. Use ponto como separador decimal.',
          }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const match = text.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
      setPesqResult(JSON.parse(match ? match[0] : text));
    } catch (e) {
      setPesqErro("A pesquisa de preço de mercado só funciona dentro do app do Claude. Aqui no arquivo solto, pesquise manualmente o preço na sua região.");
    } finally { setPesqLoading(false); }
  };
```

- [ ] **Step 4: Remover o bloco JSX "Pesquisa de mercado"**

No card de Resultado, remova o bloco inteiro que começa com `{/* Pesquisa de mercado */}` e termina no `</div>` que fecha a `<div style={{ marginTop: 18, padding: 14, ... }}>`. É o trecho entre o fim da tabela de margens (`</div>` que fecha a tabela) e o comentário `{/* Salvar */}`. Remova desde:

```javascript
                {/* Pesquisa de mercado */}
                <div style={{ marginTop: 18, padding: 14, border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)" }}>
```
até (inclusive) o `</div>` imediatamente antes de:
```javascript
                {/* Salvar */}
```
Ou seja, todo o bloco de "Preço de mercado" (título com `Ic n="cart"`, parágrafo, botão `onClick={pesquisarMercado}`, `{pesqErro && ...}` e `{pesqResult && ...}`) deixa de existir. O comentário `{/* Salvar */}` e o que vem depois permanecem.

- [ ] **Step 5: Remover o parágrafo do comentário do topo**

No comentário grande do `<head>`, remova as linhas:

```
  OBSERVAÇÃO sobre a "Pesquisa de preço de mercado":
    - Esse recurso usa a inteligência artificial do Claude e SÓ funciona
      dentro do app/site do Claude. Aqui no arquivo solto ele exibe um aviso.
    - Para fazer funcionar fora do Claude seria preciso um pequeno servidor
      (backend) com uma chave de API — fora do escopo deste arquivo simples.
```

- [ ] **Step 6: Verificar (por leitura)**

Confirme: não resta NENHUMA referência a `pesq`, `pesquisarMercado`, `pesqLoading`, `pesqResult`, `pesqErro` no arquivo (busque por "pesq"). O JSX do card de Resultado continua válido: depois da tabela de margens vem direto o comentário `{/* Salvar */}`. Ícones `cart`, `search`, `loader` podem permanecer no objeto `ICONS` (não remover — evita risco).

- [ ] **Step 7: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: remover pesquisa de preco de mercado (so funcionava dentro do Claude)"
```

---

## Task 2: Modelo de dados e cálculo por unidade OU quilo

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Adicionar `tipoRend` ao `receitaVazia`**

Troque (Bloco 4):
```javascript
const receitaVazia = {
  produto: "", rendimento: "",
  ingredientes: [{ id: 1, nome: "", custo: "" }],
  embalagem: "", gasEnergia: "", outros: "",
  horas: "", minutos: "", valorHora: "", margem: 50,
};
```
por:
```javascript
const receitaVazia = {
  produto: "", rendimento: "", tipoRend: "un",
  ingredientes: [{ id: 1, nome: "", custo: "" }],
  embalagem: "", gasEnergia: "", outros: "",
  horas: "", minutos: "", valorHora: "", margem: 50,
};
```

- [ ] **Step 2: Reescrever o `calc` para usar `quantidade`/`custoPorMedida`**

Troque o `useMemo` do `calc`:
```javascript
    const custoTotal = custoIngr + custoEmb + custoGas + custoOut + custoMO;
    const unids = Math.max(parseInt(st.rendimento) || 1, 1);
    const custoPorUn = custoTotal / unids;
    return {
      custoIngr, custoEmb, custoGas, custoOut, custoMO, custoTotal, unids, custoPorUn,
      precos: [20, 30, 50, 70, 100, 150].map((m) => ({
        margem: m, preco: custoPorUn * (1 + m / 100),
        lucroUn: custoPorUn * (m / 100), lucroTotal: custoPorUn * (m / 100) * unids,
      })),
    };
```
por:
```javascript
    const custoTotal = custoIngr + custoEmb + custoGas + custoOut + custoMO;
    const ehKg = st.tipoRend === "kg";
    const quantidade = ehKg
      ? Math.max(parseNum(st.rendimento), 0.001)
      : Math.max(parseInt(st.rendimento) || 1, 1);
    const custoPorMedida = custoTotal / quantidade;
    return {
      custoIngr, custoEmb, custoGas, custoOut, custoMO, custoTotal, quantidade, custoPorMedida,
      precos: [20, 30, 50, 70, 100, 150].map((m) => ({
        margem: m, preco: custoPorMedida * (1 + m / 100),
        lucroUn: custoPorMedida * (m / 100), lucroTotal: custoPorMedida * (m / 100) * quantidade,
      })),
    };
```

- [ ] **Step 3: Atualizar `precoEscolhido` e adicionar `ehKg` de render**

Troque:
```javascript
  const hasData = calc.custoTotal > 0;
  const precoEscolhido = calc.custoPorUn * (1 + st.margem / 100);
```
por:
```javascript
  const hasData = calc.custoTotal > 0;
  const ehKg = st.tipoRend === "kg";
  const precoEscolhido = calc.custoPorMedida * (1 + st.margem / 100);
```

- [ ] **Step 4: Atualizar `salvar` (mantém a chave salva `custoPorUn`)**

Troque, dentro de `salvar`:
```javascript
      custoTotal: calc.custoTotal, custoPorUn: calc.custoPorUn, precoVenda: precoEscolhido,
```
por:
```javascript
      custoTotal: calc.custoTotal, custoPorUn: calc.custoPorMedida, precoVenda: precoEscolhido,
```
(O registro usa `...st`, então `tipoRend` já é salvo automaticamente. A chave gravada continua `custoPorUn` por compatibilidade.)

- [ ] **Step 5: Atualizar `carregar` para ler `tipoRend`**

Troque, dentro de `carregar`, o objeto passado a `setSt`:
```javascript
      produto: p.produto, rendimento: p.rendimento, ingredientes: p.ingredientes,
      embalagem: p.embalagem, gasEnergia: p.gasEnergia, outros: p.outros,
      horas: p.horas, minutos: p.minutos, valorHora: p.valorHora, margem: p.margem || 50,
```
por:
```javascript
      produto: p.produto, rendimento: p.rendimento, tipoRend: p.tipoRend || "un", ingredientes: p.ingredientes,
      embalagem: p.embalagem, gasEnergia: p.gasEnergia, outros: p.outros,
      horas: p.horas, minutos: p.minutos, valorHora: p.valorHora, margem: p.margem || 50,
```

- [ ] **Step 6: Verificar (por leitura)**

Não resta nenhuma referência a `calc.custoPorUn` nem a `calc.unids` (busque por `custoPorUn` — só deve aparecer como CHAVE salva no `salvar` e como leitura `p.custoPorUn` na lista). `ehKg` está definido no corpo do `App`. O JSX que ainda usa `calc.unids`/`calc.custoPorUn` será corrigido nas Tasks 4. Aqui o app pode quebrar visualmente até a Task 4 — isso é esperado; ainda assim, commit para granularidade.

- [ ] **Step 7: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: calculo por unidade ou quilo (tipoRend, quantidade, custoPorMedida)"
```

---

## Task 3: Seletor un/kg e campo de rendimento adaptável (bloco Produto)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Substituir a Field de rendimento por bloco com seletor**

No bloco `{/* Produto */}`, troque:
```javascript
              <Field label="Rendimento (unidades)" hint="Quantas peças a receita rende?">
                <Inp type="number" value={st.rendimento} onChange={(e) => set({ rendimento: e.target.value })} placeholder="Ex: 30" min="1" />
              </Field>
```
por:
```javascript
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 5 }}>{ehKg ? "Rendimento (quilos)" : "Rendimento (unidades)"}</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  {[["un", "por unidade"], ["kg", "por quilo"]].map(([v, lbl]) => {
                    const at = st.tipoRend === v;
                    return (
                      <button key={v} onClick={() => set({ tipoRend: v })} style={{
                        flex: 1, padding: "5px 0", fontSize: 12, borderRadius: "var(--border-radius-md)", cursor: "pointer",
                        border: at ? "0.5px solid " + C.coral200 : "0.5px solid var(--color-border-tertiary)",
                        background: at ? C.coral50 : "transparent",
                        color: at ? C.coral600 : "var(--color-text-secondary)", fontWeight: at ? 500 : 400,
                      }}>{lbl}</button>
                    );
                  })}
                </div>
                <Inp type="number" value={st.rendimento} onChange={(e) => set({ rendimento: e.target.value })} placeholder={ehKg ? "Ex: 2,5" : "Ex: 30"} min={ehKg ? "0" : "1"} step={ehKg ? "0.001" : "1"} />
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, marginBottom: 0 }}>{ehKg ? "Quanto a receita rende em kg?" : "Quantas peças a receita rende?"}</p>
              </div>
```

- [ ] **Step 2: Verificar (por leitura)**

O seletor tem dois botões (por unidade / por quilo) ligados a `set({ tipoRend })`; o input usa `placeholder`/`min`/`step` condicionais por `ehKg`; `C.coral200/coral50/coral600` existem; JSX balanceado.

- [ ] **Step 3: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: seletor por unidade/por quilo e campo de rendimento adaptavel"
```

---

## Task 4: Rótulos do Resultado adaptáveis (custo e tabela)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Linha "Custo por unidade/quilo"**

Troque:
```javascript
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Custo por unidade ({calc.unids} un.)</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: C.coral800 }}>{fmt(calc.custoPorUn)}</span>
```
por:
```javascript
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{ehKg ? "Custo por quilo" : "Custo por unidade"} ({ehKg ? String(calc.quantidade).replace(".", ",") : calc.quantidade} {ehKg ? "kg" : "un."})</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: C.coral800 }}>{fmt(calc.custoPorMedida)}</span>
```

- [ ] **Step 2: Cabeçalho da tabela de margens**

Troque:
```javascript
                    <span>Margem</span><span>Preço/un.</span><span>Lucro/un.</span><span>Lucro total</span>
```
por:
```javascript
                    <span>Margem</span><span>{ehKg ? "Preço/kg" : "Preço/un."}</span><span>{ehKg ? "Lucro/kg" : "Lucro/un."}</span><span>Lucro total</span>
```

- [ ] **Step 3: Verificar (por leitura)**

Não resta nenhuma referência a `calc.unids` nem `calc.custoPorUn` no JSX (busque). Os valores das linhas (`fmt(p.preco)`, `fmt(p.lucroUn)`, `fmt(p.lucroTotal)`) seguem inalterados — só os cabeçalhos e a linha de custo mudaram. JSX balanceado.

- [ ] **Step 4: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: rotulos do resultado adaptam-se a unidade ou quilo"
```

---

## Task 5: Lista "Produtos salvos" adaptável (un/kg)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Rendimento na linha "Salvo em"**

Troque:
```javascript
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Salvo em {fmtData(p.savedAt)} · {Math.max(parseInt(p.rendimento) || 1, 1)} unidades</div>
```
por:
```javascript
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Salvo em {fmtData(p.savedAt)} · {p.tipoRend === "kg" ? String(p.rendimento).replace(".", ",") + " kg" : Math.max(parseInt(p.rendimento) || 1, 1) + " unidades"}</div>
```

- [ ] **Step 2: Sufixo "por kg" no preço de venda**

Troque:
```javascript
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Preço de venda ({p.margem || 50}%)</div>
```
por:
```javascript
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Preço de venda ({p.margem || 50}%){p.tipoRend === "kg" ? " — por kg" : ""}</div>
```

- [ ] **Step 3: "Custo/un." e "Lucro/un." adaptáveis**

Troque:
```javascript
                  <span style={{ color: "var(--color-text-secondary)" }}>Custo/un.: <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{fmt(p.custoPorUn)}</span></span>
                  <span style={{ color: "var(--color-text-secondary)" }}>Lucro/un.: <span style={{ color: "var(--color-text-success)", fontWeight: 500 }}>+{fmt(p.precoVenda - p.custoPorUn)}</span></span>
```
por:
```javascript
                  <span style={{ color: "var(--color-text-secondary)" }}>{p.tipoRend === "kg" ? "Custo/kg" : "Custo/un."}: <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{fmt(p.custoPorUn)}</span></span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{p.tipoRend === "kg" ? "Lucro/kg" : "Lucro/un."}: <span style={{ color: "var(--color-text-success)", fontWeight: 500 }}>+{fmt(p.precoVenda - p.custoPorUn)}</span></span>
```

- [ ] **Step 4: Verificar (por leitura)**

Produtos sem `p.tipoRend` (antigos) caem no ramo "un" (texto "unidades", "Custo/un.", sem sufixo). JSX balanceado.

- [ ] **Step 5: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: lista de produtos salvos adapta rotulos para unidade ou quilo"
```

---

## Task 6: QA final no navegador

**Files:** nenhum (verificação); commit só se houver ajuste.

- [ ] **Step 1: Subir o preview e abrir o app**

Garanta o preview rodando (`py -m http.server 8765` via launch.json) e abra `http://localhost:8765/precificador-receitas.html`. Confirme no console: nenhum erro (apenas o aviso benigno do Babel).

- [ ] **Step 2: Roteiro — modo unidade (regressão)**

1. Aba Calculadora, "por unidade" selecionado por padrão. Nome "Brigadeiro", rendimento 30, 1 ingrediente custo 30.
2. Resultado: "Custo por unidade (30 un.)" = R$ 1,00; cabeçalho "Preço/un." e "Lucro/un.". Os números são iguais ao comportamento antigo.
3. Não existe mais a seção "Preço de mercado".

- [ ] **Step 3: Roteiro — modo quilo**

1. Clique "por quilo". O rótulo vira "Rendimento (quilos)", dica "Quanto a receita rende em kg?", placeholder "Ex: 2,5".
2. Digite rendimento `2` (ou `2,5`) e um ingrediente custo `20`.
3. Resultado: "Custo por quilo (2 kg)" = R$ 10,00 (custo total ÷ kg); cabeçalho "Preço/kg" e "Lucro/kg". Margem 50% → Preço/kg R$ 15,00.
4. Decimal: troque para `2,5` → "Custo por quilo (2,5 kg)" e valores recalculam.

- [ ] **Step 4: Roteiro — salvar/carregar/lista**

1. Salve a receita em kg. Vá em "Produtos salvos": deve mostrar "… · 2,5 kg", "Preço de venda (50%) — por kg", "Custo/kg" e "Lucro/kg".
2. "Abrir / editar": volta para a calculadora com "por quilo" selecionado e o rendimento certo.
3. Compatibilidade: se houver algum produto antigo (sem tipo), ele aparece como "unidades"/"Custo/un." sem quebrar.

- [ ] **Step 5: Commit (se algum ajuste foi necessário)**

```bash
git add "precificador-receitas.html"
git commit -m "fix: ajustes do QA de unidade/quilo"
```
(Se nada precisou mudar, pular este commit.)

---

## Self-Review (autor do plano)

- **Cobertura da spec:**
  - Remover mercado (estados, função, refs em reset/carregar, JSX, comentário) → Task 1. ✔
  - `tipoRend` em `receitaVazia`/estado, cálculo `quantidade`/`custoPorMedida`, `precoEscolhido`, salvar (chave `custoPorUn` mantida), carregar com default → Task 2. ✔
  - Seletor un/kg + rendimento adaptável (label/hint/placeholder/decimais) → Task 3. ✔
  - Rótulos do resultado ("Custo por quilo", "Preço/kg", "Lucro/kg") → Task 4. ✔
  - Lista de salvos (kg/unidades, "por kg", "Custo/kg") + compatibilidade → Task 5. ✔
  - Backup/importar continua válido: `tipoRend` viaja em `...st` no registro e no JSON. ✔
- **Placeholders:** nenhum; todo passo traz código real (old→new). ✔
- **Consistência de nomes:** `tipoRend`, `ehKg`, `calc.quantidade`, `calc.custoPorMedida`, chave salva `custoPorUn`, `precoVenda` — usados de forma consistente entre as tarefas. As linhas que liam `calc.unids`/`calc.custoPorUn` (Task 2 as deixa temporariamente quebradas) são corrigidas na Task 4. ✔
