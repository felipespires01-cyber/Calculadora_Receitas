# Precificador — App de celular (PWA) hospedado no GitHub Pages

**Data:** 2026-06-04

## Problema

No iPhone, abrir o `.html` (de WhatsApp/Files) mostra um **visualizador que não executa
JavaScript** → tela em branco. O iOS não roda um app web a partir de arquivo solto.
Conclusão: distribuir como arquivo não funciona no iPhone, por mais autossuficiente que
seja.

## Objetivo

Publicar a ferramenta como **página web hospedada** (link), que vira um **app instalável
e offline** (PWA) no celular. Decisões do usuário:
- **Hospedagem:** GitHub Pages no repositório atual, tornado **público**.
- **Offline + instalável:** sim (manifest + ícone + service worker).

## Restrições

- O app em si (login, cálculo un/kg, backup, salvos, visual) **não muda**.
- Continua existindo a versão autossuficiente em arquivo (para PC), gerada pelo build.
- O service worker e o manifest só valem na versão hospedada (HTTPS/localhost); em
  `file://` eles simplesmente não ativam (degradação silenciosa).

## Arquitetura

### Hospedagem (GitHub Pages)
- Pages servindo do branch `main`, pasta raiz (`/`).
- Entrada: **`index.html`** na raiz (o app autossuficiente). URL final:
  `https://felipespires01-cyber.github.io/Calculadora_Receitas/`.
- O usuário habilita o Pages em Settings → Pages (passo guiado). O repositório passa a
  ser **público** (também ação do usuário, ou minha via push — a visibilidade é
  alterada pelo usuário nas Settings do GitHub).

### Saídas do build
O `build.mjs` passa a gerar **dois** arquivos com o mesmo conteúdo autossuficiente:
- `index.html` — entrada do GitHub Pages (e também abre por duplo-clique no PC).
- `precificador-receitas.html` — mantido para quem quiser o arquivo direto.

### PWA — manifest
Arquivo `manifest.webmanifest` (estático, na raiz):
```json
{
  "name": "Precificador de Receitas",
  "short_name": "Precificador",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#f3ede3",
  "theme_color": "#D85A30",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### PWA — ícones
- `icon-192.png`, `icon-512.png` (Android/manifest) e `apple-touch-icon.png` (180×180, iOS).
- Visual: quadrado de cantos arredondados com degradê coral (`#D85A30`→`#993C1D`) e o
  ícone do chapéu de chef em branco (mesma identidade do app).
- Geração: via canvas no navegador de preview (sem dependência nova), exportando PNG e
  gravando os arquivos.

### PWA — meta tags (no `<head>` da fonte)
```html
<link rel="manifest" href="manifest.webmanifest" />
<meta name="theme-color" content="#D85A30" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Precificador" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
```

### PWA — service worker (offline)
- Arquivo `sw.js` (estático, na raiz). Estratégia **cache-first** do "app shell".
- No `install`: pré-cacheia `./`, `./index.html`, `./manifest.webmanifest`,
  `./icon-192.png`, `./icon-512.png`, `./apple-touch-icon.png`.
- No `fetch`: responde do cache; se não houver, busca na rede e cacheia.
- Nome do cache **versionado** (carimbo do build) + `activate` que apaga caches antigos +
  `skipWaiting()`/`clients.claim()` para atualizar rápido quando eu publicar nova versão.
- O build injeta a versão no `sw.js` (carimbo gerado em build-time).

### PWA — registro do service worker
- No `<head>`/fim do `<body>` da fonte, um `<script>` comum (não-JSX):
```html
<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
</script>
```
- Em `file://` o registro falha silenciosamente (try/catch); o app funciona igual.

## Atualizações

Ao publicar nova versão (push), o `sw.js` muda (nova versão de cache) → o navegador busca
o novo SW, `skipWaiting`+`clients.claim` ativam, caches antigos são apagados e o app passa
a servir a versão nova na próxima abertura. Sem reenviar nada para os usuários.

## Dados

A versão hospedada é uma **nova origem** (URL), com seu próprio `localStorage`. Como no
iPhone o arquivo nunca funcionou, não há dados a migrar. Backup/importar continua como
rede de segurança e para passar receitas entre aparelhos/pessoas.

## Critérios de sucesso

- `index.html`, `manifest.webmanifest`, `sw.js`, `icon-192/512.png`, `apple-touch-icon.png`
  presentes na raiz; tudo gerado/válido.
- Localmente (preview em `http://localhost`, que é contexto seguro): o app abre, o service
  worker **registra** e o manifest é válido.
- Publicado no Pages: abrir o link no celular mostra a ferramenta (login etc.);
  "Adicionar à Tela de Início" cria o ícone e abre em tela cheia; após a 1ª abertura,
  funciona offline.
- Atualização: nova publicação reflete no app sem reenvio.

## Tradeoffs / riscos

- Precisa de internet na **primeira** abertura (depois, offline). Aceitável.
- Service worker exige HTTPS — garantido pelo GitHub Pages.
- Habilitar Pages e tornar o repo público são ações do usuário nas Settings do GitHub
  (eu forneço o passo a passo exato).
- O teste final definitivo é no iPhone da usuária, via o link publicado.
