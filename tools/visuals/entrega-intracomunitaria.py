#!/usr/bin/env python3
"""Las tres condiciones de la entrega intracomunitaria exenta — lección 39."""
from pathlib import Path

BASE = 180_000.00
TIPO_GENERAL = 0.21
iva_expuesto = BASE * TIPO_GENERAL

CONDICIONES = ["Transporte a otro Estado", "NIF-IVA válido en VIES", "Declarada en el 349"]

M, H = 6.0, 172.0
ANCHO_C = (288.0 - 2 * 6.0) / 3      # tres cajas con 6 de hueco
assert M + ANCHO_C * 3 + 12 <= 300, "las cajas se salen del lienzo"


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="14" font-size="10">'
           f'Factura de {eur(BASE)} a un cliente francés</text>')
for i, texto in enumerate(CONDICIONES):
    x = M + i * (ANCHO_C + 6)
    out.append(f'<rect class="box" x="{x:.1f}" y="22" width="{ANCHO_C:.1f}" height="44" rx="3"/>')
    palabras = texto.split()
    mitad = (len(palabras) + 1) // 2
    out.append(f'<text x="{x + 6:.1f}" y="42" font-size="10">{" ".join(palabras[:mitad])}</text>')
    out.append(f'<text x="{x + 6:.1f}" y="56" font-size="10">{" ".join(palabras[mitad:])}</text>')
out.append(f'<rect class="hot" x="{M}" y="76" width="288" height="26" rx="3"/>')
out.append(f'<text class="lbl" x="{M + 8:.0f}" y="93" font-size="11">'
           f'Exenta — art. 25 LIVA</text>')
out.append(f'<text class="dim" x="{M}" y="122" font-size="10">Si falla la del medio:</text>')
out.append(f'<text class="accent" x="{M}" y="140" font-size="11" font-weight="700">'
           f'{eur(iva_expuesto)} de IVA que nadie cobró</text>')
out.append(f'<text class="dim" x="{M}" y="158" font-size="10">'
           f'el {TIPO_GENERAL:.0%} de la factura, a cargo de quien la emitió</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "entrega-intracomunitaria.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"base            : {BASE:,.2f} €")
print(f"IVA al {TIPO_GENERAL:.0%}     : {iva_expuesto:,.2f} €")
print(f"-> {destino}")
