# Vender sin stock

Vendes artículos que no has fabricado ni almacenado: alguien los imprime y los
envía cuando llega el pedido. Tu única inversión antes de la primera venta es el
papeleo.

## Empieza por aquí

| | Léelo si |
| --- | --- |
| **[`alemania/RECHT.md`](alemania/RECHT.md)** | **Siempre, y antes de nada.** Tres obligaciones se incumplen el día que vendes el primer artículo. |
| [`PLAN.md`](PLAN.md) | Quieres saber qué se hace las cuatro primeras semanas, cuánto cuesta y cuándo se abandona. |
| [`alemania/PROVEEDORES.md`](alemania/PROVEEDORES.md) | Ya sabes qué vender y toca elegir quién lo fabrica. |

## Las dos cosas que este repositorio calcula por ti

**¿Se puede vender legalmente y merece la pena?**

```bash
npm run nichos          # criba 14 nichos: descarta por ley, puntúa por margen
```

Descarta antes de puntuar, porque un nicho con margen magnífico y una ley encima
no es un nicho. De los 14 candidatos caen 8: cinco por su régimen especial
(GPSR, ElektroG, cosmética, juguetes, alimentos) y tres porque no dejan ni 4 €
por pedido, que es lo que cuesta una devolución.

**¿Cuánto queda de verdad de cada pedido?**

```bash
npm run margen                                    # todos los productos
node dropshipping/calcular.mjs camiseta-algodon --objetivo 500
node dropshipping/calcular.mjs camiseta-algodon --beneficio 8
```

Descuenta lo que las calculadoras de internet no descuentan:

- el IVA repercutido, si no eres Kleinunternehmer;
- la comisión de la plataforma sobre el bruto **con** los gastos de envío;
- el **19 % de reverse charge** sobre las comisiones de Etsy, que el
  Kleinunternehmer paga y no puede deducir (§ 13b con § 19 UStG);
- la licencia de envase del VerpackG, en cada paquete;
- y la **devolución**, que en un artículo impreso es pérdida total.

De una camiseta de 24,90 € más 3,90 € de envío en Etsy te quedan **5,16 €**. Una
sola devolución se come **casi cuatro ventas**.

## Qué hay en cada sitio

```
alemania/RECHT.md       GPSR, Gewerbe, Kleinunternehmer, LUCID, Widerruf. El documento que decide
alemania/PROVEEDORES.md las cinco preguntas al proveedor y cómo verificarlo
PLAN.md                 plan de 30 días, presupuesto real y criterio de cierre
margen.mjs              motor de margen. Modulo puro, reutilizable, con pruebas
calcular.mjs            el informe por producto y plataforma
nichos.mjs              la criba
datos/plataformas.json  comisiones de Etsy, eBay, Stripe y PayPal
datos/nichos.json       los 14 candidatos, con sus datos
productos/              una ficha por producto. Cambia aquí los costes de tu proveedor
tienda/                 generador de tienda propia con las páginas legales alemanas (fase 2)
```

## Las fichas de producto

Un JSON por producto en [`productos/`](productos/). Los campos que mueven el
resultado:

| Campo | Para qué |
| --- | --- |
| `precioVenta` | Precio al cliente, **IVA incluido**. Es lo que exige mostrar la PAngV. |
| `envioCobrado` | Lo que le cobras de envío. Ojo: la plataforma cobra comisión también sobre esto. |
| `costeGenero`, `costeEnvio` | Lo que te cobra el proveedor. **El número que hay que verificar con un pedido de muestra.** |
| `costeGeneroLlevaIva` | `true` si la factura del proveedor lleva IVA alemán deducible. |
| `licenciaEnvase` | Lo que te cuesta el envase de ese paquete (VerpackG). |
| `tasaDevolucion` | Fracción de pedidos que vuelven. En ropa es del 10 % para arriba; en moda, del 20 al 40 %. |
| `recuperacionDevolucion` | Cuánto del género recuperas al devolverse. En artículo impreso, **0**. |
| `envioRetornoAsumido` | El porte de vuelta, si lo pagas tú. |
| `unidades` | Unidades por pedido. Subirlo es la palanca más rentable que existe. |

## Lo que estas herramientas no saben

**Si alguien busca tu producto.** No hay forma de calcularlo, así que `nichos.mjs`
no lo inventa: imprime los cuatro sitios donde se mira (resultados y ventas en
Etsy, filtro «Verkauft» de eBay, Google Trends, y las reseñas de una estrella de
quien ya vende). Media hora por nicho.

Y todos los precios y comisiones de `datos/` y `productos/` son **estimaciones
sin contrastar**, marcadas como tales en los propios archivos. Sustitúyelos por
las tarifas reales de tu proveedor y de tu cuenta antes de fijar un precio: con
un coste equivocado de 2 €, el informe miente en un 40 %.

## Antes de la primera venta

1. **Gewerbeanmeldung** o Ummeldung si ya tienes alta por [`../webs-locales/`](../webs-locales/README.md).
2. **Fragebogen zur steuerlichen Erfassung** en ELSTER, y pide la USt-IdNr
   aunque seas Kleinunternehmer.
3. **Registro en LUCID** y licencia de envases. Es gratis registrarse y sin el
   número te bloquean la cuenta en Etsy y eBay.
4. **Datos de fabricante del proveedor**, por artículo, guardados por escrito.
5. **Widerrufsbelehrung** y el formulario del anexo 2 del art. 246a EGBGB.

El detalle de los cinco, con las normas y las multas, está en
[`alemania/RECHT.md`](alemania/RECHT.md).
