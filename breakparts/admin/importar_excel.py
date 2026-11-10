"""
BREAK PARTS · Importar o actualizar el catálogo desde Excel
=============================================================

Uso (desde la carpeta del sitio):
    python3 admin/importar_excel.py catalogo.xlsx                 # solo datos
    python3 admin/importar_excel.py catalogo.xlsx --fotos fotos/  # datos + fotos nuevas

El Excel (o CSV) debe tener estas columnas en la primera fila (el orden no importa):
    Código | Descripción | Marca | Medida | Familia | Subfamilia

- Agregar productos: añade filas.  Eliminar: borra la fila.  Editar: cambia la celda.
- Fotos: nómbralas con el código del producto (ej. 30610-01J60NBN.jpg). Se aceptan JPG, PNG y WEBP.
  Se convierten a WebP (520 px) y se crea la miniatura (320 px). Una foto nueva reemplaza la anterior.
- El resultado se escribe en data/productos.json y data/productos.js. Sube ambos (y la carpeta img/ si agregaste fotos)
  a tu hosting: la web se actualiza sin reconstruir nada.

Requisitos: pip install openpyxl pillow
"""
import csv, json, os, re, sys, datetime, unicodedata

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow: pip install pillow")

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = {
    "cod": r"^(COD|SKU|REFER|NUMERO DE PARTE)",
    "desc": r"^(DESCR|PRODUCTO|NOMBRE|DETALLE)",
    "marca": r"^MARCA",
    "medida": r"^MEDIDA",
    "fam": r"^(FAMILIA|CATEGOR|TIPO)",
    "sub": r"^SUB",
}

def limpio(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().upper().strip()
    return re.sub(r"\s+", " ", s)

def slugify(code):
    return re.sub(r"[^a-z0-9]+", "-", str(code).lower()).strip("-") or "producto"

def leer(ruta):
    if ruta.lower().endswith((".csv", ".txt")):
        with open(ruta, encoding="utf-8-sig") as f:
            primera = f.readline(); f.seek(0)
            filas = list(csv.reader(f, delimiter=";" if primera.count(";") > primera.count(",") else ","))
    else:
        try:
            import openpyxl
        except ImportError:
            sys.exit("Falta openpyxl: pip install openpyxl")
        ws = openpyxl.load_workbook(ruta, read_only=True, data_only=True).active
        filas = [["" if c is None else str(c).strip() for c in r] for r in ws.iter_rows(values_only=True)]
    cab = [limpio(c) for c in filas[0]]
    mapa = {}
    for k, rx in COLS.items():
        for i, c in enumerate(cab):
            if re.match(rx, c) and i not in mapa.values() and not (k == "fam" and c.startswith("SUB")):
                mapa[k] = i; break
    if "cod" not in mapa:
        sys.exit("No encontré la columna 'Código' en la primera fila.")
    return filas[1:], mapa

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    filas, mapa = leer(sys.argv[1])
    fotos = sys.argv[sys.argv.index("--fotos") + 1] if "--fotos" in sys.argv else None
    os.makedirs(f"{RAIZ}/img/p", exist_ok=True); os.makedirs(f"{RAIZ}/img/t", exist_ok=True)

    nuevas = {}
    if fotos:
        for f in os.listdir(fotos):
            base, ext = os.path.splitext(f)
            if ext.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                nuevas[limpio(base)] = os.path.join(fotos, f)

    g = lambda r, k: (str(r[mapa[k]]).strip() if k in mapa and mapa[k] < len(r) and r[mapa[k]] is not None else "")
    rows, vistos, usados, sin_foto, convertidas = [], set(), set(), 0, 0
    for r in filas:
        cod = g(r, "cod")
        if not cod or cod in vistos:
            continue
        vistos.add(cod)
        slug = base = slugify(cod); n = 2
        while slug in usados:
            slug = f"{base}-{n}"; n += 1
        usados.add(slug)
        src = nuevas.pop(limpio(cod), None)
        if src:
            im = Image.open(src).convert("RGB")
            full = im.copy(); full.thumbnail((520, 520), Image.LANCZOS); full.save(f"{RAIZ}/img/p/{slug}.webp", "WEBP", quality=82, method=6)
            th = im.copy(); th.thumbnail((320, 320), Image.LANCZOS); th.save(f"{RAIZ}/img/t/{slug}.webp", "WEBP", quality=80, method=6)
            convertidas += 1
        tiene = os.path.exists(f"{RAIZ}/img/t/{slug}.webp")
        sin_foto += not tiene
        rows.append([cod, g(r, "desc"), g(r, "marca").upper(), g(r, "medida"), g(r, "fam").upper(), g(r, "sub").upper(), slug, 1 if tiene else 0])

    doc = {"v": 2, "generado": datetime.date.today().isoformat(),
           "campos": ["cod", "desc", "marca", "medida", "fam", "sub", "slug", "img"], "items": rows}
    with open(f"{RAIZ}/data/productos.json", "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, separators=(",", ":"))
    # Respaldo para abrir la página con doble clic (file://), donde el navegador no deja leer el JSON
    with open(f"{RAIZ}/data/productos.js", "w", encoding="utf-8") as f:
        f.write("window.BP_PRODUCTOS = " + json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"Listo: {len(rows)} productos · {len(rows) - sin_foto} con foto · {convertidas} fotos nuevas.")
    if nuevas:
        print(f"Atención: {len(nuevas)} fotos no coinciden con ningún código:", ", ".join(list(nuevas)[:15]))

if __name__ == "__main__":
    main()
