# FRENOS PARTS ESTOC · Sitio web

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
| `assets/admin.js`, `assets/admin.css` | Panel de administración con contraseña (Excel, fotos, descarga en un solo HTML) |
| `admin/` | Herramienta de línea de comandos para actualizar el catálogo desde Excel |
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

## Pantalla de entrada: usuario o invitado

Al abrir la página aparece la pantalla **«¿Cómo quieres entrar?»**:

- **Entrar con usuario:** se ven los códigos de los productos en las tarjetas y en la ficha, y se puede ordenar por código.
- **Entrar como invitado:** el catálogo se ve sin códigos, como antes.
- En los dos casos el mensaje de cotización por WhatsApp lleva los códigos.
- Cada navegador recuerda su elección. El botón con el ícono de persona en la cabecera (dice «Invitado» o el nombre del usuario) vuelve a abrir la pantalla para cambiar de modo.
- Usuario inicial: **`fpe`** con contraseña **`Codigos2026`**. Los usuarios se crean y se borran en el panel, pestaña «Accesos». También se puede entrar con el usuario `admin` y la contraseña del panel.
- Es una forma de presentar el catálogo, no una protección de datos: los códigos viajan dentro de la página porque la cotización los necesita.
- Archivos: `assets/acceso.js`, `assets/acceso.css`.

## Panel de administración (Excel, fotos y descarga en un solo HTML)

Se abre con el enlace **«Administrar»** del pie de página, o agregando `#admin` a la dirección. Contraseña inicial: **`Frenos2026`** (cámbiala en la pestaña «Contraseña»).

| Pestaña | Qué hace |
|---|---|
| Productos (Excel) | Lee un `.xlsx`, `.xls` o `.csv` con las columnas Código, Descripción, Marca, Medida, Familia, Subfamilia. Muestra una vista previa (nuevos, con cambios, sin cambios) y deja **combinar** o **reemplazar** el catálogo. También descarga una plantilla y el Excel con los productos actuales. |
| Fotos | Arrastra fotos o una carpeta. Cada foto se nombra con el código del producto (`30610-01J60NBN.jpg`), se ajusta a 520 px y se guarda en WebP. |
| Descargar HTML | Genera **toda la página en un solo archivo HTML** (diseño, programas, productos, fotos y este mismo panel). Se abre con doble clic y funciona sin internet. Calidad de fotos: normal (≈14 MB), alta o sin fotos del catálogo. |
| Accesos | Crea y borra los usuarios que ven los códigos, y cambia la contraseña del panel. Todo queda guardado en el próximo HTML que descargues. |

Cómo funciona:

- Los cambios se hacen en el navegador y **se guardan al descargar el HTML**. Mientras no lo descargues, el panel muestra un aviso y el navegador pregunta antes de cerrar la pestaña.
- Desde el archivo de un solo HTML se puede volver a cargar Excel y fotos y descargar una versión nueva, sin internet.
- Si la página se abre desde la carpeta con doble clic, el navegador no deja leer sus propios archivos y la descarga del HTML no está disponible: usa `FRENOS-PARTS-ESTOC.html` (versión de un solo archivo) o el sitio publicado.
- Para un hosting con carpetas, la pestaña Productos también descarga `productos.json` y `productos.js` para reemplazar en `data/`.
- La contraseña se guarda solo como huella SHA-256 (`<script id="bp-admin">`). En una página estática es un candado para el panel, no una cuenta de servidor: los cambios solo afectan a la copia de quien los hace y al archivo que descarga, nunca a la web publicada.
- Archivos: `assets/admin.js`, `assets/admin.css`, `assets/vendor/xlsx.full.min.js` (lector de Excel SheetJS 0.18.5, licencia Apache 2.0).

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

## Estante de destacados y página de producto

La sección «Destacados del catálogo» muestra 8 repuestos de pie sobre dos repisas. Al tocar uno, la pieza viaja hasta la página del producto; al volver, regresa a su lugar. Lo mismo pasa con cualquier tarjeta del catálogo.

- Los 8 destacados están en la lista `SHELF`, dentro de `assets/app.js`: producto, nombre corto y vehículo.
- Cada destacado necesita su foto recortada (fondo transparente) en `assets/estante/`, con el mismo nombre que la foto del catálogo.
- En la página del producto, la pieza se puede arrastrar para girarla. Es un giro de la foto, no un modelo 3D.

Esta parte adapta a HTML, CSS y JavaScript el componente «Product Shelf» de Aakash Mehra (aakashmehra.com), que está hecho en React. La página no usa React para que siga abriéndose con doble clic y se pueda subir a cualquier hosting sin compilar.
