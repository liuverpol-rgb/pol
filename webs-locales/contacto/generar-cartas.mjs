#!/usr/bin/env node
/**
 * Genera las cartas listas para imprimir.
 *
 *   node webs-locales/contacto/generar-cartas.mjs                 una por cliente
 *   node webs-locales/contacto/generar-cartas.mjs --juntas         todas en un archivo
 *   node webs-locales/contacto/generar-cartas.mjs zur-muehle       solo esa
 *   node webs-locales/contacto/generar-cartas.mjs --limite 10
 *
 * Por defecto deja salida/cartas/<id>.html, un archivo por cliente: asi se
 * imprime solo la que hace falta, se corrige una sin tocar las demas y se
 * puede enviar por separado. Con --juntas salen todas en una tirada.
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

/** Envuelve una o varias cartas en un documento imprimible. */
function documento(titulo, cuerpo, aviso = '') {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
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
${aviso}
${cuerpo}
</body>
</html>
`;
}

const avisoFaltaEnlace = (n, total) => `<div class="aviso">
  <strong>Achtung — bei ${n} von ${total} Briefen fehlt der Link.</strong>
  Erst die Demo-Seiten veröffentlichen (Netlify Drop), die Adresse in die Spalte
  <code>demo_url</code> der prospectos.csv eintragen und neu erzeugen.
  Ein Brief ohne Link ist verschwendetes Porto. Dieser Hinweis wird nicht mitgedruckt.
</div>`;

const limiteArg = process.argv.indexOf('--limite');
const limite = limiteArg > -1 ? Number(process.argv[limiteArg + 1]) : Infinity;

const argumentos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const soloUno = argumentos[0];

let prospectos = leerCsv(join(RAIZ, 'prospectos.csv')).filter((p) => p.id);
if (soloUno) {
  prospectos = prospectos.filter((p) => p.id === soloUno);
  if (!prospectos.length) {
    console.error(`No hay ningún prospecto con id "${soloUno}" en prospectos.csv.`);
    process.exit(1);
  }
}
prospectos = prospectos.slice(0, limite);

const remitente = leerRemitente();
const fecha = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  .format(new Date());

const juntas = process.argv.includes('--juntas');
mkdirSync(join(RAIZ, 'salida'), { recursive: true });

if (juntas) {
  const faltan = prospectos.filter(sinEnlace).length;
  const html = documento(
    `Briefe — ${prospectos.length} Stück`,
    prospectos.map((p) => carta(p, remitente, fecha)).join('\n'),
    faltan ? avisoFaltaEnlace(faltan, prospectos.length) : '',
  );
  writeFileSync(join(RAIZ, 'salida', 'cartas.html'), html);
  console.log(`✓ ${prospectos.length} Briefe → contacto/salida/cartas.html`);
} else {
  const dir = join(RAIZ, 'salida', 'cartas');
  mkdirSync(dir, { recursive: true });
  for (const p of prospectos) {
    const html = documento(
      `Brief — ${p.name}`,
      carta(p, remitente, fecha),
      sinEnlace(p) ? avisoFaltaEnlace(1, 1) : '',
    );
    writeFileSync(join(dir, `${p.id}.html`), html);
    console.log(`${sinEnlace(p) ? '·' : '✓'} ${p.name}\n    contacto/salida/cartas/${p.id}.html${sinEnlace(p) ? '  (ohne Link)' : ''}`);
  }
  console.log(`\n${prospectos.length} Briefe. Im Browser öffnen und drucken (Strg+P).`);
}

const faltan = prospectos.filter(sinEnlace).length;
if (faltan) {
  console.log(`\n⚠️  Bei ${faltan} von ${prospectos.length} Briefen fehlt der Link zur fertigen Seite.`);
  console.log('   Erst veröffentlichen, dann demo_url in prospectos.csv eintragen.');
}
