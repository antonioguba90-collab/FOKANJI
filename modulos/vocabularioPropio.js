// ==========================================
// VOCABULARIO PROPIO DEL JUGADOR
// ==========================================
// El jugador escribe su lista con el mismo formato que los mazos del juego
// (ver parser.js) y se guarda en localStorage para jugarla como un mazo más.

import { parsearLista } from './parser.js';

const CLAVE_ALMACEN = "fokanji.vocabPropio";

// Identificador del mazo del jugador dentro de MODES
export const MODO_PROPIO = "custom";
// Mínimo de palabras normales para que la lista sea jugable
export const MIN_PALABRAS_PROPIAS = 3;

export function obtenerTextoGuardado() {
  try { return localStorage.getItem(CLAVE_ALMACEN) || ""; }
  catch (e) { return ""; }
}

export function guardarTexto(texto) {
  try { localStorage.setItem(CLAVE_ALMACEN, texto); } catch (e) {}
}

export function borrarTextoGuardado() {
  try { localStorage.removeItem(CLAVE_ALMACEN); } catch (e) {}
}

// Parsea el texto y devuelve el pool { normales, jefe }
export function obtenerPool(texto = obtenerTextoGuardado()) {
  return parsearLista(texto);
}

// ¿El texto da para un mazo jugable?
export function esJugable(texto = obtenerTextoGuardado()) {
  return obtenerPool(texto).normales.length >= MIN_PALABRAS_PROPIAS;
}
