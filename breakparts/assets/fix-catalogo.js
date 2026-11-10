/* ==========================================================================
   BREAK PARTS · Carga robusta del catálogo y de las imágenes
   Se carga ANTES de config.js y app.js (sin defer).

   1) Catálogo ("No pudimos cargar el catálogo"):
      - Si data/productos.json responde con error, o trae BOM / basura al inicio,
        se limpia y se entrega a app.js igual.
      - Si la página se abrió con doble clic (file://), el navegador bloquea fetch().
        En ese caso se usa data/productos.js (generado con herramientas/generar-productos-js.mjs).
   2) Imágenes que no aparecen:
      - Si una imagen falla, se reintenta con la ruta relativa (sin "/" inicial)
        y con el nombre en minúsculas (los servidores Linux distinguen mayúsculas).
      - Si aun así falla, se muestra un marcador "Sin foto" en lugar del ícono roto,
        y se lista en consola qué rutas faltan.
   ========================================================================== */
(function () {
  'use strict';

  var DATA_RE = /(^|\/)data\/productos\.json([?#]|$)/i;
  var RESPALDO = 'data/productos.js';
  var esArchivo = location.protocol === 'file:';

  /* ---------------- 1. Catálogo ---------------- */
  var cargandoRespaldo = null;
  function cargarRespaldo() {
    if (window.BP_PRODUCTOS) return Promise.resolve(window.BP_PRODUCTOS);
    if (cargandoRespaldo) return cargandoRespaldo;
    cargandoRespaldo = new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = RESPALDO;
      s.charset = 'utf-8';
      s.onload = function () {
        if (window.BP_PRODUCTOS) ok(window.BP_PRODUCTOS);
        else mal(new Error(RESPALDO + ' no define window.BP_PRODUCTOS'));
      };
      s.onerror = function () { mal(new Error('No existe ' + RESPALDO)); };
      document.head.appendChild(s);
    });
    return cargandoRespaldo;
  }

  function comoRespuesta(datos) {
    return new Response(JSON.stringify(datos), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  function parsearLimpio(texto) {
    // quita BOM y cualquier cosa antes del primer [ o {
    var t = texto.replace(/^﻿/, '');
    var i = t.search(/[\[{]/);
    if (i > 0) t = t.slice(i);
    return JSON.parse(t);
  }

  function avisar(err) {
    console.error('[BREAK PARTS] No se pudo cargar el catálogo:', err);
    if (!esArchivo) return;
    var poner = function () {
      var grid = document.getElementById('grid');
      if (!grid || document.querySelector('.bp-aviso')) return;
      var p = document.createElement('div');
      p.className = 'bp-aviso';
      p.innerHTML = '<b>Estás abriendo la página como archivo local.</b> El navegador no deja leer ' +
        '<code>data/productos.json</code> así. Ábrela desde un servidor (por ejemplo la extensión ' +
        '“Live Server” de VS Code, o súbela a tu hosting) o genera <code>data/productos.js</code> con ' +
        '<code>node herramientas/generar-productos-js.mjs</code>.';
      grid.parentNode.insertBefore(p, grid);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poner);
    else poner();
  }

  if (window.fetch) {
    var fetchOriginal = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (!DATA_RE.test(url)) return fetchOriginal(input, init);

      var intento = esArchivo
        ? Promise.reject(new Error('Página abierta como archivo (file://)'))
        : fetchOriginal(input, init).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status + ' al pedir ' + url);
            return r.text();
          }).then(function (texto) {
            return comoRespuesta(parsearLimpio(texto));
          });

      return intento.catch(function (err) {
        return cargarRespaldo().then(comoRespuesta, function (err2) {
          avisar(err);
          console.warn('[BREAK PARTS] Respaldo no disponible:', err2.message);
          throw err;
        });
      });
    };
  }

  /* ---------------- 2. Imágenes ---------------- */
  var SIN_FOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<rect width="200" height="200" fill="#F3F4F6"/>' +
    '<g fill="none" stroke="#B4B9C3" stroke-width="6"><circle cx="100" cy="88" r="34"/><circle cx="100" cy="88" r="11"/></g>' +
    '<text x="100" y="158" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="17" fill="#8A909C">Sin foto</text></svg>');
  var faltantes = [];
  var reporte = 0;

  function reportar(src) {
    faltantes.push(src);
    clearTimeout(reporte);
    reporte = setTimeout(function () {
      console.warn('[BREAK PARTS] ' + faltantes.length + ' imagen(es) no encontradas. Revisa estas rutas en el servidor:', faltantes.slice());
    }, 1500);
  }

  function siguienteRuta(img, src) {
    var hechos = img.getAttribute('data-bp-try') || '';
    // a) ruta absoluta "/img/x.jpg" → relativa "img/x.jpg" (sitio publicado en una subcarpeta)
    if (hechos.indexOf('a') < 0 && /^\/(?!\/)/.test(src)) {
      img.setAttribute('data-bp-try', hechos + 'a');
      return src.slice(1);
    }
    // b) nombre de archivo en minúsculas (Windows no distingue, el hosting Linux sí)
    if (hechos.indexOf('b') < 0 && !/^(data|blob):/.test(src)) {
      var partes = src.split(/([?#].*)$/);
      var ruta = partes[0];
      var corte = ruta.lastIndexOf('/') + 1;
      var archivo = ruta.slice(corte);
      if (archivo !== archivo.toLowerCase()) {
        img.setAttribute('data-bp-try', hechos + 'b');
        return ruta.slice(0, corte) + archivo.toLowerCase() + (partes[1] || '');
      }
    }
    return null;
  }

  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || img.classList.contains('bp-img-missing')) return;
    var src = img.getAttribute('src') || '';
    if (!img.hasAttribute('data-bp-orig')) img.setAttribute('data-bp-orig', src);
    var otra = src && !/^(undefined|null)$/i.test(src) ? siguienteRuta(img, src) : null;
    if (otra) {
      img.removeAttribute('srcset');
      img.src = otra;
      return;
    }
    reportar(img.getAttribute('data-bp-orig') || src || '(vacío)');
    img.removeAttribute('srcset');
    img.classList.add('bp-img-missing');
    if (!img.alt) img.alt = 'Sin foto';
    img.src = SIN_FOTO;
  }, true);

})();
