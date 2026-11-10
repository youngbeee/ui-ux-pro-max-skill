# BREAK PARTS · cambios en la página

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `index.html` | Tu página con el disco 3D reemplazado por el nuevo sistema 3D de piezas y los scripts nuevos enlazados. |
| `assets/hero3d.js`, `assets/hero3d.css` | Sistema 3D: las 8 piezas giran alrededor del logo. Se puede arrastrar, usar las flechas o el teclado. Al hacer clic en la pieza del frente se busca esa familia en el catálogo. No usa librerías externas. |
| `assets/piezas/*.webp` | Las piezas recortadas de tu imagen, con fondo transparente. |
| `assets/fix-catalogo.js` | Arreglo de carga del catálogo y de las imágenes (ver abajo). Debe cargarse antes de `config.js` y `app.js`, como ya está en `index.html`. |
| `herramientas/verificar-imagenes.mjs` | Lista las fotos de `productos.json` que no existen o que tienen mayúsculas distintas en el disco. |
| `herramientas/generar-productos-js.mjs` | Crea `data/productos.js` para poder abrir la página con doble clic. |
| `.nojekyll` | Evita que GitHub Pages ignore archivos si publicas ahí. |

**Copia estos archivos encima de tu sitio** y conserva tus `assets/app.js`, `assets/app.css`, `assets/config.js` y `data/productos.json`, que no se incluyen aquí.

## Por qué no carga el catálogo ni las imágenes

El mensaje «No pudimos cargar el catálogo» aparece cuando `app.js` no puede leer `data/productos.json`. Si el catálogo no carga, tampoco aparecen las fotos. Hay tres causas comunes, y `fix-catalogo.js` cubre las tres:

1. **La página se abrió con doble clic** (la dirección empieza con `file://`). Así el navegador bloquea la lectura del JSON.
   - Lo mejor es abrirla desde un servidor: la extensión *Live Server* de VS Code, o tu hosting.
   - Para usarla con doble clic, ejecuta `node herramientas/generar-productos-js.mjs` una vez (y cada vez que cambies el JSON).
2. **El JSON tiene BOM o caracteres antes del `[`.** Pasa a menudo al exportar desde Excel. Ahora se limpia solo.
3. **Rutas de fotos mal escritas.** El sitio puede estar en una subcarpeta y las rutas empezar con `/`, o el nombre puede tener otras mayúsculas (`FOTO.JPG` frente a `foto.jpg`): Windows no distingue mayúsculas, pero el hosting sí. Ahora cada foto se reintenta con la ruta relativa y con el nombre en minúsculas. Si sigue sin aparecer, se muestra «Sin foto» y la consola del navegador lista las rutas que faltan.

Para encontrar exactamente qué fotos faltan, ejecuta en la carpeta del sitio:

```bash
node herramientas/verificar-imagenes.mjs
```

## Cambiar nombres o búsquedas del 3D

Agrega esto en `assets/config.js` (todos los campos son opcionales salvo `id`):

```js
window.BP_HERO3D = {
  piezas: [
    { id: 'master', nombre: 'Bomba de freno (máster)', buscar: 'bomba de freno' },
    { id: 'servo',  nombre: 'Servofreno', buscar: 'servo' }
    // id = nombre del archivo en assets/piezas/ (sin .webp)
  ]
};
```

## Pendiente: mensaje de WhatsApp solo con códigos

El mensaje se arma dentro de `assets/app.js`, que no se recibió, así que no se pudo modificar todavía. En `app.js`, busca la línea que recorre los productos de la lista. Suele estar cerca de `wa.me` o de `encodeURIComponent`, y se parece a esto:

```js
`${i + 1}. ${p.cod} · ${p.desc} x${p.qty}`
```

Debe quedar sin la descripción:

```js
`${i + 1}. ${p.cod} x${p.qty}`
```

Los productos que agregas a mano («¿No lo encuentras en el catálogo?») no tienen código, así que en esos casos se mantiene el texto.
