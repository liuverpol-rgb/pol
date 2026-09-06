import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcular, buscarTramo, aplicarEscala, redondear } from '../web/js/calculadora.js';

const tarifas = JSON.parse(readFileSync(new URL('../web/data/tarifas-2026.json', import.meta.url)));

const base = {
  ingresos: 40000,
  gastos: 6000,
  tipoIva: 0.21,
  tipoIvaGastos: 0.21,
  gastosConIva: 6000,
  tipoRetencion: 0.15,
  porcentajeAEmpresas: 1,
};

test('la tabla de tramos cubre el eje sin huecos ni solapes', () => {
  const tramos = tarifas.reta.tramos;
  assert.equal(tramos.length, 15);
  assert.equal(tramos[0].desde, 0);
  assert.equal(tramos.at(-1).hasta, null);
  for (let i = 1; i < tramos.length; i++) {
    assert.equal(tramos[i].desde, tramos[i - 1].hasta, `hueco en el tramo ${i + 1}`);
  }
});

test('buscarTramo respeta los limites de cada intervalo', () => {
  const tramos = tarifas.reta.tramos;
  assert.equal(buscarTramo(0, tramos).tramo, 1);
  assert.equal(buscarTramo(670, tramos).tramo, 1, 'el limite superior pertenece al tramo inferior');
  assert.equal(buscarTramo(670.01, tramos).tramo, 2);
  assert.equal(buscarTramo(999999, tramos).tramo, 15);
  assert.equal(buscarTramo(-500, tramos).tramo, 1, 'un neto negativo cae en el primer tramo');
});

test('la escala progresiva grava cada tramo solo por su parte', () => {
  const escala = tarifas.irpf.escala;
  assert.equal(aplicarEscala(0, escala), 0);
  assert.equal(redondear(aplicarEscala(12450, escala)), redondear(12450 * 0.19));
  // 12.450 al 19% + los 7.750 siguientes al 24%
  assert.equal(redondear(aplicarEscala(20200, escala)), redondear(12450 * 0.19 + 7750 * 0.24));
});

test('el IVA nunca se cuenta como ingreso propio', () => {
  const r = calcular(base, tarifas);
  assert.equal(r.iva.repercutido, 8400);
  assert.equal(r.iva.aLiquidar, 8400 - 1260);
  assert.equal(r.iva.trimestral, redondear(r.iva.aLiquidar / 4));
  // El resultado neto se calcula sobre bases sin IVA.
  assert.equal(r.resumen.netoAnual, redondear(40000 - 6000 - r.reta.cuotaAnual - r.irpf.cuota));
});

test('los gastos de dificil justificacion topan en el limite legal', () => {
  const alto = calcular(base, tarifas);
  assert.equal(alto.irpf.gastosDificilJustificacion, 2000);

  const bajo = calcular({ ...base, ingresos: 14000, gastos: 1000 }, tarifas);
  assert.ok(bajo.irpf.gastosDificilJustificacion < 2000);
  assert.equal(
    bajo.irpf.gastosDificilJustificacion,
    redondear((14000 - 1000 - bajo.reta.cuotaAnual) * 0.07),
  );
});

test('la tarifa plana sustituye a la cuota del tramo sin cambiar el tramo', () => {
  const normal = calcular(base, tarifas);
  const plana = calcular({ ...base, tarifaPlana: true }, tarifas);
  assert.equal(plana.reta.tramo, normal.reta.tramo);
  assert.equal(plana.reta.cuotaMensual, tarifas.reta.tarifa_plana.cuota_mensual);
  assert.equal(plana.reta.cuotaMensualSinTarifaPlana, normal.reta.cuotaMensual);
  assert.ok(plana.resumen.netoAnual > normal.resumen.netoAnual);
});

test('las retenciones ya soportadas adelantan IRPF, no lo aumentan', () => {
  const con = calcular(base, tarifas);
  const sin = calcular({ ...base, tipoRetencion: 0 }, tarifas);
  assert.equal(con.irpf.cuota, sin.irpf.cuota, 'la retencion no cambia el impuesto debido');
  assert.equal(con.resumen.netoAnual, sin.resumen.netoAnual, 'ni el neto anual');
  assert.ok(con.irpf.resultadoRenta < sin.irpf.resultadoRenta, 'pero si lo que queda por pagar');
});

test('facturar solo a particulares no genera retenciones', () => {
  const r = calcular({ ...base, porcentajeAEmpresas: 0 }, tarifas);
  assert.equal(r.irpf.retencionesSoportadas, 0);
  assert.equal(r.irpf.resultadoRenta, r.irpf.cuota);
});

test('un ejercicio en perdidas no genera IRPF ni importes negativos', () => {
  const r = calcular({ ...base, ingresos: 5000, gastos: 9000, gastosConIva: 9000 }, tarifas);
  assert.equal(r.irpf.cuota, 0);
  assert.equal(r.irpf.baseImponible, 0);
  assert.equal(r.iva.aLiquidar, 0);
  assert.ok(r.iva.aCompensar > 0, 'el IVA soportado de mas queda a compensar');
  assert.ok(r.resumen.porcentajeAApartar >= 0);
});

test('sin ingresos todos los ratios son cero en vez de NaN', () => {
  const r = calcular({ ...base, ingresos: 0, gastos: 0, gastosConIva: 0 }, tarifas);
  for (const v of [r.resumen.tipoEfectivo, r.resumen.porcentajeAApartar, r.irpf.tipoMedio]) {
    assert.ok(Number.isFinite(v) && v === 0);
  }
});

test('entradas basura no rompen el calculo', () => {
  const r = calcular({ ingresos: 'x', gastos: null, tipoIva: undefined }, tarifas);
  assert.equal(r.ingresos, 0);
  assert.ok(Number.isFinite(r.resumen.netoAnual));
});

test('los gastos con IVA nunca superan el total de gastos', () => {
  const r = calcular({ ...base, gastosConIva: 99999 }, tarifas);
  assert.equal(r.iva.soportado, redondear(6000 * 0.21));
});

test('mas facturacion nunca reduce el neto anual (monotonia)', () => {
  let anterior = -Infinity;
  for (const ingresos of [10000, 20000, 30000, 50000, 80000, 120000]) {
    const r = calcular({ ...base, ingresos }, tarifas);
    assert.ok(r.resumen.netoAnual > anterior, `cae el neto al pasar a ${ingresos} EUR`);
    anterior = r.resumen.netoAnual;
  }
});
