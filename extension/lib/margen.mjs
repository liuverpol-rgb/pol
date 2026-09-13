/**
 * Motor de margen para venta online sin stock (dropshipping y print-on-demand).
 *
 * Modulo puro: no toca el DOM, no lee archivos y no imprime nada. Recibe la
 * tabla de comisiones como argumento para que la misma funcion sirva al CLI,
 * a los tests y a cualquier hoja de calculo futura.
 *
 * Por que existe: casi todo el mundo calcula el margen como
 * "precio - coste del producto" y se lleva una sorpresa. En Alemania, sobre
 * un pedido de 25 EUR se van, antes de ver un euro:
 *
 *   - el IVA repercutido (19 % del bruto, si no eres Kleinunternehmer),
 *   - la comision del marketplace (6,5 % en Etsy) sobre el bruto CON envio,
 *   - la comision de pago (4 % + 0,30 EUR en Alemania),
 *   - el 19 % de reverse charge sobre esas comisiones SI eres Kleinunternehmer
 *     (Etsy factura desde Irlanda; § 13b UStG te hace deudor del IVA y el
 *     § 19 UStG te prohibe deducirlo: es coste puro, no un apunte neutro),
 *   - la licencia de envase (VerpackG) de cada paquete,
 *   - y la devolucion, que en Alemania es un derecho de 14 dias sin motivo.
 *
 * Todos los importes de entrada y salida son EUROS por pedido salvo que el
 * nombre del campo diga lo contrario. Los precios de venta son BRUTOS
 * (con IVA incluido), porque es lo que se le ensena a un consumidor: la
 * PAngV obliga a mostrar el precio final.
 */

/** Redondea a 2 decimales evitando el ruido binario de los flotantes. */
export function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

const num = (v, defecto = 0) => (Number.isFinite(Number(v)) ? Number(v) : defecto);

/**
 * Normaliza un producto con los valores por defecto prudentes.
 * Prudente = el que no te hace creer que ganas mas de lo que ganas.
 */
function normalizarProducto(p) {
  return {
    nombre: p.nombre ?? 'producto',
    precioVenta: Math.max(0, num(p.precioVenta)),
    envioCobrado: Math.max(0, num(p.envioCobrado)),
    costeGenero: Math.max(0, num(p.costeGenero)),
    costeGeneroLlevaIva: p.costeGeneroLlevaIva !== false,
    costeEnvio: Math.max(0, num(p.costeEnvio)),
    costeEnvioLlevaIva: p.costeEnvioLlevaIva !== false,
    licenciaEnvase: Math.max(0, num(p.licenciaEnvase, 0.08)),
    tasaDevolucion: Math.min(Math.max(0, num(p.tasaDevolucion, 0.05)), 1),
    recuperacionDevolucion: Math.min(Math.max(0, num(p.recuperacionDevolucion, 0)), 1),
    envioRetornoAsumido: Math.max(0, num(p.envioRetornoAsumido)),
    unidades: Math.max(1, num(p.unidades, 1)),
  };
}

/**
 * Normaliza una plataforma de venta.
 * `comisionSobreEnvio`: Etsy y eBay cobran su porcentaje tambien sobre los
 * gastos de envio que cobras al cliente. Es el error de calculo mas comun.
 * `reverseCharge`: la plataforma factura desde otro pais de la UE (Etsy desde
 * Irlanda, eBay desde Luxemburgo). Determina si el Kleinunternehmer paga un
 * 19 % extra sobre las comisiones que no puede deducir.
 */
function normalizarPlataforma(pl) {
  return {
    nombre: pl.nombre ?? 'plataforma',
    comision: Math.max(0, num(pl.comision)),
    comisionSobreEnvio: pl.comisionSobreEnvio !== false,
    comisionPago: Math.max(0, num(pl.comisionPago)),
    fijoPago: Math.max(0, num(pl.fijoPago)),
    costeListado: Math.max(0, num(pl.costeListado)),
    ventasPorListado: Math.max(1, num(pl.ventasPorListado, 1)),
    comisionPagoReembolsable: pl.comisionPagoReembolsable === true,
    reverseCharge: pl.reverseCharge !== false,
  };
}

function normalizarFiscal(f = {}) {
  return {
    kleinunternehmer: f.kleinunternehmer !== false,
    tipoIva: num(f.tipoIva, 0.19),
  };
}

/**
 * Desglose completo de un pedido. Devuelve importes sin redondear para que
 * los encadenamientos no acumulen error; redondea quien presenta.
 */
export function desglosar(producto, plataforma, fiscal = {}) {
  const p = normalizarProducto(producto);
  const pl = normalizarPlataforma(plataforma);
  const fi = normalizarFiscal(fiscal);

  // Lo que cobras al cliente, IVA incluido. La base de casi todas las comisiones.
  const bruto = p.precioVenta * p.unidades + p.envioCobrado;
  const envioFueraDeComision = pl.comisionSobreEnvio ? 0 : p.envioCobrado;
  const baseComision = bruto - envioFueraDeComision;

  // IVA repercutido: solo si estas en regimen general. El Kleinunternehmer
  // se queda el bruto entero, y esa es su unica ventaja real.
  const iva = fi.kleinunternehmer ? 0 : bruto * (fi.tipoIva / (1 + fi.tipoIva));

  // Comisiones. El recargo del reverse charge es coste solo para el
  // Kleinunternehmer: en regimen general lo declaras y lo deduces, neutro.
  const recargoRc = pl.reverseCharge && fi.kleinunternehmer ? fi.tipoIva : 0;
  const comisionVenta = baseComision * pl.comision;
  const comisionPago = bruto * pl.comisionPago + pl.fijoPago;
  const listado = pl.costeListado / pl.ventasPorListado;
  const comisiones = (comisionVenta + comisionPago + listado) * (1 + recargoRc);

  // Costes propios. En regimen general la factura del proveedor aleman o
  // con IVA repercutido te deja deducir la cuota soportada; el
  // Kleinunternehmer paga el precio con IVA y ahi se queda.
  const quitarIva = (importe, llevaIva) =>
    llevaIva && !fi.kleinunternehmer ? importe / (1 + fi.tipoIva) : importe;
  const costeGenero = quitarIva(p.costeGenero * p.unidades, p.costeGeneroLlevaIva);
  const costeEnvio = quitarIva(p.costeEnvio, p.costeEnvioLlevaIva);

  const beneficioVenta =
    bruto - iva - comisiones - costeGenero - costeEnvio - p.licenciaEnvase;

  // Una devolucion (Widerruf, 14 dias, sin motivo) te deja esto encima:
  // el genero que no puedes revender, el envio de ida que ya pagaste, la
  // parte de comision de pago que no se reembolsa y el retorno si lo asumes.
  const comisionPagoNoReembolsada = pl.comisionPagoReembolsable
    ? 0
    : (bruto * pl.comisionPago + pl.fijoPago) * (1 + recargoRc);
  const perdidaDevolucion =
    costeGenero * (1 - p.recuperacionDevolucion) +
    costeEnvio +
    p.envioRetornoAsumido +
    comisionPagoNoReembolsada;

  // Valor esperado por pedido entrante: los dos ramos son excluyentes.
  const t = p.tasaDevolucion;
  const beneficio = (1 - t) * beneficioVenta - t * perdidaDevolucion;

  return {
    producto: p.nombre,
    plataforma: pl.nombre,
    bruto,
    iva,
    comisiones,
    costeGenero,
    costeEnvio,
    licenciaEnvase: p.licenciaEnvase,
    beneficioVenta,
    perdidaDevolucion,
    beneficio,
    // Margen sobre lo que cobras, la unica referencia comparable entre productos.
    margen: bruto > 0 ? beneficio / bruto : 0,
    // Cuantos pedidos hacen falta para un objetivo mensual.
    pedidosPara: (objetivo) => (beneficio > 0 ? Math.ceil(objetivo / beneficio) : Infinity),
  };
}

/**
 * Precio de venta (bruto, por unidad) que deja exactamente `objetivo` de
 * beneficio esperado por pedido. Forma cerrada: todas las comisiones son
 * lineales en el bruto, asi que no hace falta iterar.
 *
 * Devuelve Infinity si el modelo no tiene solucion: pasa cuando la suma de
 * porcentajes se come el pedido entero (tasa de devolucion altisima o
 * comisiones absurdas). Ese Infinity es informacion, no un fallo.
 */
export function precioParaBeneficio(objetivo, producto, plataforma, fiscal = {}) {
  const p = normalizarProducto(producto);
  const pl = normalizarPlataforma(plataforma);
  const fi = normalizarFiscal(fiscal);

  const recargoRc = pl.reverseCharge && fi.kleinunternehmer ? fi.tipoIva : 0;
  const tipoIvaSobreBruto = fi.kleinunternehmer ? 0 : fi.tipoIva / (1 + fi.tipoIva);
  const quitarIva = (importe, llevaIva) =>
    llevaIva && !fi.kleinunternehmer ? importe / (1 + fi.tipoIva) : importe;

  const costeGenero = quitarIva(p.costeGenero * p.unidades, p.costeGeneroLlevaIva);
  const costeEnvio = quitarIva(p.costeEnvio, p.costeEnvioLlevaIva);
  const t = p.tasaDevolucion;

  // Fraccion del bruto que se va en porcentajes (comision, pago, IVA).
  const variable = (pl.comision + pl.comisionPago) * (1 + recargoRc) + tipoIvaSobreBruto;
  // Si la plataforma no cobra comision sobre el envio, la parte aplicada de
  // mas arriba se devuelve aqui como fijo negativo.
  const envioFueraDeComision = pl.comisionSobreEnvio ? 0 : p.envioCobrado;
  // Importes fijos del ramo "venta cerrada".
  const fijos =
    (pl.fijoPago + pl.costeListado / pl.ventasPorListado) * (1 + recargoRc) -
    envioFueraDeComision * pl.comision * (1 + recargoRc) +
    costeGenero +
    costeEnvio +
    p.licenciaEnvase;
  // Importes del ramo "devolucion", separados en fijo y proporcional al bruto.
  const devolucionFija =
    costeGenero * (1 - p.recuperacionDevolucion) +
    costeEnvio +
    p.envioRetornoAsumido +
    (pl.comisionPagoReembolsable ? 0 : pl.fijoPago * (1 + recargoRc));
  const devolucionVariable = pl.comisionPagoReembolsable
    ? 0
    : pl.comisionPago * (1 + recargoRc);

  const coeficiente = (1 - t) * (1 - variable) - t * devolucionVariable;
  if (coeficiente <= 0) return Infinity;

  const bruto = (objetivo + (1 - t) * fijos + t * devolucionFija) / coeficiente;
  const precio = (bruto - p.envioCobrado) / p.unidades;
  return Math.max(0, redondear(precio));
}

/** Precio al que no ganas ni pierdes. El suelo por debajo del cual regalas trabajo. */
export function precioEquilibrio(producto, plataforma, fiscal = {}) {
  return precioParaBeneficio(0, producto, plataforma, fiscal);
}

/**
 * Compara el mismo producto en varias plataformas y en los dos regimenes
 * fiscales. Es la tabla que de verdad decide donde vender.
 */
export function comparar(producto, plataformas, fiscal = {}) {
  return plataformas
    .map((pl) => desglosar(producto, pl, fiscal))
    .sort((a, b) => b.beneficio - a.beneficio);
}
