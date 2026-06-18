// ========================================================
// MÓDULO: CONTROLADOR DE MODO DE JUEGO POR FASES (CLÁSICO)
// ========================================================
import { state } from './config.js';
import { sistemaLector, cargarNuevaFase, triggerBossBattle } from './sistemaFases.js';

export const controladorModoFases = {
  // Inicialización específica del modo por fases
  init() {
    sistemaLector.sacoErrores = [];
    sistemaLector.palabrasFaseActual = [];
    sistemaLector.palabrasFaseAnterior = [];
    sistemaLector.registroFasesPasadas = [];
    sistemaLector.palabrasUnicasCompletadasSet.clear();
    sistemaLector.miniJefesDerrotados = 0;
    sistemaLector.palabraCometioError = false;
    sistemaLector.bossMode = false;
    sistemaLector.activeBoss = null;
    sistemaLector.bossTimerAyuda = 0;

    cargarNuevaFase();
  },

  // Lógica de actualización paso a paso en cada frame (dentro del update de juego.js)
  update(spawnEnemyFn) {
    if (!sistemaLector.bossMode && sistemaLector.palabrasUnicasCompletadasSet.size >= sistemaLector.TOTAL_PALABRAS_FASE) {
      state.enemies = []; 
      triggerBossBattle();
    }

    if (!sistemaLector.bossMode) {
      state.spawnTimer++;
      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0; 
        spawnEnemyFn(); // Llama a la función de spawn que le pasemos desde juego.js
        if (state.spawnInterval > 80) state.spawnInterval -= 2;
      }
    } else {
      if (sistemaLector.activeBoss) sistemaLector.bossTimerAyuda++;
    }
  },

  // Selecciona la palabra adecuada para spawnear según las reglas de aprendizaje
  obtenerPalabraParaSpawn() {
    const usedFirsts = new Set(state.enemies.map(e => e.romaji[0]));
    let w = null;

    // 1. Reintroducir errores de forma prioritaria (20% de probabilidad)
    if (sistemaLector.sacoErrores.length > 0 && Math.random() < 0.20) {
      const candidatosError = sistemaLector.sacoErrores.filter(word => !usedFirsts.has(word.romaji[0]));
      if (candidatosError.length > 0) {
        w = candidatosError[Math.floor(Math.random() * candidatosError.length)];
      }
    }

    // 2. Buscar palabras nuevas de la fase actual que no han salido ni se están usando
    if (!w) {
      const romajisEnPantalla = new Set(state.enemies.map(e => e.romaji));
      const palabrasNuevasQueNoHanSalido = sistemaLector.palabrasFaseActual.filter(word => 
        !sistemaLector.palabrasUnicasCompletadasSet.has(word.romaji) && 
        !romajisEnPantalla.has(word.romaji) &&            
        !usedFirsts.has(word.romaji[0])                   
      );
      if (palabrasNuevasQueNoHanSalido.length > 0) {
        w = palabrasNuevasQueNoHanSalido[Math.floor(Math.random() * palabrasNuevasQueNoHanSalido.length)];
      }
    }

    // 3. Fallback: Cualquier palabra de la fase actual que no esté completamente superada
    if (!w) {
      const candidates = sistemaLector.palabrasFaseActual.filter(word => 
        !sistemaLector.palabrasUnicasCompletadasSet.has(word.romaji) && 
        !usedFirsts.has(word.romaji[0])
      );
      if (candidates.length === 0) return null; 
      w = candidates[Math.floor(Math.random() * candidates.length)];
    }

    return w;
  }
};