/**
 * Licencia de pago: activar, revalidar y desactivar una clave.
 *
 * Dos proveedores, la misma interfaz:
 *
 *   "lemonsqueezy"  La API de licencias de Lemon Squeezy se llama DESDE EL
 *                   CLIENTE: no lleva clave secreta, solo la clave de
 *                   licencia que el cliente ha comprado. Por eso una
 *                   extension sin servidor puede cobrar con ella. Ademas
 *                   Lemon Squeezy actua como Merchant of Record: factura el
 *                   y liquida el IVA de cada pais. Para vender software
 *                   desde Alemania a toda la UE eso te ahorra el OSS.
 *
 *   "propio"        Un endpoint tuyo que responde {valida, expira}. Es el
 *                   camino cuando cobras con Stripe, porque Stripe NO tiene
 *                   API de licencias: hace falta un trozo de servidor que
 *                   escuche el webhook de la compra, genere la clave y la
 *                   valide. En extension/README.md esta el Worker de
 *                   Cloudflare que hace eso en 40 lineas y 0 EUR al mes.
 *
 * Decisiones que importan:
 *
 *   - La activacion comprueba que la clave viene de TU tienda y de TU
 *     producto (meta.store_id / meta.product_id). Sin esa comprobacion,
 *     cualquier clave de cualquier vendedor de Lemon Squeezy desbloquearia
 *     tu extension.
 *   - Se revalida cada 7 dias, no en cada uso: si revalidas en cada clic,
 *     el dia que la API tenga un mal rato tus clientes de pago se quedan
 *     fuera y tu buzon se llena.
 *   - Si no hay red, la licencia sigue valiendo 14 dias (GRACIA_DIAS). Un
 *     cliente en un tren no es un moroso.
 *   - Si la API responde con claridad que la clave ya no vale (revocada,
 *     caducada, reembolsada), se cae a gratis en el acto.
 */

export const CLAVE = 'licencia';
export const REVALIDAR_CADA_DIAS = 7;
export const GRACIA_DIAS = 14;

const DIA = 24 * 60 * 60 * 1000;
const API = 'https://api.lemonsqueezy.com/v1/licenses';

const fecha = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Error con un motivo legible para la interfaz. */
export class ErrorLicencia extends Error {
  constructor(motivo, mensaje) {
    super(mensaje);
    this.name = 'ErrorLicencia';
    this.motivo = motivo;
  }
}

/** Nombre con el que se registra este equipo en el panel de Lemon Squeezy. */
function nombreInstancia() {
  const ua = globalThis.navigator?.userAgent ?? '';
  const so = /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'equipo';
  return `Chrome en ${so}`;
}

async function postLemon(ruta, cuerpo, buscar) {
  let respuesta;
  try {
    respuesta = await buscar(`${API}/${ruta}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(cuerpo).toString(),
    });
  } catch (e) {
    throw new ErrorLicencia('sin-conexion', `No se ha podido contactar con el servidor de licencias: ${e.message}`);
  }
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }
  if (!datos || typeof datos !== 'object') {
    throw new ErrorLicencia('respuesta-invalida', 'El servidor de licencias ha respondido algo que no se entiende.');
  }
  return datos;
}

/** Comprueba que la clave pertenece a la tienda y al producto configurados. */
function comprobarOrigen(meta, config) {
  const tienda = Number(config?.tiendaId);
  const producto = Number(config?.productoId);
  if (Number.isFinite(tienda) && tienda > 0 && Number(meta?.store_id) !== tienda) {
    throw new ErrorLicencia('otra-tienda', 'Esa clave es de otra tienda.');
  }
  if (Number.isFinite(producto) && producto > 0 && Number(meta?.product_id) !== producto) {
    throw new ErrorLicencia('otro-producto', 'Esa clave es de otro producto.');
  }
}

/**
 * Activa una clave de licencia en este equipo y la guarda.
 * @returns {Promise<object>} estado guardado
 */
export async function activar(claveLicencia, { almacen, config, buscar = globalThis.fetch, ahora = new Date() } = {}) {
  const clave = String(claveLicencia ?? '').trim();
  if (!clave) throw new ErrorLicencia('clave-vacia', 'Escribe la clave que te llego por correo.');

  const proveedor = config?.proveedor ?? 'lemonsqueezy';
  let estado;

  if (proveedor === 'propio') {
    const datos = await consultarPropio(clave, config, buscar);
    if (!datos.valida) throw new ErrorLicencia('no-valida', datos.mensaje ?? 'La clave no es valida.');
    estado = { proveedor, clave, instancia: '', expira: datos.expira ?? null };
  } else {
    const datos = await postLemon('activate', { license_key: clave, instance_name: nombreInstancia() }, buscar);
    // activated:true es la unica respuesta buena. Ojo: cuando se agota el
    // limite de equipos la clave sigue con status "active" y activated a
    // false; dar por buena esa respuesta seria regalar activaciones.
    if (datos?.activated !== true) {
      const estadoClave = datos?.license_key?.status;
      throw new ErrorLicencia(motivoDeEstado(estadoClave, datos?.error), datos?.error ?? 'La clave no se ha podido activar.');
    }
    comprobarOrigen(datos.meta, config);
    estado = {
      proveedor,
      clave,
      instancia: datos?.instance?.id ?? '',
      expira: fecha(datos?.license_key?.expires_at)?.toISOString() ?? null,
    };
  }

  const guardado = { ...estado, activadaEn: ahora.toISOString(), comprobadaEn: ahora.toISOString(), valida: true };
  await almacen.escribir(CLAVE, guardado);
  return guardado;
}

function motivoDeEstado(estado, error) {
  if (estado === 'expired') return 'caducada';
  if (estado === 'disabled') return 'revocada';
  if (/activation limit/i.test(error ?? '')) return 'limite-equipos';
  return 'no-valida';
}

async function consultarPropio(clave, config, buscar) {
  const base = config?.endpoint;
  if (!base) throw new ErrorLicencia('sin-configurar', 'Falta el endpoint de validacion en config.mjs.');
  let respuesta;
  try {
    const url = new URL(base);
    url.searchParams.set('clave', clave);
    respuesta = await buscar(url.toString(), { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new ErrorLicencia('sin-conexion', `No se ha podido contactar con el servidor de licencias: ${e.message}`);
  }
  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    throw new ErrorLicencia('respuesta-invalida', 'El servidor de licencias ha respondido algo que no se entiende.');
  }
  return { valida: datos?.valida === true, expira: datos?.expira ?? null, mensaje: datos?.mensaje };
}

/**
 * Estado actual de la licencia, revalidando si toca.
 *
 * @returns {Promise<{pro:boolean, motivo:string, clave?:string, expira?:string|null, comprobadaEn?:string}>}
 *   motivo: sin-licencia | activa | caducada | revocada | sin-conexion |
 *           sin-conexion-agotada | no-valida
 */
export async function estadoLicencia(
  almacen,
  { config, buscar = globalThis.fetch, ahora = new Date(), forzar = false } = {},
) {
  const guardado = await almacen.leer(CLAVE);
  if (!guardado || typeof guardado !== 'object' || !guardado.clave) {
    return { pro: false, motivo: 'sin-licencia' };
  }

  const expira = fecha(guardado.expira);
  if (expira && ahora > expira) {
    await almacen.escribir(CLAVE, { ...guardado, valida: false });
    return { pro: false, motivo: 'caducada', clave: guardado.clave, expira: guardado.expira };
  }
  if (guardado.valida === false) {
    return { pro: false, motivo: 'revocada', clave: guardado.clave };
  }

  const comprobada = fecha(guardado.comprobadaEn) ?? new Date(0);
  const desde = ahora - comprobada;
  if (!forzar && desde < REVALIDAR_CADA_DIAS * DIA) {
    return { pro: true, motivo: 'activa', clave: guardado.clave, expira: guardado.expira, comprobadaEn: guardado.comprobadaEn };
  }

  try {
    const fresco = await revalidar(guardado, { config, buscar });
    if (!fresco.valida) {
      await almacen.escribir(CLAVE, { ...guardado, valida: false });
      return { pro: false, motivo: fresco.motivo ?? 'revocada', clave: guardado.clave };
    }
    const actualizado = {
      ...guardado,
      expira: fresco.expira ?? guardado.expira,
      comprobadaEn: ahora.toISOString(),
      valida: true,
    };
    await almacen.escribir(CLAVE, actualizado);
    return { pro: true, motivo: 'activa', clave: guardado.clave, expira: actualizado.expira, comprobadaEn: actualizado.comprobadaEn };
  } catch (e) {
    if (e instanceof ErrorLicencia && e.motivo !== 'sin-conexion') {
      await almacen.escribir(CLAVE, { ...guardado, valida: false });
      return { pro: false, motivo: e.motivo, clave: guardado.clave };
    }
    // Sin red: la licencia aguanta GRACIA_DIAS desde la ultima comprobacion buena.
    const dentroDeGracia = desde < (REVALIDAR_CADA_DIAS + GRACIA_DIAS) * DIA;
    return {
      pro: dentroDeGracia,
      motivo: dentroDeGracia ? 'sin-conexion' : 'sin-conexion-agotada',
      clave: guardado.clave,
      expira: guardado.expira,
      comprobadaEn: guardado.comprobadaEn,
    };
  }
}

async function revalidar(guardado, { config, buscar }) {
  if (guardado.proveedor === 'propio') {
    const datos = await consultarPropio(guardado.clave, config, buscar);
    return { valida: datos.valida, expira: datos.expira, motivo: datos.valida ? undefined : 'no-valida' };
  }
  const cuerpo = { license_key: guardado.clave };
  if (guardado.instancia) cuerpo.instance_id = guardado.instancia;
  const datos = await postLemon('validate', cuerpo, buscar);
  const estado = datos?.license_key?.status;
  if (datos?.valid !== true || estado !== 'active') {
    return { valida: false, motivo: motivoDeEstado(estado, datos?.error) };
  }
  try {
    comprobarOrigen(datos.meta, config);
  } catch (e) {
    return { valida: false, motivo: e.motivo };
  }
  return { valida: true, expira: fecha(datos?.license_key?.expires_at)?.toISOString() ?? null };
}

/** Suelta la licencia de este equipo para poder usarla en otro. */
export async function desactivar(almacen, { config, buscar = globalThis.fetch } = {}) {
  const guardado = await almacen.leer(CLAVE);
  await almacen.borrar(CLAVE);
  if (!guardado?.clave || guardado.proveedor === 'propio' || !guardado.instancia) return { liberada: false };
  try {
    const datos = await postLemon('deactivate', { license_key: guardado.clave, instance_id: guardado.instancia }, buscar);
    return { liberada: datos?.deactivated === true };
  } catch {
    // La clave ya no esta en este equipo; que el panel remoto no se entere
    // no es motivo para dejarla puesta aqui.
    return { liberada: false };
  }
}
