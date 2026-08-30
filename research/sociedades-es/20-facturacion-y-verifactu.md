# Facturación y Verifactu

- **Course / lesson**: sociedades-es / 20-facturacion-y-verifactu
- **Objective**: saber qué debe hacer tu software de facturación y desde cuándo.
- **Researched**: 2026-08-29
- **PERECEDERA**: MUY ALTA. La fecha ya se ha movido dos veces.

## Core mechanism

**RD 1007/2023**, que aprueba el Reglamento de requisitos de los sistemas informáticos de
facturación.

### A quién obliga — art. 3.1

a) **Los contribuyentes del Impuesto sobre Sociedades** (con excepciones para entidades
   exentas del art. 9 LIS);
b) los contribuyentes del IRPF que desarrollen actividades económicas;
c) los del IRNR con establecimiento permanente;
d) las entidades en régimen de atribución de rentas con actividad económica.

Se aplica «aunque solo los usen para una parte de su actividad».

### Desde cuándo — disposición final cuarta (vigente)

«Los obligados tributarios a que se refiere el artículo 3.1.a) deberán tener adaptados los
sistemas informáticos […] **antes del 1 de enero de 2027**. El resto de obligados tributarios
mencionados en el artículo 3.1 deberán tener operativos los citados sistemas informáticos
**antes del 1 de julio de 2027**.»

Esta redacción viene del **Real Decreto-ley 15/2025, de 2 de diciembre**. Antes, el
RD 254/2025 ya había movido las fechas. **Es el dato más volátil del curso.**

### Qué tiene que hacer el sistema — art. 10

El registro de facturación de alta debe contener, entre otros datos, «la serie, así como la
fecha de expedición de la factura que consta en el registro de facturación, de alta o de
anulación, **inmediatamente anterior**, junto con **parte de la huella o "hash" de dicho
registro anterior**».

El art. 11 repite la exigencia para los registros de anulación.

Es, literalmente, una **cadena de hashes**: cada registro incorpora la huella del anterior,
igual que la lección 01 del curso de cripto de esta misma app. Modificar una factura antigua
rompe la huella de todas las posteriores.

## The hard part

Que no es un formato de factura ni un trámite: es un requisito sobre **el software**. La
obligación recae en el obligado tributario, aunque el sistema lo fabrique un tercero.

## Misconception to correct

*"Verifactu es la factura electrónica obligatoria."*

Son cosas distintas. Verifactu regula **cómo debe comportarse el programa** que emite
facturas (registros encadenados e inalterables). La factura electrónica obligatoria entre
empresas es otra norma, con su propio calendario.

## Running case candidates

**Continúa el Caso A.** Ámbar es contribuyente del Impuesto sobre Sociedades, así que entra
por el art. 3.1.a): su software debe estar adaptado **antes del 1 de enero de 2027**. Marta
tiene el ejercicio 2026 para cambiarlo.

## Candidate reveal questions

1. *¿Qué tiene que llevar cada registro de facturación además de los datos de la factura?* →
   La huella del registro inmediatamente anterior (art. 10). **Elegida.**

## Visual opportunities

- **Estructura**: tres registros encadenados, cada uno con la huella del anterior. Rima
  visual y conceptual con el curso de cripto. Estático.

## Sources

- [Real Decreto 1007/2023, texto consolidado](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840) — arts. 3, 10 y 11, y disposición final cuarta
- [Real Decreto-ley 15/2025, de 2 de diciembre](https://www.boe.es/buscar/doc.php?id=BOE-A-2025-24446) — modifica los plazos

## Perishable / unconfirmed

- **Verificar la disposición final cuarta antes de cada uso de esta lección.** Se ha
  modificado al menos dos veces (RD 254/2025 y RDL 15/2025).
- **No se menciona el código QR** ni el detalle de la remisión a la AEAT: están en la
  Orden HAC/1177/2024, no verificada en esta sesión.
