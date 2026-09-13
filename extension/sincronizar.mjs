/**
 * Copia el motor de margen dentro de la extension.
 *
 * Una extension de Chrome solo puede cargar archivos de su propia carpeta:
 * no puede importar ../dropshipping/margen.mjs. En vez de mantener dos
 * versiones del mismo calculo -que es como se acaba dando dos respuestas
 * distintas al mismo producto-, aqui se copia el original y el test
 * test/extension.test.mjs falla si la copia se queda atras.
 *
 *   npm run extension
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
export const ORIGEN = join(aqui, '..', 'dropshipping', 'margen.mjs');
export const DESTINO = join(aqui, 'lib', 'margen.mjs');

export function copiar() {
  const original = readFileSync(ORIGEN, 'utf8');
  writeFileSync(DESTINO, original);
  return original.length;
}

if (process.argv[1] && process.argv[1].endsWith('sincronizar.mjs')) {
  const n = copiar();
  console.log(`Copiado dropshipping/margen.mjs -> extension/lib/margen.mjs (${n} bytes)`);
}
