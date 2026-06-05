# Login (trava leve) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma tela de login (usuário isa / senha isa123, senha em hash) antes do app em `precificador-receitas.html`, com "continuar logado até Sair".

**Architecture:** Arquivo único (React via Babel). Acrescenta-se hash JS puro (cyrb53) + checagem de credenciais no Bloco 2, um componente `TelaLogin` no Bloco 3, e no `App` um estado `autenticado` (lido do localStorage) que decide entre mostrar o login ou o app, com um botão "Sair" no cabeçalho.

**Tech Stack:** HTML único, React 18 (UMD via CDN), Babel standalone, localStorage.

**Método de teste:** Sem runner automatizado. Verificação **manual no navegador** (passos/resultados exatos). Hash conferido também no Node. Smoke test final via preview (`py -m http.server 8765`). Commits por tarefa.

---

## Estrutura de arquivos

- **Modify:** `precificador-receitas.html`:
  - Bloco 1 (`ICONS`): novo ícone `logout`.
  - Bloco 2 (auxiliares): `cyrb53`, `AUTH_KEY`, `AUTH_USER`, `AUTH_HASH`, `AUTH_SEED`, `conferirLogin`.
  - Bloco 3 (componentes): novo `TelaLogin`.
  - Bloco 5 (`App`): estado `autenticado`, `entrar`, `sair`, gate de render, botão "Sair" no cabeçalho.
- **Referência:** `docs/superpowers/specs/2026-06-04-login-trava-leve-design.md`.

> Caminho com espaços/acentos — sempre entre aspas. Git já configurado.

---

## Task 1: Funções de autenticação (Bloco 2) + ícone logout (Bloco 1)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Adicionar o ícone `logout` no objeto `ICONS`**

No Bloco 1, acrescente ao objeto `ICONS` (junto das outras entradas, com vírgula):
```javascript
logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
```

- [ ] **Step 2: Adicionar as funções/constantes de auth no Bloco 2**

No Bloco 2 (funções auxiliares), logo após a função `mesclarProdutos` (antes do comentário do Bloco 3), acrescente:
```javascript
// --- Login (trava leve; hash em JS puro para funcionar em file://) ---
const cyrb53 = (str, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
const AUTH_KEY = "precificador_auth";
const AUTH_USER = "isa";
const AUTH_SEED = 7321;
const AUTH_HASH = 8470134523032408; // hash de "isa123"
const conferirLogin = (usuario, senha) =>
  usuario.trim().toLowerCase() === AUTH_USER &&
  cyrb53("precificador|" + senha, AUTH_SEED) === AUTH_HASH;
```

- [ ] **Step 3: Verificar o hash no Node**

Run:
```bash
node -e 'const c=(s,seed=0)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<s.length;i++){ch=s.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0);};console.log(c("precificador|isa123",7321));'
```
Expected: `8470134523032408` (igual a `AUTH_HASH`).

- [ ] **Step 4: Verificar (por leitura)**

`conferirLogin("isa","isa123")` deve ser `true`; `conferirLogin("isa","errada")` `false`. As funções estão no Bloco 2; o ícone `logout` no `ICONS`. Não contém a string "isa123" em texto puro (só o hash). JS balanceado.

- [ ] **Step 5: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: funcoes de login (hash cyrb53) e icone logout"
```

---

## Task 2: Componente `TelaLogin` (Bloco 3)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Adicionar o componente `TelaLogin`**

No Bloco 3 (componentes visuais), logo após o componente `TabBtn` (ou antes do comentário do Bloco 4), acrescente:
```javascript
function TelaLogin({ aoEntrar }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);
  const submeter = (e) => {
    e.preventDefault();
    if (conferirLogin(usuario, senha)) aoEntrar();
    else setErro(true);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 18 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
            background: "linear-gradient(135deg, " + C.coral400 + ", " + C.coral600 + ")",
            boxShadow: "0 4px 12px rgba(216,90,48,0.35)",
          }}>
            <Ic n="chef" s={28} c="#fff" />
          </div>
          <h1 style={{ fontSize: 19, fontWeight: 600, margin: 0 }}>Precificador de receitas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Entre para continuar</p>
        </div>
        <Card>
          <form onSubmit={submeter}>
            <Field label="Usuário">
              <Inp value={usuario} onChange={(e) => { setUsuario(e.target.value); setErro(false); }} placeholder="Seu usuário" autoFocus />
            </Field>
            <div style={{ height: 12 }} />
            <Field label="Senha">
              <Inp type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setErro(false); }} placeholder="Sua senha" />
            </Field>
            {erro && (
              <div style={{ marginTop: 10, display: "flex", gap: 7, alignItems: "center", fontSize: 13, color: "var(--color-text-danger)" }}>
                <Ic n="alert" s={15} style={{ flexShrink: 0 }} /> Usuário ou senha incorretos.
              </div>
            )}
            <button type="submit" style={{ width: "100%", marginTop: 16, padding: "10px 0", borderRadius: "var(--border-radius-md)", border: "none", background: C.coral400, color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Entrar
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar (por leitura)**

`TelaLogin` usa `conferirLogin` (Task 1), `Card`, `Field`, `Inp`, `Ic`, `C.coral400/600` (já existem). O `onSubmit` usa `preventDefault`. Estado local de usuário/senha/erro. JSX balanceado.

- [ ] **Step 3: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: componente TelaLogin"
```

---

## Task 3: Integrar no App (gate + botão Sair)

**Files:** Modify `precificador-receitas.html`

- [ ] **Step 1: Adicionar estado `autenticado` e handlers**

No `App`, logo após a linha `const [importPreview, setImportPreview] = useState(null);`, acrescente:
```javascript
  const [autenticado, setAutenticado] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === "1"; } catch { return false; }
  });
  const entrar = () => { try { localStorage.setItem(AUTH_KEY, "1"); } catch {} setAutenticado(true); };
  const sair = () => { try { localStorage.removeItem(AUTH_KEY); } catch {} setAutenticado(false); };
```

- [ ] **Step 2: Inserir o gate antes do `return (` principal**

No `App`, imediatamente ANTES da linha `return (` (a que é seguida por `<div style={{ padding: "16px 0 40px" }}>`), acrescente:
```javascript
  if (!autenticado) return <TelaLogin aoEntrar={entrar} />;

```

- [ ] **Step 3: Adicionar o botão "Sair" no cabeçalho**

No cabeçalho, troque o bloco que contém o título (a `<div>` com o `<h1>` e o `<p>`):
```javascript
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Precificador de receitas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Custo, margem e preço num só lugar</p>
        </div>
```
por (acrescenta o botão "Sair" empurrado para a direita):
```javascript
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>Precificador de receitas</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "2px 0 0" }}>Custo, margem e preço num só lugar</p>
        </div>
        <button onClick={sair} title="Sair" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-tertiary)", background: "none", color: "var(--color-text-secondary)", fontSize: 13, cursor: "pointer" }}>
          <Ic n="logout" s={14} /> Sair
        </button>
```

- [ ] **Step 4: Verificar (por leitura)**

`autenticado` inicia do localStorage; `entrar`/`sair` gravam/limpam `AUTH_KEY`; o gate `if (!autenticado) return <TelaLogin .../>` vem antes do `return (` principal; o botão "Sair" chama `sair` e usa o ícone `logout`. JSX balanceado.

- [ ] **Step 5: Commit**

```bash
git add "precificador-receitas.html"
git commit -m "feat: gate de login no App e botao Sair no cabecalho"
```

---

## Task 4: QA final no navegador

**Files:** nenhum (verificação); commit só se houver ajuste.

- [ ] **Step 1: Subir o preview**

Garanta o preview rodando (`py -m http.server 8765`) e abra `http://localhost:8765/precificador-receitas.html`. Limpe a sessão: no DevTools, remova a chave `precificador_auth` (Application → Local Storage) e recarregue. Console sem erros (apenas o aviso do Babel).

- [ ] **Step 2: Roteiro de login**

1. Ao abrir (sem `precificador_auth`), aparece a TelaLogin (selo, "Entre para continuar", campos Usuário/Senha, botão Entrar). O app NÃO aparece.
2. Senha errada: usuário "isa", senha "xxx" → "Usuário ou senha incorretos."; não entra.
3. Correto: "isa" / "isa123" → entra; aparece o app com a Calculadora.
4. Variações aceitas: "ISA" e " isa " com espaços também entram (com a senha certa).

- [ ] **Step 3: Sessão e logout**

1. Recarregue a página (F5): continua logado (não pede senha de novo).
2. Clique "Sair" no cabeçalho: volta para a TelaLogin.
3. Recarregue: continua deslogado (pede senha).
4. Entre de novo: funciona.

- [ ] **Step 4: Integridade**

1. Confirme que o arquivo NÃO contém a string `isa123` (busca): `grep -c "isa123" "precificador-receitas.html"` → 0.
2. Após logar, o resto funciona normal: calcular (un e kg), salvar, backup. Logout não apaga receitas (o localStorage de produtos permanece).

- [ ] **Step 5: Commit (se algum ajuste foi necessário)**

```bash
git add "precificador-receitas.html"
git commit -m "fix: ajustes do QA de login"
```
(Se nada mudou, pular.)

---

## Self-Review (autor do plano)

- **Cobertura da spec:**
  - Hash JS puro (cyrb53) + constantes + conferirLogin → Task 1. ✔
  - TelaLogin (usuário, senha, Entrar, erro, Enter via form submit) → Task 2. ✔
  - Estado `autenticado` do localStorage, entrar/sair, gate, botão Sair → Task 3. ✔
  - Persistência "até Sair", case/trim do usuário, não vazar "isa123", offline/file:// → cobertos (Tasks 1–3) e verificados na Task 4. ✔
  - Não afeta cálculo/quilos/backup/salvos → gate é só uma camada na frente; nada do existente é alterado além do cabeçalho. ✔
- **Placeholders:** nenhum; todo passo traz código real. ✔
- **Consistência de nomes:** `cyrb53`, `AUTH_KEY`, `AUTH_USER`, `AUTH_SEED`, `AUTH_HASH`, `conferirLogin`, `TelaLogin`, `autenticado`, `entrar`, `sair`, ícone `logout` — usados de forma consistente entre as tarefas. ✔
