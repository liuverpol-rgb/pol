# Cómo se consigue el primer cliente

Este es el documento que importa. La web ya la hago yo; lo único que decide si
ganas dinero es esta parte.

## La idea en una frase

No vendes una web. **Enseñas la web del negocio ya hecha** y preguntas si la quieren.
Nadie compra algo que tiene que imaginarse. Todo el mundo reacciona a algo que ya
existe y lleva su nombre.

---

## Paso 1 — Elegir a quién visitar (30 min)

Busca en Google Maps tu zona: `bar`, `peluquería`, `taller mecánico`, `clínica dental`,
`academia`, `fisioterapeuta`.

**El cliente ideal cumple tres cosas:**

1. Tiene ficha de Google con **más de 20 reseñas y buena nota**. Significa que le va bien
   y tiene dinero. Un negocio que va mal no te va a pagar.
2. **No tiene web**, o tiene una de hace quince años que no se ve en el móvil.
3. Es el dueño quien atiende. En una cadena no decide nadie de los que están allí.

Haz una lista de 20 en `clientes/lista.md`. De 20 visitas salen 1 o 2 clientes. Ese es
el número real: **no te desanimes con los primeros noes, están contados en el plan.**

## Paso 2 — Preparar la web ANTES de ir (15 min por negocio)

De la ficha de Google del negocio sacas todo: nombre, teléfono, dirección, horario,
fotos, reseñas. Pásamelo y yo relleno la ficha, o cópiala tú:

```bash
cp webs-locales/clientes/bar-la-parra.json webs-locales/clientes/bar-manolo.json
# cambia los datos
node webs-locales/generar.mjs webs-locales/clientes/bar-manolo.json
```

Ábrela en tu móvil antes de entrar. **Ese es tu único material de ventas.**

> Sale con el aviso amarillo de "propuesta, no es la web oficial". Déjalo puesto:
> te protege legalmente y además refuerza el mensaje — está hecha para él, aún no
> es suya.

## Paso 3 — Entrar (2 minutos)

**Ve a media mañana o media tarde. Nunca en hora de comer.** Pide algo si es un bar:
un café son 1,50 € y cambia por completo cómo te reciben.

Pregunta por el dueño. Cuando salga:

> «Hola, me llamo [nombre]. Hago páginas web para negocios de aquí.
> He visto que **[nombre del negocio]** no tiene, así que le he hecho una
> para enseñarle cómo quedaría. ¿Tiene dos minutos?»

**Y le pones el móvil delante.** No expliques. Que la vea.

Cállate mientras la mira. El silencio vende; hablar encima, no.

Cuando levante la vista:

> «Está hecha con sus datos reales, su horario y sus reseñas. Si le gusta,
> se la dejo funcionando con su dominio esta semana.»

## Paso 4 — El precio

Cuando pregunte cuánto —y va a preguntar—, dilo sin adornos y **cállate después**:

> «Trescientos euros, y ya está todo hecho: la web, el dominio y ponerla en Google.
> Después son sesenta al año para mantenerla y hacer cambios.»

| Concepto | Precio |
| --- | ---: |
| Web completa, pago único | **300 €** |
| Mantenimiento y dominio | 60 €/año |
| Cambios de carta o precios | incluidos |
| Fotos hechas por ti | +50 € |

**Cobra 150 € por adelantado** y el resto al entregar. Quien no adelanta nada casi
nunca paga. Si te dicen que es mucho: *«Lo entiendo. Son 25 € al mes el primer año,
menos que una caña al día.»* Y no bajes de 250 €. Regalar tu trabajo enseña al
cliente que no vale nada.

## Paso 5 — Las cinco respuestas que te van a dar

| Te dicen | Contestas |
| --- | --- |
| «Ya tengo Instagram» | «Instagram está muy bien, pero cuando alguien busca *[tipo] en [ciudad]* en Google no le sale usted. Y en la web ve el horario y llama sin tener cuenta.» |
| «Ahora no tengo dinero» | «Sin problema. Se la dejo guardada. ¿Le va bien que pase en dos semanas?» — y **pasas de verdad**. |
| «Mi sobrino me la iba a hacer» | «Perfecto, mejor en familia. Si al final no sale, aquí la tiene hecha.» Y te vas. No compitas contra la familia. |
| «Déjame pensarlo» | «Claro. Le dejo el enlace para que la vea con calma. ¿Le llamo el jueves?» — **con día concreto**, o no vuelve a pasar nada. |
| «¿Y esto para qué me sirve?» | «Para que quien le busque en el móvil le encuentre, vea que está abierto y le llame de un toque. Eso es todo.» |

## Paso 6 — Cuando dice que sí

1. Cobras los 150 € (Bizum es lo normal aquí).
2. Le pides: fotos buenas, carta o servicios actualizados, y confirmación del horario.
3. Me pasas todo y yo dejo la web terminada.
4. Compras el dominio (~10 €) y la publicas en Cloudflare Pages (gratis).
5. Se la enseñas funcionando y cobras los otros 150 €.
6. **Le pides dos nombres**: «¿Conoce a alguien más del barrio que le pueda servir?»
   Un cliente contento vale más que veinte puertas frías.

---

## Los números

- 20 visitas → **1 o 2 clientes** → 300-600 €
- Con 5 horas a la semana entran unas 15-20 visitas al mes
- Tu coste por cliente: **10 € de dominio**. El resto es margen

| Mes | Realista | Si se te da bien |
| --- | ---: | ---: |
| 1 | 0-300 € | 600 € |
| 2 | 300-600 € | 900 € |
| 3 en adelante | 600 €+ y mantenimientos que se acumulan | 1.200 €+ |

Los 60 €/año de mantenimiento son lo que convierte esto en un negocio de verdad: a
los 20 clientes son 1.200 € al año que entran sin volver a vender nada.

## Lo único que puede salir mal

Que no entres por la puerta. Es lo normal y da vergüenza las primeras veces. Por eso
el plan empieza por 20 puertas y no por una: **las tres primeras son práctica, no
ventas.** Cuenta con que sean noes y quítales importancia.

Todo lo demás —la web, los textos, el diseño, los presupuestos— ya está resuelto.
