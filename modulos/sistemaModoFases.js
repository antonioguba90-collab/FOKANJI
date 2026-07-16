// ========================================================
// MÓDULO: CONTROLADOR DE MODO DE JUEGO POR FASES (CLÁSICO)
// ========================================================
import { state } from './config.js';
import { sistemaLector, cargarNuevaFase, triggerBossBattle } from './sistemaFases.js';

export const controladorModoFases = {
  // Inicialización específica del modo por fases
  init() {
    sistemaLector.romajisUsadosGlobal = new Set();
    sistemaLector.palabrasFaseActual = [];
    sistemaLector.palabrasFaseAnterior = [];
    sistemaLector.registroFasesPasadas = [];
    sistemaLector.palabrasUnicasCompletadasSet.clear();
    sistemaLector.miniJefesDerrotados = 0;
    sistemaLector.bossMode = false;
    sistemaLector.activeBoss = null;
    sistemaLector.bossTimerAyuda = 0;

    cargarNuevaFase();
  },

// Lógica de actualización paso a paso en cada frame (dentro del update de juego.js)
  update(spawnEnemyFn) {
    const totalPalabrasSetActual = sistemaLector.CANTIDAD_NUEVAS + sistemaLector.CANTIDAD_REPASO;
    
    // Comprobar si el jugador ha completado todas las palabras del set actual
    if (!sistemaLector.bossMode && sistemaLector.palabrasUnicasCompletadasSet.size >= totalPalabrasSetActual) {
      state.enemies = []; // Limpiamos enemigos comunes flotantes
      
      // Guardamos las palabras superadas de este set para el examen del guardián
      sistemaLector.palabrasSuperadasFase = [...sistemaLector.palabrasFaseActual];
      
      // Activamos la batalla del jefe/guardián para este set terminado
      triggerBossBattle();
    }

    // Control de la generación de enemigos normales si no estamos en modo jefe
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

  obtenerPalabraParaSpawn() {
    // 1. Recopilar iniciales de los enemigos que ya están flotando en la pantalla
    const inicialesEnPantalla = new Set();
    state.enemies.forEach(e => {
      if (e.romaji && e.romaji.length > 0) {
        inicialesEnPantalla.add(e.romaji[0]);
      }
    });

    let w = null;

    // 2. --- FILTRADO ESTRICTO Y ABSOLUTO ---
    // Solo permitimos palabras de la fase actual que:
    // - NO hayan sido completadas ya (`palabrasUnicasCompletadasSet`).
    // - Su letra inicial NO coincida con ninguna letra que ya esté flotando en pantalla.
    const palabrasDisponiblesLimpias = sistemaLector.palabrasFaseActual.filter(word => 
      !sistemaLector.palabrasUnicasCompletadasSet.has(word.romaji) && 
      !inicialesEnPantalla.has(word.romaji[0])
    );

    // 3. Si hay palabras que cumplen la regla de iniciales únicas, elegimos una al azar
    if (palabrasDisponiblesLimpias.length > 0) {
      w = palabrasDisponiblesLimpias[Math.floor(Math.random() * palabrasDisponiblesLimpias.length)];
    }

    // 4. --- RETENCION DE EMERGENCIA ---
    // Si 'w' es null significa que todas las palabras que quedan por salir comparten inicial 
    // con algún enemigo vivo en el mapa. 
    // En lugar de forzar el spawn y duplicar letras, devolvemos `null`.
    // Esto hará que el generador de `juego.js` no cree ningún enemigo en este ciclo 
    // y espere pacientemente a que el jugador destruya el enemigo que causa el bloqueo.
    return w; 
  }}