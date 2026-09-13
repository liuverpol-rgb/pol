# Servidor de licencias (Stripe)

Un Worker de Cloudflare de un archivo. Es lo único que hace falta para cobrar
con Stripe, porque Stripe cobra pero no genera claves de licencia: eso lo pones
tú. **Coste: 0 €/mes** (el plan gratuito da 100.000 peticiones al día; vender
licencias gasta cuatro).

```
worker.mjs      las rutas: /stripe, /exito, /clave, /activar, /desactivar, /validar
exito.mjs       la página donde el comprador ve su clave
wrangler.toml   configuración del despliegue
```

## Tope de equipos

Una clave vale para **dos navegadores** (`LIMITE_EQUIPOS` en `worker.mjs`;
cambiar el número y desplegar es todo). La extensión manda un identificador de
instalación —azar, sin ningún dato personal— al activar y al revalidar:

- reinstalar en el mismo navegador no gasta plaza;
- «Usar en otro equipo» libera la plaza y el equipo liberado vuelve a gratis
  en su siguiente revalidación, como mucho siete días después;
- el identificador se guarda en el almacenamiento **local**, no en el
  sincronizado: si viajara con la cuenta de Chrome, todos los perfiles del
  usuario serían el mismo equipo y el tope no contaría nada.

Lo que este tope frena es que una clave circule por un foro. No frena a quien
se ponga a borrar los datos del navegador, y no pretende hacerlo: cada plaza
recuperada así le cuesta al usuario volver a configurar sus costes.

El KV de Cloudflare no tiene transacciones, así que dos activaciones
exactamente simultáneas podrían colar un equipo de más. El daño máximo es ese
equipo extra; evitarlo pide un Durable Object, que cuesta más de lo que vale.

Probado en [`test/licencias.test.mjs`](../../test/licencias.test.mjs): 14 pruebas,
incluida una de punta a punta que compra, activa la licencia en la extensión y
comprueba que un reembolso la tira.

## Qué pasa cuando alguien paga

```
Comprador → Payment Link de Stripe → paga
                                       │
                 Stripe POST /stripe ──┤ (firmado; se verifica)
                                       │  se genera MRA-XXXX-XXXX-XXXX
                                       ▼
     Stripe le redirige a /exito?session_id=… → ve su clave y la copia
                                       │
                      la pega en la extensión → GET /validar?clave=…
                                       │
                          cada 7 días la extensión revalida
```

La entrega va por la página de confirmación, no por correo: es la única forma
de que la clave llegue sin montar un proveedor de email y sin depender de que
no caiga en spam. Stripe manda además su recibo, que sirve de justificante.

## Desplegarlo (15 minutos)

Necesitas una cuenta de Cloudflare (gratis) y `npx`.

```bash
cd extension/licencias

npx wrangler login
npx wrangler kv namespace create LICENCIAS
#   imprime un id: pégalo en wrangler.toml, en id = "PEGA_AQUI_EL_ID_DEL_KV"

npx wrangler deploy
#   imprime tu URL: https://licencias-margen.<tu-subdominio>.workers.dev
```

Apunta esa URL: aparece en tres sitios más.

## Configurar Stripe

1. **Producto y Payment Link.** Products → añade *Margen real en Amazon Pro*,
   pago único, el precio que elijas → Create payment link.
2. **Página de confirmación del Payment Link** (esto es lo que casi todo el
   mundo olvida): en el propio enlace, *After payment* → *Redirect customers to
   your website* →

   ```
   https://licencias-margen.<tu-subdominio>.workers.dev/exito?session_id={CHECKOUT_SESSION_ID}
   ```

   Las llaves van tal cual: Stripe las sustituye. Sin esta línea, el cliente
   paga y no recibe ninguna clave.
3. **Webhook.** Developers → Webhooks → Add endpoint →
   `https://licencias-margen.<tu-subdominio>.workers.dev/stripe`, y marca
   exactamente estos cuatro eventos:

   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `charge.refunded`
   - `charge.dispute.created`

4. **El secreto del webhook.** Stripe te enseña un `whsec_...`:

   ```bash
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

   No lo pegues en `wrangler.toml`: ese archivo se versiona.

5. **Impuestos.** Actívalo en Settings → Tax, y lee el apartado de abajo antes.

## Conectar la extensión

En [`../config.mjs`](../config.mjs):

```js
export const TIENDA = {
  configurada: true,
  proveedor: 'propio',
  urlCompra: 'https://buy.stripe.com/tu-payment-link',
  endpoint: 'https://licencias-margen.<tu-subdominio>.workers.dev/validar',
  precio: '19 € pago único',
};
```

Y en [`../manifest.json`](../manifest.json), el mismo dominio:

```json
"host_permissions": ["https://licencias-margen.<tu-subdominio>.workers.dev/*"]
```

**Los dos tienen que coincidir.** Si no, Chrome bloquea la validación sin decir
nada y quien ha pagado se queda fuera. `npm run empaquetar` lo comprueba y
avisa, y hay un test que también lo vigila.

## Probarlo antes de cobrar de verdad

Con las claves de prueba de Stripe (modo *Test*):

```bash
npx stripe login
npx stripe listen --forward-to https://licencias-margen.<sub>.workers.dev/stripe
npx stripe trigger checkout.session.completed
```

Y la compra completa: abre el Payment Link en modo prueba, paga con la tarjeta
`4242 4242 4242 4242`, mira que aterrizas en `/exito` con una clave, pégala en
la extensión y comprueba que el contador desaparece y sale «Pro · sin límite».
Después, `npx stripe trigger charge.refunded` y comprueba que a la siguiente
revalidación vuelve a gratis.

## El IVA, que con Stripe es tuyo

Con Lemon Squeezy el vendedor legal era ellos. **Con Stripe el vendedor eres
tú**, y vender software descargable a consumidores de la UE significa aplicar
el IVA del país del comprador y declararlo. Dos caminos:

- **Ventanilla única (OSS).** Te registras una vez y declaras trimestralmente
  todo lo vendido a consumidores de otros países de la UE. Activa **Stripe Tax**
  (≈0,5 % por transacción) para que calcule y cobre el tipo correcto en cada
  venta; sin él tendrás que calcularlo a mano.
- **Solo empresas.** Si vendes únicamente a empresas con VAT-ID válido, es
  reverse charge y facturas sin IVA. Pero eso deja fuera al vendedor particular
  de Amazon, que es medio público de esta extensión.

Si estás acogido al régimen de pequeña empresa (Kleinunternehmer), esto no te
exime automáticamente en ventas transfronterizas: pregúntale a tu asesor antes
de la primera venta, no después. Es una hora de consulta, y es la diferencia
entre cobrar tranquilo y regularizar a posteriori.

## Preguntas que van a llegar

**«He perdido la clave.»** Busca su compra en Stripe, copia el id de la sesión
(`cs_...`) y abre
`https://licencias-margen.<sub>.workers.dev/clave?session_id=cs_...`.

**«Cambié de ordenador y no me deja activarla.»** Si ya no tiene acceso al
navegador antiguo para liberar la plaza, libérasela tú:
`/desactivar?clave=MRA-...&equipo=<id>`. Los identificadores activos de una
clave están en el KV, en `clave:MRA-...`.

**«Me han devuelto el dinero y sigo teniendo Pro.»** La extensión revalida cada
siete días; hasta entonces sigue activa. Es deliberado: revalidar en cada clic
deja sin servicio a los clientes buenos el día que el Worker tenga un mal rato.

**«¿Y si cierras el Worker?»** Mientras siga en pie, todo funciona. Si algún día
lo apagas, sube una versión de la extensión con `configurada: false` y sin
validación remota, para que nadie se quede con una licencia inservible.
