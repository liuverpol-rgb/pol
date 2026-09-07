#!/usr/bin/env node
/**
 * Convierte una ficha de negocio en una web terminada.
 *
 *   node webs-locales/generar.mjs webs-locales/clientes/bar-la-parra.json
 *   node webs-locales/generar.mjs --todos
 *
 * Deja en webs-locales/sitios/<nombre>/ un index.html y su estilo.css.
 * Esa carpeta se abre con doble clic, se ensena en el movil o se arrastra
 * a Cloudflare Pages o Netlify. No hace falta nada mas.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSitio } from './plantilla/render.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const CAMPOS_OBLIGATORIOS = ['nombre', 'tipo', 'telefono'];

function generar(rutaFicha) {
  const negocio = JSON.parse(readFileSync(rutaFicha, 'utf8'));

  const faltan = CAMPOS_OBLIGATORIOS.filter((c) => !negocio[c]);
  if (faltan.length) {
    throw new Error(`${basename(rutaFicha)}: faltan campos obligatorios: ${faltan.join(', ')}`);
  }

  const carpeta = join(RAIZ, 'sitios', basename(rutaFicha, '.json'));
  mkdirSync(carpeta, { recursive: true });
  writeFileSync(join(carpeta, 'index.html'), renderSitio(negocio));
  copyFileSync(join(RAIZ, 'plantilla', 'estilo.css'), join(carpeta, 'estilo.css'));

  const etiqueta = negocio.demo ? ' (propuesta, no indexable)' : '';
  console.log(`✓ ${negocio.nombre}${etiqueta}\n  ${join(carpeta, 'index.html')}`);
  return carpeta;
}

/** Indice con todas las webs a la vez, para revisarlas de un vistazo. */
function escribirIndice() {
  const dir = join(RAIZ, 'sitios');
  const carpetas = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const tarjetas = carpetas.map((c) => `
    <figure>
      <iframe src="${c}/index.html" title="${c}" loading="lazy"></iframe>
      <figcaption><a href="${c}/index.html" target="_blank">${c}</a></figcaption>
    </figure>`).join('');

  writeFileSync(join(dir, 'index.html'), `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Muestrario — ${carpetas.length} webs</title>
<style>
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f3f0; margin: 0; padding: 28px; color: #1c1a17; }
  h1 { font-size: 1.4rem; margin: 0 0 4px; }
  p.nota { color: #6b6559; margin: 0 0 24px; }
  .rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
  figure { margin: 0; background: #fff; border: 1px solid #e5e1da; border-radius: 10px; overflow: hidden; }
  iframe { width: 390px; height: 620px; border: 0; transform: scale(.78); transform-origin: 0 0; display: block; }
  .marco { width: 304px; height: 484px; overflow: hidden; margin: 0 auto; }
  figcaption { padding: 10px 14px; border-top: 1px solid #e5e1da; font-size: .85rem; }
  figcaption a { color: #0f6b4f; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
  <h1>Muestrario — ${carpetas.length} webs</h1>
  <p class="nota">Vista de móvil. Haz clic en el nombre para abrir la web entera.
     Ábrelo con <code>npm run webs</code>: los iframes no cargan desde file://.</p>
  <div class="rejilla">${tarjetas.replaceAll('<iframe', '<div class="marco"><iframe').replaceAll('</iframe>', '</iframe></div>')}</div>
</body>
</html>
`);
  console.log(`\n✓ Muestrario de ${carpetas.length} webs → sitios/index.html`);
}

const args = process.argv.slice(2);

if (args[0] === '--todos') {
  const dir = join(RAIZ, 'clientes');
  const fichas = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!fichas.length) {
    console.error('No hay ninguna ficha en webs-locales/clientes/');
    process.exit(1);
  }
  fichas.forEach((f) => generar(join(dir, f)));
  escribirIndice();
} else if (args[0]) {
  generar(args[0]);
} else {
  console.error(`Uso:
  node webs-locales/generar.mjs <ficha.json>
  node webs-locales/generar.mjs --todos

Copia webs-locales/clientes/bar-la-parra.json, cambia los datos por los del
negocio al que vas a visitar y ejecutalo. Tienes la web en 5 minutos.`);
  process.exit(1);
}
