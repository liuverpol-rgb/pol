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

  /** "lemonsqueezy" (sin servidor) o "propio" (Stripe + tu endpoint). Ver README. */
  proveedor: 'lemonsqueezy',

  /** Enlace de compra (checkout de Lemon Squeezy o Payment Link de Stripe). */
  urlCompra: 'https://TU-TIENDA.lemonsqueezy.com/checkout/buy/TU-VARIANTE',

  /**
   * Ids de tu tienda y de tu producto en Lemon Squeezy. Se comprueban al
   * activar: sin esto, la clave de CUALQUIER producto de Lemon Squeezy
   * desbloquearia esta extension. Estan en el panel, en la URL de la tienda
   * y del producto.
   */
  tiendaId: 0,
  productoId: 0,

  /** Solo para proveedor "propio": tu validador. Debe responder {valida, expira}. */
  endpoint: '',

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
