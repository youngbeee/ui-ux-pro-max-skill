/* FRENOS PARTS ESTOC · pantalla de entrada
   - «Entrar con usuario»: muestra los códigos de los productos (tarjetas y ficha).
   - «Entrar como invitado»: catálogo sin códigos, como siempre. La cotización por WhatsApp lleva los códigos en ambos casos.
   - Los usuarios se crean en el panel de administración (pestaña «Accesos») y se guardan como huellas SHA-256.
   - La elección se recuerda en este navegador; el botón de acceso de la cabecera permite cambiarla.
   Nota: es una forma de presentar el catálogo, no una protección de datos. Los códigos viajan dentro de la página
   porque el mensaje de cotización los necesita. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
const gate = $("#gate"); if (!gate) return;

/* SHA-256: usa el del navegador y, donde no existe (páginas http sin cifrar), esta versión en JS */
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
window.BP_SHA = sha;
// huella de un usuario: nombre en minúsculas + salto de línea + contraseña
const userHash = (u, p) => sha(String(u).trim().toLowerCase() + "\n" + p);
window.BP_USER_HASH = userHash;

const KEY = "bp-acceso";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
const write = v => { try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch {} };
const ADM = () => window.BP_ADMIN || {};
const users = () => Array.isArray(ADM().users) ? ADM().users : [];
const valid = a => a && a.m === "u" && (a.u === "admin" ? a.h === ADM().hash : users().some(x => x.u === a.u && x.h === a.h));
// cuenta de administrador: «admin» (contraseña del panel) o un usuario con tipo «Administrador»
const roleOf = u => u === "admin" || (users().find(x => x.u === u) || {}).r === "admin" ? "admin" : "user";

let mode = null;
function setMode(m, u) {
  mode = m;
  const adm = m === "u" && roleOf(u) === "admin";
  root.classList.toggle("es-admin", adm);
  root.classList.toggle("ver-cod", m === "u");
  root.classList.toggle("invitado", m === "g");
  const chip = $("#acc-chip");
  if (chip) {
    chip.querySelector("span").textContent = m === "u" ? (adm && u !== "admin" ? `${u} · admin` : u) : "Invitado";
    chip.classList.toggle("adm", adm);
    chip.setAttribute("aria-label", m === "u" ? `Sesión de ${u}: códigos visibles. Cambiar acceso` : "Entraste como invitado. Cambiar acceso");
    chip.classList.toggle("on", m === "u");
  }
  // ordenar por código solo tiene sentido si se ven los códigos
  const sort = $("#f-sort");
  if (sort) {
    sort.querySelectorAll('option[value^="cod"]').forEach(o => { o.hidden = m !== "u"; o.disabled = m !== "u"; });
    if (m !== "u" && /^cod/.test(sort.value)) { sort.value = "rel"; sort.dispatchEvent(new Event("change", { bubbles: true })); }
  }
  document.dispatchEvent(new CustomEvent("bp:acceso", { detail: { modo: m === "u" ? "usuario" : "invitado", usuario: u || "" } }));
}

/* ---------- pantalla ---------- */
let lastFocus = null;
function view(k) {
  gate.querySelectorAll("[data-view]").forEach(v => v.hidden = v.dataset.view !== k);
  setTimeout(() => (k === "login" ? $("#gate-user") : gate.querySelector(".gate__opt"))?.focus(), 30);
}
function openGate() {
  lastFocus = document.activeElement;
  root.classList.add("gate-on");
  $("#gate-x").hidden = !mode;
  $("#gate-now").textContent = mode === "u" ? `Ahora estás como usuario: ${$("#acc-chip span")?.textContent || ""}` : mode === "g" ? "Ahora estás como invitado" : "";
  view("pick");
}
function closeGate() {
  root.classList.remove("gate-on");
  $("#gate-err").textContent = "";
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
gate.addEventListener("click", e => {
  const b = e.target.closest("[data-gate]"); if (!b) return;
  const k = b.dataset.gate;
  if (k === "user") view("login");
  else if (k === "back") view("pick");
  else if (k === "guest") { write({ m: "g" }); setMode("g"); closeGate(); }
  else if (k === "close" && mode) closeGate();
});
gate.addEventListener("keydown", e => { if (e.key === "Escape" && mode) { e.preventDefault(); closeGate(); } });
$("#gate-form").addEventListener("submit", async e => {
  e.preventDefault();
  const u = $("#gate-user").value.trim().toLowerCase(), p = $("#gate-pass").value, err = $("#gate-err");
  if (!u || !p) { err.textContent = "Escribe tu usuario y tu contraseña."; return; }
  let ok = null;
  if (u === "admin" && ADM().hash && await sha(p) === ADM().hash) ok = { m: "u", u, h: ADM().hash };
  else { const h = await userHash(u, p); if (users().some(x => x.u === u && x.h === h)) ok = { m: "u", u, h }; }
  if (!ok) { err.textContent = "Usuario o contraseña incorrectos."; $("#gate-pass").select(); return; }
  ok.r = roleOf(u); write(ok); setMode("u", u); e.target.reset(); err.textContent = ""; closeGate();
});
$("#acc-chip")?.addEventListener("click", openGate);

/* barra de carga del catálogo */
const bar = $("#gate-bar"), st = $("#gate-st");
function loaded() {
  bar.style.width = "100%";
  const n = window.BP && window.BP.items ? window.BP.items().length : 0;
  st.textContent = n ? `Catálogo listo · ${n.toLocaleString("en-US")} productos` : "Catálogo listo";
  st.classList.add("ok");
}
if (window.BP_APP) loaded(); else { requestAnimationFrame(() => bar.style.width = "70%"); document.addEventListener("bp:ready", loaded, { once: true }); }

/* arranque: recordar la elección de este navegador */
const saved = read();
if (valid(saved)) setMode("u", saved.u);
else if (saved && saved.m === "g") setMode("g");
else { if (saved) write(null); setMode(null); openGate(); }
window.BP_ACCESO = { abrir: openGate, modo: () => mode };

/* barra del modo administrador */
const AB = id => document.getElementById(id);
const panel = k => window.BP_ADMIN_UI ? window.BP_ADMIN_UI.open(k) : null;
AB("ab-panel")?.addEventListener("click", () => panel("datos"));
AB("ab-cuentas")?.addEventListener("click", () => panel("clave"));
AB("ab-guardar")?.addEventListener("click", () => panel("html"));
AB("ab-salir")?.addEventListener("click", () => {
  if (root.classList.contains("adm-sucio") && !confirm("Tienes cambios sin guardar en un archivo. ¿Salir igual? Seguirán en esta pestaña hasta que la cierres.")) return;
  write(null); setMode(null); openGate();
});
})();
