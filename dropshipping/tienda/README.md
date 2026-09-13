# Tienda propia — fase 2

**No abras esto el primer mes.** Una tienda propia sin clientes es una página
vacía con cuatro páginas legales que mantener, y la plataforma en la que no
pagas comisión es también la plataforma en la que no hay nadie. El orden que
gana está en [`../PLAN.md`](../PLAN.md): primero vender, después tener tienda.

Cuándo sí merece la pena: cuando ya tengas clientes que te conocen por el
nombre. Ahí la comisión de Etsy pasa de ser el precio del tráfico a ser un
impuesto sobre gente que venía a por ti. De una camiseta de 24,90 € más envío:

| | Te queda |
| --- | --- |
| Etsy | 5,16 € |
| Tienda propia con Stripe | **8,32 €** |

Un 61 % más por el mismo pedido. Compruébalo con `npm run margen`.

## Qué genera

```bash
node dropshipping/tienda/generar.mjs                 # la ficha de ejemplo
node dropshipping/tienda/generar.mjs mi-tienda.json  # la tuya
```

Deja en `salida/<nombre>/` una tienda terminada, en alemán:

```
index.html            productos, precios, plazo y datos GPSR de cada artículo
impressum.html        § 5 DDG
datenschutz.html      Art. 13 DSGVO
widerruf.html         Widerrufsbelehrung + Muster-Widerrufsformular del anexo 2
versand-zahlung.html  gastos de envío, plazo y formas de pago
estilo.css
```

Se arrastra a [Cloudflare Pages](https://pages.cloudflare.com) o a
[Netlify Drop](https://app.netlify.com/drop): gratis, con HTTPS y sin nada que
mantener. **Coste fijo: 0 €.** Solo el dominio, 10 € al año.

## El cobro, sin backend ni cuota mensual

No hay carrito ni servidor: cada producto lleva un **enlace de pago** en el
campo `enlacePago`. Se crea una vez en el panel de Stripe (*Payment Links*) o de
PayPal, y cobra tarjeta, PayPal, Klarna y Apple Pay sin que tú guardes ni un
dato de pago.

Al crear el enlace, tres cosas que hay que dejar bien:

1. **Activa la recogida de la dirección de envío.** Sin dirección no hay pedido.
2. **Pon el mismo precio y el mismo envío que la ficha.** Si no coinciden, el
   precio anunciado es falso (§ 3 PAngV) y el cliente tiene razón para reclamar.
3. **En el correo de confirmación, adjunta la Widerrufsbelehrung.** El
   § 312f BGB exige que llegue en soporte duradero *después* de la compra, no
   solo en la web.

## Se niega a publicar una tienda incompleta

`generar.mjs` valida la ficha antes de escribir nada. Con `demo: true` genera
siempre una vista previa con `noindex` y el botón desactivado, y te lista lo que
falta. Con `demo: false` **se niega y sale con error** si falta un solo dato
obligatorio, diciendo cuál y por qué norma:

```
✗ mi-tienda.json no se puede publicar todavia. Falta:
  · titular.calle — § 5 DDG: direccion postal completa
  · lamina: fabricante.nombre y fabricante.direccion — Art. 19 GPSR
  · quedan marcadores [prüfen] sin rellenar en la ficha
```

Es deliberado. Una tienda alemana sin Impressum completo o sin los datos de
fabricante del artículo no es una tienda a medias: es una *Abmahnung* con fecha
de entrega. Los marcadores `[prüfen]` funcionan igual que los `[bestätigen]` de
[`../../webs-locales/`](../../webs-locales/README.md): mientras quede uno, no se
publica.

## La ficha

[`ejemplo.json`](ejemplo.json) es el modelo; cópialo y cámbialo. Los campos que
la validación exige para poder publicar:

| Campo | Norma |
| --- | --- |
| `titular.nombre`, `calle`, `cp`, `ciudad`, `email` | § 5 DDG |
| `titular.telefono` o `titular.formularioContacto` | § 5 DDG: una vía de contacto rápida |
| `envio.coste`, `envio.plazoDias` | § 3 PAngV y art. 246a EGBGB |
| `precio` y `enlacePago` de cada producto | § 3 PAngV |
| `fabricante.nombre` y `fabricante.direccion` de cada producto | art. 19 GPSR |
| `personaResponsableUE` si `fabricante.extraUe` | art. 4 y 19 GPSR |
| `material` si el producto es `textil` | TextilKennzVO |

Y dos que cambian el texto de toda la tienda:

- **`titular.kleinunternehmer: true`** sustituye cualquier mención al IVA por la
  del § 19 UStG. Un Kleinunternehmer que escribe *«inkl. 19 % MwSt»* anuncia un
  impuesto que no repercute, y eso es motivo de Abmahnung.
- **`envio.retornoPagaCliente`** cambia la Widerrufsbelehrung. Solo puedes
  cobrarle el porte de vuelta al cliente si se lo has dicho ahí antes de comprar.
- **`personalizado: true`** en un producto añade el aviso de que no hay derecho
  de desistimiento (§ 312g Abs. 2 Nr. 1 BGB). Ponlo solo si de verdad se fabrica
  según especificaciones del cliente: un artículo de tu catálogo que imprimes al
  recibir el pedido **no** cuenta.

## Lo que ningún programa puede comprobar por ti

- Que la Widerrufsbelehrung llegue también por correo tras la compra.
- Que el enlace de pago cobre lo mismo que dice la ficha.
- Si quieres **AGB**: no son obligatorias, y copiarlas de otra tienda es
  infracción de derechos de autor. Si las quieres, que sean de un servicio con
  garantía frente a Abmahnungen. Ver [`../alemania/RECHT.md`](../alemania/RECHT.md) § 7.
