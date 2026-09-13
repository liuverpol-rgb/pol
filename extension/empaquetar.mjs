/**
 * Prepara el ZIP que se sube a la Chrome Web Store.
 *
 *   npm run empaquetar
 *
 * Hace tres cosas antes de comprimir, que son las tres que se olvidan:
 * copia el motor de margen, regenera los iconos y repasa la configuracion
 * en voz alta. Del paquete se quedan fuera los archivos de desarrollo
 * (README, plan de lanzamiento, generadores): no aportan nada al usuario y
 * un paquete mas pequeno se revisa antes.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copiar } from './sincronizar.mjs';
import { icono } from './iconos/generar.mjs';
import { TIENDA } from './config.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const FUERA = ['README.md', 'LANZAMIENTO.md', 'sincronizar.mjs', 'empaquetar.mjs', 'iconos/generar.mjs', 'tienda/*', '*.DS_Store'];

copiar();
for (const lado of [16, 32, 48, 128]) writeFileSync(join(AQUI, 'iconos', `${lado}.png`), icono(lado));

const manifiesto = JSON.parse(readFileSync(join(AQUI, 'manifest.json'), 'utf8'));
const destino = join(RAIZ, `margen-amazon-${manifiesto.version}.zip`);
rmSync(destino, { force: true });

execFileSync('zip', ['-r', '-q', destino, '.', '-x', ...FUERA], { cwd: AQUI });

const kb = (statSync(destino).size / 1024).toFixed(1);
const dentro = execFileSync('unzip', ['-Z1', destino], { encoding: 'utf8' }).trim().split('\n');

console.log(`\n${destino.replace(`${RAIZ}/`, '')} — ${kb} kB, ${dentro.length} archivos\n`);

const pendiente = [];
const tarifas = JSON.parse(readFileSync(join(AQUI, 'datos', 'amazon.json'), 'utf8'));
if (tarifas._verificado !== true) pendiente.push('Las comisiones de datos/amazon.json siguen sin contrastar con Seller Central.');
if (!TIENDA.configurada) pendiente.push('La tienda no esta configurada: el boton dira "Pro, proximamente" y no cobrara.');
if (TIENDA.configurada && TIENDA.proveedor === 'lemonsqueezy' && !(TIENDA.tiendaId > 0 && TIENDA.productoId > 0)) {
  pendiente.push('Faltan tiendaId y productoId: sin ellos vale la clave de CUALQUIER vendedor de Lemon Squeezy.');
}
if (TIENDA.configurada && TIENDA.proveedor === 'propio' && !TIENDA.endpoint) {
  pendiente.push('Falta el endpoint de validacion de tu servidor.');
}

if (pendiente.length) {
  console.log('Antes de subirlo a la tienda:');
  for (const p of pendiente) console.log(`  - ${p}`);
  console.log('\nSe puede subir igualmente: la version gratuita funciona entera.\n');
} else {
  console.log('Configuracion completa. Listo para subir.\n');
}
