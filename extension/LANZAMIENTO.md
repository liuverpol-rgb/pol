# Lanzar la extensión

Fase 4: publicar, contarlo y decidir con datos si sigue viva. Todo lo de esta
página se hace **después** de que la extensión funcione y de haber verificado
las comisiones de `datos/amazon.json`.

## 1. Chrome Web Store

**Coste: 5 $ una vez**, para la cuenta de desarrollador (no por extensión).
Se paga en [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).

Antes de subir nada:

```bash
npm test              # todo en verde
npm run empaquetar    # margen-amazon-0.1.0.zip, listo para subir
```

`npm run empaquetar` copia el motor de margen, regenera los iconos, deja fuera
los archivos de desarrollo y te dice en voz alta lo que queda por configurar.
El ZIP se sube tal cual: no hay compilación.

Los textos de la ficha —nombre, descripciones, justificación de cada permiso y
el formulario de privacidad— están escritos y listos para pegar en
[`tienda/FICHA.md`](tienda/FICHA.md).

### Lo que pide la ficha de la tienda

| Pieza | Requisito | Dónde sacarla |
| --- | --- | --- |
| Icono | 128×128 PNG | `iconos/128.png`, ya generado |
| Capturas | 1 a 5, de 1280×800 o 640×400 | Abajo |
| Mosaico pequeño | 440×280 (opcional, pero aparece en las listas) | Fondo verde con el icono y el título |
| Descripción corta | 132 caracteres | Abajo |
| Descripción larga | Hasta 16.000 | Abajo |
| Política de privacidad | URL pública obligatoria | [`tienda/privacidad.html`](tienda/privacidad.html), subida a tu dominio |
| Prácticas de datos | Formulario declarativo | "No se recogen datos de usuario" |

**Las capturas son el 80 % de la conversión.** Cuatro que funcionan, en este
orden:

1. La ficha de Amazon con el popup abierto y la cifra grande visible. Es el
   producto entero en una imagen.
2. El desglose línea a línea: comisión, IVA, envío, devoluciones.
3. El precio de equilibrio, con un producto que sale a pérdida y se ve rojo.
4. El panel de costes, para que se entienda que el cálculo es tuyo y no una
   estimación genérica.

Tacha datos reales de proveedor antes de subirlas. En cada captura, una frase
sobreimpresa de seis palabras; nadie lee más.

### Descripción corta y larga

Escritas y contadas (125 de los 132 caracteres) en
[`tienda/FICHA.md`](tienda/FICHA.md). El esqueleto de la larga, por si la
reescribes:

1. **El problema, en una frase.** "Vendes a 24,90 €, el género te cuesta 12,50
   y crees que ganas 12,40. Te quedan 5,16."
2. **Qué descuenta**, en lista: comisión por referencia de tu categoría,
   tarifa por artículo del Plan Individual, IVA repercutido, coste real de
   una devolución.
3. **Qué NO hace**, en lista. Dicho antes de que lo descubran: no conoce tus
   tarifas negociadas, las comisiones hay que verificarlas en Seller Central,
   no es asesoramiento fiscal.
4. **Privacidad, en dos líneas.** Tus cifras no salen de tu navegador.
5. **Precio.** 5 análisis gratis al mes; Pro quita el límite por un pago único.

### La revisión

Tarda de unas horas a una semana, y va más despacio cuando pides permisos
amplios. Esta extensión pide tres (`storage`, `activeTab`, `scripting`) y un
solo dominio externo; en el formulario hay que justificar cada uno con una
frase:

- `storage`: guardar el contador de usos gratis y los costes del usuario.
- `activeTab` y `scripting`: leer el precio de la ficha que el usuario tiene
  abierta, solo cuando pulsa el icono.
- `host_permissions` de la tienda: validar la clave de licencia de quien paga.

Si el revisor rechaza, el motivo llega por correo y se corrige y se vuelve a
enviar. Un rechazo no quema la cuenta.

## 2. Product Hunt

- **Lanza un martes o miércoles, a las 00:01 PT.** El día empieza ahí y la
  extensión compite las 24 horas enteras.
- Necesitas: galería (las mismas capturas, más un GIF de 10 segundos del flujo
  entero), un título de menos de 60 caracteres y un primer comentario tuyo
  contando por qué la hiciste. Ese comentario importa más que la descripción.
- Prepara la respuesta a la pregunta que te van a hacer: *"¿por qué no una web
  donde pego el ASIN?"*. La respuesta es que el precio se decide mirando la
  ficha, no una pestaña aparte.
- No pidas votos por mensaje privado: es la forma más rápida de que te retiren
  el lanzamiento.

## 3. Reddit, sin que te echen

Ojo con el subreddit que te han recomendado por ahí: **r/amazon es de
compradores, no de vendedores, y prohíbe la autopromoción**. Publicar ahí es
gastar la bala en el sitio equivocado. Los que sirven:

| Subreddit | Qué se puede publicar |
| --- | --- |
| r/chromeextensions | Lanzamientos, sin problema. Es el público natural |
| r/FulfillmentByAmazon | Vendedores de verdad. Lee las reglas: muchos días tienen hilo fijo para herramientas |
| r/AmazonSeller | Igual. Aporta antes de publicar |
| r/SideProject, r/IndieBiz | Lanzamientos de producto propio |
| r/selbststaendig, r/kleinunternehmer | En alemán, si apuntas a Alemania |

La regla que funciona en todos: **publica el cálculo, no la extensión**. Un
post que desglosa los 24,90 € de una camiseta hasta los 5,16 € reales se lee,
se comenta y se guarda; el enlace va en un comentario o en la última línea. Un
post que empieza con "he lanzado mi extensión" se hunde solo.

## 4. Iterar, y saber cuándo parar

Mide solo tres cosas, que se ven en la consola de la tienda sin instalar nada:

1. **Instalaciones** semanales.
2. **Desinstalaciones** en los 7 primeros días: si pasa del 50 %, el problema
   no es el marketing, es que la extensión no convence a la primera.
3. **Conversión a Pro**: compras dividido entre usuarios que llegan al muro
   de los 5 usos. Por debajo del 2 % el precio o la promesa están mal.

**Criterio de cierre, escrito antes de empezar:** si a los 60 días del
lanzamiento no hay 200 instalaciones activas o no hay 5 ventas, se deja de
invertir tiempo en promoción. El código se queda publicado y gratis —cuesta 0 €
al mes mantenerlo— y el tiempo se va al negocio que sí esté respondiendo.

## Cuentas del lanzamiento

| Concepto | Coste |
| --- | --- |
| Cuenta de desarrollador de Chrome Web Store | 5 $, una vez |
| Hosting de la política de privacidad | 0 € (Cloudflare Pages) |
| Lemon Squeezy | 0 € fijos; ~5 % + 0,50 $ por venta |
| Worker de validación, si vas con Stripe | 0 € hasta 100.000 peticiones/día |
| Llamadas a APIs de pago | 0 €: todo el cálculo ocurre en el navegador |

El suelo son 5 $. Si algún día añades una función que llame a una API que
cobre, el contador de `lib/uso.mjs` ya está puesto justo donde hay que poner
el techo de gasto: cinco llamadas por usuario y mes, y ni una más sin cobrar.
