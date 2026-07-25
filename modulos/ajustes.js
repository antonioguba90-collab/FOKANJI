// ==========================================
// AJUSTES DEL JUGADOR (PERSISTIDOS EN localStorage)
// ==========================================
// Módulo hoja: no importa nada del juego. El resto de módulos
// leen los valores con obtenerAjuste() o se suscriben con alCambiarAjuste().

const CLAVE_ALMACEN = "fokanji.ajustes";

// Opciones de la ayuda de romaji: umbral en "frames a 60fps" (600 = 10 s)
export const OPCIONES_AYUDA_ROMAJI = {
  inmediata: { etiqueta: "Inmediata", umbral: 0 },
  normal:    { etiqueta: "A los 10 s", umbral: 600 },
  tardia:    { etiqueta: "A los 20 s", umbral: 1200 },
};

// Rango permitido de cada ajuste numérico (también lo usa la UI para los sliders)
export const RANGOS_AJUSTES = {
  volumenMusica:       { min: 0,  max: 1,   step: 0.05 },
  volumenEfectos:      { min: 0,  max: 1,   step: 0.05 },
  palabrasPorFase:     { min: 5,  max: 60,  step: 5 },
  palabrasGuardian:    { min: 3,  max: 15,  step: 1 },
  palabrasJefeFinal:   { min: 3,  max: 15,  step: 1 },
  frasesJefeFinal:     { min: 0,  max: 6,   step: 1 },
  arcadeKillsGuardian: { min: 10, max: 100, step: 5 },
};

const AJUSTES_DEFECTO = {
  volumenMusica: 0.75,       // 0..1
  volumenEfectos: 0.8,       // 0..1
  ayudaRomaji: "normal",     // clave de OPCIONES_AYUDA_ROMAJI
  mostrarTraduccion: true,   // traducción en español durante la partida
  palabrasPorFase: 30,       // tamaño de cada fase (modo Fases)
  palabrasGuardian: 8,       // palabras del examen del guardián
  palabrasJefeFinal: 8,      // palabras del examen del jefe final
  frasesJefeFinal: 3,        // frases BOSS_FRAS que añade el jefe final
  arcadeKillsGuardian: 40,   // cada cuántos aciertos sale guardián en Arcade
};

const ajustes = { ...AJUSTES_DEFECTO };
const oyentes = {}; // { claveAjuste: [callbacks] }

function esNumeroEnRango(clave, v) {
  const rango = RANGOS_AJUSTES[clave];
  return !!rango && typeof v === "number" && isFinite(v) && v >= rango.min && v <= rango.max;
}

function cargarDeAlmacen() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) || "{}");
    for (const clave of Object.keys(AJUSTES_DEFECTO)) {
      const v = guardado[clave];
      if (v === undefined) continue;
      if (RANGOS_AJUSTES[clave]) {
        if (esNumeroEnRango(clave, v)) ajustes[clave] = v;
      } else if (clave === "ayudaRomaji") {
        if (OPCIONES_AYUDA_ROMAJI[v]) ajustes[clave] = v;
      } else if (typeof v === typeof AJUSTES_DEFECTO[clave]) {
        ajustes[clave] = v;
      }
    }
  } catch (e) { /* almacén corrupto o inaccesible: se usan los valores por defecto */ }
}

function guardarEnAlmacen() {
  try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(ajustes)); } catch (e) {}
}

cargarDeAlmacen();

export function obtenerAjuste(clave) {
  return ajustes[clave];
}

export function fijarAjuste(clave, valor) {
  if (!(clave in AJUSTES_DEFECTO)) return;
  if (RANGOS_AJUSTES[clave] && !esNumeroEnRango(clave, valor)) return;
  ajustes[clave] = valor;
  guardarEnAlmacen();
  (oyentes[clave] || []).forEach(fn => fn(valor));
}

export function alCambiarAjuste(clave, fn) {
  (oyentes[clave] = oyentes[clave] || []).push(fn);
}

// Umbral (en frames-60) a partir del cual se muestra el romaji de ayuda
export function obtenerUmbralAyuda() {
  const opcion = OPCIONES_AYUDA_ROMAJI[ajustes.ayudaRomaji] || OPCIONES_AYUDA_ROMAJI.normal;
  return opcion.umbral;
}
