#!/usr/bin/env python3
"""Qué compra un inversor y qué pasa con el capital — lección 37.

Imprime el desglose para contrastarlo con el texto de la lección.
"""
from pathlib import Path

CAPITAL_PREVIO = 60_000        # participaciones de 1 € de nominal
NOMINAL = 1.00
INVERSION = 500_000.00
PORCENTAJE_POST = 0.20

# participaciones nuevas para que el inversor tenga el 20 % del capital final
nuevas = round(CAPITAL_PREVIO * PORCENTAJE_POST / (1 - PORCENTAJE_POST))
precio = INVERSION / nuevas
prima_unitaria = precio - NOMINAL
capital_nuevo = nuevas * NOMINAL
prima_total = INVERSION - capital_nuevo
capital_final = CAPITAL_PREVIO + nuevas
post_money = INVERSION / PORCENTAJE_POST

SOCIOS = [("Álvaro", 0.45), ("Rosa", 0.35), ("Kenji", 0.20)]

M, ANCHO, H = 6.0, 288.0, 152.0
assert M + ANCHO <= 300, "la barra se sale del lienzo"
w_capital = ANCHO * capital_nuevo / INVERSION


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="14" font-size="10">'
           f'Vega pone {eur(INVERSION)} por el {PORCENTAJE_POST:.0%}</text>')
out.append(f'<rect class="cold" x="{M}" y="22" width="{ANCHO}" height="26" rx="3"/>')
out.append(f'<rect class="hot" x="{M}" y="22" width="{max(w_capital, 2.0):.1f}" height="26" rx="3"/>')
out.append(f'<text class="lbl" x="{M + 14:.0f}" y="39" font-size="11">'
           f'Prima de emisión — {eur(prima_total)}</text>')
out.append(f'<text class="accent" x="{M}" y="62" font-size="11" font-weight="700">'
           f'Al capital sólo van {eur(capital_nuevo)}</text>')
out.append(f'<text class="dim" x="{M}" y="76" font-size="10">'
           f'el {capital_nuevo / INVERSION:.0%} de lo que entra</text>')

y = 98
out.append(f'<text class="dim" x="{M}" y="{y:.0f}" font-size="10">Y los de siempre bajan:</text>')
for i, (nombre, antes) in enumerate(SOCIOS):
    despues = antes * (1 - PORCENTAJE_POST)
    out.append(f'<text x="{M:.0f}" y="{y + 16 + i * 15:.0f}" font-size="11">'
               f'{nombre}  {antes:.0%} → {despues:.0%}</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "prima-y-dilucion.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"participaciones nuevas : {nuevas:,}")
print(f"precio por participación: {precio:,.2f} €  (nominal {NOMINAL:.2f} + prima {prima_unitaria:,.2f})")
print(f"capital: {CAPITAL_PREVIO:,} -> {capital_final:,} €")
print(f"prima total            : {prima_total:,.2f} €")
print(f"valoración post-money  : {post_money:,.0f} €   pre-money: {post_money - INVERSION:,.0f} €")
for nombre, antes in SOCIOS:
    print(f"  {nombre}: {antes:.0%} -> {antes * (1 - PORCENTAJE_POST):.0%}")
print(f"-> {destino}")
