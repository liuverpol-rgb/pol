/**
 * Interfaz del popup. Orquesta: lee la ficha, mira la licencia, gasta un uso
 * si toca y pinta el desglose. Toda la logica seria vive en lib/.
 */

import { almacenChrome } from './lib/almacen.mjs';
import { consumirUso, leerUso, proximoReinicio } from './lib/uso.mjs';
import { activar, desactivar, estadoLicencia, idDeEquipo, ErrorLicencia } from './lib/licencia.mjs';
import { analizar, categoriaSugerida } from './lib/calculo.mjs';
import { redondear } from './lib/margen.mjs';
import { esFichaDeProducto } from './lib/amazon.mjs';
import { CLAVE_COSTES, COSTES_POR_DEFECTO, LIMITE_GRATIS, TIENDA } from './config.mjs';

const $ = (id) => document.getElementById(id);
const almacen = almacenChrome();
// El identificador de equipo va en el almacen LOCAL: si viajara con la
// sincronizacion de Chrome, todos los perfiles del usuario serian el mismo
// equipo y el tope de la licencia no contaria nada.
const almacenLocal = almacenChrome(globalThis.chrome?.storage?.local);
const euros = (n) => `${redondear(n).toFixed(2).replace('.', ',')} €`;
const porcentaje = (n) => `${(n * 100).toFixed(1).replace('.', ',')} %`;

let datos;
let costes;
let producto = null;
let pro = false;

async function arrancar() {
  datos = await (await fetch(chrome.runtime.getURL('datos/amazon.json'))).json();
  costes = { ...COSTES_POR_DEFECTO, ...((await almacen.leer(CLAVE_COSTES)) ?? {}) };

  const licencia = await estadoLicencia(almacen, { config: TIENDA });
  pro = licencia.pro;
  pintarCuota(await leerUso(almacen, { limite: LIMITE_GRATIS }));
  $('pro').hidden = !pro;
  // El formulario de la clave se ve siempre que no haya Pro: quien compra
  // con usos gratis todavia en el bolsillo tambien tiene que poder activarla.
  $('activar').hidden = pro;
  const nota = {
    'sin-conexion': 'Sin conexión: la licencia se revalidará cuando vuelvas a tener red.',
    'sin-conexion-agotada': 'Llevas demasiado tiempo sin conexión para comprobar la licencia.',
    'equipo-liberado': 'Esta clave se ha liberado desde otro equipo. Vuelve a activarla aquí si quieres usarla.',
    revocada: 'Esta clave ya no es válida. Si crees que es un error, escríbenos.',
    caducada: 'Esta clave ha caducado.',
  }[licencia.motivo];
  if (nota) $('pie').textContent = nota;

  const ficha = await leerFicha();
  if (!ficha) return;
  producto = ficha;

  if (producto.precio == null) {
    $('estado').textContent = 'No he sabido leer el precio de esta ficha. Puede que sea una variante sin precio propio o una maqueta nueva de Amazon.';
    return;
  }

  const uso = await consumirUso(almacen, { producto: producto.asin ?? '', pro, limite: LIMITE_GRATIS });
  pintarCuota(uso);
  if (!uso.permitido) {
    mostrarMuro(uso);
    return;
  }

  prepararFormulario();
  pintarProducto();
  calcular();
}

/** Pide la ficha al content script; si no estaba cargado, lo inyecta. */
async function leerFicha() {
  const [pestana] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!pestana?.url || !/^https:\/\/www\.amazon\./.test(pestana.url)) {
    $('estado').textContent = 'Abre la ficha de un producto de Amazon y vuelve a pulsar aquí.';
    return null;
  }
  if (!esFichaDeProducto(pestana.url)) {
    $('estado').textContent = 'Esto es un listado, no una ficha. Entra en el producto.';
    return null;
  }
  try {
    const r = await preguntar(pestana.id);
    if (r?.ok) return r.producto;
    throw new Error(r?.error ?? 'sin respuesta');
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: pestana.id }, files: ['contenido.js'] });
      const r = await preguntar(pestana.id);
      if (r?.ok) return r.producto;
    } catch {
      /* cae al mensaje de abajo */
    }
    $('estado').textContent = 'No he podido leer la página. Recárgala y vuelve a intentarlo.';
    return null;
  }
}

const preguntar = (tabId) => chrome.tabs.sendMessage(tabId, { tipo: 'leer-ficha' });

function pintarCuota(uso) {
  if (pro) {
    $('cuota').textContent = 'Pro · sin límite';
    return;
  }
  const dia = proximoReinicio(new Date()).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  $('cuota').textContent = `${uso.restantes} de ${uso.limite} gratis · vuelve a 5 el ${dia}`;
}

function pintarProducto() {
  $('estado').hidden = true;
  $('titulo').textContent = producto.titulo || 'Producto sin título';
  $('precio').textContent = `Precio en la ficha: ${euros(producto.precio)}`;
  $('asin').textContent = producto.asin ? `· ${producto.asin}` : '';
  $('producto').hidden = false;
  $('costes').hidden = false;
}

function prepararFormulario() {
  if (!costes.categoriaElegida) costes.categoria = categoriaSugerida(producto, datos);

  rellenarSelect($('c-categoria'), datos.categorias, costes.categoria);
  rellenarSelect($('c-plan'), datos.planes, costes.plan);
  $('c-costeGenero').value = costes.costeGenero;
  $('c-costeEnvio').value = costes.costeEnvio;
  $('c-envioCobrado').value = costes.envioCobrado;
  $('c-unidades').value = costes.unidades;
  $('c-tasaDevolucion').value = Math.round(costes.tasaDevolucion * 100);
  $('c-recuperacionDevolucion').value = Math.round(costes.recuperacionDevolucion * 100);
  $('c-kleinunternehmer').checked = costes.kleinunternehmer !== false;

  $('costes').addEventListener('input', async (e) => {
    if (e.target.id === 'c-categoria') costes.categoriaElegida = true;
    costes = { ...costes, ...leerFormulario() };
    await almacen.escribir(CLAVE_COSTES, costes);
    calcular();
  });
}

function rellenarSelect(select, opciones, elegida) {
  select.replaceChildren(
    ...opciones.map((o) => {
      const op = document.createElement('option');
      op.value = o.id;
      op.textContent = o.nombre;
      op.selected = o.id === elegida;
      return op;
    }),
  );
}

const numero = (id, defecto = 0) => {
  const v = Number($(id).value);
  return Number.isFinite(v) && v >= 0 ? v : defecto;
};

function leerFormulario() {
  return {
    categoria: $('c-categoria').value,
    plan: $('c-plan').value,
    costeGenero: numero('c-costeGenero'),
    costeEnvio: numero('c-costeEnvio'),
    envioCobrado: numero('c-envioCobrado'),
    unidades: Math.max(1, numero('c-unidades', 1)),
    tasaDevolucion: Math.min(1, numero('c-tasaDevolucion') / 100),
    recuperacionDevolucion: Math.min(1, numero('c-recuperacionDevolucion') / 100),
    kleinunternehmer: $('c-kleinunternehmer').checked,
  };
}

function calcular() {
  const { desglose, equilibrio, avisos } = analizar(producto, costes, datos);

  $('beneficio').textContent = euros(desglose.beneficio);
  const aPerdida = desglose.beneficio <= 0;
  $('beneficio').parentElement.classList.toggle('perdida', aPerdida);
  $('resultado').classList.toggle('perdida', aPerdida);
  $('margen').textContent = porcentaje(desglose.margen);
  $('equilibrio').textContent = Number.isFinite(equilibrio) ? euros(equilibrio) : 'ningún precio';

  const filas = [
    ['Cobras (con envío)', desglose.bruto],
    ['IVA repercutido', -desglose.iva],
    ['Comisiones de Amazon', -desglose.comisiones],
    ['Género', -desglose.costeGenero],
    ['Envío', -desglose.costeEnvio],
    ['Licencia de envase', -desglose.licenciaEnvase],
    ['Coste esperado de devoluciones', -(desglose.beneficioVenta - desglose.beneficio)],
  ].filter(([, v]) => Math.abs(v) >= 0.005);

  const tabla = $('desglose');
  tabla.replaceChildren(
    ...filas.map(([etiqueta, valor]) => fila(etiqueta, euros(valor))),
    fila('Te queda', euros(desglose.beneficio), 'total'),
  );

  $('avisos').replaceChildren(
    ...avisos.map((a) => {
      const p = document.createElement('p');
      p.textContent = a;
      return p;
    }),
  );
  $('avisos').hidden = avisos.length === 0;
  $('resultado').hidden = false;
}

function fila(etiqueta, valor, clase) {
  const tr = document.createElement('tr');
  if (clase) tr.className = clase;
  const td1 = document.createElement('td');
  td1.textContent = etiqueta;
  const td2 = document.createElement('td');
  td2.textContent = valor;
  tr.append(td1, td2);
  return tr;
}

function mostrarMuro(uso) {
  $('estado').hidden = true;
  const dia = uso.reinicia.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const comprar = $('comprar');
  if (TIENDA.configurada) {
    $('muro-texto').textContent = `Pro quita el límite: ${TIENDA.precio}. Si prefieres esperar, el ${dia} vuelves a tener ${uso.limite}.`;
    comprar.href = TIENDA.urlCompra;
  } else {
    $('muro-texto').textContent = `La versión de pago todavía no está abierta. El ${dia} vuelves a tener ${uso.limite} análisis.`;
    comprar.setAttribute('aria-disabled', 'true');
    comprar.removeAttribute('href');
    comprar.textContent = 'Pro, próximamente';
  }
  $('muro').hidden = false;
  $('activar').open = true;
}

$('form-licencia').addEventListener('submit', async (e) => {
  e.preventDefault();
  const aviso = $('licencia-estado');
  aviso.textContent = 'Activando…';
  try {
    await activar($('clave').value, { almacen, config: TIENDA, equipo: await idDeEquipo(almacenLocal) });
    aviso.textContent = 'Listo. Pro activo en este equipo.';
    setTimeout(() => location.reload(), 700);
  } catch (error) {
    aviso.textContent =
      error instanceof ErrorLicencia
        ? { 'sin-conexion': 'Sin conexión con el servidor de licencias. Prueba en un minuto.', 'limite-equipos': 'Esa clave ya está en todos los equipos que permite. Libérala en uno («Usar en otro equipo») y vuelve a intentarlo.', caducada: 'Esa clave ha caducado.', revocada: 'Esa clave ya no vale.' }[error.motivo] ?? error.message
        : 'No se ha podido activar.';
  }
});

$('desactivar').addEventListener('click', async () => {
  await desactivar(almacen, { config: TIENDA });
  location.reload();
});

arrancar().catch((e) => {
  $('estado').textContent = `Algo ha fallado: ${e.message}`;
});
