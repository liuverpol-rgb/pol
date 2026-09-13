# Cómo se vende una auditoría de ficha de Google

Este es el documento que importa. La hoja la genera el ordenador; lo único que
decide si esto gana dinero es lo que pasa en los dos minutos de la puerta.

## La idea en una frase

No vendes «optimización». **Le enseñas su propia ficha, puntuada, con lo que le
falta escrito en su idioma.** Nadie compra una mejora abstracta. Todo el mundo
reacciona a un 37 sobre 100 con su nombre encima.

Es la misma mecánica que la web de 300 €, con una ventaja: la web hay que
imaginársela; **la ficha ya existe y es suya.** No tienes que convencerle de que
le hace falta algo nuevo. Solo le enseñas lo que ya tiene, y en qué estado.

---

## Paso 1 — A quién (10 min)

Los mismos negocios de [`../webs-locales/clientes/lista.md`](../webs-locales/clientes/lista.md),
y por el mismo motivo: llamas a puertas que ya ibas a llamar. El cliente ideal:

1. **Más de 20 reseñas y buena nota.** Le va bien, tiene dinero y ya le importa
   lo que se dice de él en Google. Sin eso no hay conversación.
2. **La ficha está floja.** Es lo que compruebas en el paso 2.
3. **Atiende el dueño.** En una cadena no decide ninguno de los que están allí.

Aquí no filtras por «no tiene web»: **la ficha la tienen todos**, hasta los que
tienen una web estupenda. El mercado es el doble de grande.

## Paso 2 — Auditar desde el móvil (10 min por negocio)

```bash
node fichas-google/nueva-auditoria.mjs --todos   # una ficha por prospecto
node fichas-google/auditar.mjs salon-schoenmeier # te dice qué mirar, en orden
```

Abres Google Maps, buscas el negocio, y vas marcando `true` o `false` en su
JSON. Los 19 criterios están en `datos/criterios.json` y cada uno lleva escrito
**dónde se mira**.

> **Lo que no has mirado se queda en `null`.** No cuenta para la nota y sale
> aparte, tal cual, en la hoja del cliente: *«Das sehe ich von außen nicht.»*
> Decirle a un dueño que le faltan las fotos sin haber mirado las fotos es la
> forma más rápida de que te eche, y con razón.

Cuatro cosas se ven en cuarenta segundos y ya te dicen si merece la pena entrar:
**si está reclamada**, **la categoría**, **cuántas fotos propias tiene** y **si
responde a las reseñas**. Son 33 de los 100 puntos.

## Paso 3 — La hoja (1 min)

```bash
node fichas-google/auditar.mjs salon-schoenmeier --html
```

Sale `fichas-google/hojas/salon-schoenmeier.html`. Ábrela en el móvil antes de
entrar. **Ese es tu único material de ventas.** Se imprime con Strg+P si
prefieres dejarla en papel.

## Paso 4 — Entrar (2 minutos)

Media mañana o media tarde, **nunca en hora de comer**. Si es un bar, pide algo:
1,50 € cambian por completo cómo te reciben.

> «Guten Tag, ich heiße [nombre]. Ich mache Google-Profile für Betriebe hier aus
> Reinbek. Ich habe mir Ihres heute Morgen angeschaut und aufgeschrieben, was
> darin fehlt. Darf ich Ihnen das kurz zeigen?»

**Y le pones el móvil delante.** No expliques. Que lo lea.

Cállate mientras mira. El silencio vende; hablar encima, no.

Cuando levante la vista:

> «Das meiste davon ist an einem Nachmittag erledigt. Ich mache das komplett für
> **120 Euro**, einmalig. Die Fotos mache ich selbst, hier bei Ihnen.»

## Paso 5 — Cerrar en la misma visita

Si dice que sí, **no te vayas a preparar nada**. Se hace allí:

1. Él entra en su perfil desde su móvil y tú le pides acceso como `Verwalter`.
   Diez segundos, y le queda a él el poder de quitártelo.
2. Le preguntas los precios de sus servicios y los apuntas.
3. **Haces las fotos ahí mismo**, si es buen momento. Es la mitad del trabajo y
   la parte por la que no te puede pagar menos.
4. Cobras. En mano o por transferencia ese día.

Si el perfil no está verificado, el paso 1 cambia: la verificación la hace él
—Google le manda un código a la dirección o le pide un vídeo— y tú vuelves
cuando llegue. Por qué no puedes hacerlo tú está en
[`alemania/RECHT.md`](alemania/RECHT.md), y es la regla que más caro sale saltarse.

---

## Objeciones

**«Das macht schon jemand.»**
> «Gut. Wann wurde denn das letzte Foto hochgeladen?» — Se la enseñas. Google
> pone la fecha bajo cada foto. Si es de hace dos años, la conversación sigue
> sola.

**«Was bringt mir das?»**
> «Eine Platzierung kann Ihnen niemand seriös versprechen, ich auch nicht. Was
> ich Ihnen sagen kann: wer Sie sucht, sieht dann Ihre Preise, Ihre Fotos und
> Ihre Öffnungszeiten — statt einer fast leeren Seite.»

Nunca prometas el primer puesto ni cifras de clics. Los que prometen eso son los
estafadores del teléfono, y el dueño ya ha colgado a tres.

**«Da rufen ständig welche an, angeblich von Google.»**
> «Ja, und die meisten sind unseriös. Deswegen stehe ich hier und rufe nicht an.
> Ich gehöre nicht zu Google.»

Es la mejor objeción que te pueden poner. Estar en la puerta, con la hoja de su
negocio hecha, es exactamente lo que un estafador telefónico no puede hacer.

**«120 Euro sind mir zu viel.»**
> «Dann machen wir nur die Grundlagen — Kategorie, Leistungen, Öffnungszeiten
> und die Beschreibung. **60 Euro**, ohne Fotos und ohne Bewertungsantworten.»

Esa rebaja **no está en la hoja a propósito**. Es lo que ofreces de palabra, y
solo cuando ya te ha dicho que no al precio. Si la enseñas antes, nadie paga 120.

**«Ich habe genug zu tun.»**
> «Dann geht es nicht um mehr Anrufe, sondern um weniger falsche: wer Ihre Preise
> vorher sieht, ruft nicht an, um danach zu fragen.»

Y si es un Handwerker, cambia de tema a personal, igual que con las webs: la
gente que busca trabajo también mira la ficha.

---

## El precio, y por qué es ese

| | Precio | Trabajo real |
| --- | ---: | --- |
| Einrichtung completa | **120 €** | 3-5 h, de las cuales casi una hora son las fotos |
| Solo Grundlagen (de palabra) | 60 € | 1,5-2 h |
| **Pflege mensual** | **25 €/mes** | ~1 h al mes |
| Web + ficha juntas | 300 € | La ficha va incluida |

Sale a unos 30-40 € la hora. No es una fortuna, pero **el coste de material es
cero, cobras el día que lo haces y no hay nada que devolver.**

**La Pflege de 25 € es la parte que de verdad importa a medio plazo.** Diez
clientes son 250 € que entran todos los meses sin volver a vender nada. Véndela
siempre en el mismo momento, cuando acabas de entregar y se ve el antes y el
después:

> «Wenn Sie wollen, halte ich es weiter aktuell: ein Beitrag die Woche, neue
> Fotos, Antwort auf jede Bewertung. 25 Euro im Monat, monatlich kündbar.»

Los precios están en [`datos/oferta.json`](datos/oferta.json), en un solo sitio.
Si los cambias ahí, cambian en la hoja y en el resumen a la vez.

## Los números que no tengo

De 20 visitas a puerta fría salen 1 o 2 clientes de web. **Para esto no tengo un
dato propio y no me lo voy a inventar.** Cabe esperar que cierre algo mejor
—cuesta un tercio y el problema se ve en pantalla—, pero eso es una suposición
hasta que la compruebes tú.

Apunta en `negocios/<id>.json`, en `notas`, qué pasó en cada visita. Después de
veinte tendrás tu número de verdad, y ese sí vale.

## Lo que nunca se hace

- **Prometer posiciones en Google.** Nadie puede.
- **Dar a entender que vienes de Google.** Ni de broma, ni «somos partner».
- **Reclamar la ficha a tu nombre.** Nunca, por rápido que parezca.
- **Comprar, escribir o incentivar reseñas.** Es lo que hunde el negocio entero.
- **Inventar porcentajes.** «70 % más de clics» no lo puedes sostener, y el día
  que un cliente te lo pida por escrito estás vendido.

Los cinco están explicados, con la ley que los respalda, en
[`alemania/RECHT.md`](alemania/RECHT.md).
