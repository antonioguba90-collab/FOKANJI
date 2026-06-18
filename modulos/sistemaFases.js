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
  TOTAL_PALABRAS_FASE: 20,   
  miniJefesDerrotados: 0, 
  bossMode: false,
  activeBoss: null,
  bossTimerAyuda: 0, 
  palabraCometioError: false, 
  sacoErrores: []
};

export function cargarNuevaFase() {
  sistemaLector.palabrasSuperadasFase = [];
  sistemaLector.palabrasUnicasCompletadasSet.clear(); 
  
  if (sistemaLector.palabrasFaseActual.length > 0) {
    sistemaLector.palabrasFaseAnterior = [...sistemaLector.palabrasFaseActual];
  }

  const nuevasNecesitadas = sistemaLector.palabrasFaseAnterior.length > 0 ? 17 : sistemaLector.TOTAL_PALABRAS_FASE; 
  let nuevoSet = [];
  let poolMezclado = [...state.ALL_WORDS_POOL].sort(() => Math.random() - 0.5);

  for (let i = 0; i < nuevasNecesitadas; i++) {
    if (poolMezclado.length === 0) poolMezclado = [...state.ALL_WORDS_POOL].sort(() => Math.random() - 0.5);
    nuevoSet.push(poolMezclado.pop());
  }

  if (sistemaLector.palabrasFaseAnterior.length > 0) {
    const copiaAnterior = [...sistemaLector.palabrasFaseAnterior];
    for (let i = 0; i < 3; i++) {
      if (copiaAnterior.length === 0) break;
      const randIdx = Math.floor(Math.random() * copiaAnterior.length);
      nuevoSet.push(copiaAnterior.splice(randIdx, 1)[0]);
    }
  }
  sistemaLector.palabrasFaseActual = nuevoSet;
}

export function triggerBossBattle() {
  sistemaLector.bossMode = true;
  state.lockedId = null;
  state.typedLen = 0;
  sistemaLector.bossTimerAyuda = 0;

  sistemaLector.registroFasesPasadas.push([...sistemaLector.palabrasSuperadasFase]);

  if (sistemaLector.miniJefesDerrotados < 3) {
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
      id: 8888,
      name: `MINI-JEFE EVALUADOR: FASE ${sistemaLector.miniJefesDerrotados + 1}`,
      x: state.W / 2, y: -80, targetY: state.H * 0.26,
      radius: Math.min(state.W, state.H) * 0.05 + 18,
      fases: poolExamen,
      faseActual: 0,
      jp: poolExamen[0].jp, romaji: poolExamen[0].romaji, es: poolExamen[0].es,
      isBoss: true
    };
  } else {
    let palabrasUnicasFinal = new Set();
    for (let i = 0; i < 3; i++) {
      const palabrasFaseX = sistemaLector.registroFasesPasadas[i] || sistemaLector.palabrasFaseActual;
      if (palabrasFaseX.length > 0) {
        const candidatasPasadas = palabrasFaseX.filter(p => !palabrasUnicasFinal.has(p)).sort(() => Math.random() - 0.5);
        while (candidatasPasadas.length > 0 && palabrasUnicasFinal.size < 7) {
          palabrasUnicasFinal.add(candidatasPasadas.pop());
        }
      }
    }

    let copiaFaseActual = [...sistemaLector.palabrasFaseActual].sort(() => Math.random() - 0.5);
    while (palabrasUnicasFinal.size < 7 && copiaFaseActual.length > 0) {
      palabrasUnicasFinal.add(copiaFaseActual.pop());
    }

    let poolExamenFinal = Array.from(palabrasUnicasFinal);
    let fraseDefinitiva = state.BOSS_POOL.length > 0 
      ? state.BOSS_POOL[Math.floor(Math.random() * state.BOSS_POOL.length)] 
      : { jp: "日本語マスター", romaji: "nihongomasutaa", es: "Maestro del Japonés" };
    
    poolExamenFinal.push(fraseDefinitiva);

    sistemaLector.activeBoss = {
      id: 9999,
      name: "EL GRAN LÍDER SUPREMO",
      x: state.W / 2, y: -80, targetY: state.H * 0.28,
      radius: Math.min(state.W, state.H) * 0.065 + 26,
      fases: poolExamenFinal,
      faseActual: 0,
      jp: poolExamenFinal[0].jp, romaji: poolExamenFinal[0].romaji, es: poolExamenFinal[0].es,
      isBoss: true
    };
  }
  state.enemies.push(sistemaLector.activeBoss);

}