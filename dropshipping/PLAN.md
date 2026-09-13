# Plan de arranque — vender sin stock desde Reinbek

## 1. La apuesta en una frase

Vender artículos impresos bajo demanda en la UE, empezando por **textil
personalizado para clubes, gremios y empresas de la comarca**, que se cobra por
adelantado, no admite devolución y se vende en las mismas conversaciones que ya
estás teniendo para colocar webs.

El dropshipping clásico —mayorista chino, tienda con anuncios pagados— no está
en este plan por dos motivos que no son opinables: desde el 13-12-2024 **la GPSR
lo prohíbe** sin un responsable establecido en la UE, y con 50 € **no se puede
comprar el tráfico** que ese modelo necesita para existir. Está todo en
[`alemania/RECHT.md`](alemania/RECHT.md) y en la ficha
[`productos/funda-movil-aliexpress.json`](productos/funda-movil-aliexpress.json).

## 2. Lo primero que hay que decir: esto no cabe en 50 €

La calculadora fiscal de [`../NEGOCIO.md`](../NEGOCIO.md) costaba 10 € porque no
hay mercancía, ni envase, ni cliente que devuelva. Vender cosas físicas tiene un
suelo de costes que no se puede saltar:

| Partida | Coste | Cuándo |
| --- | ---: | --- |
| Gewerbe-**Ummeldung** (si ya tienes alta por las webs) | 15-25 € | Antes de vender |
| …o Gewerbe-**Anmeldung** nueva | 20-40 € | Antes de vender |
| Registro en LUCID | 0 € | Antes de vender |
| Licencia de envases, cantidad mínima | ~35 €/año | Antes del primer envío |
| **Pedido de muestra a tu propia dirección** | 12-20 € | Antes de vender |
| 10 listados en Etsy | 1,80 € | Al publicar |
| Dominio `.de` (solo si abres tienda propia) | 10 €/año | Fase 2, opcional |
| **Total antes del primer euro de ingresos** | **65-90 €** | |

**Son 65-90 €, no 50 €.** Decirlo al revés sería venderte una película.

Hay dos formas de cerrar esa diferencia, y las dos son legítimas:

1. **Que la primera venta pague el arranque.** Un pedido B2B de 20 sudaderas
   deja unos 150 € y se cobra por adelantado. Consigues el pedido, cobras, y con
   eso pagas Ummeldung, licencia y muestra. Es el camino que recomienda este
   plan.
2. **Empezar por [`../webs-locales/`](../webs-locales/README.md)**, que cuesta
   0 € y deja 300 € por venta, y usar ese dinero para arrancar esto.

## 3. Por qué el textil B2B y no una tienda de camisetas

[`nichos.mjs`](nichos.mjs) da la respuesta con números, no con entusiasmo:

```bash
node dropshipping/nichos.mjs
```

De 14 candidatos caen 8. Y el que gana no es ningún clásico de print-on-demand:

| | Camiseta de catálogo en Etsy | Pedido de 20 sudaderas a un club |
| --- | --- | --- |
| Te queda | ~5 € por pedido | ~150 € por pedido |
| Devoluciones | 10-40 %: es el artículo que más se devuelve de internet | **Cero**: § 312g Abs. 2 Nr. 1 BGB excluye lo personalizado |
| Cuándo cobras | Después de vender, tras la retención de la plataforma | **Antes de producir** |
| Cómo consigues al cliente | Compitiendo con 40.000 listados iguales | Hablando con el dueño, como ya haces |
| Pedidos para 300 € | 59 | 2 |

Cincuenta y nueve pedidos frente a dos. Y la ventaja de verdad no es ninguna de
esas casillas: es que **ya tienes la lista de negocios de Reinbek investigada y
el teléfono en la mano** en [`../webs-locales/contacto/prospectos.csv`](../webs-locales/contacto/prospectos.csv).
Un Handwerker que no te compra la web puede comprarte diez sudaderas con su logo,
y al revés. Es la misma visita.

Etsy entra en el plan, pero como **segundo canal**: es el único sitio donde el
tráfico no lo pagas tú, así que sirve para probar diseños mientras el B2B paga
las facturas.

## 4. Plan de 30 días

| Semana | Qué se hace | Coste |
| --- | --- | ---: |
| **1** | Verificar la demanda de los tres nichos que pasan la criba, con los cuatro pasos que imprime `nichos.mjs`. Elegir uno. Gewerbe-Ummeldung. Fragebogen en ELSTER y pedir la USt-IdNr. Registro en LUCID. | 15-25 € |
| **2** | Las cinco preguntas de [`alemania/PROVEEDORES.md`](alemania/PROVEEDORES.md) a tres proveedores. Pedido de muestra a tu dirección. Cinco diseños. Actualizar las fichas de `productos/` con las tarifas **reales** y volver a pasar `calcular.mjs`. | 12-20 € |
| **3** | **La semana que decide.** Llevar la muestra a las visitas de webs que ya tienes agendadas. Diez negocios, oferta concreta: «vuestro logo en sudadera de trabajo, 20 unidades, tanto la unidad, pago por adelantado, dos semanas». Publicar cinco listados en Etsy con los diseños. | ~1 € |
| **4** | Licencia de envases al cerrar el primer pedido. Medir. Decidir con el criterio de abajo. | ~35 € |

Nada de tienda propia el primer mes. La tienda es
[`tienda/`](tienda/README.md) y es la fase 2: sin ventas, una tienda propia es
una página vacía con cuatro páginas legales que mantener.

## 5. Criterio del día 30

**Hay señal si se cumple una de estas dos:**

- **un pedido B2B cerrado y cobrado**, de 120 € de beneficio o más; o
- **dos ventas en Etsy** más de 300 visitas acumuladas en los listados.

Con señal: se reinvierte lo cobrado en más diseños y en el segundo proveedor, y
se abre la tienda propia con [`tienda/generar.mjs`](tienda/generar.mjs) para
dejar de pagar comisión en los clientes que ya te conocen.

**Sin señal, se sigue otro mes sin gastar nada más.** Los listados de Etsy ya
están pagados y duran cuatro meses; el coste de esperar es cero.

**Criterio de cierre:** si al **mes 3** no hay ninguna venta con diez listados
publicados y veinte negocios visitados, se cierra. Nada de «un mes más». La
pérdida queda acotada en los 65-90 € de la tabla, y el Gewerbe sigue sirviendo
para el otro negocio.

## 6. Los números, y de dónde salen

Todos los de abajo salen de ejecutar las herramientas de esta carpeta, no de
ninguna estimación optimista. Compruébalos:

```bash
node dropshipping/calcular.mjs --todos --objetivo 500
```

- **Lo que queda de una camiseta de 24,90 € + 3,90 € de envío en Etsy:**
  5,16 € como Kleinunternehmer. El 82 % de lo que cobras se va en género, porte,
  comisiones y envase.
- **Lo que cuesta una devolución de esa camiseta en Etsy:** 19,02 €, o sea
  **casi cuatro ventas**. Por eso la tabla de tallas y la foto son el negocio.
- **Precio de equilibrio de esa misma camiseta:** 18,46 €. Por debajo, regalas
  trabajo.
- **Pedidos al mes para 300 € limpios:** 59 en Etsy, 37 en tienda propia, **2**
  en un pedido B2B de 20 unidades.

Y un número que no sale de ninguna herramienta, porque es la comparación
incómoda: **una web de [`../webs-locales/`](../webs-locales/README.md) deja 300 €
de una sola conversación.** Sesenta pedidos de camiseta dejan lo mismo. Si solo
tienes tiempo para una cosa esta semana, no es esta.

Este negocio tiene sentido por otra razón: **se vende en la misma visita que la
web**, aumenta lo que te deja cada puerta que ya estás llamando, y a diferencia
de la web, el cliente vuelve cada temporada.

## 7. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Vender algo cuya ley de producto no habías visto | La criba de `nichos.mjs` descarta por ley antes de puntuar por margen, y `alemania/RECHT.md` tiene la lista. |
| Tarifas de proveedor distintas de las estimadas | Las fichas de `productos/` están marcadas como estimaciones. El pedido de muestra da los números reales antes de fijar precios. |
| Devoluciones de ropa por talla | El plan empieza por lo personalizado, que **no admite desistimiento**. La tabla de tallas en el listado y una foto puesta reducen el resto. |
| Proveedor único que cierra o sube precios en diciembre | Segundo proveedor del artículo principal en cuanto haya ventas (`alemania/PROVEEDORES.md`, último apartado). |
| Abmahnung por los textos de la tienda propia | Fase 2, y con las páginas que genera `tienda/generar.mjs`. Mientras vendas en marketplace, la plataforma aporta casi todo. |
| Dedicarle el tiempo que necesita el negocio de webs | El criterio de cierre del mes 3 existe para eso: fecha y cifra, decididas antes de empezar. |

## 8. Qué falta que solo puede hacer una persona

1. Verificar la demanda real de los tres nichos finalistas en Etsy y eBay (~1,5 h).
2. Gewerbe-Ummeldung y Fragebogen en ELSTER, con la USt-IdNr (~1 h).
3. Registro en LUCID y licencia de envases (~30 min).
4. Las cinco preguntas a tres proveedores y el pedido de muestra (~1 h + espera).
5. **Ofrecer el textil en las visitas de webs ya agendadas** (0 h extra: es la
   misma conversación).

Unas cuatro horas y media y entre 65 y 90 €. El paso 5 es el único que gana
dinero; los cuatro primeros solo sirven para que el quinto sea legal.
