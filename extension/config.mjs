/**
 * Configuracion de la extension. Lo unico que hay que tocar para publicar.
 *
 * Mientras `tienda.configurada` sea false, la extension funciona entera en su
 * version gratuita y el boton de comprar avisa de que la tienda todavia no
 * esta abierta, en vez de mandar al usuario a un enlace roto. No se publica
 * un "Hazte Pro" que no cobra.
 */

export const LIMITE_GRATIS = 5;

export const TIENDA = {
  /** Pon true el dia que el producto este publicado y cobrando. */
  configurada: false,

  /** "propio" = Stripe con tu Worker (licencias/). "lemonsqueezy" = sin servidor. */
  proveedor: 'propio',

  /**
   * El Payment Link de Stripe. En Stripe, al crearlo, pon como pagina de
   * confirmacion tu propia URL:
   *
   *   https://licencias-margen.TU-SUBDOMINIO.workers.dev/exito?session_id={CHECKOUT_SESSION_ID}
   *
   * Ahi es donde el comprador ve su clave. Sin eso, paga y no recibe nada.
   */
  urlCompra: 'https://buy.stripe.com/TU-PAYMENT-LINK',

  /**
   * Tu validador. Responde {valida, expira}. Lo sirve el Worker de
   * licencias/, y su dominio tiene que estar tambien en host_permissions
   * del manifiesto: si no, Chrome bloquea la peticion sin decir nada.
   */
  endpoint: 'https://licencias-margen.EJEMPLO.workers.dev/validar',

  /** Solo para Lemon Squeezy: se comprueban al activar la clave. */
  tiendaId: 0,
  productoId: 0,

  /** Lo que se le ensena al usuario en el panel de compra. */
  precio: '19 € pago único',
};

/** Valores de partida del calculo. El usuario los cambia y se guardan. */
export const COSTES_POR_DEFECTO = {
  plan: 'particular',
  categoria: 'general',
  kleinunternehmer: true,
  tipoIva: 0.19,
  costeGenero: 0,
  costeGeneroLlevaIva: true,
  costeEnvio: 0,
  costeEnvioLlevaIva: true,
  envioCobrado: 0,
  licenciaEnvase: 0.08,
  tasaDevolucion: 0.05,
  recuperacionDevolucion: 0.5,
  envioRetornoAsumido: 0,
  unidades: 1,
};

/** Clave del almacen donde viven los costes del usuario. */
export const CLAVE_COSTES = 'costes';
