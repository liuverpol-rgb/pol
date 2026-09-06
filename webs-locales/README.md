# Webs para negocios locales

Vendes páginas web a bares, peluquerías y talleres de tu zona por 300 €.
Tú hablas con ellos; el resto está automatizado aquí.

**Empieza por [`VENTAS.md`](VENTAS.md).** Es lo único que decide si esto gana dinero.

## Cómo se hace una web

```bash
cp clientes/bar-la-parra.json clientes/mi-cliente.json   # cambia los datos
node generar.mjs clientes/mi-cliente.json                # web lista
```

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
| `claim` | Una frase bajo el nombre |
| `whatsapp` | Número con prefijo y sin signos: `34600000000` |
| `mapa` | Enlace de Google Maps |
| `emoji` | Icono de la pestaña |
| `colores.acento` | Color de la marca |
| `horario` | Por día, lista de tramos: `[["09:00","14:00"],["17:00","20:00"]]`. Vacío = cerrado |
| `secciones` | Carta o servicios, con `nombre`, `descripcion` y `precio` |
| `galeria`, `resenas`, `redes` | Opcionales |
| `schema` | `Restaurant`, `HairSalon`, `AutoRepair`… ayuda a Google |

## Aviso importante

Mientras `demo` sea `true`, la web sale marcada como propuesta y con `noindex`. Eso
es deliberado: **una web con el nombre de un negocio que no la ha encargado no puede
publicarse como si fuera la oficial.** Es una propuesta comercial hasta que el dueño
la acepta y la paga. Quita el `demo` solo entonces.

## Documentos

- [`VENTAS.md`](VENTAS.md) — a quién visitar, qué decir, precios y objeciones
- [`clientes/lista.md`](clientes/lista.md) — las 20 puertas
- [`docs/PRESUPUESTO.md`](docs/PRESUPUESTO.md) — presupuesto para mandar por WhatsApp
