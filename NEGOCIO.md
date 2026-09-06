# Cuánto me queda — plan de negocio con 50 € de capital

## 1. La apuesta en una frase

Una calculadora gratuita que responde la pregunta que todo autónomo español se hace
—*"he facturado esto, ¿cuánto es mío de verdad?"*— y que monetiza el momento exacto en
que el usuario ve la cifra y piensa *"necesito ayuda con esto"*.

Con 50 € no se compra tráfico ni inventario. Lo único que se puede comprar es
**tiempo de vida**: un dominio y un año de margen. El activo real es el producto,
que ya está construido y desplegable en este repositorio.

## 2. Por qué este negocio y no otro

Tres filtros descartan casi todo lo demás con este capital:

| Filtro | Consecuencia |
| --- | --- |
| Coste marginal cero | Nada de stock, envíos ni horas facturables. Software estático. |
| Sin coste fijo mensual | Hosting, analítica y correo a 0 €. El único gasto recurrente es el dominio. |
| Intención comercial en la propia consulta | Quien calcula sus impuestos es un comprador natural de software de facturación o de gestoría. |

Una tienda de print-on-demand cumple el primero pero no el tercero: el tráfico es
frío y hay que pagarlo. Una calculadora fiscal atrae a alguien que ya tiene el
problema, el dinero y la urgencia.

## 3. Producto

Ya construido y funcionando en `web/`:

- Calculadora de cuota RETA por tramos, IRPF e IVA en un solo cálculo.
- Métrica diferencial: **qué porcentaje apartar de cada factura**. Ningún competidor
  la muestra; es la respuesta que la gente busca de verdad.
- Sin registro, sin correo, sin cookies. Todo ocurre en el navegador.
- Página de metodología abierta: la confianza es el producto en un tema fiscal.

## 4. Presupuesto de los 50 €

| Partida | Coste | Nota |
| --- | ---: | --- |
| Dominio `.es` o `.com`, 1 año | 10 € | Único gasto imprescindible. |
| Hosting (Cloudflare Pages) | 0 € | Plan gratuito, sin límite práctico para un sitio estático. |
| Correo profesional | 0 € | Email Routing: alias `hola@dominio` reenviado a tu buzón. |
| Analítica sin cookies | 0 € | Cloudflare Web Analytics. Evita el banner de consentimiento. |
| Certificado TLS y CDN | 0 € | Incluidos. |
| **Reserva de validación** | 25 € | Se gasta *solo* si se cumple el criterio del día 30 (§8). |
| **Colchón** | 15 € | Renovación del dominio y sustos. |
| **Total** | **50 €** | |

Los 25 € de reserva no se tocan el primer mes. Gastarlos antes de tener señal de
demanda es la forma más rápida de perderlos.

## 5. Cómo entra el dinero

En orden de implantación, del más barato al más caro de montar:

1. **Afiliación a software de facturación y gestorías online.** Quipu, Declarando,
   TaxDown, Holded y similares tienen programas de afiliados abiertos y gratuitos.
   Las comisiones habituales van de 20 € a 80 € por alta de pago. Encaja de forma
   natural: el resultado del cálculo termina en *"esto lo llevas mejor con…"*.
2. **Derivación a gestoría.** Un acuerdo con una gestoría local a comisión por cliente
   captado paga más por lead que la afiliación, pero exige negociar y facturar.
3. **Pro (mes 3 en adelante).** Informe anual en PDF y previsión trimestral por 9 €/año,
   cobrado con Stripe o Lemon Squeezy: 0 € de coste fijo, comisión solo por venta.

Regla innegociable: la recomendación se escribe antes de mirar qué comisión paga
cada uno, y la afiliación se declara junto al enlace. Un sitio fiscal vive de que
te crean.

## 6. Números de referencia

Los siguientes valores son **supuestos de trabajo**, no proyecciones. Sirven para
saber qué hay que medir, no para prometer nada:

- Visitas orgánicas al mes 3, con contenido constante: 1.000–3.000.
- Clic al enlace de afiliación: 2–4 % de las visitas.
- Conversión del clic a alta de pago: 3–8 %.
- Comisión media por alta: 35 €.

Con la banda baja (1.000 visitas, 2 %, 3 %) salen 0,6 altas al mes: **21 €**. Con la
banda alta (3.000, 4 %, 8 %) salen 9,6 altas: **336 €**. El punto de equilibrio —cubrir
los 10 € del dominio— se alcanza con **una sola conversión al año**.

Esto no es un negocio que se hace rico rápido. Es un negocio cuyo suelo es
prácticamente cero y cuyo techo depende solo de cuánto tráfico se acumule.

## 7. Adquisición sin presupuesto

- **SEO de cola larga.** Un artículo por semana respondiendo a búsquedas concretas:
  *cuánto se paga de autónomo facturando 30.000 €*, *cuánto tengo que apartar de cada
  factura*, *tarifa plana segundo año*. Cada uno enlaza a la calculadora.
- **Comunidades.** Foros y subreddits de autónomos: responder de verdad a la pregunta
  y enlazar la herramienta como apoyo, nunca al revés.
- **Compartir el resultado.** Añadir un botón que copie el resumen del cálculo; que la
  distribución la haga el propio usuario.

## 8. Plan de 30 días

| Semana | Qué se hace | Coste |
| --- | --- | ---: |
| 1 | Verificar las tarifas (`docs/VERIFICAR-TARIFAS.md`), comprar el dominio, desplegar en Cloudflare Pages, completar el aviso legal. | 10 € |
| 2 | Solicitar el alta en 3 programas de afiliados. Publicar los 3 primeros artículos. Dar de alta el sitio en Search Console. | 0 € |
| 3 | Colocar el enlace de afiliación en el resultado. Publicar 2 artículos más. Primeras respuestas en comunidades. | 0 € |
| 4 | Medir. Decidir con el criterio de abajo. | 0 € |

**Criterio del día 30.** Si hay **más de 100 visitas orgánicas** y **al menos 1 clic de
afiliación**, hay señal: se liberan los 25 € de reserva para acelerar contenido. Si no,
no se gasta un euro más; se sigue publicando otro mes, porque el SEO tarda de 3 a 6
meses en despertar y el coste de esperar es cero.

**Criterio de cierre.** Si al mes 6 no hay ningún ingreso, se deja el sitio en pie —no
cuesta nada— y se para la inversión de tiempo.

## 9. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cifras fiscales desactualizadas o erróneas | Toda la fiscalidad vive en `web/data/tarifas-2026.json`. Actualizarla es editar un archivo, y los tests fallan si la tabla queda incoherente. La web avisa mientras el dato no esté verificado. |
| Reclamación por asesoramiento | La web se declara orientativa en portada, metodología y pie. No liquida impuestos: estima. |
| Competencia SEO de gestorías con presupuesto | No se compite por *"cuota de autónomos"*. Se compite por la pregunta que ellas no responden: cuánto apartar de cada factura. |
| Un solo canal de ingresos | El Pro del mes 3 rompe la dependencia de la afiliación. |

## 10. Qué falta que solo puede hacer una persona

El producto está listo; estas cuatro cosas requieren identidad legal y no las puede
hacer un agente:

1. Verificar la tabla de tramos contra el BOE (~30 min, ver `docs/VERIFICAR-TARIFAS.md`).
2. Comprar el dominio y conectar el repositorio a Cloudflare Pages (~20 min).
3. Rellenar los datos del titular en `web/aviso-legal.html` (~5 min).
4. Solicitar el alta en los programas de afiliados (~40 min).

Aproximadamente **hora y media de trabajo y 10 € gastados** para estar en producción.
Los 40 € restantes siguen en la cuenta hasta que los datos digan que merece la pena.
