# SL, SA, SLU y el capital de un euro

- **Course / lesson**: sociedades-es / 03-sl-sa-slu-y-el-capital-de-un-euro
- **Researched**: 2026-08-29
- **Objective**: elegir forma societaria sabiendo qué queda condicionado, y qué cuesta de
  verdad constituir con 1 € de capital.

## Core mechanism

### Capital mínimo y desembolso

**Art. 4.1 LSC** (redacción de la Ley 18/2022): «El capital de la sociedad de
responsabilidad limitada no podrá ser inferior a un euro». Y añade, mientras no alcance
los 3.000 €, **dos reglas dentro del propio artículo**:

1. «Deberá destinarse a la reserva legal una cifra al menos igual al 20 por ciento del
   beneficio hasta que dicha reserva junto con el capital social alcance el importe de tres
   mil euros.»
2. «En caso de liquidación, voluntaria o forzosa, si el patrimonio de la sociedad fuera
   insuficiente para atender el pago de las obligaciones sociales, los socios responderán
   solidariamente de la diferencia entre el importe de tres mil euros y la cifra del capital
   suscrito.»

**Art. 4.2**: la SA no puede bajar de **60.000 €**.

**Ojo**: el **art. 4 bis** (régimen de formación sucesiva) está **SUPRIMIDO** por la
Ley 18/2022. Citarlo sería un error; las dos reglas viven ahora en el art. 4.1.

Desembolso: **art. 78** — en la SL las participaciones deben estar íntegramente asumidas y
el valor nominal **íntegramente desembolsado** al otorgar la escritura. **Art. 79** — en la
SA basta desembolsar **una cuarta parte**.

### Participaciones frente a acciones

**Art. 92.2**: las participaciones «no podrán estar representadas por medio de títulos o de
anotaciones en cuenta, ni denominarse acciones, y en ningún caso tendrán el carácter de
valores». Consecuencia práctica: no hay título que entregar ni mercado donde venderlas.

**Art. 107.1**: es libre la transmisión entre socios, al cónyuge, ascendientes o
descendientes, y a sociedades del grupo. **Para terceros**, rigen los estatutos y, en su
defecto, el **art. 107.2**: comunicación escrita a los administradores, consentimiento de
la junta general, y la sociedad sólo puede denegarlo si presenta otro comprador.

### Unipersonalidad

**Art. 13.1**: la unipersonalidad se hace constar en escritura pública inscrita, con la
identidad del socio único. **Art. 13.2**: mientras subsista, hay que hacerla constar «en
toda su documentación, correspondencia, notas de pedido y facturas».

**Art. 14.1** — sólo para unipersonalidad **sobrevenida**: transcurridos **seis meses**
desde que la sociedad pasa a ser unipersonal sin inscribirlo, el socio único «responderá
personal, ilimitada y solidariamente de las deudas sociales contraídas durante el período
de unipersonalidad». **Art. 14.2**: inscrita, no responde de las posteriores.

## The hard part

Que el capital de 1 € **no ahorra 2.999 €**: los convierte en una obligación contingente
que se materializa en liquidación, justo cuando la sociedad no puede pagar. El coste no
desaparece, cambia de momento y de naturaleza.

## Misconception to correct

*"Desde 2022 una SL se monta con un euro y ya no hacen falta los 3.000."*

Los 3.000 € siguen ahí como cifra de referencia en las dos reglas del art. 4.1: retienen
el 20 % del beneficio vía reserva legal, y reaparecen íntegros como responsabilidad
solidaria de los socios si la liquidación no cubre las deudas.

## Limits and failure modes

- El art. 14.1 **no** afecta a sociedades unipersonales desde su constitución: eso ya consta
  en la escritura inscrita. El riesgo es de quien adquiere las participaciones de su socio.
- Con capital de 1 €, la mitad son 0,50 €: la causa de disolución del art. 363.1.e) (lección
  02) prácticamente no se activa. El legislador cambió una protección del acreedor por otra.

## Running case candidates

**Continúa el Caso A.** Ámbar Estudio se constituyó con **3.000 €** (constante ya fijada en
la lección 02) y es **unipersonal desde su constitución**. El contrafactual del euro es
natural, y el art. 13.2 explica por qué sus facturas dicen *Ámbar Estudio, SLU*.

Nuevo hecho para la lección: un competidor ofrece comprar el **40 %** de Ámbar — sirve para
la transmisión del art. 107 y para señalar que, siendo socia única, la junta es ella.

## Candidate reveal questions

1. *Un competidor ofrece comprar el 40 % de Ámbar. ¿Puede Marta vendérselo mañana?* →
   art. 107.1 no incluye a terceros; a falta de estatutos, consentimiento de la junta
   (art. 107.2). **Elegida.**
2. *¿Cuánto se ahorra realmente constituyendo con 1 €?* → nada: 2.999 € contingentes.

## Visual opportunities

- **Cantidad**: los 3.000 € pagados como capital frente a 1 € de capital más 2.999 €
  contingentes. Cifras → generador en `tools/visuals/`.
- **Timeline**: el reloj de seis meses del art. 14.1. Estático, misma gramática visual que
  `reloj-367.svg` de la lección 02.

## Sources

- [Ley de Sociedades de Capital (RDL 1/2010), texto consolidado](https://www.boe.es/buscar/act.php?id=BOE-A-2010-10544) — arts. 4, 13, 14, 78, 79, 92 y 107
- [Ley 18/2022, de creación y crecimiento de empresas](https://www.boe.es/buscar/act.php?id=BOE-A-2022-15818) — art. 2, nueva redacción del art. 4 y supresión del art. 4 bis

## Perishable / unconfirmed

- Artículos estructurales. El art. 4 se modificó en 2022; comprobar que no hay reforma
  posterior antes de dar la lección por vigente.
- No se cita ninguna estadística sobre cuántas SL se constituyen frente a SA: no se
  encontró fuente primaria y la lección no la necesita.
