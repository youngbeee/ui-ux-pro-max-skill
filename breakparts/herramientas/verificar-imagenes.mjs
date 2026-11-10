// Revisa que cada imagen mencionada en data/productos.json exista en el disco,
// respetando mayúsculas/minúsculas igual que un hosting Linux.
// Ejecutar desde la carpeta del sitio:
//   node herramientas/verificar-imagenes.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const datos = JSON.parse(readFileSync(join(raiz, 'data', 'productos.json'), 'utf8').replace(/^﻿/, ''));

const EXT = /\.(jpe?g|png|webp|avif|gif|svg)([?#].*)?$/i;
const rutas = new Set();
(function recorrer(v) {
  if (typeof v === 'string') { if (EXT.test(v.trim())) rutas.add(v.trim()); }
  else if (Array.isArray(v)) v.forEach(recorrer);
  else if (v && typeof v === 'object') Object.values(v).forEach(recorrer);
})(datos);

const cacheDir = new Map();
function listar(dir) {
  if (!cacheDir.has(dir)) cacheDir.set(dir, existsSync(dir) ? readdirSync(dir) : null);
  return cacheDir.get(dir);
}

const externas = [], ok = [], faltan = [], mayus = [], absolutas = [];
for (const r of rutas) {
  if (/^(https?:)?\/\//i.test(r)) { externas.push(r); continue; }
  let limpia = r.replace(/[?#].*$/, '');
  try { limpia = decodeURI(limpia); } catch { /* se deja tal cual */ }
  if (limpia.startsWith('/')) absolutas.push(r);
  const partes = posix.normalize(limpia.replace(/^\/+/, '')).split('/');
  let dir = raiz, estado = 'ok';
  for (const p of partes) {
    const hay = listar(dir);
    if (!hay) { estado = 'falta'; break; }
    if (hay.includes(p)) { dir = join(dir, p); continue; }
    const parecido = hay.find((h) => h.toLowerCase() === p.toLowerCase());
    if (parecido) { estado = 'mayus'; mayus.push(`${r}  →  en disco: ${parecido}`); dir = join(dir, parecido); continue; }
    estado = 'falta'; break;
  }
  if (estado === 'ok') ok.push(r);
  else if (estado === 'falta') faltan.push(r);
}

console.log(`Imágenes referenciadas: ${rutas.size}`);
console.log(`  Encontradas:            ${ok.length}`);
console.log(`  Externas (no revisadas): ${externas.length}`);
console.log(`  Mayúsculas distintas:   ${mayus.length}`);
console.log(`  No existen:             ${faltan.length}`);
if (absolutas.length) console.log(`  Rutas que empiezan con "/": ${absolutas.length} (fallan si el sitio está en una subcarpeta)`);
if (mayus.length) console.log('\nMayúsculas distintas (renombra el archivo o corrige el JSON):\n  ' + mayus.slice(0, 50).join('\n  '));
if (faltan.length) console.log('\nNo existen en el disco:\n  ' + faltan.slice(0, 50).join('\n  '));
if (faltan.length + mayus.length > 100) console.log('\n(Se muestran las primeras 50 de cada lista.)');
