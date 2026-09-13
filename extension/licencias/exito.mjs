/**
 * La pagina donde aterriza el comprador despues de pagar.
 *
 * Es texto dentro de un modulo porque un Worker no sirve archivos sueltos sin
 * montar un Pages aparte, y aqui todo el despliegue tiene que ser un solo
 * "wrangler deploy".
 *
 * Reintenta sola: entre que Stripe cobra y el webhook llega pueden pasar unos
 * segundos, y en ese hueco el comprador no puede ver un error.
 */

export const paginaExito = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tu clave de Margen real</title>
<meta name="robots" content="noindex">
<style>
:root {
  color-scheme: light dark;
  --fondo: #fbfaf8; --superficie: #fff; --borde: #e5e1da;
  --texto: #1c1a17; --suave: #6b6559; --acento: #0f6b4f; --acento-suave: #e8f3ee;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fondo: #14140f; --superficie: #1c1c17; --borde: #34342c;
    --texto: #f0ede6; --suave: #a5a091; --acento: #63c69f; --acento-suave: #17332a;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0 20px 64px; background: var(--fondo); color: var(--texto);
  font: 17px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
}
main { max-width: 560px; margin: 0 auto; }
h1 { font-size: clamp(1.6rem, 4vw, 2.1rem); letter-spacing: -.02em; margin: 56px 0 8px; }
p { margin: 0 0 16px; }
.suave { color: var(--suave); }
.clave {
  background: var(--acento-suave); border: 1px solid var(--acento); border-radius: 12px;
  padding: 20px; margin: 24px 0; text-align: center;
}
#clave {
  font: 700 clamp(1.2rem, 5vw, 1.8rem)/1.3 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .04em; word-break: break-all; margin: 0 0 12px;
}
button {
  font: inherit; font-weight: 600; padding: 8px 16px; cursor: pointer;
  color: var(--texto); background: var(--superficie);
  border: 1px solid var(--borde); border-radius: 8px;
}
ol { padding-left: 20px; }
li { margin-bottom: 8px; }
footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--borde); color: var(--suave); font-size: .9rem; }
</style>
</head>
<body>
<main>
  <h1>Gracias. Esta es tu clave</h1>
  <p class="suave">Guarda este correo o esta página: la clave no se vuelve a enseñar.</p>

  <div class="clave">
    <p id="clave">Buscando tu clave…</p>
    <button id="copiar" type="button" hidden>Copiar</button>
  </div>

  <h2>Cómo activarla</h2>
  <ol>
    <li>Abre la extensión pulsando su icono en Chrome.</li>
    <li>Despliega <strong>«Ya tengo una clave de Pro»</strong>.</li>
    <li>Pega la clave y pulsa <strong>Activar</strong>. Eso es todo.</li>
  </ol>
  <p class="suave">
    Vale para dos navegadores. Si cambias de ordenador, pulsa «Usar en otro
    equipo» en el primero: eso libera la plaza y la clave vuelve a estar
    disponible.
  </p>

  <footer>
    ¿Algo no funciona? Escribe a <a href="mailto:CORREO_DE_SOPORTE">CORREO_DE_SOPORTE</a>
    con el número de pedido del recibo de Stripe.
  </footer>
</main>

<script>
const sesion = new URLSearchParams(location.search).get('session_id');
const salida = document.getElementById('clave');
const boton = document.getElementById('copiar');

async function buscar(intento = 0) {
  if (!sesion) {
    salida.textContent = 'Falta el identificador de la compra.';
    return;
  }
  try {
    const r = await fetch('/clave?session_id=' + encodeURIComponent(sesion), { cache: 'no-store' });
    const datos = await r.json();
    if (datos.clave) {
      salida.textContent = datos.clave;
      boton.hidden = false;
      boton.onclick = async () => {
        await navigator.clipboard.writeText(datos.clave);
        boton.textContent = 'Copiada';
      };
      return;
    }
  } catch (e) {
    /* reintentamos abajo */
  }
  if (intento < 15) {
    salida.textContent = 'Confirmando el pago…';
    setTimeout(() => buscar(intento + 1), 2000);
  } else {
    salida.textContent = 'El pago está hecho, pero la clave tarda más de lo normal. Escríbenos y te la mandamos.';
  }
}
buscar();
</script>
</body>
</html>`;
