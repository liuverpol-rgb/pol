import test from 'node:test';
import assert from 'node:assert/strict';
import { almacenMemoria } from '../extension/lib/almacen.mjs';
import {
  CLAVE,
  ErrorLicencia,
  GRACIA_DIAS,
  REVALIDAR_CADA_DIAS,
  activar,
  desactivar,
  estadoLicencia,
} from '../extension/lib/licencia.mjs';

const DIA = 24 * 60 * 60 * 1000;
const hoy = new Date('2026-09-13T10:00:00Z');
const CONFIG = { proveedor: 'lemonsqueezy', tiendaId: 111, productoId: 222 };
const CLAVE_OK = '38b1460a-5104-4067-a91d-77b872934d51';

/** fetch de mentira: devuelve lo que le digas y apunta las llamadas. */
function fetchFalso(respuestas) {
  const llamadas = [];
  const cola = Array.isArray(respuestas) ? [...respuestas] : [respuestas];
  const falso = async (url, opciones = {}) => {
    llamadas.push({ url, cuerpo: Object.fromEntries(new URLSearchParams(opciones.body ?? '')) });
    const siguiente = cola.length > 1 ? cola.shift() : cola[0];
    if (siguiente instanceof Error) throw siguiente;
    return { json: async () => siguiente };
  };
  falso.llamadas = llamadas;
  return falso;
}

const activada = (extra = {}) => ({
  activated: true,
  error: null,
  license_key: { status: 'active', key: CLAVE_OK, expires_at: null, ...extra.license_key },
  instance: { id: 'inst-1', name: 'Chrome' },
  meta: { store_id: 111, product_id: 222, ...extra.meta },
});

const valida = (extra = {}) => ({
  valid: true,
  error: null,
  license_key: { status: 'active', expires_at: null, ...extra.license_key },
  meta: { store_id: 111, product_id: 222, ...extra.meta },
});

test('activar guarda la licencia y deja el plan Pro en marcha', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso(activada());
  const guardado = await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });

  assert.equal(guardado.clave, CLAVE_OK);
  assert.equal(guardado.instancia, 'inst-1');
  assert.equal(guardado.valida, true);
  assert.match(buscar.llamadas[0].url, /\/licenses\/activate$/);
  assert.equal(buscar.llamadas[0].cuerpo.license_key, CLAVE_OK);

  const estado = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: hoy });
  assert.equal(estado.pro, true);
  assert.equal(estado.motivo, 'activa');
});

test('una clave de otra tienda o de otro producto no desbloquea nada', async () => {
  for (const meta of [{ store_id: 999 }, { product_id: 999 }]) {
    const almacen = almacenMemoria();
    await assert.rejects(
      activar(CLAVE_OK, { almacen, config: CONFIG, buscar: fetchFalso(activada({ meta })), ahora: hoy }),
      (e) => e instanceof ErrorLicencia && ['otra-tienda', 'otro-producto'].includes(e.motivo),
    );
    assert.equal(await almacen.leer(CLAVE), undefined, 'no se guarda nada si la clave no es tuya');
  }
});

test('la clave vacia ni siquiera sale a la red', async () => {
  const buscar = fetchFalso(activada());
  await assert.rejects(activar('   ', { almacen: almacenMemoria(), config: CONFIG, buscar }), {
    motivo: 'clave-vacia',
  });
  assert.equal(buscar.llamadas.length, 0);
});

test('cada estado de error de la API tiene su motivo', async () => {
  const casos = [
    [{ activated: false, error: 'license_key has expired', license_key: { status: 'expired' } }, 'caducada'],
    [{ activated: false, error: 'license_key has been disabled', license_key: { status: 'disabled' } }, 'revocada'],
    [{ activated: false, error: 'activation limit reached', license_key: { status: 'active' } }, 'limite-equipos'],
    [{ activated: false, error: 'license_key not found', license_key: null }, 'no-valida'],
  ];
  for (const [respuesta, motivo] of casos) {
    await assert.rejects(
      activar(CLAVE_OK, { almacen: almacenMemoria(), config: CONFIG, buscar: fetchFalso(respuesta), ahora: hoy }),
      (e) => e.motivo === motivo,
      `${respuesta.error} deberia dar motivo ${motivo}`,
    );
  }
});

test('sin licencia guardada el estado es gratis, y no se llama a la API', async () => {
  const buscar = fetchFalso(valida());
  const estado = await estadoLicencia(almacenMemoria(), { config: CONFIG, buscar, ahora: hoy });
  assert.deepEqual(estado, { pro: false, motivo: 'sin-licencia' });
  assert.equal(buscar.llamadas.length, 0);
});

test('no se revalida en cada apertura, solo cada siete dias', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso([activada(), valida()]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });

  await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: new Date(+hoy + 6 * DIA) });
  assert.equal(buscar.llamadas.length, 1, 'a los seis dias todavia no toca');

  const despues = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: new Date(+hoy + REVALIDAR_CADA_DIAS * DIA + 1) });
  assert.equal(buscar.llamadas.length, 2);
  assert.match(buscar.llamadas[1].url, /\/licenses\/validate$/);
  assert.equal(buscar.llamadas[1].cuerpo.instance_id, 'inst-1');
  assert.equal(despues.pro, true);
});

test('si la API dice que la clave ya no vale, se cae a gratis y se recuerda', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso([activada(), { valid: false, error: 'license_key has been disabled', license_key: { status: 'disabled' } }]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });

  const luego = new Date(+hoy + 8 * DIA);
  const estado = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: luego });
  assert.equal(estado.pro, false);
  assert.equal(estado.motivo, 'revocada');

  // Y a la siguiente apertura sigue en gratis sin volver a preguntar.
  const antes = buscar.llamadas.length;
  const otra = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: luego });
  assert.equal(otra.pro, false);
  assert.equal(buscar.llamadas.length, antes);
});

test('una licencia con fecha de caducidad pasada no vale aunque no haya red', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso([
    activada({ license_key: { expires_at: '2026-10-01T00:00:00Z' } }),
    valida({ license_key: { expires_at: '2026-10-01T00:00:00Z' } }),
  ]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });

  const antes = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: new Date('2026-09-30T00:00:00Z') });
  assert.equal(antes.pro, true);
  const despues = await estadoLicencia(almacen, { config: CONFIG, buscar, ahora: new Date('2026-10-02T00:00:00Z') });
  assert.equal(despues.pro, false);
  assert.equal(despues.motivo, 'caducada');
});

test('sin conexion la licencia aguanta el periodo de gracia y luego cae', async () => {
  const almacen = almacenMemoria();
  const caida = fetchFalso([activada(), new TypeError('Failed to fetch')]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar: caida, ahora: hoy });

  const dentro = await estadoLicencia(almacen, {
    config: CONFIG,
    buscar: caida,
    ahora: new Date(+hoy + (REVALIDAR_CADA_DIAS + GRACIA_DIAS - 1) * DIA),
  });
  assert.equal(dentro.pro, true, 'un cliente sin red no es un moroso');
  assert.equal(dentro.motivo, 'sin-conexion');

  const fuera = await estadoLicencia(almacen, {
    config: CONFIG,
    buscar: caida,
    ahora: new Date(+hoy + (REVALIDAR_CADA_DIAS + GRACIA_DIAS + 1) * DIA),
  });
  assert.equal(fuera.pro, false);
  assert.equal(fuera.motivo, 'sin-conexion-agotada');
});

test('desactivar libera el equipo y borra la clave local', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso([activada(), { deactivated: true }]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });

  const r = await desactivar(almacen, { config: CONFIG, buscar });
  assert.equal(r.liberada, true);
  assert.equal(await almacen.leer(CLAVE), undefined);
  assert.match(buscar.llamadas.at(-1).url, /\/licenses\/deactivate$/);
});

test('si la API no responde al desactivar, la clave se va igual de este equipo', async () => {
  const almacen = almacenMemoria();
  const buscar = fetchFalso([activada(), new TypeError('Failed to fetch')]);
  await activar(CLAVE_OK, { almacen, config: CONFIG, buscar, ahora: hoy });
  await desactivar(almacen, { config: CONFIG, buscar });
  assert.equal(await almacen.leer(CLAVE), undefined);
});

test('el proveedor "propio" (Stripe con tu endpoint) usa la misma interfaz', async () => {
  const config = { proveedor: 'propio', endpoint: 'https://licencias.ejemplo.com/validar' };
  const almacen = almacenMemoria();
  const buscar = fetchFalso([{ valida: true, expira: null }, { valida: false, mensaje: 'reembolsada' }]);

  await activar('STRIPE-123', { almacen, config, buscar, ahora: hoy });
  assert.match(buscar.llamadas[0].url, /\?clave=STRIPE-123$/);
  assert.equal((await estadoLicencia(almacen, { config, buscar, ahora: hoy })).pro, true);

  const luego = await estadoLicencia(almacen, { config, buscar, ahora: new Date(+hoy + 8 * DIA) });
  assert.equal(luego.pro, false);
  assert.equal(luego.motivo, 'no-valida');
});
