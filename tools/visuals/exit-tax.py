#!/usr/bin/env python3
"""Las dos puertas del impuesto de salida — lección 47.

Basta con cruzar una. Se dibuja dónde cae cada socio de Nortia.
"""
from pathlib import Path

VALORACION = 2_500_000.00     # post-money de la lección 37
UMBRAL_TOTAL = 4_000_000.00
UMBRAL_PARTICIPACION = 0.25
UMBRAL_VALOR_ENTIDAD = 1_000_000.00

SOCIOS = [("Álvaro", 0.36), ("Rosa", 0.28), ("Kenji", 0.16)]

M, ANCHO, H = 6.0, 200.0, 176.0
assert M + ANCHO + 80 <= 300, "las barras y sus cifras se salen del lienzo"
escala = ANCHO / UMBRAL_VALOR_ENTIDAD


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="13" font-size="10">'
           f'Puerta 2: más del 25 % y más de {eur(UMBRAL_VALOR_ENTIDAD)}</text>')
resultados = []
for i, (nombre, pct) in enumerate(SOCIOS):
    valor = VALORACION * pct
    cruza = pct > UMBRAL_PARTICIPACION and valor > UMBRAL_VALOR_ENTIDAD
    resultados.append((nombre, pct, valor, cruza))
    y = 24 + i * 32
    w = min(valor * escala, ANCHO)
    out.append(f'<text x="{M}" y="{y + 10:.0f}" font-size="11">{nombre}  {pct:.0%}</text>')
    out.append(f'<rect class="{"hot" if cruza else "cold"}" x="{M}" y="{y + 14:.0f}" '
               f'width="{w:.1f}" height="12" rx="2"/>')
    out.append(f'<text class="dim" x="{M + ANCHO + 6:.0f}" y="{y + 24:.0f}" font-size="10">'
               f'{eur(valor)}</text>')
linea = M + UMBRAL_VALOR_ENTIDAD * escala
out.append(f'<line class="line" x1="{linea:.1f}" y1="20" x2="{linea:.1f}" y2="120" '
           f'stroke-dasharray="3 3"/>')
out.append(f'<text class="accent" x="{M}" y="140" font-size="11" font-weight="700">'
           f'Nadie la cruza — hoy</text>')
out.append(f'<text class="dim" x="{M}" y="154" font-size="10">'
           f'A Álvaro le faltan {eur(UMBRAL_VALOR_ENTIDAD - VALORACION * 0.36)}</text>')
out.append(f'<text class="dim" x="{M}" y="170" font-size="10">'
           f'Una ronda a mayor valoración lo mete dentro.</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "exit-tax.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

for nombre, pct, valor, cruza in resultados:
    print(f"{nombre:8s} {pct:.0%}  {valor:>12,.2f} €  ¿cruza?: {'sí' if cruza else 'no'}")
print(f"a Álvaro le faltan: {UMBRAL_VALOR_ENTIDAD - VALORACION * 0.36:,.2f} €")
print(f"-> {destino}")
