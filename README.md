# Cuatro negocios con poco capital

Este repositorio contiene cuatro negocios construidos, no cuatro ideas:

| | Qué es | Tu parte | Dinero |
| --- | --- | --- | --- |
| **[`fichas-google/`](fichas-google/README.md)** | Dejar bien la ficha de Google de un negocio local: 120 € y 25 €/mes | Mirar su ficha y llamar a la puerta | Hoy. **Empieza por aquí.** |
| **[`webs-locales/`](webs-locales/README.md)** | Vender webs a bares y peluquerías por 300 € | Hablar con dueños de negocio | Días. Se vende **en la misma visita** que la ficha |
| **[`dropshipping/`](dropshipping/README.md)** | Vender artículos impresos bajo demanda, sin stock | Conseguir el pedido; el resto lo hace el proveedor | Semanas. Necesita 65-90 € por delante |
| **`web/`** (abajo) | Calculadora fiscal con ingresos por afiliación | Escribir contenido | 3-6 meses, incierto |

Los tres primeros se venden **en la misma puerta**, y ese es todo el plan:

1. **Entras con la ficha de Google.** Cuesta 0 €, se audita desde el móvil en diez
   minutos, y le enseñas algo que ya es suyo con una nota de 37 sobre 100 encima.
   Es el sí más fácil de los tres, y lo necesitan todos los negocios, también los
   que ya tienen buena web.
2. **Uno de los 19 criterios es «¿tiene web enlazada?».** Cuando la respuesta es
   no, la conversación de los 300 € viene sola, con el mismo dueño y sin volver a
   llamar a la puerta.
3. **Al Handwerker que no te compra ninguna de las dos** le puedes colocar veinte
   sudaderas con su logo, cobradas por adelantado.

Si solo vas a leer un documento, que sea
**[`fichas-google/VENTAS.md`](fichas-google/VENTAS.md)**. Si solo vas a leer dos, el
segundo es [`webs-locales/VENTAS.md`](webs-locales/VENTAS.md): la web deja 300 € de
una sola conversación, pero hay que convencer a alguien de algo que todavía no
existe. La ficha ya existe.

**Antes de tocar la ficha de Google de nadie**, lee las seis reglas de
[`fichas-google/alemania/RECHT.md`](fichas-google/alemania/RECHT.md) — sobre todo la
de no reclamarla nunca a tu nombre. Antes de escribir en frío a nadie,
[`webs-locales/alemania/RECHT.md`](webs-locales/alemania/RECHT.md). Y antes de vender
nada físico en Alemania,
[`dropshipping/alemania/RECHT.md`](dropshipping/alemania/RECHT.md).

Y hay una quinta cosa que no es un negocio aparte sino la herramienta de
`dropshipping/` puesta donde se decide el precio:
**[`extension/`](extension/README.md)**, una extensión de Chrome que, sobre la
ficha de un producto de Amazon, dice lo que de verdad queda de esa venta. Cinco
análisis gratis al mes y una versión de pago; el
[plan de lanzamiento](extension/LANZAMIENTO.md) cuesta 5 $ y ningún coste fijo.

El plan de la calculadora está en [`NEGOCIO.md`](NEGOCIO.md).

---

# Cuánto me queda

Calculadora de impuestos para autónomos en España: cuota del RETA, IRPF e IVA en un
solo cálculo, y el dato que nadie más da — **qué porcentaje hay que apartar de cada
factura**.

Sitio estático, sin dependencias, sin backend y sin base de datos. Todo el cálculo
ocurre en el navegador del usuario: las cifras que introduce no salen de su equipo.

El plan de negocio, el presupuesto y el plan de lanzamiento están en
[`NEGOCIO.md`](NEGOCIO.md).

## Estructura

```
web/
  index.html            Portada y calculadora
  metodologia.html      Cómo se calcula, paso a paso
  aviso-legal.html      Aviso legal y privacidad (pendiente de datos del titular)
  css/estilo.css
  js/calculadora.js     Motor de cálculo puro, sin DOM. Reutilizable.
  js/app.js             Interfaz
  data/tarifas-2026.json  TODA la fiscalidad vive aquí
  data/afiliados.json     Bloque de recomendaciones. Desactivado hasta que pongas enlaces reales
test/                   Suite con node:test, sin dependencias
docs/VERIFICAR-TARIFAS.md  Qué contrastar antes de publicar
```

## Desarrollo

```bash
npm test        # 135 pruebas: cálculo fiscal, webs, márgenes, tienda y extensión
npm run dev     # sirve web/ en http://localhost:8080
npm run nichos  # criba de nichos para vender sin stock
npm run margen  # qué queda de cada pedido, plataforma por plataforma
npm run tienda  # genera la tienda estática con sus páginas legales
npm run extension  # prepara la extensión de Chrome (copia el motor de margen)
```

No hay paso de compilación ni `node_modules` en producción. Node solo hace falta
para ejecutar los tests.

## Antes de publicar

1. **Verifica las tarifas.** Las cifras fiscales provienen de fuentes secundarias y
   están sin contrastar; la web lo advierte al usuario mientras sea así. Sigue
   [`docs/VERIFICAR-TARIFAS.md`](docs/VERIFICAR-TARIFAS.md).
2. **Rellena el aviso legal** con los datos del titular en `web/aviso-legal.html`.
3. **Cambia el dominio** en `web/robots.txt`, `web/sitemap.xml` y las etiquetas
   `canonical` y `og:` de los HTML.
4. **Activa los ingresos.** Sustituye los enlaces de ejemplo de
   `web/data/afiliados.json` por los tuyos reales y pon `"activo": true`. Mientras
   esté en `false` el bloque no se pinta: nunca se muestra un enlace de relleno.

## Despliegue

Cualquier hosting estático sirve. Con Cloudflare Pages, gratis y con TLS incluido:

1. Conecta el repositorio en Cloudflare Pages.
2. Comando de compilación: ninguno. Directorio de salida: `web`.
3. Añade el dominio en *Custom domains*.

## Alcance del cálculo

Estimación directa simplificada, persona física, alta el año completo, cotizando por
la base mínima del tramo. No cubre módulos, recargo de equivalencia, sociedades ni
deducciones personales más allá del mínimo general. Es una estimación orientativa,
no una liquidación ni asesoramiento fiscal. Los límites están detallados en la propia
página de metodología.

## Licencia

MIT.
