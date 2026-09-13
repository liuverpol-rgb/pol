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
/**
 * Lo que NO viaja dentro de la extension: documentacion, generadores y el
 * Worker de licencias, que se despliega aparte. Un test comprueba que todo lo
 * que hay en extension/ o se empaqueta a conciencia o se excluye a conciencia.
 */
export const FUERA = [
  'README.md',
  'LANZAMIENTO.md',
  'sincronizar.mjs',
  'empaquetar.mjs',
  'iconos/generar.mjs',
  'tienda/*',
  'licencias/*',
  '*.DS_Store',
];

export function empaquetar() {
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

  if (TIENDA.proveedor === 'lemonsqueezy' && !(TIENDA.tiendaId > 0 && TIENDA.productoId > 0)) {
    pendiente.push('Faltan tiendaId y productoId: sin ellos vale la clave de CUALQUIER vendedor de Lemon Squeezy.');
  }

  if (TIENDA.proveedor === 'propio') {
    if (!TIENDA.endpoint || TIENDA.endpoint.includes('EJEMPLO')) {
      pendiente.push('config.mjs sigue apuntando al dominio de ejemplo: pon el de tu Worker (licencias/README.md).');
    }
    if (TIENDA.urlCompra.includes('TU-PAYMENT-LINK')) {
      pendiente.push('Falta el Payment Link de Stripe en config.mjs.');
    }
    // Esta es la que se paga cara: Chrome bloquea la peticion en silencio y el
    // cliente que ha pagado se queda fuera sin un solo mensaje de error.
    try {
      const destino = new URL(TIENDA.endpoint).origin;
      const permitidos = manifiesto.host_permissions.map((h) => new URL(h.replace('/*', '/')).origin);
      if (!permitidos.includes(destino)) {
        pendiente.push(`host_permissions del manifiesto no cubre ${destino}. Ponlo o la licencia no se podra validar.`);
      }
    } catch {
      pendiente.push('El endpoint de config.mjs no es una URL valida.');
    }
  }

  if (pendiente.length) {
    console.log('Antes de subirlo a la tienda:');
    for (const p of pendiente) console.log(`  - ${p}`);
    console.log('\nSe puede subir igualmente: la version gratuita funciona entera.\n');
  } else {
    console.log('Configuracion completa. Listo para subir.\n');
  }
}

if (process.argv[1] && process.argv[1].endsWith('empaquetar.mjs')) empaquetar();
