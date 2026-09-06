/**
 * Generador de codigos QR, sin dependencias.
 *
 * Se escribe a mano por dos motivos: la carta se imprime desde un archivo
 * local y no debe depender de internet, y el enlace de un cliente no tiene
 * por que pasar por el servidor de un tercero.
 *
 * Alcance: modo byte, correccion de errores nivel M (recupera un 15 %, que
 * es lo que aguanta un papel doblado), versiones 1 a 10 — hasta 213
 * caracteres, de sobra para cualquier URL.
 */

// --- Tablas del estandar ------------------------------------------------
// Por version: [codewords de datos, codewords de correccion por bloque,
// bloques del grupo 1, datos por bloque del grupo 1, bloques del grupo 2].
const VERSIONES_M = {
  1:  [16,  10, 1, 16, 0],
  2:  [28,  16, 1, 28, 0],
  3:  [44,  26, 1, 44, 0],
  4:  [64,  18, 2, 32, 0],
  5:  [86,  24, 2, 43, 0],
  6:  [108, 16, 4, 27, 0],
  7:  [124, 18, 4, 31, 0],
  8:  [154, 22, 2, 38, 2],
  9:  [182, 22, 3, 36, 2],
  10: [216, 26, 4, 43, 1],
};

const ALINEACION = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

// --- Aritmetica en GF(256), polinomio primitivo 0x11D --------------------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** Polinomio generador de Reed-Solomon para `grado` codewords de control. */
function generador(grado) {
  let poly = [1];
  for (let i = 0; i < grado; i++) {
    const siguiente = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      siguiente[j] ^= poly[j];
      siguiente[j + 1] ^= mul(poly[j], EXP[i]);
    }
    poly = siguiente;
  }
  return poly;
}

/** Codewords de correccion de un bloque de datos. */
function correccion(datos, numEc) {
  const gen = generador(numEc);
  const resto = new Array(numEc).fill(0);
  for (const byte of datos) {
    const factor = byte ^ resto[0];
    resto.shift();
    resto.push(0);
    for (let j = 0; j < numEc; j++) resto[j] ^= mul(gen[j + 1], factor);
  }
  return resto;
}

// --- Construccion de la trama -------------------------------------------
function elegirVersion(longitud) {
  for (let v = 1; v <= 10; v++) {
    const [datos] = VERSIONES_M[v];
    const bitsCuenta = v <= 9 ? 8 : 16;
    if (datos * 8 >= 4 + bitsCuenta + longitud * 8) return v;
  }
  throw new Error(`Texto demasiado largo para un QR de version 10 (${longitud} caracteres)`);
}

function codewordsDeDatos(bytes, version) {
  const [totalDatos] = VERSIONES_M[version];
  const bitsCuenta = version <= 9 ? 8 : 16;
  const bits = [];
  const empujar = (valor, n) => {
    for (let i = n - 1; i >= 0; i--) bits.push((valor >> i) & 1);
  };

  empujar(0b0100, 4);              // modo byte
  empujar(bytes.length, bitsCuenta);
  for (const b of bytes) empujar(b, 8);

  // Terminador, relleno hasta byte completo y bytes de relleno alternos.
  const capacidad = totalDatos * 8;
  for (let i = 0; i < 4 && bits.length < capacidad; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const cw = [];
  for (let i = 0; i < bits.length; i += 8) {
    cw.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  }
  const relleno = [0xec, 0x11];
  for (let i = 0; cw.length < totalDatos; i++) cw.push(relleno[i % 2]);
  return cw;
}

/** Reparte en bloques, calcula la correccion e intercala segun el estandar. */
function codewordsFinales(datos, version) {
  const [, numEc, bloques1, porBloque1, bloques2] = VERSIONES_M[version];
  const porBloque2 = porBloque1 + 1;

  const grupos = [];
  let pos = 0;
  for (let i = 0; i < bloques1; i++) { grupos.push(datos.slice(pos, pos + porBloque1)); pos += porBloque1; }
  for (let i = 0; i < bloques2; i++) { grupos.push(datos.slice(pos, pos + porBloque2)); pos += porBloque2; }

  const ec = grupos.map((g) => correccion(g, numEc));
  const salida = [];
  const maxDatos = Math.max(...grupos.map((g) => g.length));
  for (let i = 0; i < maxDatos; i++) for (const g of grupos) if (i < g.length) salida.push(g[i]);
  for (let i = 0; i < numEc; i++) for (const b of ec) salida.push(b[i]);
  return salida;
}

// --- Matriz --------------------------------------------------------------
function nuevaMatriz(tam) {
  return Array.from({ length: tam }, () => new Array(tam).fill(null));
}

function ponerPatrones(m, version) {
  const tam = m.length;
  const buscador = (fila, col) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const f = fila + i; const c = col + j;
        if (f < 0 || c < 0 || f >= tam || c >= tam) continue;
        const borde = i === 0 || i === 6 || j === 0 || j === 6;
        const centro = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[f][c] = borde || centro ? 1 : 0;
      }
    }
  };
  buscador(0, 0); buscador(0, tam - 7); buscador(tam - 7, 0);

  for (let i = 8; i < tam - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    m[6][i] = v; m[i][6] = v;
  }

  const centros = ALINEACION[version];
  for (const f of centros) {
    for (const c of centros) {
      if ((f <= 8 && c <= 8) || (f <= 8 && c >= tam - 9) || (f >= tam - 9 && c <= 8)) continue;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          m[f + i][c + j] = Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0;
        }
      }
    }
  }

  m[tam - 8][8] = 1; // modulo oscuro, siempre

  // Reservar las zonas de formato y version.
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][tam - 1 - i] === null) m[8][tam - 1 - i] = 0;
    if (m[tam - 1 - i][8] === null) m[tam - 1 - i][8] = 0;
  }
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m[tam - 11 + j][i] = 0;
        m[i][tam - 11 + j] = 0;
      }
    }
  }
}

/** Copia de la matriz marcando que celdas son funcionales (no llevan datos). */
function mapaReservado(version, tam) {
  const m = nuevaMatriz(tam);
  ponerPatrones(m, version);
  return m.map((fila) => fila.map((v) => v !== null));
}

function ponerDatos(m, reservado, codewords) {
  const tam = m.length;
  const bits = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);

  let indice = 0;
  let arriba = true;
  for (let col = tam - 1; col > 0; col -= 2) {
    if (col === 6) col--; // la columna de sincronismo no lleva datos
    for (let paso = 0; paso < tam; paso++) {
      const fila = arriba ? tam - 1 - paso : paso;
      for (const c of [col, col - 1]) {
        if (reservado[fila][c]) continue;
        m[fila][c] = indice < bits.length ? bits[indice] : 0;
        indice++;
      }
    }
    arriba = !arriba;
  }
}

const MASCARAS = [
  (i, j) => (i + j) % 2 === 0,
  (i) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0,
  (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0,
];

function penalizacion(m) {
  const tam = m.length;
  let total = 0;

  // Regla 1: rachas de cinco o mas del mismo color.
  for (let i = 0; i < tam; i++) {
    for (const porFilas of [true, false]) {
      let racha = 1;
      for (let j = 1; j < tam; j++) {
        const a = porFilas ? m[i][j] : m[j][i];
        const b = porFilas ? m[i][j - 1] : m[j - 1][i];
        if (a === b) racha++;
        else { if (racha >= 5) total += racha - 2; racha = 1; }
      }
      if (racha >= 5) total += racha - 2;
    }
  }
  // Regla 2: bloques de 2x2.
  for (let i = 0; i < tam - 1; i++) {
    for (let j = 0; j < tam - 1; j++) {
      const v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) total += 3;
    }
  }
  // Regla 3: patron parecido al del buscador.
  const patron = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const inverso = [...patron].reverse();
  for (let i = 0; i < tam; i++) {
    for (let j = 0; j <= tam - 11; j++) {
      for (const p of [patron, inverso]) {
        if (p.every((v, k) => m[i][j + k] === v)) total += 40;
        if (p.every((v, k) => m[j + k][i] === v)) total += 40;
      }
    }
  }
  // Regla 4: desequilibrio entre claro y oscuro.
  const oscuros = m.flat().filter((v) => v === 1).length;
  const porcentaje = (oscuros * 100) / (tam * tam);
  total += Math.floor(Math.abs(porcentaje - 50) / 5) * 10;
  return total;
}

function ponerFormato(m, mascara) {
  const tam = m.length;
  let datos = (0b00 << 3) | mascara; // 00 = nivel de correccion M
  let resto = datos << 10;
  for (let i = 4; i >= 0; i--) {
    if (resto & (1 << (i + 10))) resto ^= 0b10100110111 << i;
  }
  const bits = ((datos << 10) | resto) ^ 0b101010000010010;
  const leer = (i) => (bits >> i) & 1;

  for (let i = 0; i <= 5; i++) m[8][i] = leer(14 - i);
  m[8][7] = leer(8); m[8][8] = leer(7); m[7][8] = leer(6);
  for (let i = 9; i <= 14; i++) m[14 - i][8] = leer(14 - i);

  // La segunda copia va 7 bits en vertical y 8 en horizontal: entre medias
  // queda el modulo oscuro de (tam-8, 8), que no se puede pisar.
  for (let i = 0; i <= 6; i++) m[tam - 1 - i][8] = leer(i);
  for (let i = 7; i <= 14; i++) m[8][tam - 15 + i] = leer(i);
}

function ponerVersion(m, version) {
  if (version < 7) return;
  const tam = m.length;
  let resto = version << 12;
  for (let i = 5; i >= 0; i--) {
    if (resto & (1 << (i + 12))) resto ^= 0b1111100100101 << i;
  }
  const bits = (version << 12) | resto;
  for (let i = 0; i < 18; i++) {
    const bit = (bits >> i) & 1;
    m[Math.floor(i / 3)][tam - 11 + (i % 3)] = bit;
    m[tam - 11 + (i % 3)][Math.floor(i / 3)] = bit;
  }
}

/** Devuelve la matriz del QR: array de arrays con 0 (claro) y 1 (oscuro). */
export function matrizQr(texto) {
  const bytes = [...new TextEncoder().encode(texto)];
  const version = elegirVersion(bytes.length);
  const tam = version * 4 + 17;
  const codewords = codewordsFinales(codewordsDeDatos(bytes, version), version);
  const reservado = mapaReservado(version, tam);

  let mejor = null;
  let mejorPuntos = Infinity;
  for (let mascara = 0; mascara < 8; mascara++) {
    const m = nuevaMatriz(tam);
    ponerPatrones(m, version);
    ponerDatos(m, reservado, codewords);
    for (let i = 0; i < tam; i++) {
      for (let j = 0; j < tam; j++) {
        if (!reservado[i][j] && MASCARAS[mascara](i, j)) m[i][j] ^= 1;
      }
    }
    ponerFormato(m, mascara);
    ponerVersion(m, version);

    const puntos = penalizacion(m);
    if (puntos < mejorPuntos) { mejorPuntos = puntos; mejor = m; }
  }
  return mejor;
}

/**
 * QR como SVG listo para incrustar. `tam` es el lado en milimetros y
 * `margen` el borde blanco en modulos (el estandar pide 4).
 */
export function qrSvg(texto, { tam = 26, margen = 4 } = {}) {
  const m = matrizQr(texto);
  const lado = m.length + margen * 2;
  const rects = [];
  for (let i = 0; i < m.length; i++) {
    for (let j = 0; j < m.length; j++) {
      if (m[i][j]) rects.push(`<rect x="${j + margen}" y="${i + margen}" width="1" height="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" `
    + `width="${tam}mm" height="${tam}mm" shape-rendering="crispEdges">`
    + `<rect width="${lado}" height="${lado}" fill="#fff"/>`
    + `<g fill="#000">${rects.join('')}</g></svg>`;
}
