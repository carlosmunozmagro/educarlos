#!/usr/bin/env python3
"""Lo que hace la consolidación fiscal con dos bases — lección 46."""
from pathlib import Path

BASE_NORTIA = 400_000.00
BASE_NUEVASOFT = -180_000.00
TIPO = 0.20          # senda de la DT 44.ª, ejercicio 2034 (lección 06)

base_grupo = BASE_NORTIA + BASE_NUEVASOFT
cuota_separadas = BASE_NORTIA * TIPO          # la negativa no resta: se guarda como BIN
cuota_grupo = base_grupo * TIPO
diferencia = cuota_separadas - cuota_grupo

M, ANCHO, H = 6.0, 288.0, 174.0
assert M + ANCHO <= 300, "las barras se salen del lienzo"
escala = ANCHO / BASE_NORTIA


def eur(v):
    return f"{abs(v):,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="13" font-size="10">Ejercicio 2034</text>')
out.append(f'<text x="{M}" y="30" font-size="11">Nortia</text>')
out.append(f'<rect class="hot" x="{M}" y="36" width="{BASE_NORTIA * escala:.1f}" height="18" rx="3"/>')
out.append(f'<text class="dim" x="{M + 6:.0f}" y="49" font-size="10">+{eur(BASE_NORTIA)}</text>')
out.append(f'<text x="{M}" y="72" font-size="11">NuevaSoft</text>')
out.append(f'<rect class="cold" x="{M}" y="78" width="{abs(BASE_NUEVASOFT) * escala:.1f}" height="18" rx="3"/>')
out.append(f'<text class="dim" x="{M + 6:.0f}" y="91" font-size="10">−{eur(BASE_NUEVASOFT)}</text>')
out.append(f'<line class="line" x1="{M}" y1="104" x2="{M + ANCHO:.0f}" y2="104"/>')
out.append(f'<text class="lbl" x="{M}" y="122" font-size="11">Base del grupo</text>')
out.append(f'<rect class="hot" x="{M}" y="128" width="{base_grupo * escala:.1f}" height="18" rx="3"/>')
out.append(f'<text class="dim" x="{M + 6:.0f}" y="141" font-size="10">{eur(base_grupo)}</text>')
out.append(f'<text class="accent" x="{M}" y="162" font-size="11" font-weight="700">'
           f'{eur(diferencia)} de cuota, este año y no dentro de cinco</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "consolidacion.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"base Nortia        : {BASE_NORTIA:,.2f} €")
print(f"base NuevaSoft     : {BASE_NUEVASOFT:,.2f} €")
print(f"base del grupo     : {base_grupo:,.2f} €")
print(f"cuota por separado : {cuota_separadas:,.2f} €")
print(f"cuota consolidando : {cuota_grupo:,.2f} €")
print(f"diferencia         : {diferencia:,.2f} €")
print(f"-> {destino}")
