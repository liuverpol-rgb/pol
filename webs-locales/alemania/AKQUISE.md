# Plan de captación en Alemania — 100 negocios

Sustituye al plan de puerta fría de `VENTAS.md`, que estaba pensado para España.
**Antes de nada lee [`RECHT.md`](RECHT.md).**

## Qué hace que el mensaje sea *sehr interessant*

Nueve de cada diez correos comerciales dicen *«ofrecemos soluciones digitales
profesionales»*. Se borran sin abrir. Lo que hace que el tuyo funcione son seis
cosas, por orden de importancia:

### 1. La web ya está hecha (esto es el 80 %)
No ofreces construir algo. **Mandas el enlace a su web terminada, con su nombre, su
horario y sus reseñas.** Nadie borra eso. Es la diferencia entre *«¿quiere una web?»*
y *«aquí tiene su web»*. Todo lo demás son detalles.

### 2. Una frase que demuestre que no es masivo
La primera línea tiene que ser algo que solo puedas saber mirando *su* negocio:

> «En Google todavía aparecen sus horarios de verano.»
> «Tiene 184 reseñas con 4,6 estrellas y ninguna página propia.»
> «Es el único salón del barrio que abre los sábados con cita.»

Esa frase va en la columna `beobachtung` del CSV. **Es el campo más importante de
todo el sistema.** Cuesta 30 segundos por negocio en Google Maps y multiplica la
respuesta.

### 3. Hablar de él, no de ti
Cero *«wir bieten»*, cero *«unser Team»*, cero palabra «Digitalisierung». Solo qué
gana él: que le encuentren, que vean si está abierto, que le llamen de un toque.

### 4. Corto de verdad
Cinco líneas. Si no cabe en la pantalla del móvil sin bajar, sobra texto.

### 5. El precio, dentro
No lo escondas para «hablarlo luego». En Alemania eso genera desconfianza. 300 €
únicos y 60 € al año, escrito. Filtra a quien no va a comprar y da credibilidad.

### 6. Salida fácil
*«Wenn nicht, hören Sie nichts mehr von mir.»* Baja la guardia, y además es
exactamente lo que la ley espera de ti.

### Lo que NUNCA debes hacer
Adjuntos, imágenes incrustadas, logotipos, píxeles de seguimiento, firmas de cinco
líneas, o mandar el mismo texto en BCC a 100 direcciones. Cualquiera de esas cosas te
manda a la carpeta de spam y te acerca a una Abmahnung.

---

## Conseguir los 100 negocios

**Te lo digo claro: yo no puedo sacarlos.** No tengo acceso a Google Maps desde aquí
y no puedo rastrear directorios. Esta hora y media es tuya. Es lo único de todo el
sistema que no puedo automatizar.

**Cómo hacerlo en 90 minutos:**

1. Google Maps → busca en tu ciudad: `Restaurant`, `Friseur`, `KFZ-Werkstatt`,
   `Physiotherapie`, `Bäckerei`, `Kosmetikstudio`, `Fahrschule`, `Zahnarzt`.
2. Descarta a los que **ya tienen web**. Ese es el filtro principal — y además es
   tu base legal para poder llamarles (ver `RECHT.md`).
3. Quédate con los que tienen **más de 20 reseñas y 4,0 o más**. Les va bien,
   pueden pagar.
4. Apunta en `contacto/prospectos.csv`: nombre, tipo, teléfono, persona si la ves,
   número de reseñas, y **la observación personal**.

Un negocio bien apuntado son 60 segundos. 100 negocios, hora y media.

> Los datos de contacto profesionales publicados en Google Maps se pueden usar
> para contacto B2B. Lo que no puedes es comprarlos en listas ni rasparlos en masa.

## El ritmo semanal (5+ horas)

| Día | Tarea | Tiempo |
| --- | --- | --- |
| Lunes | Apuntar 25 negocios nuevos en el CSV | 45 min |
| Martes | Preparar 10 webs y generar los paquetes | 2 h |
| Mié / Jue | **Llamar a esos 10** (mañana o media tarde) | 1,5 h |
| Viernes | Correos a los que dijeron que sí + seguimiento | 1 h |

```bash
node webs-locales/generar.mjs --todos                  # las webs
node webs-locales/contacto/generar-contacto.mjs        # los textos
```

Cada negocio sale en `contacto/salida/<id>.md` con las tres versiones listas:
llamada, correo y carta.

## Los números reales

De 100 negocios trabajados así:

| Etapa | Cuántos |
| --- | ---: |
| Contactados | 100 |
| Llamadas donde hablas con el dueño | ~45 |
| Dicen «sí, mándamelo» | ~18 |
| Abren la web | ~15 |
| Quieren hablar en serio | ~5 |
| **Compran** | **2 – 4** |

**2 a 4 clientes = 600 a 1.200 €**, con un coste de 10 € por dominio.

Si mandas 100 correos en frío sin llamar: más o menos la misma conversión, y una
probabilidad nada pequeña de que uno de los 100 te salga con abogado. Por eso el
orden es llamada primero.

## Cuando llames

- **Martes a jueves.** Lunes están liados, viernes ya no.
- **10:00–11:30 o 14:30–16:30.** Nunca en hora de comer, y menos a un restaurante.
- Las tres primeras llamadas son práctica. **Cuenta con que salgan mal.**
- Si el dueño no está: *«Wann erreiche ich ihn am besten?»* y apunta la hora.
- Un no es un no. Táchalo y sigue. Insistir es lo que genera denuncias.

## Ventaja tuya, y es grande

Los negocios alemanes reciben ofertas de agencias que cobran **1.500-3.000 €** por
una web local. Tú llegas con la web hecha por 300 €. La comparación se hace sola —
no tienes ni que mencionarla.
