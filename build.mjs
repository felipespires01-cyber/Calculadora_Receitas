// ============================================================
// BUILD do Precificador de Receitas
// ------------------------------------------------------------
// Lê a fonte (src/precificador-receitas.source.html, com JSX e
// bibliotecas via CDN) e gera um arquivo AUTOSSUFICIENTE na raiz
// (precificador-receitas.html): React/ReactDOM embutidos e o JSX
// já compilado para JavaScript comum — sem CDN e sem Babel em runtime.
//
// Uso: node build.mjs
// ============================================================
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Babel = require("@babel/standalone");

const raiz = dirname(fileURLToPath(import.meta.url));
const CAMINHO_FONTE = join(raiz, "src", "precificador-receitas.source.html");
const CAMINHO_SAIDA = join(raiz, "precificador-receitas.html");
const VENDOR_REACT = join(raiz, "vendor", "react.production.min.js");
const VENDOR_REACT_DOM = join(raiz, "vendor", "react-dom.production.min.js");

// Tags de CDN exatas que serão substituídas
const TAG_REACT = '<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>';
const TAG_REACT_DOM = '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>';
const TAG_BABEL = '<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>';

// Evita que um "</script>" dentro do JS quebre o HTML
const escaparScript = (js) => js.replace(/<\/script/gi, "<\\/script");

function falhar(msg) {
  console.error("ERRO DE BUILD: " + msg);
  process.exit(1);
}

// 1) Ler fonte e bibliotecas vendorizadas
let html = readFileSync(CAMINHO_FONTE, "utf8");
const reactJs = readFileSync(VENDOR_REACT, "utf8");
const reactDomJs = readFileSync(VENDOR_REACT_DOM, "utf8");

// 2) Compilar o bloco JSX (<script type="text/babel">) para JS comum
const reBabel = /^<script type="text\/babel">\r?\n([\s\S]*?)\r?\n<\/script>/m;
if (!reBabel.test(html)) falhar('Não encontrei o bloco <script type="text/babel"> na fonte.');
html = html.replace(reBabel, (_m, codigoJsx) => {
  const compilado = Babel.transform(codigoJsx, {
    presets: ["react"],
    compact: false,
  }).code;
  return "<script>\n" + escaparScript(compilado) + "\n</script>";
});

// 3) Substituir as 3 tags de CDN: React e ReactDOM viram inline; Babel some
if (!html.includes(TAG_REACT)) falhar("Não encontrei a tag de CDN do React na fonte.");
if (!html.includes(TAG_REACT_DOM)) falhar("Não encontrei a tag de CDN do ReactDOM na fonte.");
if (!html.includes(TAG_BABEL)) falhar("Não encontrei a tag de CDN do Babel na fonte.");

// Substituições com FUNÇÃO para não interpretar padrões "$" do código minificado
html = html.replace(TAG_REACT, () => "<script>\n" + escaparScript(reactJs) + "\n</script>");
html = html.replace(TAG_REACT_DOM, () => "<script>\n" + escaparScript(reactDomJs) + "\n</script>");
html = html.replace(TAG_BABEL, () => "");

// Atualiza o comentário que falava em "carregadas da internet"
html = html.replace(
  "<!-- Bibliotecas (React + Babel) carregadas da internet na primeira abertura -->",
  "<!-- React e ReactDOM EMBUTIDOS abaixo (arquivo autossuficiente, funciona offline) -->"
);

// 4) Conferência de autossuficiência (nada de CDN/babel deve sobrar)
// As 3 tags de CDN originais não podem mais existir
if (html.includes(TAG_REACT) || html.includes(TAG_REACT_DOM) || html.includes(TAG_BABEL))
  falhar("Alguma tag de CDN original ainda está presente no arquivo final.");
// Nenhuma referência de carregamento externo (src apontando para http/https)
if (/src\s*=\s*["']https?:/i.test(html)) falhar("Ainda há um src=... apontando para a internet no arquivo final.");
if (html.includes("unpkg.com")) falhar("Ainda há referência a unpkg.com no arquivo final.");
if (html.includes('type="text/babel"')) falhar('Ainda há type="text/babel" no arquivo final.');
// Sanidade: o código do app precisa estar presente
if (!html.includes("ReactDOM.createRoot")) falhar("O código do app não foi encontrado no arquivo final.");

// 5) Escrever o arquivo final
writeFileSync(CAMINHO_SAIDA, html, "utf8");
const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
console.log("OK: precificador-receitas.html gerado (" + kb + " KB), autossuficiente.");
