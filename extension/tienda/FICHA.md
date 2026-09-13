# Textos de la ficha de la Chrome Web Store

Para pegar tal cual en el panel de desarrollador. Cada apartado lleva el nombre
del campo del formulario. Lo que va entre corchetes lo rellenas tú.

---

## Nombre (45 caracteres máx.)

```
Margen real en Amazon
```

## Descripción breve (132 caracteres máx.)

```
Lo que de verdad te queda de cada venta en Amazon: comisión, IVA, envío y devoluciones descontados. 5 análisis gratis al mes.
```

## Categoría e idioma

- Categoría: **Productividad** (alternativa: Herramientas para desarrolladores, no).
- Idioma principal: **Español**. Si más adelante traduces, el alemán es el segundo
  mercado natural de esta herramienta.

## Descripción detallada

```
Vendes un producto a 18,99 €, el género te cuesta 7,40 y crees que ganas 11,59.
Te quedan 3,03.

Margen real lee el precio de la ficha de Amazon que tienes abierta y descuenta,
uno a uno, los mordiscos que casi nadie cuenta:

• La comisión por referencia de tu categoría, sobre el precio CON gastos de envío.
• La tarifa por artículo del Plan Individual, o la cuota del Plan Profesional.
• El IVA repercutido, si no estás acogido al régimen de pequeña empresa.
• El 19 % de reverse charge sobre las comisiones, que el Kleinunternehmer paga
  y no puede deducir.
• La licencia de envase.
• Y la devolución, que es el coste que hunde catálogos enteros: te dice cuánto
  cuesta una y cuántas ventas se come.

Además te da el precio de equilibrio: por debajo de esa cifra estás regalando
trabajo, aunque la calculadora del vendedor de al lado diga que ganas.

CÓMO SE USA
1. Abre la ficha de un producto en Amazon.
2. Pulsa el icono.
3. Pon lo que te cuesta el género y el envío. Se guardan: solo se ponen una vez.

TUS CIFRAS NO SALEN DE TU NAVEGADOR
No hay servidor, no hay cuenta, no hay registro. El cálculo ocurre entero en tu
equipo y los costes de tu proveedor no se envían a ningún sitio. La extensión
solo hace una petición a Internet, y únicamente si compras Pro: validar tu clave.

QUÉ NO HACE
• No conoce tus tarifas negociadas ni tu logística real.
• Las comisiones vienen de una tabla por categoría: verifica la tuya en Seller
  Central antes de fijar un precio. La extensión te lo recuerda en cada cálculo.
• No es asesoramiento fiscal.

PRECIO
5 análisis al mes, gratis y sin registro. Volver a abrir un producto que ya
analizaste este mes no gasta cuota. Pro quita el límite: [precio], pago único.
```

## Declaración de finalidad única (*single purpose*)

```
Calcular, sobre la ficha de producto de Amazon que el usuario tiene abierta, el
beneficio neto que le quedaría al venderlo, descontando comisiones, impuestos,
envío y devoluciones. Todo el cálculo ocurre en el navegador del usuario.
```

## Justificación de cada permiso

| Campo | Texto |
| --- | --- |
| `storage` | Guardar en el equipo del usuario sus costes de proveedor, el contador de los cinco análisis gratis del mes y, si la compra, su clave de licencia. |
| `activeTab` | Leer el precio y el título de la ficha de Amazon que el usuario tiene abierta, y solo en el momento en que pulsa el icono de la extensión. |
| `scripting` | Inyectar el script de lectura en esa misma pestaña cuando el usuario pulsa el icono, si la página se cargó antes de instalar la extensión. |
| Permisos de host (tu Worker de licencias) | Validar la clave de licencia de los usuarios que han comprado la versión de pago: se envía la clave y nada más. En la versión gratuita no se usa nunca. |
| Código remoto | **No.** Todo el código se distribuye dentro del paquete; la extensión no descarga ni ejecuta código externo. |

## Prácticas de privacidad (formulario de datos del usuario)

Marca **no** en todas las categorías de recogida de datos. Y las tres casillas
del certificado, que en este caso son ciertas:

- No se venden datos a terceros.
- Los datos no se usan para fines ajenos a la funcionalidad principal.
- No se usan para determinar solvencia ni para conceder préstamos.

URL de la política de privacidad: la de [`privacidad.html`](privacidad.html), ya
publicada en tu dominio.

## Capturas (de 1 a 5, 1280×800)

Hazlas **sobre una ficha real de Amazon**, con el popup abierto y con costes de
proveedor verdaderos (tacha lo que no quieras enseñar). En este orden:

1. La ficha con el popup y la cifra grande visible. Es el producto entero en una imagen.
2. El desglose línea a línea.
3. Un producto que sale a pérdida: la tarjeta se pone en ámbar y aparece el precio
   de equilibrio. Es la captura que más convence.
4. El panel de costes abierto, para que se vea que el cálculo es suyo.

Una frase sobreimpresa de seis palabras en cada una; nadie lee más.

## Antes de darle a publicar

- [ ] `npm run empaquetar` sin avisos pendientes.
- [ ] Comisiones de `datos/amazon.json` contrastadas y `_verificado: true`.
- [ ] `privacidad.html` publicada y su URL pegada en el formulario.
- [ ] Tienda configurada en `config.mjs` (o asumir a conciencia que sale solo con la versión gratuita).
- [ ] Correo de contacto verificado en la cuenta de desarrollador.
