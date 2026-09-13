#!/usr/bin/env node
/**
 * Puntua la ficha de Google de un negocio y saca la hoja que se le ensena.
 *
 *   node fichas-google/auditar.mjs                    resumen de todos
 *   node fichas-google/auditar.mjs salon-schoenmeier  detalle de uno
 *   node fichas-google/auditar.mjs salon-schoenmeier --html
 *   node fichas-google/auditar.mjs --todos --html
 *   node fichas-google/auditar.mjs --json
 *
 * La nota se calcula SOLO sobre lo que has mirado de verdad. Un criterio en
 * null no vale cero: vale "sin comprobar", sale aparte y no toca la nota.
 *
 * Esa distincion es todo el negocio. Ensenarle a un duenno una hoja que dice
 * que le faltan las fotos cuando no has mirado las fotos es la forma mas
 * rapida de que te eche, y con razon. Lo que no sabes se pregunta o se mira;
 * no se rellena.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHoja } from './plantilla/render.mjs';

const RAIZ = dirname(fileURLToPath(import.meta.url));

/** Por debajo de esta nota la hoja se defiende sola delante del duenno. */
export const NOTA_FLOJA = 60;

export function cargarCriterios(ruta = join(RAIZ, 'datos', 'criterios.json')) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

export function cargarOferta(ruta = join(RAIZ, 'datos', 'oferta.json')) {
  return JSON.parse(readFileSync(ruta, 'utf8'));
}

/**
 * Reparte los criterios en tres cestas segun lo que diga la ficha:
 * true cumple, false falta, null o ausente es que no lo has mirado.
 */
export function puntuar(negocio, { criterios }) {
  const marcas = negocio.criterios ?? {};
  const bien = [];
  const faltan = [];
  const sinComprobar = [];

  for (const criterio of criterios) {
    const marca = marcas[criterio.id];
    if (marca === true) bien.push(criterio);
    else if (marca === false) faltan.push(criterio);
    else sinComprobar.push(criterio);
  }

  const suma = (lista) => lista.reduce((total, c) => total + c.peso, 0);
  const obtenidos = suma(bien);
  const posibles = obtenidos + suma(faltan);

  faltan.sort((a, b) => b.peso - a.peso);

  return {
    bien,
    faltan,
    sinComprobar,
    obtenidos,
    posibles,
    // Sin nada comprobado no hay nota. No es cero: es que no se sabe.
    nota: posibles ? Math.round((obtenidos / posibles) * 100) : null,
    // El tiempo que te va a costar dejarlo hecho. Es lo que justifica el precio.
    minutos: faltan.reduce((total, c) => total + c.minutos, 0),
    // Sin perfil reclamado lo demas no se puede tocar, por bien que puntue.
    bloqueado: marcas.reclamado === false,
    completa: sinComprobar.length === 0,
  };
}

/** Lo que hay que ir a mirar, en el orden en que se mira desde el movil. */
export function pendientes(resultado) {
  return resultado.sinComprobar.map((c) => `${c.id} — ${c.mira}`);
}

export function cargarNegocios(dir = join(RAIZ, 'negocios')) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [basename(f, '.json'), JSON.parse(readFileSync(join(dir, f), 'utf8'))]);
}

function barra(nota) {
  if (nota === null) return '··········';
  const llenos = Math.round(nota / 10);
  return '█'.repeat(llenos) + '·'.repeat(10 - llenos);
}

function escribirHoja(id, negocio, resultado, datos, oferta) {
  const dir = join(RAIZ, 'hojas');
  mkdirSync(dir, { recursive: true });
  const ruta = join(dir, `${id}.html`);
  writeFileSync(ruta, renderHoja({ negocio, resultado, grupos: datos.grupos, oferta }));
  return ruta;
}

function detalle(id, negocio, resultado, oferta) {
  const lineas = [];
  lineas.push(`\n${negocio.nombre}${negocio.ciudad ? ` — ${negocio.ciudad}` : ''}`);
  lineas.push(`Comprobado: ${negocio.comprobado || 'NUNCA — mira la ficha antes de usar esto'}`);
  lineas.push(`Nota: ${resultado.nota === null ? 'sin datos' : `${resultado.nota}/100`}  ${barra(resultado.nota)}`);

  if (resultado.bloqueado) {
    lineas.push('\n⚠️  EL PERFIL NO ESTA RECLAMADO. Eso va primero y lo tiene que hacer el duenno.');
  }

  if (resultado.faltan.length) {
    lineas.push(`\nFalta (${resultado.faltan.length}, ${resultado.minutos} min de trabajo):`);
    for (const c of resultado.faltan) {
      lineas.push(`  ${String(c.peso).padStart(2)} pts  ${c.titulo}`);
      lineas.push(`         → ${c.arreglo}`);
    }
  }

  if (resultado.bien.length) {
    lineas.push(`\nYa esta bien (${resultado.bien.length}):`);
    for (const c of resultado.bien) lineas.push(`  ${String(c.peso).padStart(2)} pts  ${c.titulo}`);
  }

  if (resultado.sinComprobar.length) {
    lineas.push(`\nSin comprobar (${resultado.sinComprobar.length}) — esto es lo que te queda por mirar:`);
    for (const linea of pendientes(resultado)) lineas.push(`  · ${linea}`);
  }

  const [einrichtung] = oferta.paquetes;
  lineas.push(`\nPrecio: ${einrichtung.precio} ${oferta.moneda} (${einrichtung.horas}).`);
  return lineas.join('\n');
}

function resumen(fichas, datos) {
  const filas = fichas
    .map(([id, negocio]) => [id, negocio, puntuar(negocio, datos)])
    .sort((a, b) => (a[2].nota ?? 999) - (b[2].nota ?? 999));

  console.log('\nFichas de Google auditadas:\n');
  for (const [id, negocio, r] of filas) {
    const nota = r.nota === null ? ' --' : String(r.nota).padStart(3);
    const estado = r.completa ? '' : `  (${r.sinComprobar.length} sin comprobar)`;
    console.log(`  ${nota}/100 ${barra(r.nota)}  ${id.padEnd(30)} ${negocio.nombre}${estado}`);
  }

  const sinMirar = filas.filter(([, , r]) => r.nota === null).length;
  if (sinMirar) {
    console.log(`\n${sinMirar} sin mirar todavia. Se miran desde el movil en Google Maps, unos 10 minutos cada una.`);
  }
  console.log('\nDetalle de una:  node fichas-google/auditar.mjs <id>');
  console.log('Hoja del duenno: node fichas-google/auditar.mjs <id> --html');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const html = args.includes('--html');
  const json = args.includes('--json');
  const todos = args.includes('--todos');
  const id = args.find((a) => !a.startsWith('--'));

  const datos = cargarCriterios();
  const oferta = cargarOferta();
  const fichas = cargarNegocios();

  if (!fichas.length) {
    console.error('No hay ninguna ficha en fichas-google/negocios/.');
    console.error('Creala con: node fichas-google/nueva-auditoria.mjs --todos');
    process.exit(1);
  }

  if (json) {
    const salida = fichas.map(([i, n]) => ({ id: i, nombre: n.nombre, ...puntuar(n, datos) }));
    console.log(JSON.stringify(salida, null, 2));
  } else if (todos && html) {
    for (const [i, negocio] of fichas) {
      const resultado = puntuar(negocio, datos);
      if (!resultado.posibles) {
        console.log(`· ${i} sin comprobar todavia, no se escribe hoja`);
        continue;
      }
      console.log(`✓ ${escribirHoja(i, negocio, resultado, datos, oferta)}`);
    }
  } else if (id) {
    const encontrada = fichas.find(([i]) => i === id);
    if (!encontrada) {
      console.error(`No hay ficha "${id}". Hay: ${fichas.map(([i]) => i).join(', ')}`);
      process.exit(1);
    }
    const [, negocio] = encontrada;
    const resultado = puntuar(negocio, datos);
    if (html) {
      if (!resultado.posibles) {
        console.error(`${negocio.nombre}: no has comprobado ni un criterio todavia.`);
        console.error('Una hoja llena de suposiciones delante del duenno te hunde. Mira la ficha primero:');
        console.error(pendientes(resultado).map((l) => `  · ${l}`).join('\n'));
        process.exit(1);
      }
      console.log(`✓ ${escribirHoja(id, negocio, resultado, datos, oferta)}`);
      if (!resultado.completa) {
        console.log(`  ${resultado.sinComprobar.length} criterios salen marcados como no comprobados en la hoja.`);
      }
    } else {
      console.log(detalle(id, negocio, resultado, oferta));
    }
  } else {
    resumen(fichas, datos);
  }
}
