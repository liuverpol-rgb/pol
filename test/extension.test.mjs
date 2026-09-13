import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { asinDeUrl, categoriaDeTarifa, esFichaDeProducto, leerProducto, precioDeTexto } from '../extension/lib/amazon.mjs';
import { analizar, categoriaSugerida, plataformaAmazon } from '../extension/lib/calculo.mjs';
import { TIENDA } from '../extension/config.mjs';
import { desglosar } from '../dropshipping/margen.mjs';
import { DESTINO, ORIGEN } from '../extension/sincronizar.mjs';
import { FUERA } from '../extension/empaquetar.mjs';

const RAIZ = new URL('../', import.meta.url).pathname;
const TARIFAS = JSON.parse(readFileSync(join(RAIZ, 'extension/datos/amazon.json'), 'utf8'));
const MANIFIESTO = JSON.parse(readFileSync(join(RAIZ, 'extension/manifest.json'), 'utf8'));

/** Documento de mentira: un mapa de selector a texto. */
function docFalso(mapa, migas = []) {
  const el = (t) => ({ textContent: t });
  return {
    querySelector: (sel) => (sel in mapa ? el(mapa[sel]) : null),
    querySelectorAll: (sel) =>
      sel === '#wayfinding-breadcrumbs_feature_div a' ? migas.map(el) : [],
  };
}

test('el precio se lee en formato aleman, espanol e ingles', () => {
  assert.equal(precioDeTexto('24,90 €'), 24.9);
  assert.equal(precioDeTexto('€1.234,56'), 1234.56);
  assert.equal(precioDeTexto('EUR 1,234.56'), 1234.56);
  assert.equal(precioDeTexto('1 234,56 €'), 1234.56);
  assert.equal(precioDeTexto('9.99'), 9.99);
  assert.equal(precioDeTexto('$0.99'), 0.99);
});

test('cuando no hay precio reconocible se devuelve null, no un cero', () => {
  for (const t of ['', '   ', 'Ver precio en la cesta', null, undefined, '0,00 €']) {
    assert.equal(precioDeTexto(t), null, `${t} deberia dar null`);
  }
});

test('el ASIN sale de la URL en sus varias formas', () => {
  assert.equal(asinDeUrl('https://www.amazon.de/dp/B08N5WRWNW'), 'B08N5WRWNW');
  assert.equal(asinDeUrl('https://www.amazon.es/algo-largo/dp/B08N5WRWNW/ref=sr_1_1?keywords=x'), 'B08N5WRWNW');
  assert.equal(asinDeUrl('https://www.amazon.de/gp/product/b08n5wrwnw/'), 'B08N5WRWNW');
  assert.equal(asinDeUrl('https://www.amazon.de/s?k=camiseta'), null);
  assert.equal(esFichaDeProducto('https://www.amazon.de/s?k=camiseta'), false);
});

test('leerProducto junta titulo, precio, ASIN y categoria', () => {
  const doc = docFalso(
    {
      '#productTitle': '  Termometro de cocina digital  ',
      '#corePrice_feature_div .a-price .a-offscreen': '18,99 €',
    },
    ['Hogar y cocina', 'Utensilios', 'Termometros'],
  );
  const p = leerProducto(doc, { url: 'https://www.amazon.es/dp/B08N5WRWNW/ref=x' });
  assert.equal(p.titulo, 'Termometro de cocina digital');
  assert.equal(p.precio, 18.99);
  assert.equal(p.asin, 'B08N5WRWNW');
  assert.equal(p.categoria, 'Hogar y cocina', 'la comision va por la categoria de primer nivel');
  assert.deepEqual(p.migas, ['Hogar y cocina', 'Utensilios', 'Termometros']);
  assert.equal(p.dominio, 'amazon.es');
});

test('si la maqueta cambia y no hay precio, el resto de la ficha se lee igual', () => {
  const p = leerProducto(docFalso({ '#productTitle': 'Cosa' }), { url: 'https://www.amazon.de/dp/B000000000' });
  assert.equal(p.precio, null);
  assert.equal(p.titulo, 'Cosa');
});

test('una categoria desconocida cae en la general, que es la mas cara', () => {
  const c = categoriaDeTarifa('Categoria que Amazon se acaba de inventar', TARIFAS.categorias);
  assert.equal(c.id, 'general');
  assert.equal(categoriaDeTarifa(null, TARIFAS.categorias).id, 'general');
  assert.equal(categoriaDeTarifa('Elektronik & Foto', TARIFAS.categorias).id, 'electronica');
  // Con la miga de pan entera vale con que acierte una, no la ultima.
  assert.equal(categoriaDeTarifa(['Elektronik & Foto', 'Messgerate'], TARIFAS.categorias).id, 'electronica');
  // categoriaSugerida devuelve ya el id, que es lo que guarda el formulario.
  assert.equal(categoriaSugerida({ migas: ['Schmuck', 'Ringe'] }, TARIFAS), 'joyeria');
  assert.equal(categoriaSugerida({ categoria: null }, TARIFAS), 'general');
});

test('el plan Individual mete los 0,99 EUR por articulo y el Profesional no', () => {
  const individual = plataformaAmazon(TARIFAS, { plan: 'particular', categoria: 'general' });
  const profesional = plataformaAmazon(TARIFAS, { plan: 'profesional', categoria: 'general' });
  assert.equal(individual.fijoPago, 0.99);
  assert.equal(profesional.fijoPago, 0);
  assert.equal(profesional.cuotaMensual, 39);
});

test('el analisis usa el mismo motor que el CLI de dropshipping', () => {
  const producto = { titulo: 'Termometro', precio: 18.99, categoria: 'Hogar y cocina' };
  const costes = { categoria: 'hogar', plan: 'particular', costeGenero: 6, costeEnvio: 2.5, kleinunternehmer: true, tasaDevolucion: 0.05, recuperacionDevolucion: 0.5 };
  const { desglose, plataforma } = analizar(producto, costes, TARIFAS);

  const aMano = desglosar(
    {
      nombre: 'Termometro',
      precioVenta: 18.99,
      envioCobrado: 0,
      costeGenero: 6,
      costeEnvio: 2.5,
      licenciaEnvase: 0.08,
      tasaDevolucion: 0.05,
      recuperacionDevolucion: 0.5,
      unidades: 1,
    },
    plataforma,
    { kleinunternehmer: true, tipoIva: 0.19 },
  );
  assert.equal(desglose.beneficio, aMano.beneficio);
  assert.ok(desglose.beneficio > 0 && desglose.beneficio < 18.99);
});

test('el precio de equilibrio deja beneficio cero', () => {
  const costes = { categoria: 'general', plan: 'particular', costeGenero: 9, costeEnvio: 3 };
  const { equilibrio } = analizar({ titulo: 'x', precio: 30 }, costes, TARIFAS);
  const enEquilibrio = analizar({ titulo: 'x', precio: equilibrio }, costes, TARIFAS);
  assert.ok(Math.abs(enEquilibrio.desglose.beneficio) < 0.02, `deberia rondar cero y da ${enEquilibrio.desglose.beneficio}`);
});

test('mientras las tarifas no esten contrastadas, el usuario se entera', () => {
  const { avisos } = analizar({ titulo: 'x', precio: 20 }, { costeGenero: 5 }, TARIFAS);
  assert.equal(TARIFAS._verificado, false, 'si ya las has verificado, actualiza este test');
  assert.ok(avisos.some((a) => /sin contrastar/i.test(a)));
});

test('la copia del motor de margen esta al dia', () => {
  assert.equal(
    readFileSync(DESTINO, 'utf8'),
    readFileSync(ORIGEN, 'utf8'),
    'extension/lib/margen.mjs se ha quedado atras: ejecuta "npm run extension"',
  );
});

test('el manifiesto apunta a archivos que existen', () => {
  const archivos = [
    MANIFIESTO.action.default_popup,
    MANIFIESTO.background.service_worker,
    ...MANIFIESTO.content_scripts.flatMap((c) => c.js),
    ...Object.values(MANIFIESTO.icons),
  ];
  for (const a of archivos) {
    assert.ok(existsSync(join(RAIZ, 'extension', a)), `falta extension/${a}`);
  }
  assert.equal(MANIFIESTO.manifest_version, 3);
  assert.ok(MANIFIESTO.permissions.includes('storage'), 'sin "storage" no hay contador');
});

test('los recursos que carga el content script estan declarados para los mismos dominios', () => {
  const deContenido = MANIFIESTO.content_scripts[0].matches;
  const accesibles = MANIFIESTO.web_accessible_resources[0];
  assert.deepEqual(accesibles.matches, deContenido);
  assert.ok(accesibles.resources.includes('lib/*.mjs'), 'el parser se carga con import() desde el content script');
});

test('la extension no pide mas permisos de los que usa', () => {
  assert.deepEqual(MANIFIESTO.permissions.sort(), ['activeTab', 'scripting', 'storage']);
  assert.equal(MANIFIESTO.host_permissions.length, 1, 'un solo dominio: el del servidor de licencias');
});

test('el servidor de licencias de config.mjs esta permitido en el manifiesto', () => {
  // Si estas dos cosas no coinciden, Chrome bloquea la validacion de la
  // licencia sin un solo mensaje de error y quien ha pagado se queda fuera.
  const destino = TIENDA.proveedor === 'propio' ? TIENDA.endpoint : 'https://api.lemonsqueezy.com/';
  const origen = new URL(destino).origin;
  const permitidos = MANIFIESTO.host_permissions.map((p) => new URL(p.replace('/*', '/')).origin);
  assert.ok(
    permitidos.includes(origen),
    `host_permissions no cubre ${origen}: ${permitidos.join(', ')}`,
  );
});

test('todo lo que hay en extension/ o se empaqueta o se excluye a conciencia', () => {
  // Si anades algo a extension/, este test te obliga a decidir si viaja dentro
  // del ZIP que se sube a la tienda. Asi no se cuela un generador ni se queda
  // fuera un archivo que la extension necesita para arrancar.
  const ENVIADOS = [
    'manifest.json', 'contenido.js', 'fondo.mjs',
    'popup.html', 'popup.css', 'popup.mjs', 'config.mjs',
    'lib', 'datos', 'iconos',
  ];
  const excluido = (nombre) =>
    FUERA.some((p) => p === nombre || (p.endsWith('/*') && nombre === p.slice(0, -2)));

  for (const entrada of readdirSync(join(RAIZ, 'extension'))) {
    assert.ok(
      ENVIADOS.includes(entrada) || excluido(entrada),
      `extension/${entrada} no esta ni en el paquete ni en la lista de exclusiones de empaquetar.mjs`,
    );
  }
});
