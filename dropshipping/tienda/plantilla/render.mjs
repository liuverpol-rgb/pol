/**
 * Convierte la ficha de una tienda en una tienda estatica completa, en aleman.
 *
 * Sale un index.html con los productos y las CUATRO paginas que un comercio
 * online aleman tiene que tener: Impressum, Datenschutzerklarung,
 * Widerrufsbelehrung con su formulario, y Versand & Zahlung. Sin backend:
 * el cobro lo hace un enlace de pago de Stripe o de PayPal, que no cuesta
 * nada fijo. Ver ../../alemania/RECHT.md § 7.
 *
 * Dos decisiones de diseno que no son esteticas sino legales:
 *
 *   1. Un Kleinunternehmer NO puede escribir "inkl. 19 % MwSt" en ningun
 *      sitio. Es publicidad de un impuesto que no repercute y es motivo de
 *      Abmahnung. La plantilla pone la mencion del § 19 UStG en su lugar.
 *   2. El boton de pedido dice "Zahlungspflichtig bestellen" porque el
 *      § 312j Abs. 3 BGB exige esa formula o una equivalente. Un "Weiter"
 *      no vale.
 *
 * Todo lo que la plantilla no puede saber sale marcado con [prüfen], y una
 * tienda con marcadores no se publica: generar.mjs se niega.
 */

/** Escapa lo que va a entrar en el HTML. */
export function esc(valor = '') {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const MARCADOR = '[prüfen]';

const eur = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`;
const opcional = (valor, plantilla) => (valor ? plantilla(valor) : '');

/** Paginas obligatorias, en el orden en que van en el pie. */
const PAGINAS = [
  ['versand-zahlung.html', 'Versand & Zahlung'],
  ['widerruf.html', 'Widerrufsrecht'],
  ['datenschutz.html', 'Datenschutz'],
  ['impressum.html', 'Impressum'],
];

// ── Validacion ──────────────────────────────────────────────────────────────

/**
 * Lo que le falta a la ficha para poder publicarse de verdad. Cada entrada
 * es un incumplimiento concreto, con la norma detras: la lista no es un
 * consejo de estilo, es lo que un despacho buscaria primero.
 */
export function validar(config) {
  const problemas = [];
  const t = config.titular ?? {};

  for (const [campo, norma] of [
    ['nombre', '§ 5 DDG: nombre del responsable'],
    ['calle', '§ 5 DDG: direccion postal completa'],
    ['cp', '§ 5 DDG: direccion postal completa'],
    ['ciudad', '§ 5 DDG: direccion postal completa'],
    ['email', '§ 5 DDG: direccion de correo electronico'],
  ]) {
    if (!t[campo]) problemas.push(`titular.${campo} — ${norma}`);
  }
  if (!t.telefono && !t.formularioContacto) {
    problemas.push('titular.telefono o titular.formularioContacto — § 5 DDG: una via de contacto rapida');
  }
  if (!config.envio?.plazoDias) {
    problemas.push('envio.plazoDias — Art. 246a EGBGB: el plazo de entrega tiene que ser concreto');
  }
  if (config.envio?.coste == null) {
    problemas.push('envio.coste — § 3 PAngV: los gastos de envio se indican antes del pedido');
  }

  const productos = config.productos ?? [];
  if (!productos.length) problemas.push('productos — la tienda esta vacia');
  for (const p of productos) {
    const id = p.id ?? p.nombre ?? '(sin id)';
    if (!p.precio) problemas.push(`${id}: precio — § 3 PAngV`);
    if (!p.enlacePago) problemas.push(`${id}: enlacePago — sin enlace de pago no se puede comprar`);
    if (!p.fabricante?.nombre || !p.fabricante?.direccion) {
      problemas.push(`${id}: fabricante.nombre y fabricante.direccion — Art. 19 GPSR`);
    }
    if (p.fabricante?.extraUe && !p.personaResponsableUE?.nombre) {
      problemas.push(`${id}: personaResponsableUE — Art. 4 y 19 GPSR: fabricante fuera de la UE`);
    }
    if (p.textil && !p.material) {
      problemas.push(`${id}: material — TextilKennzVO: la composicion de fibras es obligatoria`);
    }
  }

  // Un marcador olvidado en cualquier texto es un dato inventado publicado.
  const crudo = JSON.stringify(config);
  if (crudo.includes(MARCADOR)) {
    problemas.push(`quedan marcadores ${MARCADOR} sin rellenar en la ficha`);
  }
  return problemas;
}

// ── Piezas comunes ──────────────────────────────────────────────────────────

function cabecera(config, titulo, { indexable }) {
  const c = config.tienda ?? {};
  const acento = esc(c.colores?.acento ?? '#1f5f4f');
  const emoji = c.emoji ?? '🛍️';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo === c.nombre ? esc(titulo) : `${esc(titulo)} — ${esc(c.nombre ?? 'Shop')}`}</title>
${indexable ? '' : '<meta name="robots" content="noindex, nofollow">\n'}<meta name="description" content="${esc(c.claim ?? '')}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${encodeURIComponent(emoji)}</text></svg>">
<link rel="stylesheet" href="estilo.css">
<style>:root { --acento: ${acento}; }</style>
</head>
<body>`;
}

function avisoDemo(config) {
  if (!config.demo) return '';
  return `<div class="aviso-demo" role="status">
  <strong>Vorschau, kein Shop.</strong> Diese Seite ist ein Entwurf und nicht veröffentlicht:
  es können keine Bestellungen aufgegeben werden.
</div>`;
}

function navegacion(config) {
  const c = config.tienda ?? {};
  return `<header class="cabecera">
  <a class="marca" href="index.html">${esc(c.emoji ?? '🛍️')} ${esc(c.nombre ?? 'Shop')}</a>
  ${opcional(c.claim, (v) => `<p class="claim">${esc(v)}</p>`)}
</header>`;
}

function pie(config, actual) {
  const t = config.titular ?? {};
  const enlaces = PAGINAS.map(([archivo, nombre]) =>
    archivo === actual
      ? `<span aria-current="page">${nombre}</span>`
      : `<a href="${archivo}">${nombre}</a>`,
  ).join('\n    ');
  return `<footer class="pie">
  <nav aria-label="Rechtliches">
    ${enlaces}
  </nav>
  <p>${esc(t.nombre ?? '')}${opcional(t.ciudad, (v) => ` · ${esc(v)}`)}</p>
</footer>
</body>
</html>`;
}

/** La nota fiscal del precio. Distinta y obligatoria en cada regimen. */
function notaFiscal(config) {
  return config.titular?.kleinunternehmer
    ? 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'
    : 'inkl. MwSt.';
}

function notaEnvio(config) {
  const e = config.envio ?? {};
  if (e.gratisDesde) {
    return `zzgl. <a href="versand-zahlung.html">Versandkosten</a> (${eur(e.coste)}, ab ${eur(e.gratisDesde)} kostenfrei)`;
  }
  return `zzgl. <a href="versand-zahlung.html">Versandkosten</a> (${eur(e.coste ?? 0)})`;
}

// ── Portada y productos ─────────────────────────────────────────────────────

function ficha(producto, config) {
  const p = producto;
  const e = config.envio ?? {};
  const plazo = Array.isArray(e.plazoDias) ? `${e.plazoDias[0]}–${e.plazoDias[1]}` : e.plazoDias;
  const fab = p.fabricante ?? {};

  return `<article class="producto" id="${esc(p.id ?? '')}">
  ${opcional(p.imagen, (v) => `<img class="foto" src="${esc(v)}" alt="${esc(p.nombre)}" loading="lazy">`)}
  <div class="datos">
    <h2>${esc(p.nombre)}</h2>
    ${opcional(p.descripcion, (v) => `<p class="descripcion">${esc(v)}</p>`)}
    <p class="precio">
      <strong>${eur(p.precio)}</strong>
      <span class="nota">${notaFiscal(config)} ${notaEnvio(config)}</span>
    </p>
    ${opcional(p.grundpreis, (v) => `<p class="nota">Grundpreis: ${esc(v)}</p>`)}
    <p class="entrega">Lieferzeit: <strong>${esc(plazo)} Werktage</strong>${opcional(p.produccionDias, (v) => ` (inkl. ${esc(v)} Werktage Produktion)`)}</p>
    ${opcional(p.variantes, (v) => `<p class="nota">Verfügbar: ${v.map(esc).join(' · ')}</p>`)}
    ${opcional(p.material, (v) => `<p class="nota">Material: ${esc(v)}</p>`)}
    ${
      p.personalizado
        ? `<p class="aviso-personalizado">Individuell nach Ihren Angaben gefertigt: für dieses Produkt besteht
      <a href="widerruf.html">kein Widerrufsrecht</a> (§ 312g Abs. 2 Nr. 1 BGB).</p>`
        : ''
    }
    <details class="gpsr">
      <summary>Herstellerangaben (GPSR)</summary>
      <p>${esc(fab.nombre ?? '')}<br>${esc(fab.direccion ?? '')}${opcional(fab.email, (v) => `<br>${esc(v)}`)}</p>
      ${opcional(
        p.personaResponsableUE,
        (r) =>
          `<p><strong>Verantwortliche Person in der EU:</strong><br>${esc(r.nombre)}<br>${esc(r.direccion ?? '')}${opcional(r.email, (v) => `<br>${esc(v)}`)}</p>`,
      )}
      ${opcional(p.seguridad, (v) => `<p><strong>Sicherheitshinweise:</strong> ${esc(v)}</p>`)}
      ${opcional(p.referencia, (v) => `<p>Artikelnummer: ${esc(v)}</p>`)}
    </details>
    ${
      config.demo
        ? '<p class="boton-demo">Zahlungspflichtig bestellen</p>'
        : `<a class="boton" href="${esc(p.enlacePago)}" rel="nofollow noopener">Zahlungspflichtig bestellen</a>`
    }
    <p class="nota">Mit dem Klick gelangen Sie zur Bezahlung. Die
      <a href="widerruf.html">Widerrufsbelehrung</a> und die
      <a href="datenschutz.html">Datenschutzerklärung</a> gelten.</p>
  </div>
</article>`;
}

function portada(config) {
  const c = config.tienda ?? {};
  return `${cabecera(config, c.nombre ?? 'Shop', { indexable: !config.demo })}
${avisoDemo(config)}
${navegacion(config)}
<main>
  ${opcional(c.entradilla, (v) => `<p class="entradilla">${esc(v)}</p>`)}
  <div class="productos">
    ${(config.productos ?? []).map((p) => ficha(p, config)).join('\n    ')}
  </div>
</main>
${pie(config, 'index.html')}`;
}

// ── Paginas legales ─────────────────────────────────────────────────────────

function impressum(config) {
  const t = config.titular ?? {};
  return `${cabecera(config, 'Impressum', { indexable: !config.demo })}
${avisoDemo(config)}
${navegacion(config)}
<main class="texto">
  <h1>Impressum</h1>
  <p>Angaben gemäß § 5 DDG</p>
  <p>
    ${esc(t.nombre ?? '')}<br>
    ${esc(t.calle ?? '')}<br>
    ${esc(t.cp ?? '')} ${esc(t.ciudad ?? '')}<br>
    ${esc(t.pais ?? 'Deutschland')}
  </p>
  <h2>Kontakt</h2>
  <p>
    ${opcional(t.telefono, (v) => `Telefon: ${esc(v)}<br>`)}E-Mail:
    <a href="mailto:${esc(t.email ?? '')}">${esc(t.email ?? '')}</a>
  </p>
  ${opcional(t.ustIdNr, (v) => `<h2>Umsatzsteuer-Identifikationsnummer</h2>\n  <p>${esc(v)}</p>`)}
  ${
    t.kleinunternehmer
      ? '<p>Als Kleinunternehmer im Sinne von § 19 UStG wird keine Umsatzsteuer berechnet.</p>'
      : ''
  }
  ${opcional(t.lucid, (v) => `<h2>Verpackungsregister</h2>\n  <p>LUCID-Registrierungsnummer: ${esc(v)}</p>`)}
  <h2>Verbraucherstreitbeilegung</h2>
  <p>Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren
    vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
  <h2>Verantwortlich für den Inhalt</h2>
  <p>${esc(t.nombre ?? '')}, Adresse wie oben.</p>
</main>
${pie(config, 'impressum.html')}`;
}

function datenschutz(config) {
  const t = config.titular ?? {};
  const encargados = config.encargados ?? [];
  return `${cabecera(config, 'Datenschutzerklärung', { indexable: !config.demo })}
${avisoDemo(config)}
${navegacion(config)}
<main class="texto">
  <h1>Datenschutzerklärung</h1>

  <h2>Verantwortlicher</h2>
  <p>${esc(t.nombre ?? '')}, ${esc(t.calle ?? '')}, ${esc(t.cp ?? '')} ${esc(t.ciudad ?? '')},
    <a href="mailto:${esc(t.email ?? '')}">${esc(t.email ?? '')}</a></p>

  <h2>Diese Website</h2>
  <p>Diese Seiten sind statisch. Es werden keine Cookies gesetzt, keine Analyse-
    oder Tracking-Dienste eingesetzt und keine Daten von Ihnen erhoben, solange
    Sie nur die Seiten lesen. Ihr Hosting-Anbieter verarbeitet technisch
    notwendige Server-Logs (IP-Adresse, Zeitpunkt, abgerufene Datei) zur
    Auslieferung und Sicherheit der Seite; Rechtsgrundlage ist Art. 6 Abs. 1
    lit. f DSGVO.</p>

  <h2>Bestellung und Bezahlung</h2>
  <p>Beim Klick auf die Bestell-Schaltfläche werden Sie zum Zahlungsdienstleister
    weitergeleitet. Dort geben Sie Ihre Zahlungs- und Lieferdaten ein; diese
    werden von dem jeweiligen Anbieter in eigener Verantwortung verarbeitet.
    Wir erhalten die für die Abwicklung erforderlichen Daten (Name, Lieferadresse,
    E-Mail, Bestellinhalt). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
    (Vertragserfüllung).</p>

  <h2>Weitergabe an Dritte</h2>
  <p>Zur Lieferung geben wir Ihren Namen und Ihre Lieferadresse an den
    Hersteller bzw. Versanddienstleister weiter, der die Ware direkt an Sie
    versendet. Ohne diese Weitergabe ist die Lieferung nicht möglich.</p>
  ${
    encargados.length
      ? `<p>Eingesetzte Dienstleister:</p>\n  <ul>\n    ${encargados
          .map((e) => `<li>${esc(e.nombre)} — ${esc(e.finalidad)}${opcional(e.sede, (v) => ` (${esc(v)})`)}</li>`)
          .join('\n    ')}\n  </ul>`
      : ''
  }

  <h2>Aufbewahrung</h2>
  <p>Bestelldaten werden zur Erfüllung steuerlicher Aufbewahrungspflichten
    (§ 147 AO, § 257 HGB) bis zu zehn Jahre gespeichert und danach gelöscht.</p>

  <h2>Ihre Rechte</h2>
  <p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16),
    Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
    Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Beschwerden können
    Sie an die für Sie zuständige Aufsichtsbehörde richten; für
    ${esc(t.ciudad ?? '')} ist das das Unabhängige Landeszentrum für Datenschutz
    Schleswig-Holstein.</p>
</main>
${pie(config, 'datenschutz.html')}`;
}

/**
 * Widerrufsbelehrung segun el modelo legal del anexo 1 del art. 246a EGBGB,
 * y el formulario del anexo 2. Se usa el texto del modelo porque usarlo tal
 * cual es lo que da seguridad juridica: reescribirlo con otras palabras es
 * exactamente como se pierde esa proteccion.
 */
function widerruf(config) {
  const t = config.titular ?? {};
  const direccion = `${t.nombre ?? ''}, ${t.calle ?? ''}, ${t.cp ?? ''} ${t.ciudad ?? ''}${t.email ? `, ${t.email}` : ''}`;
  const retorno = config.envio?.retornoPagaCliente
    ? 'Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.'
    : 'Wir tragen die Kosten der Rücksendung der Waren.';

  return `${cabecera(config, 'Widerrufsrecht', { indexable: !config.demo })}
${avisoDemo(config)}
${navegacion(config)}
<main class="texto">
  <h1>Widerrufsbelehrung</h1>

  <h2>Widerrufsrecht</h2>
  <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen
    Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag,
    an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer
    ist, die Waren in Besitz genommen haben bzw. hat.</p>
  <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
    (${esc(direccion)}) mittels einer eindeutigen Erklärung (z. B. ein mit der
    Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen
    Vertrag zu widerrufen, informieren. Sie können dafür das unten abgedruckte
    Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
  <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über
    die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>

  <h2>Folgen des Widerrufs</h2>
  <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir
    von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der
    zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der
    Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt
    haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
    zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags
    bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
    Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben,
    es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in
    keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p>
  <p>Wir können die Rückzahlung verweigern, bis wir die Waren wieder
    zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die
    Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.</p>
  <p>Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen
    vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags
    unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist
    gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen
    absenden. ${esc(retorno)}</p>
  <p>Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn
    dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften
    und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen
    zurückzuführen ist.</p>

  <h2>Ausschluss des Widerrufsrechts</h2>
  <p>Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die
    nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl
    oder Bestimmung durch den Verbraucher maßgeblich ist oder die eindeutig auf
    die persönlichen Bedürfnisse des Verbrauchers zugeschnitten sind
    (§ 312g Abs. 2 Nr. 1 BGB). Bei diesen Artikeln ist der Ausschluss auf der
    Produktseite ausdrücklich angegeben.</p>

  <h2>Muster-Widerrufsformular</h2>
  <div class="formulario">
    <p><em>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses
      Formular aus und senden Sie es zurück.)</em></p>
    <p>An: ${esc(direccion)}</p>
    <p>Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über
      den Kauf der folgenden Waren:</p>
    <p class="linea">&nbsp;</p>
    <p>Bestellt am / erhalten am:</p>
    <p class="linea">&nbsp;</p>
    <p>Name des/der Verbraucher(s):</p>
    <p class="linea">&nbsp;</p>
    <p>Anschrift des/der Verbraucher(s):</p>
    <p class="linea">&nbsp;</p>
    <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier) / Datum:</p>
    <p class="linea">&nbsp;</p>
    <p><em>(*) Unzutreffendes streichen.</em></p>
  </div>
</main>
${pie(config, 'widerruf.html')}`;
}

function versandZahlung(config) {
  const e = config.envio ?? {};
  const plazo = Array.isArray(e.plazoDias) ? `${e.plazoDias[0]}–${e.plazoDias[1]}` : e.plazoDias;
  const pagos = config.pago ?? [];
  return `${cabecera(config, 'Versand & Zahlung', { indexable: !config.demo })}
${avisoDemo(config)}
${navegacion(config)}
<main class="texto">
  <h1>Versand &amp; Zahlung</h1>

  <h2>Versandkosten</h2>
  <p>Innerhalb ${esc((e.paises ?? ['Deutschlands']).join(', '))}: <strong>${eur(e.coste ?? 0)}</strong> pro Bestellung.
    ${opcional(e.gratisDesde, (v) => `Ab einem Bestellwert von ${eur(v)} versandkostenfrei.`)}</p>
  ${opcional(e.notaPaises, (v) => `<p>${esc(v)}</p>`)}

  <h2>Lieferzeit</h2>
  <p>Die Lieferzeit beträgt <strong>${esc(plazo)} Werktage</strong> ab Zahlungseingang.
    Die Artikel werden erst nach Ihrer Bestellung gefertigt und direkt vom
    Hersteller an Sie versandt.</p>

  <h2>Zahlungsarten</h2>
  ${pagos.length ? `<ul>\n    ${pagos.map((p) => `<li>${esc(p)}</li>`).join('\n    ')}\n  </ul>` : ''}
  <p>Die Zahlung wird über einen Zahlungsdienstleister abgewickelt. Ihre
    Zahlungsdaten erreichen uns nicht.</p>

  <h2>Preise</h2>
  <p>Alle Preise sind Endpreise. ${notaFiscal(config)}</p>
</main>
${pie(config, 'versand-zahlung.html')}`;
}

/**
 * Devuelve un objeto { nombreDeArchivo: contenido } con la tienda completa.
 * Quien lo llame decide donde escribirlo.
 */
export function renderTienda(config) {
  return {
    'index.html': portada(config),
    'impressum.html': impressum(config),
    'datenschutz.html': datenschutz(config),
    'widerruf.html': widerruf(config),
    'versand-zahlung.html': versandZahlung(config),
  };
}
