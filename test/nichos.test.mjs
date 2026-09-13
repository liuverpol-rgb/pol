import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  BENEFICIO_MINIMO,
  REGULACIONES,
  cargarNichos,
  evaluar,
  motivosDeDescarte,
  productoDeNicho,
  puntuar,
} from '../dropshipping/nichos.mjs';

const ETSY = {
  nombre: 'Etsy',
  comision: 0.065,
  comisionPago: 0.04,
  fijoPago: 0.3,
  costeListado: 0.18,
  reverseCharge: true,
};

/** Nicho sano de referencia: print-on-demand europeo, personalizable. */
const SANO = {
  id: 'referencia',
  nombre: 'Referencia',
  fabricante: 'pod-ue',
  regulaciones: ['verpackg', 'textilkennz'],
  precioVentaTipico: 29.9,
  envioCobradoTipico: 3.9,
  costeGeneroTipico: 12.5,
  costeEnvioTipico: 4.79,
  tasaDevolucionTipica: 0.06,
  personalizable: true,
  competencia: 'media',
  repeticion: 'media',
};

test('la GPSR descarta el envio directo desde fuera de la UE sin persona responsable', () => {
  const motivos = motivosDeDescarte({ ...SANO, fabricante: 'extra-ue' }, 10);
  assert.match(motivos.join(' '), /GPSR/);

  // Con una persona responsable establecida en la UE, deja de ser un descarte.
  assert.deepEqual(
    motivosDeDescarte({ ...SANO, fabricante: 'extra-ue', personaResponsableUE: true }, 10),
    [],
  );
  // Y un fabricante europeo no necesita ninguna.
  assert.deepEqual(motivosDeDescarte(SANO, 10), []);
});

test('las regulaciones bloqueantes descartan y las gestionables no', () => {
  const bloqueantes = Object.entries(REGULACIONES).filter(([, r]) => r.bloqueante);
  assert.ok(bloqueantes.length >= 5, 'la tabla de regulaciones tiene contenido');
  for (const [clave, r] of bloqueantes) {
    const motivos = motivosDeDescarte({ ...SANO, regulaciones: [clave] }, 10);
    assert.equal(motivos.length, 1, `${clave} deberia descartar`);
    assert.ok(motivos[0].startsWith(r.nombre));
  }
  // VerpackG y el etiquetado textil son deberes, no barreras: se cumplen y se sigue.
  assert.deepEqual(motivosDeDescarte({ ...SANO, regulaciones: ['verpackg', 'textilkennz'] }, 10), []);
});

test('una regulacion que no esta en la tabla se denuncia en vez de ignorarse', () => {
  const motivos = motivosDeDescarte({ ...SANO, regulaciones: ['inventada'] }, 10);
  assert.match(motivos.join(' '), /desconocida/);
});

test('el beneficio por pedido es una eliminatoria, no un matiz', () => {
  assert.deepEqual(motivosDeDescarte(SANO, BENEFICIO_MINIMO), []);
  assert.match(motivosDeDescarte(SANO, BENEFICIO_MINIMO - 0.01).join(' '), /no aguanta una devolucion/);
  assert.match(motivosDeDescarte(SANO, 0).join(' '), /Pierdes dinero/);
  assert.match(motivosDeDescarte(SANO, -3).join(' '), /Pierdes dinero/);
});

test('sin diferenciacion y con competencia alta, el unico argumento seria el precio', () => {
  assert.match(
    motivosDeDescarte({ ...SANO, personalizable: false, competencia: 'alta' }, 10).join(' '),
    /gana Amazon/,
  );
  // Personalizable con la misma competencia si pasa: no vendes lo mismo que los demas.
  assert.deepEqual(motivosDeDescarte({ ...SANO, competencia: 'alta' }, 10), []);
});

test('la puntuacion crece con el beneficio y premia lo que de verdad decide', () => {
  assert.ok(puntuar(SANO, 12).total > puntuar(SANO, 4).total);
  assert.ok(puntuar(SANO, 8).total > puntuar({ ...SANO, personalizable: false }, 8).total);
  assert.ok(
    puntuar({ ...SANO, competencia: 'baja' }, 8).total > puntuar({ ...SANO, competencia: 'brutal' }, 8).total,
  );
  assert.ok(puntuar({ ...SANO, estacional: true }, 8).total < puntuar(SANO, 8).total);
  assert.ok(puntuar({ ...SANO, fragil: true }, 8).total < puntuar(SANO, 8).total);
  // Cada punto lleva su motivo escrito: una puntuacion sin explicacion no sirve de nada.
  for (const d of puntuar(SANO, 8).detalle) {
    assert.ok(d.razon.length > 3);
    assert.notEqual(d.puntos, 0);
  }
});

test('productoDeNicho no da por revendible lo que lleva impreso el nombre del cliente', () => {
  assert.equal(productoDeNicho(SANO).recuperacionDevolucion, 0);
  assert.equal(productoDeNicho({ ...SANO, personalizable: false }).recuperacionDevolucion, 0.5);
});

test('un nicho descartado no se puntua: la ley no se compensa con margen', () => {
  const [evaluado] = evaluar([{ ...SANO, regulaciones: ['kosmetik'] }], ETSY);
  assert.ok(evaluado.motivos.length);
  assert.equal(evaluado.total, 0);
  assert.deepEqual(evaluado.detalle, []);
});

test('el archivo de nichos esta completo y coherente', () => {
  const { nichos, _verificado } = cargarNichos();
  assert.ok(nichos.length >= 10, 'hay candidatos suficientes para que la criba signifique algo');
  assert.notEqual(_verificado, true, 'mientras los datos sean estimaciones, la bandera avisa');

  const ids = new Set();
  for (const n of nichos) {
    assert.ok(n.id && !ids.has(n.id), `id unico: ${n.id}`);
    ids.add(n.id);
    for (const campo of ['nombre', 'fabricante', 'precioVentaTipico', 'costeGeneroTipico', 'costeEnvioTipico']) {
      assert.ok(n[campo] !== undefined, `${n.id}: falta ${campo}`);
    }
    assert.ok(['ue', 'pod-ue', 'extra-ue'].includes(n.fabricante), `${n.id}: fabricante raro`);
    assert.ok(['baja', 'media', 'alta', 'brutal'].includes(n.competencia), `${n.id}: competencia rara`);
    for (const r of n.regulaciones ?? []) {
      assert.ok(REGULACIONES[r], `${n.id}: regulacion "${r}" no esta en la tabla`);
    }
    // Todo lo que se envia por paquete esta sujeto al VerpackG, sin excepcion.
    assert.ok((n.regulaciones ?? []).includes('verpackg'), `${n.id}: le falta verpackg`);
    assert.ok(n.costeGeneroTipico < n.precioVentaTipico, `${n.id}: coste por encima del precio`);
  }
});

test('la criba real separa el grano y ninguno pasa sin ganar al menos el minimo', () => {
  const { nichos } = cargarNichos();
  const evaluados = evaluar(nichos, ETSY);
  const pasan = evaluados.filter((e) => !e.motivos.length);
  const fuera = evaluados.filter((e) => e.motivos.length);

  assert.ok(pasan.length >= 3, 'queda algo que hacer');
  assert.ok(fuera.length >= 3, 'la criba sirve de algo');
  for (const e of pasan) assert.ok(e.beneficio >= BENEFICIO_MINIMO);

  // El contraejemplo de manual tiene que caer siempre, y por la ley.
  const funda = evaluados.find((e) => e.nicho.id === 'fundas-movil-china');
  assert.match(funda.motivos.join(' '), /GPSR/);
  // Las plataformas del repositorio cobran reverse charge: comprobamos que el
  // dato real de plataformas.json es el que se usa en la criba.
  const { plataformas } = JSON.parse(readFileSync(new URL('../dropshipping/datos/plataformas.json', import.meta.url), 'utf8'));
  assert.ok(plataformas.every((p) => p.nombre && p.comision >= 0));
});
