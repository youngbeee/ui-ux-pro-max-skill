# BREAK PARTS · Sitio web

Sitio estático: no necesita servidor ni base de datos. Se sube tal cual a cualquier hosting (Netlify, Vercel, Cloudflare Pages, Hostinger, cPanel…).

## Estructura

| Ruta | Contenido |
|---|---|
| `index.html` | Página (héroe, categorías, catálogo, cotización, contacto) con metadatos SEO y datos estructurados |
| `assets/config.js` | **Lo que editas tú:** WhatsApp, dirección, mapa, horarios |
| `assets/app.css`, `assets/app.js` | Diseño y lógica (buscador, filtros, ficha, cotización) |
| `assets/hero3d.js` · `assets/piezas/` | Sistema 3D de la portada: 5 piezas que giran alrededor del logo. Sin librerías externas |
| `data/productos.json` | Catálogo: 2,755 productos (código, descripción, marca, medida, familia, subfamilia) |
| `data/productos.js` | Copia del catálogo que se usa cuando la página se abre con doble clic. Se regenera sola al importar el Excel, o con `node herramientas/generar-productos-js.mjs` |
| `img/p/` · `img/t/` | Fotos WebP de 520 px (ficha) y miniaturas de 320 px (tarjetas). 1,468 fotos, nombradas por código |
| `admin/` | Herramientas para actualizar el catálogo desde Excel |
| `herramientas/verificar-imagenes.mjs` | Lista las fotos del catálogo que faltan en el disco o tienen otras mayúsculas |
| `robots.txt`, `sitemap.xml` | SEO |

## Configurar dirección, mapa y horarios

Abre `assets/config.js` y completa:

```js
direccion: "Av. …, Lima",
mapaEmbed: "https://www.google.com/maps/embed?pb=…",   // Google Maps → Compartir → Insertar un mapa → copia solo la URL del src
mapaEnlace: "https://maps.app.goo.gl/…",
horarios: [["Lunes a viernes", "8:30 – 18:00"], ["Sábados", "8:30 – 13:00"]],
```

Mientras estén vacíos, la web muestra textos neutros («Dirección por confirmar…», «Consulta nuestro horario por WhatsApp»).

Cambia también `https://www.breakparts.pe` por tu dominio real en `index.html`, `robots.txt` y `sitemap.xml`, y agrega una imagen `assets/og.jpg` (1200×630) para cuando compartan el enlace en redes.

## Actualizar el catálogo (sin reconstruir la web)

Requisitos una sola vez: Python 3 y `pip install openpyxl pillow`.

1. Abre `admin/catalogo.xlsx` (es el catálogo actual completo).
2. Edita: agrega filas, borra las que ya no vendas, corrige descripciones, marcas o medidas.
3. Fotos nuevas o de reemplazo: ponlas en una carpeta, nombradas con el código (`30610-01J60NBN.jpg`).
4. Ejecuta desde la carpeta del sitio:
   ```
   python3 admin/importar_excel.py admin/catalogo.xlsx --fotos carpeta_de_fotos/
   ```
5. Sube `data/productos.json`, `data/productos.js` y la carpeta `img/` al hosting. Listo.

Para volver a sacar el Excel desde la web publicada: `python3 admin/exportar_excel.py catalogo.xlsx`.

Las familias y subfamilias nuevas aparecen solas en los filtros y en las categorías.

## Panel administrativo con contraseña

No se incluye un panel con contraseña dentro de la página: un panel en un sitio estático sería público aunque «pida» clave. El archivo original traía un hash de contraseña en el HTML y **no** se copió.

Si más adelante quieren editar desde el navegador, la opción recomendada es un CMS con autenticación real del proveedor (por ejemplo Decap CMS con inicio de sesión de GitHub/Netlify, o una pequeña API con Supabase Auth) que escriba el mismo `data/productos.json`. La web no necesita cambios para eso.

## Enlaces que se pueden compartir

El catálogo guarda la búsqueda en la dirección: `?familia=piston&medida=5/8`, `?q=hilux`, `?producto=30610-01j60nbn` (abre la ficha directamente).

## Rendimiento

- Fotos en WebP, miniaturas de ~6 KB, `loading="lazy"`.
- Catálogo por páginas de 24 productos con botón «Mostrar más».
- Búsqueda y filtros en memoria: instantáneos con los 2,755 productos.
- El sistema 3D de la portada usa CSS 3D, sin librerías, y se pausa cuando no está a la vista. Con «reducir movimiento» activado no gira solo.
- Sin frameworks ni dependencias de compilación.

## Cómo ver la página

- **Con doble clic** en `index.html`: funciona, gracias a `data/productos.js`.
- **Con un servidor local** (recomendado para probar igual que en internet): en VS Code, extensión *Live Server* → clic derecho en `index.html` → «Open with Live Server». O con Python: `python -m http.server 8000` y abre `http://localhost:8000`.

## Colores y portada

La paleta está al inicio de `assets/app.css` (`--navy`, `--brand`, `--sky`, `--paper`). Cambiando esos valores cambia toda la página.

Las piezas del 3D están en `assets/piezas/`. Para cambiar nombres o a qué familia lleva cada una, define `window.BP_HERO3D` en `assets/config.js` (el formato está explicado al inicio de `assets/hero3d.js`).

## Mensajes de WhatsApp

La cotización y la consulta de un producto envían **solo el código** y la cantidad, sin descripción, marca ni medida. Lo que se escribe a mano en «¿No lo encuentras en el catálogo?» se envía como texto, porque no tiene código.
