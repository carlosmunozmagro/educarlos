#!/usr/bin/env python3
"""Coste real del primer trabajador — lección 29.

Genera visuals/sociedades-es/coste-empleado.svg y imprime las cifras dibujadas
para poder contrastarlas con el texto de la lección.
"""
from pathlib import Path

BRUTO = 24_000.00          # sueldo bruto anual, 12 pagas de 2.000 €
BASE_MES = 2_000.00        # base de cotización mensual
TIPO_EMPRESA = 0.3065      # 23,60 + 5,50 + 0,20 + 0,60 + 0,75 (sin AT/EP)
MESES = 12

# Impuesto sobre Sociedades 2027, escala de microempresa (lección 06)
TRAMO = 50_000.00
TIPO_BAJO, TIPO_ALTO = 0.17, 0.20
BASE_SIN = 60_000.00


def cuota_is(base):
    return base * TIPO_BAJO if base <= TRAMO else TRAMO * TIPO_BAJO + (base - TRAMO) * TIPO_ALTO


cuota_patronal = BASE_MES * TIPO_EMPRESA * MESES
coste_bruto = BRUTO + cuota_patronal
base_con = BASE_SIN - coste_bruto
ahorro = cuota_is(BASE_SIN) - cuota_is(base_con)
coste_neto = coste_bruto - ahorro

BARRAS = [
    ("Lo que crees que cuesta", BRUTO, "cold"),
    ("Coste bruto para Ámbar", coste_bruto, "hot"),
    ("Coste neto tras el IS", coste_neto, "hot"),
]

M, ANCHO, ALTO_B, PASO = 6.0, 178.0, 20.0, 34.0
tope = max(v for _, v, _ in BARRAS)
H = 22 + PASO * len(BARRAS) + 16


def eur(v):
    return f"{v:,.0f} €".replace(",", ".")


out = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
out.append(f'<text class="dim" x="{M}" y="13" font-size="10">'
           f'Nuria, 24.000 € brutos, indefinida, 2027</text>')
for i, (etiqueta, valor, clase) in enumerate(BARRAS):
    y = 26 + PASO * i
    w = ANCHO * valor / tope
    assert M + ANCHO + 60 <= 300, "la barra y su cifra se salen del lienzo"
    out.append(f'<text class="lbl" x="{M}" y="{y + 8:.1f}" font-size="11">{etiqueta}</text>')
    out.append(f'<rect class="{clase}" x="{M}" y="{y + 12:.1f}" '
               f'width="{w:.1f}" height="{ALTO_B}" rx="3"/>')
    out.append(f'<text class="accent" x="{M + ANCHO + 6:.0f}" y="{y + 26:.1f}" '
               f'font-size="10" font-weight="700">{eur(valor)}</text>')
out.append(f'<text class="dim" x="{M}" y="{H - 6:.0f}" font-size="10">'
           f'Más la prima de accidentes, que depende de la actividad.</text>')
out.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "coste-empleado.svg"
destino.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"cuota patronal anual : {cuota_patronal:,.2f} €")
print(f"coste bruto          : {coste_bruto:,.2f} €")
print(f"base con Nuria       : {base_con:,.2f} €")
print(f"cuota IS sin Nuria   : {cuota_is(BASE_SIN):,.2f} €")
print(f"cuota IS con Nuria   : {cuota_is(base_con):,.2f} €")
print(f"ahorro de cuota      : {ahorro:,.2f} €")
print(f"coste neto           : {coste_neto:,.2f} €")
print(f"coste neto / bruto   : {coste_neto / coste_bruto:.1%}")
print(f"-> {destino}")
