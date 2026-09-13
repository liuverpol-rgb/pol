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

## Cobrar: Lemon Squeezy o Stripe

Chrome Web Store **ya no cobra por ti** (retiró su API de pagos en 2020), así
que el cobro es tuyo. Las dos opciones no están empatadas:

| | Lemon Squeezy | Stripe |
| --- | --- | --- |
| Servidor propio | **No hace falta** | Imprescindible |
| Claves de licencia | Incluidas, con API pública que se llama desde el cliente | Las generas tú |
| IVA de la UE | Lo liquida él (Merchant of Record) | Tuyo: OSS, tipos por país |
| Comisión | ~5 % + 0,50 $ | 1,5 % + 0,25 € (EEE) |
| Correo con la clave | Automático | Lo montas tú |

Vendiendo software desde Alemania a toda la UE, ese "IVA" de la tabla es la
línea que decide: con Lemon Squeezy no tienes que darte de alta en el OSS ni
aplicar el tipo de cada país. La comisión extra es el precio de no tener esa
obligación encima. **Empieza por Lemon Squeezy; pásate a Stripe cuando el
volumen haga que ese 3,5 % de diferencia pese más que el papeleo.**

### Lemon Squeezy (recomendado)

1. Crea la tienda y un producto de pago único con **License keys** activadas
   (Product → Licensing → *Generate license keys*, límite de 2 activaciones).
2. Copia el enlace de checkout y los ids de tienda y producto (están en la URL
   del panel).
3. Rellena [`config.mjs`](config.mjs):

```js
export const TIENDA = {
  configurada: true,
  proveedor: 'lemonsqueezy',
  urlCompra: 'https://tutienda.lemonsqueezy.com/checkout/buy/xxxxxxxx',
  tiendaId: 12345,     // se comprueba al activar
  productoId: 67890,   // idem
  precio: '19 € pago único',
};
```

Los ids **no son decorativos**: sin esa comprobación, la clave de cualquier
producto de cualquier vendedor de Lemon Squeezy desbloquearía tu extensión.

La API de licencias (`activate`, `validate`, `deactivate`) está pensada para
llamarse desde el cliente: no lleva clave secreta. Por eso una extensión sin
servidor puede cobrar con ella.

### Stripe (cuando ya haya volumen)

Stripe no tiene licencias: hace falta un trozo de servidor que escuche la
compra, genere la clave y luego la valide. Cabe en un Worker de Cloudflare
—gratis hasta 100.000 peticiones al día— con un KV llamado `LICENCIAS`:

```js
export default {
  async fetch(peticion, env) {
    const url = new URL(peticion.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

    // 1. La extensión pregunta por una clave.
    if (url.pathname === '/validar') {
      const guardada = await env.LICENCIAS.get(url.searchParams.get('clave') ?? '', 'json');
      const valida = guardada?.estado === 'activa';
      return new Response(JSON.stringify({ valida, expira: guardada?.expira ?? null }), { headers: cors });
    }

    // 2. Stripe avisa de la compra. Sin verificar la firma, cualquiera se
    //    fabrica licencias gratis: esto no es opcional.
    if (url.pathname === '/stripe' && peticion.method === 'POST') {
      const cuerpo = await peticion.text();
      if (!(await firmaValida(peticion.headers.get('stripe-signature'), cuerpo, env.STRIPE_WEBHOOK_SECRET))) {
        return new Response('firma no valida', { status: 400 });
      }
      const evento = JSON.parse(cuerpo);
      if (evento.type === 'checkout.session.completed') {
        const clave = crypto.randomUUID().toUpperCase();
        await env.LICENCIAS.put(clave, JSON.stringify({
          estado: 'activa',
          expira: null,
          correo: evento.data.object.customer_details?.email ?? null,
        }));
        // Y ahora hay que hacérsela llegar al cliente: página de éxito con
        // ?session_id=, o un correo desde tu proveedor de email.
      }
      return new Response('ok');
    }
    return new Response('no', { status: 404 });
  },
};

async function firmaValida(cabecera, cuerpo, secreto) {
  const partes = Object.fromEntries((cabecera ?? '').split(',').map((p) => p.split('=')));
  if (!partes.t || !partes.v1) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${partes.t}.${cuerpo}`));
  const esperado = [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return esperado === partes.v1 && Math.abs(Date.now() / 1000 - Number(partes.t)) < 300;
}
```

Con eso, en `config.mjs`:

```js
export const TIENDA = {
  configurada: true,
  proveedor: 'propio',
  urlCompra: 'https://buy.stripe.com/tu-payment-link',
  endpoint: 'https://licencias.tudominio.workers.dev/validar',
  precio: '19 € pago único',
};
```

Y en `manifest.json` cambia el `host_permissions` por tu dominio:
`"host_permissions": ["https://licencias.tudominio.workers.dev/*"]`.

### Cómo se comporta la licencia

Lo implementa [`lib/licencia.mjs`](lib/licencia.mjs), con
[pruebas](../test/licencia.test.mjs) de cada caso:

- Se revalida **cada 7 días**, no en cada clic. Revalidar en cada uso
  significa que el día que la API tenga un mal rato tus clientes de pago se
  quedan fuera y tu buzón se llena.
- **Sin conexión, la licencia aguanta 14 días** más. Un cliente en un tren no
  es un moroso.
- Si la API responde con claridad que la clave está revocada, caducada o
  reembolsada, se cae a gratis en el acto y se recuerda.
- "Usar en otro equipo" llama a `deactivate` y libera la activación.

## Qué falta antes de publicar

1. **Verificar las comisiones** de `datos/amazon.json` contra Seller Central y
   poner `_verificado: true`. Mientras sea `false`, la extensión avisa al
   usuario en cada cálculo; eso es deliberado.
2. **Abrir la tienda** y poner `configurada: true` en `config.mjs`. Con `false`
   el botón dice "Pro, próximamente" en vez de llevar a un enlace roto.
3. **Política de privacidad**: la Chrome Web Store la exige. La tuya cabe en un
   párrafo, porque no recoges nada: los costes y el contador viven en el
   navegador del usuario y solo la clave de licencia sale a Internet.
4. Los pasos de tienda, capturas y lanzamiento están en
   [`LANZAMIENTO.md`](LANZAMIENTO.md).
