#!/usr/bin/env python3
"""El diferimiento del régimen especial — lección 40.

No es una exención: la plusvalía latente viaja con el valor fiscal antiguo.
"""
from pathlib import Path

VALOR_MERCADO = 1_200_000.00
VALOR_FISCAL = 400_000.00
TIPO_IS = 0.20            # senda de la DT 44.ª, ejercicio 2033 (lección 06)

plusvalia = VALOR_MERCADO - VALOR_FISCAL
cuota_evitada = plusvalia * TIPO_IS

M, ANCHO, H = 6.0, 288.0, 166.0
assert M + ANCHO <= 300, "la barra se sale del lienzo"
w_fiscal = ANCHO * VALOR_FISCAL / VALOR_MERCADO


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="14" font-size="10">'
           f'La rama que se escinde vale {eur(VALOR_MERCADO)}</text>')
out.append(f'<rect class="cold" x="{M}" y="22" width="{ANCHO}" height="28" rx="3"/>')
out.append(f'<rect class="hot" x="{M}" y="22" width="{w_fiscal:.1f}" height="28" rx="3"/>')
out.append(f'<text class="lbl" x="{M + 8:.0f}" y="41" font-size="11">'
           f'{eur(VALOR_FISCAL)}</text>')
out.append(f'<text class="dim" x="{M + w_fiscal + 8:.0f}" y="41" font-size="10">'
           f'plusvalía latente {eur(plusvalia)}</text>')
out.append(f'<text class="dim" x="{M}" y="70" font-size="10">valor fiscal, que es el que viaja</text>')
out.append(f'<text class="lbl" x="{M}" y="98" font-size="11">'
           f'Hoy no se tributa: {eur(cuota_evitada)} aplazados</text>')
out.append(f'<text class="dim" x="{M}" y="114" font-size="10">'
           f'al {TIPO_IS:.0%} sobre la plusvalía latente</text>')
out.append(f'<text class="accent" x="{M}" y="140" font-size="11" font-weight="700">'
           f'Y sólo si hay motivo económico válido</text>')
out.append(f'<text class="dim" x="{M}" y="156" font-size="10">'
           f'art. 89.2 — se juzga después, no antes</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "diferimiento-feac.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"valor de mercado : {VALOR_MERCADO:,.2f} €")
print(f"valor fiscal     : {VALOR_FISCAL:,.2f} €")
print(f"plusvalía latente: {plusvalia:,.2f} €")
print(f"cuota aplazada   : {cuota_evitada:,.2f} €  (al {TIPO_IS:.0%})")
print(f"-> {destino}")
