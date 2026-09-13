/**
 * Genera los iconos PNG de la extension.
 *
 * Chrome no acepta SVG en el manifiesto: hacen falta PNG de 16, 32, 48 y
 * 128 px, y la Chrome Web Store exige ademas el de 128. En vez de guardar
 * cuatro binarios que nadie sabe rehacer, el dibujo esta aqui en 40 lineas
 * de aritmetica y se regenera con:
 *
 *   node extension/iconos/generar.mjs
 *
 * El dibujo: cuadrado verde con tres barras blancas que menguan. Es lo que
 * hace la extension: ensenar lo que queda del precio despues de cada
 * mordisco.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const VERDE = [15, 107, 79];
const BLANCO = [255, 255, 255];
const TAMANOS = [16, 32, 48, 128];

const tablaCrc = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = tablaCrc[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

/** PNG RGBA de 8 bits a partir de una funcion (x, y) -> [r, g, b, a]. */
export function png(lado, pintar) {
  const filas = [];
  for (let y = 0; y < lado; y++) {
    const fila = Buffer.alloc(1 + lado * 4);
    for (let x = 0; x < lado; x++) {
      const [r, g, b, a] = pintar(x, y);
      fila.set([r, g, b, a], 1 + x * 4);
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(Buffer.concat(filas), { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

/** El dibujo, en coordenadas relativas para que sirva en cualquier tamano. */
export function icono(lado) {
  const radio = lado * 0.22;
  const dentroDelRedondeo = (x, y) => {
    const cx = Math.min(Math.max(x, radio), lado - radio);
    const cy = Math.min(Math.max(y, radio), lado - radio);
    return (x - cx) ** 2 + (y - cy) ** 2 <= radio ** 2;
  };
  // Tres barras que menguan: el precio, lo que queda tras comisiones, lo tuyo.
  const barras = [0.72, 0.5, 0.28].map((alto, i) => ({
    x0: lado * (0.2 + i * 0.22),
    x1: lado * (0.2 + i * 0.22 + 0.14),
    y0: lado * (0.82 - alto * 0.64),
    y1: lado * 0.82,
  }));

  return png(lado, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    if (!dentroDelRedondeo(px, py)) return [0, 0, 0, 0];
    const enBarra = barras.some((b) => px >= b.x0 && px < b.x1 && py >= b.y0 && py < b.y1);
    return enBarra ? [...BLANCO, 255] : [...VERDE, 255];
  });
}

if (process.argv[1] && process.argv[1].endsWith('generar.mjs')) {
  for (const lado of TAMANOS) {
    writeFileSync(`${AQUI}/${lado}.png`, icono(lado));
  }
  console.log(`Generados ${TAMANOS.map((t) => `${t}.png`).join(', ')} en extension/iconos/`);
}
