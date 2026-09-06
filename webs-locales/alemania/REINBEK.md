# Reinbek — tus tres primeros prospectos

Investigados en fuentes públicas (directorios, registro mercantil, sus propias
webs). **Las tres webs están hechas y en `sitios/`.** Aquí va el análisis honesto.

## Ranking

### 🥇 1. Suldin Montage & Demontage Service — **empieza por este**

| | |
| --- | --- |
| Teléfono | **+49 176 86244250** (móvil → contesta el dueño) |
| Correo | info@suldin-montage-service.de |
| Web | suldin-montage-service.de → **«Bald verfügbar»** |
| Demo | `sitios/suldin-montage/` |

**Por qué es el mejor de largo:** compró el dominio y la web sigue en *«Bald
verfügbar»*. Eso significa que **ya decidió que quiere una web y no ha podido
hacerla**. No tienes que convencerle de nada; solo de que la tuya está ya lista.

Es también el caso legal más sólido que existe para llamar: el interés objetivo
no hay ni que argumentarlo, lo ha declarado él mismo comprando el dominio.

Y al ser un móvil, hablas con quien decide a la primera. Sin secretaria.

> **Frase de apertura:** «Auf Ihrer Seite steht seit einer Weile nur *Bald
> verfügbar*. Die Domain haben Sie ja schon — ich habe Ihnen die Seite dazu
> gebaut.»

### 🥈 2. Lukic-System-Montage GmbH

| | |
| --- | --- |
| Teléfono | +49 40 32527683 · móvil +49 178 5618624 |
| Correo | info@lukic-system-montage.de |
| Dirección | Am Alten Lokschuppen 13, **21509 Glinde** (no Reinbek, 4 km) |
| Gerente | **Spomenko Lukic** — pregunta por él por su nombre |
| Web | lukic-system-montage.de → existe, pero **sobre http, sin cifrar** |
| Demo | `sitios/lukic-system-montage/` |

**El gancho es concreto y comprobable:** su web va por `http` sin `https`. Chrome
le muestra a cada visitante **«Nicht sicher»** al lado de la dirección. Eso es un
problema real, verificable en 5 segundos y que él probablemente no sabe.

**Antes de llamar, ábrela en tu móvil.** Si además no se lee bien en pantalla
pequeña, tienes dos argumentos en vez de uno.

### 🥉 3. O. & T. Lochte Heizung-Sanitär-Fliesen GmbH

| | |
| --- | --- |
| Teléfono | +49 40 7273820 |
| Correo | olaf.lochte@lochte-h-s-f.de → el gerente se llama **Olaf Lochte** |
| Dirección | Borsigstraße 17 B, 21465 Reinbek |
| Google | 4,8 ★ con 12 reseñas |
| Web | **lochte-h-s-f.de — ya tiene** |
| Demo | `sitios/lochte-hsf/` |

**Aviso: ya tiene web.** Eso debilita tanto el argumento comercial como tu base
legal para llamar (el interés objetivo se apoyaba en que *no* tuviera).

**Compruébala en tu móvil antes de marcar.** Si es moderna y se ve bien, **no le
llames**: tacha y sigue. Si es antigua o no se adapta al móvil, sí tienes un
motivo defendible.

Pero su verdadero punto débil no es la web, sino el otro: **un taller SHK con 4,8
estrellas no encuentra montadores ni aprendices.** Por eso su demo lleva la
sección de empleo con *Anlagenmechaniker SHK* y *Auszubildende*. Ahí es donde le
duele de verdad.

---

## Lo que aprendí investigando y te sirve para los otros 97

**Los tres son Montage y Handwerk. Es el segmento equivocado para empezar** y
conviene que lo sepas antes de gastar cien llamadas:

1. **Tienen más trabajo del que pueden hacer.** «Consiga más clientes» no les
   mueve. Por eso el guion cambia de tema a personal en cuanto oigas *«wir haben
   genug Arbeit»* — y por eso he metido la sección de empleo en la plantilla.
2. **Suldin y Lukic trabajan sobre todo para otras empresas**, no para el
   consumidor final. Una web les da credibilidad, pero no les trae clientes.
3. **Dos de tres ya tenían web.** Filtrar por eso *antes* de apuntar te ahorra la
   mitad del trabajo, y es tu base legal.

**Dónde están tus 100 clientes de verdad en Reinbek:** negocios a los que el
cliente encuentra por Google y elige por la web.

| Busca en Google Maps | Por qué funciona |
| --- | --- |
| `Friseur Reinbek` | El cliente elige por fotos y por si abre el sábado |
| `Physiotherapie Reinbek` | Buscan por especialidad; muchos sin web propia |
| `Kosmetikstudio Reinbek` | Sector visual, valoran mucho el diseño |
| `Fahrschule Reinbek` | Público joven, todo por el móvil |
| `Restaurant / Café Reinbek` | Horario y carta = el caso perfecto |
| `Bäckerei Reinbek` | Horarios, y suelen tener varias sucursales |
| `Nagelstudio Reinbek` | Casi ninguno tiene web |

Reinbek tiene unos 28.000 habitantes y está pegado a Hamburgo: si te quedas
corto, amplía a **Glinde, Wentorf, Barsbüttel, Aumühle y Bergedorf**. Ahí hay
varios cientos de negocios.

## Antes de llamar a los tres

1. **Abre sus webs en tu móvil.** Lochte y Lukic tienen; confirma si son malas.
   Es tu argumento y tu base legal.
2. **Revisa las demos** en `sitios/` y quita los `[bestätigen]`. Puse marcadores
   donde no tengo el dato: **no he inventado ni un servicio ni un precio de una
   empresa real.** Lo que no sabemos, se pregunta.
3. **Publica las tres demos** en Netlify Drop (gratis, un minuto) y pon el enlace
   en la columna `demo_url` del CSV. Sin enlace, la llamada no sirve de nada.
4. Genera los textos: `node webs-locales/contacto/generar-contacto.mjs`

Las demos salen marcadas como *Website-Vorschlag* y con `noindex`. Déjalo así
hasta que paguen: es una propuesta comercial, no su web oficial.

## Fuentes

- [Das Örtliche — O. & T. Lochte](https://www.dasoertliche.de/Themen/O-T-Lochte-Heizung-Sanit%C3%A4r-Fliesen-GmbH-Reinbek-Borsigstr)
- [Gelbe Seiten — O. & T. Lochte, 21465 Reinbek](https://www.gelbeseiten.de/gsbiz/049f5bcf-a372-429c-8892-2ded782aa725)
- [Suldin Montage & Demontage Service](https://www.suldin-montage-service.de/)
- [Northdata — Lukic´-System-Montage GmbH, Glinde](https://www.northdata.de/Lukic%C2%B4-System-Montage%20GmbH,%20Glinde/Amtsgericht%20L%C3%BCbeck%20HRB%2015854%20HL)
- [Lukic-System-Montage — Impressum](http://www.lukic-system-montage.de/impressum/)
