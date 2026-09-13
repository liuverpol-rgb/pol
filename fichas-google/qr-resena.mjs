#!/usr/bin/env node
/**
 * El cartelito del mostrador para pedir resenas.
 *
 *   node fichas-google/qr-resena.mjs <id> "https://g.page/r/CX.../review"
 *   node fichas-google/qr-resena.mjs ejemplo-salon-muster "https://..." --es
 *
 * Deja en hojas/<id>-bewertung.html una tarjeta A6 lista para imprimir y
 * meter en un portamenus de mesa. El QR se genera aqui mismo, con el
 * codigo que ya usa la carta de webs-locales: ni dependencias, ni pasar el
 * enlace de un cliente por el servidor de un tercero, ni depender de que
 * ese servicio siga existiendo dentro de un ano.
 *
 * El enlace corto se saca del perfil del negocio, en "Bewertungen" →
 * "Mehr Bewertungen erhalten". Solo se puede sacar con acceso al perfil,
 * o sea despues de que te haya contratado.
 *
 * Se PIDE la resena. No se compra, no se escribe y no se premia: ver
 * alemania/RECHT.md.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qrSvg } from '../webs-locales/contacto/qr.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

const TEXTOS = {
  de: {
    lang: 'de',
    gancho: 'Waren Sie zufrieden?',
    peticion: 'Eine kurze Bewertung bei Google hilft uns sehr — sie dauert zwanzig Sekunden.',
    como: 'Kamera aufs Bild halten, tippen, Sterne vergeben. Fertig.',
    gracias: 'Vielen Dank!',
  },
  es: {
    lang: 'es',
    gancho: '¿Ha quedado contento?',
    peticion: 'Una reseña corta en Google nos ayuda mucho — son veinte segundos.',
    como: 'Apunte con la cámara, toque el aviso y ponga las estrellas. Ya está.',
    gracias: '¡Gracias!',
  },
};

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderTarjeta({ nombre, url, idioma = 'de' }) {
  const t = TEXTOS[idioma] ?? TEXTOS.de;
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nombre)} — ${esc(t.gancho)}</title>
<style>
  @page { size: A6; margin: 0; }
  body { margin: 0; background: #f5f3f0; font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1714; }
  .tarjeta {
    width: 105mm; height: 148mm; margin: 0 auto; background: #fff;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 12mm 10mm; box-sizing: border-box;
  }
  h1 { font-size: 22pt; line-height: 1.2; margin: 0 0 6mm; }
  p { margin: 0 0 5mm; font-size: 11.5pt; }
  .qr { margin: 2mm 0 5mm; }
  .como { font-size: 9.5pt; color: #6d665d; }
  .negocio { margin-top: auto; font-size: 10pt; color: #6d665d; border-top: 1px solid #e8e2da; padding-top: 4mm; width: 100%; }
  @media print { body { background: #fff; } .tarjeta { box-shadow: none; } }
  @media screen { .tarjeta { box-shadow: 0 2px 18px rgba(0,0,0,.12); margin-top: 20px; } }
</style>
</head>
<body>
<div class="tarjeta">
  <h1>${esc(t.gancho)}</h1>
  <p>${esc(t.peticion)}</p>
  <div class="qr">${qrSvg(url, { tam: 45 })}</div>
  <p class="como">${esc(t.como)}</p>
  <p class="como">${esc(t.gracias)}</p>
  <div class="negocio">${esc(nombre)}</div>
</div>
</body>
</html>
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const idioma = args.includes('--es') ? 'es' : 'de';
  const [id, url] = args.filter((a) => !a.startsWith('--'));

  if (!id || !url) {
    console.error(`Uso:
  node fichas-google/qr-resena.mjs <id> "<enlace corto de resena>" [--es]

El enlace se saca del perfil del cliente: Bewertungen → Mehr Bewertungen erhalten.`);
    process.exit(1);
  }

  const ficha = join(RAIZ, 'negocios', `${id}.json`);
  if (!existsSync(ficha)) {
    console.error(`No hay negocios/${id}.json. Crealo con nueva-auditoria.mjs.`);
    process.exit(1);
  }
  const { nombre } = JSON.parse(readFileSync(ficha, 'utf8'));

  mkdirSync(join(RAIZ, 'hojas'), { recursive: true });
  const destino = join(RAIZ, 'hojas', `${id}-bewertung.html`);
  writeFileSync(destino, renderTarjeta({ nombre, url, idioma }));
  console.log(`✓ ${destino}\n  Imprimir con Strg+P en A6, o en A4 y recortar.`);
}
