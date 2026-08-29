import { state, canvas, ctx, hud, msg, mobileInput, menuEl, btnPausa, btnCheatBoss, resize, formatearNombreModo } from './modulos/config.js';
import { parsearLista } from './modulos/parser.js';
import { getAudio, playShoot, playExplosion } from './modulos/audio.js';
import { sistemaLector, cargarNuevaFase, triggerJefeFinalBattle } from './modulos/sistemaFases.js';
import { ejecutarDrawLoop, alturaHorizonte } from './modulos/draw.js';
import { actualizarFisicasYColisiones } from './modulos/fisicas.js';
import { claveDePalabra, registrarAciertoPalabra, registrarFalloPalabra, registrarPuntuacion } from './modulos/persistencia.js';
import { initInterfazMenu, refrescarProgresoVocabulario, abrirAjustesDesdePausa } from './modulos/interfazMenu.js';
import { obtenerAjuste, alCambiarAjuste } from './modulos/ajustes.js';
import { MODO_PROPIO, esJugable, obtenerPool } from './modulos/vocabularioPropio.js';

// Importación de controladores estructurales
import { controladorModoFases } from './modulos/sistemaModoFases.js';
import { controladorModoArcade } from './modulos/sistemaModoArcade.js';
import { ReproductorMP3 }  from './modulos/reproductor.js';

// Importación de los RAW externos de vocabulario
import { HIRAGANA_RAW } from './modos/hiragana.js';
import { KATAKANA_RAW } from './modos/katakana.js';
import { KANJI_NOKEN_5_RAW } from './modos/KANJI_NOKEN_5.js';
import { KANJI_SEMANA_2_RAW } from './modos/KANJI_SEMANA_2.js';
import { KANJI_SEMANA_3_RAW } from './modos/KANJI_SEMANA_3.js';
import { KANJI_SEMANA_4_RAW } from './modos/KANJI_SEMANA_4.js';
import { KANJI_SEMANA_5_RAW } from './modos/KANJI_SEMANA_5.js';
import { KANJI_SEMANA_6_RAW } from './modos/KANJI_SEMANA_6.js';
import { KANJI_SEMANA_7_RAW } from './modos/KANJI_SEMANA_7.js';

const esMovil = window.innerWidth < 768; 
const factorEscalaMovil = esMovil ? 0.7 : 1.0;

const MODES = {
  hiragana: parsearLista(HIRAGANA_RAW),
  katakana: parsearLista(KATAKANA_RAW),
  KANJI_NOKEN_5: parsearLista(KANJI_NOKEN_5_RAW),
  KANJI_SEMANA_2: parsearLista(KANJI_SEMANA_2_RAW),
  KANJI_SEMANA_3: parsearLista(KANJI_SEMANA_3_RAW),
  KANJI_SEMANA_4: parsearLista(KANJI_SEMANA_4_RAW),
  KANJI_SEMANA_5: parsearLista(KANJI_SEMANA_5_RAW),
  KANJI_SEMANA_6: parsearLista(KANJI_SEMANA_6_RAW),
  KANJI_SEMANA_7: parsearLista(KANJI_SEMANA_7_RAW),
};

// El mazo propio del jugador (si tiene uno guardado y jugable) entra como un modo más
if (esJugable()) {
  MODES[MODO_PROPIO] = obtenerPool();
}

export const MUSIC = {
  hiragana: "./audios/musica_hiragana.mp3",
  katakana: "./audios/musica_katakana.mp3",
  KANJI_NOKEN_5: "./audios/musica_NOKEN_5.mp3",
  KANJI_SEMANA_2: "./audios/musica_semana2.mp3",
  KANJI_SEMANA_3: "./audios/musica_semana3.mp3",
  KANJI_SEMANA_4: "./audios/musica_semana4.mp3",
  KANJI_SEMANA_5: "./audios/musica_semana5.mp3",
  KANJI_SEMANA_6: "./audios/musica_semana6.mp3",
  KANJI_SEMANA_7: "./audios/musica_semana7.mp3",
  [MODO_PROPIO]: "./audios/musica_semana1.mp3",
  Guardian: "./audios/musica_guardian.mp3",
  Jefefinal: "./audios/musica_JefeFinal.mp3",
  GameOver: "./audios/gameover.mp3",
  Wingame:"./audios/wingame.mp3"
};

export let mp3 = new ReproductorMP3();

const MENU_THEME = "./audios/menu_theme.mp3";
state.gameStructure = "fases"; 

btnPausa.addEventListener("click", togglePause);
//btnCheatBoss.addEventListener("click", cheatSaltarAlJefe);

function init() {
  document.addEventListener("DOMContentLoaded", () => {
    btnPausa.style.display = "none";
    //btnCheatBoss.style.display = "none";
    mostrarSoloVistaMenu("view-structure");
  });

  const alturaVisible = window.visualViewport ? window.visualViewport.height : state.H;
  state.player = { x: state.W / 2, y: alturaVisible - 30, size: Math.min(state.W, state.H) * 0.04 + 10 };
  state.enemies = []; state.bullets = []; state.particles = []; state.popups = [];
  state.lockedId = null; state.typedLen = 0; state.score = 0; state.kills = 0;
  state.gameOver = false;state.isWinning = false; state.paused = false; state.spawnTimer = 0;
  state.spawnInterval = 180; state.nextId = 1;
  state.gameOverAnim = null;
  
  msg.style.display = "none";
  btnPausa.style.display = "none";
  //btnCheatBoss.style.display = "none";

  if (state.gameStructure === "arcade") {
    controladorModoArcade.init();
  } else {
    controladorModoFases.init();
  }
}

function spawnEnemy() {
  if (state.enemies.length >= state.MAX_ENEMIES || sistemaLector.bossMode || state.paused) return;

  const ahora = Date.now();

  // ==========================================
  // 1. COMPROBACIÓN DE CARRILES Y TREGUA (PARA TODOS: CLONES Y NORMALES)
  // ==========================================
  const proximoLadoIzquierdo = (state.ultimoCarrilUsado !== "izquierdo");
  const umbralSeguridadY = alturaHorizonte + (state.H - alturaHorizonte) * 0.18;
  
  const carrilOcupado = state.enemies.some(e => {
    const esDelLadoIzquierdo = e.targetX < state.W * 0.5;
    return (esDelLadoIzquierdo === proximoLadoIzquierdo) && (e.y < umbralSeguridadY);
  });

  // Si el carril está bloqueado por otro enemigo arriba, cancelamos el spawn temporalmente
  if (carrilOcupado) return;

  // Respetamos el mínimo de tiempo entre spawns consecutivos (500 ms)
  if (state.ultimoSpawn && (ahora - state.ultimoSpawn < 500)) return;

  let esClon = false;
  let datosClon = null;
  let w = null;

  // ==========================================
  // 2. SELECCIÓN: CLON PENDIENTE O PALABRA NUEVA
  // ==========================================
  if (state.colaClonesPendientes && state.colaClonesPendientes.length > 0) {
    const pendiente = state.colaClonesPendientes.shift(); // Ahora sí sale porque el carril está libre
    datosClon = pendiente.datosOriginales;
    esClon = true;
    w = {
      id: datosClon.wordId || datosClon.id,
      jp: datosClon.jp,
      romaji: datosClon.romaji,
      es: datosClon.es,
      kana: datosClon.kana
    };
  } else {
    w = (state.gameStructure === "arcade") 
      ? controladorModoArcade.obtenerPalabraParaSpawn() 
      : controladorModoFases.obtenerPalabraParaSpawn();
  }

  if (!w) return;

  state.ultimoSpawn = ahora;

  // Lógica de carriles estrictos para posicionar al enemigo/clon
  let x = 0;
  let esLadoIzquierdo = false;

  if (state.ultimoCarrilUsado === "izquierdo") {
    const anchoSeccion = state.W * 0.13;
    x = (state.W * 0.62) + (Math.random() * anchoSeccion);
    state.ultimoCarrilUsado = "derecho";
    esLadoIzquierdo = false;
  } else {
    const anchoSeccion = state.W * 0.13;
    x = (state.W * 0.25) + (Math.random() * anchoSeccion);
    state.ultimoCarrilUsado = "izquierdo";
    esLadoIzquierdo = true;
  }

  const carrilIzquierdoFlanco = state.W * 0.32; 
  const carrilDerechoFlanco = state.W * 0.68;  
  const objetivoX = esLadoIzquierdo ? carrilIzquierdoFlanco : carrilDerechoFlanco;
  
  const radius = (Math.min(state.W, state.H) * 0.024 + 20);
  let speedAdaptada = (state.gameStructure === "arcade") ? 0.20 : 0.15;
  const finalSpeed = speedAdaptada * factorEscalaMovil;

  const paleta = ["#ff5252", "#34ace0", "#33d9b2", "#ffb142", "#ff793f"]; 
  const coloresUsados = new Set(state.enemies.map(e => e.color));
  const colorLibre = paleta.find(c => !coloresUsados.has(c)) || "#ffffff";
  
  state.enemies.push({
    id: esClon ? (Date.now() + Math.random()) : state.nextId++, 
    wordId: w.id || w.wordId, 
    jp: w.jp, romaji: w.romaji, es: w.es, kana: w.kana || w.jp,
    x: x, 
    x0: x,                             
    y: alturaHorizonte,             
    targetX: objetivoX,             
    targetY: state.player.y,        
    speed: finalSpeed, 
    speedAdaptada, 
    radius: radius, 
    isBoss: false,
    timerAyuda: 0, 
    color: esClon ? datosClon.color : colorLibre,
    vecesAcertada: esClon ? (datosClon.vecesAcertada + 1) : 0 
  });
}
function spawnExplosion(x, y, grande = false) {
  const n = grande ? 80 : 30;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = grande ? (2 + Math.random() * 8) : (1 + Math.random() * 5);
    state.particles.push({
      x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1,
      color: `hsl(${grande ? Math.random() * 360 : Math.random() * 40 + 10}, 100%, 60%)`,
      size: grande ? (4 + Math.random() * 5) : (2 + Math.random() * 3),
    });
  }
}

// Vistas del menú: muestra una y oculta las demás
const VISTAS_MENU = ["view-structure", "view-vocabulary", "view-settings", "view-manual", "view-custom"];
function mostrarSoloVistaMenu(idVista) {
  VISTAS_MENU.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== idVista);
  });
}

// Avance de partículas (lo usan el update normal y la animación de game over)
function actualizarParticulas(dtFactor) {
  const friccion = Math.pow(0.96, dtFactor);
  for (const p of state.particles) {
    p.x += p.vx * dtFactor; p.y += p.vy * dtFactor;
    p.vx *= friccion; p.vy *= friccion;
    p.life -= 0.025 * dtFactor;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

// dtFactor: 1.0 a 60fps (delta real / 16.67ms); iguala la velocidad en cualquier refresco
function update(dtFactor = 1) {
  // Durante la animación de game over solo avanzan las partículas y el temporizador
  if (state.gameOverAnim) {
    actualizarParticulas(dtFactor);
    state.gameOverAnim.t += dtFactor;
    if (state.gameOverAnim.t >= DURACION_ANIM_GAMEOVER) {
      state.gameOverAnim = null;
      state.started = false;
      mostrarMensajeGameOver();
    }
    return;
  }

  if (state.gameOver || !state.started || state.paused) return;
if (state.isWinning) {
    actualizarParticulas(dtFactor);
    return;
  }
  if (state.gameStructure === "arcade") {
    controladorModoArcade.update(spawnEnemy, dtFactor);
  } else {
    controladorModoFases.update(spawnEnemy, dtFactor);
  }

  actualizarFisicasYColisiones(state, endGame, dtFactor);

  // Timer de ayuda de romaji de los enemigos comunes (los jefes usan bossTimerAyuda)
  for (const e of state.enemies) {
    if (!e.isBoss) e.timerAyuda += dtFactor;
  }

for (const b of state.bullets) {
    const tgt = state.enemies.find(e => e.id === b.targetId);
    if (!tgt) { b.dead = true; continue; }

    // Factor de escala móvil idéntico al de los módulos de jefes/guardianes
    const factorEscalaMovil = Math.max(Math.min(state.W / 1200, 1), 0.6);
    
    // Si el objetivo es un jefe o guardián, aplicamos el mismo offsetY con el que se dibuja el sprite
    const offsetYVisual = tgt.isBoss ? (140 * factorEscalaMovil) : 0;
    const targetYReal = tgt.y + offsetYVisual;

    const dx = tgt.x - b.x; 
    const dy = targetYReal - b.y; 
    const d = Math.hypot(dx, dy);
    
    const paso = 16 * dtFactor;
    // Impacta si está cerca O si el paso de este frame alcanzaría al objetivo
    if (d < 15 || paso >= d) {
      b.dead = true;
      if (state.typedLen >= tgt.romaji.length && tgt.id === state.lockedId) {
        if (tgt.isBoss) avanzarFaseJefe(tgt); else destroyLocked();
      }
    } else {
      b.x += (dx / d) * paso; 
      b.y += (dy / d) * paso;
    }
  }
  state.bullets = state.bullets.filter(b => !b.dead);
  actualizarParticulas(dtFactor);
  const suavizadoPopup = 1 - Math.pow(0.85, dtFactor);
  for (const p of state.popups) { p.life -= 0.012 * dtFactor; p.scale += (1 - p.scale) * suavizadoPopup; }
  state.popups = state.popups.filter(p => p.life > 0);

  if (state.lockedId !== null && !state.enemies.find(e => e.id === state.lockedId)) {
    state.lockedId = null; state.typedLen = 0;
  }
}

function fireBullet(targetId) {
  if (!state.player) return;

  const centroX = state.player.x;
  const centroY = state.player.y + 10;
  const puntoSalidaX = centroX; 
  const puntoSalidaY = centroY - (state.player.size * 0.6); 

  state.bullets.push({ 
    x: puntoSalidaX, 
    y: puntoSalidaY, 
    targetId, 
    dead: false 
  });

  if (typeof playShoot === 'function') playShoot();

  state.player.estadoAnim = 'disparar';
  state.player.frameAnim = 0; 
}

let lastChar = ""; let lastTime = 0;
function handleChar(ch) {
  if (state.gameOver || !state.started || state.paused) return;
  if (!/^[a-z0-9 ]$/.test(ch)) return; 

  const ahora = performance.now();
  if (ch === lastChar && (ahora - lastTime) < 70) return; 
  lastChar = ch; lastTime = ahora;

  if (state.lockedId === null) {
    const candidates = state.enemies.filter(e => e.romaji[0] === ch);
    if (candidates.length === 0) return;
    candidates.sort((a, b) => b.y - a.y);
    state.lockedId = candidates[0].id; state.typedLen = 1;
    fireBullet(candidates[0].id);
  } else {
    const target = state.enemies.find(e => e.id === state.lockedId);
    if (!target) { state.lockedId = null; state.typedLen = 0; return; }
    
    if (state.typedLen < target.romaji.length) {
      if (ch === target.romaji[state.typedLen]) {
        state.typedLen++; fireBullet(target.id);
      }
    }
  }
}

function destroyLocked() {
  const target = state.enemies.find(e => e.id === state.lockedId);
  
  if (!target) {
    state.lockedId = null; 
    state.typedLen = 0; 
    return; 
  }

  const claveUnica = `${target.romaji}_${target.jp}_${target.es}`;

  target.vecesAcertada++;

  state.popups.push({ 
    text: target.kana || target.jp, 
    jp: target.es, 
    romaji: target.romaji, 
    life: 2.0, 
    scale: 0.2 
  });

  spawnExplosion(target.x, target.y, false);
  playExplosion();

  if (target.vecesAcertada < 2) {
    state.enemies = state.enemies.filter(e => e.id !== target.id);
    
    // ==========================================
    // CAMBIO: En lugar de clonar instantáneamente,
    // lo metemos en la cola de espera de clones
    // ==========================================
    if (!state.colaClonesPendientes) {
      state.colaClonesPendientes = [];
    }
    state.colaClonesPendientes.push({
      datosOriginales: target,
      contadorAciertos: 1
    });

    state.lockedId = null; 
    state.typedLen = 0;
  } else {
    if (!state.palabrasContadasGlobalSet.has(claveUnica)) {
      state.palabrasContadasGlobalSet.add(claveUnica);
      if (state.totalPalabrasNivel > 0) state.totalPalabrasNivel--;
    }

    sistemaLector.palabrasUnicasCompletadasSet.add(claveUnica);
    state.enemies = state.enemies.filter(e => e.id !== target.id);

    state.score += target.romaji.length * 20;
    state.kills++;

    // Palabra dominada en esta fase: sube su nivel SRS (repaso espaciado)
    registrarAciertoPalabra(claveUnica);

    state.lockedId = null;
    state.typedLen = 0;
  }
}


function avanzarFaseJefe(target) {
  // Factor de escala móvil para calcular el desplazamiento exacto del sprite del jefe/guardián
  const factorEscalaMovil = Math.max(Math.min(state.W / 1200, 1), 0.6);
  const offsetYVisual = target.isBoss ? (140 * factorEscalaMovil) : 0;
  const realY = target.y + offsetYVisual;

  spawnExplosion(target.x, realY, false); playExplosion();
  state.popups.push({ text: target.jp, jp: target.es, romaji: target.romaji, life: 2.0, scale: 0.3 });
  // Refuerzo SRS: la palabra/frase recién superada del jefe también cuenta como acierto
  registrarAciertoPalabra(claveDePalabra(target));
  target.faseActual++;
  
  if (target.faseActual < target.fases.length) {
    const proxFrase = target.fases[target.faseActual];
    target.jp = proxFrase.jp; target.romaji = proxFrase.romaji; target.es = proxFrase.es;
    sistemaLector.bossTimerAyuda = 0; state.typedLen = 0; 
  } else {
    spawnExplosion(target.x, realY, true); 
    state.enemies = state.enemies.filter(e => e.id !== target.id);
    state.score += 500; state.kills++;
    
    const eraJefeFinal = target.id === 9999; 

    sistemaLector.bossMode = false; 
    sistemaLector.activeBoss = null;
    state.lockedId = null;
    state.typedLen = 0;
        
if (state.gameStructure !== "arcade") {
     if (eraJefeFinal) {
        state.isWinning = true; 
        target.y = -9999; 
        target.jp = ""; 
        target.romaji = "";
        state.bullets = [];
        setTimeout(() => {
          winGame();
        }, 900); // 1.8 segundos para disfrutar de la explosión final
        return; // <--- Este return frena por completo el flujo para que NUNCA llame a triggerJefeFinalBattle
      }
        mp3.pause();
        mp3.cargar(MUSIC[state.currentMode]);
        mp3.setRepeat(true);
        mp3.play();
      sistemaLector.miniJefesDerrotados++;
      
      // 🔍 VERIFICACIÓN ROBUSTA DEL POOL GLOBAL RESTANTE
      const tieneMasPalabras = state.ALL_WORDS_POOL.some(p => {
        const clave = `${p.romaji}_${p.jp}_${p.es}`;
        return !sistemaLector.romajiUsadoGlobal.has(clave);
      });

      if (tieneMasPalabras) {

        cargarNuevaFase();
        state.spawnTimer = 0;
        state.spawnInterval = 180;
      } else {
        // Si ya no quedan palabras en el pool global, transiciona correctamente al Jefe Final
        mp3.pause();
        triggerJefeFinalBattle(); 
      }
    }
  }
}

function cheatSaltarAlJefe() {
  state.enemies = [];

  if (!state.started || state.gameOver || state.paused || sistemaLector.bossMode) return;

  if (state.gameStructure === "arcade") {
    state.kills = controladorModoArcade.proximoHitoJefe;
  } else {
    sistemaLector.palabrasFaseActual.forEach(word => {
      const clave = `${word.romaji}_${word.jp}_${word.es}`;
      sistemaLector.palabrasUnicasCompletadasSet.add(clave);
    });

    // El objetivo real de la fase es su número de palabras (configurable en Ajustes)
    const totalObjetivo = sistemaLector.palabrasFaseActual.length;
    let rellenoId = 0;
    while (sistemaLector.palabrasUnicasCompletadasSet.size < totalObjetivo) {
      sistemaLector.palabrasUnicasCompletadasSet.add(`cheat_force_match_${rellenoId++}`);
    }

    if (sistemaLector.palabrasSuperadasFase.length === 0) {
      sistemaLector.palabrasSuperadasFase = [...sistemaLector.palabrasFaseActual];
    }
  }

  state.enemies = []; 
  state.lockedId = null; 
  state.typedLen = 0;

  update();
}

function togglePause() {
  if (!state.started || state.gameOver) return;
  state.paused = !state.paused;

  if (state.paused) {
    btnPausa.innerHTML = "▶️ Reanudar";
    mp3.pause();
    const estiloBtnPausa = `font-family: 'Courier New', monospace; font-weight: bold; border: 2px solid #000000; padding: 10px 20px; font-size: 16px; margin: 5px; cursor: pointer; color: #fff; width: 200px;`;
    msg.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; color: #ffffff; font-family: 'Courier New', monospace; margin: 0 0 16px; background: rgba(0, 0, 0, 0.3); padding: 8px 12px; border-radius: 6px; text-shadow: 1px 1px 2px #000;">JUEGO EN PAUSA</div>
      <button id="btn-resume" style="${estiloBtnPausa} background: #25a;">Reanudar juego</button><br>
      <button id="btn-restart" style="${estiloBtnPausa} background: #229daa;">Volver a empezar</button><br>
      <button id="btn-pause-settings" style="${estiloBtnPausa} background: #2C3E50;">⚙️ Ajustes</button><br>
      <button id="btn-menu" style="${estiloBtnPausa} background: #f0040f; margin-top: 15px;">Cambiar modo</button>`;
    msg.style.display = "block"; mobileInput.blur();

    document.getElementById("btn-resume").addEventListener("click", togglePause);
    document.getElementById("btn-restart").addEventListener("click", () => startGame(state.currentMode));
    document.getElementById("btn-pause-settings").addEventListener("click", () => {
      msg.style.display = "none";
      abrirAjustesDesdePausa(() => { msg.style.display = "block"; });
    });
    document.getElementById("btn-menu").addEventListener("click", showMenu);
  } else {
    btnPausa.innerHTML = "⏸️ Pausa"; msg.style.display = "none"; mobileInput.focus();
    mp3.play();
  }
}

// Duración de la animación de game over en frames-60 (~2.7 s)
const DURACION_ANIM_GAMEOVER = 160;
let datosGameOver = null; // { lineaRecord } calculado al morir, mostrado tras la animación

function endGame(enemigoLetal) {
  state.gameOver = true;
  document.getElementById("hud-superior").classList.add("hidden");
  btnPausa.style.display = "none"; btnCheatBoss.style.display = "none";
  spawnExplosion(state.player.x, state.player.y, true); playExplosion();

  // La palabra del enemigo que te eliminó baja de nivel SRS (volverá pronto a repaso)
  if (enemigoLetal && !enemigoLetal.isBoss) {
    registrarFalloPalabra(claveDePalabra(enemigoLetal));
  }

  // Récord persistente por estructura+modo (se muestra al acabar la animación)
  const { record, esNuevo } = registrarPuntuacion(state.gameStructure, state.currentMode, state.score);
  datosGameOver = { lineaRecord: `Récord: ${record}${esNuevo ? " 🏅 ¡Nuevo récord!" : ""}` };

  // Música de game over (sin bucle) y arranque de la animación;
  // state.started sigue activo para que el draw pinte la escena
  mp3.pause();
  mp3.cargar(MUSIC.GameOver);
  mp3.setRepeat(false);
  mp3.play();
  state.gameOverAnim = { t: 0 };
  mobileInput.blur();
}

function mostrarMensajeGameOver() {
  const modeName = formatearNombreModo(state.currentMode);
  const lineaRecord = datosGameOver ? datosGameOver.lineaRecord : "";
  msg.innerHTML = `GAME OVER<br>Modo: ${modeName}<br>Puntos: ${state.score}<br>${lineaRecord}<br><button id="retry">Reintentar</button> <button id="changeMode">Cambiar modo</button>`;
  msg.style.display = "block";
  setTimeout(() => {
    document.getElementById("retry")?.addEventListener("click", () => startGame(state.currentMode));
    document.getElementById("changeMode")?.addEventListener("click", () => showMenu());
  }, 0);
}

function winGame() {
  state.gameOver = true;
  mp3.pause();
  mp3.cargar(MUSIC.Wingame);
  mp3.setRepeat(false);
  mp3.play();
  btnPausa.style.display = "none";
  //btnCheatBoss.style.display = "none";

  spawnExplosion(state.player.x, state.player.y, true);
  playExplosion();

  // Récord persistente por estructura+modo
  const { record, esNuevo } = registrarPuntuacion(state.gameStructure, state.currentMode, state.score);
  const lineaRecord = `Récord: ${record}${esNuevo ? " 🏅 ¡Nuevo récord!" : ""}`;

  msg.innerHTML = `🏆 ¡NIVEL FINALIZADO! 🏆<br>
                   ¡Felicidades, has dominado todo el vocabulario!<br><br>
                   Puntos totales: ${state.score}<br>${lineaRecord}<br><br>
                   <button id="win-retry" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer;">Volver a jugar</button><br>
                   <button id="win-changeVocabulary" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer; background:#25a;">Cambiar de nivel</button><br>
                   <button id="win-changeMode" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer; background:#555;">Cambiar de modo</button>`;
  
  msg.style.display = "block";
  mobileInput.blur();

  setTimeout(() => {
    document.getElementById("win-retry")?.addEventListener("click", () => startGame(state.currentMode));
    
    document.getElementById("win-changeVocabulary")?.addEventListener("click", () => {
      mp3.pause();
      mp3.cargar(MENU_THEME);
      mp3.setRepeat(true);
      mp3.play();
      
      state.started = false;
      menuEl.classList.remove("hidden");
      menuEl.style.display = "block";
      msg.style.display = "none";
      mostrarSoloVistaMenu("view-vocabulary");
      refrescarProgresoVocabulario();
    });

    document.getElementById("win-changeMode")?.addEventListener("click", () => showMenu());
  }, 0);
}

function startGame(mode) {
  if (mode && MODES[mode]) {
    state.currentMode = mode;
    state.ALL_WORDS_POOL = MODES[mode].normales;
    state.BOSS_POOL = MODES[mode].jefe;
    
    state.totalPalabrasNivel = state.ALL_WORDS_POOL.length;
    state.palabrasContadasGlobalSet = new Set();
    state.mostrarTraduccion = obtenerAjuste('mostrarTraduccion');
    state.isWinning = false;

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById("game").classList.remove("hidden");
    credits.classList.add('hidden');
    document.getElementById("hud-superior").classList.remove("hidden");

    resize();
    state.started = true;
    menuEl.classList.add("hidden");
    mp3.pause();
    
    if (mode && MUSIC[mode]) {
      state.currentMode = mode;
      mp3.cargar(MUSIC[mode]);
      mp3.setRepeat(true);
      mp3.play();
    }
  
    if (!state.gameStructure) {
      state.gameStructure = "fases"; 
    }

    init(); 
    state.started = true;
    menuEl.style.display = "none"; 
    msg.style.display = "none";
    btnPausa.style.display = "block"; 
    btnPausa.innerHTML = "⏸️ Pausa";
    //btnCheatBoss.style.display = "block"; 
    mobileInput.style.pointerEvents = "auto";
    getAudio(); 
    mobileInput.focus();
  }
}

function showMenu() {
  state.started = false;
  state.paused = false;
  mp3.pause();
  
  mp3.cargar(MENU_THEME);
  mp3.setRepeat(true);
  mp3.play();

  document.getElementById("game").classList.add("hidden");
  document.getElementById("hud-superior").classList.add("hidden");
  btnPausa.style.display = "none"; 
  btnCheatBoss.style.display = "none";
  
  const menuEl = document.getElementById("menu");
  menuEl.classList.remove("hidden");
  menuEl.style.display = "block";

  document.getElementById("msg").style.display = "none";
  
  mostrarSoloVistaMenu("view-structure");
  document.getElementById("credits").classList.remove("hidden");

  refrescarProgresoVocabulario();

  mobileInput.style.pointerEvents = "none";
  mobileInput.blur();
}

document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    mp3.cargar(MENU_THEME);
    mp3.setRepeat(true);
    mp3.play();

    document.getElementById('menu').classList.remove('hidden');
    credits.classList.remove('hidden');

    const ac = getAudio();
    if (ac.state === 'suspended') {
      ac.resume();
    }
});

// La traducción en partida ahora vive en Ajustes: si se cambia (incluso en pausa) se aplica al momento
alCambiarAjuste('mostrarTraduccion', v => { state.mostrarTraduccion = v; });

document.querySelectorAll("#view-structure button[data-structure]").forEach(btn => {
  btn.addEventListener("click", () => {
    state.gameStructure = btn.dataset.structure;
    mostrarSoloVistaMenu("view-vocabulary");
  });
});

document.querySelectorAll("#view-vocabulary button[data-mode]").forEach(btn => {
  btn.addEventListener("click", () => {
    startGame(btn.dataset.mode);
  });
});

document.getElementById("btn-back-structure").addEventListener("click", () => {
  mostrarSoloVistaMenu("view-structure");
});

window.addEventListener("keydown", (ev) => {
  if (ev.key.toLowerCase() === "+") { togglePause(); return; } 
  if (!state.started || state.paused) return;
  if (ev.repeat) return; 
  if (state.gameOver) { if (ev.key === "Enter") startGame(state.currentMode); return; }
  handleChar(ev.key.toLowerCase());
});

mobileInput.addEventListener("input", () => {
  const val = mobileInput.value; 
  for (const ch of val) handleChar(ch.toLowerCase()); 
  mobileInput.value = "";
});

mobileInput.addEventListener("touchend", (ev) => { 
  ev.preventDefault(); 
  mobileInput.focus(); 
}, { passive: false });

mobileInput.addEventListener("blur", () => {
  if (state.started && !state.gameOver && !state.paused) { 
    setTimeout(() => { 
      if (state.started && !state.gameOver && !state.paused) mobileInput.focus(); 
    }, 50); 
  }
});

// ==========================================
// BUCLE PRINCIPAL CON DELTA TIME REAL
// ==========================================
const MS_POR_FRAME_60 = 1000 / 60;
let ultimoTimestamp = performance.now();

function loop(timestamp) {
  // Clamp: si la pestaña estuvo en segundo plano, no simulamos el salto entero
  const dtMs = Math.min(Math.max(timestamp - ultimoTimestamp, 0), 100);
  ultimoTimestamp = timestamp;
  const dtFactor = dtMs / MS_POR_FRAME_60; // 1.0 a 60fps, ~0.5 a 120Hz...

  update(dtFactor);
  ejecutarDrawLoop(dtMs / 1000);
  requestAnimationFrame(loop);
}

initInterfazMenu(MODES, { startGame });
init();
resize();
requestAnimationFrame(loop);
