#!/usr/bin/env node
/**
 * Genera las cartas listas para imprimir.
 *
 *   node webs-locales/contacto/generar-cartas.mjs
 *   node webs-locales/contacto/generar-cartas.mjs --limite 10
 *
 * Produce salida/cartas.html: una carta por pagina A4. Se abre en el
 * navegador, Strg+P, y salen todas listas para meter en el sobre.
 *
 * La carta es el unico canal comercial en frio permitido en Alemania sin
 * consentimiento previo. Por eso es lo primero que se envia. Ver
 * alemania/RECHT.md.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCsv, parrafosCarta, sinEnlace } from './textos.mjs';
import { qrSvg } from './qr.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

/** El remitente sale de remitente.json si existe; si no, quedan huecos. */
function leerRemitente() {
  const ruta = join(RAIZ, 'remitente.json');
  if (!existsSync(ruta)) return {};
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

const esc = (v = '') => String(v)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function carta(p, remitente, fecha) {
  const c = parrafosCarta(p, remitente);
  const direccion = p.adresse || '[Adresse aus Google Maps eintragen]';

  return `
<article class="carta">
  <div class="remitente-mini">${esc(c.remitente.nombre)} · ${esc(c.remitente.calle)} · ${esc(c.remitente.ciudad)}</div>

  <address class="destinatario">
    ${esc(p.name)}<br>
    ${p.ansprechpartner ? `${esc(p.ansprechpartner)}<br>` : ''}
    ${esc(direccion)}
  </address>

  <p class="fecha">${esc(fecha)}</p>

  <p class="betreff">${esc(c.betreff)}</p>

  <p>${esc(c.saludo)}</p>
  ${c.parrafos.map((t) => `<p>${esc(t)}</p>`).join('\n  ')}

  ${sinEnlace(p)
    ? '<div class="hueco-qr sin-enlace">QR erscheint,<br>sobald die Seite<br>veröffentlicht ist</div>'
    : `<figure class="qr">${qrSvg(c.enlace, { tam: 30 })}<figcaption>Zum Ansehen scannen</figcaption></figure>`}
  <p class="enlace">${esc(c.enlace)}</p>

  ${c.parrafosFinales.map((t) => `<p>${esc(t)}</p>`).join('\n  ')}

  <p class="despedida">${esc(c.despedida)}</p>
  <p class="firma">
    ${esc(c.remitente.nombre)}<br>
    ${esc(c.remitente.telefon)} · ${esc(c.remitente.email)}
  </p>
</article>`;
}

const limiteArg = process.argv.indexOf('--limite');
const limite = limiteArg > -1 ? Number(process.argv[limiteArg + 1]) : Infinity;

const prospectos = leerCsv(join(RAIZ, 'prospectos.csv')).filter((p) => p.id).slice(0, limite);
const remitente = leerRemitente();
const fecha = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  .format(new Date());

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Briefe — ${prospectos.length} Stück</title>
<style>
  @page { size: A4; margin: 25mm 20mm 20mm 25mm; }
  body { font: 11pt/1.5 "Helvetica Neue", Arial, sans-serif; color: #111; margin: 0; }
  .carta { page-break-after: always; max-width: 165mm; margin: 0 auto; padding: 12mm 0; }
  .carta:last-child { page-break-after: auto; }
  .remitente-mini { font-size: 7.5pt; color: #555; border-bottom: .4pt solid #999; padding-bottom: 2mm; margin-bottom: 12mm; }
  .destinatario { font-style: normal; line-height: 1.45; margin-bottom: 14mm; }
  .fecha { text-align: right; margin: 0 0 10mm; }
  .betreff { font-weight: 700; margin: 0 0 6mm; }
  p { margin: 0 0 4mm; }
  .enlace { font-family: "SF Mono", Consolas, monospace; font-size: 10.5pt; background: #f2f0ec; padding: 3mm 4mm; border-left: 2pt solid #333; word-break: break-all; }
  .qr { float: right; margin: 0 0 4mm 6mm; text-align: center; width: 30mm; }
  .qr svg { display: block; }
  .qr figcaption { font-size: 7pt; color: #555; margin-top: 1.5mm; }
  .hueco-qr { width: 30mm; height: 30mm; border: .8pt dashed #aaa; color: #999; font-size: 7pt; line-height: 1.35; text-align: center; display: flex; align-items: center; justify-content: center; float: right; margin: 0 0 4mm 6mm; }
  .despedida { margin-top: 8mm; }
  .firma { margin-top: 10mm; }
  .aviso { background: #fff3cd; border: 1pt solid #e0c060; padding: 4mm 5mm; margin: 0 auto 8mm; max-width: 165mm; font-size: 9.5pt; }
  @media print { .aviso { display: none; } }
</style>
</head>
<body>
${prospectos.some(sinEnlace) ? `<div class="aviso">
  <strong>Achtung — bei ${prospectos.filter(sinEnlace).length} von ${prospectos.length} Briefen fehlt der Link.</strong>
  Erst die Demo-Seiten veröffentlichen (Netlify Drop), die Adresse in die Spalte
  <code>demo_url</code> der prospectos.csv eintragen und neu erzeugen.
  Ein Brief ohne Link ist verschwendetes Porto. Dieser Hinweis wird nicht mitgedruckt.
</div>` : ''}
${prospectos.map((p) => carta(p, remitente, fecha)).join('\n')}
</body>
</html>
`;

mkdirSync(join(RAIZ, 'salida'), { recursive: true });
const destino = join(RAIZ, 'salida', 'cartas.html');
writeFileSync(destino, html);

const faltan = prospectos.filter(sinEnlace).length;
console.log(`✓ ${prospectos.length} Briefe → contacto/salida/cartas.html`);
console.log('  Im Browser öffnen und drucken (Strg+P / Cmd+P).');
if (faltan) {
  console.log(`\n⚠️  Bei ${faltan} Briefen fehlt noch der Link zur fertigen Seite.`);
  console.log('   Erst veröffentlichen, dann demo_url in prospectos.csv eintragen.');
}
