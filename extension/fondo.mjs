/**
 * Service worker. Solo se ocupa del contador del icono.
 *
 * El numero que se ve sobre el icono son los analisis gratis que quedan
 * este mes. Que se vea sin abrir nada es lo que hace que el limite se
 * entienda antes de chocar con el.
 */

import { almacenChrome } from './lib/almacen.mjs';
import { leerUso, CLAVE as CLAVE_USO } from './lib/uso.mjs';
import { estadoLicencia, CLAVE as CLAVE_LICENCIA } from './lib/licencia.mjs';
import { LIMITE_GRATIS, TIENDA } from './config.mjs';

const almacen = almacenChrome();

async function pintarInsignia() {
  const licencia = await estadoLicencia(almacen, { config: TIENDA });
  if (licencia.pro) {
    await chrome.action.setBadgeText({ text: 'PRO' });
    await chrome.action.setBadgeBackgroundColor({ color: '#0f6b4f' });
    return;
  }
  const uso = await leerUso(almacen, { limite: LIMITE_GRATIS });
  await chrome.action.setBadgeText({ text: String(uso.restantes) });
  await chrome.action.setBadgeBackgroundColor({ color: uso.restantes === 0 ? '#8a4b12' : '#0f6b4f' });
}

chrome.runtime.onInstalled.addListener(pintarInsignia);
chrome.runtime.onStartup.addListener(pintarInsignia);

chrome.storage.onChanged.addListener((cambios) => {
  if (CLAVE_USO in cambios || CLAVE_LICENCIA in cambios) pintarInsignia();
});
