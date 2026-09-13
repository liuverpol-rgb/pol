# Tres negocios con poco capital

Este repositorio contiene tres negocios construidos, no tres ideas:

| | Qué es | Tu parte | Dinero |
| --- | --- | --- | --- |
| **[`webs-locales/`](webs-locales/README.md)** | Vender webs a bares y peluquerías por 300 € | Hablar con dueños de negocio | Días. **Empieza por aquí.** |
| **[`dropshipping/`](dropshipping/README.md)** | Vender artículos impresos bajo demanda, sin stock | Conseguir el pedido; el resto lo hace el proveedor | Semanas. Se vende **en la misma visita** que la web |
| **`web/`** (abajo) | Calculadora fiscal con ingresos por afiliación | Escribir contenido | 3-6 meses, incierto |

Si solo vas a hacer una cosa, lee **[`webs-locales/VENTAS.md`](webs-locales/VENTAS.md)**:
una web deja 300 € de una sola conversación y no cuesta nada montarla. Un pedido
de camisetas deja 5 €. Esa comparación está hecha con números en
[`dropshipping/PLAN.md`](dropshipping/PLAN.md), y es la razón del orden de la tabla.

El segundo negocio existe porque **se vende en la puerta que ya estás llamando**:
al Handwerker que no te compra la web le puedes colocar veinte sudaderas con su
logo, cobradas por adelantado. Antes de vender nada físico en Alemania, lee
[`dropshipping/alemania/RECHT.md`](dropshipping/alemania/RECHT.md).

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
npm test        # 76 pruebas: cálculo fiscal, generador de webs, márgenes y tienda
npm run dev     # sirve web/ en http://localhost:8080
npm run nichos  # criba de nichos para vender sin stock
npm run margen  # qué queda de cada pedido, plataforma por plataforma
npm run tienda  # genera la tienda estática con sus páginas legales
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
