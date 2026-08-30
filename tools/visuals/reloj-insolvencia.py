#!/usr/bin/env python3
"""El reloj de la insolvencia — lección 34.

Dibuja las dos rutas que arrancan el mismo día y las fechas a las que llevan.
Imprime las fechas calculadas para contrastarlas con el texto de la lección.
"""
from datetime import date
from pathlib import Path

MESES = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
         "agosto", "septiembre", "octubre", "noviembre", "diciembre")


def suma_meses(d: date, n: int) -> date:
    mes = d.month - 1 + n
    return date(d.year + mes // 12, mes % 12 + 1, d.day)


def corto(d: date) -> str:
    return f"{d.day} {MESES[d.month - 1][:3]}"


INICIO = date(2030, 3, 15)          # Ámbar conoce su insolvencia actual
LIMITE_ART5 = suma_meses(INICIO, 2)  # art. 5 TRLC: dos meses
FIN_ESCUDO = suma_meses(INICIO, 3)   # art. 607: tres meses de protección
FIN_PRORROGA = suma_meses(FIN_ESCUDO, 3)   # prorrogables hasta tres más
LIMITE_TRAS_PRORROGA = suma_meses(FIN_PRORROGA, 1)  # y un mes para pedir el concurso

X0, X1, H = 34.0, 288.0, 150.0
TOTAL_MESES = 7
assert X1 <= 300, "la línea se sale del lienzo"


def x_de(d: date) -> float:
    meses = (d.year - INICIO.year) * 12 + d.month - INICIO.month
    return X0 + (X1 - X0) * meses / TOTAL_MESES


svg = [f'<svg viewBox="0 0 300 {H:.0f}" xmlns="http://www.w3.org/2000/svg">']
svg.append(f'<text class="dim" x="6" y="13" font-size="10">'
           f'{INICIO.day} de {MESES[INICIO.month - 1]}: Ámbar sabe que no puede pagar</text>')

# ruta A — no hacer nada más que cumplir el deber
svg.append(f'<text class="lbl" x="6" y="38" font-size="11">Deber</text>')
svg.append(f'<line class="line" x1="{x_de(INICIO):.1f}" y1="46" '
           f'x2="{x_de(LIMITE_ART5):.1f}" y2="46" stroke-width="6"/>')
svg.append(f'<text class="accent" x="{x_de(LIMITE_ART5) + 5:.1f}" y="50" '
           f'font-size="10" font-weight="700">{corto(LIMITE_ART5)}</text>')
svg.append(f'<text class="dim" x="{X0:.0f}" y="64" font-size="10">'
           f'dos meses para pedir el concurso — art. 5</text>')

# ruta B — comunicación del art. 585
svg.append(f'<text class="lbl" x="6" y="90" font-size="11">Escudo</text>')
svg.append(f'<line class="line" x1="{x_de(INICIO):.1f}" y1="98" '
           f'x2="{x_de(FIN_ESCUDO):.1f}" y2="98" stroke-width="6"/>')
svg.append(f'<line class="line" x1="{x_de(FIN_ESCUDO):.1f}" y1="98" '
           f'x2="{x_de(FIN_PRORROGA):.1f}" y2="98" stroke-width="6" stroke-dasharray="3 3"/>')
svg.append(f'<text class="accent" x="{x_de(FIN_PRORROGA) - 40:.1f}" y="114" '
           f'font-size="10" font-weight="700">{corto(LIMITE_TRAS_PRORROGA)}</text>')
svg.append(f'<text class="dim" x="{X0:.0f}" y="128" font-size="10">'
           f'3 meses + 3 de prórroga, y un mes más</text>')
svg.append(f'<text class="dim" x="6" y="144" font-size="10">'
           f'El escudo no borra el deber: lo aplaza.</text>')
svg.append('</svg>')

destino = Path(__file__).resolve().parents[2] / "visuals" / "sociedades-es" / "reloj-insolvencia.svg"
destino.write_text("\n".join(svg) + "\n", encoding="utf-8")

print(f"conoce la insolvencia      : {INICIO}")
print(f"límite del art. 5          : {LIMITE_ART5}")
print(f"fin de los 3 meses (art. 607): {FIN_ESCUDO}")
print(f"fin de la prórroga         : {FIN_PRORROGA}")
print(f"y un mes más               : {LIMITE_TRAS_PRORROGA}")
print(f"-> {destino}")
