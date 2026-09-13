# Margen real en Amazon

Extensión de Chrome. Abres la ficha de un producto de Amazon, pulsas el icono
y te dice **lo que de verdad te queda de esa venta**: comisión por referencia,
tarifa por artículo, IVA repercutido, coste del género, envío y el coste
esperado de las devoluciones. Es el mismo motor que usa
[`dropshipping/margen.mjs`](../dropshipping/margen.mjs) desde la línea de
comandos, metido en el sitio donde de verdad se decide el precio: la propia
ficha.

**Cinco análisis gratis al mes. Sin registro, sin cuenta, sin servidor.**

## Qué hace y qué no

| Hace | No hace |
| --- | --- |
| Lee el precio, el título y el ASIN de la ficha abierta | No escribe nada en Amazon ni toca tu cuenta de vendedor |
| Calcula con tus costes, que se guardan en tu navegador | No manda tus cifras a ningún servidor: el cálculo ocurre en tu equipo |
| Dice el precio de equilibrio: por debajo, regalas trabajo | No conoce tus tarifas negociadas ni tu logística real |
| Avisa de lo que cuesta una devolución en ventas perdidas | No sustituye a Seller Central: las comisiones hay que verificarlas |

La única petición a Internet que hace la extensión es la validación de la
licencia, y solo si has comprado Pro. Por eso el manifiesto pide un único
`host_permissions`.

## Instalar en local

```bash
npm run extension     # copia dropshipping/margen.mjs dentro de la extensión
npm test              # 135 pruebas; 38 son de esta extensión
```

Y en Chrome:

1. `chrome://extensions`
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. **Cargar descomprimida** → elige la carpeta `extension/`.
4. Ancla el icono a la barra: el número que verás encima son los análisis
   gratis que te quedan este mes.
5. Abre cualquier ficha de producto de Amazon y pulsa el icono.

No hay compilación ni dependencias. Cuando toques el motor de margen, vuelve a
ejecutar `npm run extension` y pulsa *Actualizar* en `chrome://extensions`.

Para el paquete de la tienda: `npm run empaquetar`.

## Estructura

```
manifest.json        permisos y puntos de entrada (MV3)
contenido.js         content script: lee la ficha y contesta. Nada más
fondo.mjs            service worker: el número sobre el icono
popup.html/.css/.mjs la interfaz
config.mjs           LO ÚNICO QUE HAY QUE TOCAR PARA PUBLICAR
lib/uso.mjs          contador de 5 usos/mes sobre chrome.storage
lib/licencia.mjs     activar, revalidar y desactivar la clave de pago
lib/almacen.mjs      chrome.storage detrás de una interfaz que se puede probar
lib/amazon.mjs       parser de la ficha. Módulo puro
lib/calculo.mjs      une la ficha con el motor de margen
lib/margen.mjs       COPIA GENERADA de dropshipping/margen.mjs. No editar
datos/amazon.json    comisiones por categoría y planes de vendedor
iconos/generar.mjs   dibuja los PNG del manifiesto
empaquetar.mjs       el ZIP para la Chrome Web Store: npm run empaquetar
tienda/FICHA.md      textos de la ficha de la tienda, listos para pegar
tienda/privacidad.html  política de privacidad para publicar en tu dominio
licencias/           el Worker de Cloudflare que cobra con Stripe (0 €/mes)
```

## El contador de usos

Vive en [`lib/uso.mjs`](lib/uso.mjs) y guarda en `chrome.storage.sync` un solo
objeto: `{periodo: "2026-09", usos: 3, productos: [...]}`.

- **El periodo es el mes natural.** Se reinicia el día 1, que es lo único que
  un cliente entiende sin leer la letra pequeña.
- **El mismo producto no gasta cuota dos veces.** Volver a abrir la ficha para
  corregir el coste del proveedor es gratis: cobrar dos veces por el mismo
  análisis es la forma más rápida de que te desinstalen.
- **Atrasar el reloj no regala cuota.** Solo se abre periodo nuevo cuando el
  mes actual es *posterior* al guardado.
- **Las escrituras se serializan.** Dos popups abiertos a la vez no pueden
  leer el mismo valor y escribir el mismo número.
- **Con Pro no cuenta ni escribe.**

Cambiar el límite es cambiar `LIMITE_GRATIS` en [`config.mjs`](config.mjs).

**Esto no es una protección.** Vive en el equipo del usuario y quien sepa
abrir las devtools de la extensión lo pone a cero. Sirve para dos cosas
honestas: poner un techo a lo que *tú* gastas por usuario —importante el día
que añadas una llamada de pago a alguna API— y dar la conversación de la
compra en el momento justo, cuando la herramienta ya ha demostrado que vale.
Lo que de verdad distingue a quien ha pagado es la licencia.

## Cobrar: va con Stripe

Chrome Web Store **ya no cobra por ti** (retiró su API de pagos en 2020), así
que el cobro es tuyo. Este proyecto va con **Stripe**, y todo lo que hace falta
está en [`licencias/`](licencias/README.md): un Worker de Cloudflare de un
archivo, 0 €/mes, que verifica el webhook de Stripe, genera la clave, se la
enseña al comprador en la página de confirmación y responde a la extensión
cuando revalida.

El runbook completo —desplegar, configurar el Payment Link, el webhook, probar
en modo test y el asunto del IVA— está en
[`licencias/README.md`](licencias/README.md). Resumen de por dónde se toca:

```js
// config.mjs
export const TIENDA = {
  configurada: true,
  proveedor: 'propio',
  urlCompra: 'https://buy.stripe.com/tu-payment-link',
  endpoint: 'https://licencias-margen.<tu-subdominio>.workers.dev/validar',
  precio: '19 € pago único',
};
```

```json
// manifest.json: el MISMO dominio, o Chrome bloquea la validación en silencio
"host_permissions": ["https://licencias-margen.<tu-subdominio>.workers.dev/*"]
```

Dos cosas que Stripe no trae y que el Worker resuelve, porque si no las
resuelves tú no hay negocio:

- **La entrega de la clave.** Stripe manda un recibo, no una licencia. La
  página `/exito` a la que redirige el Payment Link enseña la clave y se
  reintenta sola mientras el webhook llega.
- **El IVA.** Con Stripe el vendedor eres tú: vender software a consumidores de
  la UE obliga a aplicar el tipo de cada país y declararlo por la ventanilla
  única (OSS). Actívalo con Stripe Tax. Está explicado, con las dos salidas
  posibles, en [`licencias/README.md`](licencias/README.md#el-iva-que-con-stripe-es-tuyo).

La alternativa que se descartó era **Lemon Squeezy**: no necesita servidor y
liquida el IVA él como Merchant of Record, a cambio de ~5 % + 0,50 $ por venta
frente al 1,5 % + 0,25 € de Stripe. El módulo [`lib/licencia.mjs`](lib/licencia.mjs)
sigue hablando los dos idiomas: para cambiarte basta con poner
`proveedor: 'lemonsqueezy'` con `tiendaId` y `productoId`.

### Cómo se comporta la licencia

Lo implementa [`lib/licencia.mjs`](lib/licencia.mjs), con
[pruebas](../test/licencia.test.mjs) de cada caso:

- Se revalida **cada 7 días**, no en cada clic. Revalidar en cada uso
  significa que el día que la API tenga un mal rato tus clientes de pago se
  quedan fuera y tu buzón se llena.
- **Sin conexión, la licencia aguanta 14 días** más. Un cliente en un tren no
  es un moroso.
- Si el servidor responde con claridad que la clave está revocada, caducada o
  reembolsada —un `charge.refunded` de Stripe hace justo eso—, se cae a gratis
  en el acto y se recuerda, sin volver a preguntar.
- **Una clave vale para dos navegadores.** Cada instalación manda un
  identificador de equipo (azar, guardado en local) al activar y al
  revalidar. Reinstalar en el mismo sitio no gasta plaza.
- "Usar en otro equipo" libera la plaza en el servidor y borra la clave de
  ese navegador. El equipo liberado se entera en su siguiente revalidación y
  vuelve a la versión gratuita.

## Qué falta antes de publicar

1. **Verificar las comisiones** de `datos/amazon.json` contra Seller Central y
   poner `_verificado: true`. Mientras sea `false`, la extensión avisa al
   usuario en cada cálculo; eso es deliberado.
2. **Desplegar el Worker** ([`licencias/README.md`](licencias/README.md)), crear
   el Payment Link y poner `configurada: true` en `config.mjs`. Con `false` el
   botón dice "Pro, próximamente" en vez de llevar a un enlace roto.
3. **Política de privacidad**: la Chrome Web Store la exige. La tuya cabe en un
   párrafo, porque no recoges nada: los costes y el contador viven en el
   navegador del usuario y solo la clave de licencia sale a Internet.
4. Los pasos de tienda, capturas y lanzamiento están en
   [`LANZAMIENTO.md`](LANZAMIENTO.md).
