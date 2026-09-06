# Verificar las tarifas antes de publicar

`web/data/tarifas-2026.json` se ha rellenado con cifras obtenidas de fuentes
secundarias, porque el entorno donde se construyó este proyecto tiene bloqueado el
acceso a las webs oficiales. **Están sin contrastar.** Mientras el campo `estado`
valga `pendiente_verificacion`, la web muestra un aviso amarillo al usuario.

Verificarlo es media hora de trabajo y es lo primero que hay que hacer.

## Qué hay que comprobar

### 1. Tabla de tramos del RETA
Fuente: [Seguridad Social — Bases y tipos de cotización](https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/36537)
y la Ley de Presupuestos del ejercicio en el BOE.

Para cada uno de los 15 tramos confirma **el rango de rendimientos netos mensuales**
y **la cuota mensual**. Lo confirmado hasta ahora:

- Son 15 tramos: tabla reducida (1–6, hasta 1.700 €/mes) y general (7–15).
- Las cuotas van de 200 € a 590 €/mes y se mantienen igual que en 2025.
- La cuota es la base de cotización por el 31,5 %, MEI del 0,9 % incluido.

Lo que **no** está confirmado son los importes intermedios de los tramos 2 a 14 y
las fronteras exactas entre tramos.

### 2. Tarifa plana
Confirma la cuota reducida vigente y su duración. En el JSON está como
`reta.tarifa_plana`.

### 3. Escala de IRPF
Fuente: [Agencia Tributaria](https://sede.agenciatributaria.gob.es/). La escala del
JSON es la agregada estatal + autonómica de referencia. Si te diriges a una comunidad
concreta, sustitúyela por la suya.

### 4. Límites
- Mínimo personal general (`irpf.minimo_personal`).
- Porcentaje y tope anual de gastos de difícil justificación
  (`irpf.gastos_dificil_justificacion`).

## Cómo se actualiza

1. Edita los valores en `web/data/tarifas-2026.json`.
2. Cambia `"estado": "pendiente_verificacion"` por `"estado": "verificado"` y añade
   la fecha en `nota_estado`. El aviso de la web desaparece solo.
3. Ejecuta `npm test`. La suite comprueba que la tabla de tramos siga cubriendo todo
   el eje sin huecos ni solapes, así que un error de transcripción salta ahí.
4. Despliega.

## Cada año

Un ejercicio nuevo es un archivo nuevo: copia el JSON a `tarifas-2027.json`,
actualiza las cifras y cambia la ruta en `web/js/app.js` y en el test. Ninguna
fórmula debería necesitar cambios.
