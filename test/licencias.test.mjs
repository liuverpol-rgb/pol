import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { firmaValida, generarClave } from '../extension/licencias/worker.mjs';
import { almacenMemoria } from '../extension/lib/almacen.mjs';
import { activar, estadoLicencia } from '../extension/lib/licencia.mjs';

const SECRETO = 'whsec_de_mentira_para_las_pruebas';
const DIA = 24 * 60 * 60 * 1000;

/** KV de Cloudflare de mentira. */
function kvFalso(inicial = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    async get(clave, tipo) {
      const v = datos.get(clave);
      if (v === undefined) return null;
      return tipo === 'json' ? JSON.parse(v) : v;
    },
    async put(clave, valor) {
      datos.set(clave, String(valor));
    },
    async delete(clave) {
      datos.delete(clave);
    },
    claves: () => [...datos.keys()],
  };
}

const entorno = () => ({ LICENCIAS: kvFalso(), STRIPE_WEBHOOK_SECRET: SECRETO });

/** Firma un cuerpo como lo haria Stripe. */
async function firmar(cuerpo, secreto = SECRETO, t = Math.floor(Date.now() / 1000)) {
  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${t}.${cuerpo}`));
  const hex = [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${t},v1=${hex}`;
}

const evento = (tipo, objeto) => JSON.stringify({ id: 'evt_1', type: tipo, data: { object: objeto } });

const COMPRA = {
  id: 'cs_test_a1b2c3',
  payment_status: 'paid',
  payment_intent: 'pi_test_9',
  customer_details: { email: 'cliente@ejemplo.com' },
};

/** Manda un evento firmado al Worker. */
async function avisar(env, cuerpo, { firma, ...resto } = {}) {
  return worker.fetch(
    new Request('https://licencias.ejemplo.workers.dev/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': firma ?? (await firmar(cuerpo)) },
      body: cuerpo,
      ...resto,
    }),
    env,
  );
}

const pedir = (env, ruta) => worker.fetch(new Request(`https://licencias.ejemplo.workers.dev${ruta}`), env);

test('la clave sale legible y sin caracteres que se confundan al dictarla', () => {
  const clave = generarClave();
  assert.match(clave, /^MRA-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.ok(!/[O0I1]/.test(clave.slice(4)), `${clave} no deberia llevar O, 0, I ni 1`);
  assert.notEqual(generarClave(), generarClave());
});

test('la firma de Stripe se comprueba de verdad', async () => {
  const cuerpo = evento('checkout.session.completed', COMPRA);
  assert.equal(await firmaValida(await firmar(cuerpo), cuerpo, SECRETO), true);
  assert.equal(await firmaValida(await firmar(cuerpo), `${cuerpo} `, SECRETO), false, 'cuerpo alterado');
  assert.equal(await firmaValida(await firmar(cuerpo, 'otro_secreto'), cuerpo, SECRETO), false, 'otro secreto');
  assert.equal(await firmaValida(null, cuerpo, SECRETO), false);
  assert.equal(await firmaValida('no-es-una-firma', cuerpo, SECRETO), false);
  assert.equal(await firmaValida(await firmar(cuerpo, SECRETO, 1000), cuerpo, SECRETO), false, 'firma caducada');
});

test('sin firma valida no se fabrica ninguna licencia', async () => {
  const env = entorno();
  const cuerpo = evento('checkout.session.completed', COMPRA);
  const r = await avisar(env, cuerpo, { firma: 't=1,v1=00' });
  assert.equal(r.status, 400);
  assert.deepEqual(env.LICENCIAS.claves(), [], 'el KV se queda vacio');
});

test('una compra genera la clave, y la extension la da por buena', async () => {
  const env = entorno();
  assert.equal((await avisar(env, evento('checkout.session.completed', COMPRA))).status, 200);

  const porSesion = await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json();
  assert.match(porSesion.clave, /^MRA-/);

  const validacion = await (await pedir(env, `/validar?clave=${porSesion.clave}`)).json();
  assert.deepEqual(validacion, { valida: true, expira: null });
});

test('Stripe reintenta el mismo evento y no se duplica la clave', async () => {
  const env = entorno();
  const cuerpo = evento('checkout.session.completed', COMPRA);
  await avisar(env, cuerpo);
  const primera = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;
  await avisar(env, cuerpo);
  const segunda = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;

  assert.equal(primera, segunda);
  assert.equal(env.LICENCIAS.claves().filter((k) => k.startsWith('clave:')).length, 1);
});

test('un pago aplazado no da clave hasta que entra el dinero', async () => {
  const env = entorno();
  const pendiente = { ...COMPRA, payment_status: 'unpaid' };
  await avisar(env, evento('checkout.session.completed', pendiente));
  const enEspera = await pedir(env, `/clave?session_id=${COMPRA.id}`);
  assert.equal(enEspera.status, 202);
  assert.equal((await enEspera.json()).clave, null);

  await avisar(env, evento('checkout.session.async_payment_succeeded', { ...COMPRA, payment_status: 'paid' }));
  assert.match((await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave, /^MRA-/);
});

test('devolucion y disputa dejan la clave sin valor', async () => {
  for (const [tipo, estado] of [
    ['charge.refunded', 'reembolsada'],
    ['charge.dispute.created', 'disputada'],
  ]) {
    const env = entorno();
    await avisar(env, evento('checkout.session.completed', COMPRA));
    const clave = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;

    await avisar(env, evento(tipo, { payment_intent: COMPRA.payment_intent }));
    const r = await (await pedir(env, `/validar?clave=${clave}`)).json();
    assert.equal(r.valida, false, `${tipo} deberia invalidarla`);
    assert.equal((await env.LICENCIAS.get(`clave:${clave}`, 'json')).estado, estado);
  }
});

test('una clave inventada no vale, y las mayusculas dan igual', async () => {
  const env = entorno();
  await avisar(env, evento('checkout.session.completed', COMPRA));
  const clave = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;

  assert.equal((await (await pedir(env, '/validar?clave=MRA-AAAA-BBBB-CCCC')).json()).valida, false);
  assert.equal((await (await pedir(env, '/validar?clave=')).json()).valida, false);
  assert.equal((await (await pedir(env, `/validar?clave=${clave.toLowerCase()}`)).json()).valida, true);
});

test('la respuesta de /validar no filtra el correo del comprador', async () => {
  const env = entorno();
  await avisar(env, evento('checkout.session.completed', COMPRA));
  const clave = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;
  const texto = await (await pedir(env, `/validar?clave=${clave}`)).text();
  assert.ok(!texto.includes('cliente@ejemplo.com'), texto);
});

test('la extension puede llamar desde su origen opaco', async () => {
  const env = entorno();
  const r = await pedir(env, '/validar?clave=X');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(r.headers.get('Cache-Control'), 'no-store');

  const previa = await worker.fetch(
    new Request('https://licencias.ejemplo.workers.dev/validar', { method: 'OPTIONS' }),
    env,
  );
  assert.equal(previa.status, 204);
});

test('la pagina de exito se sirve y busca la clave sola', async () => {
  const r = await pedir(entorno(), '/exito?session_id=cs_test_a1b2c3');
  assert.equal(r.status, 200);
  const html = await r.text();
  assert.match(r.headers.get('Content-Type'), /text\/html/);
  assert.ok(html.includes('/clave?session_id='), 'la pagina consulta su propia clave');
  assert.ok(html.includes('Ya tengo una clave de Pro'), 'explica donde se pega');
});

test('lo que no es una ruta conocida no contesta nada', async () => {
  assert.equal((await pedir(entorno(), '/')).status, 404);
  assert.equal((await pedir(entorno(), '/stripe')).status, 404, 'el webhook solo acepta POST');
});

test('de punta a punta: comprar, activar en la extension y que un reembolso lo tire', async () => {
  const env = entorno();
  const config = { proveedor: 'propio', endpoint: 'https://licencias.ejemplo.workers.dev/validar' };
  // El "fetch" de la extension habla directamente con el Worker, sin red.
  const buscar = (url, opciones = {}) => worker.fetch(new Request(url, opciones), env);

  await avisar(env, evento('checkout.session.completed', COMPRA));
  const clave = (await (await pedir(env, `/clave?session_id=${COMPRA.id}`)).json()).clave;

  const almacen = almacenMemoria();
  const compra = new Date('2026-09-13T10:00:00Z');
  await activar(clave, { almacen, config, buscar, ahora: compra });
  assert.equal((await estadoLicencia(almacen, { config, buscar, ahora: compra })).pro, true);

  // A los seis dias todavia no se revalida: sigue Pro aunque el Worker caiga.
  const sinRed = () => {
    throw new TypeError('Failed to fetch');
  };
  assert.equal((await estadoLicencia(almacen, { config, buscar: sinRed, ahora: new Date(+compra + 6 * DIA) })).pro, true);

  // Le devuelven el dinero. En la siguiente revalidacion se cae a gratis.
  await avisar(env, evento('charge.refunded', { payment_intent: COMPRA.payment_intent }));
  const despues = await estadoLicencia(almacen, { config, buscar, ahora: new Date(+compra + 8 * DIA) });
  assert.equal(despues.pro, false);
  assert.equal(despues.motivo, 'no-valida');
});

test('una clave de otro cliente no sirve para activar', async () => {
  const env = entorno();
  const config = { proveedor: 'propio', endpoint: 'https://licencias.ejemplo.workers.dev/validar' };
  const buscar = (url, opciones = {}) => worker.fetch(new Request(url, opciones), env);
  await assert.rejects(activar('MRA-ZZZZ-ZZZZ-ZZZZ', { almacen: almacenMemoria(), config, buscar }), {
    motivo: 'no-valida',
  });
});
