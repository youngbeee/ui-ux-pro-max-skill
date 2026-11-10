"""
BREAK PARTS · Exportar el catálogo actual a Excel (para editarlo)
Uso (desde la carpeta del sitio):  python3 admin/exportar_excel.py catalogo.xlsx
Requisitos: pip install openpyxl
"""
import json, os, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
salida = sys.argv[1] if len(sys.argv) > 1 else "catalogo.xlsx"
d = json.load(open(f"{RAIZ}/data/productos.json", encoding="utf-8"))
F = d["campos"]; ix = {k: F.index(k) for k in F}
wb = Workbook(); ws = wb.active; ws.title = "Catálogo"
ws.append(["Código", "Descripción", "Marca", "Medida", "Familia", "Subfamilia", "Tiene foto"])
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="111318")
for r in d["items"]:
    ws.append([r[ix["cod"]], r[ix["desc"]], r[ix["marca"]], r[ix["medida"]], r[ix["fam"]], r[ix["sub"]], "Sí" if r[ix["img"]] else "No"])
for col, w in zip("ABCDEFG", [22, 70, 14, 12, 14, 26, 11]):
    ws.column_dimensions[col].width = w
ws.freeze_panes = "A2"; ws.auto_filter.ref = ws.dimensions
wb.save(salida)
print(f"Exportado: {len(d['items'])} productos → {salida}")
