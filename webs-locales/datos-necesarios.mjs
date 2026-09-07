#!/usr/bin/env node
/**
 * Lista, cliente por cliente, exactamente que datos faltan.
 *
 *   node webs-locales/datos-necesarios.mjs               resumen de todos
 *   node webs-locales/datos-necesarios.mjs zur-muehle    hoja de un cliente
 *   node webs-locales/datos-necesarios.mjs --escribir    un .md por cliente
 *
 * Los huecos no son descuido: son un negocio real al que no se le puede
 * atribuir un precio, un horario ni un servicio que no haya dicho. Esta
 * hoja es lo que se lleva a la llamada para preguntarlo.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const ES_HUECO = /\[[^\]]+\]/;

/** Traduce la ruta de un campo a la pregunta que hay que hacer por telefono. */
const PREGUNTAS = {
  claim: ['Ein Satz über den Betrieb', 'Wie würden Sie Ihren Betrieb in einem Satz beschreiben?'],
  telefono: ['Telefonnummer', 'Unter welcher Nummer sollen Kunden anrufen?'],
  email: ['E-Mail', 'Welche E-Mail-Adresse soll auf die Seite?'],
  direccion: ['Adresse', 'Straße und Hausnummer für die Seite'],
  seo: ['Google-Beschreibung', 'Was soll bei Google unter dem Namen stehen?'],
  horario: ['Öffnungszeiten', 'An welchen Tagen und zu welchen Uhrzeiten haben Sie geöffnet?'],
  secciones: ['Leistungen und Preise', 'Welche Leistungen bieten Sie an, und was kosten sie?'],
  jobs: ['Stellenanzeige', 'Suchen Sie gerade Mitarbeiter oder Azubis? Wenn nein, fällt der Abschnitt weg.'],
  propuesta_de: ['Dein Name', 'Geht aus remitente.json — einmal ausfüllen, gilt für alle.'],
};

/** Recorre el objeto y devuelve las rutas cuyo texto sigue siendo un hueco. */
function buscarHuecos(valor, ruta = '', encontrados = []) {
  if (typeof valor === 'string') {
    if (ES_HUECO.test(valor)) encontrados.push({ ruta, valor });
  } else if (Array.isArray(valor)) {
    valor.forEach((v, i) => buscarHuecos(v, `${ruta}[${i}]`, encontrados));
  } else if (valor && typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) {
      if (k.startsWith('_')) continue;
      buscarHuecos(v, ruta ? `${ruta}.${k}` : k, encontrados);
    }
  }
  return encontrados;
}

/** Agrupa por el campo de primer nivel, que es como se pregunta de verdad. */
function agrupar(huecos) {
  const grupos = new Map();
  for (const h of huecos) {
    const raiz = h.ruta.split(/[.[]/)[0];
    if (!grupos.has(raiz)) grupos.set(raiz, []);
    grupos.get(raiz).push(h);
  }
  return grupos;
}

/**
 * Datos que hay que confirmar SIEMPRE, lleven marca o no.
 *
 * nueva-ficha.mjs rellena el horario con el tipico del gremio para que la
 * demo no salga vacia. Ese horario es una suposicion, no un dato: se
 * pregunta igual que si estuviera en blanco.
 */
const SIEMPRE = [
  ['Öffnungszeiten ⚠️', 'An welchen Tagen und zu welchen Uhrzeiten haben Sie geöffnet?',
   'En la demo hay un horario de ejemplo del gremio. NO es suyo. Confírmalo siempre.'],
  ['Fotos', 'Haben Sie zwei, drei gute Fotos vom Betrieb? Sonst mache ich welche.',
   'Sin fotos la web funciona, pero con fotos vende el triple.'],
];

function hoja(id, ficha) {
  const huecos = buscarHuecos(ficha);
  const grupos = agrupar(huecos);

  const bloques = [...grupos].map(([raiz, lista]) => {
    const [titulo, pregunta] = PREGUNTAS[raiz] || [raiz, 'Bitte ergänzen.'];
    const detalles = lista
      .filter((h) => h.ruta !== raiz)
      .map((h) => `  - \`${h.ruta}\` — ${h.valor}`)
      .join('\n');
    return `### ${titulo}\n\n> ${pregunta}\n\n${detalles || `  - \`${raiz}\``}\n\n**Antwort:** ________________________________________________\n`;
  }).join('\n');

  const siempre = SIEMPRE.map(([titulo, pregunta, nota]) =>
    `### ${titulo}\n\n> ${pregunta}\n\n*${nota}*\n\n**Antwort:** ________________________________________________\n`,
  ).join('\n');

  return `# ${ficha.nombre}

Datos que faltan para dejar su web terminada. Pregúntalos en la llamada o
cuando conteste a la carta, y escríbelos en \`clientes/${id}.json\`.

**${huecos.length} huecos.** Después: \`node webs-locales/generar.mjs clientes/${id}.json\`

---

${bloques}
${siempre}
---

## Lo que ya tenemos

| Dato | Valor |
| --- | --- |
| Nombre | ${ficha.nombre} |
| Tipo | ${ficha.tipo || '—'} |
| Ciudad | ${ficha.ciudad || '—'} |
| Teléfono | ${ES_HUECO.test(ficha.telefono || '') ? '**falta**' : ficha.telefono} |
| Dirección | ${ES_HUECO.test(ficha.direccion || '') ? '**falta**' : ficha.direccion} |

## Lo mínimo para enseñarle algo decente

Con estas tres cosas la web ya vale: **horario real**, **tres o cuatro
servicios con precio** y **un teléfono correcto**. El resto se puede afinar
después de que pague.
`;
}

const fichas = readdirSync(join(RAIZ, 'clientes'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(join(RAIZ, 'clientes', f), 'utf8'))]);

const arg = process.argv[2];

if (arg === '--escribir') {
  const dir = join(RAIZ, 'clientes', 'datos-que-faltan');
  mkdirSync(dir, { recursive: true });
  for (const [id, ficha] of fichas) {
    writeFileSync(join(dir, `${id}.md`), hoja(id, ficha));
  }
  console.log(`✓ ${fichas.length} hojas → clientes/datos-que-faltan/`);
} else if (arg) {
  const encontrada = fichas.find(([id]) => id === arg);
  if (!encontrada) {
    console.error(`No hay ficha "${arg}". Hay: ${fichas.map(([id]) => id).join(', ')}`);
    process.exit(1);
  }
  console.log(hoja(...encontrada));
} else {
  console.log('Datos que faltan por cliente:\n');
  const filas = fichas
    .map(([id, f]) => [id, f.nombre, buscarHuecos(f).length + SIEMPRE.length])
    .sort((a, b) => a[2] - b[2]);
  for (const [id, nombre, n] of filas) {
    console.log(`  ${String(n).padStart(2)} huecos  ${id.padEnd(30)} ${nombre}`);
  }
  console.log('\nDetalle de uno:  node webs-locales/datos-necesarios.mjs <id>');
  console.log('Todos a fichero: node webs-locales/datos-necesarios.mjs --escribir');
}
