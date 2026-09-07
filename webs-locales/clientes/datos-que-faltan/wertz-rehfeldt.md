# Physiotherapiepraxis Wertz & Rehfeldt

Datos que faltan para dejar su web terminada. Pregúntalos en la llamada o
cuando conteste a la carta, y escríbelos en `clientes/wertz-rehfeldt.json`.

**10 huecos.** Después: `node webs-locales/generar.mjs clientes/wertz-rehfeldt.json`

---

### Dein Name

> Geht aus remitente.json — einmal ausfüllen, gilt für alle.

  - `propuesta_de`

**Antwort:** ________________________________________________

### Ein Satz über den Betrieb

> Wie würden Sie Ihren Betrieb in einem Satz beschreiben?

  - `claim`

**Antwort:** ________________________________________________

### Telefonnummer

> Unter welcher Nummer sollen Kunden anrufen?

  - `telefono`

**Antwort:** ________________________________________________

### Google-Beschreibung

> Was soll bei Google unter dem Namen stehen?

  - `seo.descripcion` — Physiotherapiepraxis Wertz & Rehfeldt in Reinbek: Physiotherapie. [bestätigen]

**Antwort:** ________________________________________________

### Leistungen und Preise

> Welche Leistungen bieten Sie an, und was kosten sie?

  - `secciones[0].entradilla` — Alle Angaben [bestätigen].
  - `secciones[0].items[1].descripcion` — [bestätigen]
  - `secciones[0].items[2].descripcion` — [bestätigen]
  - `secciones[0].items[3].descripcion` — [bestätigen]
  - `secciones[1].items[1].descripcion` — [bestätigen] — aktuell freie Termine?

**Antwort:** ________________________________________________

### Stellenanzeige

> Suchen Sie gerade Mitarbeiter oder Azubis? Wenn nein, fällt der Abschnitt weg.

  - `jobs.texto` — [bestätigen] — nur aufnehmen, wenn wirklich Bedarf besteht.

**Antwort:** ________________________________________________

### Öffnungszeiten ⚠️

> An welchen Tagen und zu welchen Uhrzeiten haben Sie geöffnet?

*En la demo hay un horario de ejemplo del gremio. NO es suyo. Confírmalo siempre.*

**Antwort:** ________________________________________________

### Fotos

> Haben Sie zwei, drei gute Fotos vom Betrieb? Sonst mache ich welche.

*Sin fotos la web funciona, pero con fotos vende el triple.*

**Antwort:** ________________________________________________

---

## Lo que ya tenemos

| Dato | Valor |
| --- | --- |
| Nombre | Physiotherapiepraxis Wertz & Rehfeldt |
| Tipo | Physiotherapie |
| Ciudad | Reinbek |
| Teléfono | **falta** |
| Dirección | Siemensstraße 4, 21465 Reinbek |

## Lo mínimo para enseñarle algo decente

Con estas tres cosas la web ya vale: **horario real**, **tres o cuatro
servicios con precio** y **un teléfono correcto**. El resto se puede afinar
después de que pague.
