# Suldin Montage & Demontage Service

Datos que faltan para dejar su web terminada. Pregúntalos en la llamada o
cuando conteste a la carta, y escríbelos en `clientes/suldin-montage.json`.

**8 huecos.** Después: `node webs-locales/generar.mjs clientes/suldin-montage.json`

---

### Dein Name

> Geht aus remitente.json — einmal ausfüllen, gilt für alle.

  - `propuesta_de`

**Antwort:** ________________________________________________

### Adresse

> Straße und Hausnummer für die Seite

  - `direccion`

**Antwort:** ________________________________________________

### Leistungen und Preise

> Welche Leistungen bieten Sie an, und was kosten sie?

  - `secciones[0].items[0].descripcion` — [bestätigen] Aufbau von Möbeln und Einbauten
  - `secciones[0].items[1].descripcion` — [bestätigen] Fachgerechter Rückbau und Abtransport
  - `secciones[0].items[2].descripcion` — [bestätigen]
  - `secciones[0].items[3].descripcion` — [bestätigen]
  - `secciones[1].items[2].descripcion` — [bestätigen] Meist innerhalb weniger Tage

**Antwort:** ________________________________________________

### Stellenanzeige

> Suchen Sie gerade Mitarbeiter oder Azubis? Wenn nein, fällt der Abschnitt weg.

  - `jobs.texto` — [bestätigen — falls Bedarf besteht] Monteure und Helfer für Aufträge in Hamburg und Stormarn.

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
| Nombre | Suldin Montage & Demontage Service |
| Tipo | Montage & Demontage |
| Ciudad | Reinbek |
| Teléfono | +49 176 86244250 |
| Dirección | **falta** |

## Lo mínimo para enseñarle algo decente

Con estas tres cosas la web ya vale: **horario real**, **tres o cuatro
servicios con precio** y **un teléfono correcto**. El resto se puede afinar
después de que pague.
