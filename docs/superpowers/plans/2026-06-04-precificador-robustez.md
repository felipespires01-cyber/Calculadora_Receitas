# Precificador — Robustez de dados + Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar backup/importar por arquivo, tornar o salvamento à prova de erro e elevar o visual do `precificador-receitas.html`, mantendo-o como arquivo único e leve.

**Architecture:** Tudo vive em `precificador-receitas.html` (React via Babel standalone, sem build). Acrescentamos funções puras de backup (montar envelope, validar, mesclar por `id`), um fluxo de importação com confirmação, mensagens de erro/sucesso visíveis, um aviso amigável e uma camada de polimento visual em CSS+SVG. Nenhuma fórmula de cálculo existente é alterada.

**Tech Stack:** HTML único, React 18 + ReactDOM (UMD via CDN), Babel standalone (CDN), localStorage, CSS custom properties, SVG inline.

**Método de teste:** App de arquivo único sem build e sem framework de teste. A verificação é **manual no navegador**, com passos e resultados esperados exatos em cada tarefa. Commits a cada tarefa.

---

## Estrutura de arquivos

- **Modify:** `precificador-receitas.html` — único arquivo de código. Todas as tarefas mexem aqui, em blocos comentados distintos:
  - Bloco 2 (Constantes e funções auxiliares): novas funções de backup.
  - Bloco 5 (Componente principal `App`): estado e handlers de import/export, mensagens.
  - Bloco da aba "Produtos salvos": botões de backup + aviso.
  - `<style>` no `<head>`: variáveis de tema, sombras, espaçamento, animações.
- **Referência (não alterar a lógica):** `docs/superpowers/specs/2026-06-04-precificador-robustez-design.md`.

> Convenção de commit: como o arquivo está em pasta com acentos e espaços, use sempre o caminho entre aspas. Trabalhe pelo terminal já posicionado na pasta do projeto.

---

## Task 1: Função de exportar backup (montar envelope + baixar arquivo)

**Files:**
- Modify: `precificador-receitas.html` (Bloco 2 — funções auxiliares; e Bloco 5 — handler no `App`)

- [ ] **Step 1: Adicionar as funções puras de backup no Bloco 2**

Logo após `gravarProdutos` (por volta da linha 147), acrescente:

```javascript
// Versão do formato de backup (incrementar se o formato mudar no futuro)
const BACKUP_VERSAO = 1;
const BACKUP_APP_ID = "precificador-receitas";

// Monta o objeto de backup (envelope com metadados)
const montarBackup = (produtos) => ({
  app: BACKUP_APP_ID,
  versao: BACKUP_VERSAO,
  exportadoEm: new Date().toISOString(),
  produtos: Array.isArray(produtos) ? produtos : [],
});

// Nome de arquivo datado: receitas-backup-AAAA-MM-DD.json
const nomeArquivoBackup = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `receitas-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
};

// Dispara o download de um texto como arquivo
const baixarArquivo = (nome, conteudo) => {
  const blob = new Blob([conteudo], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 2: Adicionar o handler de exportar dentro do `App`**

No componente `App`, junto dos outros handlers (perto de `excluir`, por volta da linha 297), adicione:

```javascript
const exportarBackup = () => {
  try {
    const conteudo = JSON.stringify(montarBackup(produtos), null, 2);
    baixarArquivo(nomeArquivoBackup(), conteudo);
  } catch (e) {
    setMsg({ tipo: "erro", texto: "Não foi possível gerar o backup. Tente novamente." });
  }
};
```

> `setMsg` será criado na Task 4. Se executar as tarefas fora de ordem, crie o estado `msg` antes de testar este handler. Para não travar a Task 1, defina já no topo do `App` (junto dos outros `useState`):
> ```javascript
> const [msg, setMsg] = useState(null); // { tipo: "erro"|"sucesso", texto }
> ```

- [ ] **Step 3: Botão temporário de teste**

Para testar antes da UI final (Task 6), adicione um botão provisório dentro da aba "Produtos salvos", logo no início do bloco `view === "salvos" && (` :

```javascript
<button onClick={exportarBackup} style={{ marginBottom: 12 }}>TESTE: Fazer backup</button>
```

- [ ] **Step 4: Verificar no navegador**

1. Abra `precificador-receitas.html` no navegador.
2. Na Calculadora, crie uma receita com nome "Brigadeiro", 1 ingrediente com custo 5, e clique em "Salvar produto".
3. Vá na aba "Produtos salvos" e clique em "TESTE: Fazer backup".

Esperado: baixa um arquivo `receitas-backup-AAAA-MM-DD.json`. Abrindo o arquivo num editor, ele tem `"app": "precificador-receitas"`, `"versao": 1`, `"exportadoEm"` com data, e `"produtos"` com o Brigadeiro.

- [ ] **Step 5: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: exportar backup das receitas para arquivo JSON"
```

---

## Task 2: Validação e mesclagem por id (funções puras)

**Files:**
- Modify: `precificador-receitas.html` (Bloco 2 — funções auxiliares)

- [ ] **Step 1: Adicionar `validarBackup` e `mesclarProdutos` no Bloco 2**

Logo após as funções da Task 1:

```javascript
// Valida o conteúdo importado. Retorna { ok, produtos, erro }
const validarBackup = (texto) => {
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { ok: false, erro: "Este arquivo não é um backup válido (não é um JSON)." };
  }
  if (!dados || typeof dados !== "object") {
    return { ok: false, erro: "Este arquivo não é um backup de receitas." };
  }
  if (dados.app !== BACKUP_APP_ID) {
    return { ok: false, erro: "Este arquivo não parece ser um backup do Precificador de Receitas." };
  }
  if (!Array.isArray(dados.produtos)) {
    return { ok: false, erro: "O backup está sem a lista de produtos." };
  }
  // Garante que todo produto tenha um id (gera um se faltar)
  const produtos = dados.produtos.map((p, i) => ({
    ...p,
    id: p && p.id != null ? String(p.id) : `import-${i}-${p && p.savedAt ? p.savedAt : "x"}`,
  }));
  return { ok: true, produtos };
};

// Mescla a lista importada na atual, por id. Retorna { lista, novas, atualizadas }
const mesclarProdutos = (atuais, importados) => {
  const porId = new Map(atuais.map((p) => [String(p.id), p]));
  let novas = 0;
  let atualizadas = 0;
  importados.forEach((imp) => {
    const id = String(imp.id);
    if (porId.has(id)) atualizadas++;
    else novas++;
    porId.set(id, imp);
  });
  // Mais recentes primeiro (usa savedAt quando existir)
  const lista = Array.from(porId.values()).sort(
    (a, b) => (b.savedAt || 0) - (a.savedAt || 0)
  );
  return { lista, novas, atualizadas };
};
```

- [ ] **Step 2: Verificar a lógica no console do navegador**

Abra o arquivo no navegador, abra o Console (F12) e cole:

```javascript
// validação: arquivo errado
console.log(validarBackup("isso não é json").ok); // esperado: false
console.log(validarBackup(JSON.stringify({ app: "outro" })).ok); // esperado: false
// validação: backup bom
const bom = JSON.stringify({ app: "precificador-receitas", versao: 1, produtos: [{ id: "1", produto: "A", savedAt: 10 }] });
console.log(validarBackup(bom).ok); // esperado: true

// mesclagem
const atuais = [{ id: "1", produto: "A", savedAt: 10 }];
const imp = [{ id: "1", produto: "A2", savedAt: 20 }, { id: "2", produto: "B", savedAt: 30 }];
const r = mesclarProdutos(atuais, imp);
console.log(r.novas, r.atualizadas); // esperado: 1 1
console.log(r.lista.map(p => p.id + ":" + p.produto).join(", ")); // esperado: 2:B, 1:A2
```

Esperado: as saídas batem com os comentários acima (`false`, `false`, `true`, `1 1`, `2:B, 1:A2`).

- [ ] **Step 3: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: validacao e mesclagem por id para importacao de backup"
```

---

## Task 3: Fluxo de importação com confirmação

**Files:**
- Modify: `precificador-receitas.html` (Bloco 5 — estado e handlers do `App`; UI da aba "Produtos salvos")

- [ ] **Step 1: Adicionar estado do fluxo de importação**

No topo do `App`, junto dos outros `useState`:

```javascript
const [importPreview, setImportPreview] = useState(null); // { produtos, novas, atualizadas }
```

- [ ] **Step 2: Adicionar handlers de importação**

Junto de `exportarBackup`:

```javascript
// Lê o arquivo escolhido e prepara o resumo de confirmação
const aoEscolherArquivo = (e) => {
  setMsg(null);
  const file = e.target.files && e.target.files[0];
  e.target.value = ""; // permite reescolher o mesmo arquivo depois
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const res = validarBackup(String(reader.result));
    if (!res.ok) {
      setMsg({ tipo: "erro", texto: res.erro });
      return;
    }
    const prev = mesclarProdutos(produtos, res.produtos);
    setImportPreview(prev);
  };
  reader.onerror = () => setMsg({ tipo: "erro", texto: "Não foi possível ler o arquivo." });
  reader.readAsText(file);
};

// Confirma e aplica a importação
const confirmarImportacao = () => {
  if (!importPreview) return;
  persistir(importPreview.lista);
  setMsg({
    tipo: "sucesso",
    texto: `Importado: ${importPreview.novas} nova(s), ${importPreview.atualizadas} atualizada(s).`,
  });
  setImportPreview(null);
};

const cancelarImportacao = () => setImportPreview(null);
```

- [ ] **Step 3: Adicionar input de arquivo escondido + botão temporário**

Dentro do bloco `view === "salvos" && (`, junto do botão de teste da Task 1:

```javascript
<input id="inputImport" type="file" accept="application/json,.json"
  onChange={aoEscolherArquivo} style={{ display: "none" }} />
<button onClick={() => document.getElementById("inputImport").click()} style={{ marginBottom: 12, marginLeft: 8 }}>
  TESTE: Importar backup
</button>
```

- [ ] **Step 4: Adicionar o modal/área de confirmação**

Logo após os botões de teste, ainda dentro de `view === "salvos"`:

```javascript
{importPreview && (
  <Card highlight>
    <p style={{ margin: "0 0 12px", fontSize: 14 }}>
      Encontradas <strong>{importPreview.novas}</strong> receita(s) nova(s) e{" "}
      <strong>{importPreview.atualizadas}</strong> atualização(ões). Confirmar importação?
    </p>
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={confirmarImportacao} style={{ padding: "8px 14px", border: "none", borderRadius: 8, background: C.coral400, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
        Confirmar importação
      </button>
      <button onClick={cancelarImportacao} style={{ padding: "8px 14px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }}>
        Cancelar
      </button>
    </div>
  </Card>
)}
```

- [ ] **Step 5: Verificar no navegador (caminho feliz + arquivo inválido)**

Pré-requisito: tenha o `receitas-backup-...json` gerado na Task 1.

1. **Importar válido:** Na aba "Produtos salvos", clique "TESTE: Importar backup", escolha o arquivo. Esperado: aparece o cartão "Encontradas X nova(s)...". Clique "Confirmar importação". Esperado: lista atualiza e o item não duplica (mesmo id é atualizado, não somado).
2. **Reimportar o mesmo arquivo:** deve mostrar "0 nova(s)" e "1 atualização" (ou o número de produtos do backup), e não criar duplicatas.
3. **Arquivo inválido:** crie um `teste.txt` com a palavra "oi", tente importar. Esperado: nenhuma mudança na lista; ainda não há mensagem visível (a faixa de mensagem é da Task 4) — confirme no Console que `validarBackup` retornou erro (sem quebrar a tela).

- [ ] **Step 6: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: fluxo de importacao de backup com confirmacao e mesclagem"
```

---

## Task 4: Mensagens visíveis + fim das falhas silenciosas

**Files:**
- Modify: `precificador-receitas.html` (Bloco 2 — `gravarProdutos`; Bloco 5 — `persistir`, UI de mensagem)

- [ ] **Step 1: Fazer `gravarProdutos` sinalizar falha**

Troque a função `gravarProdutos` (Bloco 2) por uma versão que retorna sucesso/erro:

```javascript
const gravarProdutos = (lista) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: "Não foi possível salvar neste aparelho (armazenamento cheio ou bloqueado). Faça um backup para não perder os dados." };
  }
};
```

- [ ] **Step 2: Propagar o resultado em `persistir`**

Troque `persistir` no `App`:

```javascript
const persistir = useCallback((lista) => {
  setProdutos(lista);
  const res = gravarProdutos(lista);
  if (!res.ok) setMsg({ tipo: "erro", texto: res.erro });
  return res.ok;
}, []);
```

- [ ] **Step 3: Garantir o estado `msg`**

Confirme que existe no topo do `App` (criado na Task 1):

```javascript
const [msg, setMsg] = useState(null); // { tipo: "erro"|"sucesso", texto }
```

- [ ] **Step 4: Renderizar a faixa de mensagem**

No início do bloco `view === "salvos" && (`, antes dos cartões, adicione:

```javascript
{msg && (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", marginBottom: 12,
    borderRadius: "var(--border-radius-md)", fontSize: 13,
    background: msg.tipo === "erro" ? "rgba(163,45,45,0.08)" : "var(--color-background-success)",
    color: msg.tipo === "erro" ? "var(--color-text-danger)" : "var(--color-text-success)",
    border: "0.5px solid " + (msg.tipo === "erro" ? "var(--color-text-danger)" : "var(--color-text-success)"),
  }}>
    <Ic n={msg.tipo === "erro" ? "alert" : "check"} s={15} style={{ marginTop: 1, flexShrink: 0 }} />
    <span>{msg.texto}</span>
    <button onClick={() => setMsg(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
  </div>
)}
```

- [ ] **Step 5: Verificar no navegador**

1. Importe um arquivo inválido (`teste.txt`). Esperado: faixa vermelha com "Este arquivo não é um backup válido...".
2. Importe um backup bom e confirme. Esperado: faixa verde "Importado: X nova(s), Y atualizada(s).".
3. Clique no "×" da faixa. Esperado: a mensagem some.

- [ ] **Step 6: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: mensagens visiveis de erro/sucesso e fim das falhas silenciosas de salvamento"
```

---

## Task 5: UI final dos botões de backup + aviso amigável

**Files:**
- Modify: `precificador-receitas.html` (Bloco 5 — UI da aba "Produtos salvos"; ICONS no Bloco 1)

- [ ] **Step 1: Adicionar ícones que faltam no Bloco 1 (`ICONS`)**

Acrescente ao objeto `ICONS`:

```javascript
download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
```

- [ ] **Step 2: Substituir os botões de teste pela barra de backup definitiva**

Remova os dois botões "TESTE:" (Tasks 1 e 3) e, no lugar, logo no início do bloco `view === "salvos" && (` (antes da faixa de mensagem), coloque:

```javascript
<Card>
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
    <button onClick={exportarBackup} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid " + C.coral200, background: C.coral50, color: C.coral600, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
      <Ic n="download" s={14} /> Fazer backup
    </button>
    <input id="inputImport" type="file" accept="application/json,.json" onChange={aoEscolherArquivo} style={{ display: "none" }} />
    <button onClick={() => document.getElementById("inputImport").click()} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", background: "none", color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
      <Ic n="upload" s={14} /> Importar backup
    </button>
  </div>
  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, fontSize: 12, color: "var(--color-text-secondary)" }}>
    <Ic n="shield" s={14} style={{ marginTop: 1, flexShrink: 0, opacity: 0.7 }} />
    <span>Suas receitas ficam guardadas só neste aparelho. Faça um backup de vez em quando para não perder nada — guarde o arquivo no WhatsApp ou na nuvem.</span>
  </div>
</Card>
```

- [ ] **Step 3: Verificar no navegador**

1. Aba "Produtos salvos": os botões "Fazer backup" e "Importar backup" aparecem com ícones, e o aviso com o escudo abaixo.
2. "Fazer backup" baixa o arquivo; "Importar backup" abre o seletor; fluxo de confirmação e mensagens continuam funcionando (Tasks 3 e 4).
3. Confirme que não restou nenhum botão "TESTE:".

- [ ] **Step 4: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: barra de backup/importar e aviso amigavel na aba Produtos salvos"
```

---

## Task 6: Fundação visual — tokens de tema, sombras e tipografia

**Files:**
- Modify: `precificador-receitas.html` (`<style>` no `<head>`)

- [ ] **Step 1: Enriquecer as variáveis de tema (claro)**

No `:root` do `<style>`, acrescente/ajuste estas variáveis (mantendo as existentes):

```css
--color-background-app: #f3ede3;        /* fundo geral mais quente */
--shadow-card: 0 1px 2px rgba(80,50,30,0.05), 0 6px 16px rgba(80,50,30,0.06);
--shadow-card-hover: 0 2px 4px rgba(80,50,30,0.07), 0 10px 24px rgba(80,50,30,0.09);
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px;
```

- [ ] **Step 2: Variáveis equivalentes no tema escuro**

Dentro de `@media (prefers-color-scheme: dark) { :root { ... } }`, acrescente:

```css
--color-background-app: #1a1816;
--shadow-card: 0 1px 2px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.35);
--shadow-card-hover: 0 2px 4px rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.5);
```

- [ ] **Step 3: Aplicar fundo, sombras e suavização global**

Ajuste `body` e adicione regras no fim do `<style>`:

```css
body { background: var(--color-background-app); }
/* Suaviza transições de cor/sombra em geral, sem custo perceptível */
button, .card-anim { transition: box-shadow .18s ease, transform .12s ease, background .15s ease; }
```

- [ ] **Step 4: Dar sombra aos cards via componente `Card`**

No componente `Card` (Bloco 3), acrescente `boxShadow` e uma classe para animação:

```javascript
function Card({ children, highlight }) {
  return (
    <div className="card-anim" style={{
      background: "var(--color-background-primary)",
      border: highlight ? "1.5px solid " + C.coral200 : "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: 12,
      boxShadow: highlight ? "var(--shadow-card-hover)" : "var(--shadow-card)",
    }}>{children}</div>
  );
}
```

- [ ] **Step 5: Verificar no navegador**

1. Recarregue. Esperado: cards com sombra suave "flutuando" sobre um fundo creme mais quente; nada quebrado no layout.
2. Mude o tema do sistema para escuro (ou DevTools → Rendering → emulate dark). Esperado: sombras mais escuras coerentes, leitura confortável.

- [ ] **Step 6: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "style: fundacao visual com sombras, fundo quente e escala de espacamento"
```

---

## Task 7: Cabeçalho com marca

**Files:**
- Modify: `precificador-receitas.html` (Bloco 5 — cabeçalho do `App`; `<style>`)

- [ ] **Step 1: Refazer o cabeçalho com selo de marca**

Substitua o bloco do cabeçalho (atual `div` com o `Ic n="chef"` e os dois textos, por volta da linha 329) por:

```javascript
<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
  <div style={{
    width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, " + C.coral400 + ", " + C.coral600 + ")",
    boxShadow: "0 4px 12px rgba(216,90,48,0.35)",
  }}>
    <Ic n="chef" s={24} c="#fff" />
  </div>
  <div>
    <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Precificador de receitas</h1>
    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Custo, margem e preço num só lugar</p>
  </div>
</div>
```

- [ ] **Step 2: Verificar no navegador**

Esperado: selo coral com degradê e leve sombra, ícone do chapéu branco, título com peso maior. Equilibrado no claro e no escuro.

- [ ] **Step 3: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "style: cabecalho com selo de marca"
```

---

## Task 8: Tabela de margem como estrela + micro-interações

**Files:**
- Modify: `precificador-receitas.html` (Bloco 5 — tabela de preços; `<style>`)

- [ ] **Step 1: Destacar a linha selecionada da tabela de margem**

Na renderização das linhas `calc.precos.map((p) => {...})`, troque o `style` do `div` da linha por uma versão com elevação/transição na linha selecionada:

```javascript
<div key={p.margem} onClick={() => set({ margem: p.margem })} className="card-anim" style={{
  display: "grid", gridTemplateColumns: "68px 1fr 1fr 1fr", padding: "11px 14px",
  borderTop: "0.5px solid var(--color-border-tertiary)",
  background: sel ? C.coral50 : "transparent",
  boxShadow: sel ? "inset 3px 0 0 " + C.coral400 : "none",
  alignItems: "center", cursor: "pointer",
}}>
```

(Mantenha o conteúdo interno da linha como já está.)

- [ ] **Step 2: Adicionar realce ao salvar (brilho rápido)**

No `<style>`, adicione uma animação e uma classe:

```css
@keyframes flashSucesso { 0% { box-shadow: 0 0 0 0 rgba(59,109,17,0.0); } 30% { box-shadow: 0 0 0 4px rgba(59,109,17,0.25); } 100% { box-shadow: 0 0 0 0 rgba(59,109,17,0.0); } }
.flash-ok { animation: flashSucesso .9s ease; }
```

No botão "Salvar produto", acrescente a classe quando em flash:

```javascript
<button onClick={salvar} className={salvouFlash ? "flash-ok" : ""} style={{ /* estilo existente do botão salvar */ }}>
```

- [ ] **Step 3: Transição suave ao abrir/fechar a composição na lista**

No `<style>`, adicione:

```css
.reveal { animation: revelar .22s ease; }
@keyframes revelar { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
```

No bloco `{aberto && ( <div ...> )}` da lista de produtos salvos, acrescente `className="reveal"` ao `div` da composição.

- [ ] **Step 4: Verificar no navegador**

1. Selecione diferentes margens na tabela: a linha escolhida ganha faixa coral à esquerda e fundo, com transição suave.
2. Clique "Salvar produto": além do "Salvo!", o botão dá um brilho verde rápido.
3. Na aba "Produtos salvos", clique "Composição": o painel surge com leve fade/slide.

- [ ] **Step 5: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "style: tabela de margem em destaque e micro-interacoes (flash salvar, reveal composicao)"
```

---

## Task 9: Estados vazios com personalidade

**Files:**
- Modify: `precificador-receitas.html` (Bloco 5 — estado vazio do resultado e da lista; Bloco 1 ICONS)

- [ ] **Step 1: Estado vazio da lista "Produtos salvos" mais acolhedor**

Substitua o conteúdo do estado vazio (`produtos.length === 0`) por:

```javascript
<Card>
  <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--color-text-secondary)" }}>
    <div style={{ width: 64, height: 64, margin: "0 auto 14px", borderRadius: "50%", background: C.coral50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ic n="chef" s={30} c={C.coral400} />
    </div>
    <p style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>Ainda não há receitas salvas</p>
    <p style={{ fontSize: 13, margin: 0 }}>Crie uma receita na Calculadora e toque em “Salvar produto”. Ela aparece aqui.</p>
  </div>
</Card>
```

> Mantenha a barra de backup (Task 5) acima deste estado vazio para que a pessoa já possa importar um backup mesmo sem ter nada salvo.

- [ ] **Step 2: Estado vazio do Resultado mais convidativo**

Substitua o conteúdo do `!hasData` no card de Resultado por:

```javascript
<div style={{ padding: "30px 16px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14 }}>
  <div style={{ width: 56, height: 56, margin: "0 auto 12px", borderRadius: "50%", background: "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Ic n="trending" s={26} c={C.coral400} style={{ opacity: 0.8 }} />
  </div>
  Preencha os custos acima — o preço sugerido aparece aqui automaticamente.
</div>
```

- [ ] **Step 3: Verificar no navegador**

1. Com o app sem nenhum produto (limpe via DevTools → Application → Local Storage, ou navegação anônima): a aba "Produtos salvos" mostra o círculo coral com o chapéu e a frase acolhedora, e a barra de backup acima.
2. Na Calculadora, sem preencher custos, o card Resultado mostra o círculo com o ícone e a frase convidativa.

- [ ] **Step 4: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "style: estados vazios com personalidade (resultado e lista)"
```

---

## Task 10: Atualizar o comentário-guia do topo e QA final

**Files:**
- Modify: `precificador-receitas.html` (comentário no `<head>`)

- [ ] **Step 1: Atualizar o comentário "COMO USAR" no topo**

No comentário grande do `<head>`, acrescente uma seção sobre backup:

```html
  BACKUP DAS RECEITAS (importante):
    - Na aba "Produtos salvos" há os botões "Fazer backup" e "Importar backup".
    - "Fazer backup" baixa um arquivo com todas as receitas (guarde no WhatsApp/nuvem).
    - "Importar backup" recupera as receitas a partir desse arquivo — serve para
      trocar de aparelho ou repassar as receitas para outra pessoa.
    - Os dados ficam só no aparelho; sem backup, limpar o navegador apaga tudo.
```

- [ ] **Step 2: QA final — roteiro completo no navegador**

Execute na ordem e confirme cada item:

1. **Criar e salvar:** crie "Bolo" (rend. 10, 1 ingrediente custo 8), salve. Aparece em "Produtos salvos".
2. **Backup:** "Fazer backup" → baixa `receitas-backup-AAAA-MM-DD.json`.
3. **Simular perda:** DevTools → Application → Local Storage → apague a chave `precificador_produtos` → recarregue. A lista fica vazia (estado vazio acolhedor).
4. **Restaurar:** "Importar backup" → escolha o arquivo → confirme. "Bolo" volta; faixa verde de sucesso.
5. **Sem duplicar:** importe o mesmo arquivo de novo → "0 nova(s)", atualizações > 0, lista sem duplicatas.
6. **Arquivo inválido:** importe um `.txt` qualquer → faixa vermelha, lista intacta.
7. **Compartilhar:** confirme que o arquivo de backup aberto num editor contém as receitas (poderia ser importado noutro aparelho).
8. **Visual:** cabeçalho com selo, cards com sombra, linha de margem destacada, flash ao salvar, claro e escuro OK, tudo confortável numa janela estreita (simular celular no DevTools).

- [ ] **Step 3: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "docs: guia de backup no topo do arquivo + QA final"
```

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura da spec:**
  - Backup por arquivo → Tasks 1, 5. Importar com validação + mesclagem → Tasks 2, 3. Confirmação com resumo → Task 3. Aviso amigável → Task 5. Fim das falhas silenciosas / mensagens → Task 4. Visual (tokens/sombra, cabeçalho, tabela estrela, micro-interações, estados vazios, mobile) → Tasks 6–9. Guia de uso → Task 10. Sem novos cálculos: nenhuma tarefa altera o `useMemo` de `calc`. ✔
- **Placeholders:** nenhum "TBD/TODO"; todo passo de código traz o código real. ✔
- **Consistência de tipos/nomes:** `montarBackup`, `validarBackup` (`{ ok, produtos, erro }`), `mesclarProdutos` (`{ lista, novas, atualizadas }`), `exportarBackup`, `aoEscolherArquivo`, `confirmarImportacao`, `cancelarImportacao`, estado `msg`/`setMsg` e `importPreview`/`setImportPreview` — usados de forma consistente entre as tarefas. ✔
