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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));

/** CSV separado por punto y coma: es lo que produce Excel en aleman. */
function leerCsv(ruta) {
  const [cabecera, ...lineas] = readFileSync(ruta, 'utf8').trim().split('\n');
  const campos = cabecera.split(';').map((c) => c.trim());
  return lineas.filter(Boolean).map((linea) => {
    const valores = linea.split(';');
    return Object.fromEntries(campos.map((c, i) => [c, (valores[i] || '').trim()]));
  });
}

/** "Frau Meyer" -> "Sehr geehrte Frau Meyer". Sin nombre, formula neutra. */
function saludo(ansprechpartner) {
  if (!ansprechpartner) return 'Sehr geehrte Damen und Herren,';
  const forma = ansprechpartner.startsWith('Frau') ? 'Sehr geehrte' : 'Sehr geehrter';
  return `${forma} ${ansprechpartner},`;
}

/** La frase que demuestra que no es un envio masivo. Es la pieza clave. */
function pruebaDeQueEsPersonal(p) {
  if (p.beobachtung) return `mir ist aufgefallen: ${p.beobachtung}.`;
  if (p.bewertungen) {
    return `Ihr Betrieb hat bei Google ${p.bewertungen} Bewertungen mit ${p.sterne || 'sehr guter'} Bewertung — aber keine eigene Website.`;
  }
  return 'mir ist aufgefallen, dass Ihr Betrieb keine eigene Website hat.';
}

const enlace = (p) => p.demo_url || '[LINK ZUR FERTIGEN SEITE EINFÜGEN]';

function guionTelefono(p) {
  return `## 1. Anruf  (zuerst — das ist der legale Weg)

Beste Zeit: Di–Do, 10:00–11:30 oder 14:30–16:30 Uhr. Nie zur Essenszeit.

> Guten Tag, mein Name ist [DEIN NAME]. Ich baue Websites für Betriebe hier
> in ${p.ort || '[ORT]'}.
>
> Ich habe gesehen, dass ${p.name} keine eigene Website hat — ich habe Ihnen
> schon eine gebaut, damit Sie sehen, wie sie aussehen würde.
>
> **Darf ich Ihnen den Link kurz per E-Mail schicken? Anschauen dauert
> 30 Sekunden.**

Wenn ja → E-Mail-Adresse notieren, Datum und Uhrzeit hier eintragen:

    Einwilligung erteilt am: ________  Uhrzeit: ______  von: ____________

**Diese Notiz ist deine rechtliche Absicherung. Ohne sie keine E-Mail.**

Wenn nein → freundlich bedanken, auflegen, Haken dran. Kein zweiter Anruf.

Wenn "kein Interesse, wir haben Instagram":
> Verstehe ich. Nur: wer bei Google nach *${p.typ || '[BRANCHE]'} in ${p.ort || '[ORT]'}*
> sucht, findet Sie so nicht. Soll ich es Ihnen trotzdem kurz schicken?
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
  const texto = `# ${p.name}${p.ort ? ` · ${p.ort}` : ''}

${p.typ ? `Branche: ${p.typ}  ` : ''}${p.telefon ? `Telefon: ${p.telefon}  ` : ''}
${p.bewertungen ? `Google: ${p.bewertungen} Bewertungen, ${p.sterne || '?'} Sterne` : ''}

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

console.log(`\n${prospectos.length} Kontaktpakete erstellt.`);
