// ========================================================
// MÓDULO: CONTROLADOR DE MODO DE JUEGO ARCADE (ALEATORIO)
// ========================================================
import { state } from './config.js';
import { sistemaLector } from './sistemaFases.js';

export const controladorModoArcade = {
  jefeCadaKills: 40,
  proximoHitoJefe: 40,

  init() {
    this.proximoHitoJefe = this.jefeCadaKills;
    
    // Forzamos el reinicio de las variables del lector general de jefes
    sistemaLector.bossMode = false;
    sistemaLector.activeBoss = null;
    sistemaLector.bossTimerAyuda = 0;
    sistemaLector.miniJefesDerrotados = 0;
  },

  update(spawnEnemyFn) {
    // Si llegamos a los 40 aciertos (o múltiplos) y no estamos ya en modo jefe, lo activamos
    if (!sistemaLector.bossMode && state.kills >= this.proximoHitoJefe) {
      state.enemies = []; // Limpiamos la pantalla para el duelo
      this.triggerArcadeBoss();
    }

    if (!sistemaLector.bossMode) {
      state.spawnTimer++;
      if (state.spawnTimer >= state.spawnInterval) {
        state.spawnTimer = 0;
        spawnEnemyFn();
        if (state.spawnInterval > 80) state.spawnInterval -= 2;
      }
    } else {
      if (sistemaLector.activeBoss) sistemaLector.bossTimerAyuda++;
    }
  },

  obtenerPalabraParaSpawn() {
    if (state.ALL_WORDS_POOL.length === 0) return null;

    // Evitamos duplicar la letra inicial de los enemigos que ya están cayendo
    const usedFirsts = new Set(state.enemies.map(e => e.romaji[0]));
    const candidatos = state.ALL_WORDS_POOL.filter(w => !usedFirsts.has(w.romaji[0]));

    if (candidatos.length > 0) {
      return candidatos[Math.floor(Math.random() * candidatos.length)];
    }
    
    // Fallback absoluto si todas las iniciales están ocupadas
    return state.ALL_WORDS_POOL[Math.floor(Math.random() * state.ALL_WORDS_POOL.length)];
  },

  triggerArcadeBoss() {
    sistemaLector.bossMode = true;
    state.lockedId = null;
    state.typedLen = 0;
    sistemaLector.bossTimerAyuda = 0;

    // Tomamos 6 palabras completamente al azar del pool para armar las fases del jefe
    let poolExamen = [];
    let poolCopia = [...state.ALL_WORDS_POOL].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6; i++) {
      if (poolCopia.length > 0) poolExamen.push(poolCopia.pop());
    }

    // Añadimos una frase especial de jefe final si existe en el vocabulario
    if (state.BOSS_POOL && state.BOSS_POOL.length > 0) {
      poolExamen.push(state.BOSS_POOL[Math.floor(Math.random() * state.BOSS_POOL.length)]);
    } else {
      poolExamen.push({ jp: "試練突破", romaji: "shirentoppa", es: "Prueba superada" });
    }

    sistemaLector.activeBoss = {
      id: 8888,
      name: `JEFE ARCADE: OLA ${this.proximoHitoJefe / this.jefeCadaKills}`,
      x: state.W / 2, y: -80, targetY: state.H * 0.26,
      radius: Math.min(state.W, state.H) * 0.05 + 20,
      fases: poolExamen,
      faseActual: 0,
      jp: poolExamen[0].jp, romaji: poolExamen[0].romaji, es: poolExamen[0].es,
      isBoss: true
    };

    state.enemies.push(sistemaLector.activeBoss);
    // Establecemos el próximo hito (ej: 80 kills) para cuando derrote a este jefe
    this.proximoHitoJefe += this.jefeCadaKills;
  }
};