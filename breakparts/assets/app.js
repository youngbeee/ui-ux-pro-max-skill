/* FRENOS PARTS ESTOC · catálogo, cotización y experiencia de la página */
(() => {
"use strict";
const C = window.BP_CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString("en-US");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const compact = s => norm(s).replace(/[^A-Z0-9]/g, "");
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const waLink = text => `https://wa.me/${C.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;
function openWA(text) {
  const a = document.createElement("a");
  a.href = waLink(text); a.target = "_blank"; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
}
let toastT;
function toast(msg) {
  const t = $("#toast"), top = $$("dialog[open]").pop();
  if (top && t.parentElement !== top) top.appendChild(t); else if (!top && t.parentElement !== document.body) document.body.appendChild(t); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400);
}
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch {} ta.remove();
  }
  if (btn) { const o = btn.textContent; btn.textContent = "Copiado"; btn.classList.add("done"); setTimeout(() => { btn.textContent = o; btn.classList.remove("done"); }, 1600); }
}

/* ---------- Nombres de familias ---------- */
const FAM = {
  BOMBA: { n: "Bombas", d: "Bombas de freno y de embrague para autos, camionetas y camiones.", img: "23810-65d00nbn" },
  BOMBIN: { n: "Bombines", d: "Bombines de rueda y de embrague auxiliar.", img: "46930-s7c-e01nbn" },
  PISTON: { n: "Pistones", d: "Pistones de cáliper y de bombín, por diámetro y altura.", img: "d025530" },
  KIT: { n: "Kits", d: "Kits de reparación de cáliper, tambor, bombas, servos y máster.", img: "hokc513" },
  MASTER: { n: "Máster", d: "Máster de freno y embrague, cubos, retenes y jebes.", img: "44610-35860azb" },
  PASTILLA: { n: "Pastillas", d: "Pastillas de freno delanteras y posteriores.", pic: "assets/piezas/pastillas.webp" },
  SERVO: { n: "Servos", d: "Servos y cilindros de freno y embrague.", ill: "servo" }
};
const famOrder = ["BOMBA", "BOMBIN", "PISTON", "KIT", "MASTER", "PASTILLA", "SERVO"];
const title = s => String(s).toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
const famName = f => FAM[f]?.n || title(f);
const subName = s => title(s).replace("Caliper", "Cáliper").replace("Piston", "Pistón").replace("Bombin", "Bombín");

/* Glifos para productos sin foto */
const GLYPH = {
  pad: '<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M8 22c18-14 86-14 104 0v30c-14 12-90 12-104 0Z"/><path d="M18 30c14-8 70-8 84 0v16c-12 7-72 7-84 0Z"/><circle cx="24" cy="18" r="3"/><circle cx="96" cy="18" r="3"/></svg>',
  servo: '<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="60" rx="46" ry="14"/><path d="M14 60V44c0-8 92-8 92 0v16"/><ellipse cx="60" cy="44" rx="46" ry="12"/><path d="M52 32V14h16v18M60 14V4"/></svg>',
  cyl: '<svg viewBox="0 0 100 100" aria-hidden="true"><ellipse cx="50" cy="24" rx="26" ry="9"/><path d="M24 24v52c0 12 52 12 52 0V24"/><ellipse cx="50" cy="24" rx="14" ry="4.5"/></svg>',
  disc: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40"/><circle cx="50" cy="50" r="15"/><circle cx="50" cy="50" r="5"/><path d="M71 16a40 40 0 0 1 20 22" stroke-width="6"/></svg>'
};
const glyphFor = f => f === "PASTILLA" ? GLYPH.pad : (f === "SERVO" || f === "MASTER") ? GLYPH.servo : f === "PISTON" ? GLYPH.cyl : GLYPH.disc;
const noImg = (f, label = "Foto no disponible") => `<div class="noimg">${glyphFor(f)}<span>${label}</span></div>`;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.6 1.1 1.4 1.8 1 .9 1.8 1.1 2 1.2.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4Z"/></svg>';

/* ---------- Imágenes (archivos o paquetes) ---------- */
// Fotos incluidas en el HTML de un solo archivo o subidas desde el panel (window.BP_IMGS) tienen prioridad sobre la carpeta img/
const EMB = () => window.BP_IMGS || (window.BP_IMGS = {});
const asset = p => (window.BP_ASSETS && window.BP_ASSETS[p]) || p;
const IMG = (() => {
  const m = C.imagenes;
  if (m.modo !== "paquetes") {
    return {
      thumb: s => Promise.resolve(EMB()[s] || m.miniatura + s + ".webp"),
      full: s => Promise.resolve(EMB()[s] || m.grande + s + ".webp"),
      sync: s => EMB()[s] || m.miniatura + s + ".webp"
    };
  }
  let idx; const packs = new Map();
  const getIdx = () => idx || (idx = fetch(m.paquetes + "index.json").then(r => r.json()));
  const get = async s => {
    const i = (await getIdx())[s]; if (i == null) throw new Error("sin imagen");
    const id = String(i).padStart(2, "0");
    if (!packs.has(id)) packs.set(id, fetch(m.paquetes + id + ".json").then(r => r.json()));
    return (await packs.get(id))[s];
  };
  return { thumb: get, full: get, sync: null };
})();
const lazyIO = "IntersectionObserver" in window ? new IntersectionObserver(es => {
  for (const e of es) if (e.isIntersecting) { lazyIO.unobserve(e.target); loadImg(e.target); }
}, { rootMargin: "400px 0px" }) : null;
function loadImg(img) {
  const s = img.dataset.slug; if (!s) return;
  const kind = img.dataset.kind === "full" ? "full" : "thumb";
  IMG[kind](s).then(src => { img.src = src; }).catch(() => {});
}
function imgTag(it, cls = "") {
  // En modo archivos usamos src directo + loading="lazy"; en modo paquetes cargamos al acercarse
  const alt = esc(it.desc);
  if (IMG.sync) return `<img class="${cls}" src="${IMG.sync(it.slug)}" alt="${alt}" loading="lazy" decoding="async" width="320" height="320" onload="this.classList.add('ok')">`;
  return `<img class="${cls}" data-slug="${it.slug}" alt="${alt}" decoding="async" width="320" height="320" onload="this.classList.add('ok')">`;
}
function hydrate(root) { if (!IMG.sync) $$("img[data-slug]:not([src])", root).forEach(i => lazyIO ? lazyIO.observe(i) : loadImg(i)); }
function bgImg(el, slug) { IMG.thumb(slug).then(src => { el.style.backgroundImage = `url("${src}")`; }).catch(() => {}); }

/* ---------- Medidas ---------- */
function measureVal(m) {
  const s = String(m).trim(); if (!s) return Infinity;
  const mm = s.match(/^(\d+(?:[.,]\d+)?)\s*mm/i); if (mm) return parseFloat(mm[1].replace(",", ".")) / 25.4;
  const f = s.match(/^(\d+)\s+(\d+)\/(\d+)/); if (f) return +f[1] + f[2] / f[3];
  const g = s.match(/^(\d+)\/(\d+)/); if (g) return g[1] / g[2];
  const n = s.match(/^(\d+(?:[.,]\d+)?)/); if (n) return parseFloat(n[1].replace(",", "."));
  return Infinity - 1;
}
const cmpMeasure = (a, b) => measureVal(a) - measureVal(b) || String(a).localeCompare(b, "es", { numeric: true });

/* ---------- Estado ---------- */
let ITEMS = [], BY_SLUG = new Map();
const st = { q: "", fam: "", sub: "", marca: "", medida: "", sis: "", foto: false, sort: "rel" };
let FILTERED = [], shown = 0;

function sysOf(it) {
  const s = norm(it.sub + " " + it.desc);
  const e = /EMBR/.test(s), f = /FRENO|CALIPER|RUEDA|TAMBOR|PASTILLA|\bPAD\b/.test(s);
  return e && !f ? "embrague" : f && !e ? "freno" : e && f ? (/EMBR/.test(norm(it.sub)) ? "embrague" : "freno") : "";
}

// Respaldo: data/productos.js define window.BP_PRODUCTOS. Se usa cuando fetch falla,
// por ejemplo al abrir index.html con doble clic (file://), donde el navegador bloquea la lectura del JSON.
function loadBackup() {
  if (window.BP_PRODUCTOS) return Promise.resolve(window.BP_PRODUCTOS);
  return new Promise((ok, bad) => {
    const sc = document.createElement("script");
    sc.src = C.datos.replace(/\.json(\?.*)?$/, ".js"); sc.charset = "utf-8";
    sc.onload = () => window.BP_PRODUCTOS ? ok(window.BP_PRODUCTOS) : bad(new Error("Respaldo vacío"));
    sc.onerror = () => bad(new Error("No se pudo cargar el catálogo"));
    document.head.appendChild(sc);
  });
}
let DOC = null;
async function loadData() {
  let d;
  if (window.BP_EMBED) d = window.BP_EMBED;   // HTML de un solo archivo: los productos vienen incluidos
  else try {
    if (location.protocol === "file:") throw new Error("file://");
    const r = await fetch(C.datos, { cache: "no-cache" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    d = JSON.parse((await r.text()).replace(/^﻿/, ""));
  } catch (e) { d = await loadBackup(); }
  ingestData(d);
}
function ingestData(d) {
  DOC = d;
  const F = d.campos;
  const ix = k => F.indexOf(k);
  const [iC, iD, iM, iMe, iF, iS, iSl, iI] = ["cod", "desc", "marca", "medida", "fam", "sub", "slug", "img"].map(ix);
  ITEMS = d.items.map((r, i) => {
    const it = { i, cod: r[iC] || "", desc: r[iD] || "", marca: r[iM] || "", medida: r[iMe] || "", fam: r[iF] || "", sub: r[iS] || "", slug: r[iSl], img: !!r[iI] };
    it.key = " " + norm([it.cod, it.desc, it.marca, it.medida, it.fam, famName(it.fam), it.sub].join(" ")) + " ";
    it.cc = compact(it.cod);
    it.sis = sysOf(it);
    return it;
  });
  BY_SLUG = new Map(ITEMS.map(it => [it.slug, it]));
}

/* ---------- Búsqueda ---------- */
const SYN = { BOMBAS: "BOMBA", BOMBINES: "BOMBIN", PISTONES: "PISTON", PASTILLAS: "PASTILLA", KITS: "KIT", SERVOS: "SERVO", CALIPERS: "CALIPER", CALIPERES: "CALIPER", FRENOS: "FRENO", EMBRAGUES: "EMBRAGUE", MASTERS: "MASTER", HILUX: "HI-LUX", HIACE: "HI-ACE", "HI LUX": "HI-LUX" };
function parseQuery(q) {
  return norm(q).replace(/\bHI\s+(LUX|ACE)\b/g, "HI-$1").split(/\s+/).filter(Boolean).map(t => SYN[t] || t);
}
function matchTok(it, t) {
  if (it.key.includes(t)) return true;
  if (t === "EMBRAGUE" && it.key.includes("EMBR")) return true;
  const c = compact(t);
  return c.length >= 3 && it.cc.includes(c);
}
function score(it, toks, qc) {
  let s = 0;
  if (qc && it.cc === qc) s += 1000;
  else if (qc && qc.length >= 3 && it.cc.startsWith(qc)) s += 400;
  else if (qc && qc.length >= 3 && it.cc.includes(qc)) s += 150;
  for (const t of toks) {
    if (it.key.includes(" " + t + " ")) s += 12;
    else if (it.key.includes(" " + t)) s += 6;
    if (norm(it.marca) === t) s += 8;
    if (norm(it.medida) === t) s += 10;
  }
  if (it.img) s += 1;
  return s;
}

function passes(it, skip, toks) {
  if (skip !== "fam" && st.fam && it.fam !== st.fam) return false;
  if (skip !== "sub" && st.sub && it.sub !== st.sub) return false;
  if (skip !== "marca" && st.marca && it.marca !== st.marca) return false;
  if (skip !== "medida" && st.medida && it.medida !== st.medida) return false;
  if (skip !== "sis" && st.sis && it.sis !== st.sis) return false;
  if (st.foto && !it.img) return false;
  for (const t of toks) if (!matchTok(it, t)) return false;
  return true;
}

function apply() {
  const toks = parseQuery(st.q), qc = compact(st.q);
  FILTERED = ITEMS.filter(it => passes(it, null, toks));
  const loc = (a, b) => a.localeCompare(b, "es", { numeric: true });
  if (st.sort === "name") FILTERED.sort((a, b) => loc(a.desc, b.desc) || a.i - b.i);
  else if (st.sort === "name-d") FILTERED.sort((a, b) => loc(b.desc, a.desc) || a.i - b.i);
  else if (st.sort === "cod") FILTERED.sort((a, b) => loc(a.cod, b.cod));
  else if (st.sort === "cod-d") FILTERED.sort((a, b) => loc(b.cod, a.cod));
  else if (toks.length) { FILTERED.forEach(it => it._s = score(it, toks, qc)); FILTERED.sort((a, b) => b._s - a._s || a.i - b.i); }
  else FILTERED.sort((a, b) => b.img - a.img || a.i - b.i);
  facets(toks);
  render(true);
  syncURL();
}

/* ---------- Facetas ---------- */
const FACET_LABEL = { fam: "Todas las familias", sub: "Todas las subfamilias", marca: "Todas las marcas", medida: "Todas las medidas" };
function counts(field, toks) {
  const m = new Map();
  for (const it of ITEMS) if (passes(it, field, toks)) { const v = it[field]; if (v) m.set(v, (m.get(v) || 0) + 1); }
  return m;
}
function facets(toks) {
  for (const f of ["fam", "sub", "marca", "medida"]) {
    const m = counts(f, toks);
    if (st[f] && !m.has(st[f])) m.set(st[f], 0);
    let vals = [...m.keys()];
    if (f === "medida") vals.sort(cmpMeasure);
    else if (f === "fam") vals.sort((a, b) => (famOrder.indexOf(a) + 1 || 99) - (famOrder.indexOf(b) + 1 || 99) || a.localeCompare(b));
    else vals.sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    const sel = $(`#f-${f}`);
    const nm = f === "fam" ? famName : f === "sub" ? subName : v => v;
    sel.innerHTML = `<option value="">${FACET_LABEL[f]}</option>` + vals.map(v => `<option value="${esc(v)}"${v === st[f] ? " selected" : ""}>${esc(nm(v))} (${fmt(m.get(v))})</option>`).join("");
  }
  // chips de familia
  const mf = counts("fam", toks);
  const total = [...mf.values()].reduce((a, b) => a + b, 0);
  const fams = [...new Set(ITEMS.map(i => i.fam))].sort((a, b) => (famOrder.indexOf(a) + 1 || 99) - (famOrder.indexOf(b) + 1 || 99));
  $("#fam-chips").innerHTML = `<button class="chip" role="tab" data-fam="" aria-selected="${!st.fam}">Todos <small>${fmt(total)}</small></button>` +
    fams.map(f => `<button class="chip" role="tab" data-fam="${esc(f)}" aria-selected="${st.fam === f}">${esc(famName(f))} <small>${fmt(mf.get(f) || 0)}</small></button>`).join("");
  $$("#f-sis button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.v === st.sis)));
  $("#f-sort").value = st.sort; $("#f-foto").checked = st.foto;
  // filtros activos
  const act = [];
  if (st.sis) act.push(["sis", "Sistema", st.sis === "freno" ? "Frenos" : "Embragues"]);
  if (st.fam) act.push(["fam", "Familia", famName(st.fam)]);
  if (st.sub) act.push(["sub", "Subfamilia", subName(st.sub)]);
  if (st.marca) act.push(["marca", "Marca", st.marca]);
  if (st.medida) act.push(["medida", "Medida", st.medida]);
  if (st.foto) act.push(["foto", "", "Con foto"]);
  $("#active").innerHTML = act.map(([k, l, v]) => `<span class="pill">${l ? `<b>${l}:</b>` : ""} ${esc(v)}<button type="button" data-rm="${k}" aria-label="Quitar filtro ${esc(v)}">×</button></span>`).join("");
  const nF = act.length;
  $("#filters-n").hidden = !nF; $("#filters-n").textContent = nF;
}

/* ---------- Render de tarjetas ---------- */
function card(it, k) {
  const media = it.img ? imgTag(it) : noImg(it.fam);
  const meta = [it.marca ? `<span>${esc(it.marca)}</span>` : "", it.medida ? `<span class="m">${esc(it.medida)}</span>` : ""].join("");
  return `<article class="card" style="--i:${k % PAGE()}" data-slug="${it.slug}">
    <button class="card__open" type="button" data-open="${it.slug}" aria-label="Ver ficha: ${esc(it.desc)}">
      <div class="card__media">${media}<span class="card__tag">${esc(famName(it.fam))}</span></div>
      <div class="card__body">
        <span class="card__cod mono">${esc(it.cod)}</span>
        <h3 class="card__desc">${esc(it.desc)}</h3>
        <div class="card__meta">${meta}</div>
        <span class="card__price">Precio: <b>Consultar precio</b></span>
      </div>
    </button>
    <div class="card__foot">
      <button class="card__add${inCart(it.slug) ? " added" : ""}" type="button" data-add="${it.slug}" aria-label="Agregar a la cotización: ${esc(it.desc)}">${inCart(it.slug) ? `✓ ${cartQty(it.slug)} en lista` : "+ Agregar"}</button>
      <a class="card__wa" href="${waLink(productMsg(it))}" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp: ${esc(it.desc)}">${WA_SVG}</a>
    </div>
  </article>`;
}
const PAGE = () => C.porPagina || 24;
function render(reset) {
  const grid = $("#grid");
  if (reset) { shown = 0; grid.innerHTML = ""; }
  const next = FILTERED.slice(shown, shown + PAGE());
  const frag = document.createElement("template");
  frag.innerHTML = next.map((it, k) => card(it, k)).join("");
  hydrate(frag.content);
  grid.appendChild(frag.content);
  if (!IMG.sync) hydrate(grid);
  shown += next.length;
  grid.setAttribute("aria-busy", "false");
  const n = FILTERED.length;
  $("#res-n").innerHTML = n ? `<b>${fmt(n)}</b> ${n === 1 ? "producto" : "productos"}${st.q ? ` para «${esc(st.q)}»` : ""}` : "Sin resultados";
  $("#apply-n").textContent = fmt(n);
  $("#empty").hidden = n > 0;
  $("#empty-wa").href = waLink(st.q ? `Hola, busco este repuesto en FRENOS PARTS ESTOC: ${st.q}. ¿Lo tienen disponible?` : "");
  $("#load-more").hidden = shown >= n;
  $("#load-more").textContent = `Mostrar ${fmt(Math.min(PAGE(), n - shown))} productos más`;
  $("#more-info").textContent = n ? `Mostrando ${fmt(shown)} de ${fmt(n)}` : "";
}

/* ---------- URL ---------- */
const URLMAP = { q: "q", fam: "familia", sub: "subfamilia", marca: "marca", medida: "medida", sis: "sistema", sort: "orden" };
let urlT;
function syncURL() {
  if (!C.sincronizarURL) return;
  clearTimeout(urlT);
  urlT = setTimeout(() => {
    try {
      const p = new URLSearchParams(location.search);
      for (const [k, u] of Object.entries(URLMAP)) {
        const v = k === "fam" && st.fam ? st.fam.toLowerCase() : st[k];
        v && !(k === "sort" && v === "rel") ? p.set(u, v) : p.delete(u);
      }
      st.foto ? p.set("foto", "1") : p.delete("foto");
      const s = p.toString();
      history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
    } catch {}
  }, 250);
}
function readURL() {
  if (!C.sincronizarURL) return null;
  try {
    const p = new URLSearchParams(location.search);
    for (const [k, u] of Object.entries(URLMAP)) if (p.get(u)) st[k] = k === "fam" ? p.get(u).toUpperCase() : p.get(u);
    st.foto = p.get("foto") === "1";
    return p.get("producto");
  } catch { return null; }
}

/* ---------- Ficha ---------- */
let current = null;
// Los mensajes de WhatsApp llevan solo el código del producto (sin descripción, marca ni medida)
function productMsg(it) {
  return `Hola, quisiera consultar el precio y la disponibilidad de este producto de FRENOS PARTS ESTOC:\n• Código: *${it.cod}*`;
}
// Destacados del estante: [producto, nombre corto, vehículo y medida]. Cada uno tiene su recorte en assets/estante/
const SHELF = [   // ocho tipos de repuesto distintos, sin repetir
  ["44610-35860azb", "Máster de freno", "Toyota Hilux · 9\""],
  ["mc-894212cad", "Bomba de freno", "Mitsubishi · 1 1/4"],
  ["30610-01j60nbn", "Bomba de embrague", "Nissan Patrol · 5/8"],
  ["58320-4b001nbn", "Bombín de rueda", "Hyundai H100 · 11/16"],
  ["31470-28040nbn", "Bombín de embrague", "Toyota Hiace · 13/16"],
  ["ho207", "Pistón de cáliper", "Nissan Stanza"],
  ["hokc905", "Kit de cáliper", "Kia Sportage"],
  ["hokt603r", "Kit de tambor", "Toyota Corolla"]
];
const CUTS = new Set(SHELF.map(s => s[0]));
const noMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let ppFrom = null; // el elemento del que salió la pieza: se oculta mientras la página está abierta
const ppRelease = () => { if (ppFrom) { ppFrom.style.visibility = ""; ppFrom = null; } };
// de dónde a dónde viaja la pieza: se alinean las bases, como si se la moviera de una repisa a otra
function flight(from, media) {
  const s = from.getBoundingClientRect(), t = media.getBoundingClientRect();
  if (!s.width || !t.height || s.bottom < 0 || s.top > innerHeight) return null;
  return `translate(${(s.left + s.width / 2 - (t.left + t.width / 2)).toFixed(1)}px,${(s.bottom - t.bottom).toFixed(1)}px) scale(${(s.height / t.height).toFixed(4)})`;
}
function openProduct(slug, push = true, from = null) {
  const it = BY_SLUG.get(slug); if (!it) return;
  current = it;
  const media = $("#p-media");
  if (CUTS.has(slug)) media.innerHTML = `<img class="pp-cut" src="${asset(`assets/estante/${slug}.webp`)}" alt="${esc(it.desc)}" draggable="false">`;
  else if (it.img) {
    media.innerHTML = `<img class="pp-photo" data-slug="${it.slug}" alt="${esc(it.desc)}" draggable="false">`;
    const im = $("img", media);
    if (from && from.tagName === "IMG" && from.currentSrc) im.src = from.currentSrc; // la miniatura ya cargada, mientras llega la foto grande
    IMG.full(it.slug).then(src => { const big = new Image(); big.onload = () => { if (current === it && im.isConnected) im.src = src; }; big.onerror = () => { if (!im.getAttribute("src")) im.src = src; }; big.src = src; }).catch(() => {});
  } else media.innerHTML = noImg(it.fam, "Imagen no disponible");
  $("#p-cat").textContent = `${famName(it.fam)} · ${subName(it.sub)}`;
  $("#p-desc").textContent = it.desc;
  $("#p-tag").textContent = [it.marca, it.medida].filter(Boolean).join(" · ");
  $("#p-tag").hidden = !it.marca && !it.medida;
  $("#p-cod").textContent = it.cod;
  $("#p-specs").innerHTML = [["Marca", it.marca], ["Medida", it.medida], ["Familia", famName(it.fam)], ["Subfamilia", subName(it.sub)]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v || "—")}</dd></div>`).join("");
  $("#p-qty").value = cartQty(it.slug) || 1;
  $("#p-add").textContent = inCart(it.slug) ? "Actualizar cantidad" : "Agregar a cotización";
  $("#p-wa").href = waLink(productMsg(it));
  // relacionados: misma familia/subfamilia y misma medida o marca
  const rel = ITEMS.filter(o => o !== it && o.fam === it.fam && o.sub === it.sub && ((it.medida && o.medida === it.medida) || (!it.medida && o.marca === it.marca)))
    .sort((a, b) => b.img - a.img).slice(0, 8);
  $("#p-rel-wrap").hidden = !rel.length;
  $("#p-rel").innerHTML = rel.map(o => `<button class="rel__item" type="button" data-open="${o.slug}"><div class="rel__img">${o.img ? imgTag(o) : noImg(o.fam, "")}</div><span>${esc(o.desc)}</span></button>`).join("");
  hydrate($("#p-rel"));
  const d = $("#product"), wasOpen = d.open;
  if (!wasOpen) { d.showModal ? d.showModal() : d.setAttribute("open", ""); }
  d.scrollTop = 0;
  if (wasOpen) ppRelease(); // se abrió otro producto desde «relacionados»: ya no vuelve al lugar del primero
  else if (!noMotion() && from && from.isConnected) {
    const fl = flight(from, media);
    if (fl) {
      ppFrom = from; from.style.visibility = "hidden";
      media.animate([{ transform: fl }, { transform: "none" }], { duration: 560, easing: "cubic-bezier(.22,1,.36,1)" });
      media.firstElementChild?.animate([{ transform: "rotateY(-34deg)" }, { transform: "rotateY(0deg)" }], { duration: 950, easing: "cubic-bezier(.25,.1,.25,1)" });
    }
  }
  if (push && C.sincronizarURL) { try { const p = new URLSearchParams(location.search); p.set("producto", slug); history.pushState({ p: slug }, "", "?" + p); } catch {} }
  document.title = `${it.desc} | FRENOS PARTS ESTOC`;
}
function closeProduct(fromPop) {
  const d = $("#product"); if (!d.open || d.classList.contains("closing")) return;
  const end = () => { d.classList.remove("closing"); ppRelease(); d.close ? d.close() : d.removeAttribute("open"); };
  const media = $("#p-media"), fl = !noMotion() && ppFrom && ppFrom.isConnected ? flight(ppFrom, media) : null;
  if (!fl) { end(); return; }
  // la pieza vuelve al mismo lugar del que salió
  d.classList.add("closing");
  const an = media.animate([{ transform: "none" }, { transform: fl }], { duration: 430, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" });
  an.onfinish = an.oncancel = () => { an.onfinish = an.oncancel = null; an.cancel(); end(); };
}
$("#product").addEventListener("cancel", e => { e.preventDefault(); closeProduct(); });
$("#product").addEventListener("close", () => {
  ppRelease();
  document.title = BASE_TITLE;
  if (C.sincronizarURL) { try { const p = new URLSearchParams(location.search); if (p.has("producto")) { p.delete("producto"); history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : "")); } } catch {} }
});
$("#product").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeProduct(); });
// Arrastrar para girar la pieza: sigue al dedo y al soltar vuelve de frente
(() => {
  const m = $("#p-media"); let g = null;
  m.addEventListener("pointerdown", e => {
    const el = m.firstElementChild; if (!el || noMotion()) return;
    try { m.setPointerCapture(e.pointerId); } catch {}
    el.getAnimations().forEach(x => x.cancel());
    g = { x: e.clientX, el, r: 0 };
  });
  m.addEventListener("pointermove", e => {
    if (!g) return;
    g.r = Math.max(-72, Math.min(72, (e.clientX - g.x) / 2.2));
    g.el.style.transform = `rotateY(${g.r.toFixed(1)}deg)`;
  });
  const up = () => {
    if (!g) return; const { el, r } = g; g = null; el.style.transform = "";
    el.animate([{ transform: `rotateY(${r}deg)` }, { transform: `rotateY(${(-r * 0.16).toFixed(1)}deg)`, offset: 0.55 }, { transform: "rotateY(0deg)" }], { duration: 720, easing: "cubic-bezier(.22,1,.36,1)" });
  };
  m.addEventListener("pointerup", up); m.addEventListener("pointercancel", up);
})();
$("#p-copy").addEventListener("click", e => current && copyText(current.cod, e.currentTarget));
$$(".qty [data-q]", $("#product")).forEach(b => b.addEventListener("click", () => {
  const i = $("#p-qty"); i.value = Math.max(1, Math.min(999, (+i.value || 1) + +b.dataset.q));
}));
$("#p-add").addEventListener("click", () => {
  if (!current) return;
  setQty(current.slug, Math.max(1, +$("#p-qty").value || 1));
  $("#p-add").textContent = "Actualizar cantidad";
  toast("Producto agregado a tu cotización");
});
const BASE_TITLE = document.title;
window.addEventListener("popstate", () => {
  try { const s = new URLSearchParams(location.search).get("producto"); s ? openProduct(s, false) : closeProduct(true); } catch {}
});

/* ---------- Cotización ---------- */
// Cada línea: { k: clave, slug?: producto del catálogo, text?: pedido libre, qty }
let CART = store.get("bp-cart-v2", null) || store.get("bp-cart-v1", []).map(r => ({ k: r.slug, slug: r.slug, qty: r.qty }));
CART = CART.filter(r => r && r.k && r.qty > 0);
let QREF = store.get("bp-quote-ref", "");
const saveCart = () => { store.set("bp-cart-v2", CART); store.set("bp-quote-ref", QREF); };
const inCart = s => CART.some(r => r.k === s);
const cartQty = s => (CART.find(r => r.k === s) || {}).qty || 0;
const newRef = () => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `COT-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`; };
function setQty(key, q, silent) {
  const r = CART.find(r => r.k === key);
  if (q <= 0) CART = CART.filter(x => x.k !== key);
  else if (r) r.qty = Math.min(999, q);
  else CART.push({ k: key, slug: key, qty: Math.min(999, q) });
  if (!CART.length) QREF = "";
  else if (!QREF) QREF = newRef();
  saveCart();
  updateCartUI(!silent);
}
function addCustom(text, qty = 1) {
  text = text.trim().slice(0, 140); if (!text) return;
  const k = "x:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  CART.push({ k, text, qty }); if (!QREF) QREF = newRef(); saveCart(); updateCartUI(true);
}
function updateCartUI(bump) {
  const n = CART.length;
  for (const id of ["#quote-count", "#fab-n", "#mbar-n", "#steps-n"]) { const el = $(id); if (el) el.textContent = n; }
  $("#fab-quote").hidden = !n;
  document.documentElement.classList.toggle("has-cart", n > 0);
  if (bump) for (const el of [$("#open-quote"), $("#fab-quote"), $("#mbar-quote")]) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  $$(".card__add").forEach(b => { const q = cartQty(b.dataset.add); b.classList.toggle("added", q > 0); b.textContent = q ? `✓ ${q} en lista` : "+ Agregar"; });
  if (!$("#quote").hidden) renderQuote();
}
const lineItem = r => r.slug ? BY_SLUG.get(r.slug) : null;
function renderQuote() {
  const rows = CART.filter(r => r.text || lineItem(r));
  $("#qlist").innerHTML = rows.map(r => {
    const it = lineItem(r);
    const media = it ? (it.img ? imgTag(it) : noImg(it.fam, "")) : `<div class="noimg noimg--txt">${GLYPH.disc}</div>`;
    const title = it ? `<span class="mono">${esc(it.cod)}</span><span>${esc(it.desc)}</span><small>${esc([it.marca, it.medida].filter(Boolean).join(" · "))}</small>`
                     : `<span class="mono">Sin código</span><span>${esc(r.text)}</span><small>Lo buscamos por ti</small>`;
    return `<li class="qitem">
      <div class="qitem__img">${media}</div>
      <div class="qitem__t">${title}</div>
      <div class="qitem__side"><div class="qty qty--sm"><button type="button" data-qd="${r.k}" data-d="-1" aria-label="Menos">−</button><input type="number" min="1" max="999" value="${r.qty}" data-qi="${r.k}" inputmode="numeric" aria-label="Cantidad"><button type="button" data-qd="${r.k}" data-d="1" aria-label="Más">+</button></div><button class="qitem__rm" type="button" data-rmq="${r.k}">Quitar</button></div>
    </li>`;
  }).join("");
  hydrate($("#qlist"));
  $("#qempty").hidden = rows.length > 0;
  const units = rows.reduce((a, r) => a + r.qty, 0);
  $("#qtot").textContent = rows.length ? `${rows.length} ${rows.length === 1 ? "producto" : "productos"} · ${units} ${units === 1 ? "unidad" : "unidades"} · Precios a consultar` : "Agrega al menos un producto para continuar.";
  $("#q-ref").textContent = rows.length && QREF ? QREF : "";
  if (!rows.length && qstep > 1) goStep(1);
  $("#q-next").disabled = !rows.length;
  $(".drawer__alt").hidden = !rows.length;
  if (qstep === 3) $("#q-prev").textContent = quoteMsg();
}
const radio = n => ($(`input[name="${n}"]:checked`) || {}).value || "";
function custData() {
  return { n: $("#q-name").value.trim(), t: radio("q-tipo"), v: $("#q-veh").value.trim(), c: $("#q-city").value.trim(), e: radio("q-ent"), m: $("#q-note").value.trim() };
}
function quoteMsg() {
  const d = custData();
  const lines = CART.map(r => [r, lineItem(r)]).filter(([r, it]) => it || r.text).map(([r, it], k) => it
    ? `${k + 1}. *${it.cod}* x ${r.qty}`
    : `${k + 1}. (Sin código) ${r.text} x ${r.qty}`);
  const units = CART.reduce((a, r) => a + r.qty, 0);
  const datos = [["Nombre", d.n], ["Cliente", d.t], ["Vehículo", d.v], ["Ciudad", d.c], ["Entrega", d.e], ["Consulta", d.m]].filter(x => x[1]).map(([k, v]) => `${k}: ${v}`);
  return `${C.mensajeCotizacion}\n\n*Cotización ${QREF || newRef()}*\n\n${lines.join("\n")}\n\nTotal: ${lines.length} ${lines.length === 1 ? "producto" : "productos"} · ${units} ${units === 1 ? "unidad" : "unidades"}` + (datos.length ? `\n\n*Mis datos*\n${datos.join("\n")}` : "");
}
let qstep = 1;
function goStep(n) {
  qstep = n;
  $$("#quote [data-step]").forEach(b => b.hidden = +b.dataset.step !== n);
  $$("#qsteps li").forEach(li => { const s = +li.dataset.s; li.classList.toggle("done", s < n); s === n ? li.setAttribute("aria-current", "step") : li.removeAttribute("aria-current"); });
  $("#q-back").hidden = n === 1;
  $("#q-next").hidden = n === 3; $("#q-send").hidden = n !== 3;
  $("#q-next").textContent = n === 1 ? "Continuar" : "Revisar mensaje";
  $("#q-done").hidden = true;
  if (n === 3) $("#q-prev").textContent = quoteMsg();
  const body = $(`#quote [data-step="${n}"]`); body.scrollTop = 0;
}
let lastFocus;
function openQuote() {
  lastFocus = document.activeElement;
  goStep(1); renderQuote(); $("#quote").hidden = false; document.body.style.overflow = "hidden";
  setTimeout(() => $("#quote .drawer__head .x").focus(), 50);
}
function closeQuote() { $("#quote").hidden = true; document.body.style.overflow = ""; lastFocus?.focus?.(); }
["#open-quote", "#fab-quote", "#steps-open", "#mbar-quote"].forEach(s => $(s)?.addEventListener("click", openQuote));
$("#quote").addEventListener("click", e => {
  if (e.target.closest("[data-close]")) { closeQuote(); return; }
  const d = e.target.closest("[data-qd]"); if (d) { setQty(d.dataset.qd, cartQty(d.dataset.qd) + +d.dataset.d, true); return; }
  const rm = e.target.closest("[data-rmq]"); if (rm) { setQty(rm.dataset.rmq, 0, true); }
});
$("#quote").addEventListener("change", e => { const i = e.target.closest("[data-qi]"); if (i) setQty(i.dataset.qi, Math.max(1, +i.value || 1), true); });
$("#qcustom").addEventListener("submit", e => { e.preventDefault(); const i = $("#qc-text"); if (!i.value.trim()) { i.focus(); return; } addCustom(i.value); i.value = ""; toast("Agregado. Lo buscaremos por ti."); });
$("#q-back").addEventListener("click", () => goStep(qstep - 1));
$("#q-next").addEventListener("click", () => {
  if (qstep === 1) { if (CART.length) goStep(2); return; }
  if (qstep === 2) {
    const err = $("#q-err");
    if (!$("#q-name").value.trim()) { err.hidden = false; err.textContent = "Escribe tu nombre o el de tu empresa para preparar la cotización."; $("#q-name").focus(); return; }
    err.hidden = true; goStep(3);
  }
});
$("#q-send").addEventListener("click", () => {
  if (!CART.length) return;
  openWA(quoteMsg());
  $("#q-done").hidden = false;
  toast(`Cotización ${QREF} lista para enviar`);
});
$("#q-copy").addEventListener("click", e => copyText(quoteMsg(), e.currentTarget));
let clearArm;
$("#q-clear").addEventListener("click", e => {
  const b = e.currentTarget;
  if (!clearArm) { clearArm = setTimeout(() => { clearArm = null; b.textContent = "Vaciar lista"; }, 2500); b.textContent = "¿Seguro? Pulsa otra vez"; return; }
  clearTimeout(clearArm); clearArm = null; b.textContent = "Vaciar lista";
  CART = []; QREF = ""; saveCart(); goStep(1); updateCartUI(); renderQuote();
});
// Datos del cliente: se recuerdan en este navegador
(() => {
  const d = store.get("bp-cliente", {});
  $("#q-name").value = d.n || ""; $("#q-veh").value = d.v || ""; $("#q-city").value = d.c || ""; $("#q-note").value = d.m || "";
  if (d.t) { const r = $(`input[name="q-tipo"][value="${CSS.escape(d.t)}"]`); if (r) r.checked = true; }
  if (d.e) { const r = $(`input[name="q-ent"][value="${CSS.escape(d.e)}"]`); if (r) r.checked = true; }
})();
$("#qform").addEventListener("input", () => store.set("bp-cliente", custData()));
$("#qform").addEventListener("change", () => store.set("bp-cliente", custData()));

// Pegar lista de códigos
function parsePaste(txt) {
  const found = [], missing = [];
  const byCode = new Map(ITEMS.map(it => [it.cc, it]));
  for (let line of txt.split(/\n|;/)) {
    line = line.trim(); if (!line) continue;
    let qty = 1;
    const m = line.match(/(?:^|\s)(?:x\s*|\*\s*|cant\.?:?\s*)?(\d{1,3})\s*(?:u|und|unid(?:ades)?|pzas?)?\.?$/i);
    let body = line;
    if (m && line.length > m[0].length) { qty = +m[1] || 1; body = line.slice(0, line.length - m[0].length).trim(); }
    const toks = body.split(/\s+/);
    const hit = byCode.get(compact(body)) || (toks.length === 1 ? null : byCode.get(compact(toks[0])));
    if (hit) found.push([hit, qty]); else missing.push([line === body ? body : body, qty]);
  }
  return { found, missing };
}
$("#paste-form").addEventListener("submit", e => {
  e.preventDefault();
  const ta = $("#paste-in"), res = $("#paste-res");
  if (!ta.value.trim()) { res.textContent = "Pega al menos un código o una descripción."; ta.focus(); return; }
  if (!ITEMS.length) { res.textContent = "El catálogo aún está cargando. Intenta en un momento."; return; }
  const { found, missing } = parsePaste(ta.value);
  for (const [it, q] of found) setQty(it.slug, cartQty(it.slug) + q, true);
  for (const [t, q] of missing) addCustom(t, q);
  updateCartUI(true);
  res.innerHTML = `<b>${found.length}</b> encontrados en el catálogo` + (missing.length ? ` · <b>${missing.length}</b> sin código, los buscamos por ti` : "") + ". <button type=\"button\" class=\"link\" data-openquote>Ver lista</button>";
  ta.value = "";
});
$("#paste-res").addEventListener("click", e => { if (e.target.closest("[data-openquote]")) openQuote(); });

/* ---------- Eventos del catálogo ---------- */
let qT;
$("#q").addEventListener("input", e => {
  $("#q-clear").hidden = !e.target.value;
  clearTimeout(qT); qT = setTimeout(() => { st.q = e.target.value.trim(); apply(); }, 140);
});
$("#q").addEventListener("keydown", e => { if (e.key === "Enter") { e.target.blur(); } });
$("#q-clear").addEventListener("click", () => { $("#q").value = ""; st.q = ""; $("#q-clear").hidden = true; apply(); $("#q").focus(); });
$$("#filters select[data-f]").forEach(s => s.addEventListener("change", () => { st[s.dataset.f] = s.value; if (s.dataset.f === "fam") st.sub = ""; apply(); }));
$("#f-sort").addEventListener("change", e => { st.sort = e.target.value; apply(); });
$("#f-foto").addEventListener("change", e => { st.foto = e.target.checked; apply(); });
$("#f-sis").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { st.sis = b.dataset.v; apply(); } });
$("#fam-chips").addEventListener("click", e => { const b = e.target.closest("[data-fam]"); if (b) { st.fam = b.dataset.fam; st.sub = ""; apply(); } });
$("#active").addEventListener("click", e => { const b = e.target.closest("[data-rm]"); if (!b) return; const k = b.dataset.rm; st[k] = k === "foto" ? false : ""; apply(); });
function resetAll() { Object.assign(st, { q: "", fam: "", sub: "", marca: "", medida: "", sis: "", foto: false, sort: "rel" }); $("#q").value = ""; $("#q-clear").hidden = true; apply(); }
$("#f-reset").addEventListener("click", resetAll);
$("#empty-reset").addEventListener("click", resetAll);
$("#load-more").addEventListener("click", () => { const first = shown; render(false); $$(".card", $("#grid"))[first]?.querySelector(".card__open")?.focus({ preventScroll: true }); });
const filt = $("#filters");
function openFilters() { filt.classList.add("is-open"); $("#open-filters").setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
function closeFilters() { filt.classList.remove("is-open"); $("#open-filters").setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
$("#open-filters").addEventListener("click", openFilters);
$("#close-filters").addEventListener("click", closeFilters);
$("#apply-filters").addEventListener("click", () => { closeFilters(); goCatalog(); });

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if (add) { e.preventDefault(); const s = add.dataset.add; if (inCart(s)) { openQuote(); } else { setQty(s, 1); toast("Producto agregado a tu cotización"); } return; }
  const op = e.target.closest("[data-open]");
  if (op) { openProduct(op.dataset.open, true, op.querySelector("img")); return; }
  const cp = e.target.closest("[data-copy]");
  if (cp) copyText(cp.dataset.copy, cp);
  const g = e.target.closest("[data-goto-fam]");
  if (g) { e.preventDefault(); Object.assign(st, { fam: g.dataset.gotoFam, sub: "", q: st.q }); apply(); goCatalog(); }
  const gm = e.target.closest("[data-goto-med]");
  if (gm) { e.preventDefault(); Object.assign(st, { medida: gm.dataset.gotoMed }); apply(); goCatalog(); }
});
function goCatalog() { const t = $("#catalogo"); t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!$("#quote").hidden) closeQuote(); else if (filt.classList.contains("is-open")) closeFilters(); }
  if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); goCatalog(); $("#q").focus({ preventScroll: true }); }
});

/* ---------- Secciones dinámicas ---------- */
function buildStats() {
  const v = { items: ITEMS.length, marcas: new Set(ITEMS.map(i => i.marca).filter(Boolean)).size, fotos: ITEMS.filter(i => i.img).length };
  $$("[data-stat]").forEach(el => el.textContent = fmt(v[el.dataset.stat]));
}
function buildBento() {
  const cnt = new Map(); ITEMS.forEach(i => cnt.set(i.fam, (cnt.get(i.fam) || 0) + 1));
  const fams = [...cnt.keys()].sort((a, b) => (famOrder.indexOf(a) + 1 || 99) - (famOrder.indexOf(b) + 1 || 99));
  const tile = (fam, visual, name, desc, go) => `<a class="tile rv" href="#catalogo" data-goto-fam="${esc(fam)}">
      <span class="tile__img">${visual}</span>
      <span class="tile__t"><b>${esc(name)}</b><span>${esc(desc)}</span><em>${esc(go)} <i aria-hidden="true">→</i></em></span>
    </a>`;
  const html = fams.map(f => {
    const meta = FAM[f] || { n: title(f), d: "" };
    let slug = meta.img && BY_SLUG.get(meta.img)?.img ? meta.img : null;
    if (!slug && !meta.pic && !meta.ill) slug = ITEMS.find(i => i.fam === f && i.img)?.slug;
    const visual = slug ? `<span class="tile__ph" data-bg="${slug}"></span>`
      : meta.pic ? `<img src="${esc(asset(meta.pic))}" alt="" loading="lazy" decoding="async" width="160" height="160">`
      : glyphFor(f).replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="1.6"');
    return tile(f, visual, meta.n, `${fmt(cnt.get(f))} productos`, "Ver " + meta.n.toLowerCase());
  }).join("");
  const all = tile("", GLYPH.disc.replace("<svg", '<svg fill="none" stroke="currentColor" stroke-width="2.4"'), "Todo el catálogo", `${fmt(ITEMS.length)} productos`, "Ver todo");
  $("#bento").innerHTML = html + all;
  $$("[data-bg]").forEach(el => bgImg(el, el.dataset.bg));
  $$("#foot-cats [data-goto-fam]").forEach(a => a.remove());
  $("#foot-cats").insertAdjacentHTML("beforeend", fams.map(f => `<a href="#catalogo" data-goto-fam="${esc(f)}">${esc(famName(f))}</a>`).join(""));
}
function buildFeatured() {
  const el = $("#featured"); if (!el) return;
  const picks = SHELF.map(([s, n, v]) => [BY_SLUG.get(s), n, v]).filter(x => x[0]);
  const per = matchMedia("(max-width: 639px)").matches ? 2 : 4; // en el celular, dos piezas por repisa
  let html = "";
  for (let k = 0; k < picks.length; k += per) {
    const row = picks.slice(k, k + per);
    html += `<div class="shelf" style="--n:${per}">
      <div class="shelf__row">${row.map(([it, n, v]) => `<button class="shelf__item" type="button" data-open="${it.slug}" aria-label="${esc(n)}, ${esc(v)}"><img src="${asset(`assets/estante/${it.slug}.webp`)}" alt="" loading="lazy" decoding="async" draggable="false"></button>`).join("")}</div>
      <div class="shelf__board" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="shelf__labels">${row.map(([, n, v]) => `<div><b>${esc(n)}</b><span>${esc(v)}</span></div>`).join("")}</div>
    </div>`;
  }
  el.innerHTML = html;
  el.closest("section").hidden = !picks.length;
}
matchMedia("(max-width: 639px)").addEventListener?.("change", () => { if (ITEMS.length) buildFeatured(); });
function buildGauge() {
  const m = new Map(); ITEMS.forEach(i => i.medida && m.set(i.medida, (m.get(i.medida) || 0) + 1));
  const top = [...m.entries()].filter(([v]) => /^\d+(\s\d+\/\d+)?(\/\d+)?"?$/.test(v)).sort((a, b) => b[1] - a[1]).slice(0, 14).sort((a, b) => cmpMeasure(a[0], b[0]));
  $("#gauge").innerHTML = top.map(([v, n]) => `<button type="button" data-goto-med="${esc(v)}" aria-label="Medida ${esc(v)}, ${n} productos">${esc(v)}<small>${fmt(n)}</small></button>`).join("");
}
function buildContact() {
  const addr = (C.direccion || "").trim();
  $("#addr").innerHTML = addr ? esc(addr) + (C.mapaEnlace ? ` <a class="link" href="${esc(C.mapaEnlace)}" target="_blank" rel="noopener">Cómo llegar</a>` : "") : `<span class="pending">Dirección por confirmar. Escríbenos y te indicamos cómo llegar.</span>`;
  $("#foot-addr").textContent = addr || "Ubicación: consúltanos por WhatsApp";
  const h = Array.isArray(C.horarios) ? C.horarios : [];
  $("#hours").innerHTML = h.length ? h.map(([d, t]) => `<li><span>${esc(d)}</span><span>${esc(t)}</span></li>`).join("") : `<li class="pending">Consulta nuestro horario por WhatsApp.</li>`;
  const map = $("#map");
  if (C.mapaEmbed && /^https:\/\/www\.google\.com\/maps(\/embed|\?)/.test(C.mapaEmbed)) {
    map.innerHTML = `<iframe src="${esc(C.mapaEmbed)}" title="Ubicación de FRENOS PARTS ESTOC en Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  } else {
    map.innerHTML = `<div class="map__ph"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg><b>Mapa de ubicación</b><p>${addr ? esc(addr) : "Pronto publicaremos nuestra ubicación en el mapa."}</p></div>`;
  }
  $("#year").textContent = new Date().getFullYear();
}
$("#contact-form").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("#c-name").value.trim(), v = $("#c-veh").value.trim(), m = $("#c-msg").value.trim(), err = $("#c-err");
  if (!n || !m) { err.hidden = false; err.textContent = !n ? "Escribe tu nombre para poder atenderte." : "Cuéntanos qué repuesto buscas."; (!n ? $("#c-name") : $("#c-msg")).focus(); return; }
  err.hidden = true;
  openWA(`Hola FRENOS PARTS ESTOC, soy ${n}.` + (v ? `\nVehículo: ${v}` : "") + `\n${m}`);
  toast("Abriendo WhatsApp con tu mensaje…");
});

/* ---------- Navegación, revelado y parallax ---------- */
const nav = $(".nav"), burger = $("#burger"), links = $("#nav-links");
let lastY = scrollY, navT = 0;
addEventListener("scroll", () => {
  const y = scrollY;
  nav.classList.toggle("is-scrolled", y > 8);
  // En móvil el menú se oculta al bajar y vuelve al subir: más espacio para el catálogo
  if (matchMedia("(max-width: 860px)").matches && !links.classList.contains("is-open")) {
    const hide = y > lastY + 4 && y > 240, show = y < lastY - 4 || y < 240;
    if (hide) document.documentElement.classList.add("nav-hidden");
    else if (show) document.documentElement.classList.remove("nav-hidden");
  }
  lastY = y;
}, { passive: true });
burger.addEventListener("click", () => { const o = !links.classList.contains("is-open"); links.classList.toggle("is-open", o); burger.setAttribute("aria-expanded", String(o)); });
links.addEventListener("click", e => { if (e.target.closest("a")) { links.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); } });

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function reveal() {
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".sec__head, .rv, .steps li, .trust__item, .contact > *").forEach((el, k) => {
    el.classList.add("rv");
    const r = el.getBoundingClientRect();
    if (r.top > innerHeight) { el.classList.add("pre"); el.style.transitionDelay = (k % 4) * 70 + "ms"; io.observe(el); }
  });
}
/* ---------- Atajos para el héroe 3D y la barra superior ---------- */
// assets/hero3d.js llama a BP_GO({ fam, sub }) para abrir el catálogo ya filtrado
window.BP_GO = f => {
  Object.assign(st, { q: "", fam: "", sub: "", marca: "", medida: "", sis: "", foto: false, sort: "rel" }, f || {});
  $("#q").value = st.q; $("#q-clear").hidden = !st.q;
  if (ITEMS.length) apply();
  goCatalog();
};
$("#nav-search")?.addEventListener("click", () => { goCatalog(); $("#q").focus({ preventScroll: true }); });
// Una foto que no carga se reemplaza por el marcador "Foto no disponible", no por un ícono roto
document.addEventListener("error", e => {
  const img = e.target;
  if (!img || img.tagName !== "IMG") return;
  const box = img.closest(".card__media, .rel__img, .qitem__img, #p-media");
  if (!box) return;
  const it = BY_SLUG.get(img.dataset.slug || box.closest("[data-slug]")?.dataset.slug);
  img.insertAdjacentHTML("afterend", noImg(it?.fam, box.id === "p-media" ? "Imagen no disponible" : "Foto no disponible"));
  img.parentNode.removeChild(img);
}, true);

if (matchMedia("(max-width:560px)").matches) $("#q").placeholder = "Código o vehículo…";
/* ---------- Arranque ---------- */
async function init() {
  buildContact(); updateCartUI();
  try { await loadData(); }
  catch (e) {
    $("#res-n").textContent = "No pudimos cargar el catálogo. Recarga la página o escríbenos por WhatsApp.";
    return;
  }
  buildStats(); buildBento(); buildGauge(); buildFeatured();
  const prod = readURL();
  if (st.q) { $("#q").value = st.q; $("#q-clear").hidden = false; }
  apply();
  reveal();
  if (prod) openProduct(prod, false);
  window.BP = { items: () => ITEMS, state: st, filtered: () => FILTERED, quoteMsg, cart: () => CART };
  // Para el panel de administración (assets/admin.js)
  window.BP_APP = {
    doc: () => DOC,
    reload(d) { ingestData(d); buildStats(); buildBento(); buildGauge(); buildFeatured(); apply(); },
    assetPaths: () => [...SHELF.map(([s]) => `assets/estante/${s}.webp`), FAM.PASTILLA.pic],
    packs: C.imagenes.modo === "paquetes",
    photo: (s, full) => IMG[full ? "full" : "thumb"](s)
  };
  document.dispatchEvent(new CustomEvent("bp:ready"));
}
init();
})();
