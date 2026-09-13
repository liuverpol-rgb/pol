/**
 * Adaptador de almacenamiento para la extension.
 *
 * Todo lo que persiste la extension pasa por aqui. El resto de modulos
 * (uso.mjs, licencia.mjs) reciben un "almacen" con dos metodos, leer y
 * escribir, y no saben si detras hay chrome.storage, memoria o un mock.
 * Gracias a eso el contador y la licencia se prueban con node:test sin
 * necesidad de un navegador.
 *
 *   almacen.leer(clave)          -> Promise<valor | undefined>
 *   almacen.escribir(clave, v)   -> Promise<void>
 *   almacen.borrar(clave)        -> Promise<void>
 */

/** Almacen en memoria. Para los tests y para el modo de desarrollo. */
export function almacenMemoria(inicial = {}) {
  const datos = new Map(Object.entries(structuredClone(inicial)));
  return {
    async leer(clave) {
      const v = datos.get(clave);
      return v === undefined ? undefined : structuredClone(v);
    },
    async escribir(clave, valor) {
      datos.set(clave, structuredClone(valor));
    },
    async borrar(clave) {
      datos.delete(clave);
    },
    /** Solo para inspeccionar en pruebas. */
    volcar() {
      return Object.fromEntries(datos);
    },
  };
}

/**
 * Almacen sobre chrome.storage.
 *
 * Por defecto usa `sync`: el contador y la licencia viajan con la cuenta de
 * Chrome del usuario, que es lo que espera quien cambia de ordenador. Si el
 * usuario no ha iniciado sesion, o si sync no esta disponible, cae a `local`
 * de forma transparente. Nunca lanza por culpa del almacenamiento: si Chrome
 * devuelve error se comporta como si no hubiera dato guardado, porque dejar
 * la extension inutilizable por una cuota agotada es peor que recontar.
 */
export function almacenChrome(area) {
  const elegida = area ?? globalThis.chrome?.storage?.sync ?? globalThis.chrome?.storage?.local;
  if (!elegida) {
    throw new Error('chrome.storage no esta disponible: ¿falta el permiso "storage" en el manifiesto?');
  }
  return {
    async leer(clave) {
      try {
        const r = await elegida.get(clave);
        return r?.[clave];
      } catch {
        return undefined;
      }
    },
    async escribir(clave, valor) {
      try {
        await elegida.set({ [clave]: valor });
      } catch {
        /* cuota o perfil sin sync: seguimos, el calculo no depende de esto */
      }
    },
    async borrar(clave) {
      try {
        await elegida.remove(clave);
      } catch {
        /* idem */
      }
    },
  };
}
