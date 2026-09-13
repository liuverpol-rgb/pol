import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { cargarCriterios, cargarOferta, cargarNegocios, puntuar, pendientes } from '../fichas-google/auditar.mjs';
import { renderHoja, veredicto } from '../fichas-google/plantilla/render.mjs';
import { renderTarjeta } from '../fichas-google/qr-resena.mjs';
import { fichaEnBlanco } from '../fichas-google/nueva-auditoria.mjs';

const DATOS = cargarCriterios();
const OFERTA = cargarOferta();

/** Ficha de referencia: todo mirado, la mitad bien. */
function negocio(criterios) {
  return { nombre: 'Testbetrieb', ciudad: 'Reinbek', comprobado: '2026-09-13', criterios };
}

const TODO_BIEN = Object.fromEntries(DATOS.criterios.map((c) => [c.id, true]));
const TODO_MAL = Object.fromEntries(DATOS.criterios.map((c) => [c.id, false]));

test('los pesos suman 100, que es lo que hace legible la nota', () => {
  assert.equal(DATOS.criterios.reduce((t, c) => t + c.peso, 0), 100);
});

test('cada criterio dice donde se mira, que le cuesta al negocio y como se arregla', () => {
  for (const c of DATOS.criterios) {
    assert.ok(c.mira?.length > 10, `${c.id} no dice donde se mira`);
    assert.ok(c.efecto?.length > 10, `${c.id} no dice que le cuesta al negocio`);
    assert.ok(c.arreglo?.length > 10, `${c.id} no dice como se arregla`);
    assert.ok(Number.isFinite(c.minutos), `${c.id} no dice cuanto tiempo cuesta`);
    assert.ok(DATOS.grupos[c.grupo], `${c.id} esta en un grupo que no existe`);
  }
});

test('los ids no se repiten', () => {
  const ids = DATOS.criterios.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('ficha perfecta da 100 y ficha vacia da 0', () => {
  assert.equal(puntuar(negocio(TODO_BIEN), DATOS).nota, 100);
  assert.equal(puntuar(negocio(TODO_MAL), DATOS).nota, 0);
});

test('un criterio sin comprobar no cuenta como fallo: sale aparte y no baja la nota', () => {
  const sinMirar = { ...TODO_BIEN };
  delete sinMirar.fotos_cantidad;
  const r = puntuar(negocio(sinMirar), DATOS);

  assert.equal(r.nota, 100, 'lo no comprobado no puede contar como cero');
  assert.equal(r.sinComprobar.length, 1);
  assert.equal(r.completa, false);
  assert.equal(r.posibles, 100 - 8);
});

test('null y ausente son lo mismo: sin comprobar', () => {
  const conNull = puntuar(negocio({ ...TODO_BIEN, fotos_cantidad: null }), DATOS);
  const sinClave = { ...TODO_BIEN };
  delete sinClave.fotos_cantidad;
  assert.deepEqual(conNull.sinComprobar.map((c) => c.id), puntuar(negocio(sinClave), DATOS).sinComprobar.map((c) => c.id));
});

test('sin nada comprobado no hay nota, y no es cero', () => {
  const r = puntuar(negocio({}), DATOS);
  assert.equal(r.nota, null);
  assert.equal(r.posibles, 0);
  assert.equal(pendientes(r).length, DATOS.criterios.length);
});

test('el perfil no reclamado bloquea, por alta que sea la nota', () => {
  const casi = { ...TODO_BIEN, reclamado: false };
  const r = puntuar(negocio(casi), DATOS);
  assert.equal(r.bloqueado, true);
  assert.equal(r.nota, 88, 'reclamado vale 12 puntos');
});

test('lo que falta sale ordenado por peso, que es el orden en que se arregla', () => {
  const r = puntuar(negocio(TODO_MAL), DATOS);
  const pesos = r.faltan.map((c) => c.peso);
  assert.deepEqual(pesos, [...pesos].sort((a, b) => b - a));
  assert.equal(r.minutos, DATOS.criterios.reduce((t, c) => t + c.minutos, 0));
});

test('la hoja del cliente no promete posiciones ni inventa porcentajes', () => {
  const r = puntuar(negocio(TODO_MAL), DATOS);
  const html = renderHoja({ negocio: negocio(TODO_MAL), resultado: r, oferta: OFERTA });
  // Sin el CSS, que si lleva porcentajes y no es texto que lea el cliente.
  const texto = html.replace(/<style>[\s\S]*?<\/style>/, '');

  assert.ok(!/\d+\s?%/.test(texto), 'no puede haber cifras de rendimiento inventadas');
  assert.ok(!/garanti|Garantie|Platz 1|erste Seite/i.test(texto), 'no se promete posicion');
  assert.match(html, /Ich gehöre nicht zu Google/, 'tiene que desmarcarse de Google');
  assert.match(html, /noindex/, 'la hoja lleva el nombre de un negocio real: no se indexa');
});

test('la hoja dice cuales no ha mirado, en vez de callarselo', () => {
  const parcial = { reclamado: true, kategoria_principal: false };
  const r = puntuar(negocio(parcial), DATOS);
  const html = renderHoja({ negocio: negocio(parcial), resultado: r, oferta: OFERTA });

  assert.match(html, /Noch nicht geprüft/);
  assert.match(html, /Das sehe ich von außen nicht/);
});

test('el aviso de perfil sin reclamar solo sale cuando lo esta', () => {
  const conAviso = renderHoja({ negocio: negocio(TODO_MAL), resultado: puntuar(negocio(TODO_MAL), DATOS), oferta: OFERTA });
  const sinAviso = renderHoja({ negocio: negocio(TODO_BIEN), resultado: puntuar(negocio(TODO_BIEN), DATOS), oferta: OFERTA });
  assert.match(conAviso, /Ihr Profil ist nicht bestätigt/);
  assert.ok(!/Ihr Profil ist nicht bestätigt/.test(sinAviso));
});

test('el precio de la hoja sale del JSON, no del codigo', () => {
  const r = puntuar(negocio(TODO_MAL), DATOS);
  const otra = { ...OFERTA, paquetes: [{ ...OFERTA.paquetes[0], precio: 999 }] };
  const html = renderHoja({ negocio: negocio(TODO_MAL), resultado: r, oferta: otra });
  assert.match(html, /999 €/);
});

test('la rebaja de palabra no aparece en la hoja del cliente', () => {
  const r = puntuar(negocio(TODO_MAL), DATOS);
  const html = renderHoja({ negocio: negocio(TODO_MAL), resultado: r, oferta: OFERTA });
  assert.ok(!html.includes(`${OFERTA.alternativa.precio} €`), 'si la ve antes de tiempo, nadie paga el precio entero');
});

test('el nombre del negocio se escapa: hay clientes con & en el nombre', () => {
  const raro = { ...negocio(TODO_BIEN), nombre: 'Wertz & Rehfeldt <script>' };
  const html = renderHoja({ negocio: raro, resultado: puntuar(raro, DATOS), oferta: OFERTA });
  assert.ok(!html.includes('<script>'));
  assert.match(html, /Wertz &amp; Rehfeldt/);
});

test('el veredicto cambia de tono con la nota, sin insultar al duenno', () => {
  assert.equal(veredicto(null).clase, 'media');
  assert.equal(veredicto(90).clase, 'alta');
  assert.equal(veredicto(70).clase, 'media');
  assert.equal(veredicto(10).clase, 'baja');
});

test('la ficha en blanco trae los 19 criterios sin comprobar', () => {
  const f = fichaEnBlanco({ id: 'x', name: 'Betrieb X', ort: 'Reinbek', telefon: '+49 40 1', branche: 'friseur' });
  assert.equal(Object.keys(f.criterios).length, DATOS.criterios.length);
  assert.ok(Object.values(f.criterios).every((v) => v === null));
  assert.equal(f.comprobado, null);
  assert.equal(puntuar(f, DATOS).nota, null);
});

test('los negocios reales del repo siguen sin comprobar: no se inventa su estado', () => {
  for (const [id, n] of cargarNegocios()) {
    if (n.demo) continue;
    assert.equal(n.comprobado, null, `${id} dice estar comprobado sin estarlo`);
    assert.ok(
      Object.values(n.criterios).every((v) => v === null),
      `${id} tiene criterios rellenos. Solo los rellena quien haya mirado la ficha de verdad.`,
    );
  }
});

test('la ficha de ejemplo se ve como inventada', () => {
  const ejemplo = cargarNegocios().find(([id]) => id === 'ejemplo-salon-muster');
  assert.ok(ejemplo, 'hace falta un ejemplo para ver la hoja antes de auditar a nadie');
  assert.equal(ejemplo[1].demo, true);
});

test('la tarjeta de resenas lleva el QR dentro, sin llamar a ningun servicio', () => {
  const html = renderTarjeta({ nombre: 'Testbetrieb', url: 'https://g.page/r/CdTEST/review' });
  assert.match(html, /<svg/);
  assert.ok(!/<img|https?:\/\/(?!g\.page)/.test(html.replace(/<svg[\s\S]*?<\/svg>/, '')), 'nada externo');
  assert.match(html, /Testbetrieb/);
});

test('todos los JSON del modulo son validos', () => {
  for (const dir of ['datos', 'negocios']) {
    for (const f of readdirSync(new URL(`../fichas-google/${dir}/`, import.meta.url))) {
      if (!f.endsWith('.json')) continue;
      JSON.parse(readFileSync(new URL(`../fichas-google/${dir}/${f}`, import.meta.url), 'utf8'));
    }
  }
});
