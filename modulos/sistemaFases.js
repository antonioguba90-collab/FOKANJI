// ==========================================
// SISTEMA DE APRENDIZAJE, FASES Y JEFES
// ==========================================
import { state } from './config.js';
import { claveDePalabra, seleccionarRepasoPendiente } from './persistencia.js';
import { obtenerAjuste } from './ajustes.js';
import { MUSIC, mp3 } from '../juego.js';

// Del total de la fase, cuántos huecos como máximo se reservan para repaso
// espaciado (SRS): 1 de cada FRACCION_REPASO palabras, con tope REPASO_MAX
const REPASO_MAX = 6;
const FRACCION_REPASO = 5;

export const sistemaLector = {
  palabrasFaseActual: [],
  palabrasSuperadasFase: [],
  registroFasesPasadas: [],
  palabrasUnicasCompletadasSet: new Set(),

  // Se sincronizan desde Ajustes en cada carga de fase (los usan HUD y cheat)
  CANTIDAD_NUEVAS: 30,
  CANTIDAD_REPASO: 6,

  romajiUsadoGlobal: new Set(),

  miniJefesDerrotados: 0,
  bossMode: false,
  activeBoss: null,
  bossTimerAyuda: 0
};

// Alias local: la clave única de palabra vive en persistencia.js
const obtenerClaveUnica = claveDePalabra;

export function cargarNuevaFase() {
  if (!sistemaLector.romajiUsadoGlobal) {
    sistemaLector.romajiUsadoGlobal = new Set();
  }

  // Tamaño de fase configurable desde Ajustes; el repaso escala con él
  sistemaLector.CANTIDAD_NUEVAS = obtenerAjuste('palabrasPorFase');
  sistemaLector.CANTIDAD_REPASO = Math.min(REPASO_MAX, Math.floor(sistemaLector.CANTIDAD_NUEVAS / FRACCION_REPASO));

  sistemaLector.palabrasSuperadasFase = [];
  sistemaLector.palabrasUnicasCompletadasSet.clear();

  // 1. Obtenemos estrictamente las palabras que NO han sido usadas globalmente
  let palabrasDisponiblesNuevas = state.ALL_WORDS_POOL.filter(p => {
    const clave = obtenerClaveUnica(p);
    return !sistemaLector.romajiUsadoGlobal.has(clave);
  });
  
  // 🛡️ CORRECCIÓN DE SEGURIDAD PARA EL ÚLTIMO SET:
  if (palabrasDisponiblesNuevas.length === 0 && sistemaLector.romajiUsadoGlobal.size < state.ALL_WORDS_POOL.length) {
    palabrasDisponiblesNuevas = state.ALL_WORDS_POOL.filter(p => {
      const clave = obtenerClaveUnica(p);
      return !sistemaLector.registroFasesPasadas.some(r => obtenerClaveUnica(r) === clave);
    });
  }

  if (palabrasDisponiblesNuevas.length === 0) {
    sistemaLector.palabrasFaseActual = [];
    return false;
  }

  // 2. REPETICIÓN ESPACIADA: las palabras con repaso pendiente (SRS)
  // ocupan primero hasta CANTIDAD_REPASO huecos de la fase
  const palabrasRepaso = seleccionarRepasoPendiente(
    palabrasDisponiblesNuevas,
    sistemaLector.CANTIDAD_REPASO
  );
  const clavesRepaso = new Set(palabrasRepaso.map(obtenerClaveUnica));

  // 3. El resto de huecos se rellena con palabras nuevas al azar
  // (adaptable: si quedan menos palabras que el tamaño de fase, entran todas)
  const restoDisponibles = palabrasDisponiblesNuevas
    .filter(p => !clavesRepaso.has(obtenerClaveUnica(p)))
    .sort(() => Math.random() - 0.5);

  const huecosNuevas = Math.max(0, sistemaLector.CANTIDAD_NUEVAS - palabrasRepaso.length);
  const nuevoSet = [...palabrasRepaso, ...restoDisponibles.slice(0, huecosNuevas)];

  sistemaLector.palabrasFaseActual = nuevoSet.sort(() => Math.random() - 0.5);
  return true;
}

// 🛡️ 1. FUNCIÓN EXCLUSIVA DEL GUARDIÁN
export function triggerGuardianBattle() {
  sistemaLector.bossMode = true;
  state.lockedId = null;
  state.typedLen = 0;
  sistemaLector.bossTimerAyuda = 0;

  // Consolidamos y registramos las palabras de la fase actual en el pool global de usadas
  if (sistemaLector.palabrasFaseActual.length > 0) {
    sistemaLector.palabrasFaseActual.forEach(p => {
      const clave = obtenerClaveUnica(p);
      sistemaLector.romajiUsadoGlobal.add(clave);
      if (!sistemaLector.registroFasesPasadas.some(r => obtenerClaveUnica(r) === clave)) {
        sistemaLector.registroFasesPasadas.push(p);
      }
    });
    if (sistemaLector.palabrasSuperadasFase.length === 0) {
      sistemaLector.palabrasSuperadasFase = [...sistemaLector.palabrasFaseActual];
    }
  }

  let palabrasUnicasJefe = new Set();
  const copiaSuperadas = [...sistemaLector.palabrasSuperadasFase].sort(() => Math.random() - 0.5);
  const maxPalabrasGuardian = obtenerAjuste('palabrasGuardian');

  for (const palabra of copiaSuperadas) {
    if (palabrasUnicasJefe.size >= maxPalabrasGuardian) break;
    palabrasUnicasJefe.add(palabra);
  }

  const poolExamen = Array.from(palabrasUnicasJefe);
  
  sistemaLector.activeBoss = {
    id: 8888, 
    name: `GUARDIÁN: FASE ${sistemaLector.miniJefesDerrotados + 1}`,
    x: state.W / 2, y: -80, targetY: state.H * 0.26,
    radius: Math.min(state.W, state.H) * 0.05 + 18,
    fases: poolExamen,
    faseActual: 0,
    jp: poolExamen[0].jp, romaji: poolExamen[0].romaji, es: poolExamen[0].es,
    isBoss: true
  };

  state.enemies.push(sistemaLector.activeBoss);

  mp3.pause();
  mp3.cargar(MUSIC.Guardian);
  mp3.setRepeat(true);
  mp3.play();
}

// 👑 2. FUNCIÓN EXCLUSIVA DEL JEFE FINAL
export function triggerJefeFinalBattle() {
  sistemaLector.bossMode = true;
  state.lockedId = null;
  state.typedLen = 0;
  sistemaLector.bossTimerAyuda = 0;

  let poolExamenFinal = new Set();
  const todasLasPalabras = [...state.ALL_WORDS_POOL].sort(() => Math.random() - 0.5);
  const maxPalabrasJefe = obtenerAjuste('palabrasJefeFinal');
  for (const palabra of todasLasPalabras) {
    if (poolExamenFinal.size >= maxPalabrasJefe) break;
    poolExamenFinal.add(palabra);
  }

  let poolFinalArray = Array.from(poolExamenFinal);
  let copiaFrases = [...state.BOSS_POOL].sort(() => Math.random() - 0.5);
  const maxFrasesJefe = obtenerAjuste('frasesJefeFinal');

  if (copiaFrases.length > 0) {
    for (let i = 0; i < maxFrasesJefe && i < copiaFrases.length; i++) {
      poolFinalArray.push(copiaFrases[i]);
    }
  } else if (maxFrasesJefe > 0) {
    poolFinalArray.push({ jp: "日本語マスター", romaji: "nihongomasutaa", es: "Maestro del Japonés" });
  }

  sistemaLector.activeBoss = {
    id: 9999,
    name: "JEFE FINAL",
    x: state.W / 2, y: -80, targetY: state.H * 0.28,
    radius: Math.min(state.W, state.H) * 0.065 + 26,
    fases: poolFinalArray,
    faseActual: 0,
    jp: poolFinalArray[0].jp, romaji: poolFinalArray[0].romaji, es: poolFinalArray[0].es,
    isBoss: true
  };

  state.enemies.push(sistemaLector.activeBoss);

  mp3.pause();
  mp3.cargar(MUSIC.Jefefinal);
  mp3.setRepeat(true);
  mp3.play();
}