/**
 * Convierte la ficha de un negocio en una web completa.
 *
 * Todo el HTML se genera aqui. No hay framework ni paso de compilacion: la
 * salida es un unico archivo que se puede abrir con doble clic, ensenar en
 * el movil sin cobertura o subir a cualquier hosting gratuito.
 *
 * Prioridad de diseno: movil primero y llamada a un toque. En un negocio
 * local el 70 % de las visitas llegan desde un movil buscando el telefono,
 * el horario o como llegar. Todo lo demas es secundario.
 */

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

/**
 * Las fichas pueden escribir los dias en espanol o en aleman. Internamente
 * se usa siempre la clave espanola, asi que aqui se normaliza la entrada.
 */
const ALIAS_DIAS = {
  montag: 'lunes', dienstag: 'martes', mittwoch: 'miercoles', donnerstag: 'jueves',
  freitag: 'viernes', samstag: 'sabado', sonnabend: 'sabado', sonntag: 'domingo',
  miércoles: 'miercoles', sábado: 'sabado',
};

/** Textos de la interfaz. El idioma se elige con el campo "idioma". */
const TEXTOS = {
  es: {
    lang: 'es',
    dias: { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' },
    abierto: 'Abierto ahora', cerradoAhora: 'Cerrado ahora', cerrado: 'Cerrado',
    llamar: 'Llamar', comoLlegar: 'Cómo llegar', ir: 'Ir',
    horario: 'Horario', elSitio: 'El sitio', loQueDicen: 'Lo que dicen',
    donde: 'Dónde estamos', abrirMapa: 'Abrir en el mapa',
    en: 'en',
    notdienst: 'Urgencias', jobs: 'Trabaja con nosotros', contacto: 'Contacto',
    escribir: 'Escribir', pedirPresupuesto: 'Pedir presupuesto',
    propuestaTitulo: (n) => `Propuesta de página web para ${n}`,
    propuestaTexto: 'Ejemplo preparado para enseñar cómo quedaría. No es la web oficial del negocio y no está publicada.',
    propuestaAutor: (a) => `Preparada por ${a}.`,
  },
  de: {
    lang: 'de',
    dias: { lunes: 'Montag', martes: 'Dienstag', miercoles: 'Mittwoch', jueves: 'Donnerstag', viernes: 'Freitag', sabado: 'Samstag', domingo: 'Sonntag' },
    abierto: 'Jetzt geöffnet', cerradoAhora: 'Zurzeit geschlossen', cerrado: 'Geschlossen',
    llamar: 'Anrufen', comoLlegar: 'Route', ir: 'Route',
    horario: 'Öffnungszeiten', elSitio: 'Eindrücke', loQueDicen: 'Das sagen Gäste',
    donde: 'So finden Sie uns', abrirMapa: 'In Google Maps öffnen',
    en: 'in',
    notdienst: 'Notdienst', jobs: 'Wir stellen ein', contacto: 'Kontakt',
    escribir: 'E-Mail', pedirPresupuesto: 'Angebot anfordern',
    propuestaTitulo: (n) => `Website-Vorschlag für ${n}`,
    propuestaTexto: 'Unverbindliches Muster, um zu zeigen, wie die Seite aussehen könnte. Dies ist nicht die offizielle Website des Betriebs und sie ist nicht veröffentlicht.',
    propuestaAutor: (a) => `Erstellt von ${a}.`,
  },
};

/** Pasa las claves del horario a las internas, vengan en el idioma que vengan. */
function normalizarHorario(horario = {}) {
  const salida = {};
  for (const [clave, valor] of Object.entries(horario)) {
    const k = clave.toLowerCase().trim();
    salida[ALIAS_DIAS[k] || k] = valor;
  }
  return salida;
}

/** Escapa texto para insertarlo en HTML. Los datos vienen de un JSON a mano. */
export function esc(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

/** Deja el telefono en el formato que acepta un enlace tel:. */
function telEnlace(telefono = '') {
  return telefono.replace(/[^\d+]/g, '');
}

function seccionHorario(horario = {}, t) {
  const filas = DIAS.map((dia) => {
    const tramos = horario[dia];
    const texto = !tramos || tramos.length === 0
      ? `<span class="cerrado">${t.cerrado}</span>`
      : tramos.map(([a, b]) => `${esc(a)} – ${esc(b)}`).join('<br>');
    return `<tr data-dia="${dia}"><th>${t.dias[dia]}</th><td>${texto}</td></tr>`;
  }).join('');

  return `
  <section class="bloque" id="horario">
    <h2>${t.horario}</h2>
    <table class="horario">${filas}</table>
  </section>`;
}

function seccionesContenido(secciones = []) {
  if (!secciones.length) return '';
  return secciones.map((seccion) => {
    const items = (seccion.items || []).map((item) => `
      <li class="item">
        <div class="item-texto">
          <span class="item-nombre">${esc(item.nombre)}</span>
          ${item.descripcion ? `<span class="item-desc">${esc(item.descripcion)}</span>` : ''}
        </div>
        ${item.precio ? `<span class="item-precio">${esc(item.precio)}</span>` : ''}
      </li>`).join('');
    return `
  <section class="bloque">
    <h2>${esc(seccion.titulo)}</h2>
    ${seccion.entradilla ? `<p class="entradilla">${esc(seccion.entradilla)}</p>` : ''}
    <ul class="lista-items">${items}</ul>
  </section>`;
  }).join('');
}

function seccionGaleria(galeria = [], t) {
  if (!galeria.length) return '';
  const fotos = galeria.map((f) => `
    <figure><img src="${esc(f.url)}" alt="${esc(f.alt || '')}" loading="lazy"></figure>`).join('');
  return `
  <section class="bloque" id="galeria">
    <h2>${t.elSitio}</h2>
    <div class="galeria">${fotos}</div>
  </section>`;
}

function seccionResenas(resenas = [], t) {
  if (!resenas.length) return '';
  const items = resenas.map((r) => `
    <blockquote><p>${esc(r.texto)}</p><cite>${esc(r.autor)}</cite></blockquote>`).join('');
  return `
  <section class="bloque" id="resenas">
    <h2>${t.loQueDicen}</h2>
    <div class="resenas">${items}</div>
  </section>`;
}

/**
 * Barra de urgencias. En calefaccion o fontaneria es lo primero que busca
 * quien entra en la web un domingo con una fuga.
 */
function barraNotdienst(notdienst, t) {
  if (!notdienst) return '';
  const tel = telEnlace(notdienst.telefono || '');
  return `
  <div class="notdienst">
    <span class="notdienst-etiqueta">${t.notdienst}</span>
    <span class="notdienst-texto">${esc(notdienst.texto || '')}</span>
    ${tel ? `<a class="notdienst-tel" href="tel:${esc(tel)}">${esc(notdienst.telefono)}</a>` : ''}
  </div>`;
}

/**
 * Ofertas de empleo. Para un negocio artesanal aleman esta es la seccion
 * que mas vale: casi todos tienen mas trabajo que gente para hacerlo, y
 * ningun portal de empleo les funciona tan bien como su propia pagina.
 */
function seccionJobs(jobs, t) {
  if (!jobs) return '';
  const puestos = (jobs.puestos || []).map((p) => `
      <li class="item">
        <div class="item-texto">
          <span class="item-nombre">${esc(p.titulo)}</span>
          ${p.detalle ? `<span class="item-desc">${esc(p.detalle)}</span>` : ''}
        </div>
        ${p.tipo ? `<span class="item-precio">${esc(p.tipo)}</span>` : ''}
      </li>`).join('');
  return `
  <section class="bloque destacado" id="jobs">
    <h2>${esc(jobs.titulo || t.jobs)}</h2>
    ${jobs.texto ? `<p class="entradilla">${esc(jobs.texto)}</p>` : ''}
    ${puestos ? `<ul class="lista-items">${puestos}</ul>` : ''}
  </section>`;
}

/** Datos estructurados: como Google entiende que esto es un negocio local. */
function datosEstructurados(n, t) {
  const datos = {
    '@context': 'https://schema.org',
    '@type': n.schema || 'LocalBusiness',
    name: n.nombre,
    description: n.seo?.descripcion || n.claim,
    telephone: n.telefono,
    address: {
      '@type': 'PostalAddress',
      streetAddress: n.direccion,
      addressLocality: n.ciudad,
      addressCountry: n.pais || (t.lang === 'de' ? 'DE' : 'ES'),
    },
  };
  // JSON.stringify no escapa "</script>", asi que un nombre con etiquetas
  // podria cerrar el bloque e inyectar codigo. Se neutraliza el "<".
  const json = JSON.stringify(datos).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

export function renderSitio(negocioEntrada) {
  const t = TEXTOS[negocioEntrada.idioma] || TEXTOS.es;
  const n = { ...negocioEntrada, horario: normalizarHorario(negocioEntrada.horario) };
  const tel = telEnlace(n.telefono);
  // Muchas direcciones ya incluyen la ciudad ("Borsigstr. 17, 21465 Reinbek").
  // Repetirla detras queda mal, asi que solo se anade si falta.
  const ciudadAparte = n.ciudad && !(n.direccion || '').toLowerCase().includes(n.ciudad.toLowerCase())
    ? n.ciudad
    : '';
  const acento = n.colores?.acento || '#b03a2e';
  const titulo = `${n.nombre} · ${n.tipo}${n.ciudad ? ` ${t.en} ${n.ciudad}` : ''}`;

  const avisoDemo = n.demo ? `
  <div class="aviso-demo">
    <strong>${esc(t.propuestaTitulo(n.nombre))}</strong>
    ${esc(t.propuestaTexto)} ${n.propuesta_de ? esc(t.propuestaAutor(n.propuesta_de)) : ''}
  </div>` : '';

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(n.seo?.descripcion || n.claim || '')}">
${n.demo ? '<meta name="robots" content="noindex, nofollow">' : ''}
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(n.seo?.descripcion || n.claim || '')}">
<meta property="og:type" content="website">
<meta name="theme-color" content="${esc(acento)}">
<link rel="stylesheet" href="estilo.css">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="26">${n.emoji || '📍'}</text></svg>`)}">
<style>:root { --acento: ${esc(acento)}; }</style>
${datosEstructurados(n, t)}
</head>
<body>
${avisoDemo}
${barraNotdienst(n.notdienst, t)}

<header class="portada">
  <div class="envoltorio">
    <p class="tipo">${esc(n.tipo)}${n.ciudad ? ` · ${esc(n.ciudad)}` : ''}</p>
    <h1>${esc(n.nombre)}</h1>
    ${n.claim ? `<p class="claim">${esc(n.claim)}</p>` : ''}
    <p class="estado" id="estado" hidden></p>
    <div class="acciones">
      ${tel ? `<a class="boton primario" href="tel:${esc(tel)}">${t.llamar}</a>` : ''}
      ${n.whatsapp ? `<a class="boton" href="https://wa.me/${esc(n.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
      ${n.mapa ? `<a class="boton" href="${esc(n.mapa)}" target="_blank" rel="noopener">${t.comoLlegar}</a>` : ''}
      ${n.email ? `<a class="boton" href="mailto:${esc(n.email)}">${t.escribir}</a>` : ''}
    </div>
  </div>
</header>

<main class="envoltorio">
  ${seccionesContenido(n.secciones)}
  ${seccionHorario(n.horario, t)}
  ${seccionGaleria(n.galeria, t)}
  ${seccionResenas(n.resenas, t)}
  ${seccionJobs(n.jobs, t)}

  <section class="bloque" id="donde">
    <h2>${t.donde}</h2>
    <p class="direccion">${esc(n.direccion || '')}${ciudadAparte ? `<br>${esc(ciudadAparte)}` : ''}</p>
    <div class="acciones">
      ${n.mapa ? `<a class="boton primario" href="${esc(n.mapa)}" target="_blank" rel="noopener">${t.abrirMapa}</a>` : ''}
      ${tel ? `<a class="boton" href="tel:${esc(tel)}">${esc(n.telefono)}</a>` : ''}
    </div>
  </section>
</main>

<footer class="pie">
  <div class="envoltorio">
    <p><strong>${esc(n.nombre)}</strong>${n.direccion ? ` · ${esc(n.direccion)}` : ''}${ciudadAparte ? `, ${esc(ciudadAparte)}` : ''}</p>
    ${n.redes?.instagram ? `<p><a href="${esc(n.redes.instagram)}" target="_blank" rel="noopener">Instagram</a></p>` : ''}
  </div>
</footer>

<nav class="barra-movil">
  ${tel ? `<a href="tel:${esc(tel)}">${t.llamar}</a>` : ''}
  ${n.whatsapp ? `<a href="https://wa.me/${esc(n.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
  ${n.mapa ? `<a href="${esc(n.mapa)}" target="_blank" rel="noopener">${t.ir}</a>` : ''}
</nav>

<script>
// Abierto o cerrado ahora mismo. Es el dato que mas se consulta en un
// negocio local y el que casi ninguna web local muestra.
(function () {
  var horario = ${JSON.stringify(n.horario || {}).replaceAll('<', '\\u003c')};
  var dias = ${JSON.stringify(DIAS)};
  var ahora = new Date();
  var dia = dias[(ahora.getDay() + 6) % 7];
  var minutos = ahora.getHours() * 60 + ahora.getMinutes();
  var tramos = horario[dia] || [];
  var abierto = tramos.some(function (t) {
    var a = t[0].split(':'), b = t[1].split(':');
    return minutos >= (+a[0] * 60 + +a[1]) && minutos < (+b[0] * 60 + +b[1]);
  });
  var el = document.getElementById('estado');
  el.textContent = abierto ? ${JSON.stringify(t.abierto)} : ${JSON.stringify(t.cerradoAhora)};
  el.className = 'estado ' + (abierto ? 'abierto' : 'cerrado');
  el.hidden = false;

  var fila = document.querySelector('.horario tr[data-dia="' + dia + '"]');
  if (fila) fila.classList.add('hoy');
})();
</script>
</body>
</html>
`;
}
