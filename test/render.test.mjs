import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSitio, esc } from '../webs-locales/plantilla/render.mjs';

const negocio = {
  nombre: 'Bar de Prueba',
  tipo: 'Bar',
  telefono: '+34 600 11 22 33',
  whatsapp: '34600112233',
  mapa: 'https://maps.example/x',
  horario: { lunes: [], martes: [['09:00', '14:00'], ['17:00', '20:00']] },
  secciones: [{ titulo: 'Carta', items: [{ nombre: 'Caña', precio: '1,80 €' }] }],
};

test('escapa el HTML de los datos del negocio', () => {
  assert.equal(esc('<b>"a" & \'b\'</b>'), '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;');
  const html = renderSitio({ ...negocio, nombre: '<script>alerta()</script>' });
  assert.ok(!html.includes('<script>alerta()'), 'el nombre no debe inyectar etiquetas');
  assert.ok(html.includes('&lt;script&gt;alerta()'));
});

test('el telefono se limpia para el enlace tel:', () => {
  const html = renderSitio(negocio);
  assert.ok(html.includes('href="tel:+34600112233"'));
  assert.ok(html.includes('+34 600 11 22 33'), 'pero se muestra con el formato legible');
});

test('una propuesta sale marcada y sin indexar', () => {
  const html = renderSitio({ ...negocio, demo: true });
  assert.ok(html.includes('noindex'));
  assert.ok(html.includes('aviso-demo'));
  assert.ok(html.includes('No es la web oficial'));
});

test('una web ya vendida no lleva ni aviso ni noindex', () => {
  const html = renderSitio(negocio);
  assert.ok(!html.includes('noindex'));
  assert.ok(!html.includes('aviso-demo'));
});

test('los siete dias aparecen en el horario y los vacios como cerrado', () => {
  const html = renderSitio(negocio);
  for (const dia of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']) {
    assert.ok(html.includes(`data-dia="${dia}"`), `falta ${dia}`);
  }
  assert.ok(html.includes('<span class="cerrado">Cerrado</span>'));
  assert.ok(html.includes('09:00 – 14:00<br>17:00 – 20:00'), 'los tramos partidos se muestran juntos');
});

test('las secciones que faltan simplemente no se pintan', () => {
  const html = renderSitio({ nombre: 'Minimo', tipo: 'Tienda', telefono: '600111222' });
  assert.ok(!html.includes('id="galeria"'));
  assert.ok(!html.includes('id="resenas"'));
  assert.ok(!html.includes('wa.me'), 'sin whatsapp no hay boton de whatsapp');
  assert.ok(html.includes('id="horario"'), 'el horario siempre sale');
});

test('incluye datos estructurados de negocio local', () => {
  const html = renderSitio({ ...negocio, schema: 'Restaurant', ciudad: 'Getafe' });
  const json = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  const datos = JSON.parse(json);
  assert.equal(datos['@type'], 'Restaurant');
  assert.equal(datos.name, 'Bar de Prueba');
  assert.equal(datos.address.addressLocality, 'Getafe');
});
