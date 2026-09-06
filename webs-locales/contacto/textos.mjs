/**
 * Los textos comerciales, en un solo sitio.
 *
 * Los usan el generador de paquetes de contacto y el de cartas para
 * imprimir. Si vivieran duplicados en dos scripts, acabarian diciendo
 * cosas distintas al mismo cliente.
 */
import { readFileSync } from 'node:fs';

/** CSV separado por punto y coma: es lo que produce Excel en aleman. */
export function leerCsv(ruta) {
  const [cabecera, ...lineas] = readFileSync(ruta, 'utf8').trim().split('\n');
  const campos = cabecera.split(';').map((c) => c.trim());
  return lineas.filter(Boolean).map((linea) => {
    const valores = linea.split(';');
    return Object.fromEntries(campos.map((c, i) => [c, (valores[i] || '').trim()]));
  });
}

/** "Frau Meyer" -> "Sehr geehrte Frau Meyer". Sin nombre, formula neutra. */
export function saludo(ansprechpartner) {
  if (!ansprechpartner) return 'Sehr geehrte Damen und Herren,';
  const forma = ansprechpartner.startsWith('Frau') ? 'Sehr geehrte' : 'Sehr geehrter';
  return `${forma} ${ansprechpartner},`;
}

/** La frase que demuestra que no es un envio masivo. Es la pieza clave. */
export function pruebaDeQueEsPersonal(p) {
  if (p.beobachtung) return `mir ist aufgefallen: ${p.beobachtung}.`;
  if (p.bewertungen) {
    return `Ihr Betrieb hat bei Google ${p.bewertungen} Bewertungen mit ${p.sterne || 'sehr guter'} Bewertung — aber keine eigene Website.`;
  }
  return 'mir ist aufgefallen, dass Ihr Betrieb keine eigene Website hat.';
}

export const enlace = (p) => p.demo_url || '[LINK ZUR FERTIGEN SEITE EINFÜGEN]';

/** true si al prospecto le falta el enlace publicado: sin el no hay envio. */
export const sinEnlace = (p) => !p.demo_url;

/** Cuerpo de la carta, en parrafos. La carta es legal sin permiso previo. */
export function parrafosCarta(p, remitente = {}) {
  const ort = p.ort || '[ORT]';
  return {
    betreff: `Ihre Website für ${p.name}`,
    saludo: saludo(p.ansprechpartner),
    parrafos: [
      `ich baue Websites für Betriebe hier in ${ort}, und ${pruebaDeQueEsPersonal(p)}`,
      'Deshalb habe ich Ihnen eine gebaut. Sie ist fertig und Sie können sie sich hier ansehen:',
    ],
    enlace: enlace(p),
    parrafosFinales: [
      'Sie sehen dort Ihre Öffnungszeiten, Ihre Leistungen und ob gerade geöffnet ist. Auf dem Handy genügt ein Tipp zum Anrufen oder für die Route.',
      'Wenn sie Ihnen gefällt, schalte ich sie unter Ihrer eigenen Adresse frei: 300 € einmalig, danach 60 € im Jahr für Domain und Änderungen. Wenn nicht, hören Sie nichts mehr von mir.',
    ],
    despedida: 'Mit freundlichen Grüßen',
    remitente: {
      nombre: remitente.nombre || '[DEIN NAME]',
      calle: remitente.calle || '[STRASSE]',
      ciudad: remitente.ciudad || '[PLZ ORT]',
      telefon: remitente.telefon || '[TELEFON]',
      email: remitente.email || '[E-MAIL]',
    },
  };
}
