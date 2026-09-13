# El proveedor es el negocio

En un negocio sin stock, **el proveedor es tu fábrica, tu almacén y tu servicio
de mensajería a la vez.** Lo eliges una vez y condiciona todo lo demás: el
margen, el plazo de entrega, la tasa de devolución y si lo que vendes es legal.

Elegir mal cuesta más que cualquier otro error de este negocio, y no se arregla
cambiando el precio.

## Las cinco preguntas que deciden

Escríbelas al soporte de cada candidato **antes** de diseñar nada. Las respuestas
por correo, guardadas: son tu defensa si algún día alguien pregunta.

1. **¿Dónde se produce físicamente cada artículo que me interesa?**
   No «tenemos producción en Europa». El país, por artículo. Muchos catálogos
   mezclan producción europea y asiática sin decirlo, y el mismo SKU cambia de
   planta según el stock.

2. **¿Me dais los datos de fabricante que exige la GPSR, por artículo?**
   Nombre, dirección postal y electrónica del fabricante de la prenda o del
   soporte en blanco, composición y certificados. Un proveedor serio lo tiene
   preparado; si no sabe de qué le hablas, es un aviso.

3. **¿Quién figura como remitente en el paquete?**
   Decide de quién es la obligación del VerpackG. Si aparezco yo, la licencia de
   envases es mía (ver [`RECHT.md`](RECHT.md) § 5). Que lo pongan por escrito.

4. **¿Qué pasa con una devolución y con un artículo roto o mal impreso?**
   ¿Reimprimen gratis? ¿Con foto basta? ¿Quién paga el porte? Esto es
   directamente la `tasaDevolucion` y la `recuperacionDevolucion` de las fichas
   de [`../productos/`](../productos/), o sea, tu beneficio.

5. **¿Plazo real de producción y de entrega a Alemania, en días laborables?**
   Producción y envío por separado. Y compáralo luego con lo que tarde tu primer
   pedido de prueba de verdad.

## Cómo se verifica de verdad: pídete a ti mismo

**Haz un pedido a tu propia dirección antes de vender nada.** Cuesta entre 10 y
20 € y es la única prueba que vale. Te enseña, todo de golpe:

- la calidad real de la impresión y del artículo, no la del mockup;
- **el porte real**, que es el número que más se equivoca en las hojas de cálculo;
- cuántos días pasan de verdad;
- **qué ve el cliente al abrir el paquete**: quién es el remitente, si viene con
  publicidad del proveedor dentro, si hay albarán con precios de coste (pasa, y
  arruina la venta).

Ese pedido no es un gasto: es el único dato verificado que vas a tener.

## Categorías de proveedor, de la más limpia a la más problemática

| Tipo | GPSR | Margen | Lo que hay que saber |
| --- | --- | --- | --- |
| **Print-on-demand con producción en la UE** | Limpio: fabricante europeo | 25-40 % | Sin pedido mínimo, sin stock y sin inversión. Es por donde se empieza con 50 €. |
| **Mayorista alemán con envío directo** | Limpio, y te da los datos | 15-30 % | Suele exigir alta como comerciante y a veces pedido mínimo. Entrega en 2-3 días, que convierte mucho mejor. |
| **Mayorista de otro país de la UE** | Limpio si documenta el fabricante | 20-35 % | Cuidado con el porte transfronterizo y con la atención al cliente en alemán. |
| **Importador establecido en Alemania** | Limpio: el importador es el responsable | 15-25 % | Producto asiático pero ya puesto en el mercado por alguien que responde. Es la única forma legal de vender mercancía asiática sin ser tú el importador. |
| **Mayorista en China con envío directo** | **Inviable**: no hay responsable en la UE | — | Además, 2-4 semanas de entrega y devoluciones imposibles. Ver [`RECHT.md`](RECHT.md) § 1. |

## Candidatos de print-on-demand con producción europea

Los nombres que aparecen una y otra vez en el mercado alemán. **No hay ninguno
recomendado aquí**: las tarifas y las plantas de producción cambian cada pocos
meses, así que la tabla dice qué mirar, no qué elegir.

| Proveedor | Produce en | Por qué mirarlo |
| --- | --- | --- |
| Printful | Letonia, España, y fuera de la UE según artículo | Catálogo amplio y calidad constante. **Confirma la planta por artículo**: el mismo producto puede salir de Riga o de México. |
| Gelato | Red local en más de 30 países, Alemania incluida | Imprime en el país del cliente: el porte más corto y el plazo más rápido. Fuerte en papel, láminas y calendarios. |
| Shirtee.Cloud | Alemania | Alemán, con soporte y factura alemanes. Ventaja real en plazo de entrega dentro de Alemania. |
| Printify | Red de imprentas, varias en la UE | Marketplace de imprentas: el precio baja, la constancia depende de la imprenta que toque. Filtra por ubicación. |
| Spreadshirt / Spreadconnect | Alemania y Polonia | El veterano del sector en Alemania. Mira su integración por API aparte del marketplace propio. |

Sea el que sea: **los precios de [`../productos/`](../productos/) y de
[`../datos/nichos.json`](../datos/nichos.json) son estimaciones y están marcados
como tales.** Sustitúyelos por la tarifa real que te dé tu proveedor antes de
fijar un solo precio de venta. Con un coste equivocado de 2 €, la tabla de
`calcular.mjs` miente en un 40 %.

## Lo que un proveedor bueno tiene y uno malo esconde

**Buenas señales.** Tarifas públicas sin registrarse · datos de fabricante por
artículo descargables · producción en la UE documentada por planta · reimpresión
gratis con foto en defectos · muestra a precio de coste · paquete neutro con tu
remitente · API o integración con la plataforma que uses.

**Malas señales.** «Producción en Europa» sin decir el país · tarifas solo tras
pagar una cuota · plazos «de 5 a 20 días» · sin política escrita de defectos ·
publicidad propia dentro del paquete · albarán con precios de coste a la vista ·
soporte que solo responde por chat sin dejar rastro escrito.

## Dos proveedores, no uno

Cuando el primer producto funcione, busca el segundo proveedor del mismo
artículo aunque sea algo más caro. En un negocio sin stock **el proveedor es un
punto único de fallo**: si cierra, sube precios o se queda sin la prenda en la
talla que más vendes, tu tienda deja de existir esa misma mañana. Y eso pasa en
diciembre, que es cuando se factura.

## Fuentes

- [Printful — Die 15 besten Print-on-Demand-Anbieter 2026 im Vergleich](https://www.printful.com/blog/best-print-on-demand-companies)
- [StyriaShirts — Print on Demand Deutschland: Kosten, Anbieter und Fulfillment-Realität 2026](https://styriashirts.com/print-on-demand/deutschland/)
- [Shirtinator — Print-on-Demand-Anbieter 2026 im Vergleich](https://www.shirtinator.de/aktuelles/beste-print-on-demand-anbieter)
- [IT-Recht-Kanzlei — VerpackG: Verantwortlichkeit bei Fulfillment und Dropshipping](https://www.it-recht-kanzlei.de/verpackg-verantwortlichkeit-fulfillment-dropshipping-lucid.html)
