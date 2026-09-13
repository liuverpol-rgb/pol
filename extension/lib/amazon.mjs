/**
 * Lectura de una ficha de producto de Amazon.
 *
 * Modulo puro: recibe un documento (el real en el content script, uno de
 * mentira en los tests) y devuelve datos. No escribe en la pagina.
 *
 * Amazon cambia el HTML sin avisar y sirve maquetas distintas segun el pais,
 * la categoria y el test A/B que te toque. Por eso cada dato se busca en
 * varios sitios, en orden de fiabilidad, y si no aparece se devuelve null en
 * vez de inventar: la extension prefiere pedir el precio a mano antes que
 * calcular un margen sobre una cifra equivocada.
 */

const SELECTORES_PRECIO = [
  '#corePrice_feature_div .a-price .a-offscreen',
  '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
  '#priceblock_ourprice',
  '#priceblock_dealprice',
  '#price_inside_buybox',
  '.a-price .a-offscreen',
];

const SELECTORES_TITULO = ['#productTitle', '#title', 'h1 span'];

/**
 * Convierte el texto de un precio en numero.
 * Aguanta "24,90 €", "€1.234,56", "EUR 1,234.56" y "1 234,56 €".
 * Devuelve null si no hay un numero reconocible.
 */
export function precioDeTexto(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.replace(/[\s  ]/g, '');
  const cifras = limpio.match(/\d[\d.,]*/);
  if (!cifras) return null;
  let n = cifras[0];
  const ultimaComa = n.lastIndexOf(',');
  const ultimoPunto = n.lastIndexOf('.');
  const separador = Math.max(ultimaComa, ultimoPunto);
  if (separador === -1) {
    n = n.replace(/[.,]/g, '');
  } else {
    const decimales = n.length - separador - 1;
    // Un separador con 1 o 2 cifras detras es el decimal; con 3 es el de los
    // miles ("1.234" son mil doscientos treinta y cuatro, no 1,234).
    if (decimales === 3) {
      n = n.replace(/[.,]/g, '');
    } else {
      n = n.slice(0, separador).replace(/[.,]/g, '') + '.' + n.slice(separador + 1);
    }
  }
  const valor = Number(n);
  return Number.isFinite(valor) && valor > 0 ? Math.round(valor * 100) / 100 : null;
}

/** ASIN a partir de la URL. Es el identificador estable de la ficha. */
export function asinDeUrl(url) {
  if (typeof url !== 'string') return null;
  const m = url.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

/** ¿Es una ficha de producto? En el listado de resultados no hay nada que calcular. */
export function esFichaDeProducto(url) {
  return asinDeUrl(url) !== null;
}

const texto = (el) => (el && typeof el.textContent === 'string' ? el.textContent.trim() : '');

/**
 * Lee la ficha abierta.
 * @returns {{asin:string|null, titulo:string, precio:number|null, categoria:string|null, dominio:string|null}}
 */
export function leerProducto(doc, { url = '' } = {}) {
  const buscar = (selectores) => {
    for (const s of selectores) {
      const el = doc?.querySelector?.(s);
      const t = texto(el);
      if (t) return t;
    }
    return '';
  };

  const precioTexto = buscar(SELECTORES_PRECIO);
  const migas = doc?.querySelectorAll?.('#wayfinding-breadcrumbs_feature_div a') ?? [];
  const lista = Array.from(migas).map(texto).filter(Boolean);

  let dominio = null;
  try {
    dominio = url ? new URL(url).hostname.replace(/^www\./, '') : null;
  } catch {
    dominio = null;
  }

  return {
    asin: asinDeUrl(url) ?? texto(doc?.querySelector?.('#ASIN')) ?? null,
    titulo: buscar(SELECTORES_TITULO),
    precio: precioDeTexto(precioTexto),
    // La comision por referencia va por la categoria de PRIMER nivel, que es
    // la primera miga; la ultima ("Termometros") es demasiado fina para la
    // tabla de tarifas. Se devuelven todas por si hace falta afinar.
    categoria: lista.length ? lista[0] : null,
    migas: lista,
    dominio,
  };
}

/**
 * Elige la categoria de tarifas que mejor encaja con la miga de pan de
 * Amazon. Si no reconoce ninguna devuelve la general, que es la mas cara:
 * equivocarse hacia arriba solo te hace perder una venta; equivocarse hacia
 * abajo te hace venderla a perdida.
 */
export function categoriaDeTarifa(categoriaAmazon, categorias) {
  const general = categorias.find((c) => c.id === 'general') ?? categorias[0];
  // Acepta una miga o la lista entera: se prueba de la mas general a la mas
  // fina, que es el orden en el que Amazon decide la comision.
  const migas = (Array.isArray(categoriaAmazon) ? categoriaAmazon : [categoriaAmazon])
    .filter((m) => typeof m === 'string' && m.trim())
    .map((m) => m.toLowerCase());
  for (const miga of migas) {
    for (const c of categorias) {
      if (c.id === 'general') continue;
      const claves = [c.nombre, ...(c.equivalencias ?? [])];
      if (claves.some((k) => miga.includes(String(k).toLowerCase()))) return c;
    }
  }
  return general;
}
