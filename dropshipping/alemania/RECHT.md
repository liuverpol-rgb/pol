# Vender sin stock desde Alemania — lo que hay que tener hecho antes de la primera venta

Léelo antes de abrir una tienda o un listado. No es burocracia opcional: tres de
estas obligaciones se incumplen *el día que vendes el primer artículo* y dos de
ellas las vigila una industria de despachos que vive de mandar *Abmahnungen*.

La buena noticia: **todo lo de esta página cuesta entre 20 y 40 €**, y casi todo
es rellenar formularios. La mala: una sola pieza que falte convierte un negocio
de 5 € por pedido en una multa de cuatro cifras.

## Lo primero, porque cambia el negocio entero

| Lo que quieres vender | ¿Se puede? |
| --- | --- |
| Artículo impreso o fabricado **en la UE** (print-on-demand europeo) | **Sí.** Es la vía limpia. |
| Artículo de un mayorista **de la UE** que envía por ti | **Sí**, si te da los datos del fabricante. |
| Artículo enviado **directamente desde China** | **No.** Falta la persona responsable en la UE (§ GPSR). |
| Aparatos con enchufe o batería, cosmética, juguetes, alimentos, sanitarios | **No con este capital.** Cada uno tiene su propio registro. |

Esa tabla es la que aplica [`../nichos.mjs`](../nichos.mjs) como eliminatoria. No
es una opinión sobre modelos de negocio: es la ley de producto.

## 1. GPSR: por qué el dropshipping desde China ya no existe

El Reglamento (UE) 2023/988 de seguridad general de los productos es de
aplicación directa **desde el 13 de diciembre de 2024**. Su artículo 4 dice que un
producto solo puede ponerse en el mercado de la UE si existe un **operador
económico establecido en la Unión** responsable de él: el fabricante europeo, el
importador, un representante autorizado o un prestador de servicios logísticos.

Traducido: si el fabricante está en China y tú vendes con envío directo desde
allí, **no hay nadie en la UE que responda del producto, y entonces no se puede
vender.** No es que sea arriesgado. Es que está prohibido.

Y desde el **19 de febrero de 2026** Alemania tiene la nueva *ProdSG* que lo
sanciona: la mayoría de las infracciones llegan a **10.000 €** y algunas a
**100.000 €**.

Además, cada anuncio tiene que llevar visible, antes de la compra:

- nombre, dirección postal y dirección electrónica del fabricante;
- si el fabricante no está en la UE, lo mismo de la **persona responsable en la UE**;
- las advertencias e instrucciones de seguridad en alemán;
- un elemento que identifique el producto (modelo, referencia).

### La trampa del print-on-demand: la marca te convierte en fabricante

El artículo 13 de la GPSR: quien pone un producto en el mercado **bajo su propio
nombre o marca** se considera **fabricante**, con todas sus obligaciones.

Si mandas imprimir camisetas y les pones tu etiqueta de marca, el fabricante a
efectos legales eres tú, no la imprenta. Para una camiseta impresa eso es
asumible —la documentación técnica de la prenda en blanco te la da el proveedor
y el análisis de riesgos de un algodón es corto—, pero **para cualquier cosa con
función de seguridad, electrónica o contacto con la piel, no lo es.**

La forma sencilla de evitarlo al empezar: vender el artículo con la marca del
fabricante puesta y tu diseño impreso encima, sin sustituir su etiqueta por la
tuya. Pierdes algo de imagen de marca y te ahorras el papeleo de fabricante.

## 2. Gewerbeanmeldung: antes de la primera venta

Vender online de forma continuada y con ánimo de lucro es actividad comercial
(*Gewerbe*), y hay que darla de alta en el *Gewerbeamt* del ayuntamiento. En
Reinbek eso es la **Stadt Reinbek**; en el resto de Schleswig-Holstein, tu
Amt correspondiente.

- **Coste: entre 20 y 40 €** según el municipio. Confírmalo en tu ayuntamiento.
- Se puede hacer presencialmente o por el portal del Land.
- El *Gewerbeamt* avisa solo al *Finanzamt*, a la IHK y a la Berufsgenossenschaft.

**Si ya tienes un Gewerbe por el negocio de webs de este repositorio**, no abras
otro: haces una **Gewerbe-Ummeldung** para ampliar la actividad
(*Einzelhandel mit Waren verschiedener Art, Online-Handel*). Es más barata y
evita tener dos contabilidades.

Después llega el *Fragebogen zur steuerlichen Erfassung* de ELSTER. Ahí decides
lo del punto siguiente, y ahí pides la **USt-IdNr**, que necesitas aunque seas
Kleinunternehmer (ver punto 4).

## 3. Kleinunternehmerregelung: la decisión que más dinero mueve

Desde 2025 el § 19 UStG funciona con dos umbrales:

- facturación del **año anterior ≤ 25.000 €**, y
- facturación del **año en curso ≤ 100.000 €**.

Cumpliendo los dos, tus ventas están **exentas de IVA**: no lo repercutes, no lo
ingresas y no presentas declaraciones trimestrales de IVA repercutido. En cambio
**no deduces el IVA soportado**: el que te cobra el proveedor es coste tuyo.

Ojo con el segundo umbral: si superas los 100.000 € a mitad de año, la exención
se acaba **en la operación misma que lo rebasa**, no el 1 de enero siguiente.

¿Cuál sale mejor? Ejecútalo, no lo adivines:

```bash
node dropshipping/calcular.mjs camiseta-algodon
```

La tabla compara los dos regímenes con las comisiones reales. Con precios de
consumidor final y proveedores que te cobran IVA, el Kleinunternehmer gana casi
siempre: te quedas el 19 % del precio y pierdes solo la deducción de un coste
menor. Cambia de signo cuando tus compras son grandes en relación con tus
ventas, o cuando vendes a empresas, que no miran el IVA porque lo deducen.

## 4. La trampa del reverse charge, que casi nadie cuenta

Etsy factura sus comisiones desde **Irlanda**; eBay, desde Luxemburgo; Stripe,
desde Irlanda. Son servicios intracomunitarios, así que se aplica el
**§ 13b UStG**: el deudor del IVA eres tú, el destinatario.

Y aquí está la trampa: **el Kleinunternehmer también es deudor de ese IVA, pero
el § 19 UStG le prohíbe deducirlo.** Resultado: el 19 % de todas las comisiones
de Etsy sale de tu bolsillo, y encima tienes que presentar la
*Umsatzsteuer-Voranmeldung* de los meses en que hubo comisiones.

En regimen general es un apunte neutro: lo declaras y lo deduces en la misma
línea. Por eso [`../margen.mjs`](../margen.mjs) solo aplica el recargo al
Kleinunternehmer, y por eso su ventaja es menor de lo que parece.

Consecuencia práctica: **pide la USt-IdNr aunque seas Kleinunternehmer.** Sin
ella, Etsy te factura con IVA irlandés, que no recuperas nunca. Con ella recibes
factura neta y pagas el IVA alemán, que al menos es el tipo correcto.

## 5. VerpackG y LUCID: gratis, obligatorio, y te bloquean sin él

Cualquiera que envíe mercancía en un paquete en Alemania tiene que estar
registrado en el registro **LUCID** de la *Zentrale Stelle Verpackungsregister*
**antes de la primera venta**, y licenciar sus envases en un sistema dual.

- El registro en LUCID es **gratuito** y se hace online en un rato.
- La licencia de las cantidades pequeñas cuesta del orden de **30-50 € al año**.
- **Etsy, eBay y Amazon bloquean la cuenta sin número LUCID.** No es opcional ni
  en la práctica.
- Las multas llegan a **200.000 €**.

En envío directo la responsabilidad es de **quien pone el envase en circulación
por primera vez**. La regla que importa: **si en el paquete apareces tú como
remitente y no se ve al proveedor, el obligado eres tú.** Y si el proveedor
figura como remitente, tienes que asegurarte de que él lo cumple — por escrito,
no de palabra.

En print-on-demand suele imprimirse tu nombre como remitente. Cuenta con que te
toca a ti.

## 6. Widerrufsrecht: 14 días, y la excepción que lo cambia todo

Vendiendo a consumidores a distancia, el cliente tiene **14 días para desistir
sin dar motivos** (§ 355 BGB). Tienes que:

- entregar la **Widerrufsbelehrung** antes de la compra, en texto, y
- adjuntar el **Muster-Widerrufsformular** del anexo 2 del art. 246a EGBGB.

Si no informas bien, el plazo se alarga **hasta 12 meses y 14 días**. Y devolver
significa devolver también **el envío de ida** que te pagó el cliente (el porte
estándar; no el exprés). El retorno lo paga el cliente solo si lo dijiste en la
Widerrufsbelehrung.

**La excepción que vale oro:** el § 312g Abs. 2 Nr. 1 BGB excluye el
desistimiento en bienes **fabricados según especificaciones del consumidor o
claramente personalizados**. Una sudadera con el logo del club que te dio el
cliente entra ahí. Un póster de tu catálogo que imprimes al recibir el pedido
**no**: la personalización tiene que venir del comprador, no ser tu forma de
producir.

Por eso el nicho que gana la criba es el B2B personalizado: sin devoluciones y
cobrado por adelantado. Y por eso la ropa de catálogo es el peor:
[`../calcular.mjs`](../calcular.mjs) te enseña que una devolución se come tres
ventas.

## 7. La tienda propia: Impressum, datos y botón

Si vendes en un marketplace, casi todo esto lo aporta la plataforma. **En tienda
propia lo aportas tú, y es donde se concentra el riesgo de Abmahnung.**

| Obligación | Norma | Qué significa en la práctica |
| --- | --- | --- |
| **Impressum** | § 5 DDG | Nombre, dirección postal real, correo, teléfono o formulario, USt-IdNr si la tienes. Accesible desde cualquier página con dos clics. |
| **Datenschutzerklärung** | Art. 13 DSGVO | Qué datos tratas, con qué base, cuánto los guardas, y los encargados (pasarela de pago, proveedor que envía). |
| **Precio final** | § 3 PAngV | El precio con IVA incluido, más los gastos de envío indicados aparte y de forma visible. Con envase, el *Grundpreis* por kg o litro. |
| **Botón de pedido** | § 312j Abs. 3 BGB | El botón dice `Zahlungspflichtig bestellen` o `Kaufen`. Un `Weiter` o un `Absenden` no vale. |
| **Plazo de entrega** | Art. 246a EGBGB | Fecha o plazo concreto. «Normalmente rápido» no es un plazo. |
| **Widerrufsbelehrung + formulario** | § 355 BGB | Antes del pedido, y por correo tras la compra. |
| **Datos de producto GPSR** | Art. 19 GPSR | Fabricante y persona responsable, visibles en la ficha. |
| **Composición textil** | TextilKennzVO | «100 % Baumwolle» en el artículo y en el anuncio. |

**Las AGB no son obligatorias.** Sorprende a mucha gente. Un comercio online
funciona legalmente con Impressum, Datenschutzerklärung, Widerrufsbelehrung y
precios correctos. Y **copiar las AGB de otra tienda sí es un problema**: es
infracción de derechos de autor y además te ata a cláusulas que no encajan con
tu caso. Si las quieres, las AGB configurables del *Händlerbund* o de la
IT-Recht-Kanzlei cuestan unos 10 € al mes con garantía frente a Abmahnungen.
Mejor eso que un texto regalado.

[`../tienda/generar.mjs`](../tienda/generar.mjs) genera las cuatro páginas
obligatorias con tus datos, y deja marcado con `[prüfen]` todo lo que no puede
saber por ti.

## 8. Vender fuera de Alemania

Mientras vendas solo a Alemania, lo de arriba es todo. En cuanto vendas a
consumidores de otros países de la UE:

- por debajo de **10.000 € al año** en ventas a distancia intracomunitarias
  sigues aplicando las reglas alemanas;
- por encima, se tributa en el país del cliente y se liquida por el
  **One-Stop-Shop** del BZSt, con un alta previa.

Es una razón más para empezar en `.de` y en alemán: un solo régimen fiscal, un
solo idioma de atención al cliente y un solo juego de obligaciones.

## El orden correcto

```
1. Gewerbeanmeldung (o Ummeldung si ya tienes)         20-40 €
2. Fragebogen zur steuerlichen Erfassung en ELSTER      0 €
   → decides Kleinunternehmer, pides la USt-IdNr
3. Registro en LUCID + licencia de envases              0 € + ~35 €/año
4. Proveedor en la UE y sus datos de fabricante         0 €
5. Widerrufsbelehrung y textos legales                  0 €
6. Primer listado o primera página de producto          0,18 € en Etsy
   ↑ hasta aquí, nada de vender
7. Primera venta
```

Los pasos 1 a 3 se hacen en una tarde. El 4 es el que de verdad decide el
negocio, y está en [`PROVEEDORES.md`](PROVEEDORES.md).

---

*Esto es un resumen práctico escrito para decidir, no asesoramiento jurídico. Si
vas a hacer volumen, una hora con un abogado alemán de comercio electrónico
cuesta menos que la primera Abmahnung, y la cuota mensual de un servicio de
textos legales cuesta menos todavía.*

## Fuentes

- [Händlerbund — Produktsicherheitsverordnung (GPSR): Das musst du jetzt wissen](https://www.haendlerbund.de/de/ratgeber/recht/produktsicherheitsverordnung)
- [GPSR Onlineshop: Pflichtangaben seit Februar 2026](https://www.ihp-media.com/ratgeber/gpsr-onlineshop-pflichtangaben-2026/)
- [noknots — GPSR-Verantwortlicher: Was EU-Importeure wissen müssen](https://www.noknots.com/de/blog/gpsr-verantwortlicher-eu-importeure)
- [IHK Region Stuttgart — Kleinunternehmerregelung, § 19 UStG](https://www.ihk.de/stuttgart/fuer-unternehmen/recht-und-steuern/steuerrecht/umsatzsteuer-national/kleinunternehmerregelung-in-der-umsatzsteuer-1843632)
- [Taxfix — Kleinunternehmergrenze 2026: neue Umsatzlimits](https://taxfix.de/ratgeber/selbststaendige/kleinunternehmergrenze/)
- [Bösel Steuerberater — Steuerfalle Kleinunternehmer: Reverse Charge](https://boesel-steuerberater.de/steuerfalle-fuer-kleinunternehmerdas-reverse-charge-verfahren/)
- [SyncFuchs — Kleinunternehmer auf Etsy: was du beachten musst](https://syncfuchs.de/blog/etsy-kleinunternehmer-2026)
- [Zentrale Stelle Verpackungsregister — Pflichten für Onlinehändler](https://www.verpackungsregister.org/ich-bin-versand-und-onlinehaendler)
- [IT-Recht-Kanzlei — VerpackG: Verantwortlichkeit bei Fulfillment und Dropshipping](https://www.it-recht-kanzlei.de/verpackg-verantwortlichkeit-fulfillment-dropshipping-lucid.html)
- [Lizenzero — Dropshipping und Verpackungsgesetz: wer ist zuständig?](https://www.lizenzero.de/blog/dropshipping-und-verpackungsgesetz-wer-ist-zustaendig/)
