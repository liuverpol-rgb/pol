/**
 * Motor de calculo fiscal para autonomos (estimacion directa simplificada).
 *
 * Modulo puro: no toca el DOM y no lee nada global. Recibe la tabla de
 * tarifas como argumento para que la misma funcion sirva a la web, a los
 * tests y a cualquier ejercicio futuro (API, hoja de calculo, bot).
 *
 * Todos los importes de entrada y salida son EUROS ANUALES salvo que el
 * nombre del campo diga lo contrario.
 */

/** Redondea a 2 decimales evitando el ruido binario de los flotantes. */
export function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Localiza el tramo de cotizacion del RETA por rendimiento neto MENSUAL. */
export function buscarTramo(rendimientoNetoMensual, tramos) {
  const neto = Math.max(0, rendimientoNetoMensual);
  const tramo = tramos.find(
    (t) => neto > t.desde && (t.hasta === null || neto <= t.hasta),
  );
  // Un neto de 0 no entra en ningun rango abierto por la izquierda: es el tramo 1.
  return tramo ?? tramos[0];
}

/**
 * Aplica una escala progresiva por tramos. Devuelve la cuota integra.
 * Cada tramo tributa solo por la parte de base que cae dentro de el.
 */
export function aplicarEscala(base, escala) {
  if (base <= 0) return 0;
  let cuota = 0;
  for (const t of escala) {
    if (base <= t.desde) break;
    const techo = t.hasta === null ? base : Math.min(base, t.hasta);
    cuota += (techo - t.desde) * t.tipo;
  }
  return cuota;
}

/**
 * @param {object} entrada
 * @param {number} entrada.ingresos           Facturacion anual SIN IVA.
 * @param {number} entrada.gastos             Gastos deducibles anuales SIN IVA (sin incluir la cuota de autonomos).
 * @param {number} entrada.tipoIva            Tipo de IVA repercutido (0.21, 0.10, 0.04, 0).
 * @param {number} entrada.tipoIvaGastos      Tipo medio de IVA soportado en los gastos.
 * @param {number} entrada.gastosConIva       Parte de los gastos que lleva IVA deducible.
 * @param {number} entrada.tipoRetencion      Retencion de IRPF en tus facturas (0, 0.07, 0.15).
 * @param {number} entrada.porcentajeAEmpresas Fraccion de la facturacion emitida a empresas/profesionales (0..1).
 * @param {boolean} entrada.tarifaPlana       Si estas en cuota reducida de nueva alta.
 * @param {boolean} entrada.societario        Autonomo societario (deduccion generica del 3% en vez del 7%).
 * @param {object} tarifas                    Contenido de tarifas-YYYY.json.
 */
export function calcular(entrada, tarifas) {
  const ingresos = Math.max(0, Number(entrada.ingresos) || 0);
  const gastos = Math.max(0, Number(entrada.gastos) || 0);
  const tipoIva = Number(entrada.tipoIva) || 0;
  const tipoIvaGastos = Number(entrada.tipoIvaGastos) || 0;
  const gastosConIva = Math.min(Math.max(0, Number(entrada.gastosConIva) || 0), gastos);
  const tipoRetencion = Number(entrada.tipoRetencion) || 0;
  const porcentajeAEmpresas = Math.min(Math.max(Number(entrada.porcentajeAEmpresas ?? 1), 0), 1);

  // --- 1. Rendimiento neto previo (sin restar todavia la cuota de autonomos) ---
  const rendimientoPrevio = ingresos - gastos;

  // --- 2. Cuota del RETA -------------------------------------------------
  // Para elegir tramo, la Seguridad Social parte del rendimiento neto y le
  // aplica una deduccion generica (7% persona fisica / 3% societario).
  const deduccionGenerica = entrada.societario
    ? tarifas.irpf.deduccion_generica_rendimientos.porcentaje_societario
    : tarifas.irpf.deduccion_generica_rendimientos.porcentaje_persona_fisica;
  const rendimientoParaTramo = Math.max(0, rendimientoPrevio * (1 - deduccionGenerica));
  const rendimientoMensualTramo = rendimientoParaTramo / 12;
  const tramo = buscarTramo(rendimientoMensualTramo, tarifas.reta.tramos);

  const cuotaMensualTramo = tramo.cuota_mensual;
  const cuotaMensualReta = entrada.tarifaPlana
    ? tarifas.reta.tarifa_plana.cuota_mensual
    : cuotaMensualTramo;
  const cuotaAnualReta = cuotaMensualReta * 12;

  // --- 3. IRPF -----------------------------------------------------------
  // La cuota de autonomos es gasto deducible; despues se aplica el 7% de
  // gastos de dificil justificacion, con el limite anual legal.
  const netoTrasReta = rendimientoPrevio - cuotaAnualReta;
  const dj = tarifas.irpf.gastos_dificil_justificacion;
  const gastosDificilJustificacion = Math.min(
    Math.max(0, netoTrasReta) * dj.porcentaje,
    dj.limite_anual,
  );
  const baseImponibleIrpf = Math.max(0, netoTrasReta - gastosDificilJustificacion);

  // El minimo personal no se resta de la base: se calcula su cuota con la
  // misma escala y se descuenta de la cuota integra.
  const cuotaIntegra = aplicarEscala(baseImponibleIrpf, tarifas.irpf.escala);
  const cuotaMinimoPersonal = aplicarEscala(
    Math.min(baseImponibleIrpf, tarifas.irpf.minimo_personal),
    tarifas.irpf.escala,
  );
  const cuotaIrpf = Math.max(0, cuotaIntegra - cuotaMinimoPersonal);

  const retencionesSoportadas = ingresos * porcentajeAEmpresas * tipoRetencion;
  const resultadoRenta = cuotaIrpf - retencionesSoportadas; // >0 a pagar, <0 a devolver

  // --- 4. IVA ------------------------------------------------------------
  // El IVA no forma parte de tus ingresos: lo recaudas y lo ingresas.
  const ivaRepercutido = ingresos * tipoIva;
  const ivaSoportado = gastosConIva * tipoIvaGastos;
  const ivaALiquidar = Math.max(0, ivaRepercutido - ivaSoportado);
  const ivaACompensar = Math.max(0, ivaSoportado - ivaRepercutido);

  // --- 5. Lo que de verdad te queda --------------------------------------
  const netoAnual = ingresos - gastos - cuotaAnualReta - cuotaIrpf;
  const tipoEfectivo = ingresos > 0 ? (cuotaAnualReta + cuotaIrpf) / ingresos : 0;

  // Colchon a apartar de cada factura: impuestos e IVA que no son tuyos,
  // menos lo que el cliente ya te retiene en la propia factura.
  const aApartarPorFactura =
    ingresos > 0
      ? (cuotaAnualReta + cuotaIrpf - retencionesSoportadas + ivaALiquidar) / ingresos
      : 0;

  return {
    ingresos: redondear(ingresos),
    gastos: redondear(gastos),
    rendimientoPrevio: redondear(rendimientoPrevio),
    reta: {
      tramo: tramo.tramo,
      tabla: tramo.tabla,
      rendimientoMensualComputable: redondear(rendimientoMensualTramo),
      cuotaMensual: redondear(cuotaMensualReta),
      cuotaMensualSinTarifaPlana: redondear(cuotaMensualTramo),
      cuotaAnual: redondear(cuotaAnualReta),
      tarifaPlana: Boolean(entrada.tarifaPlana),
    },
    irpf: {
      gastosDificilJustificacion: redondear(gastosDificilJustificacion),
      baseImponible: redondear(baseImponibleIrpf),
      cuota: redondear(cuotaIrpf),
      retencionesSoportadas: redondear(retencionesSoportadas),
      resultadoRenta: redondear(resultadoRenta),
      tipoMedio: ingresos > 0 ? redondear((cuotaIrpf / ingresos) * 100) : 0,
    },
    iva: {
      repercutido: redondear(ivaRepercutido),
      soportado: redondear(ivaSoportado),
      aLiquidar: redondear(ivaALiquidar),
      aCompensar: redondear(ivaACompensar),
      trimestral: redondear(ivaALiquidar / 4),
    },
    resumen: {
      netoAnual: redondear(netoAnual),
      netoMensual: redondear(netoAnual / 12),
      tipoEfectivo: redondear(tipoEfectivo * 100),
      porcentajeAApartar: redondear(Math.max(0, aApartarPorFactura) * 100),
    },
  };
}
