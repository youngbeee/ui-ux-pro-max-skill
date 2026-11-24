/* FRENOS PARTS ESTOC · panel de administración
   - Acceso con contraseña (se guarda como huella SHA-256 en <script id="bp-admin">, nunca en texto).
   - Productos desde Excel (vista previa, combinar o reemplazar), plantilla y Excel actual.
   - Fotos: se nombran con el código del producto, se ajustan a 520 px y se guardan en WebP.
   - Descarga de toda la página en un solo archivo HTML que funciona con doble clic y lleva el panel adentro.
   Los cambios viven en esta pestaña del navegador hasta que se descarga el HTML. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const dlg = $("#adm"); if (!dlg) return;
const C = window.BP_CONFIG || {};
const SINGLE = !!window.BP_EMBED;                 // abierto desde el HTML de un solo archivo
const FROM_DISK = !SINGLE && location.protocol === "file:";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim().replace(/\s+/g, " ");
const compact = s => norm(s).replace(/[^A-Z0-9]/g, "");
const keyOf = c => String(c ?? "").trim().toUpperCase();
const slugify = c => String(c).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "producto";
const fmt = n => n.toLocaleString("en-US");
const today = () => new Date().toISOString().slice(0, 10);
const FIELDS = ["cod", "desc", "marca", "medida", "fam", "sub", "slug", "img", "fpe"];
const EDIT = ["fpe", "cod", "desc", "marca", "medida", "fam", "sub"];
const LABEL = { fpe: "Código FPE", cod: "Código", desc: "Descripción", marca: "Marca", medida: "Medida", fam: "Familia", sub: "Subfamilia" };
const COLS = { fpe: /FPE/, cod: /^(COD|SKU|REFER|NUMERO DE PARTE)/, desc: /^(DESCR|PRODUCTO|NOMBRE|DETALLE)/, marca: /^MARCA/, medida: /^MEDIDA/, fam: /^(FAMILIA|CATEGOR|TIPO)/, sub: /^SUB/ };
const IMGS = () => window.BP_IMGS || (window.BP_IMGS = {});
const ready = new Promise(ok => window.BP_APP ? ok() : document.addEventListener("bp:ready", ok, { once: true }));
const NEW_IMGS = new Set();
let dirty = false;

/* ---------- utilidades ---------- */
function rows() {
  const d = window.BP_APP.doc(), F = d.campos, ix = FIELDS.map(f => F.indexOf(f));
  return d.items.map(r => { const o = {}; FIELDS.forEach((f, k) => o[f] = ix[k] < 0 ? "" : (r[ix[k]] ?? "")); o.img = o.img ? 1 : 0; return o; });
}
function docOf(list, extra = {}) {
  return Object.assign({ v: 2, generado: today(), campos: FIELDS, items: list.map(o => FIELDS.map(f => f === "img" ? (o.img ? 1 : 0) : String(o[f] ?? ""))) }, extra);
}
function commit(list) { window.BP_APP.reload(docOf(list)); setDirty(true); kpis(); }
async function cap(name) { try { return window.claude && window.claude.use ? await window.claude.use(name) : null; } catch { return null; } }
async function saveFile(filename, data, type) {
  const dl = await cap("downloads");
  if (dl) { try { await dl.save({ filename, data }); return true; } catch (e) { if (e && e.code === "cancelled") return false; } }
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  return true;
}
let noteT;
function note(msg, ms = 3200) {
  const t = $("#toast"); if (!t) return;
  if (t.parentElement !== dlg) dlg.appendChild(t);
  t.textContent = msg; t.classList.add("show");
  clearTimeout(noteT); noteT = setTimeout(() => t.classList.remove("show"), ms);
}
function setDirty(on) {
  dirty = on;
  $("#adm-dirty").hidden = !on;
  $('[data-tab="html"]').classList.toggle("dirty", on);
}
addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
function kpis() {
  if (!window.BP_APP) return;
  const r = rows(), con = r.filter(o => o.img).length;
  const k = [[r.length, "Productos"], [con, "Con foto"], [r.length - con, "Sin foto"], [new Set(r.map(o => o.fam).filter(Boolean)).size, "Familias"], [NEW_IMGS.size, "Fotos nuevas"]];
  $("#adm-kpis").innerHTML = k.map(([n, t]) => `<div class="adm-kpi"><b>${fmt(n)}</b><span>${t}</span></div>`).join("");
}

/* ---------- contraseña ---------- */
function sha256js(str) {
  const b = new TextEncoder().encode(str), l = b.length, n = ((l + 8) >> 6 << 4) + 16, w = new Uint32Array(n);
  for (let i = 0; i < l; i++) w[i >> 2] |= b[i] << (24 - (i % 4) * 8);
  w[l >> 2] |= 0x80 << (24 - (l % 4) * 8); w[n - 1] = l * 8;
  const K = [], H = [], frac = x => (x - Math.floor(x)) * 4294967296 | 0;
  for (let p = 2, c = 0; c < 64; p++) {
    let prime = true; for (let f = 2; f * f <= p; f++) if (p % f === 0) { prime = false; break; }
    if (prime) { if (c < 8) H[c] = frac(Math.sqrt(p)); K[c++] = frac(Math.cbrt(p)); }
  }
  const r = (x, y) => (x >>> y) | (x << (32 - y)), W = new Array(64);
  for (let j = 0; j < n; j += 16) {
    let [a, b2, c2, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      if (i < 16) W[i] = w[j + i] | 0;
      else { const x = W[i - 15], y = W[i - 2]; W[i] = (W[i - 16] + (r(x, 7) ^ r(x, 18) ^ (x >>> 3)) + W[i - 7] + (r(y, 17) ^ r(y, 19) ^ (y >>> 10))) | 0; }
      const t1 = (h + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b2) ^ (a & c2) ^ (b2 & c2))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c2; c2 = b2; b2 = a; a = (t1 + t2) | 0;
    }
    [a, b2, c2, d, e, f, g, h].forEach((v, k) => H[k] = (H[k] + v) | 0);
  }
  return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
}
async function sha(s) {
  try { if (crypto.subtle) return [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, "0")).join(""); } catch {}
  return sha256js(s);
}
const HASH = () => (window.BP_ADMIN && window.BP_ADMIN.hash) || "";
const session = {
  get() { try { return sessionStorage.getItem("bp-adm") === HASH(); } catch { return false; } },
  set(on) { try { on ? sessionStorage.setItem("bp-adm", HASH()) : sessionStorage.removeItem("bp-adm"); } catch {} }
};

/* ---------- abrir / cerrar ---------- */
function showBody(on) {
  $("#adm-login").hidden = on; $("#adm-body").hidden = !on;
  if (on) { kpis(); renderUsers(); } else setTimeout(() => $("#adm-pass").focus(), 50);
}
async function openAdmin() {
  if (!dlg.open) dlg.showModal();
  $("#adm-mode").textContent = SINGLE ? `Archivo de un solo HTML · datos del ${window.BP_EMBED.generado || "—"}` : FROM_DISK ? "Sitio abierto desde la carpeta" : "Sitio en línea";
  $("#html-q").hidden = SINGLE;
  $("#json-card").hidden = SINGLE;
  await ready;
  showBody(session.get());
}
function closeAdmin() {
  dlg.close();
  const t = $("#toast"); if (t && t.parentElement === dlg) document.body.appendChild(t);
  if (location.hash === "#admin") history.replaceState(history.state, "", location.pathname + location.search);
}
$("#open-admin")?.addEventListener("click", openAdmin);
$("#adm-close").addEventListener("click", closeAdmin);
dlg.addEventListener("cancel", e => { e.preventDefault(); closeAdmin(); });
if (location.hash === "#admin") openAdmin();
addEventListener("hashchange", () => { if (location.hash === "#admin") openAdmin(); });

$("#adm-login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const v = $("#adm-pass").value;
  if (v && await sha(v) === HASH()) { $("#adm-pass").value = ""; $("#adm-err").textContent = ""; session.set(true); showBody(true); }
  else { $("#adm-err").textContent = "Contraseña incorrecta. Inténtalo de nuevo."; $("#adm-pass").select(); }
});
$("#adm-logout").addEventListener("click", () => { session.set(false); showBody(false); });

$$(".adm-tab").forEach(b => b.addEventListener("click", () => tab(b.dataset.tab)));
$$("[data-go]").forEach(b => b.addEventListener("click", () => tab(b.dataset.go)));
function tab(k) {
  $$(".adm-tab").forEach(b => b.setAttribute("aria-selected", b.dataset.tab === k));
  $$(".adm-pane").forEach(p => p.hidden = p.dataset.pane !== k);
  $(".adm-main").scrollTop = 0;
}

/* ---------- Excel ---------- */
let XL_P;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return XL_P || (XL_P = new Promise((ok, bad) => {
    const emb = $("#xlsx-lib"), sc = document.createElement("script");
    sc.src = emb ? URL.createObjectURL(new Blob([emb.textContent], { type: "text/javascript" })) : "assets/vendor/xlsx.full.min.js";
    sc.onload = () => window.XLSX ? ok(window.XLSX) : bad(new Error("sin lector"));
    sc.onerror = () => { XL_P = null; bad(new Error("No se pudo cargar el lector de Excel")); };
    document.head.appendChild(sc);
  }));
}
let PARSED = null;
async function readExcel(file) {
  const X = await loadXLSX();
  const isText = /\.(csv|txt)$/i.test(file.name);
  const wb = isText ? X.read(await file.text(), { type: "string" }) : X.read(await file.arrayBuffer(), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: "" });
  const h = aoa.slice(0, 15).findIndex(r => r.some(c => COLS.cod.test(norm(c))));
  if (h < 0) throw new Error("No encontré la columna «Código» en las primeras filas del Excel.");
  const head = aoa[h].map(norm), map = {};
  for (const [k, rx] of Object.entries(COLS))
    for (let i = 0; i < head.length; i++)
      if (rx.test(head[i]) && !Object.values(map).includes(i) && !(k === "fam" && head[i].startsWith("SUB")) && !(k === "cod" && /FPE/.test(head[i]))) { map[k] = i; break; }
  const seen = new Set(), out = [];
  let dup = 0;
  for (const r of aoa.slice(h + 1)) {
    const g = k => k in map ? String(r[map[k]] ?? "").trim() : undefined;
    const cod = g("cod"); if (!cod) continue;
    if (seen.has(keyOf(cod))) { dup++; continue; } seen.add(keyOf(cod));
    const o = { cod };
    if ("desc" in map) o.desc = g("desc");
    if ("marca" in map) o.marca = g("marca").toUpperCase();
    if ("medida" in map) o.medida = g("medida");
    if ("fam" in map) o.fam = norm(g("fam"));
    if ("sub" in map) o.sub = norm(g("sub"));
    if ("fpe" in map && g("fpe")) o.fpe = g("fpe").toUpperCase().replace(/\s+/g, "");   // vacío: se conserva o se asigna solo
    out.push(o);
  }
  return { list: out, map, dup, name: file.name };
}
function diff(p) {
  const cur = new Map(rows().map(o => [keyOf(o.cod), o]));
  return p.list.map(o => {
    const c = cur.get(keyOf(o.cod));
    return [o, !c ? "n" : EDIT.some(f => f in o && String(o[f]) !== String(c[f])) ? "u" : "s"];
  });
}
function preview(p) {
  PARSED = p;
  const d = diff(p), cnt = { n: 0, u: 0, s: 0 }; d.forEach(([, s]) => cnt[s]++);
  const inX = new Set(p.list.map(o => keyOf(o.cod)));
  const gone = rows().filter(o => !inX.has(keyOf(o.cod))).length;
  const cols = EDIT.filter(f => f in p.map);
  const miss = EDIT.filter(f => !(f in p.map)).map(f => LABEL[f]);
  $("#xl-name").textContent = `Vista previa · ${p.name}`;
  $("#xl-sum").innerHTML = `<span>${fmt(p.list.length)} filas leídas</span><span class="new">${fmt(cnt.n)} nuevos</span><span class="warn">${fmt(cnt.u)} con cambios</span><span>${fmt(cnt.s)} sin cambios</span>` +
    (gone ? `<span>${fmt(gone)} del catálogo no están en el Excel (solo se quitan si eliges «Reemplazar»)</span>` : "") + (p.dup ? `<span class="warn">${fmt(p.dup)} códigos repetidos ignorados</span>` : "") +
    (miss.length ? `<span class="warn">Columnas no encontradas: ${esc(miss.join(", "))} (se conservan los datos actuales)</span>` : "");
  const order = { n: 0, u: 1, s: 2 }, show = d.slice().sort((a, b) => order[a[1]] - order[b[1]]).slice(0, 200);
  const tag = { n: '<span class="adm-tag n">Nuevo</span>', u: '<span class="adm-tag u">Cambia</span>', s: '<span class="adm-tag s">Igual</span>' };
  $("#xl-table").innerHTML = `<table><thead><tr>${cols.map(f => `<th>${LABEL[f]}</th>`).join("")}<th>Estado</th></tr></thead><tbody>` +
    show.map(([o, s]) => `<tr>${cols.map(f => `<td title="${esc(o[f])}">${esc(o[f])}</td>`).join("")}<td>${tag[s]}</td></tr>`).join("") + "</tbody></table>" +
    (d.length > show.length ? `<p class="adm-note" style="padding:8px 10px">Se muestran ${show.length} de ${fmt(d.length)} filas.</p>` : "");
  $("#xl-prev").hidden = false;
  $("#xl-prev").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function takeExcel(file) {
  if (!file) return;
  try { note("Leyendo el Excel…"); preview(await readExcel(file)); note(`Excel leído: ${file.name}`); }
  catch (e) { note(e.message || "No se pudo leer el archivo.", 6000); }
}
function applyExcel() {
  if (!PARSED) return;
  const mode = $('input[name="xl-mode"]:checked').value;
  const cur = rows(), byCod = new Map(cur.map(o => [keyOf(o.cod), o]));
  let out;
  if (mode === "replace") out = PARSED.list.map(p => Object.assign({ desc: "", marca: "", medida: "", fam: "", sub: "", slug: "", img: 0 }, byCod.get(keyOf(p.cod)) || {}, p));
  else {
    const pm = new Map(PARSED.list.map(p => [keyOf(p.cod), p]));
    out = cur.map(o => pm.has(keyOf(o.cod)) ? Object.assign({}, o, pm.get(keyOf(o.cod))) : o);
    PARSED.list.forEach(p => { if (!byCod.has(keyOf(p.cod))) out.push(Object.assign({ desc: "", marca: "", medida: "", fam: "", sub: "", slug: "", img: 0 }, p)); });
  }
  const used = new Set(out.map(o => o.slug).filter(Boolean));
  out.forEach(o => {
    if (o.slug) return;
    const base = slugify(o.cod); let s = base, n = 2;
    while (used.has(s)) s = `${base}-${n++}`;
    used.add(s); o.slug = s; o.img = IMGS()[s] ? 1 : 0;
  });
  // productos sin código FPE: reciben el siguiente número libre (FPE0001, FPE0002…)
  let next = out.reduce((m, o) => Math.max(m, +((/^FPE(\d+)$/.exec(o.fpe || "") || [])[1] || 0)), 0);
  out.forEach(o => { if (!o.fpe) o.fpe = "FPE" + String(++next).padStart(4, "0"); });
  commit(out);
  PARSED = null; $("#xl-prev").hidden = true; $("#xl-file").value = "";
  note(`Catálogo actualizado: ${fmt(out.length)} productos.`);
}
async function downloadSheet(list, name) {
  const X = await loadXLSX();
  const aoa = [EDIT.map(f => LABEL[f]), ...list.map(o => EDIT.map(f => o[f] ?? ""))];
  const ws = X.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [13, 18, 60, 12, 12, 14, 16].map(wch => ({ wch }));
  const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, "Productos");
  const buf = X.write(wb, { bookType: "xlsx", type: "array" });
  await saveFile(name, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
$("#xl-file").addEventListener("change", e => takeExcel(e.target.files[0]));
$("#xl-apply").addEventListener("click", applyExcel);
$("#xl-cancel").addEventListener("click", () => { PARSED = null; $("#xl-prev").hidden = true; $("#xl-file").value = ""; });
$("#xl-tpl").addEventListener("click", () => downloadSheet([{ fpe: "", cod: "30610-01J60NBN", desc: "BOMBA DE EMBRAGUE NISSAN SENTRA B13 5/8", marca: "NBN", medida: "5/8", fam: "BOMBA", sub: "EMBRAGUE" }], "plantilla-productos.xlsx").catch(e => note(e.message)));
$("#xl-cur").addEventListener("click", () => downloadSheet(rows(), `productos-frenos-parts-estoc-${today()}.xlsx`).catch(e => note(e.message)));
$("#json-dl").addEventListener("click", async () => {
  const j = JSON.stringify(docOf(rows()));
  await saveFile("productos.json", j, "application/json");
  await saveFile("productos.js", "window.BP_PRODUCTOS = " + j + ";\n", "text/javascript");
  if (NEW_IMGS.size) note("Las fotos nuevas no van en estos archivos: usa «Descargar HTML» o súbelas a img/ con admin/importar_excel.py.", 7000);
});

/* ---------- fotos ---------- */
const IMG_RX = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;
function resize(file, max = 520) {
  return new Promise((ok, bad) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
      g.drawImage(im, 0, 0, c.width, c.height);
      let url = c.toDataURL("image/webp", 0.82);
      if (!url.startsWith("data:image/webp")) { // navegadores sin WebP: JPEG con fondo blanco
        const c2 = document.createElement("canvas"); c2.width = c.width; c2.height = c.height;
        const g2 = c2.getContext("2d"); g2.fillStyle = "#fff"; g2.fillRect(0, 0, c.width, c.height); g2.drawImage(c, 0, 0);
        url = c2.toDataURL("image/jpeg", 0.86);
      }
      URL.revokeObjectURL(u); ok(url);
    };
    im.onerror = () => { URL.revokeObjectURL(u); bad(new Error("imagen no válida")); };
    im.src = u;
  });
}
async function addPhotos(files) {
  files = files.filter(f => IMG_RX.test(f.name));
  if (!files.length) { note("No encontré fotos (.jpg, .png o .webp)."); return; }
  const list = rows(), by = new Map(list.map(o => [compact(o.cod), o]));
  const bar = $("#img-bar"), log = $("#img-log");
  bar.hidden = false; bar.firstElementChild.style.width = "0";
  let ok = 0; const bad = [];
  for (let k = 0; k < files.length; k++) {
    const f = files[k], base = f.name.replace(/\.[^.]+$/, "").replace(/\s*\(\d+\)$/, "");
    const o = by.get(compact(base));
    if (!o) bad.push(f.name);
    else try {
      const url = await resize(f);
      IMGS()[o.slug] = url; o.img = 1; NEW_IMGS.add(o.slug); ok++;
      log.insertAdjacentHTML("afterbegin", `<div><img src="${url}" alt=""><span><b>${esc(o.cod)}</b> · ${esc(o.desc)}</span></div>`);
    } catch { bad.push(f.name); }
    bar.firstElementChild.style.width = ((k + 1) / files.length * 100) + "%";
  }
  if (bad.length) log.insertAdjacentHTML("afterbegin", `<div class="bad">No coinciden con ningún código (${bad.length}): ${esc(bad.slice(0, 20).join(", "))}${bad.length > 20 ? "…" : ""}</div>`);
  $("#img-sum").innerHTML = `<span class="ok">${ok} fotos cargadas</span>` + (bad.length ? `<span class="warn">${bad.length} sin código</span>` : "");
  setTimeout(() => bar.hidden = true, 800);
  if (ok) { commit(list); note(`${ok} fotos cargadas en el catálogo.`); }
}
async function walk(entry, out) {
  if (entry.isFile) { out.push(await new Promise((ok, bad) => entry.file(ok, bad))); return; }
  if (!entry.isDirectory) return;
  const rd = entry.createReader();
  for (;;) { const batch = await new Promise((ok, bad) => rd.readEntries(ok, bad)); if (!batch.length) break; for (const e of batch) await walk(e, out); }
}
async function dropped(dt) {
  const items = [...(dt.items || [])].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!items.length) return [...dt.files];
  const out = []; for (const e of items) await walk(e, out); return out;
}
function dropZone(el, onFiles) {
  el.addEventListener("dragover", e => { e.preventDefault(); el.classList.add("over"); });
  el.addEventListener("dragleave", () => el.classList.remove("over"));
  el.addEventListener("drop", async e => { e.preventDefault(); el.classList.remove("over"); onFiles(await dropped(e.dataTransfer)); });
}
$("#img-files").addEventListener("change", e => { addPhotos([...e.target.files]); e.target.value = ""; });
$("#img-dir-btn").addEventListener("click", () => $("#img-dir").click());
$("#img-dir").addEventListener("change", e => { addPhotos([...e.target.files]); e.target.value = ""; });
dropZone($("#img-drop"), addPhotos);
dropZone($("#xl-drop"), fs => takeExcel(fs[0]));

/* ---------- usuarios que ven los códigos ---------- */
const USERS = () => (window.BP_ADMIN && Array.isArray(window.BP_ADMIN.users)) ? window.BP_ADMIN.users : [];
function renderUsers() {
  const l = USERS();
  $("#us-list").innerHTML = l.length
    ? `<table><thead><tr><th>Usuario</th><th>Acceso</th><th></th></tr></thead><tbody>${l.map((x, k) => `<tr><td>${esc(x.u)}</td><td>Ve los códigos</td><td style="text-align:right"><button class="btn btn--line" type="button" data-us-del="${k}" style="min-height:34px;padding:0 12px">Borrar</button></td></tr>`).join("")}</tbody></table>`
    : `<p class="adm-note" style="padding:12px">Todavía no hay usuarios. Mientras tanto, todos entran como invitados (también puedes entrar con el usuario «admin» y la contraseña del panel).</p>`;
}
$("#us-form").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#us-msg"), u = $("#us-name").value.trim().toLowerCase(), p = $("#us-pass").value;
  m.className = "adm-msg bad";
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) { m.textContent = "El usuario debe tener de 3 a 30 letras o números (sin espacios)."; return; }
  if (u === "admin") { m.textContent = "«admin» está reservado para la contraseña del panel."; return; }
  if (USERS().some(x => x.u === u)) { m.textContent = "Ese usuario ya existe. Bórralo primero si quieres cambiar su contraseña."; return; }
  if (p.length < 4) { m.textContent = "La contraseña debe tener al menos 4 caracteres."; return; }
  const h = await sha(u + "\n" + p);
  window.BP_ADMIN = Object.assign({}, window.BP_ADMIN, { users: [...USERS(), { u, h }] });
  e.target.reset(); renderUsers(); setDirty(true);
  m.className = "adm-msg ok"; m.textContent = `Usuario «${u}» creado. Descarga el HTML para guardarlo.`;
});
$("#us-list").addEventListener("click", e => {
  const b = e.target.closest("[data-us-del]"); if (!b) return;
  const l = USERS().slice(), x = l[+b.dataset.usDel];
  if (!x || !confirm(`¿Borrar el usuario «${x.u}»?`)) return;
  l.splice(+b.dataset.usDel, 1);
  window.BP_ADMIN = Object.assign({}, window.BP_ADMIN, { users: l });
  renderUsers(); setDirty(true);
  const m = $("#us-msg"); m.className = "adm-msg ok"; m.textContent = `Usuario «${x.u}» borrado. Descarga el HTML para guardarlo.`;
});

/* ---------- contraseña: cambiar ---------- */
$("#pw-form").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#pw-msg"), o = $("#pw-old").value, n = $("#pw-new").value, r = $("#pw-rep").value;
  m.className = "adm-msg bad";
  if (await sha(o) !== HASH()) { m.textContent = "La contraseña actual no es correcta."; return; }
  if (n.length < 6) { m.textContent = "La nueva contraseña debe tener al menos 6 caracteres."; return; }
  if (n !== r) { m.textContent = "Las contraseñas nuevas no coinciden."; return; }
  window.BP_ADMIN = Object.assign({}, window.BP_ADMIN, { hash: await sha(n) });
  session.set(true); setDirty(true); e.target.reset();
  m.className = "adm-msg ok"; m.textContent = "Contraseña cambiada. Descarga el HTML para guardarla.";
});

/* ---------- HTML de un solo archivo ---------- */
async function get(path, as = "text") {
  const r = await fetch(path, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return as === "blob" ? r.blob() : r.text();
}
const toData = blob => new Promise((ok, bad) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = bad; fr.readAsDataURL(blob); });
const safeJS = s => s.replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--");
const safeJSON = v => JSON.stringify(v).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, c => "\\u" + c.charCodeAt(0).toString(16));
async function pool(list, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; await fn(list[k], k); } })); }
function setScript(doc, id, code, type) {
  let s = doc.getElementById(id);
  if (!s) { s = doc.createElement("script"); s.id = id; doc.getElementById("bp-admin").before(s); }
  if (type) s.type = type;
  s.textContent = code;
}
async function buildHTML(q, progress) {
  const doc = new DOMParser().parseFromString(window.BP_PRISTINE, "text/html");
  doc.documentElement.classList.remove("gate-on", "ver-cod", "invitado");   // el modo de acceso lo decide cada visitante
  if (!doc.documentElement.classList.length) doc.documentElement.removeAttribute("class");
  const step = (t, p) => progress(t, p);
  // Lo que no debe viajar en el archivo: ajustes de una vista previa, scripts externos y metadatos de la página anfitriona
  const drop = el => el && el.parentNode && el.parentNode.removeChild(el);
  drop(doc.getElementById("bp-preview"));
  $$('script[src^="http"], script[src^="//"], meta[http-equiv], meta[name^="claude:"]', doc).forEach(drop);
  let cs = doc.querySelector("meta[charset]");
  if (!cs) { cs = doc.createElement("meta"); doc.head.prepend(cs); }
  cs.setAttribute("charset", "utf-8");
  if (!doc.querySelector('meta[name="viewport"]')) { const v = doc.createElement("meta"); v.name = "viewport"; v.content = "width=device-width,initial-scale=1,viewport-fit=cover"; cs.after(v); }
  if (!SINGLE) {
    step("Incluyendo diseño y programas…", 2);
    for (const l of $$('link[rel="stylesheet"][href]', doc)) {
      const h = l.getAttribute("href"); if (/^(https?:)?\/\//.test(h)) continue;
      const st = doc.createElement("style"); st.textContent = (await get(h)).replace(/<\/(style)/gi, "<\\/$1"); l.replaceWith(st);
    }
    for (const s of $$("script[src]", doc)) {
      const h = s.getAttribute("src"); if (/^(https?:)?\/\//.test(h)) continue;
      const n = doc.createElement("script"); if (s.defer) n.type = "module";
      n.textContent = safeJS(await get(h)); s.replaceWith(n);
    }
    const lib = doc.createElement("script"); lib.type = "text/plain"; lib.id = "xlsx-lib";
    lib.textContent = safeJS(await get("assets/vendor/xlsx.full.min.js"));
    doc.getElementById("bp-admin").before(lib);
    step("Incluyendo logo e imágenes de la portada…", 6);
    $$('link[rel="preload"][href^="assets/"]', doc).forEach(l => l.remove());
    const paths = new Set(["assets/logo-fpe.webp", ...window.BP_APP.assetPaths(), ...(window.BP_HERO_IMGS || [])]);
    $$('img[src^="assets/"]', doc).forEach(i => paths.add(i.getAttribute("src")));
    $$('link[href^="assets/"]', doc).forEach(l => paths.add(l.getAttribute("href")));
    const A = {};
    await pool([...paths], 6, async p => { try { A[p] = await toData(await get(p, "blob")); } catch {} });
    $$('img[src^="assets/"]', doc).forEach(i => { const v = A[i.getAttribute("src")]; if (v) i.setAttribute("src", v); });
    $$('link[href^="assets/"]', doc).forEach(l => { const v = A[l.getAttribute("href")]; if (v) l.setAttribute("href", v); });
    setScript(doc, "bp-assets", "window.BP_ASSETS = " + safeJSON(A) + ";");
  }
  const list = rows(), imgs = {}, have = IMGS();
  const need = list.filter(o => o.img && !have[o.slug]);
  if (!SINGLE && q !== "0" && need.length) {
    const dir = q === "p" ? (C.imagenes && C.imagenes.grande) || "img/p/" : (C.imagenes && C.imagenes.miniatura) || "img/t/";
    let done = 0;
    await pool(need, 8, async o => {
      try {
        if (window.BP_APP.packs) { const v = await window.BP_APP.photo(o.slug, q === "p"); if (/^data:/.test(v)) imgs[o.slug] = v; }
        else imgs[o.slug] = await toData(await get(dir + o.slug + ".webp", "blob"));
      } catch {}
      if (++done % 20 === 0 || done === need.length) step(`Incluyendo fotos del catálogo… ${fmt(done)} de ${fmt(need.length)}`, 8 + done / need.length * 82);
    });
  }
  list.forEach(o => { if (have[o.slug]) imgs[o.slug] = have[o.slug]; o.img = imgs[o.slug] ? 1 : 0; });
  step("Armando el archivo…", 94);
  setScript(doc, "bp-embed", "window.BP_EMBED = " + safeJSON(docOf(list)) + ";");
  setScript(doc, "bp-imgs", "window.BP_IMGS = " + safeJSON(imgs) + ";");
  setScript(doc, "bp-admin", "window.BP_ADMIN = " + safeJSON({ hash: HASH(), users: USERS() }) + ";");
  return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, n: list.length, fotos: Object.keys(imgs).length };
}
$("#html-go").addEventListener("click", async () => {
  const btn = $("#html-go"), bar = $("#html-bar"), msg = $("#html-msg");
  const q = SINGLE ? "" : $('input[name="html-q"]:checked').value;
  btn.disabled = true; bar.hidden = false; msg.className = "adm-msg";
  try {
    await ready;
    if (FROM_DISK) throw new Error("carpeta");
    if (!window.BP_PRISTINE) throw new Error("Falta la copia original de la página (script bp-pristine).");
    const r = await buildHTML(q, (t, p) => { msg.textContent = t; bar.firstElementChild.style.width = p + "%"; });
    const name = `frenos-parts-estoc-${today()}.html`;
    const blob = new Blob([r.html], { type: "text/html" });
    const saved = await saveFile(name, blob);
    bar.firstElementChild.style.width = "100%";
    if (saved) {
      setDirty(false);
      msg.className = "adm-msg ok";
      msg.textContent = `Listo: ${name} · ${fmt(r.n)} productos · ${fmt(r.fotos)} fotos · ${(blob.size / 1048576).toFixed(1)} MB.`;
    } else msg.textContent = "Descarga cancelada.";
  } catch (e) {
    msg.className = "adm-msg bad";
    msg.textContent = FROM_DISK
      ? "Abriste la página desde la carpeta con doble clic y el navegador no deja leer sus archivos. Abre el archivo «FRENOS-PARTS-ESTOC.html» (la versión de un solo archivo) y descarga desde su panel, o abre el sitio desde internet."
      : "No se pudo generar el archivo: " + (e.message || e);
  } finally { btn.disabled = false; setTimeout(() => bar.hidden = true, 1200); }
});
})();
