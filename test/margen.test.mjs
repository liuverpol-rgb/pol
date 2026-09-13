import test from 'node:test';
import assert from 'node:assert/strict';
import {
  desglosar,
  precioEquilibrio,
  precioParaBeneficio,
  redondear,
} from '../dropshipping/margen.mjs';

/** Caso base: camiseta de print-on-demand vendida en Etsy. */
const CAMISETA = {
  nombre: 'Camiseta',
  precioVenta: 24.9,
  envioCobrado: 3.9,
  costeGenero: 12.5,
  costeEnvio: 4.79,
  licenciaEnvase: 0.08,
  tasaDevolucion: 0.08,
  recuperacionDevolucion: 0,
};

const ETSY = {
  nombre: 'Etsy',
  comision: 0.065,
  comisionSobreEnvio: true,
  comisionPago: 0.04,
  fijoPago: 0.3,
  costeListado: 0.18,
  reverseCharge: true,
};

const cerca = (a, b, tol = 0.01) =>
  assert.ok(Math.abs(a - b) <= tol, `${a} deberia estar a menos de ${tol} de ${b}`);

test('redondear quita el ruido binario de los flotantes', () => {
  assert.equal(redondear(0.1 + 0.2), 0.3);
  assert.equal(redondear(1.005), 1.01);
  assert.equal(redondear(-0), 0);
});

test('la comision se calcula sobre el bruto CON envio cuando la plataforma lo hace asi', () => {
  const conEnvio = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  const sinEnvio = desglosar(CAMISETA, { ...ETSY, comisionSobreEnvio: false }, { kleinunternehmer: true });
  // La diferencia es exactamente el 6,5 % del envio, con el recargo del reverse charge.
  cerca(conEnvio.comisiones - sinEnvio.comisiones, 3.9 * 0.065 * 1.19, 0.001);
  assert.ok(conEnvio.beneficio < sinEnvio.beneficio);
});

test('el Kleinunternehmer no repercute IVA pero tampoco deduce el soportado', () => {
  const kl = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  const gen = desglosar(CAMISETA, ETSY, { kleinunternehmer: false });

  assert.equal(kl.iva, 0, 'no repercute IVA');
  cerca(gen.iva, 28.8 * (0.19 / 1.19));
  // Paga el genero con IVA incluido; en regimen general la base es sin IVA.
  assert.equal(kl.costeGenero, 12.5);
  cerca(gen.costeGenero, 12.5 / 1.19);
  // Aun asi le queda mas: el IVA no repercutido pesa mas que la deduccion perdida.
  assert.ok(kl.beneficio > gen.beneficio);
});

test('el reverse charge encarece las comisiones solo al Kleinunternehmer', () => {
  const conRc = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  const sinRc = desglosar(CAMISETA, { ...ETSY, reverseCharge: false }, { kleinunternehmer: true });
  cerca(conRc.comisiones, sinRc.comisiones * 1.19, 0.001);

  // En regimen general se declara y se deduce: no cambia nada.
  const gen = desglosar(CAMISETA, ETSY, { kleinunternehmer: false });
  const genSinRc = desglosar(CAMISETA, { ...ETSY, reverseCharge: false }, { kleinunternehmer: false });
  assert.equal(gen.comisiones, genSinRc.comisiones);
});

test('el desglose cuadra: lo que cobras menos todo lo que sale es el beneficio de la venta', () => {
  const d = desglosar(CAMISETA, ETSY, { kleinunternehmer: false });
  cerca(
    d.bruto - d.iva - d.comisiones - d.costeGenero - d.costeEnvio - d.licenciaEnvase,
    d.beneficioVenta,
    0.0001,
  );
});

test('la devolucion es el riesgo principal, no un detalle', () => {
  const sin = desglosar({ ...CAMISETA, tasaDevolucion: 0 }, ETSY, { kleinunternehmer: true });
  const con = desglosar({ ...CAMISETA, tasaDevolucion: 0.2 }, ETSY, { kleinunternehmer: true });

  assert.equal(sin.beneficio, sin.beneficioVenta, 'sin devoluciones, el esperado es la venta');
  assert.ok(con.beneficio < sin.beneficio * 0.6, 'un 20 % de devoluciones se lleva mas del 40 %');
  // Con todo devuelto solo queda la perdida.
  const todo = desglosar({ ...CAMISETA, tasaDevolucion: 1 }, ETSY, { kleinunternehmer: true });
  cerca(todo.beneficio, -todo.perdidaDevolucion, 0.0001);
});

test('poder revender lo devuelto reduce la perdida; un articulo impreso no se revende', () => {
  const impreso = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  const revendible = desglosar({ ...CAMISETA, recuperacionDevolucion: 1 }, ETSY, { kleinunternehmer: true });
  cerca(impreso.perdidaDevolucion - revendible.perdidaDevolucion, 12.5, 0.0001);
});

test('precioEquilibrio deja el beneficio esperado en cero', () => {
  for (const kleinunternehmer of [true, false]) {
    const fiscal = { kleinunternehmer };
    const precio = precioEquilibrio(CAMISETA, ETSY, fiscal);
    const d = desglosar({ ...CAMISETA, precioVenta: precio }, ETSY, fiscal);
    cerca(d.beneficio, 0);
  }
});

test('precioParaBeneficio es el inverso exacto de desglosar', () => {
  const variantes = [
    [CAMISETA, ETSY],
    [CAMISETA, { ...ETSY, comisionSobreEnvio: false }],
    [CAMISETA, { ...ETSY, comisionPagoReembolsable: true }],
    [{ ...CAMISETA, envioCobrado: 0, tasaDevolucion: 0.15, envioRetornoAsumido: 3.5 }, ETSY],
    [{ ...CAMISETA, unidades: 3 }, ETSY],
    [{ ...CAMISETA, tasaDevolucion: 0 }, { ...ETSY, comision: 0.11, comisionPago: 0, costeListado: 0 }],
  ];
  for (const [producto, plataforma] of variantes) {
    for (const kleinunternehmer of [true, false]) {
      for (const objetivo of [0, 5, 25]) {
        const fiscal = { kleinunternehmer };
        const precio = precioParaBeneficio(objetivo, producto, plataforma, fiscal);
        const d = desglosar({ ...producto, precioVenta: precio }, plataforma, fiscal);
        cerca(d.beneficio, objetivo, 0.02);
      }
    }
  }
});

test('si los porcentajes se comen el pedido entero, no hay precio que lo salve', () => {
  const imposible = { ...ETSY, comision: 0.8, comisionPago: 0.3 };
  assert.equal(precioParaBeneficio(10, CAMISETA, imposible, { kleinunternehmer: false }), Infinity);
  // Y una tasa de devolucion del 100 % tampoco tiene solucion.
  assert.equal(
    precioParaBeneficio(10, { ...CAMISETA, tasaDevolucion: 1 }, ETSY, { kleinunternehmer: true }),
    Infinity,
  );
});

test('pedidosPara redondea hacia arriba y avisa cuando nunca se llega', () => {
  const d = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  assert.equal(d.pedidosPara(d.beneficio * 3 + 0.01), 4);
  const perdida = desglosar({ ...CAMISETA, precioVenta: 5 }, ETSY, { kleinunternehmer: true });
  assert.ok(perdida.beneficio < 0);
  assert.equal(perdida.pedidosPara(300), Infinity);
});

test('las entradas basura no revientan el calculo', () => {
  const d = desglosar({}, {}, {});
  assert.equal(d.bruto, 0);
  assert.equal(d.margen, 0);
  const negativo = desglosar({ precioVenta: -50, costeGenero: -10 }, ETSY, {});
  assert.equal(negativo.bruto, 0);
  assert.ok(Number.isFinite(negativo.beneficio));
  // Una tasa fuera de rango se recorta a [0,1] en vez de propagar el disparate.
  const recortada = desglosar({ ...CAMISETA, tasaDevolucion: 7 }, ETSY, {});
  assert.equal(recortada.beneficio, -recortada.perdidaDevolucion);
});

test('mas unidades por pedido reparten el coste fijo y suben el beneficio por pedido', () => {
  const una = desglosar(CAMISETA, ETSY, { kleinunternehmer: true });
  const tres = desglosar({ ...CAMISETA, unidades: 3 }, ETSY, { kleinunternehmer: true });
  assert.ok(tres.beneficio > una.beneficio * 3);
});
