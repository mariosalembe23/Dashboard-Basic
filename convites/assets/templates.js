/*
 * Motor de modelos de convites.
 *
 * Cada modelo é uma função que recebe os dados do evento + do convidado
 * e devolve o HTML do convite (600 x 900 px). Os campos variáveis são:
 *   evento.titulo, evento.tipo, evento.data, evento.hora, evento.local, evento.mensagem
 *   convidado.nome, convidado.mesa, convidado.acompanhantes
 *   qr (imagem do QR code em dataURL) e codigo (código único do convite)
 *
 * Para transformar um modelo vosso em código há duas opções:
 *   1. Recriá-lo em HTML/CSS aqui (melhor qualidade, texto nítido, editável).
 *   2. Usar o modelo "imagem": a arte original fica de fundo e só o nome
 *      e o QR são posicionados por cima (mais rápido de pôr em produção).
 */

const CONVITE_W = 600;
const CONVITE_H = 900;

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const txt = new Date(y, m - 1, d).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/* Gera o QR code como imagem (dataURL) usando qrcodejs. */
function gerarQR(texto, tamanho = 300) {
  const tmp = document.createElement("div");
  new QRCode(tmp, { text: texto, width: tamanho, height: tamanho, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
  const canvas = tmp.querySelector("canvas");
  return canvas ? canvas.toDataURL("image/png") : tmp.querySelector("img").src;
}

/* Código único, sem caracteres ambíguos (0/O, 1/I/L). */
function gerarCodigo(tamanho = 8) {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

/* Conteúdo gravado no QR: versão | id do evento | código do convidado */
function payloadQR(eventoId, codigo) {
  return `CNV1|${eventoId}|${codigo}`;
}

function lerPayloadQR(texto) {
  const p = String(texto).trim().split("|");
  if (p.length === 3 && p[0] === "CNV1") return { eventoId: p[1], codigo: p[2] };
  return { eventoId: null, codigo: String(texto).trim().toUpperCase() };
}

function extras(c) {
  const partes = [];
  if (c.mesa) partes.push(`Mesa ${esc(c.mesa)}`);
  if (c.acompanhantes && Number(c.acompanhantes) > 0) partes.push(`+${esc(c.acompanhantes)} acompanhante${Number(c.acompanhantes) > 1 ? "s" : ""}`);
  return partes.join(" · ");
}

const TEMPLATE_CSS = `
.cv{width:${CONVITE_W}px;height:${CONVITE_H}px;position:relative;overflow:hidden;box-sizing:border-box;text-align:center}
.cv *{box-sizing:border-box;margin:0}
.cv .qr{display:block;background:#fff}
.cv .cod{font-family:'Montserrat',sans-serif;font-size:12px;letter-spacing:4px;margin-top:8px}

/* 1 · Elegância Dourada */
.t-dourado{background:radial-gradient(circle at 50% 20%,#1d2d4f,#0b1324 70%);color:#e9d8a6;font-family:'Montserrat',sans-serif;padding:78px 64px}
.t-dourado:before,.t-dourado:after{content:"";position:absolute;pointer-events:none}
.t-dourado:before{inset:22px;border:2px solid #c9a227}
.t-dourado:after{inset:32px;border:1px solid rgba(201,162,39,.5)}
.t-dourado .tipo{font-size:13px;letter-spacing:6px;text-transform:uppercase;color:#c9a227}
.t-dourado .titulo{font-family:'Great Vibes',cursive;font-size:76px;line-height:1.05;color:#f3e2a9;margin:18px 0 6px}
.t-dourado .orn{color:#c9a227;letter-spacing:12px;font-size:14px}
.t-dourado .conv{font-size:13px;letter-spacing:2px;margin-top:22px;opacity:.85}
.t-dourado .nome{font-family:'Playfair Display',serif;font-size:34px;color:#fff;margin:8px 0 4px}
.t-dourado .extra{font-size:12px;letter-spacing:2px;color:#c9a227;min-height:16px}
.t-dourado .msg{font-size:14px;line-height:1.6;margin:18px auto 0;max-width:420px;opacity:.9}
.t-dourado .info{margin-top:20px;font-size:14px;line-height:1.7}
.t-dourado .info b{color:#f3e2a9;font-weight:600}
.t-dourado .qrbox{position:absolute;left:50%;bottom:62px;transform:translateX(-50%)}
.t-dourado .qr{width:132px;height:132px;padding:8px;border-radius:6px;border:2px solid #c9a227}

/* 2 · Floral Rosé */
.t-floral{background:#fbf1ee;color:#6e4646;font-family:'Montserrat',sans-serif;padding:96px 70px}
.t-floral .canto{position:absolute;width:230px;height:230px}
.t-floral .c1{top:-20px;left:-20px}.t-floral .c2{top:${CONVITE_H - 210}px;left:${CONVITE_W - 210}px}
.t-floral .tipo{font-size:12px;letter-spacing:5px;text-transform:uppercase;color:#c98b8b}
.t-floral .titulo{font-family:'Playfair Display',serif;font-style:italic;font-size:54px;line-height:1.1;margin:16px 0}
.t-floral .linha{width:80px;height:1px;background:#c98b8b;margin:0 auto}
.t-floral .conv{font-size:13px;margin-top:22px}
.t-floral .nome{font-family:'Great Vibes',cursive;font-size:50px;color:#a35d5d;margin:2px 0}
.t-floral .extra{font-size:12px;letter-spacing:1px;color:#c98b8b;min-height:16px}
.t-floral .msg{font-size:14px;line-height:1.6;margin-top:16px}
.t-floral .info{margin-top:18px;font-size:14px;line-height:1.7}
.t-floral .qrbox{position:absolute;left:50%;bottom:70px;transform:translateX(-50%)}
.t-floral .qr{width:128px;height:128px;padding:8px;border-radius:12px;box-shadow:0 4px 16px rgba(163,93,93,.18)}

/* 3 · Festa Vibrante */
.t-festa{background:linear-gradient(150deg,#6a11cb 0%,#d4148a 55%,#ff7a18 100%);font-family:'Poppins',sans-serif;padding:44px}
.t-festa .confete{position:absolute;inset:0;background-image:radial-gradient(#ffd60a 3px,transparent 4px),radial-gradient(#4cc9f0 3px,transparent 4px),radial-gradient(#fff 2px,transparent 3px);background-size:90px 90px,130px 130px,60px 60px;background-position:0 0,40px 60px,20px 30px;opacity:.55}
.t-festa .card{position:relative;background:#fff;border-radius:28px;height:100%;padding:56px 44px;color:#2b2140;box-shadow:0 20px 50px rgba(0,0,0,.25)}
.t-festa .tipo{display:inline-block;background:#ffd60a;color:#2b2140;font-weight:700;font-size:13px;letter-spacing:3px;text-transform:uppercase;padding:6px 16px;border-radius:999px}
.t-festa .titulo{font-weight:800;font-size:56px;line-height:1;margin:22px 0 10px;background:linear-gradient(90deg,#6a11cb,#d4148a);-webkit-background-clip:text;background-clip:text;color:transparent}
.t-festa .conv{font-size:14px;color:#6b5f80}
.t-festa .nome{font-weight:700;font-size:32px;margin:4px 0}
.t-festa .extra{font-size:13px;color:#d4148a;font-weight:600;min-height:18px}
.t-festa .msg{font-size:14px;line-height:1.6;margin-top:14px;color:#4a3f5c}
.t-festa .info{margin-top:16px;font-size:14px;line-height:1.7;font-weight:500}
.t-festa .qrbox{position:absolute;left:50%;bottom:44px;transform:translateX(-50%)}
.t-festa .qr{width:130px;height:130px;padding:6px;border-radius:14px;border:3px solid #6a11cb}
.t-festa .cod{color:#6a11cb;font-weight:600}

/* 4 · Corporativo Minimal */
.t-minimal{background:#fff;color:#111;font-family:'Montserrat',sans-serif;text-align:left;padding:0}
.t-minimal .barra{height:16px;background:#111}
.t-minimal .corpo{padding:70px 64px}
.t-minimal .tipo{font-size:12px;font-weight:600;letter-spacing:4px;text-transform:uppercase;color:#888}
.t-minimal .titulo{font-weight:800;font-size:50px;line-height:1.05;margin:18px 0 26px;letter-spacing:-1px}
.t-minimal .conv{font-size:13px;color:#666}
.t-minimal .nome{font-weight:600;font-size:28px;margin:4px 0}
.t-minimal .extra{font-size:12px;color:#888;min-height:16px}
.t-minimal .msg{font-size:15px;line-height:1.65;margin-top:22px;color:#333;max-width:430px}
.t-minimal .info{position:absolute;left:64px;bottom:64px;font-size:14px;line-height:1.8;max-width:290px}
.t-minimal .info b{display:block;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#888;font-weight:600}
.t-minimal .qrbox{position:absolute;right:56px;bottom:56px;text-align:center}
.t-minimal .qr{width:140px;height:140px;border:1px solid #ddd;padding:6px}

/* 5 · Céu Suave (batizado / chá de bebé) */
.t-ceu{background:linear-gradient(180deg,#cfe8ff 0%,#eef7ff 60%,#fff 100%);color:#2f4a6b;font-family:'Montserrat',sans-serif;padding:110px 70px}
.t-ceu .nuvem{position:absolute;background:#fff;border-radius:999px;opacity:.9}
.t-ceu .nuvem:before,.t-ceu .nuvem:after{content:"";position:absolute;background:#fff;border-radius:50%}
.t-ceu .n1{width:170px;height:46px;top:56px;left:-30px}.t-ceu .n1:before{width:70px;height:70px;top:-34px;left:34px}.t-ceu .n1:after{width:54px;height:54px;top:-22px;left:92px}
.t-ceu .n2{width:150px;height:40px;top:120px;right:-20px}.t-ceu .n2:before{width:60px;height:60px;top:-30px;left:28px}.t-ceu .n2:after{width:46px;height:46px;top:-18px;left:78px}
.t-ceu .tipo{font-size:12px;letter-spacing:5px;text-transform:uppercase;color:#6c9bd2}
.t-ceu .titulo{font-family:'Playfair Display',serif;font-size:52px;margin:14px 0 8px}
.t-ceu .estrela{color:#f2c94c;font-size:18px;letter-spacing:10px}
.t-ceu .conv{font-size:13px;margin-top:20px}
.t-ceu .nome{font-family:'Playfair Display',serif;font-style:italic;font-size:32px;margin:6px 0 2px}
.t-ceu .extra{font-size:12px;color:#6c9bd2;min-height:16px}
.t-ceu .msg{font-size:14px;line-height:1.6;margin-top:16px}
.t-ceu .info{margin-top:18px;font-size:14px;line-height:1.7}
.t-ceu .qrbox{position:absolute;left:50%;bottom:64px;transform:translateX(-50%)}
.t-ceu .qr{width:128px;height:128px;padding:8px;border-radius:16px;border:2px solid #bcdcff}

/* 6 · Modelo próprio (imagem de fundo) */
.t-imagem{width:${CONVITE_W}px;background-size:100% 100%;background-repeat:no-repeat}
.t-imagem .campo{position:absolute;transform:translate(-50%,-50%);white-space:nowrap}
.t-imagem .qrbox{position:absolute;transform:translate(-50%,-50%)}
.t-imagem .qr{width:100%;height:auto;padding:4%;border-radius:6px}
.t-imagem .vazio{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;background:repeating-linear-gradient(45deg,#f3f4f6,#f3f4f6 14px,#e5e7eb 14px,#e5e7eb 28px);color:#6b7280;font-family:'Montserrat',sans-serif;font-size:16px}
`;

const FOLHA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><g transform="ROT"><g fill="none" stroke="#c98b8b" stroke-width="2"><path d="M10 190 C 40 120, 90 60, 190 10"/></g><g fill="#e8b7b0"><ellipse cx="60" cy="130" rx="22" ry="9" transform="rotate(-50 60 130)"/><ellipse cx="95" cy="88" rx="22" ry="9" transform="rotate(-40 95 88)"/><ellipse cx="135" cy="52" rx="20" ry="8" transform="rotate(-30 135 52)"/></g><g fill="#d79f97"><ellipse cx="78" cy="118" rx="18" ry="7" transform="rotate(20 78 118)"/><ellipse cx="115" cy="78" rx="18" ry="7" transform="rotate(25 115 78)"/></g><circle cx="40" cy="160" r="12" fill="#f4cfc8"/><circle cx="40" cy="160" r="5" fill="#c98b8b"/><circle cx="165" cy="30" r="10" fill="#f4cfc8"/><circle cx="165" cy="30" r="4" fill="#c98b8b"/></g></svg>`;

const svgURI = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

function blocoInfo(e) {
  const linhas = [];
  if (e.data) linhas.push(esc(formatarData(e.data)));
  if (e.hora) linhas.push(`às ${esc(e.hora)}`);
  if (e.local) linhas.push(esc(e.local));
  return linhas.join("<br>");
}

const TEMPLATES = [
  {
    id: "dourado",
    nome: "Elegância Dourada",
    categoria: "Casamento",
    render: ({ evento: e, convidado: c, qr, codigo }) => `
      <div class="cv t-dourado">
        <div class="tipo">${esc(e.tipo)}</div>
        <div class="titulo">${esc(e.titulo)}</div>
        <div class="orn">✦ ✦ ✦</div>
        <div class="conv">TEMOS A HONRA DE CONVIDAR</div>
        <div class="nome">${esc(c.nome)}</div>
        <div class="extra">${extras(c)}</div>
        <div class="msg">${esc(e.mensagem)}</div>
        <div class="info">${blocoInfo(e)}</div>
        <div class="qrbox"><img class="qr" src="${qr}"><div class="cod">${esc(codigo)}</div></div>
      </div>`,
  },
  {
    id: "floral",
    nome: "Floral Rosé",
    categoria: "Casamento · Noivado",
    render: ({ evento: e, convidado: c, qr, codigo }) => `
      <div class="cv t-floral">
        <img class="canto c1" src="${svgURI(FOLHA_SVG.replace("ROT", ""))}"><img class="canto c2" src="${svgURI(FOLHA_SVG.replace("ROT", "rotate(180 100 100)"))}">
        <div class="tipo">${esc(e.tipo)}</div>
        <div class="titulo">${esc(e.titulo)}</div>
        <div class="linha"></div>
        <div class="conv">com carinho, convidamos</div>
        <div class="nome">${esc(c.nome)}</div>
        <div class="extra">${extras(c)}</div>
        <div class="msg">${esc(e.mensagem)}</div>
        <div class="info">${blocoInfo(e)}</div>
        <div class="qrbox"><img class="qr" src="${qr}"><div class="cod">${esc(codigo)}</div></div>
      </div>`,
  },
  {
    id: "festa",
    nome: "Festa Vibrante",
    categoria: "Aniversário · Festa",
    render: ({ evento: e, convidado: c, qr, codigo }) => `
      <div class="cv t-festa">
        <div class="confete"></div>
        <div class="card">
          <div class="tipo">${esc(e.tipo)}</div>
          <div class="titulo">${esc(e.titulo)}</div>
          <div class="conv">Este convite é para</div>
          <div class="nome">${esc(c.nome)}</div>
          <div class="extra">${extras(c)}</div>
          <div class="msg">${esc(e.mensagem)}</div>
          <div class="info">${blocoInfo(e)}</div>
          <div class="qrbox"><img class="qr" src="${qr}"><div class="cod">${esc(codigo)}</div></div>
        </div>
      </div>`,
  },
  {
    id: "minimal",
    nome: "Corporativo Minimal",
    categoria: "Corporativo · Conferência",
    render: ({ evento: e, convidado: c, qr, codigo }) => `
      <div class="cv t-minimal">
        <div class="barra"></div>
        <div class="corpo">
          <div class="tipo">${esc(e.tipo)}</div>
          <div class="titulo">${esc(e.titulo)}</div>
          <div class="conv">Convidado</div>
          <div class="nome">${esc(c.nome)}</div>
          <div class="extra">${extras(c)}</div>
          <div class="msg">${esc(e.mensagem)}</div>
        </div>
        <div class="info">
          ${e.data ? `<b>Data</b>${esc(formatarData(e.data))}${e.hora ? `, ${esc(e.hora)}` : ""}<br>` : ""}
          ${e.local ? `<b style="margin-top:10px">Local</b>${esc(e.local)}` : ""}
        </div>
        <div class="qrbox"><img class="qr" src="${qr}"><div class="cod">${esc(codigo)}</div></div>
      </div>`,
  },
  {
    id: "ceu",
    nome: "Céu Suave",
    categoria: "Batizado · Chá de bebé",
    render: ({ evento: e, convidado: c, qr, codigo }) => `
      <div class="cv t-ceu">
        <div class="nuvem n1"></div><div class="nuvem n2"></div>
        <div class="tipo">${esc(e.tipo)}</div>
        <div class="titulo">${esc(e.titulo)}</div>
        <div class="estrela">★ ★ ★</div>
        <div class="conv">Querido(a)</div>
        <div class="nome">${esc(c.nome)}</div>
        <div class="extra">${extras(c)}</div>
        <div class="msg">${esc(e.mensagem)}</div>
        <div class="info">${blocoInfo(e)}</div>
        <div class="qrbox"><img class="qr" src="${qr}"><div class="cod">${esc(codigo)}</div></div>
      </div>`,
  },
  {
    id: "imagem",
    nome: "O seu próprio modelo",
    categoria: "Arte enviada pelo cliente",
    /*
     * cfg = { src, w, h, nomeX, nomeY, nomeTam, nomeCor, nomeFonte, qrX, qrY, qrTam }
     * Posições em % da largura/altura da arte; tamanhos em % da largura.
     */
    render: ({ convidado: c, qr, codigo, imagem: cfg }) => {
      if (!cfg || !cfg.src) {
        return `<div class="cv t-imagem" style="height:${CONVITE_H}px"><div class="vazio"><b>Carregue a arte do convite</b><span>PNG ou JPG, sem nome nem QR</span></div></div>`;
      }
      const h = Math.round((CONVITE_W * cfg.h) / cfg.w);
      const fonte = (CONVITE_W * cfg.nomeTam) / 100;
      return `
      <div class="cv t-imagem" style="height:${h}px;background-image:url('${cfg.src}')">
        <div class="campo" style="left:${cfg.nomeX}%;top:${cfg.nomeY}%;font-size:${fonte}px;color:${esc(cfg.nomeCor)};font-family:${esc(cfg.nomeFonte)}">${esc(c.nome)}</div>
        <div class="qrbox" style="left:${cfg.qrX}%;top:${cfg.qrY}%;width:${cfg.qrTam}%">
          <img class="qr" src="${qr}"><div class="cod" style="color:${esc(cfg.nomeCor)};text-align:center">${esc(codigo)}</div>
        </div>
      </div>`;
    },
  },
];

const EXEMPLOS_EVENTO = {
  dourado: { titulo: "Ana & João", tipo: "Casamento", data: "2026-12-12", hora: "16:00", local: "Quinta das Oliveiras, Luanda", mensagem: "Juntamente com os nossos pais, celebramos o início da nossa vida a dois." },
  floral: { titulo: "Marta & Paulo", tipo: "Noivado", data: "2026-11-21", hora: "18:30", local: "Jardim Botânico, Talatona", mensagem: "Venha celebrar connosco este momento tão especial." },
  festa: { titulo: "Os 30 da Joana!", tipo: "Aniversário", data: "2026-11-07", hora: "21:00", local: "Rooftop Atlântico", mensagem: "Traga a sua melhor energia — a noite promete!" },
  minimal: { titulo: "Cimeira de Inovação 2026", tipo: "Conferência", data: "2026-10-30", hora: "09:00", local: "Centro de Convenções, Luanda", mensagem: "Um dia de painéis, networking e lançamentos com líderes do setor." },
  ceu: { titulo: "Batizado do Miguel", tipo: "Batizado", data: "2026-11-15", hora: "11:00", local: "Igreja da Sagrada Família", mensagem: "Com muita alegria, partilhamos este dia de bênção." },
  imagem: { titulo: "", tipo: "", data: "", hora: "", local: "", mensagem: "" },
};

function injetarCSSModelos() {
  if (document.getElementById("cv-template-css")) return;
  const st = document.createElement("style");
  st.id = "cv-template-css";
  st.textContent = TEMPLATE_CSS;
  document.head.appendChild(st);
}

function obterModelo(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

function renderConvite(templateId, dados) {
  return obterModelo(templateId).render(dados);
}
