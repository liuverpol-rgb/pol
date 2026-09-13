#!/usr/bin/env node
/**
 * Criba de nichos: descarta primero, puntua despues.
 *
 *   node dropshipping/nichos.mjs
 *   node dropshipping/nichos.mjs --todos      (ensena tambien los descartados)
 *   node dropshipping/nichos.mjs --json
 *
 * El orden importa. Un nicho con margen magnifico y una ley encima no es un
 * nicho: es una multa esperando. Asi que hay dos fases:
 *
 *   1. ELIMINATORIAS. Objetivas y calculables: si el fabricante esta fuera de
 *      la UE y nadie hace de persona responsable, la GPSR lo prohibe. Si la
 *      categoria exige registro propio (ElektroG, BattG, cosmeticos,
 *      juguetes, alimentos), la barrera de entrada supera el capital.
 *      Y si el beneficio por pedido no aguanta una devolucion, tampoco pasa.
 *
 *   2. PUNTUACION. Sobre los que sobreviven, y solo con lo que se puede
 *      medir sin mentir: beneficio real (lo calcula margen.mjs con las
 *      comisiones de verdad), diferenciacion, devoluciones, repeticion.
 *
 * Lo que este programa NO hace es estimarte la demanda. No la sabe. Al final
 * imprime exactamente que hay que ir a mirar y donde.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { desglosar, redondear } from './margen.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

/** Beneficio minimo por pedido para que el nicho merezca el trabajo. */
export const BENEFICIO_MINIMO = 4;

/**
 * Regimenes especiales por categoria de producto en Alemania.
 * `bloqueante` = la barrera de entrada no cabe en un capital de 50 EUR.
 */
export const REGULACIONES = {
  elektrog: {
    nombre: 'Aparatos electricos (ElektroG)',
    exige: 'registro en la Stiftung EAR antes de la primera venta, marca WEEE y tasas anuales',
    bloqueante: true,
  },
  battg: {
    nombre: 'Pilas y baterias (BattG)',
    exige: 'registro propio en la Stiftung EAR y sistema de recogida',
    bloqueante: true,
  },
  kosmetik: {
    nombre: 'Cosmeticos (VO 1223/2009)',
    exige: 'notificacion en el CPNP, evaluacion de seguridad y persona responsable',
    bloqueante: true,
  },
  spielzeug: {
    nombre: 'Juguetes (2009/48/EG)',
    exige: 'marcado CE, ensayos EN 71 y expediente tecnico',
    bloqueante: true,
  },
  lebensmittel: {
    nombre: 'Alimentos y complementos (LMIV)',
    exige: 'registro como empresa alimentaria y etiquetado completo',
    bloqueante: true,
  },
  medizin: {
    nombre: 'Producto sanitario (MDR)',
    exige: 'certificacion MDR. Meses y miles de euros',
    bloqueante: true,
  },
  psa: {
    nombre: 'Equipo de proteccion (PSA VO 2016/425)',
    exige: 'marcado CE con organismo notificado segun categoria',
    bloqueante: true,
  },
  textilkennz: {
    nombre: 'Textil (TextilKennzVO)',
    exige: 'indicar la composicion de fibras en el articulo y en el anuncio',
    bloqueante: false,
  },
  verpackg: {
    nombre: 'Envases (VerpackG)',
    exige: 'registro gratuito en LUCID y licencia del envase. Vale para CUALQUIER producto que se envie',
    bloqueante: false,
  },
};

/** Cada punto de este mapa cuesta o ahorra pedidos. Los pesos son juicio, no ciencia. */
const PESOS = {
  competencia: { baja: 3, media: 1, alta: -2, brutal: -5 },
  repeticion: { alta: 3, media: 2, baja: 1, nula: 0 },
};

export function cargarNichos(ruta = join(RAIZ, 'datos', 'nichos.json')) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

function plataformaDeReferencia() {
  const { plataformas } = JSON.parse(readFileSync(join(RAIZ, 'datos', 'plataformas.json'), 'utf8'));
  // Etsy como referencia: es la plataforma donde el trafico no lo pagas tu,
  // asi que es la unica donde un nicho se puede probar con 50 EUR.
  return plataformas.find((p) => p.id === 'etsy') ?? plataformas[0];
}

/** Convierte un nicho en la ficha de producto que entiende margen.mjs. */
export function productoDeNicho(n) {
  return {
    nombre: n.nombre,
    precioVenta: n.precioVentaTipico,
    envioCobrado: n.envioCobradoTipico ?? 0,
    costeGenero: n.costeGeneroTipico,
    costeEnvio: n.costeEnvioTipico,
    licenciaEnvase: n.licenciaEnvaseTipica ?? 0.1,
    tasaDevolucion: n.tasaDevolucionTipica ?? 0.06,
    recuperacionDevolucion: n.personalizable ? 0 : 0.5,
  };
}

/**
 * Aplica las eliminatorias. Devuelve la lista de motivos de descarte; vacia
 * significa que el nicho pasa.
 */
export function motivosDeDescarte(nicho, beneficio) {
  const motivos = [];

  if (nicho.fabricante === 'extra-ue' && !nicho.personaResponsableUE) {
    motivos.push(
      'GPSR: fabricante fuera de la UE y sin persona responsable en la UE. No se puede poner en el mercado.',
    );
  }
  for (const clave of nicho.regulaciones ?? []) {
    const r = REGULACIONES[clave];
    if (!r) motivos.push(`Regulacion desconocida en la ficha: ${clave}`);
    else if (r.bloqueante) motivos.push(`${r.nombre}: ${r.exige}.`);
  }
  if (beneficio <= 0) {
    motivos.push('Pierdes dinero en cada pedido al precio tipico del nicho.');
  } else if (beneficio < BENEFICIO_MINIMO) {
    motivos.push(
      `Solo ${redondear(beneficio).toFixed(2).replace('.', ',')} € por pedido: no aguanta una devolucion.`,
    );
  }
  if (!nicho.personalizable && ['alta', 'brutal'].includes(nicho.competencia)) {
    motivos.push(
      'Producto identico al de todos y competencia alta: la unica palanca seria el precio, y ahi gana Amazon.',
    );
  }
  return motivos;
}

/** Puntua un nicho que ya paso las eliminatorias. */
export function puntuar(nicho, beneficio) {
  const detalle = [];
  const sumar = (puntos, razon) => {
    if (puntos) detalle.push({ puntos, razon });
    return puntos;
  };

  let total = 0;
  // El beneficio manda: un punto por euro que queda en el bolsillo.
  total += sumar(Math.round(beneficio), `${redondear(beneficio).toFixed(2).replace('.', ',')} € por pedido`);
  total += sumar(nicho.personalizable ? 3 : 0, 'personalizable: no compites por precio');
  total += sumar(PESOS.competencia[nicho.competencia] ?? 0, `competencia ${nicho.competencia}`);
  total += sumar(PESOS.repeticion[nicho.repeticion] ?? 0, `repeticion de compra ${nicho.repeticion}`);
  total += sumar(
    (nicho.tasaDevolucionTipica ?? 0.06) <= 0.04 ? 2 : (nicho.tasaDevolucionTipica ?? 0) >= 0.15 ? -3 : 0,
    `devoluciones al ${((nicho.tasaDevolucionTipica ?? 0.06) * 100).toFixed(0)} %`,
  );
  total += sumar(nicho.fragil ? -2 : 0, 'fragil: roturas en transito');
  total += sumar(nicho.estacional ? -2 : 0, 'estacional: se vende en dos meses del ano');
  total += sumar(nicho.conocimientoLocal ? 2 : 0, 'juegas en casa: sabes del tema o de la zona');
  return { total, detalle };
}

export function evaluar(nichos, plataforma, fiscal = { kleinunternehmer: true }) {
  return nichos.map((n) => {
    const { beneficio, margen } = desglosar(productoDeNicho(n), plataforma, fiscal);
    const motivos = motivosDeDescarte(n, beneficio);
    const nota = motivos.length ? { total: 0, detalle: [] } : puntuar(n, beneficio);
    return { nicho: n, beneficio, margen, motivos, ...nota };
  });
}

// ── Presentacion ────────────────────────────────────────────────────────────

const eur = (n) => `${redondear(n).toFixed(2).replace('.', ',')} €`;

function main() {
  const args = process.argv.slice(2);
  const { nichos, _verificado } = cargarNichos();
  const plataforma = plataformaDeReferencia();
  const evaluados = evaluar(nichos, plataforma);
  const pasan = evaluados.filter((e) => !e.motivos.length).sort((a, b) => b.total - a.total);
  const fuera = evaluados.filter((e) => e.motivos.length);

  if (args.includes('--json')) {
    console.log(JSON.stringify({ pasan, fuera }, null, 2));
    return;
  }

  console.log(`\n\x1b[1mCriba de nichos\x1b[0m — ${nichos.length} candidatos, margenes calculados en ${plataforma.nombre}`);
  if (_verificado !== true) {
    console.log(
      '\x1b[33mLos datos de competencia y precio tipico de nichos.json son estimaciones propias, sin contrastar.\x1b[0m',
    );
  }

  console.log(`\n\x1b[1m✗ Descartados (${fuera.length})\x1b[0m`);
  for (const e of fuera) {
    console.log(`\n  ${e.nicho.nombre}`);
    for (const m of e.motivos) console.log(`    · ${m}`);
  }

  console.log(`\n\x1b[1m✓ Pasan la criba (${pasan.length})\x1b[0m`);
  for (const [i, e] of pasan.entries()) {
    const marca = i === 0 ? '\x1b[32m→\x1b[0m' : ' ';
    console.log(`\n${marca} ${e.total} puntos · ${e.nicho.nombre} · ${eur(e.beneficio)} por pedido`);
    console.log(`    ${e.detalle.map((d) => `${d.puntos > 0 ? '+' : ''}${d.puntos} ${d.razon}`).join(' · ')}`);
    if (e.nicho.notas) console.log(`    ${e.nicho.notas}`);
  }

  console.log(`
\x1b[1mLo que este programa no sabe: si alguien lo busca.\x1b[0m
Antes de elegir, media hora por nicho y anotalo en su ficha:

  1. Etsy, buscando el termino en aleman: cuantos resultados salen y, de los
     diez primeros, cuantos tienen mas de 100 ventas. Muchos resultados con
     pocas ventas = nadie compra. Pocos resultados con muchas ventas = tu sitio.
  2. eBay, con el filtro "Verkauft" (vendidos): es el unico dato publico de
     ventas reales con fecha que existe. Cuenta las de los ultimos 30 dias.
  3. Google Trends con la palabra en aleman, 5 anos: te dice si es estacional
     y si sube o baja.
  4. Mira las 20 reseñas de una estrella de los que ya venden. Ahi esta escrito
     el producto que falta.

El nicho que gana no es el que mas puntua aqui: es el que puntua bien Y tiene
demanda demostrada en los pasos 1 y 2.
`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
