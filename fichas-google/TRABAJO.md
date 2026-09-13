# Lo que haces cuando te han pagado

Orden fijo. Está pensado para hacerse en una tarde y para que, si te
interrumpen, puedas retomar sin pensar. Entre paréntesis, los minutos de
`datos/criterios.json`.

## Antes de tocar nada (5 min)

**Haz una copia de cómo estaba.** Capturas de pantalla del perfil entero: ficha,
fotos, reseñas, horario. Dos motivos:

1. Si algo sale mal, sabes qué había.
2. **Es tu «antes».** Al entregar, el antes y el después uno al lado del otro es
   lo que vende la Pflege de 25 € al mes.

Y comprueba que tienes acceso como `Verwalter`, no como `Inhaber`. Si te ha
hecho `Inhaber`, cámbialo: no debe ser así ni un día.

## 1. Lo que protege la ficha (5 min)

- **Nombre**: el del Gewerbeschein, sin palabras clave colgadas. Si había algo
  raro, se quita ahora y se le explica por qué.

Va primero porque es lo único que puede hacer que le suspendan el perfil.

## 2. Lo que decide dónde aparece (25 min)

- **Hauptkategorie** (15): la más específica que exista. Antes de elegir, busca
  su servicio en Google Maps y mira qué categoría usan los tres primeros.
- **Zusatzkategorien** (10): de dos a cinco, solo lo que preste de verdad.

Son 13 puntos de la nota y el cambio que más se nota. También el más fácil de
hacer mal: una categoría que no le corresponde le quita las búsquedas buenas.

## 3. Lo que la gente mira antes de llamar (55 min)

- **Öffnungszeiten** (10): los siete días, con las pausas del mediodía y el día
  de cierre puesto como `geschlossen`, no en blanco.
- **Sonderöffnungszeiten** (10): los festivos de los próximos doce meses de una
  tacada. En Schleswig-Holstein y Hamburgo no son los mismos días; míralos.
- **Telefon** (5): el número que coge hoy. Llámalo desde tu móvil para
  confirmarlo.
- **Website** (5): el enlace. Si no tiene web, aquí es donde le enseñas la de
  [`../webs-locales/`](../webs-locales/README.md).
- **Leistungen mit Preis** (30): entre ocho y quince. **Los precios los dice él.**
  No se deduce ninguno, ni «lo normal en el gremio».
- **Attribute** (10): Parkplatz, barrierefrei, Kartenzahlung, Termin
  erforderlich, WLAN. Solo lo que sea cierto.

## 4. Las fotos (55 min)

La parte que más tiempo lleva y la que más se ve. Diez, con el móvil, en
horizontal, con luz de día y sin filtros:

1. Fachada con el rótulo legible
2. La entrada, como la ve quien llega andando
3. Sala principal, desde la puerta
4. Sala principal, desde el otro extremo
5. El puesto de trabajo: el sillón, la camilla, la barra, el taller
6. Un detalle del oficio (las tijeras, la máquina, el plato)
7. Trabajo terminado
8. El dueño o el equipo, si quieren salir
9. Zona de espera o mostrador
10. Aparcamiento o cómo se llega, si tiene truco

Luego, **Titelbild** (la mejor horizontal) y **Logo** (cuadrado).

Antes de disparar: si se reconoce a alguien hace falta su permiso, y si hay
clientes dentro, esperas o encuadras sin ellos. Está en
[`alemania/RECHT.md`](alemania/RECHT.md#5-las-fotos-tienen-dueño).

## 5. Lo que se lee (50 min)

**Unternehmensbeschreibung** (20), 750 caracteres. Escríbela con lo que te haya
contado él en la visita. Sin superlativos, sin palabras clave metidas a la
fuerza, y que responda a tres cosas: qué hace, desde cuándo, y para quién.

**Antworten auf Bewertungen** (30). Todas las pendientes, empezando por las
malas. Cortas, distintas entre sí, firmadas con el nombre del negocio, **sin
mencionar nunca datos del cliente**:

> *Vielen Dank für die Bewertung — freut uns, dass Sie zufrieden waren.
> Bis zum nächsten Mal.*

> *Danke für die offene Rückmeldung. Das war nicht, wie es sein soll. Melden Sie
> sich gern direkt bei uns, wir schauen uns das an.*

Las respuestas las aprueba el dueño antes de publicarlas. Es su voz, no la tuya.

## 6. El sistema de reseñas (20 min)

Saca el enlace corto del perfil (`Bewertungen` → `Mehr Bewertungen erhalten`) y
hazle la tarjeta del mostrador:

```bash
node fichas-google/qr-resena.mjs salon-schoenmeier "https://g.page/r/..."
```

Sale un A6 listo para imprimir, con el QR generado aquí mismo —sin depender de
ningún servicio externo, que es lo que hace que siga funcionando dentro de un
año. Lo imprimes, lo pones en un portamenús de mesa y le enseñas a pedirla de palabra al
terminar el servicio. **Se pide; no se compra, no se escribe y no se premia.**

## 7. Entrega (15 min)

1. Vuelve a marcar los criterios en `negocios/<id>.json` y genera la hoja otra
   vez. Ahora sale en verde: **ese es el recibo de lo que has hecho.**
2. Enséñale el antes y el después con las capturas del principio.
3. Factura con los datos del § 14 UStG, la frase del § 19 UStG si eres
   Kleinunternehmer, y la línea de cesión de derechos de las fotos.
4. Ofrece la Pflege de 25 €/mes **en ese momento**, no una semana después.

## La Pflege mensual (≈1 h)

Una hora al mes por cliente, siempre el mismo día:

- Cuatro Beiträge, uno por semana. Dos frases bastan: oferta, vacaciones,
  servicio nuevo, algo de temporada.
- Una o dos fotos nuevas.
- Respuesta a cada reseña nueva, en menos de dos días.
- Festivos del mes siguiente.
- Mirar si Google ha «sugerido» cambios de terceros en la ficha. Pasa más de lo
  que parece y por eso el mantenimiento no es un regalo envuelto.

Con diez clientes son diez horas al mes y 250 € que entran solos.
