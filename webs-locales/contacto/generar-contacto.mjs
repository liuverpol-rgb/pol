#!/usr/bin/env node
/**
 * Genera los textos de contacto personalizados para cada prospecto.
 *
 *   node webs-locales/contacto/generar-contacto.mjs
 *
 * Lee prospectos.csv y deja en salida/ un archivo por negocio con las tres
 * versiones: carta, guion de telefono y correo.
 *
 * ORDEN IMPORTANTE EN ALEMANIA: primero se llama (legal en B2B con interes
 * objetivo), se pide permiso para mandar el enlace, y solo entonces se
 * escribe el correo. Ese permiso es lo que convierte el correo en legal.
 * Ver alemania/RECHT.md.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCsv, saludo, pruebaDeQueEsPersonal, enlace } from './textos.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

function guionTelefono(p) {
  return `## 1. Anruf  (zuerst — das ist der legale Weg)

Beste Zeit: Di–Do, 10:00–11:30 oder 14:30–16:30 Uhr. Nie zur Essenszeit.

> Guten Tag, mein Name ist [DEIN NAME]. Ich baue Websites für Betriebe hier
> in ${p.ort || '[ORT]'}.
>
> ${p.beobachtung ? `Ich habe gesehen: ${p.beobachtung}.` : `Ich habe gesehen, dass ${p.name} keine eigene Website hat.`}
> Deshalb habe ich Ihnen schon eine gebaut, damit Sie sehen, wie sie
> aussehen würde.
>
> **Darf ich Ihnen den Link kurz per E-Mail schicken? Anschauen dauert
> 30 Sekunden.**

Die erste Zeile ist der ganze Anruf. Sie beweist, dass du dir seinen Betrieb
angesehen hast — und sie ist zugleich deine rechtliche Grundlage (siehe
alemania/RECHT.md).

Wenn ja → E-Mail-Adresse notieren, Datum und Uhrzeit hier eintragen:

    Einwilligung erteilt am: ________  Uhrzeit: ______  von: ____________

**Diese Notiz ist deine rechtliche Absicherung. Ohne sie keine E-Mail.**

Wenn nein → freundlich bedanken, auflegen, Haken dran. Kein zweiter Anruf.

### Die drei Antworten, die wirklich kommen

**"Wir haben genug Arbeit."** — Die häufigste Antwort im Handwerk. Nicht
gegen sie argumentieren, sondern das Thema wechseln:
> Das glaube ich Ihnen sofort. Mir geht es auch weniger um neue Kunden —
> auf der Seite ist eine Stellenanzeige eingebaut. Suchen Sie gerade Leute?

**"Das macht mein Neffe / haben wir schon vergeben."**
> Alles klar, dann lasse ich Sie in Ruhe. Falls es doch nichts wird, melden
> Sie sich einfach.
Und auflegen. Nicht dagegen anreden.

**"Schicken Sie mal was per Post."**
> Mache ich gern. An welche Adresse am besten?
Brief ist ohnehin erlaubt — das ist ein gutes Ergebnis, kein Nein.
`;
}

function correo(p) {
  return `## 2. E-Mail  (erst NACH dem Ja am Telefon)

**An:** ${p.email || '[im Telefonat erfragen]'}
**Betreff:** Wie besprochen: Ihre Website für ${p.name}

${saludo(p.ansprechpartner)}

vielen Dank für das kurze Gespräch eben. Wie versprochen der Link zu der
Seite, die ich für ${p.name} gebaut habe:

${enlace(p)}

Sie sehen dort Ihre Öffnungszeiten, Ihre Karte und ob gerade geöffnet ist.
Auf dem Handy kann man mit einem Tipp anrufen oder die Route öffnen.

Wenn sie Ihnen gefällt, schalte ich sie diese Woche unter Ihrer eigenen
Adresse frei: 300 € einmalig, danach 60 € im Jahr für Domain und Änderungen.
Wenn nicht, melde ich mich nicht wieder.

Mit freundlichen Grüßen
[DEIN NAME]
[TELEFON] · [E-MAIL]

---
Sie erhalten diese E-Mail, weil Sie mir im Telefonat am ${'[DATUM]'} zugestimmt haben.
Wenn Sie keine weitere Nachricht wünschen, antworten Sie einfach mit "Nein" —
ich lösche Ihre Daten dann sofort.
`;
}

function carta(p) {
  return `## 3. Brief  (immer erlaubt — bester Kanal ohne Anruf)

Drucken, falten, persönlich einwerfen oder mit 0,95 € frankieren.

${saludo(p.ansprechpartner)}

ich baue Websites für Betriebe hier in ${p.ort || '[ORT]'}, und ${pruebaDeQueEsPersonal(p)}

Deshalb habe ich Ihnen eine gebaut. Sie ist fertig und Sie können sie hier
ansehen:

        ${enlace(p)}

Sie zeigt Ihre Öffnungszeiten, Ihre Karte und ob gerade geöffnet ist. Auf dem
Handy genügt ein Tipp zum Anrufen oder für die Route.

Wenn sie Ihnen gefällt, schalte ich sie unter Ihrer eigenen Adresse frei:
300 € einmalig, danach 60 € im Jahr. Wenn nicht, hören Sie nichts mehr von mir.

Mit freundlichen Grüßen

[DEIN NAME]
[TELEFON]

> Tipp: Einen QR-Code zum Link erzeugst du gratis auf qrcode.tec-it.com und
> klebst ihn neben die Adresse. Fast jeder scannt ihn — ein Link auf Papier
> tippt niemand ab.
`;
}

const prospectos = leerCsv(join(RAIZ, 'prospectos.csv'));
mkdirSync(join(RAIZ, 'salida'), { recursive: true });

for (const p of prospectos) {
  if (!p.id || !p.name) continue;
  // Si ya tiene web, hay que comprobarla antes de llamar: de eso depende
  // el argumento comercial y, sobre todo, la base legal de la llamada.
  const avisoWeb = p.webseite && p.webseite !== 'keine gefunden'
    ? `\n> ⚠️ **Vorhandene Seite: ${p.webseite}** — vor dem Anruf auf dem Handy öffnen.
> Ist sie modern und gut lesbar: nicht anrufen, durchstreichen. Nur wenn sie
> veraltet, unsicher oder am Handy unbrauchbar ist, hast du ein Argument —
> und die rechtliche Grundlage.\n`
    : '';

  const texto = `# ${p.name}${p.ort ? ` · ${p.ort}` : ''}

${p.typ ? `Branche: ${p.typ}  ` : ''}${p.telefon ? `Telefon: ${p.telefon}  ` : ''}
${p.bewertungen ? `Google: ${p.bewertungen} Bewertungen, ${p.sterne || '?'} Sterne` : ''}
${avisoWeb}
Reihenfolge: **Anruf → Einwilligung → E-Mail.** Der Brief geht auch ohne Anruf.

---

${guionTelefono(p)}
---

${correo(p)}
---

${carta(p)}`;
  writeFileSync(join(RAIZ, 'salida', `${p.id}.md`), texto);
  console.log(`✓ ${p.name} → contacto/salida/${p.id}.md`);
}

// Hoja unica para trabajar el dia de llamadas sin abrir trece archivos.
const anrufliste = `# Anrufliste — ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(new Date())}

Di–Do, 10:00–11:30 oder 14:30–16:30. **Vor jedem Anruf den Namen googeln:**
hat der Betrieb doch eine gute Seite → durchstreichen, nicht anrufen.

Ein Nein ist ein Nein. Kein zweiter Anruf. Die ersten drei sind Übung.

| # | Betrieb | Telefon | Einstiegssatz | ☎ | Ja? | Einwilligung notiert |
| ---: | --- | --- | --- | :-: | :-: | --- |
${prospectos.map((p, i) => `| ${i + 1} | **${p.name}** | ${p.telefon || '—'} | ${p.beobachtung ? `„Mir ist aufgefallen: ${p.beobachtung}."` : '—'} | ☐ | ☐ | ____ Uhr, ________ |`).join('\n')}

## Der Anruf in vier Sätzen

1. „Guten Tag, mein Name ist [DEIN NAME]. Ich baue Websites für Betriebe hier in Reinbek."
2. Der Einstiegssatz aus der Tabelle — **das ist der ganze Anruf**.
3. „Deshalb habe ich Ihnen schon eine gebaut, damit Sie sehen, wie sie aussehen würde."
4. „**Darf ich Ihnen den Link kurz per E-Mail schicken?**"

Bei Ja → E-Mail-Adresse und Uhrzeit in die letzte Spalte. **Ohne diese Notiz
keine E-Mail** (siehe alemania/RECHT.md).

## Die drei Antworten, die kommen

- **„Wir haben genug Arbeit."** → „Verstehe ich. Mir geht es auch weniger um neue
  Kunden — auf der Seite ist eine Stellenanzeige eingebaut. Suchen Sie Leute?"
- **„Macht mein Neffe."** → „Alles klar, dann lasse ich Sie in Ruhe." Auflegen.
- **„Schicken Sie was per Post."** → „Mache ich. An welche Adresse?" Das ist ein Ja.
`;
writeFileSync(join(RAIZ, 'salida', 'anrufliste.md'), anrufliste);

console.log(`\n${prospectos.length} Kontaktpakete erstellt.`);
console.log('Arbeitsblatt für den Anruftag: contacto/salida/anrufliste.md');
