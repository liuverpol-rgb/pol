#!/usr/bin/env node
/**
 * Que te queda de verdad de cada pedido, plataforma por plataforma.
 *
 *   node dropshipping/calcular.mjs camiseta-algodon
 *   node dropshipping/calcular.mjs --todos
 *   node dropshipping/calcular.mjs camiseta-algodon --objetivo 500
 *   node dropshipping/calcular.mjs camiseta-algodon --beneficio 8
 *
 * --objetivo  cuanto quieres ganar al mes (por defecto 300 EUR)
 * --beneficio precio de venta que haria falta para ganar ESE margen por pedido
 *
 * Lee las fichas de productos/ y las comisiones de datos/plataformas.json.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { desglosar, precioEquilibrio, precioParaBeneficio, redondear } from './margen.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const eur = (n) => (Number.isFinite(n) ? `${redondear(n).toFixed(2).replace('.', ',')} €` : '—');
const pct = (n) => `${(n * 100).toFixed(1).replace('.', ',')} %`;
/** Un coste, con el signo puesto solo si de verdad resta algo. */
const menos = (n) => (redondear(n) === 0 ? eur(0) : `-${eur(n)}`);

/** Margen por debajo del cual el pedido no paga el trabajo de atenderlo. */
const MARGEN_MINIMO = 0.15;
const BENEFICIO_MINIMO = 4;

function cargarPlataformas() {
  const ruta = join(RAIZ, 'datos', 'plataformas.json');
  const { plataformas, _verificado } = JSON.parse(readFileSync(ruta, 'utf8'));
  return { plataformas, verificado: _verificado === true };
}

function cargarProducto(id) {
  const ruta = id.endsWith('.json') ? id : join(RAIZ, 'productos', `${id}.json`);
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

function tabla(filas) {
  const anchos = filas[0].map((_, i) => Math.max(...filas.map((f) => String(f[i]).length)));
  return filas
    .map((f, n) => {
      const linea = f
        .map((c, i) => (i === 0 ? String(c).padEnd(anchos[i]) : String(c).padStart(anchos[i])))
        .join('  ');
      return n === 0 ? `${linea}\n${anchos.map((a) => '─'.repeat(a)).join('  ')}` : linea;
    })
    .join('\n');
}

function informe(producto, plataformas, opciones) {
  const { objetivo, beneficioPedido } = opciones;
  console.log(`\n\x1b[1m${producto.nombre}\x1b[0m`);
  const partes = [
    `venta ${eur(producto.precioVenta)}`,
    producto.envioCobrado ? `+ envio ${eur(producto.envioCobrado)}` : 'envio incluido',
    `coste ${eur(producto.costeGenero)} + ${eur(producto.costeEnvio)} de envio`,
    `devoluciones ${pct(producto.tasaDevolucion ?? 0.05)}`,
  ];
  console.log(`  ${partes.join(' · ')}`);
  if (producto.proveedor) console.log(`  proveedor: ${producto.proveedor}`);

  const filas = [['Plataforma', 'Regimen', 'Te queda', 'Margen', `Pedidos/${objetivo} €`, 'Equilibrio']];
  const resultados = [];
  for (const pl of plataformas) {
    for (const kleinunternehmer of [true, false]) {
      const fiscal = { kleinunternehmer };
      const d = desglosar(producto, pl, fiscal);
      resultados.push({ pl, kleinunternehmer, d });
      const pedidos = d.pedidosPara(objetivo);
      filas.push([
        pl.nombre,
        kleinunternehmer ? 'Kleinunt.' : 'IVA normal',
        eur(d.beneficio),
        pct(d.margen),
        Number.isFinite(pedidos) ? String(pedidos) : 'nunca',
        eur(precioEquilibrio(producto, pl, fiscal)),
      ]);
    }
  }
  console.log(`\n${tabla(filas)}`);

  const mejor = resultados.reduce((a, b) => (b.d.beneficio > a.d.beneficio ? b : a));
  const d = mejor.d;
  console.log(`\n  Desglose en ${mejor.pl.nombre} (${mejor.kleinunternehmer ? 'Kleinunternehmer' : 'IVA normal'}):`);
  console.log(
    tabla([
      ['  Concepto', 'Importe'],
      ['  Cobras al cliente', eur(d.bruto)],
      ['  IVA al Finanzamt', menos(d.iva)],
      ['  Comisiones de plataforma y pago', menos(d.comisiones)],
      ['  Genero al proveedor', menos(d.costeGenero)],
      ['  Envio que pagas tu', menos(d.costeEnvio)],
      ['  Licencia de envase (VerpackG)', menos(d.licenciaEnvase)],
      ['  Si nadie devuelve', eur(d.beneficioVenta)],
      ['  Cada devolucion te cuesta', menos(d.perdidaDevolucion)],
      ['  Te queda por pedido (media)', eur(d.beneficio)],
    ]),
  );

  if (beneficioPedido != null) {
    const precio = precioParaBeneficio(beneficioPedido, producto, mejor.pl, {
      kleinunternehmer: mejor.kleinunternehmer,
    });
    console.log(
      `\n  Para ganar ${eur(beneficioPedido)} por pedido en ${mejor.pl.nombre} tendrias que vender a ${eur(precio)}` +
        ` (ahora ${eur(producto.precioVenta)}).`,
    );
  }

  const avisos = [];
  if (d.beneficio <= 0) {
    avisos.push('Pierdes dinero en cada pedido. Con este coste y este precio no hay negocio, hay una donacion.');
  } else if (d.beneficio < BENEFICIO_MINIMO) {
    avisos.push(
      `Menos de ${eur(BENEFICIO_MINIMO)} por pedido: una sola devolucion se come ${Math.ceil(d.perdidaDevolucion / d.beneficio)} ventas.`,
    );
  }
  if (d.margen > 0 && d.margen < MARGEN_MINIMO) {
    avisos.push(`Margen del ${pct(d.margen)}: por debajo del ${pct(MARGEN_MINIMO)} no absorbe ni una subida de tarifas del proveedor.`);
  }
  if (d.perdidaDevolucion > d.beneficio * 3) {
    avisos.push('La devolucion cuesta mas de tres ventas. Cuida la talla, la foto y la descripcion: ahi se decide esto.');
  }
  if (avisos.length) console.log(`\n  \x1b[33m⚠\x1b[0m ${avisos.join('\n  ⚠ ')}`);
  return d;
}

function main() {
  const args = process.argv.slice(2);
  const leer = (bandera) => {
    const i = args.indexOf(bandera);
    return i >= 0 ? Number(args[i + 1]) : null;
  };
  const objetivo = leer('--objetivo') ?? 300;
  const beneficioPedido = leer('--beneficio');
  const ids = args.filter((a) => !a.startsWith('--') && !/^[\d.]+$/.test(a));

  const { plataformas, verificado } = cargarPlataformas();
  if (!verificado) {
    console.log(
      '\x1b[33mLas comisiones de datos/plataformas.json estan sin contrastar.\x1b[0m Verificalas antes de fijar precios.',
    );
  }

  const lista =
    args.includes('--todos') || ids.length === 0
      ? readdirSync(join(RAIZ, 'productos'))
          .filter((f) => f.endsWith('.json'))
          .map((f) => basename(f, '.json'))
      : ids;

  for (const id of lista) informe(cargarProducto(id), plataformas, { objetivo, beneficioPedido });
  console.log(
    '\nRecuerda: esto calcula el margen, no la demanda. Un margen excelente en un producto que nadie busca vale cero.\n',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
