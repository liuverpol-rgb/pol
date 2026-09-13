import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { esc, MARCADOR, renderTienda, validar } from '../dropshipping/tienda/plantilla/render.mjs';
import { generar } from '../dropshipping/tienda/generar.mjs';

/** Ficha minima pero completa: la que si se puede publicar. */
const COMPLETA = () => ({
  demo: false,
  tienda: { nombre: 'Sachsenwald Druck', emoji: '🌳', colores: { acento: '#2f6b4a' } },
  titular: {
    nombre: 'Erika Mustermann',
    calle: 'Hauptstraße 1',
    cp: '21465',
    ciudad: 'Reinbek',
    email: 'hallo@example.de',
    telefono: '+49 40 000000',
    kleinunternehmer: true,
    lucid: 'DE1234567890123',
  },
  envio: { coste: 3.9, gratisDesde: 50, plazoDias: [3, 6], retornoPagaCliente: true },
  pago: ['Kreditkarte', 'PayPal'],
  productos: [
    {
      id: 'lamina',
      nombre: 'Kunstdruck 30 × 40',
      precio: 21.9,
      enlacePago: 'https://buy.example.com/lamina',
      fabricante: { nombre: 'Druckerei GmbH', direccion: 'Musterweg 2, 20095 Hamburg', email: 'a@b.de' },
    },
  ],
});

const paginas = (config) => Object.values(renderTienda(config));

test('esc no deja pasar HTML de las fichas', () => {
  assert.equal(esc('<script>"x"&'), '&lt;script&gt;&quot;x&quot;&amp;');
  assert.equal(esc(), '');
});

test('salen las cinco paginas que un comercio aleman necesita', () => {
  const salida = renderTienda(COMPLETA());
  assert.deepEqual(Object.keys(salida).sort(), [
    'datenschutz.html',
    'impressum.html',
    'index.html',
    'versand-zahlung.html',
    'widerruf.html',
  ]);
  for (const html of Object.values(salida)) {
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /<html lang="de">/);
    assert.ok(html.trim().endsWith('</html>'));
  }
});

test('las cuatro paginas legales estan enlazadas desde todas las paginas', () => {
  for (const html of paginas(COMPLETA())) {
    for (const archivo of ['impressum.html', 'datenschutz.html', 'widerruf.html', 'versand-zahlung.html']) {
      assert.ok(
        html.includes(`href="${archivo}"`) || html.includes('aria-current="page"'),
        `falta el enlace a ${archivo}`,
      );
    }
  }
});

test('el boton de pedido lleva la formula que exige el § 312j Abs. 3 BGB', () => {
  const html = renderTienda(COMPLETA())['index.html'];
  assert.match(html, /Zahlungspflichtig bestellen/);
  assert.match(html, /href="https:\/\/buy\.example\.com\/lamina"/);
  // Y en vista previa el boton no lleva a ningun sitio.
  const demo = renderTienda({ ...COMPLETA(), demo: true })['index.html'];
  assert.match(demo, /class="boton-demo">Zahlungspflichtig bestellen/);
  assert.ok(!demo.includes('href="https://buy.example.com/lamina"'));
});

test('un Kleinunternehmer no menciona el IVA en ninguna pagina', () => {
  for (const html of paginas(COMPLETA())) {
    assert.ok(!/inkl\. MwSt/.test(html), 'un Kleinunternehmer no puede anunciar IVA');
  }
  const index = renderTienda(COMPLETA())['index.html'];
  assert.match(index, /§ 19 UStG wird keine Umsatzsteuer berechnet/);
});

test('en regimen general se indica el IVA y desaparece la mencion del § 19', () => {
  const config = COMPLETA();
  config.titular.kleinunternehmer = false;
  config.titular.ustIdNr = 'DE123456789';
  const index = renderTienda(config)['index.html'];
  assert.match(index, /inkl\. MwSt/);
  assert.ok(!index.includes('§ 19 UStG'));
  assert.match(renderTienda(config)['impressum.html'], /DE123456789/);
});

test('el precio va con los gastos de envio y el plazo de entrega, como exige la PAngV', () => {
  const index = renderTienda(COMPLETA())['index.html'];
  assert.match(index, /21,90 €/);
  assert.match(index, /Versandkosten/);
  assert.match(index, /3,90 €/);
  assert.match(index, /ab 50,00 € kostenfrei/);
  assert.match(index, /Lieferzeit:\s*<strong>3–6 Werktage/);
});

test('los datos de fabricante de la GPSR salen en la ficha del producto', () => {
  const index = renderTienda(COMPLETA())['index.html'];
  assert.match(index, /Herstellerangaben \(GPSR\)/);
  assert.match(index, /Druckerei GmbH/);
  assert.match(index, /Musterweg 2, 20095 Hamburg/);
});

test('un producto de fuera de la UE publica su persona responsable', () => {
  const config = COMPLETA();
  config.productos[0].fabricante.extraUe = true;
  config.productos[0].personaResponsableUE = { nombre: 'EU Rep GmbH', direccion: 'Berlin', email: 'rep@x.de' };
  const index = renderTienda(config)['index.html'];
  assert.match(index, /Verantwortliche Person in der EU/);
  assert.match(index, /EU Rep GmbH/);
});

test('lo personalizado avisa de que no hay derecho de desistimiento', () => {
  const config = COMPLETA();
  config.productos[0].personalizado = true;
  assert.match(renderTienda(config)['index.html'], /kein Widerrufsrecht<\/a> \(§ 312g Abs\. 2 Nr\. 1 BGB\)/);
  // Y el producto normal no dice nada de eso.
  assert.ok(!renderTienda(COMPLETA())['index.html'].includes('§ 312g'));
});

test('la Widerrufsbelehrung lleva el plazo, la direccion y el formulario del anexo 2', () => {
  const html = renderTienda(COMPLETA())['widerruf.html'];
  assert.match(html, /binnen vierzehn Tagen ohne Angabe von Gründen/);
  assert.match(html, /Muster-Widerrufsformular/);
  assert.match(html, /Erika Mustermann, Hauptstraße 1, 21465 Reinbek/);
  assert.match(html, /Sie tragen die unmittelbaren Kosten der Rücksendung/);

  // Si el porte de vuelta lo pagas tu, el texto cambia: no se puede cobrar
  // al cliente algo que no le has anunciado.
  const config = COMPLETA();
  config.envio.retornoPagaCliente = false;
  assert.match(renderTienda(config)['widerruf.html'], /Wir tragen die Kosten der Rücksendung/);
});

test('el Impressum lleva lo que pide el § 5 DDG y el numero LUCID si lo hay', () => {
  const html = renderTienda(COMPLETA())['impressum.html'];
  for (const dato of ['Erika Mustermann', 'Hauptstraße 1', '21465', 'Reinbek', 'hallo@example.de', '+49 40 000000']) {
    assert.ok(html.includes(dato), `falta ${dato}`);
  }
  assert.match(html, /LUCID-Registrierungsnummer: DE1234567890123/);
});

test('solo la vista previa lleva noindex, y siempre lo lleva', () => {
  for (const html of paginas({ ...COMPLETA(), demo: true })) {
    assert.match(html, /noindex, nofollow/);
    assert.match(html, /Vorschau, kein Shop/);
  }
  for (const html of paginas(COMPLETA())) {
    assert.ok(!html.includes('noindex'));
    assert.ok(!html.includes('Vorschau, kein Shop'));
  }
});

test('validar acepta la ficha completa y nombra la norma de cada falta', () => {
  assert.deepEqual(validar(COMPLETA()), []);

  const casos = [
    [(c) => delete c.titular.calle, /§ 5 DDG/],
    [(c) => delete c.titular.email, /§ 5 DDG/],
    [(c) => { delete c.titular.telefono; }, /§ 5 DDG/],
    [(c) => delete c.envio.plazoDias, /246a EGBGB/],
    [(c) => delete c.envio.coste, /PAngV/],
    [(c) => delete c.productos[0].precio, /PAngV/],
    [(c) => delete c.productos[0].enlacePago, /enlace de pago/],
    [(c) => delete c.productos[0].fabricante.direccion, /GPSR/],
    [(c) => { c.productos[0].fabricante.extraUe = true; }, /Art\. 4 y 19 GPSR/],
    [(c) => { c.productos[0].textil = true; delete c.productos[0].material; }, /TextilKennzVO/],
    [(c) => { c.productos = []; }, /vacia/],
    [(c) => { c.tienda.claim = `Hola ${MARCADOR}`; }, /marcadores/],
  ];
  for (const [romper, esperado] of casos) {
    const config = COMPLETA();
    romper(config);
    const problemas = validar(config);
    assert.ok(problemas.length, `deberia fallar: ${esperado}`);
    assert.match(problemas.join(' | '), esperado);
  }
});

test('un telefono ausente se puede suplir con formulario de contacto', () => {
  const config = COMPLETA();
  delete config.titular.telefono;
  config.titular.formularioContacto = 'https://example.de/kontakt';
  assert.deepEqual(validar(config), []);
});

test('generar escribe la tienda completa y copia el CSS', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tienda-'));
  const ficha = join(dir, 'mi-tienda.json');
  writeFileSync(ficha, JSON.stringify(COMPLETA()));

  const { carpeta, problemas, demo } = generar(ficha, { raiz: dir });
  assert.deepEqual(problemas, []);
  assert.equal(demo, false);
  for (const archivo of [
    'index.html',
    'impressum.html',
    'datenschutz.html',
    'widerruf.html',
    'versand-zahlung.html',
    'estilo.css',
  ]) {
    assert.ok(existsSync(join(carpeta, archivo)), `falta ${archivo}`);
  }
  assert.match(readFileSync(join(carpeta, 'estilo.css'), 'utf8'), /--acento/);
});

test('generar se niega a publicar una tienda incompleta y deja pasar la vista previa', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tienda-'));
  const incompleta = COMPLETA();
  delete incompleta.titular.calle;

  const publicable = join(dir, 'publicable.json');
  writeFileSync(publicable, JSON.stringify(incompleta));
  assert.throws(() => generar(publicable, { raiz: dir }), /no se puede publicar todavia[\s\S]*§ 5 DDG/);

  const vista = join(dir, 'vista.json');
  writeFileSync(vista, JSON.stringify({ ...incompleta, demo: true }));
  const { problemas, demo } = generar(vista, { raiz: dir });
  assert.equal(demo, true);
  assert.ok(problemas.length, 'la vista previa se genera, pero sigue diciendo lo que falta');
});

test('la ficha de ejemplo del repositorio es una vista previa, no una tienda publicable', () => {
  const config = JSON.parse(
    readFileSync(new URL('../dropshipping/tienda/ejemplo.json', import.meta.url), 'utf8'),
  );
  assert.equal(config.demo, true, 'el ejemplo nunca se publica tal cual');
  assert.ok(validar(config).length, 'y por eso lleva los marcadores puestos');
});
