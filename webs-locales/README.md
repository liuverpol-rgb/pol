# Webs para negocios locales

Vendes páginas web a bares, peluquerías y talleres de tu zona por 300 €.
Tú hablas con ellos; el resto está automatizado aquí.

## ¿Dónde vives?

| | Empieza por |
| --- | --- |
| **Alemania** | **[`alemania/RECHT.md`](alemania/RECHT.md)** y luego [`alemania/AKQUISE.md`](alemania/AKQUISE.md). El correo en frío es ilícito allí: el orden es llamada → permiso → correo. |
| España / Latinoamérica | [`VENTAS.md`](VENTAS.md) — puerta fría |

Es lo único que decide si esto gana dinero. La web la genera el ordenador.

## Cómo se hace una web

Desde un prospecto del CSV, que es lo normal:

```bash
node webs-locales/nueva-ficha.mjs salon-schoenmeier   # ficha con la base del gremio
# rellenas los [bestätigen] con lo que te digan
node webs-locales/generar.mjs clientes/salon-schoenmeier.json
```

O partiendo de un ejemplo:

```bash
cp clientes/bar-la-parra.json clientes/mi-cliente.json   # cambia los datos
node generar.mjs clientes/mi-cliente.json                # web lista
```

`nueva-ficha.mjs` conoce seis gremios (`friseur`, `physio`, `kosmetik`,
`fahrschule`, `gastro`, `handwerk`) y monta la estructura de servicios y el
horario típico de cada uno, todo marcado `[bestätigen]` para que nadie publique
un precio inventado de un negocio real.

Sale una carpeta en `sitios/mi-cliente/` con la web terminada. Ábrela con doble clic
o enséñala en el móvil. Para publicarla, arrastra esa carpeta a
[Cloudflare Pages](https://pages.cloudflare.com) o [Netlify Drop](https://app.netlify.com/drop):
gratis, con HTTPS y en un minuto.

`node generar.mjs --todos` regenera todas las fichas de golpe.

## Qué lleva cada web

Lo que de verdad necesita un negocio local, y nada más:

- **Móvil primero**, con barra fija abajo: Llamar · WhatsApp · Cómo llegar.
- **Abierto / cerrado ahora mismo**, calculado del horario. Casi ninguna web local lo tiene y es lo que más se consulta.
- Carta o servicios con precios, horario con el día de hoy resaltado, galería, reseñas.
- Datos estructurados para que Google la entienda como negocio local.
- Un solo archivo HTML y un CSS. Sin cookies, sin rastreo, sin nada que mantener.

## La ficha del negocio

Todo sale de un JSON. Los campos obligatorios son `nombre`, `tipo` y `telefono`;
el resto se omite solo si no lo pones.

| Campo | Para qué |
| --- | --- |
| `demo` | `true` muestra el aviso de propuesta y bloquea la indexación. **Déjalo en `true` hasta que el cliente pague.** |
| `idioma` | `"de"` para alemán, `"es"` para español. Traduce toda la interfaz. |
| `claim` | Una frase bajo el nombre |
| `whatsapp` | Número con prefijo y sin signos: `34600000000` |
| `mapa` | Enlace de Google Maps |
| `emoji` | Icono de la pestaña |
| `colores.acento` | Color de la marca |
| `horario` | Por día, lista de tramos: `[["09:00","14:00"],["17:00","20:00"]]`. Vacío = cerrado. Las claves valen en alemán (`montag`) o español (`lunes`) |
| `secciones` | Carta o servicios, con `nombre`, `descripcion` y `precio` |
| `galeria`, `resenas`, `redes` | Opcionales |
| `schema` | `Restaurant`, `HairSalon`, `PlumbingBusiness`… ayuda a Google |
| `pais` | Código del país en los datos estructurados. Por defecto lo deduce del idioma |
| `email` | Añade botón de correo en la portada |
| `notdienst` | `{texto, telefono}` — barra roja de urgencias arriba del todo |
| `jobs` | `{titulo, texto, puestos:[{titulo, detalle, tipo}]}` — ofertas de empleo. **En el Handwerk alemán es la sección que más vale** |

## Aviso importante

Mientras `demo` sea `true`, la web sale marcada como propuesta y con `noindex`. Eso
es deliberado: **una web con el nombre de un negocio que no la ha encargado no puede
publicarse como si fuera la oficial.** Es una propuesta comercial hasta que el dueño
la acepta y la paga. Quita el `demo` solo entonces.

## Contacto con los clientes

```bash
node webs-locales/contacto/generar-contacto.mjs        # textos por negocio
node webs-locales/contacto/generar-cartas.mjs          # cartas para imprimir
```

El primero deja en `contacto/salida/` un archivo por negocio con los tres textos
personalizados —guion de llamada, correo y carta— y una `anrufliste.md` con los diez
en una sola hoja para el día de llamadas.

El segundo produce `salida/cartas.html`: una carta por página A4 con el **código QR
del sitio de ese cliente**, lista para imprimir con Strg+P. Pon tus datos en
`contacto/remitente.json`.

**La carta es el único canal comercial en frío permitido en Alemania sin
consentimiento previo.** El correo exige un sí previo por teléfono. Ver
[`alemania/RECHT.md`](alemania/RECHT.md).

Los QR se generan en `contacto/qr.mjs`, sin dependencias ni servicios externos: el
enlace de un cliente no tiene por qué pasar por el servidor de un tercero, y la carta
se imprime sin internet.

## Documentos

- [`alemania/REINBEK.md`](alemania/REINBEK.md) — **los tres primeros prospectos, investigados y con sus webs hechas**
- [`alemania/RECHT.md`](alemania/RECHT.md) — **qué es legal en Alemania.** Léelo antes de escribir a nadie
- [`alemania/AKQUISE.md`](alemania/AKQUISE.md) — plan de 100 negocios y qué hace que el mensaje funcione
- [`VENTAS.md`](VENTAS.md) — versión España: a quién visitar, qué decir, precios y objeciones
- [`clientes/lista.md`](clientes/lista.md) — las 20 puertas
- [`docs/PRESUPUESTO.md`](docs/PRESUPUESTO.md) — presupuesto para mandar por WhatsApp
