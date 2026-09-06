import { calcular } from './calculadora.js';

const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always',
});
const eurosExactos = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 2, useGrouping: 'always',
});
const porcentaje = (n) => `${n.toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;

const formulario = document.getElementById('formulario');
const desglose = document.getElementById('desglose');

function leerFormulario() {
  const v = (id) => Number(document.getElementById(id).value) || 0;
  return {
    ingresos: v('ingresos'),
    gastos: v('gastos'),
    gastosConIva: v('gastosConIva'),
    tipoIva: v('tipoIva'),
    // Se asume que los gastos deducibles soportan el tipo general.
    tipoIvaGastos: 0.21,
    tipoRetencion: v('tipoRetencion'),
    porcentajeAEmpresas: v('porcentajeAEmpresas') / 100,
    tarifaPlana: document.getElementById('tarifaPlana').checked,
    societario: document.getElementById('societario').checked,
  };
}

function fila(concepto, importe, { nota = '', total = false, clase = '' } = {}) {
  return `<tr class="${total ? 'total' : ''}">
    <td>${concepto}${nota ? `<span class="nota">${nota}</span>` : ''}</td>
    <td class="${clase}">${importe}</td>
  </tr>`;
}

function pintar(r, tarifas) {
  document.getElementById('netoMensual').textContent = euros.format(r.resumen.netoMensual);
  document.getElementById('tipoEfectivo').textContent =
    `${euros.format(r.resumen.netoAnual)} al año · te vas en impuestos y cuota el ${porcentaje(r.resumen.tipoEfectivo)} de lo que facturas`;
  document.getElementById('porcentajeApartar').textContent = porcentaje(r.resumen.porcentajeAApartar);

  const cuotaEtiqueta = r.reta.tarifaPlana
    ? `Tarifa plana · sin ella pagarías ${euros.format(r.reta.cuotaMensualSinTarifaPlana)}/mes`
    : `Tramo ${r.reta.tramo} (tabla ${r.reta.tabla}) · ${euros.format(r.reta.cuotaMensual)}/mes`;

  const renta = r.irpf.resultadoRenta;
  const rentaTexto = renta >= 0
    ? `${eurosExactos.format(renta)} a pagar`
    : `${eurosExactos.format(Math.abs(renta))} a devolver`;

  desglose.innerHTML = `
    <tr><th colspan="2">Seguridad Social</th></tr>
    ${fila('Cuota de autónomos', euros.format(r.reta.cuotaAnual), { nota: cuotaEtiqueta })}

    <tr><th colspan="2">IRPF</th></tr>
    ${fila('Base imponible', euros.format(r.irpf.baseImponible), {
      nota: `Tras restar gastos, cuota y ${euros.format(r.irpf.gastosDificilJustificacion)} de difícil justificación`,
    })}
    ${fila('IRPF del año', euros.format(r.irpf.cuota), { nota: `Tipo medio sobre facturación: ${porcentaje(r.irpf.tipoMedio)}` })}
    ${fila('Ya retenido por tus clientes', `−${euros.format(r.irpf.retencionesSoportadas)}`)}
    ${fila('Declaración de la renta', rentaTexto, { total: true, clase: renta < 0 ? 'negativo' : '' })}

    <tr><th colspan="2">IVA — nunca fue tuyo</th></tr>
    ${fila('Repercutido a clientes', euros.format(r.iva.repercutido))}
    ${fila('Soportado en gastos', `−${euros.format(r.iva.soportado)}`)}
    ${fila(
      r.iva.aCompensar > 0 ? 'A compensar' : 'A ingresar en Hacienda',
      euros.format(r.iva.aCompensar > 0 ? r.iva.aCompensar : r.iva.aLiquidar),
      { total: true, nota: r.iva.aCompensar > 0 ? '' : `≈ ${euros.format(r.iva.trimestral)} cada trimestre` },
    )}

    <tr><th colspan="2">Resultado</th></tr>
    ${fila('Facturado sin IVA', euros.format(r.ingresos))}
    ${fila('Gastos', `−${euros.format(r.gastos)}`)}
    ${fila('Cuota de autónomos', `−${euros.format(r.reta.cuotaAnual)}`)}
    ${fila('IRPF', `−${euros.format(r.irpf.cuota)}`)}
    ${fila('Te queda', euros.format(r.resumen.netoAnual), { total: true })}
  `;

  if (tarifas.estado !== 'verificado') {
    document.getElementById('aviso-datos').hidden = false;
  }
}

/**
 * Pinta la unica superficie comercial del sitio. Se muestra debajo del
 * resultado, cuando el usuario ya ha visto su cifra y sabe que tiene un
 * problema: es el momento en que una recomendacion es util y no publicidad.
 */
function pintarRecomendacion(config) {
  if (!config?.activo || !config.opciones?.length) return;

  const seccion = document.getElementById('recomendacion');
  const tarjetas = config.opciones.map((o) => `
    <a class="opcion" href="${o.url}"${o.afiliado ? ' rel="sponsored noopener" target="_blank"' : ''}>
      <div class="nombre">${o.nombre}${o.afiliado ? '<span class="marca-afiliado">afiliado</span>' : ''}</div>
      <div class="gancho">${o.gancho}</div>
      <div class="para-quien">${o.para_quien}</div>
    </a>`).join('');

  seccion.innerHTML = `
    <h2>${config.titulo}</h2>
    <p>${config.entradilla}</p>
    <div class="opciones">${tarjetas}</div>
    <p class="descargo">${config.descargo}</p>`;
  seccion.hidden = false;
}

async function arrancar() {
  // Las recomendaciones son opcionales: si el archivo falta o esta
  // desactivado, la calculadora sigue funcionando igual.
  const [tarifas, afiliados] = await Promise.all([
    fetch('data/tarifas-2026.json').then((r) => r.json()),
    fetch('data/afiliados.json').then((r) => r.json()).catch(() => null),
  ]);

  const actualizar = () => pintar(calcular(leerFormulario(), tarifas), tarifas);
  formulario.addEventListener('input', actualizar);
  actualizar();
  pintarRecomendacion(afiliados);
}

arrancar().catch((error) => {
  console.error(error);
  document.getElementById('desglose').innerHTML =
    '<tr><td>No se han podido cargar las tarifas. Recarga la página.</td></tr>';
});
