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

const args = process.argv.slice(2);

if (args[0] === '--todos') {
  const dir = join(RAIZ, 'clientes');
  const fichas = readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!fichas.length) {
    console.error('No hay ninguna ficha en webs-locales/clientes/');
    process.exit(1);
  }
  fichas.forEach((f) => generar(join(dir, f)));
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
