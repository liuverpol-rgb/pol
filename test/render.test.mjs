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

test('el idioma aleman traduce toda la interfaz', () => {
  const html = renderSitio({ ...negocio, idioma: 'de' });
  assert.ok(html.includes('<html lang="de">'));
  assert.ok(html.includes('Öffnungszeiten'));
  assert.ok(html.includes('>Anrufen<'));
  assert.ok(html.includes('Geschlossen'), 'los dias sin horario en aleman');
  assert.ok(html.includes('<th>Montag</th>') && html.includes('<th>Sonntag</th>'));
  assert.ok(html.includes('Jetzt geöffnet') && html.includes('Zurzeit geschlossen'));
  assert.ok(!html.includes('Öffnungszeiten</h2>\n    <h2>Horario'), 'sin mezcla de idiomas');
});

test('el aviso de propuesta se traduce al aleman', () => {
  const html = renderSitio({ ...negocio, idioma: 'de', demo: true, propuesta_de: 'Ana' });
  assert.ok(html.includes('Website-Vorschlag für Bar de Prueba'));
  assert.ok(html.includes('nicht die offizielle Website'));
  assert.ok(html.includes('Erstellt von Ana.'));
  assert.ok(html.includes('noindex'));
});

test('los dias del horario se aceptan en aleman o en espanol', () => {
  const enAleman = renderSitio({
    ...negocio,
    idioma: 'de',
    horario: { montag: [], dienstag: [['09:00', '14:00']], sonntag: [['10:00', '12:00']] },
  });
  assert.ok(enAleman.includes('data-dia="martes"'), 'dienstag se normaliza a martes');
  assert.ok(enAleman.includes('09:00 – 14:00'));
  assert.ok(enAleman.includes('10:00 – 12:00'), 'sonntag tambien');
  // Y la version espanola sigue funcionando igual.
  assert.ok(renderSitio(negocio).includes('09:00 – 14:00'));
});

test('un idioma desconocido no rompe: cae en espanol', () => {
  const html = renderSitio({ ...negocio, idioma: 'zz' });
  assert.ok(html.includes('<html lang="es">'));
  assert.ok(html.includes('Horario'));
});

test('la ciudad no se repite cuando ya viene en la direccion', () => {
  const conCp = renderSitio({
    ...negocio, ciudad: 'Reinbek', direccion: 'Borsigstraße 17 B, 21465 Reinbek',
  });
  assert.ok(!conCp.includes('21465 Reinbek<br>Reinbek'));
  assert.ok(!conCp.includes('21465 Reinbek, Reinbek'));

  // Pero si la direccion no la lleva, la ciudad si se muestra.
  const sinCiudad = renderSitio({ ...negocio, ciudad: 'Glinde', direccion: 'Am Alten Lokschuppen 13' });
  assert.ok(sinCiudad.includes('Am Alten Lokschuppen 13<br>Glinde'));
});

test('la barra de urgencias y el bloque de empleo solo salen si se configuran', () => {
  const basico = renderSitio(negocio);
  assert.ok(!basico.includes('class="notdienst"'));
  assert.ok(!basico.includes('id="jobs"'));

  const completo = renderSitio({
    ...negocio,
    idioma: 'de',
    notdienst: { texto: 'Rohrbruch?', telefono: '+49 40 111' },
    jobs: { puestos: [{ titulo: 'Monteur (m/w/d)', tipo: 'Vollzeit' }] },
  });
  assert.ok(completo.includes('Notdienst'));
  assert.ok(completo.includes('href="tel:+4940111"'));
  assert.ok(completo.includes('Wir stellen ein'), 'titulo por defecto en aleman');
  assert.ok(completo.includes('Monteur (m/w/d)'));
});

test('el pais de los datos estructurados sigue al idioma', () => {
  const leer = (html) => JSON.parse(html.match(/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(leer(renderSitio({ ...negocio, idioma: 'de' })).address.addressCountry, 'DE');
  assert.equal(leer(renderSitio(negocio)).address.addressCountry, 'ES');
  assert.equal(leer(renderSitio({ ...negocio, pais: 'AT' })).address.addressCountry, 'AT');
});
