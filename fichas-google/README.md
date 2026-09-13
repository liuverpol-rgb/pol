# Auditoría de ficha de Google

Vendes por 120 € dejar bien la ficha de Google de un negocio local, y 25 € al
mes por mantenerla. Coste de material: **cero**. Lo puedes empezar hoy.

Tú miras la ficha y hablas con el dueño; la hoja que le pones delante la genera
el ordenador.

## Por qué este antes que la web

| | Ficha de Google | Web |
| --- | --- | --- |
| Qué le enseñas | **Lo que ya tiene, puntuado** | Algo que hay que imaginarse |
| Cuántos negocios lo necesitan | Todos, hasta los que tienen buena web | Solo los que no tienen |
| Lo que te cuesta | 0 € | 0 € |
| Lo que cobras | 120 € + 25 €/mes | 300 € |
| Trabajo | 3-5 h | Lo genera el programa |

No sustituye a [`../webs-locales/`](../webs-locales/README.md): **la abre.** Uno
de los 19 criterios es «¿tiene web enlazada?», y cuando la respuesta es no,
tienes la conversación de los 300 € servida en la misma visita, con el mismo
dueño y sin volver a llamar a la puerta.

## Empieza por aquí

1. **[`alemania/RECHT.md`](alemania/RECHT.md)** — seis reglas. La de no reclamar
   nunca la ficha a tu nombre es la que puede costarte caro.
2. **[`VENTAS.md`](VENTAS.md)** — a quién, qué se mira, qué se dice y qué se
   responde a cada objeción.
3. [`TRABAJO.md`](TRABAJO.md) — lo que haces cuando te han pagado, por orden.

## Cómo se hace una auditoría

```bash
node fichas-google/nueva-auditoria.mjs --todos      # una ficha por prospecto
node fichas-google/auditar.mjs                      # resumen de todas
node fichas-google/auditar.mjs salon-schoenmeier    # qué mirar, y qué falta
node fichas-google/auditar.mjs salon-schoenmeier --html
```

Los prospectos son los mismos de `webs-locales/contacto/prospectos.csv`, a
propósito: las dos cosas se venden en la misma visita.

El último comando deja `hojas/salon-schoenmeier.html`: un archivo, sin
dependencias, que se abre en el móvil, se manda por WhatsApp y se imprime con
Strg+P. **Ese es todo tu material de ventas.**

Para ver cómo queda antes de tener ninguna auditada:

```bash
node fichas-google/auditar.mjs ejemplo-salon-muster --html
```

`ejemplo-salon-muster` es un negocio inventado. Los trece de Reinbek están
creados pero **vacíos**: sus criterios están en `null` porque desde aquí no puedo
abrir Google Maps, y porque el estado de una ficha real cambia cada semana. Los
rellenas tú desde el móvil, diez minutos cada uno.

## La tarjeta de reseñas

```bash
node fichas-google/qr-resena.mjs salon-schoenmeier "https://g.page/r/..."
```

Un A6 para el mostrador con el QR de su enlace de reseña. El QR se genera con el
código de `webs-locales/contacto/qr.mjs`: sin dependencias y sin que el enlace
de un cliente pase por el servidor de nadie.

## Cómo se puntúa

19 criterios en [`datos/criterios.json`](datos/criterios.json), cada uno con su
peso, dónde se mira, qué le cuesta al negocio (en alemán, que es lo que va en la
hoja) y qué haces tú para arreglarlo. Suman 100.

| Estado en el JSON | Qué significa | Cuenta para la nota |
| --- | --- | --- |
| `true` | Lo has mirado y está bien | Sí |
| `false` | Lo has mirado y falta | Sí |
| `null` | **No lo has mirado** | **No.** Sale aparte en la hoja |

Esa tercera fila es la regla de la casa. La nota se calcula solo sobre lo
comprobado, y lo que no has visto aparece en la hoja del cliente diciendo
exactamente eso: *«Das sehe ich von außen nicht.»* Enseñarle a un dueño que le
faltan las fotos sin haber mirado las fotos es la forma más rápida de que te
eche, y con razón.

**Los pesos son juicio mío, no un dato de Google**, y la hoja lo dice en el pie.
Lo que no es juicio es la lista: son campos reales del Google-Unternehmensprofil,
comprobables mirando la ficha desde el móvil.

## El precio

Todo en [`datos/oferta.json`](datos/oferta.json), en un solo sitio: 120 € la
instalación, 25 €/mes la Pflege, 60 € la versión reducida que ofreces de palabra
si el precio le frena, y la ficha incluida si se lleva la web.

## Qué no hace esto

- **No promete posiciones en Google.** Nadie puede, y prometerlo te iguala a los
  estafadores telefónicos que ya le han llamado tres veces.
- **No mide el efecto.** No sabe cuántas llamadas le van a entrar de más. Ni yo
  ni nadie: lo que hace es dejar la ficha completa y correcta.
- **No toca reseñas.** Ni una, jamás, salvo responderlas con la voz del dueño.
