/**
 * Une lo que se lee de Amazon con lo que sabe el motor de margen.
 *
 * Modulo puro: recibe los datos de la ficha, los costes del usuario y la
 * tabla de tarifas, y devuelve el desglose. Ni almacen ni DOM ni red.
 */

import { desglosar, precioEquilibrio, precioParaBeneficio, redondear } from './margen.mjs';
import { categoriaDeTarifa } from './amazon.mjs';

/** Construye la "plataforma" que entiende margen.mjs a partir de las tarifas. */
export function plataformaAmazon(datos, { plan = 'particular', categoria = 'general' } = {}) {
  const base = datos.plataforma;
  const cat =
    datos.categorias.find((c) => c.id === categoria) ??
    datos.categorias.find((c) => c.id === 'general') ??
    datos.categorias[0];
  const p = datos.planes.find((x) => x.id === plan) ?? datos.planes[0];
  return {
    nombre: `${base.nombre} · ${cat.nombre} · ${p.nombre}`,
    comision: cat.comision,
    comisionSobreEnvio: base.comisionSobreEnvio !== false,
    comisionPago: base.comisionPago ?? 0,
    fijoPago: p.fijoPago ?? 0,
    costeListado: 0,
    ventasPorListado: 1,
    // Amazon reembolsa la comision por referencia de un pedido devuelto pero
    // se queda una parte en muchas categorias. Se cuenta como no reembolsable
    // porque es el supuesto prudente.
    comisionPagoReembolsable: false,
    reverseCharge: base.reverseCharge !== false,
    cuotaMensual: p.cuotaMensual ?? 0,
    categoria: cat,
    plan: p,
  };
}

/** Adivina la categoria de tarifas a partir de la miga de pan de la ficha. */
export function categoriaSugerida(producto, datos) {
  return categoriaDeTarifa(producto?.migas ?? producto?.categoria, datos.categorias).id;
}

/**
 * Analisis completo de una ficha.
 *
 * @param {object} producto  lo leido de la pagina ({precio, titulo, ...})
 * @param {object} costes    lo que el usuario ha configurado
 * @param {object} datos     extension/datos/amazon.json
 */
export function analizar(producto, costes, datos) {
  const plataforma = plataformaAmazon(datos, costes);
  const fiscal = { kleinunternehmer: costes.kleinunternehmer !== false, tipoIva: costes.tipoIva ?? 0.19 };
  const ficha = {
    nombre: producto.titulo || 'producto',
    precioVenta: producto.precio ?? 0,
    envioCobrado: costes.envioCobrado ?? 0,
    costeGenero: costes.costeGenero ?? 0,
    costeGeneroLlevaIva: costes.costeGeneroLlevaIva !== false,
    costeEnvio: costes.costeEnvio ?? 0,
    costeEnvioLlevaIva: costes.costeEnvioLlevaIva !== false,
    licenciaEnvase: costes.licenciaEnvase ?? 0.08,
    tasaDevolucion: costes.tasaDevolucion ?? 0.05,
    recuperacionDevolucion: costes.recuperacionDevolucion ?? 0.5,
    envioRetornoAsumido: costes.envioRetornoAsumido ?? 0,
    unidades: costes.unidades ?? 1,
  };

  const desglose = desglosar(ficha, plataforma, fiscal);
  const equilibrio = precioEquilibrio(ficha, plataforma, fiscal);

  return {
    desglose,
    plataforma,
    equilibrio,
    /** Precio al que ese producto dejaria el beneficio que pidas. */
    precioPara: (objetivo) => precioParaBeneficio(objetivo, ficha, plataforma, fiscal),
    avisos: avisos(desglose, plataforma, ficha, datos),
  };
}

/** Las tres cosas que hay que decirle al usuario aunque no las pregunte. */
function avisos(desglose, plataforma, ficha, datos) {
  const lista = [];
  if (datos._verificado !== true) {
    lista.push('Las comisiones de esta tabla estan sin contrastar con Seller Central. Comprueba la de tu categoria antes de fijar el precio.');
  }
  if (ficha.costeGenero === 0) {
    lista.push('No has puesto lo que te cuesta el genero: el beneficio que ves es el techo, no el real.');
  }
  if (plataforma.cuotaMensual > 0) {
    lista.push(`El Plan Profesional cuesta ${plataforma.cuotaMensual} €/mes aparte. Con ${Math.max(1, Math.ceil(plataforma.cuotaMensual / Math.max(desglose.beneficio, 0.01)))} ventas al mes solo cubres esa cuota.`);
  }
  if (desglose.beneficio > 0 && desglose.perdidaDevolucion > desglose.beneficioVenta) {
    lista.push(`Una devolucion cuesta ${redondear(desglose.perdidaDevolucion)} €: se come ${Math.ceil(desglose.perdidaDevolucion / desglose.beneficio)} ventas.`);
  }
  return lista;
}
