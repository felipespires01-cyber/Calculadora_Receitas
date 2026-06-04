# Precificador de Receitas — Robustez de dados + Visual

**Data:** 2026-06-04
**Arquivo alvo:** `precificador-receitas.html` (arquivo único, autossuficiente)

## Objetivo

Deixar a ferramenta "mais robusta" para ser compartilhada com outra pessoa,
mantendo a característica de **um único HTML leve** que funciona com dois cliques.
Dois focos:

1. **Não perder os dados** — backup/importar por arquivo.
2. **Deixar bem legal** — elevar o visual sem perder a leveza nem a simplicidade
   para usuários leigos.

**Fora de escopo (decisão do usuário):** não acrescentar novos recursos de
cálculo (ex.: preço por kg, impostos, taxa de maquininha, custo fixo rateado).
A lógica de cálculo existente permanece intacta.

## Restrições

- Continua sendo **um único arquivo HTML**, autossuficiente, aberto com dois cliques.
- React + Babel carregados de CDN na primeira abertura (mantém o arquivo pequeno).
  Funciona offline depois da primeira carga (cache do navegador).
- Sem backend, sem build, sem dependências instaláveis.
- Apenas CSS + SVG para o visual. **Fontes do sistema** (sem baixar fonte da web),
  para abrir rápido e funcionar offline.
- Público-alvo leigo, uso principal no **celular**.

## Funcionalidade 1 — Backup e Importar (por arquivo)

### Exportar (backup)
- Botão **"Fazer backup"** na aba *Produtos salvos*.
- Baixa um arquivo JSON nomeado com data: `receitas-backup-AAAA-MM-DD.json`.
- Conteúdo: um envelope com metadados de versão para compatibilidade futura:
  ```json
  {
    "app": "precificador-receitas",
    "versao": 1,
    "exportadoEm": "<ISO timestamp>",
    "produtos": [ ... lista de produtos exatamente como em localStorage ... ]
  }
  ```

### Importar (restaurar / receber)
- Botão **"Importar backup"** na aba *Produtos salvos* → abre o seletor de arquivos.
- Lê e **valida** o arquivo antes de aplicar qualquer mudança:
  - É JSON válido?
  - Tem o campo `app === "precificador-receitas"` e `produtos` é uma lista?
  - Se inválido: mensagem clara ("Este arquivo não é um backup válido de receitas.")
    e **nada é alterado**.
- **Mesclagem inteligente por `id`:**
  - Produto com `id` que já existe → é **atualizado** com a versão importada.
  - Produto com `id` novo → é **adicionado**.
  - Nada do que a pessoa já tem é apagado.
- Antes de aplicar, mostra um **resumo de confirmação**:
  *"X novas, Y atualizadas. Confirmar importação?"* com botões Confirmar/Cancelar.
- Após confirmar, persiste e atualiza a lista na tela.

### Casos cobertos
Uma única mecânica (exportar/importar arquivo) cobre os quatro cenários levantados:
trocar de aparelho, backup de segurança, compartilhar receitas e a consciência de
fazer backup (reforçada pelo aviso, abaixo).

## Funcionalidade 2 — À prova de erro (robustez)

- **Falhas de salvamento deixam de ser silenciosas.** Hoje `gravarProdutos` e
  `lerProdutos` engolem erros. Passar a:
  - Avisar o usuário quando o salvamento falhar (ex.: armazenamento cheio / bloqueado)
    com uma mensagem amigável.
  - Em leitura corrompida, não quebrar a tela (degradar para lista vazia já acontece;
    manter, mas sem perder dados existentes de forma destrutiva).
- **Validação na importação** (descrita acima) impede que um arquivo errado bagunce
  os dados.
- Mensagens de erro/sucesso visíveis e em português claro.

## Funcionalidade 3 — Aviso amigável

- Faixa discreta (na aba *Produtos salvos*, perto dos botões de backup) lembrando que
  os dados ficam **só naquele aparelho** e sugerindo fazer backup de vez em quando.
- Tom acolhedor, sem assustar. Não bloqueia nada.

## Funcionalidade 4 — Visual ("deixar bem legal")

Identidade: **aconchego de cozinha artesanal**. Elevar o tom coral/terracota já
existente; nada corporativo. Mantém tema claro **e** escuro.

- **Cabeçalho com marca:** ícone do chapéu num selo arredondado + nome com boa
  hierarquia tipográfica. Cara de produto, não de planilha.
- **Profundidade e ritmo:** cards com sombras suaves, bordas delicadas, respiro
  generoso, cantos arredondados consistentes, escala de espaçamento harmônica.
- **Tabela de margem/preço como estrela:** linha escolhida com destaque elegante
  (faixa coral, leve elevação), legível num olhar.
- **Micro-interações leves:** confirmação gostosa no "Salvar" (check + brilho rápido);
  transições suaves ao abrir/fechar composição, trocar de aba e selecionar margem.
  Tudo em CSS, sem pesar.
- **Estados vazios com personalidade:** ilustração simples em SVG + frase acolhedora.
- **Mobile-first:** toques grandes, fontes legíveis, coluna confortável, botões de
  backup com ícones claros.

Tudo só com CSS + SVG e fontes do sistema — sem aumentar o peso do arquivo de forma
relevante nem quebrar o funcionamento offline.

## Organização do código (dentro do arquivo único)

Manter os blocos comentados já existentes. Adições:
- Novas funções auxiliares de backup: `exportarBackup()`, `importarBackup(file)`,
  validação e mesclagem por `id`.
- Pequeno componente/área de UI para os botões de backup + aviso, na aba *Produtos salvos*.
- Estado para o fluxo de confirmação da importação e para mensagens de erro/sucesso.
- Ajustes de CSS (variáveis de tema, sombras, espaçamento, animações) no `<style>`.

## Critérios de sucesso

- Abrir o HTML com dois cliques continua funcionando; arquivo continua leve.
- Dá para exportar um backup, limpar/trocar de navegador e restaurar tudo importando.
- Importar um arquivo inválido nunca destrói dados; mostra mensagem clara.
- Importação mescla sem duplicar nem apagar o que já existe.
- Falha de salvamento mostra aviso (não falha em silêncio).
- Visual nitidamente mais bonito e com personalidade, claro e escuro, bom no celular.
- Nenhuma fórmula de cálculo existente foi alterada.

## Tradeoffs conhecidos

- **CDN na primeira carga:** o app precisa de internet na primeiríssima abertura para
  baixar React/Babel; depois funciona offline. Inlinar as bibliotecas deixaria o
  arquivo pesado (Babel standalone ~MBs), contrariando o pedido de "HTML leve".
  Mantemos o CDN.
- **Sem sincronização automática entre aparelhos:** sem backend, isso é impossível
  mantendo o arquivo simples. O backup/importar manual é a solução robusta dentro
  da restrição.
