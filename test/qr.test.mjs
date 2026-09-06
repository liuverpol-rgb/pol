import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { matrizQr, qrSvg } from '../webs-locales/contacto/qr.mjs';

const huella = (m) => createHash('sha256').update(m.map((f) => f.join('')).join('|')).digest('hex').slice(0, 16);

/**
 * Salidas de referencia. Se generaron con este mismo codigo y se
 * comprobaron una a una con jsQR, un lector independiente: descodificaban
 * exactamente el texto de entrada. Congelarlas detecta cualquier regresion
 * sin arrastrar una dependencia al proyecto.
 */
test('salidas de referencia verificadas con un lector externo', () => {
  assert.equal(huella(matrizQr('https://zur-muehle-reinbek.netlify.app')), '5442651eb3d66497');
  assert.equal(huella(matrizQr('http://a.de')), '13a4530096f13465');
});

test('la version crece con la longitud del texto', () => {
  const lado = (t) => matrizQr(t).length;
  assert.equal(lado('http://a.de'), 21, 'version 1');
  assert.ok(lado('x'.repeat(100)) > lado('x'.repeat(20)));
  // Version 10 es el limite: 213 bytes entran, 214 no.
  assert.equal(lado('x'.repeat(213)), 57);
  assert.throws(() => matrizQr('x'.repeat(214)), /demasiado largo/);
});

test('los tres patrones de busqueda estan donde deben', () => {
  const m = matrizQr('https://ejemplo.de');
  const n = m.length;
  for (const [f, c] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    // Borde exterior oscuro, anillo interior claro, centro oscuro.
    assert.equal(m[f][c], 1);
    assert.equal(m[f + 1][c + 1], 0);
    assert.equal(m[f + 3][c + 3], 1);
    assert.equal(m[f + 6][c + 6], 1);
  }
  // La cuarta esquina no lleva buscador, sino el patron de alineacion:
  // centro oscuro rodeado de un anillo claro.
  assert.equal(m[n - 7][n - 7], 1, 'centro del patron de alineacion');
  assert.equal(m[n - 8][n - 8], 0, 'anillo claro alrededor');
  assert.equal(m[n - 9][n - 9], 1, 'borde exterior del patron de alineacion');
});

test('los patrones de sincronismo alternan y el modulo oscuro esta puesto', () => {
  const m = matrizQr('https://ejemplo.de');
  for (let i = 8; i < m.length - 8; i++) {
    assert.equal(m[6][i], i % 2 === 0 ? 1 : 0, `fila de sincronismo en ${i}`);
    assert.equal(m[i][6], i % 2 === 0 ? 1 : 0, `columna de sincronismo en ${i}`);
  }
  assert.equal(m[m.length - 8][8], 1, 'el modulo oscuro es obligatorio');
});

test('el mismo texto da siempre el mismo codigo', () => {
  assert.equal(huella(matrizQr('https://ejemplo.de')), huella(matrizQr('https://ejemplo.de')));
});

test('el UTF-8 se codifica en bytes, no en caracteres', () => {
  // "ö" ocupa dos bytes: un texto con eñes puede necesitar mas version.
  // 106 eñes son 212 bytes y entran; 107 son 214 y ya no.
  assert.ok(matrizQr('ö'.repeat(106)).length > 0);
  assert.throws(() => matrizQr('ö'.repeat(107)), /demasiado largo/);
});

test('el SVG sale bien formado y con el margen del estandar', () => {
  const svg = qrSvg('https://ejemplo.de', { tam: 26 });
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('width="26mm"'));
  assert.ok(svg.includes('shape-rendering="crispEdges"'), 'sin esto se ve borroso al imprimir');
  // viewBox = lado del codigo mas 4 modulos de margen a cada lado.
  const lado = matrizQr('https://ejemplo.de').length + 8;
  assert.ok(svg.includes(`viewBox="0 0 ${lado} ${lado}"`));
  assert.equal((svg.match(/<rect/g) || []).length - 1, matrizQr('https://ejemplo.de').flat().filter(Boolean).length);
});
