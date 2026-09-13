/**
 * Content script: lo unico que hace es leer la ficha abierta y contestar.
 *
 * No pinta nada sobre Amazon, no manda datos a ningun sitio y no guarda
 * nada. El calculo vive en el popup. Cuanto menos codigo corra dentro de la
 * pagina de otro, menos cosas se rompen cuando esa pagina cambia.
 *
 * Los content scripts no pueden ser modulos ES, asi que el parser se carga
 * con import() dinamico desde los recursos accesibles de la extension. De
 * ese modo hay una sola copia del parser y se puede probar con node:test.
 */

chrome.runtime.onMessage.addListener((mensaje, _emisor, responder) => {
  if (mensaje?.tipo !== 'leer-ficha') return false;
  (async () => {
    try {
      const { leerProducto } = await import(chrome.runtime.getURL('lib/amazon.mjs'));
      responder({ ok: true, producto: leerProducto(document, { url: location.href }) });
    } catch (e) {
      responder({ ok: false, error: String(e?.message ?? e) });
    }
  })();
  // true = la respuesta llega de forma asincrona.
  return true;
});
