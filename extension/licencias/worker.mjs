/**
 * Servidor de licencias para cobrar con Stripe. Un Worker de Cloudflare.
 *
 * Stripe no tiene API de licencias: cobra y avisa, pero la clave la generas
 * tu. Esto es lo minimo que hace falta, y cabe en un archivo:
 *
 *   POST /stripe        Webhook de Stripe. Verifica la firma, genera la clave
 *                       de la compra y revoca la de una devolucion.
 *   GET  /exito         Donde aterriza el comprador al pagar. Le ensena su
 *                       clave; es la unica entrega que no depende de que un
 *                       correo llegue a la bandeja de entrada.
 *   GET  /clave         El JSON que consulta esa pagina, por id de sesion.
 *   GET  /activar       Da de alta un equipo en la clave, si queda sitio.
 *   GET  /desactivar    Lo suelta, para poder usarlo en otro.
 *   GET  /validar       Lo que pregunta la extension: ¿esta clave sigue
 *                       valiendo en ESTE equipo?
 *
 * Estado, en un KV llamado LICENCIAS:
 *
 *   clave:<CLAVE>    {estado, expira, correo, sesion, creada, equipos:[]}
 *   sesion:<cs_...>  la clave de esa compra (para /exito y para no duplicar)
 *   pago:<pi_...>    la clave de ese cobro (para revocarla si se devuelve)
 *
 * Lo que NO hace, a proposito: no manda correos (Stripe ya manda el recibo y
 * la pagina de exito entrega la clave), no tiene panel y no guarda mas datos
 * personales que el correo del comprador, que llega dentro del propio evento.
 */

import { paginaExito } from './exito.mjs';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0 ni I/1: se dictan por telefono
const TOLERANCIA_MS = 5 * 60 * 1000;

/**
 * En cuantos equipos vale una clave.
 *
 * Dos, porque el portatil y el de casa son el caso normal de una persona, y
 * la oficina entera no lo es. Subirlo es cambiar este numero y desplegar.
 *
 * Ojo con lo que NO es: el identificador de equipo lo pone la extension y
 * vive en el almacenamiento local del navegador, asi que cuenta perfiles de
 * Chrome, no maquinas. Frena que una clave circule por un foro; no frena a
 * quien se ponga a borrar datos del navegador. Esa es toda la ambicion.
 */
export const LIMITE_EQUIPOS = 2;

const json = (datos, estado = 200) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // La extension llama desde un origen chrome-extension:// opaco.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });

/** Clave legible: MRA-XXXX-XXXX-XXXX. 60 bits de azar, de sobra. */
export function generarClave(azar = crypto) {
  const bytes = azar.getRandomValues(new Uint8Array(12));
  const letras = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]);
  return `MRA-${letras.slice(0, 4).join('')}-${letras.slice(4, 8).join('')}-${letras.slice(8, 12).join('')}`;
}

/** Comparacion en tiempo constante: no le regales al atacante el prefijo. */
function igualesSinFiltrar(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/**
 * Verifica la cabecera `stripe-signature`.
 *
 * Sin esto, cualquiera que sepa la URL se fabrica licencias gratis mandando
 * un JSON. Es la unica linea de este archivo que no se puede saltar.
 */
export async function firmaValida(cabecera, cuerpo, secreto, ahora = Date.now()) {
  if (!cabecera || !secreto) return false;
  const partes = Object.fromEntries(
    String(cabecera)
      .split(',')
      .map((p) => p.split('=').map((x) => x.trim()))
      .filter((p) => p.length === 2),
  );
  const t = Number(partes.t);
  if (!Number.isFinite(t) || !partes.v1) return false;
  // Una firma vieja reproducida es un ataque de repeticion.
  if (Math.abs(ahora - t * 1000) > TOLERANCIA_MS) return false;

  const clave = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(`${t}.${cuerpo}`));
  const esperada = [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return igualesSinFiltrar(esperada, partes.v1);
}

/** Alta de una compra. Idempotente: Stripe reintenta y no puede duplicar claves. */
async function altaDeCompra(env, sesion, azar) {
  const yaEsta = await env.LICENCIAS.get(`sesion:${sesion.id}`);
  if (yaEsta) return yaEsta;

  const clave = generarClave(azar);
  const registro = {
    estado: 'activa',
    expira: null, // pago unico: no caduca. Para suscripcion, la fecha del periodo
    correo: sesion.customer_details?.email ?? null,
    sesion: sesion.id,
    creada: new Date().toISOString(),
    equipos: [],
  };
  await env.LICENCIAS.put(`clave:${clave}`, JSON.stringify(registro));
  await env.LICENCIAS.put(`sesion:${sesion.id}`, clave);
  if (sesion.payment_intent) await env.LICENCIAS.put(`pago:${sesion.payment_intent}`, clave);
  return clave;
}

/** Devolucion o disputa: la clave deja de valer en la siguiente revalidacion. */
async function revocarPorPago(env, pagoId, motivo) {
  if (!pagoId) return false;
  const clave = await env.LICENCIAS.get(`pago:${pagoId}`);
  if (!clave) return false;
  const registro = await env.LICENCIAS.get(`clave:${clave}`, 'json');
  if (!registro) return false;
  await env.LICENCIAS.put(`clave:${clave}`, JSON.stringify({ ...registro, estado: motivo }));
  return true;
}

/** Lee un registro de licencia por su clave, normalizando lo que falte. */
async function leerLicencia(env, claveCruda) {
  const clave = String(claveCruda ?? '').trim().toUpperCase();
  if (!clave) return { clave: '', registro: null };
  const registro = await env.LICENCIAS.get(`clave:${clave}`, 'json');
  if (!registro) return { clave, registro: null };
  return { clave, registro: { ...registro, equipos: Array.isArray(registro.equipos) ? registro.equipos : [] } };
}

/**
 * Da de alta un equipo. Idempotente: reactivar el mismo equipo no gasta
 * plaza, que es lo que pasa cada vez que alguien reinstala la extension.
 *
 * Sin transacciones: el KV de Cloudflare no las tiene. Dos activaciones
 * exactamente simultaneas podrian colar un equipo de mas. Es un caso raro y
 * el dano maximo es un equipo extra; montar un Durable Object para evitarlo
 * cuesta mas de lo que vale.
 */
async function activarEquipo(env, clave, registro, equipo) {
  if (registro.equipos.includes(equipo)) {
    return { valida: true, expira: registro.expira ?? null, equipos: registro.equipos.length, limite: LIMITE_EQUIPOS };
  }
  if (registro.equipos.length >= LIMITE_EQUIPOS) {
    return {
      valida: false,
      motivo: 'limite-equipos',
      mensaje: `Esta clave ya esta activa en ${LIMITE_EQUIPOS} equipos. Libera uno para usarla aqui.`,
      equipos: registro.equipos.length,
      limite: LIMITE_EQUIPOS,
    };
  }
  const equipos = [...registro.equipos, equipo];
  await env.LICENCIAS.put(`clave:${clave}`, JSON.stringify({ ...registro, equipos }));
  return { valida: true, expira: registro.expira ?? null, equipos: equipos.length, limite: LIMITE_EQUIPOS };
}

export default {
  async fetch(peticion, env) {
    const url = new URL(peticion.url);

    if (peticion.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Alta de un equipo: lo que llama la extension cuando pegas la clave.
    if (url.pathname === '/activar' && peticion.method === 'GET') {
      const equipo = (url.searchParams.get('equipo') ?? '').trim();
      const { clave, registro } = await leerLicencia(env, url.searchParams.get('clave'));
      if (!registro || registro.estado !== 'activa') {
        return json({ valida: false, motivo: 'no-valida', mensaje: registro ? 'La clave ya no esta activa.' : 'Clave no encontrada.' });
      }
      if (!equipo) return json({ valida: false, motivo: 'sin-equipo', mensaje: 'Falta el identificador del equipo.' });
      return json(await activarEquipo(env, clave, registro, equipo));
    }

    // Soltar un equipo para poder usar la clave en otro.
    if (url.pathname === '/desactivar' && peticion.method === 'GET') {
      const equipo = (url.searchParams.get('equipo') ?? '').trim();
      const { clave, registro } = await leerLicencia(env, url.searchParams.get('clave'));
      if (!registro || !equipo) return json({ liberada: false });
      const equipos = registro.equipos.filter((e) => e !== equipo);
      if (equipos.length !== registro.equipos.length) {
        await env.LICENCIAS.put(`clave:${clave}`, JSON.stringify({ ...registro, equipos }));
      }
      return json({ liberada: true, equipos: equipos.length, limite: LIMITE_EQUIPOS });
    }

    // Lo que pregunta la extension cada siete dias.
    if (url.pathname === '/validar' && peticion.method === 'GET') {
      const equipo = (url.searchParams.get('equipo') ?? '').trim();
      const { registro } = await leerLicencia(env, url.searchParams.get('clave'));
      if (!registro || registro.estado !== 'activa') {
        return json({ valida: false, motivo: 'no-valida', mensaje: registro ? 'La clave ya no esta activa.' : 'Clave no encontrada.' });
      }
      // Un equipo liberado desde otro sitio deja de valer aqui en la
      // siguiente revalidacion. Sin `equipo` solo se dice si la clave existe
      // y esta al corriente: sirve para soporte, no desbloquea nada.
      if (equipo && !registro.equipos.includes(equipo)) {
        return json({ valida: false, motivo: 'equipo-liberado', mensaje: 'Esta clave ya no esta activa en este equipo.' });
      }
      return json({ valida: true, expira: registro.expira ?? null, equipos: registro.equipos.length, limite: LIMITE_EQUIPOS });
    }

    // La pagina donde aterriza el comprador, y su JSON.
    if (url.pathname === '/exito' && peticion.method === 'GET') {
      return new Response(paginaExito, {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }

    if (url.pathname === '/clave' && peticion.method === 'GET') {
      const sesion = url.searchParams.get('session_id') ?? '';
      const clave = sesion ? await env.LICENCIAS.get(`sesion:${sesion}`) : null;
      // 202: el pago esta bien pero el webhook todavia no ha llegado; la
      // pagina reintenta sola. Un 404 le haria creer que ha perdido el dinero.
      return clave ? json({ clave }) : json({ clave: null, motivo: 'todavia-no' }, 202);
    }

    // El aviso de Stripe.
    if (url.pathname === '/stripe' && peticion.method === 'POST') {
      const cuerpo = await peticion.text();
      if (!(await firmaValida(peticion.headers.get('stripe-signature'), cuerpo, env.STRIPE_WEBHOOK_SECRET))) {
        return new Response('firma no valida', { status: 400 });
      }
      let evento;
      try {
        evento = JSON.parse(cuerpo);
      } catch {
        return new Response('cuerpo ilegible', { status: 400 });
      }

      const objeto = evento?.data?.object ?? {};
      switch (evento?.type) {
        case 'checkout.session.completed':
          // pago aplazado (transferencia, SEPA): la clave espera a que entre el dinero
          if (objeto.payment_status && objeto.payment_status !== 'paid') break;
          await altaDeCompra(env, objeto, crypto);
          break;
        case 'checkout.session.async_payment_succeeded':
          await altaDeCompra(env, objeto, crypto);
          break;
        case 'charge.refunded':
          await revocarPorPago(env, objeto.payment_intent, 'reembolsada');
          break;
        case 'charge.dispute.created':
          await revocarPorPago(env, objeto.payment_intent, 'disputada');
          break;
        default:
          break;
      }
      // Siempre 200 a lo que no nos interesa: un error hace que Stripe
      // reintente el mismo evento durante tres dias.
      return new Response('ok');
    }

    return new Response('no', { status: 404 });
  },
};
