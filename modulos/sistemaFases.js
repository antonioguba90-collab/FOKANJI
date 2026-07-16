// ==========================================
// SISTEMA DE APRENDIZAJE, FASES Y JEFES
// ==========================================
import { state } from './config.js';

export const sistemaLector = {
  palabrasFaseActual: [],      
  palabrasFaseAnterior: [],    
  palabrasSuperadasFase: [],   
  registroFasesPasadas: [],    
  palabrasUnicasCompletadasSet: new Set(),
  
  CANTIDAD_NUEVAS: 30,       
  CANTIDAD_REPASO: 0,        
  CANTIDAD_ARCHIVADAS: 30,   
  
  poolRepasoAcumulado: [],   
  romajisUsadosGlobal: new Set(), 

  miniJefesDerrotados: 0, 
  bossMode: false,
  activeBoss: null,
  bossTimerAyuda: 0
  // ❌ ELIMINADO: palabraCometioError y sacoErrores
};

export function cargarNuevaFase() {
  // 0. Asegurar la existencia de las estructuras de control global
  if (!sistemaLector.romajisUsadosGlobal) {
    sistemaLector.romajisUsadosGlobal = new Set();
  }

  // --- PROCESAMIENTO AL TERMINAR UNA FASE ---
  // Guardamos ABSOLUTAMENTE TODAS las palabras de la fase que termina para que NO se repitan jamás
  if (sistemaLector.palabrasFaseActual.length > 0) {
    sistemaLector.palabrasFaseActual.forEach(p => {
      sistemaLector.romajisUsadosGlobal.add(p.romaji);
      if (!sistemaLector.registroFasesPasadas.some(r => r.romaji === p.romaji)) {
        sistemaLector.registroFasesPasadas.push(p);
      }
    });
    sistemaLector.palabrasFaseAnterior = [...sistemaLector.palabrasFaseActual];
  }

  // Limpiamos los rastreadores de la nueva fase
  sistemaLector.palabrasSuperadasFase = [];
  sistemaLector.palabrasUnicasCompletadasSet.clear(); 

  // --- OBTENER LAS PALABRAS COMPLETAMENTE NUEVAS ---
  // Filtramos el pool general excluyendo de forma estricta las ya usadas a nivel global
  let palabrasDisponiblesNuevas = state.ALL_WORDS_POOL.filter(p => 
    !sistemaLector.romajisUsadosGlobal.has(p.romaji)
  );
  
  // Mezclamos el pool restante para que salgan de forma aleatoria
  palabrasDisponiblesNuevas.sort(() => Math.random() - 0.5);
  
  let nuevoSet = [];
  // Extraemos exactamente la cantidad configurada (por ejemplo, 30) o las que queden disponibles
  const cantidadNuevasAExtraer = Math.min(sistemaLector.CANTIDAD_NUEVAS, palabrasDisponiblesNuevas.length);
  for (let i = 0; i < cantidadNuevasAExtraer; i++) {
    nuevoSet.push(palabrasDisponiblesNuevas.pop());
  }

  // Guardamos el set definitivo perfectamente mezclado
  sistemaLector.palabrasFaseActual = nuevoSet.sort(() => Math.random() - 0.5);
}
export function triggerBossBattle() {
  sistemaLector.bossMode = true;
  state.lockedId = null;
  state.typedLen = 0;
  sistemaLector.bossTimerAyuda = 0;

  // Comprobamos si quedan palabras completamente nuevas en el pool global
  const tieneMasPalabras = state.ALL_WORDS_POOL.some(p => !sistemaLector.romajisUsadosGlobal.has(p.romaji));

  // Si aún quedan palabras por aprender en futuros sets, el enemigo actual es un Guardián regular
  if (tieneMasPalabras) {
    let palabrasUnicasJefe = new Set();
    const copiaSuperadas = [...sistemaLector.palabrasSuperadasFase].sort(() => Math.random() - 0.5);

    for (const palabra of copiaSuperadas) {
      if (palabrasUnicasJefe.size >= 8) break;
      palabrasUnicasJefe.add(palabra);
    }

    let copiaFaseActual = [...sistemaLector.palabrasFaseActual].sort(() => Math.random() - 0.5);
    while (palabrasUnicasJefe.size < 8 && copiaFaseActual.length > 0) {
      palabrasUnicasJefe.add(copiaFaseActual.pop());
    }

    const poolExamen = Array.from(palabrasUnicasJefe);

    sistemaLector.activeBoss = {
      id: 8888, // Identificador de Guardián de Set
      name: `GUARDIÁN: FASE ${sistemaLector.miniJefesDerrotados + 1}`,
      x: state.W / 2, y: -80, targetY: state.H * 0.26,
      radius: Math.min(state.W, state.H) * 0.05 + 18,
      fases: poolExamen,
      faseActual: 0,
      jp: poolExamen[0].jp, romaji: poolExamen[0].romaji, es: poolExamen[0].es,
      isBoss: true
    };
 } else {
    // Si ya no quedan palabras en todo el vocabulario, generamos al JEFE FINAL SUPREMO
    let poolExamenFinal = new Set();
    
    // 1. Seleccionamos 7 palabras al azar de TODO el pool global
    const todasLasPalabras = [...state.ALL_WORDS_POOL].sort(() => Math.random() - 0.5);
    for (const palabra of todasLasPalabras) {
      //para cambiar el numero de palabras solo hay que cambiar el numero de >=8
      if (poolExamenFinal.size >= 8) break;
      poolExamenFinal.add(palabra);
    }

    // 2. Convertimos a array para poder añadir las frases
    let poolFinalArray = Array.from(poolExamenFinal);

    // 3. Seleccionamos hasta 3 frases de BOSS_POOL
    let copiaFrases = [...state.BOSS_POOL].sort(() => Math.random() - 0.5);
    
    // Añadimos hasta 3 frases (o la de respaldo si no hay frases)
    if (copiaFrases.length > 0) {
      //para cambiar el numero de frases solo hay que el numero de la funcion i > 3
      for (let i = 0; i < 3 && i < copiaFrases.length; i++) {
        poolFinalArray.push(copiaFrases[i]);
      }
    } else {
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
  }
  state.enemies.push(sistemaLector.activeBoss);
}