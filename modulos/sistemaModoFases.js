// ========================================================
// MÓDULO: CONTROLADOR DE MODO DE JUEGO POR FASES (CLÁSICO)
// ========================================================
import { state } from './config.js';
import { sistemaLector, cargarNuevaFase, triggerGuardianBattle } from './sistemaFases.js';

export const controladorModoFases = {
  // Inicialización específica del modo por fases
  init() {
    sistemaLector.romajiUsadoGlobal = new Set(); // 👈 Actualizado a la nueva nomenclatura única
    sistemaLector.palabrasFaseActual = [];
    sistemaLector.registroFasesPasadas = [];
    sistemaLector.palabrasUnicasCompletadasSet.clear();
    sistemaLector.miniJefesDerrotados = 0;
    sistemaLector.bossMode = false;
    sistemaLector.activeBoss = null;
    sistemaLector.bossTimerAyuda = 0;

    cargarNuevaFase();
  },

  // Lógica de actualización paso a paso en cada frame (dentro del update de juego.js)
  // dtFactor: 1.0 a 60fps; escala los timers para que el ritmo no dependa del refresco
  update(spawnEnemyFn, dtFactor = 1) {
    const totalPalabrasSetActual = sistemaLector.palabrasFaseActual.length > 0 
      ? sistemaLector.palabrasFaseActual.length 
      : 0;    

    // Comprobar si el jugador ha completado todas las palabras del set actual
    if (!sistemaLector.bossMode && totalPalabrasSetActual > 0 && sistemaLector.palabrasUnicasCompletadasSet.size >= totalPalabrasSetActual) {
      state.enemies = []; // Limpiamos enemigos comunes flotantes
      
      // Guardamos las palabras superadas de este set para el examen del guardián
      sistemaLector.palabrasSuperadasFase = [...sistemaLector.palabrasFaseActual];
      
      // Activamos la batalla del jefe/guardián para este set terminado
      triggerGuardianBattle();
    }

    // Control de la generación de enemigos normales si no estamos en modo jefe
    if (!sistemaLector.bossMode) {
      state.spawnTimer += dtFactor;
      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        spawnEnemyFn(); // Llama a la función de spawn que le pasemos desde juego.js
        if (state.spawnInterval > 80) state.spawnInterval -= 2;
      }
    } else {
      if (sistemaLector.activeBoss) sistemaLector.bossTimerAyuda += dtFactor;
    }
  },

  obtenerPalabraParaSpawn() {
    // 1. Recopilar iniciales y también las CLAVES ÚNICAS / ROMAJIS exactos de los enemigos en pantalla
    const inicialesEnPantalla = new Set();
    const clavesEnPantalla = new Set();
    
    state.enemies.forEach(e => {
      if (e.romaji) {
        const claveUnicaEnemigo = `${e.romaji}_${e.jp}_${e.es}`;
        clavesEnPantalla.add(claveUnicaEnemigo);
        clavesEnPantalla.add(e.romaji);
        if (e.romaji.length > 0) {
          inicialesEnPantalla.add(e.romaji[0]);
        }
      }
    });

    let w = null;

    // 2. --- FILTRADO ESTRICTO Y ABSOLUTO CON CLAVE ÚNICA ---
    const palabrasDisponiblesLimpias = sistemaLector.palabrasFaseActual.filter(word => {
      const claveWord = `${word.romaji}_${word.jp}_${word.es}`;
      
      return !sistemaLector.palabrasUnicasCompletadasSet.has(claveWord) && 
             !sistemaLector.palabrasUnicasCompletadasSet.has(word.romaji) &&
             !clavesEnPantalla.has(claveWord) && 
             !clavesEnPantalla.has(word.romaji) && // 👈 Evita duplicados simultáneos en pantalla
             !inicialesEnPantalla.has(word.romaji[0]);
    });

    // 3. Si hay palabras que cumplen la regla, elegimos una al azar
    if (palabrasDisponiblesLimpias.length > 0) {
      w = palabrasDisponiblesLimpias[Math.floor(Math.random() * palabrasDisponiblesLimpias.length)];
    }

    return w; 
  }
};