// Genera data/productos.js a partir de data/productos.json.
// Sirve como respaldo cuando la página se abre como archivo local (file://),
// donde el navegador bloquea fetch(). Ejecutar desde la carpeta del sitio:
//   node herramientas/generar-productos-js.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'data', 'productos.json');
const destino = join(raiz, 'data', 'productos.js');

let texto = readFileSync(origen, 'utf8').replace(/^﻿/, '');
let datos;
try {
  datos = JSON.parse(texto);
} catch (e) {
  console.error('data/productos.json no es un JSON válido:', e.message);
  process.exit(1);
}
writeFileSync(destino, 'window.BP_PRODUCTOS = ' + JSON.stringify(datos) + ';\n', 'utf8');
const n = Array.isArray(datos) ? datos.length : Object.keys(datos).length;
console.log(`Listo: data/productos.js (${n} registros de primer nivel).`);
