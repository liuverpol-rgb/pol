#!/usr/bin/env node
/**
 * Convierte la ficha de una tienda en una tienda estatica lista para subir.
 *
 *   node dropshipping/tienda/generar.mjs
 *   node dropshipping/tienda/generar.mjs mi-tienda.json
 *
 * Deja en tienda/salida/<nombre>/ el index.html, las cuatro paginas legales
 * y el CSS. Esa carpeta se arrastra a Cloudflare Pages o a Netlify Drop:
 * gratis, con HTTPS y sin nada que mantener.
 *
 * Se NIEGA a generar una tienda publicable (demo: false) a la que le falte
 * cualquier dato legalmente obligatorio, y dice exactamente cual y por que
 * norma. Es deliberado: una tienda alemana sin Impressum completo o sin los
 * datos de fabricante del articulo no es una tienda a medias, es una
 * Abmahnung con fecha de entrega.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTienda, validar } from './plantilla/render.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

export function generar(rutaFicha, { raiz = RAIZ } = {}) {
  const config = JSON.parse(readFileSync(rutaFicha, 'utf8'));
  const problemas = validar(config);

  if (problemas.length && !config.demo) {
    throw new Error(
      `${basename(rutaFicha)} no se puede publicar todavia. Falta:\n` +
        problemas.map((p) => `  · ${p}`).join('\n') +
        '\n\nPon "demo": true para generar una vista previa no indexable mientras lo completas.',
    );
  }

  const carpeta = join(raiz, 'salida', basename(rutaFicha, '.json'));
  mkdirSync(carpeta, { recursive: true });
  for (const [archivo, contenido] of Object.entries(renderTienda(config))) {
    writeFileSync(join(carpeta, archivo), contenido);
  }
  copyFileSync(join(RAIZ, 'plantilla', 'estilo.css'), join(carpeta, 'estilo.css'));
  return { carpeta, problemas, demo: config.demo === true };
}

function main() {
  const ficha = process.argv[2] ?? join(RAIZ, 'ejemplo.json');
  let resultado;
  try {
    resultado = generar(ficha);
  } catch (error) {
    console.error(`\x1b[31m✗\x1b[0m ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const { carpeta, problemas, demo } = resultado;

  console.log(`✓ ${basename(ficha)}${demo ? ' (vista previa, no indexable)' : ''}`);
  console.log(`  ${join(carpeta, 'index.html')}`);

  if (problemas.length) {
    console.log(`\n\x1b[33mAntes de quitar "demo": true hay que completar ${problemas.length} cosa(s):\x1b[0m`);
    for (const p of problemas) console.log(`  · ${p}`);
    console.log('\n  Cada linea lleva la norma detras. Estan explicadas en alemania/RECHT.md § 7.');
  } else if (!demo) {
    console.log('\n  Los datos obligatorios estan completos. Lo que sigue no lo puede comprobar un programa:');
    console.log('  · que la Widerrufsbelehrung llegue tambien por correo tras la compra (§ 312f BGB);');
    console.log('  · que el enlace de pago cobre el mismo precio y el mismo envio que la ficha;');
    console.log('  · si quieres AGB, que sean de un servicio con garantia y no copiadas.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
