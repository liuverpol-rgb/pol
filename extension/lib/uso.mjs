/**
 * Contador de usos: 5 analisis gratis al mes.
 *
 * Modulo puro salvo por el almacen que recibe. No toca el DOM, no llama a
 * chrome.* directamente y no imprime nada, para que se pueda probar entero
 * con node:test (ver test/uso.test.mjs).
 *
 * Reglas que implementa, y por que:
 *
 *   1. El periodo es el MES NATURAL del usuario ("2026-09"), no 30 dias
 *      rodantes. Es lo unico que un cliente entiende sin leer la letra
 *      pequena: "se reinicia el dia 1".
 *   2. Un mismo producto solo cuenta UNA vez dentro del periodo. Volver a
 *      abrir la ficha para cambiar el coste del proveedor no gasta cuota:
 *      cobrar dos veces por el mismo analisis es la forma mas rapida de que
 *      alguien desinstale.
 *   3. Si el reloj del sistema retrocede, el contador NO se reinicia: solo
 *      se abre un periodo nuevo cuando el mes actual es POSTERIOR al
 *      guardado. Es la unica trampa que cuesta cero defender.
 *   4. Las escrituras se serializan en una cola. Dos popups abiertos a la
 *      vez, o un service worker que despierta a la mitad, no pueden leer el
 *      mismo valor y escribir 4 dos veces.
 *
 * Lo que este contador NO es: una proteccion. Vive en el equipo del usuario
 * y quien sepa abrir las devtools de la extension lo pone a cero. Sirve para
 * dos cosas honestas: poner un techo a lo que TU gastas por usuario y dar
 * la conversacion de la compra en el momento justo. La licencia (licencia.mjs)
 * es lo que de verdad distingue a quien ha pagado.
 */

/** Analisis gratuitos por mes natural. */
export const LIMITE_GRATIS = 5;

/** Clave unica en el almacen. */
export const CLAVE = 'uso';

/** Cuantos identificadores de producto se recuerdan dentro de un periodo. */
const MAX_RECORDADOS = 200;

/** Periodo al que pertenece una fecha, en hora local del usuario: "2026-09". */
export function periodoDe(fecha = new Date()) {
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  return `${f.getFullYear()}-${mes}`;
}

/** Primer instante del mes siguiente: lo que se le ensena al usuario. */
export function proximoReinicio(fecha = new Date()) {
  const f = fecha instanceof Date ? fecha : new Date(fecha);
  return new Date(f.getFullYear(), f.getMonth() + 1, 1, 0, 0, 0, 0);
}

const entero = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);

/**
 * Devuelve el estado vigente a partir de lo guardado. Si el mes actual es
 * posterior al guardado, empieza periodo nuevo. Cualquier basura en el
 * almacen (version antigua, escritura a medias, usuario curioso) se
 * interpreta como "periodo en curso sin usos", nunca como cuota infinita.
 */
function vigente(guardado, periodo) {
  const previo = guardado && typeof guardado === 'object' ? guardado : {};
  const periodoGuardado = typeof previo.periodo === 'string' ? previo.periodo : '';
  if (!periodoGuardado || periodo > periodoGuardado) {
    return { periodo, usos: 0, productos: [] };
  }
  return {
    periodo: periodoGuardado,
    usos: entero(previo.usos),
    productos: Array.isArray(previo.productos)
      ? previo.productos.filter((p) => typeof p === 'string').slice(-MAX_RECORDADOS)
      : [],
  };
}

function resumen(estado, limite, ahora) {
  const restantes = Math.max(0, limite - estado.usos);
  return {
    periodo: estado.periodo,
    usos: estado.usos,
    limite,
    restantes,
    agotado: restantes === 0,
    reinicia: proximoReinicio(ahora),
  };
}

/** Cuantos usos quedan, sin gastar ninguno. */
export async function leerUso(almacen, { ahora = new Date(), limite = LIMITE_GRATIS } = {}) {
  const periodo = periodoDe(ahora);
  return resumen(vigente(await almacen.leer(CLAVE), periodo), limite, ahora);
}

// Cola de escritura: serializa los consumos concurrentes.
let cola = Promise.resolve();

/**
 * Gasta un uso y dice si la operacion esta permitida.
 *
 * @param {object} almacen
 * @param {object} opciones
 * @param {string} [opciones.producto]  Identificador estable (el ASIN). Si se
 *   repite dentro del mismo periodo no vuelve a descontar.
 * @param {boolean} [opciones.pro]  Si el usuario tiene licencia activa, ni
 *   cuenta ni escribe: el plan de pago es ilimitado.
 * @returns {Promise<{permitido:boolean, yaContado:boolean, ilimitado:boolean, ...}>}
 */
export function consumirUso(almacen, opciones = {}) {
  const paso = cola.then(() => consumir(almacen, opciones));
  // La cola sigue viva aunque un consumo falle; el error se lo lleva quien llamo.
  cola = paso.then(
    () => undefined,
    () => undefined,
  );
  return paso;
}

async function consumir(almacen, { ahora = new Date(), limite = LIMITE_GRATIS, producto = '', pro = false } = {}) {
  const periodo = periodoDe(ahora);
  const estado = vigente(await almacen.leer(CLAVE), periodo);

  if (pro) {
    return { ...resumen(estado, limite, ahora), permitido: true, yaContado: false, ilimitado: true };
  }

  const id = typeof producto === 'string' ? producto.trim() : '';
  if (id && estado.productos.includes(id)) {
    return { ...resumen(estado, limite, ahora), permitido: true, yaContado: true, ilimitado: false };
  }

  if (estado.usos >= limite) {
    return { ...resumen(estado, limite, ahora), permitido: false, yaContado: false, ilimitado: false };
  }

  const nuevo = {
    periodo,
    usos: estado.usos + 1,
    productos: id ? [...estado.productos, id].slice(-MAX_RECORDADOS) : estado.productos,
  };
  await almacen.escribir(CLAVE, nuevo);
  return { ...resumen(nuevo, limite, ahora), permitido: true, yaContado: false, ilimitado: false };
}

/** Pone el contador a cero. Solo para desarrollo y para los tests. */
export async function reiniciarUso(almacen) {
  await almacen.borrar(CLAVE);
}
