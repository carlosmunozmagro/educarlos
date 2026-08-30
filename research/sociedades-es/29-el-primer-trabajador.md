# El primer trabajador

- **Course / lesson**: sociedades-es / 29-el-primer-trabajador
- **Objective**: saber qué cuesta de verdad un empleado, y por qué el bruto es la parte pequeña de la decisión.
- **Researched**: 2026-08-30

> **Aviso de esta sesión**: el proxy de red del entorno bloquea `boe.es`,
> `agenciatributaria.gob.es` y las bases de datos jurídicas. Los tipos de abajo están
> corroborados por varias fuentes secundarias independientes que citan la misma norma
> (Orden PJC/297/2026), pero **no verificados contra el BOE en esta sesión**. La Orden ya
> estaba verificada en `_reta-2026-verificado.md` para el RETA (art. 18.2); lo que aquí se
> añade es el **régimen general** (art. 18.1), que no se pudo abrir.

## Core mechanism — la cotización no es un porcentaje, son cinco

El coste de Seguridad Social de un trabajador por cuenta ajena no sale de un tipo único.
Son conceptos independientes que se aplican sobre la **misma base de cotización** y se
reparten entre empresa y trabajador:

| Concepto | Total | Empresa | Trabajador |
|---|---|---|---|
| Contingencias comunes | 28,30 % | **23,60 %** | 4,70 % |
| Desempleo (contrato indefinido) | 7,05 % | **5,50 %** | 1,55 % |
| FOGASA | 0,20 % | **0,20 %** | — |
| Formación profesional | 0,70 % | **0,60 %** | 0,10 % |
| MEI (2026) | 0,90 % | **0,75 %** | 0,15 % |
| **Suma verificable** | | **30,65 %** | **6,50 %** |

**Falta una pieza y la lección tiene que decirlo**: las contingencias profesionales
(accidentes de trabajo y enfermedades profesionales) van a cargo exclusivo de la empresa
según la **tarifa de primas** por actividad — no es un tipo único y **no se ha verificado**
la prima que corresponde al diseño gráfico. La lección dice «al menos 30,65 %», nunca un
total cerrado.

## La base

La base de contingencias comunes tiene tope por arriba (**5.101,20 €/mes** en 2026) y suelo
por grupo de cotización (**1.424,40 €/mes** en el grupo 7). Un sueldo de **2.000 €/mes** cae
dentro de la horquilla de **cualquier** grupo, así que el cálculo del caso no depende de
clasificar el puesto — un detalle que evita afirmar un grupo que no se ha verificado.

## The hard part

Que el 6,50 % del trabajador **no es coste de la empresa**: sale de su bruto, no se suma.
Quien mezcla los dos porcentajes calcula un coste inflado de casi el 37 %.

Y en la otra dirección: el coste bruto **no** es el coste final, porque el sueldo y la
cuota patronal son gasto deducible en el Impuesto sobre Sociedades.

## Misconception to correct

*«Contratar a alguien por 24.000 € me cuesta 24.000 €.»*

Cuesta 24.000 € + 7.356 € de cuota patronal = **31.356 €**, más la prima de accidentes.
Pero después baja: es gasto deducible.

## Números del caso (Caso A, ejercicio 2027)

Marta contrata a **Nuria**, diseñadora, **indefinida a jornada completa**, alta el
**1 de febrero de 2027**, **24.000 € brutos** en doce pagas de 2.000 €.

| | |
|---|---|
| Base mensual de cotización | 2.000 € |
| Cuota patronal mensual | 2.000 × 30,65 % = **613 €** |
| Cuota patronal anual (12 meses) | **7.356 €** |
| Coste bruto anual | 24.000 + 7.356 = **31.356 €** |
| A Nuria le descuentan | 2.000 × 6,50 % = 130 €/mes = 1.560 €/año |

Efecto en el Impuesto sobre Sociedades de 2027 (microempresa, **17 % / 20 %**, lección 06):

| | |
|---|---|
| Base sin Nuria | 60.000 € → cuota 10.500 € |
| Base con Nuria | 60.000 − 31.356 = **28.644 €** → cuota 28.644 × 17 % = **4.869,48 €** |
| Ahorro de cuota | **5.630,52 €** |
| **Coste neto real** | 31.356 − 5.630,52 = **25.725,48 €** |

Es decir: **el 82 % del coste bruto**. La sociedad paga 31.356 €, pero Hacienda devuelve
por la vía del gasto deducible casi una quinta parte.

## Lo que ya está en el curso y no hay que reexplicar

- El **modelo 111** y la retención del trabajo: lección 18.
- Que la nómina de Marta es deducible y a qué tipo tributa ella: lecciones 13 y 15.
- Retribución en especie y el límite del 30 %: lección 22.

## Candidate reveal questions

1. Nuria cobra 2.000 € y le descuentan 130 € de Seguridad Social. ¿Cuánto de esos 130 €
   es coste para Ámbar? *(Ninguno: sale del bruto de Nuria. El coste de Ámbar son otros
   613 € que no aparecen en la nómina de ella.)*
2. Si el coste bruto es 31.356 € y es deducible, ¿por qué no decimos que contratar es
   gratis? *(Porque el ahorro es el tipo del impuesto, no el 100 %: se ahorra 5.630 €
   de una factura de 31.356 €.)*

## Sources

- [Orden PJC/297/2026, de 30 de marzo, de cotización para 2026](https://www.boe.es/buscar/act.php?id=BOE-A-2026-7296) — art. 18 (tipos), art. 3 (bases)
- [Texto refundido de la Ley General de la Seguridad Social (RDL 8/2015)](https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724)
- [Ley 27/2014, del Impuesto sobre Sociedades](https://www.boe.es/buscar/act.php?id=BOE-A-2014-12328) — art. 15 (gastos no deducibles), DT 44.ª
