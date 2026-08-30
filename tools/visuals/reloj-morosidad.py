#!/usr/bin/env python3
"""Lo que se devenga solo cuando no te pagan — lección 42.

El tipo del BCE es perecedero: aquí se usa un valor de ejemplo, etiquetado
como tal en la lección. Lo verificable es el diferencial de ocho puntos.
"""
from pathlib import Path

FACTURA = 180_000.00
DIAS_DEFECTO = 30
DIAS_TOPE = 60
DIAS_REALES = 150          # Agri-Sud paga a 150 días
BCE_EJEMPLO = 0.03         # supuesto, no un dato vigente
DIFERENCIAL = 0.08         # art. 7: tipo del BCE + 8 puntos
FIJO_POR_FACTURA = 40.00   # art. 8.1, por cada factura (doctrina del TS)

tipo = BCE_EJEMPLO + DIFERENCIAL
dias_mora = DIAS_REALES - DIAS_TOPE
intereses = FACTURA * tipo * dias_mora / 365
total = intereses + FIJO_POR_FACTURA

M, ANCHO, H = 6.0, 288.0, 168.0
assert M + ANCHO <= 300, "la línea se sale del lienzo"


def x(dias):
    return M + ANCHO * dias / DIAS_REALES


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="14" font-size="10">'
           f'Factura de {eur(FACTURA)}, cobrada a {DIAS_REALES} días</text>')
out.append(f'<rect class="cold" x="{M}" y="24" width="{x(DIAS_TOPE) - M:.1f}" height="22" rx="3"/>')
out.append(f'<rect class="hot" x="{x(DIAS_TOPE):.1f}" y="24" '
           f'width="{x(DIAS_REALES) - x(DIAS_TOPE):.1f}" height="22" rx="3"/>')
out.append(f'<text class="dim" x="{M + 4:.0f}" y="39" font-size="10">en plazo</text>')
out.append(f'<text class="lbl" x="{x(DIAS_TOPE) + 6:.0f}" y="39" font-size="11">'
           f'{dias_mora} días de mora</text>')
for dias, etiqueta in ((DIAS_DEFECTO, "30"), (DIAS_TOPE, "60")):
    out.append(f'<line class="line" x1="{x(dias):.1f}" y1="46" x2="{x(dias):.1f}" y2="54"/>')
    out.append(f'<text class="dim" x="{x(dias) - 5:.1f}" y="66" font-size="10">{etiqueta}</text>')
out.append(f'<text class="dim" x="{M}" y="84" font-size="10">'
           f'30 por defecto · 60 es el tope que se puede pactar</text>')
out.append(f'<text class="lbl" x="{M}" y="110" font-size="11">'
           f'Intereses: {eur(intereses)}</text>')
out.append(f'<text class="dim" x="{M}" y="124" font-size="10">'
           f'tipo del BCE + 8 puntos, devengo automático</text>')
out.append(f'<text class="accent" x="{M}" y="146" font-size="11" font-weight="700">'
           f'Y {FIJO_POR_FACTURA:.0f} € más por cada factura</text>')
out.append(f'<text class="dim" x="{M}" y="160" font-size="10">'
           f'sin pedirlos y sin justificar nada — art. 8.1</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "reloj-morosidad.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"días de mora      : {dias_mora}")
print(f"tipo aplicado     : {tipo:.1%}  (BCE {BCE_EJEMPLO:.1%} de ejemplo + {DIFERENCIAL:.0%})")
print(f"intereses         : {intereses:,.2f} €")
print(f"fijo por factura  : {FIJO_POR_FACTURA:,.2f} €")
print(f"total reclamable  : {total:,.2f} €")
print(f"-> {destino}")
