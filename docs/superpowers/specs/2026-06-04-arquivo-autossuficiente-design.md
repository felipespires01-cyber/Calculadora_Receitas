# Precificador — Arquivo autossuficiente (abrir offline / via WhatsApp)

**Data:** 2026-06-04
**Arquivo alvo distribuído:** `precificador-receitas.html` (gerado)

## Problema

O `precificador-receitas.html` carrega React, ReactDOM e Babel de um CDN (unpkg) e
**traduz o JSX no navegador (Babel) a cada abertura**. Quando aberto pelo navegador
interno do WhatsApp/Gmail, offline, ou como arquivo baixado num webview restrito, os
scripts externos não carregam → **tela em branco**. No PC funcionou só porque o
navegador já tinha as bibliotecas em cache.

## Objetivo

Distribuir um arquivo **autossuficiente**: sem CDN e sem Babel em tempo de execução.
Abre em qualquer lugar (offline, `file://`, celular fraco, webview do WhatsApp).
Decisão do usuário: **Opção B (leve)** — pré-compilar o JSX e embutir só React+ReactDOM
(~140 KB), em vez de embutir o Babel inteiro (~3 MB).

## Restrições

- O arquivo final continua sendo **um único `precificador-receitas.html`** (mesmo nome),
  que o usuário compartilha e abre com dois cliques.
- Comportamento do app idêntico (login, cálculo, quilos, backup, salvos, visual).
- Sem quebrar dados já salvos: as chaves de `localStorage` (`precificador_produtos`,
  `precificador_auth`) **não mudam**.

## Arquitetura

Separação fonte / distribuível:

- **Fonte (editável por mim):** `src/precificador-receitas.source.html` — o arquivo atual,
  com JSX em `<script type="text/babel">` e os 3 `<script src=unpkg>`. Continua servindo
  para preview de desenvolvimento.
- **Bibliotecas vendorizadas:** `vendor/react.production.min.js` e
  `vendor/react-dom.production.min.js` (baixadas uma vez do unpkg, versão 18, commitadas).
- **Build:** `build.mjs` (Node) gera o `precificador-receitas.html` na raiz.
- **Tooling de build (só no meu lado):** `@babel/standalone` como devDependency
  (`package.json`); `node_modules/` no `.gitignore`. O Babel NÃO vai para o arquivo final.

### O que o build faz (`build.mjs`)
1. Lê `src/precificador-receitas.source.html`.
2. Extrai o conteúdo do bloco `<script type="text/babel"> … </script>`.
3. Compila JSX → JS com `@babel/standalone` (preset `react`; só transform de JSX,
   sem polyfills — o JS moderno é mantido, pois celulares atuais suportam).
4. Lê os dois arquivos de `vendor/`.
5. Monta o HTML final a partir da fonte, substituindo:
   - os 3 `<script src="https://unpkg.com/…">` por **dois** `<script>` inline com o
     conteúdo de `vendor/react…` e `vendor/react-dom…` (ordem: React, depois ReactDOM);
   - o `<script type="text/babel">…</script>` por `<script>…JS compilado…</script>`.
6. Escapa qualquer `</script>` dentro do JS embutido (vira `<\/script>`) para não
   quebrar o HTML.
7. Escreve `precificador-receitas.html` na raiz.

### Ordem dos scripts no arquivo final
`React` (define `window.React`) → `ReactDOM` (define `window.ReactDOM`) → script do app
(usa `React`/`ReactDOM` globais). Igual ao que o CDN fazia, só que embutido.

## Segurança dos dados (resposta à dúvida do usuário)

- Os dados ficam em `localStorage` do navegador, **não dentro do HTML**. Trocar o arquivo
  pela versão nova (mesmo nome/lugar, mesmo navegador) **não apaga** as receitas.
- As chaves de `localStorage` permanecem as mesmas, então a migração da versão CDN para a
  autossuficiente preserva os dados no mesmo aparelho/navegador.
- Garantia 100%: **"Fazer backup" antes de atualizar** e, se preciso, "Importar backup".

## Fluxo de trabalho (importante)

A partir de agora, **toda alteração é feita na fonte (`src/…source.html`) e exige rodar o
build** (`node build.mjs`) para regenerar o `precificador-receitas.html` antes de entregar.
Nunca distribuir a fonte; sempre o arquivo gerado.

## Critérios de sucesso

- O `precificador-receitas.html` final **não contém** nenhuma referência a `unpkg`,
  `http://`/`https://` em `<script src>`, nem `type="text/babel"`.
- Abre e renderiza a tela de login **via `file://`** (duplo-clique) **sem internet**.
- Login (isa/isa123), cálculo (un/kg), backup e salvos funcionam no arquivo final.
- Tamanho do arquivo final ~150–300 KB.
- A fonte continua editável e com preview funcionando.
- `node build.mjs` é reprodutível (usa `vendor/` local, sem rede).

## Tradeoffs

- Passo de build no meu lado (disciplina de sempre regenerar). Mitigado por: documentar
  no fluxo e na memória, e verificar o arquivo final a cada entrega.
- Sem Babel em runtime → o JS embutido é moderno (arrow, spread, optional chaining). É
  seguro para navegadores de celular atuais; não miramos navegadores muito antigos.
