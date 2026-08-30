#!/usr/bin/env python3
"""Las dos reducciones del art. 188 LGT — lección 36.

Se aplican en cascada, no se suman. Imprime los importes dibujados.
"""
from pathlib import Path

CUOTA = 4_800.00        # cuota dejada de ingresar
TIPO_LEVE = 0.50        # art. 191: infracción leve
CONFORMIDAD = 0.30      # art. 188.1
PRONTO_PAGO = 0.40      # art. 188.3

sancion = CUOTA * TIPO_LEVE
tras_conformidad = sancion * (1 - CONFORMIDAD)
tras_pronto_pago = tras_conformidad * (1 - PRONTO_PAGO)

PASOS = [
    ("Sanción del 50 %", sancion),
    ("−30 % conformidad", tras_conformidad),
    ("−40 % pronto pago", tras_pronto_pago),
]

M, ANCHO, ALTO_B, PASO = 6.0, 150.0, 22.0, 34.0
H = 24 + PASO * len(PASOS) + 34
assert M + ANCHO + 70 <= 300, "las barras y sus cifras se salen del lienzo"


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="14" font-size="10">'
           f'Sobre 4.800 € dejados de ingresar</text>')
for i, (etiqueta, valor) in enumerate(PASOS):
    y = 24 + PASO * i
    w = ANCHO * valor / sancion
    clase = "hot" if i < len(PASOS) - 1 else "cold"
    out.append(f'<rect class="{clase}" x="{M}" y="{y:.1f}" '
               f'width="{w:.1f}" height="{ALTO_B}" rx="3"/>')
    out.append(f'<text class="dim" x="{M + 6:.0f}" y="{y + 15:.1f}" font-size="10">'
               f'{etiqueta}</text>')
    out.append(f'<text class="accent" x="{M + ANCHO + 8:.0f}" y="{y + 15:.1f}" '
               f'font-size="11" font-weight="700">{eur(valor)}</text>')
out.append(f'<text class="lbl" x="{M}" y="{H - 20:.0f}" font-size="11">'
           f'Recurrir devuelve la sanción a {eur(sancion)}</text>')
out.append(f'<text class="dim" x="{M}" y="{H - 6:.0f}" font-size="10">'
           f'La diferencia, {eur(sancion - tras_pronto_pago)}, es el precio de discutir.</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "reducciones-sancion.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"sanción base (50 % de {CUOTA:,.0f}) : {sancion:,.2f} €")
print(f"tras conformidad (−30 %)        : {tras_conformidad:,.2f} €")
print(f"tras pronto pago (−40 %)        : {tras_pronto_pago:,.2f} €")
print(f"reducción total                 : {1 - tras_pronto_pago / sancion:.1%}")
print(f"coste de recurrir y perder      : {sancion - tras_pronto_pago:,.2f} €")
print(f"-> {destino}")
