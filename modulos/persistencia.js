// ==========================================
// PERSISTENCIA: RÉCORDS Y MEMORIA DE PALABRAS (SRS)
// ==========================================
// Módulo hoja: no importa nada del juego. Guarda en localStorage:
//  - fokanji.records : récord de puntos por estructura+modo
//  - fokanji.srs     : nivel de repetición espaciada por palabra

const CLAVE_RECORDS = "fokanji.records";
const CLAVE_SRS = "fokanji.srs";

const DIA_MS = 24 * 60 * 60 * 1000;
// Intervalo (en días) hasta el próximo repaso según el nivel alcanzado
const INTERVALOS_SRS_DIAS = [0, 1, 2, 4, 8, 16, 32];
// Nivel mínimo para considerar una palabra "dominada"
export const NIVEL_DOMINADA = 1;

// La clave única de palabra usada en todo el juego
export function claveDePalabra(p) {
  return `${p.romaji}_${p.jp}_${p.es}`;
}

function leerJSON(clave) {
  try { return JSON.parse(localStorage.getItem(clave) || "{}"); }
  catch (e) { return {}; }
}

function escribirJSON(clave, obj) {
  try { localStorage.setItem(clave, JSON.stringify(obj)); } catch (e) {}
}

// ------------------------------------------
// RÉCORDS DE PUNTUACIÓN
// ------------------------------------------
function claveRecord(estructura, modo) {
  return `${estructura}:${modo}`;
}

export function obtenerRecord(estructura, modo) {
  return leerJSON(CLAVE_RECORDS)[claveRecord(estructura, modo)] || 0;
}

// Registra la puntuación de una partida y devuelve { record, esNuevo }
export function registrarPuntuacion(estructura, modo, puntos) {
  const records = leerJSON(CLAVE_RECORDS);
  const clave = claveRecord(estructura, modo);
  const previo = records[clave] || 0;

  if (puntos > previo) {
    records[clave] = puntos;
    escribirJSON(CLAVE_RECORDS, records);
    return { record: puntos, esNuevo: puntos > 0 };
  }
  return { record: previo, esNuevo: false };
}

// ------------------------------------------
// SRS (REPETICIÓN ESPACIADA)
// ------------------------------------------
// Cada entrada: { n: nivel, prox: timestamp del próximo repaso }
let srs = leerJSON(CLAVE_SRS);

// Acierto: sube de nivel y aleja el próximo repaso
export function registrarAciertoPalabra(clave) {
  const entrada = srs[clave] || { n: 0, prox: 0 };
  entrada.n = Math.min(entrada.n + 1, INTERVALOS_SRS_DIAS.length - 1);
  entrada.prox = Date.now() + INTERVALOS_SRS_DIAS[entrada.n] * DIA_MS;
  srs[clave] = entrada;
  escribirJSON(CLAVE_SRS, srs);
}

// Fallo (el enemigo con esa palabra te elimina): baja de nivel y la marca pendiente ya
export function registrarFalloPalabra(clave) {
  const entrada = srs[clave];
  if (!entrada) return;
  entrada.n = Math.max(0, entrada.n - 1);
  entrada.prox = Date.now();
  escribirJSON(CLAVE_SRS, srs);
}

function esRepasoPendiente(clave) {
  const entrada = srs[clave];
  return !!entrada && entrada.n >= NIVEL_DOMINADA && Date.now() >= entrada.prox;
}

// Del pool dado, devuelve hasta `max` palabras con repaso pendiente (las más atrasadas primero)
export function seleccionarRepasoPendiente(pool, max) {
  return pool
    .filter(p => esRepasoPendiente(claveDePalabra(p)))
    .sort((a, b) => srs[claveDePalabra(a)].prox - srs[claveDePalabra(b)].prox)
    .slice(0, max);
}

// Cuántas palabras del pool están dominadas (nivel >= NIVEL_DOMINADA)
export function contarDominadas(pool) {
  return pool.filter(p => (srs[claveDePalabra(p)] || {}).n >= NIVEL_DOMINADA).length;
}

export function contarDominadasGlobal() {
  return Object.values(srs).filter(e => e.n >= NIVEL_DOMINADA).length;
}

// Borra récords y memoria SRS (usado desde Ajustes)
export function borrarProgreso() {
  srs = {};
  try {
    localStorage.removeItem(CLAVE_SRS);
    localStorage.removeItem(CLAVE_RECORDS);
  } catch (e) {}
}
