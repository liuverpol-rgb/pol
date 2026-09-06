#!/usr/bin/env node
/**
 * Crea la ficha de un negocio a partir de su fila en prospectos.csv.
 *
 *   node webs-locales/nueva-ficha.mjs salon-schoenmeier
 *   node webs-locales/nueva-ficha.mjs --todos
 *
 * Rellena lo que ya sabemos (nombre, telefono, ciudad, direccion) y deja
 * una base de servicios tipica del gremio, TODA marcada con [bestätigen].
 *
 * Esos marcadores son deliberados: son negocios reales y no se les puede
 * atribuir un servicio, un precio ni un horario que no hayan dicho. Se
 * preguntan en la llamada y se sustituyen antes de ensenar nada.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const C = '[bestätigen]';

/** Horarios y servicios habituales de cada gremio. Todo por confirmar. */
const GREMIOS = {
  friseur: {
    emoji: '💇', schema: 'HairSalon', acento: '#8a4a6d',
    horario: { montag: [], dienstag: [['09:00', '18:00']], mittwoch: [['09:00', '18:00']], donnerstag: [['09:00', '20:00']], freitag: [['09:00', '18:00']], samstag: [['08:00', '14:00']], sonntag: [] },
    secciones: [{ titulo: 'Leistungen & Preise', items: [
      { nombre: 'Waschen, Schneiden, Föhnen — Damen', precio: `${C} €` },
      { nombre: 'Herrenhaarschnitt', precio: `${C} €` },
      { nombre: 'Kinder bis 12 Jahre', precio: `${C} €` },
      { nombre: 'Färben / Strähnen', precio: `ab ${C} €` },
    ] }],
    jobs: { puestos: [{ titulo: 'Friseur/in (m/w/d)', tipo: 'Voll- oder Teilzeit' }, { titulo: 'Auszubildende (m/w/d)', tipo: 'Ausbildung' }] },
  },
  physio: {
    emoji: '🤲', schema: 'Physiotherapy', acento: '#1f6f6b',
    horario: { montag: [['08:00', '18:00']], dienstag: [['08:00', '18:00']], mittwoch: [['08:00', '18:00']], donnerstag: [['08:00', '18:00']], freitag: [['08:00', '14:00']], samstag: [], sonntag: [] },
    secciones: [{ titulo: 'Behandlungen', entradilla: `Alle Angaben ${C}.`, items: [
      { nombre: 'Krankengymnastik', descripcion: 'Auf Rezept und privat' },
      { nombre: 'Manuelle Therapie', descripcion: C },
      { nombre: 'Manuelle Lymphdrainage', descripcion: C },
      { nombre: 'Massage', descripcion: C },
    ] }, { titulo: 'Termin', items: [
      { nombre: 'Rezept vom Arzt', descripcion: 'Einfach anrufen, wir buchen die Serie zusammen' },
      { nombre: 'Wartezeit', descripcion: `${C} — aktuell freie Termine?` },
    ] }],
    jobs: { puestos: [{ titulo: 'Physiotherapeut/in (m/w/d)', tipo: 'Voll- oder Teilzeit' }] },
  },
  kosmetik: {
    emoji: '💅', schema: 'BeautySalon', acento: '#a04a6b',
    horario: { montag: [], dienstag: [['09:00', '18:00']], mittwoch: [['09:00', '18:00']], donnerstag: [['09:00', '19:00']], freitag: [['09:00', '18:00']], samstag: [['09:00', '14:00']], sonntag: [] },
    secciones: [{ titulo: 'Behandlungen & Preise', items: [
      { nombre: 'Gesichtsbehandlung', precio: `ab ${C} €` },
      { nombre: 'Fußpflege', precio: `${C} €` },
      { nombre: 'Naildesign', precio: `ab ${C} €` },
      { nombre: 'Wimpern & Augenbrauen', precio: `${C} €` },
    ] }],
  },
  fahrschule: {
    emoji: '🚗', schema: 'DrivingSchool', acento: '#1f5f8b',
    horario: { montag: [['16:00', '19:00']], dienstag: [['16:00', '19:00']], mittwoch: [], donnerstag: [['16:00', '19:00']], freitag: [['16:00', '19:00']], samstag: [], sonntag: [] },
    secciones: [{ titulo: 'Führerscheinklassen', items: [
      { nombre: 'Klasse B — Auto', precio: `Grundbetrag ${C} €` },
      { nombre: 'Klasse AM / A1 / A', precio: C },
      { nombre: 'Intensivkurs / Ferienkurs', descripcion: C },
    ] }, { titulo: 'Theorieunterricht', items: [
      { nombre: 'Termine', descripcion: `${C} — welche Tage und Uhrzeiten?` },
      { nombre: 'Anmeldung', descripcion: 'Einfach vorbeikommen oder anrufen' },
    ] }],
  },
  gastro: {
    emoji: '🍽️', schema: 'Restaurant', acento: '#a8552c',
    horario: { montag: [], dienstag: [['11:30', '14:30'], ['17:00', '22:00']], mittwoch: [['11:30', '14:30'], ['17:00', '22:00']], donnerstag: [['11:30', '14:30'], ['17:00', '22:00']], freitag: [['11:30', '14:30'], ['17:00', '23:00']], samstag: [['12:00', '23:00']], sonntag: [['11:30', '20:00']] },
    secciones: [{ titulo: 'Mittagstisch', entradilla: `Zeiten und Preise ${C}.`, items: [
      { nombre: 'Tagesgericht', descripcion: 'Wechselnd', precio: `${C} €` },
      { nombre: 'Wochenkarte', descripcion: C, precio: `${C} €` },
    ] }, { titulo: 'Feiern & Gruppen', items: [
      { nombre: 'Familienfeiern', descripcion: `${C} — bis wie viele Personen?` },
    ] }],
    jobs: { puestos: [{ titulo: 'Servicekraft (m/w/d)', tipo: 'Voll- oder Teilzeit' }, { titulo: 'Küchenhilfe (m/w/d)', tipo: 'Teilzeit' }] },
  },
  handwerk: {
    emoji: '🔧', schema: 'HomeAndConstructionBusiness', acento: '#2c4a63',
    horario: { montag: [['07:00', '16:30']], dienstag: [['07:00', '16:30']], mittwoch: [['07:00', '16:30']], donnerstag: [['07:00', '16:30']], freitag: [['07:00', '14:00']], samstag: [], sonntag: [] },
    secciones: [{ titulo: 'Leistungen', entradilla: `Bitte im Gespräch bestätigen und ergänzen.`, items: [
      { nombre: 'Leistung 1', descripcion: C }, { nombre: 'Leistung 2', descripcion: C },
    ] }],
    jobs: { puestos: [{ titulo: 'Monteur (m/w/d)', tipo: 'Vollzeit' }] },
  },
};

function leerCsv(ruta) {
  const [cabecera, ...lineas] = readFileSync(ruta, 'utf8').trim().split('\n');
  const campos = cabecera.split(';').map((c) => c.trim());
  return lineas.filter(Boolean).map((linea) => {
    const valores = linea.split(';');
    return Object.fromEntries(campos.map((c, i) => [c, (valores[i] || '').trim()]));
  });
}

function crearFicha(p, { sobrescribir = false } = {}) {
  const destino = join(RAIZ, 'clientes', `${p.id}.json`);
  if (existsSync(destino) && !sobrescribir) {
    console.log(`· ${p.id} existe ya — no se toca`);
    return;
  }

  const g = GREMIOS[p.branche] || GREMIOS.handwerk;
  const ficha = {
    _nota: 'Generada desde prospectos.csv. Todo lo marcado [bestätigen] hay que preguntarlo en la llamada: es un negocio real y no se le atribuye nada que no haya dicho.',
    demo: true,
    idioma: 'de',
    propuesta_de: '[dein Name]',
    nombre: p.name,
    tipo: p.typ || '',
    emoji: g.emoji,
    ciudad: p.ort || '',
    claim: `${C} — ein Satz, der den Betrieb beschreibt.`,
    telefono: p.telefon || '[Telefon eintragen]',
    email: p.email || '',
    direccion: '[Adresse eintragen]',
    schema: g.schema,
    colores: { acento: g.acento },
    seo: { descripcion: `${p.name} in ${p.ort || ''}: ${p.typ || ''}. ${C}` },
    horario: g.horario,
    secciones: g.secciones,
    ...(g.jobs ? { jobs: { titulo: 'Wir suchen Verstärkung', texto: `${C} — nur aufnehmen, wenn wirklich Bedarf besteht.`, puestos: g.jobs.puestos } } : {}),
    redes: {},
  };

  mkdirSync(join(RAIZ, 'clientes'), { recursive: true });
  writeFileSync(destino, `${JSON.stringify(ficha, null, 2)}\n`);
  console.log(`✓ ${p.name} → clientes/${p.id}.json  (Gewerk: ${p.branche || 'handwerk'})`);
}

const prospectos = leerCsv(join(RAIZ, 'contacto', 'prospectos.csv'));
const arg = process.argv[2];

if (arg === '--todos') {
  prospectos.forEach((p) => crearFicha(p));
  console.log('\nAhora: rellena los [bestätigen] y ejecuta node webs-locales/generar.mjs --todos');
} else if (arg) {
  const p = prospectos.find((x) => x.id === arg);
  if (!p) {
    console.error(`No hay ningún prospecto con id "${arg}" en prospectos.csv.`);
    console.error(`Disponibles: ${prospectos.map((x) => x.id).join(', ')}`);
    process.exit(1);
  }
  crearFicha(p, { sobrescribir: process.argv.includes('--force') });
} else {
  console.error(`Uso:
  node webs-locales/nueva-ficha.mjs <id>        crea la ficha de ese prospecto
  node webs-locales/nueva-ficha.mjs --todos     crea las que falten`);
  process.exit(1);
}
