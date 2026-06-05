# Precificador — Login (trava leve de entrada)

**Data:** 2026-06-04
**Arquivo alvo:** `precificador-receitas.html` (arquivo único)

## Objetivo

Adicionar uma tela de login simples antes do app, para que o arquivo "não fique tão
aberto". Credenciais: usuário **isa**, senha **isa123**.

## Aviso de segurança (decidido com o usuário)

Isto é uma **trava leve**, NÃO segurança real. Em um arquivo HTML solto, sem servidor,
qualquer pessoa técnica pode contornar (ver o código, usar o DevTools). O objetivo é
apenas barrar acesso casual. Para reduzir a exposição, a senha NÃO fica em texto puro:
fica guardada como **hash** (embaralhada).

## Restrições

- Continua arquivo único, leve, offline, abrindo com dois cliques (`file://`).
- O hash deve usar **JavaScript puro** (função `cyrb53`), sem `crypto.subtle` —
  porque `crypto.subtle` pode não existir em `file://` em alguns navegadores. cyrb53
  funciona em qualquer lugar.

## Comportamento

### Estado de autenticação
- Chave em localStorage: `precificador_auth`. Valor `"1"` = logado.
- Ao abrir, o app inicia já logado se `localStorage.getItem("precificador_auth") === "1"`.
- "Continuar logado até Sair": o sinal persiste entre aberturas/recargas até logout.

### Credenciais
- Usuário: comparado em texto, **sem diferenciar maiúsculas** e ignorando espaços nas
  pontas: `usuarioDigitado.trim().toLowerCase() === "isa"`.
- Senha: validada por hash. `cyrb53("precificador|" + senhaDigitada, 7321) === 8470134523032408`.
  (O valor `8470134523032408` é o hash de "isa123" com esse salt e seed.)

### Função de hash (JS puro)
```javascript
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
const AUTH_HASH = 8470134523032408;
const AUTH_SEED = 7321;
const conferirLogin = (usuario, senha) =>
  usuario.trim().toLowerCase() === AUTH_USER &&
  cyrb53("precificador|" + senha, AUTH_SEED) === AUTH_HASH;
```

### Tela de login (quando não logado)
- Mesmo visual quente do app: selo coral (ícone `chef`), título "Precificador de receitas",
  subtítulo curto ("Entre para continuar").
- Um `<form>` (Card) com:
  - Campo **Usuário** (texto).
  - Campo **Senha** (`type="password"`).
  - Botão **Entrar** (envia o form).
  - Mensagem de erro ("Usuário ou senha incorretos.") quando a checagem falha.
- Enter no formulário também tenta logar (submit padrão; usar `onSubmit` com `preventDefault`).
- Ao acertar: grava `precificador_auth = "1"` e mostra o app.
- Centralizado e confortável no celular.

### Botão "Sair" (quando logado)
- No cabeçalho do app, à direita, um botão discreto **"Sair"**.
- Ao clicar: remove `precificador_auth` do localStorage e volta para a tela de login.
- Não apaga nenhum dado de receitas — só desloga.

## Arquitetura no arquivo

- Novas constantes/funções no Bloco 2 (auxiliares): `cyrb53`, `AUTH_KEY`, `AUTH_USER`,
  `AUTH_HASH`, `AUTH_SEED`, `conferirLogin`.
- Novo componente `TelaLogin({ aoEntrar })` (Bloco 3 ou junto ao App) com estado local
  de usuário/senha/erro.
- No `App`: estado `autenticado` (inicia do localStorage). Se `!autenticado`, renderiza
  `<TelaLogin aoEntrar={...} />` e nada mais. Se autenticado, renderiza o app atual com
  um botão "Sair" no cabeçalho.

## Critérios de sucesso

- Abrir o arquivo (inclusive `file://`) mostra a tela de login.
- Usuário "isa" + senha "isa123" entra; "ISA"/" isa " também (case/espaços).
- Senha errada ou usuário errado mostra erro e não entra.
- Depois de entrar, recarregar a página continua logado (sem pedir senha de novo).
- "Sair" volta para o login; entrar de novo funciona.
- O arquivo não contém a string "isa123" em texto puro (só o hash).
- Nenhum recurso existente (cálculo, quilos, backup, salvos) é afetado.
- Funciona offline e no celular.

## Tradeoffs

- cyrb53 não é hash criptográfico — é suficiente para o objetivo (esconder o texto da
  senha e barrar acesso casual). Não pretende resistir a ataque dedicado.
- Trocar a senha no futuro exige recalcular o hash e atualizar `AUTH_HASH` (peço quando
  você quiser mudar).
