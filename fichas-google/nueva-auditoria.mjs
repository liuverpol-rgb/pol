#!/usr/bin/env node
/**
 * Crea la ficha de auditoria de un negocio desde prospectos.csv.
 *
 *   node fichas-google/nueva-auditoria.mjs salon-schoenmeier
 *   node fichas-google/nueva-auditoria.mjs --todos
 *
 * Sale con los 19 criterios en null, o sea "sin comprobar". Eso NO es
 * pereza del programa: yo no puedo abrir Google Maps desde aqui, y aunque
 * pudiera, el estado de la ficha de un negocio real cambia cada semana.
 *
 * Lo rellenas tu, desde el movil, en unos diez minutos por negocio:
 *
 *   node fichas-google/auditar.mjs <id>     te lista que mirar y donde
 *
 * Los mismos prospectos que webs-locales/. Es deliberado: la auditoria de
 * la ficha y la web se venden en la misma visita, al mismo duenno.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const CSV = join(RAIZ, '..', 'webs-locales', 'contacto', 'prospectos.csv');
const CRITERIOS = JSON.parse(readFileSync(join(RAIZ, 'datos', 'criterios.json'), 'utf8')).criterios;

function leerCsv(ruta) {
  const [cabecera, ...lineas] = readFileSync(ruta, 'utf8').trim().split('\n');
  const campos = cabecera.split(';').map((c) => c.trim());
  return lineas.filter(Boolean).map((linea) => {
    const valores = linea.split(';');
    return Object.fromEntries(campos.map((c, i) => [c, (valores[i] || '').trim()]));
  });
}

export function fichaEnBlanco(p) {
  return {
    _nota: 'Los criterios estan en null = sin comprobar. Se miran uno a uno en Google Maps desde el movil y se ponen a true o false. Un criterio en null no cuenta para la nota y sale aparte en la hoja del cliente.',
    id: p.id,
    nombre: p.name,
    ciudad: p.ort || '',
    telefono: p.telefon || '',
    gremio: p.branche || '',
    propuesta_de: '[dein Name]',
    comprobado: null,
    perfil_url: '',
    categoria_actual: '',
    resenas: { cantidad: null, nota: null },
    criterios: Object.fromEntries(CRITERIOS.map((c) => [c.id, null])),
    notas: '',
  };
}

function crear(p, { sobrescribir = false } = {}) {
  const destino = join(RAIZ, 'negocios', `${p.id}.json`);
  if (existsSync(destino) && !sobrescribir) {
    console.log(`· ${p.id} existe ya — no se toca`);
    return;
  }
  mkdirSync(join(RAIZ, 'negocios'), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(fichaEnBlanco(p), null, 2)}\n`);
  console.log(`✓ ${p.name} → negocios/${p.id}.json`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const prospectos = leerCsv(CSV);
  const arg = process.argv[2];

  if (arg === '--todos') {
    prospectos.forEach((p) => crear(p));
    console.log('\nAhora abre Google Maps en el movil y ve marcando:');
    console.log('  node fichas-google/auditar.mjs <id>');
  } else if (arg) {
    const p = prospectos.find((x) => x.id === arg);
    if (!p) {
      console.error(`No hay ningún prospecto con id "${arg}" en prospectos.csv.`);
      console.error(`Disponibles: ${prospectos.map((x) => x.id).join(', ')}`);
      process.exit(1);
    }
    crear(p, { sobrescribir: process.argv.includes('--force') });
  } else {
    console.error(`Uso:
  node fichas-google/nueva-auditoria.mjs <id>      crea la auditoria de ese prospecto
  node fichas-google/nueva-auditoria.mjs --todos   crea las que falten`);
    process.exit(1);
  }
}
