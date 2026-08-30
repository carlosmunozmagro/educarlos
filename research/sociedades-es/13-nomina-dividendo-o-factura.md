# Nómina, dividendo o factura

- **Course / lesson**: sociedades-es / 13-nomina-dividendo-o-factura
- **Objective**: calcular qué cuesta cada euro que sacas, por cada vía.
- **Researched**: 2026-08-29
- **PERECEDERA**: alta (depende de tipos de IS, IRPF y escala del ahorro).

## Core mechanism

La pregunta habitual — «¿qué tipo pago?» — está mal planteada. La correcta es: **por cada
euro de beneficio antes de impuestos, ¿cuánto llega a tu bolsillo?** Porque las tres vías no
tratan igual a la sociedad.

| Vía | ¿Deducible para la sociedad? | ¿Dónde tributa para ti? |
|---|---|---|
| Nómina | **Sí** | Base general (marginal) |
| Factura | **Sí**, a valor de mercado (art. 18 LIS) | Base general (actividad económica) |
| Dividendo | **No** — art. 15.a) LIS, retribución de fondos propios | Base del ahorro |

El dividendo sufre **dos impuestos**: la sociedad paga el IS sobre el beneficio y después la
persona paga sobre lo repartido. La nómina y la factura sólo pagan uno, porque reducen la
base de la sociedad.

### Retención — art. 101.4 LIRPF

«El porcentaje de retención e ingreso a cuenta sobre los rendimientos del capital mobiliario
será del **19 por ciento**.» Es un **pago a cuenta**, no un impuesto adicional: se descuenta
de la cuota final.

*(Nota: el texto consolidado del art. 101 contiene varias redacciones históricas —alguna con
el 18 %—; la vigente es el 19 %.)*

## The hard part

Que el dividendo, con el tipo nominal más bajo de las tres vías, sea **la más cara**. El
19–21 % de la base del ahorro se aplica sobre una cantidad que **ya ha pagado** el Impuesto
sobre Sociedades.

## Misconception to correct

*"El dividendo tributa al 19 %, así que es la vía barata."*

Tributa al 19 % **lo que queda después** de que la sociedad haya pagado su impuesto. Sumando
los dos, sale más caro que la nómina para una sociedad pequeña.

## Running case candidates

**Continúa el Caso A.** Ámbar tiene **20.000 €** de beneficio antes de impuestos y Marta
quiere sacarlos. Tipo de sociedad: 19 % (microempresa, lección 06). Marginal de Marta en
Madrid: 27,80 % (lección 10).

| Vía | Cálculo | Neto para Marta | Coste total |
|---|---|---|---|
| Nómina o factura | 20.000 × (1 − 0,278) | **14.440,00 €** | **27,80 %** |
| Dividendo | 20.000 − 19 % IS = 16.200; − 3.282 € de base del ahorro | **12.918,00 €** | **35,41 %** |

Diferencia: **1.522 €** a favor de la nómina.

**Lo que este cálculo deja fuera**: la Seguridad Social. Marta cotiza en el RETA como
societaria con un suelo obligatorio (ver `_reta-2026-verificado.md`), y ese coste existe
reparta o no reparta. Se integra en la lección 16.

## Candidate reveal questions

1. *Ámbar tiene 20.000 € de beneficio. ¿Qué vía deja más dinero a Marta?* → La nómina, por
   1.522 €, pese a que el dividendo tiene el tipo nominal más bajo. **Elegida.**

## Visual opportunities

- **Comparación cuantitativa**: los 20.000 € de beneficio partidos en impuesto y neto para
  cada vía. Cifras → generador.

## Sources

- [Ley 27/2014, del Impuesto sobre Sociedades](https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328) — arts. 15.a) y 18
- [Ley 35/2006, del IRPF](https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764) — arts. 46, 66, 76 y 101.4

## Perishable / unconfirmed

- El resultado depende del tipo de IS y del marginal: **con tipos distintos el orden puede
  invertirse**. La lección debe enseñar el método, no memorizar el resultado.
