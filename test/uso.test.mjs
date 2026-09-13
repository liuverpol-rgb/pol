import test from 'node:test';
import assert from 'node:assert/strict';
import { almacenMemoria } from '../extension/lib/almacen.mjs';
import {
  CLAVE,
  LIMITE_GRATIS,
  consumirUso,
  leerUso,
  periodoDe,
  proximoReinicio,
  reiniciarUso,
} from '../extension/lib/uso.mjs';

const enero = new Date(2026, 0, 15, 12, 0, 0);
const febrero = new Date(2026, 1, 2, 9, 0, 0);

test('el periodo es el mes natural del usuario', () => {
  assert.equal(periodoDe(enero), '2026-01');
  assert.equal(periodoDe(new Date(2026, 8, 30, 23, 59)), '2026-09');
  assert.equal(periodoDe(new Date(2026, 11, 1)), '2026-12');
});

test('el reinicio cae el dia 1 del mes siguiente', () => {
  const r = proximoReinicio(new Date(2026, 11, 20));
  assert.equal(r.getFullYear(), 2027);
  assert.equal(r.getMonth(), 0);
  assert.equal(r.getDate(), 1);
});

test('caben cinco analisis gratis y el sexto se corta', async () => {
  const almacen = almacenMemoria();
  for (let i = 1; i <= LIMITE_GRATIS; i++) {
    const r = await consumirUso(almacen, { ahora: enero, producto: `ASIN${i}` });
    assert.ok(r.permitido, `el uso ${i} deberia estar permitido`);
    assert.equal(r.usos, i);
    assert.equal(r.restantes, LIMITE_GRATIS - i);
  }
  const sexto = await consumirUso(almacen, { ahora: enero, producto: 'ASIN6' });
  assert.equal(sexto.permitido, false);
  assert.equal(sexto.agotado, true);
  assert.equal(sexto.usos, LIMITE_GRATIS, 'un intento denegado no incrementa el contador');
});

test('el mismo producto no gasta cuota dos veces en el mismo mes', async () => {
  const almacen = almacenMemoria();
  const a = await consumirUso(almacen, { ahora: enero, producto: 'B08N5WRWNW' });
  const b = await consumirUso(almacen, { ahora: enero, producto: 'B08N5WRWNW' });
  assert.equal(a.usos, 1);
  assert.equal(b.usos, 1);
  assert.equal(b.yaContado, true);
  assert.equal(b.permitido, true);
  // Pero en el mes siguiente vuelve a contar: es un analisis nuevo.
  const c = await consumirUso(almacen, { ahora: febrero, producto: 'B08N5WRWNW' });
  assert.equal(c.usos, 1);
  assert.equal(c.periodo, '2026-02');
});

test('sin identificador de producto cada consumo cuenta', async () => {
  const almacen = almacenMemoria();
  await consumirUso(almacen, { ahora: enero });
  const r = await consumirUso(almacen, { ahora: enero });
  assert.equal(r.usos, 2);
});

test('el mes nuevo devuelve los cinco', async () => {
  const almacen = almacenMemoria();
  for (let i = 0; i < LIMITE_GRATIS; i++) await consumirUso(almacen, { ahora: enero, producto: `A${i}` });
  assert.equal((await leerUso(almacen, { ahora: enero })).restantes, 0);
  const enFebrero = await leerUso(almacen, { ahora: febrero });
  assert.equal(enFebrero.restantes, LIMITE_GRATIS);
  assert.equal(enFebrero.periodo, '2026-02');
});

test('atrasar el reloj no regala cuota', async () => {
  const almacen = almacenMemoria();
  for (let i = 0; i < LIMITE_GRATIS; i++) await consumirUso(almacen, { ahora: febrero, producto: `A${i}` });
  // El usuario pone el reloj en enero para estrenar mes.
  const truco = await consumirUso(almacen, { ahora: enero, producto: 'NUEVO' });
  assert.equal(truco.permitido, false);
  assert.equal(truco.periodo, '2026-02', 'sigue contando el periodo guardado');
});

test('con licencia Pro ni cuenta ni escribe', async () => {
  const almacen = almacenMemoria();
  for (let i = 0; i < 20; i++) {
    const r = await consumirUso(almacen, { ahora: enero, producto: `A${i}`, pro: true });
    assert.equal(r.permitido, true);
    assert.equal(r.ilimitado, true);
  }
  assert.equal(await almacen.leer(CLAVE), undefined, 'el plan de pago no toca el contador');
});

test('los consumos simultaneos no se pisan', async () => {
  const almacen = almacenMemoria();
  const intentos = await Promise.all(
    Array.from({ length: 12 }, (_, i) => consumirUso(almacen, { ahora: enero, producto: `A${i}` })),
  );
  assert.equal(intentos.filter((r) => r.permitido).length, LIMITE_GRATIS);
  assert.equal((await leerUso(almacen, { ahora: enero })).usos, LIMITE_GRATIS);
});

test('un valor corrupto en el almacen no abre la barra libre', async () => {
  for (const basura of [{ usos: -40 }, { periodo: 42, usos: 'cero' }, 'texto suelto', null, { usos: 3 }]) {
    const almacen = almacenMemoria({ [CLAVE]: basura });
    const r = await leerUso(almacen, { ahora: enero });
    assert.equal(r.usos, 0);
    assert.equal(r.restantes, LIMITE_GRATIS);
    assert.equal(r.periodo, '2026-01');
  }
});

test('el limite es configurable sin tocar el modulo', async () => {
  const almacen = almacenMemoria();
  await consumirUso(almacen, { ahora: enero, producto: 'A', limite: 1 });
  const segundo = await consumirUso(almacen, { ahora: enero, producto: 'B', limite: 1 });
  assert.equal(segundo.permitido, false);
});

test('reiniciarUso deja el contador a cero', async () => {
  const almacen = almacenMemoria();
  await consumirUso(almacen, { ahora: enero, producto: 'A' });
  await reiniciarUso(almacen);
  assert.equal((await leerUso(almacen, { ahora: enero })).usos, 0);
});
