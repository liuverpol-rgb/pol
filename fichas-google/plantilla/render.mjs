/**
 * Convierte la auditoria en la hoja de una pagina que se le pone delante
 * al duenno.
 *
 * Todo el texto que ve el cliente esta en aleman; los comentarios y la
 * consola, en espanol. La hoja sale en un unico archivo con el CSS dentro:
 * se ensena en el movil sin cobertura, se manda por WhatsApp y se imprime
 * con Strg+P sin que se descoloque.
 *
 * Dos cosas que no lleva, a proposito:
 *
 *   - Ni logotipo ni colores de Google. Esta hoja la haces tu y no viene de
 *     Google. Dar a entender lo contrario seria enganoso.
 *   - Ni una sola cifra de rendimiento inventada. Nada de "un 70 % mas de
 *     clics". Cada linea dice lo que pasa, no lo que promete.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Fecha en formato aleman, que es como la lee el cliente. */
function fechaAlemana(iso) {
  const d = iso ? new Date(iso) : new Date();
  const valida = !Number.isNaN(d.getTime());
  const fecha = valida ? d : new Date();
  return `${String(fecha.getDate()).padStart(2, '0')}.${String(fecha.getMonth() + 1).padStart(2, '0')}.${fecha.getFullYear()}`;
}

/** Como se llama a la nota delante del duenno, sin ofender y sin adular. */
export function veredicto(nota) {
  if (nota === null) return { clase: 'media', titulo: 'Noch nicht bewertet', texto: 'Ich habe das Profil noch nicht vollständig angeschaut.' };
  if (nota >= 80) return { clase: 'alta', titulo: 'Gut gepflegt', texto: 'Ihr Profil ist in Ordnung. Es fehlen nur Kleinigkeiten.' };
  if (nota >= 60) return { clase: 'media', titulo: 'Solide, mit Lücken', texto: 'Die Grundlagen stehen. Was fehlt, ist an einem Nachmittag gemacht.' };
  if (nota >= 35) return { clase: 'baja', titulo: 'Da liegt einiges brach', texto: 'Ihr Profil ist da, aber es arbeitet nicht für Sie.' };
  return { clase: 'baja', titulo: 'Das Profil ist praktisch leer', texto: 'Wer Sie bei Google sucht, findet kaum mehr als den Namen.' };
}

function bloqueHoras(minutos) {
  const horas = minutos / 60;
  if (horas < 1) return `${minutos} Minuten Arbeit`;
  const redondo = Math.round(horas * 2) / 2;
  return `etwa ${String(redondo).replace('.5', ',5').replace('.0', '')} Stunden Arbeit`;
}

export function renderHoja({ negocio, resultado, oferta, css }) {
  const estilo = css ?? readFileSync(join(AQUI, 'estilo.css'), 'utf8');
  const v = veredicto(resultado.nota);
  const titulo = `Google-Profil ${negocio.nombre}`;

  const avisoNoReclamado = resultado.bloqueado ? `
  <div class="aviso">
    <strong>Ihr Profil ist nicht bestätigt.</strong>
    <p>Das ist der erste Schritt, und nur Sie können ihn machen — Google schickt
    dazu einen Code an Ihre Betriebsadresse oder verlangt ein kurzes Video.
    Ich zeige Ihnen, wie es geht; danach geben Sie mir Zugriff als Verwalter.
    Alles Weitere auf dieser Seite lässt sich erst danach ändern.</p>
  </div>` : '';

  const faltan = resultado.faltan.map((c) => `
  <div class="falta">
    <span class="puntos">${c.peso} Punkte</span>
    <h3>${esc(c.titulo)}</h3>
    <p>${esc(c.efecto)}</p>
  </div>`).join('');

  const bien = resultado.bien.length ? `
  <h2>Das passt schon <span class="cuenta">(${resultado.bien.length})</span></h2>
  <ul class="lista">${resultado.bien.map((c) => `<li>${esc(c.titulo)}</li>`).join('')}</ul>` : '';

  const pendiente = resultado.sinComprobar.length ? `
  <h2>Noch nicht geprüft <span class="cuenta">(${resultado.sinComprobar.length})</span></h2>
  <p style="margin:0 0 10px;color:#6d665d;font-size:0.94rem">Das sehe ich von außen nicht.
  Ich sage Ihnen dazu nichts, bevor ich es nicht angeschaut habe.</p>
  <ul class="lista pendiente">${resultado.sinComprobar.map((c) => `<li>${esc(c.titulo)}</li>`).join('')}</ul>` : '';

  const paquetes = oferta.paquetes.map((p) => `
    <div class="paquete">
      <div class="precio">${p.precio} €<span> ${esc(p.unidad)}</span></div>
      <h3>${esc(p.titulo)}</h3>
      <ul>${p.incluye.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <p class="horas">${esc(p.horas)}</p>
    </div>`).join('');

  const junto = oferta.descuento_con_web ? `
    <p class="junto"><strong>${esc(oferta.descuento_con_web.titulo)}:</strong>
    ${esc(oferta.descuento_con_web.texto)}</p>` : '';

  const trabajo = resultado.faltan.length
    ? `<p>Was fehlt, sind ${resultado.faltan.length} Punkte — ${bloqueHoras(resultado.minutos)}.</p>`
    : '';

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(titulo)}</title>
<style>
${estilo}
</style>
</head>
<body>
<main class="hoja">
  <p class="marca">Bestandsaufnahme Google-Unternehmensprofil</p>
  <h1>${esc(negocio.nombre)}${negocio.ciudad ? `, ${esc(negocio.ciudad)}` : ''}</h1>
  <p class="fecha">Angeschaut am ${fechaAlemana(negocio.comprobado)}</p>
${avisoNoReclamado}
  <div class="nota ${v.clase}">
    <div class="nota-cifra">${resultado.nota === null ? '–' : resultado.nota}<span>/100</span></div>
    <div class="nota-texto"><strong>${esc(v.titulo)}</strong>${esc(v.texto)}</div>
  </div>

  <h2>Das fehlt <span class="cuenta">(${resultado.faltan.length})</span></h2>
${faltan || '<p>Nichts von dem, was ich prüfe, fehlt. Das ist selten.</p>'}
${trabajo}
${bien}
${pendiente}

  <section class="oferta">
    <h2>Was es kostet, wenn ich das mache</h2>
${paquetes}
${junto}
  </section>

  <footer>
    <p>Unverbindliche Bestandsaufnahme${negocio.propuesta_de ? `, erstellt von ${esc(negocio.propuesta_de)}` : ''}.
    Grundlage sind die öffentlich sichtbaren Angaben Ihres Profils bei Google Maps.</p>
    <p>Ich gehöre nicht zu Google und handle nicht in dessen Auftrag.
    „Google“ und „Google Maps“ sind Marken von Google LLC.</p>
    <p>Die Punktzahl ist meine eigene Gewichtung der Profilfelder, keine Angabe von Google.</p>
  </footer>
</main>
</body>
</html>
`;
}
