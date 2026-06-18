import { state, canvas, ctx, hud, msg, mobileInput, menuEl, btnPausa, btnCheatBoss, resize } from './modulos/config.js';
import { parsearLista } from './modulos/parser.js';
import { getAudio, playShoot, playExplosion } from './modulos/audio.js';
import { sistemaLector } from './modulos/sistemaFases.js';
import { ejecutarDrawLoop } from './modulos/draw.js';
import { actualizarFisicasYColisiones } from './modulos/fisicas.js';

// Importación de controladores estructurales
import { controladorModoFases } from './modulos/sistemaModoFases.js';
import { controladorModoArcade } from './modulos/sistemaModoArcade.js';
import { ReproductorMP3 }  from './modulos/reproductor.js';


// Importación de los RAW externos de vocabulario
import { HIRAGANA_RAW } from './modos/hiragana.js';
import { KATAKANA_RAW } from './modos/katakana.js';
import { KANJI_RAW } from './modos/kanji.js';
import { KANJI_SEMANA_3_RAW } from './modos/KANJI_SEMANA_3.js';
import { KANJI_SEMANA_4_RAW } from './modos/KANJI_SEMANA_4.js';
import { KANJI_SEMANA_6_RAW } from './modos/KANJI_SEMANA_6.js';
import { KANJI_SEMANA_7_RAW } from './modos/KANJI_SEMANA_7.js';

const MODES = { 
  hiragana: parsearLista(HIRAGANA_RAW), 
  katakana: parsearLista(KATAKANA_RAW), 
  kanji: parsearLista(KANJI_RAW),
  KANJI_SEMANA_3: parsearLista(KANJI_SEMANA_3_RAW),
  KANJI_SEMANA_4: parsearLista(KANJI_SEMANA_4_RAW),
  KANJI_SEMANA_6: parsearLista(KANJI_SEMANA_6_RAW),
  KANJI_SEMANA_7: parsearLista(KANJI_SEMANA_7_RAW),
};

const MUSIC = { 
  hiragana: null, 
  katakana: null, 
  kanji: null,
  KANJI_SEMANA_3: "./audios/musica_semana3.mp3",
  KANJI_SEMANA_4: './audios/SoundHelix-Song-1.mp3',
  KANJI_SEMANA_6: null,
  KANJI_SEMANA_7: null,
};

let mp3 = new ReproductorMP3();

// Variable persistente para almacenar la estructura seleccionada ("fases" o "arcade")
state.gameStructure = "fases"; 

btnPausa.addEventListener("click", togglePause);
btnCheatBoss.addEventListener("click", cheatSaltarAlJefe);

function init() {
  const alturaVisible = window.visualViewport ? window.visualViewport.height : state.H;
  state.player = { x: state.W / 2, y: alturaVisible - 80, size: Math.min(state.W, state.H) * 0.04 + 10 };
  state.enemies = []; state.bullets = []; state.particles = []; state.popups = [];
  state.lockedId = null; state.typedLen = 0; state.score = 0; state.kills = 0; 
  state.gameOver = false; state.paused = false; state.spawnTimer = 0; 
  state.spawnInterval = 180; state.nextId = 1;
  
  msg.style.display = "none";
  btnPausa.style.display = "none";
  btnCheatBoss.style.display = "none";

  // Inicializamos el controlador adecuado según la estructura elegida
  if (state.gameStructure === "arcade") {
    controladorModoArcade.init();
  } else {
    controladorModoFases.init();
  }
}

function spawnEnemy() {
  if (sistemaLector.bossMode || state.paused || state.enemies.length >= state.MAX_ENEMIES) return; 

  // Solicitamos la palabra al controlador que corresponda
  let w = null;
  if (state.gameStructure === "arcade") {
    w = controladorModoArcade.obtainPalabraParaSpawn ? controladorModoArcade.obtainPalabraParaSpawn() : controladorModoArcade.obtenerPalabraParaSpawn();
  } else {
    w = controladorModoFases.obtenerPalabraParaSpawn();
  }

  if (!w) return;
  
  let x = 60 + Math.random() * (state.W - 120);
  const longLetras = w.romaji.length;
  const multiplicadorTamano = 1 + (longLetras * 0.12); 
  const radius = (Math.min(state.W, state.H) * 0.024 + 10) * multiplicadorTamano;
  
  for (let intento = 0; intento < 10; intento++) {
    const solapa = state.enemies.some(e => {
      if (e.y > state.H * 0.3) return false; 
      return Math.abs(e.x - x) < (radius * 2.5); 
    });
    if (!solapa) break;
    x = 60 + Math.random() * (state.W - 120);
  }
// VELOCIDAD INDEPENDIENTE POR MODO DE JUEGO
// ========================================================
let baseSpeed = 0;
let speedAdaptada = 0;

if (state.gameStructure === "arcade") {
  // 🕹️ Configuración para el MODO ARCADE:
  // Añadimos dificultad progresiva opcional basada en tus aciertos (state.kills)
  const factorDificultad = state.kills * 0.005; 
  
  // Modifica estos números para cambiar la velocidad del Arcade:
  baseSpeed = 0.30 + Math.random() * 0.25 + factorDificultad; // Más rápido de base
  speedAdaptada = Math.max(0.20, baseSpeed - (longLetras * 0.012)); 

} else {
  // 🎯 Configuración para el MODO FASES (Clásico):
  // Mantiene la velocidad original orientada al aprendizaje pausado
  baseSpeed = 0.18 + Math.random() * 0.18;
  speedAdaptada = Math.max(0.12, baseSpeed - (longLetras * 0.015));
}
  const paleta = ["#ff5252", "#34ace0", "#33d9b2", "#ffb142", "#ff793f"]; 
  const coloresUsados = new Set(state.enemies.map(e => e.color));
  const colorLibre = paleta.find(c => !coloresUsados.has(c)) || "#ffffff";

  state.enemies.push({
    id: state.nextId++, jp: w.jp, romaji: w.romaji, es: w.es, kana: w.kana || w.jp,
    x: x, y: -30, speed: speedAdaptada, radius: radius, isBoss: false,
    timerAyuda: 0, color: colorLibre, erroresPermitidos: 3,
    vecesAcertada: 0 
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

function update() {
  if (state.gameOver || !state.started || state.paused) return;

  // Actualización delegada según el modo activo
  if (state.gameStructure === "arcade") {
    controladorModoArcade.update(spawnEnemy);
  } else {
    controladorModoFases.update(spawnEnemy);
  }

  actualizarFisicasYColisiones(state, endGame);

  for (const b of state.bullets) {
    const tgt = state.enemies.find(e => e.id === b.targetId);
    if (!tgt) { b.dead = true; continue; }
    const dx = tgt.x - b.x; const dy = tgt.y - b.y; const d = Math.hypot(dx, dy);
    if (d < 15) { 
      b.dead = true;
      if (state.typedLen >= tgt.romaji.length && tgt.id === state.lockedId) {
        if (tgt.isBoss) avanzarFaseJefe(tgt); else destroyLocked();
      }
    } else {
      b.x += (dx / d) * 16; b.y += (dy / d) * 16;
    }
  }
  state.bullets = state.bullets.filter(b => !b.dead);
  for (const p of state.particles) { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= 0.025; }
  state.particles = state.particles.filter(p => p.life > 0);
  for (const p of state.popups) { p.life -= 0.012; p.scale += (1 - p.scale) * 0.15; }
  state.popups = state.popups.filter(p => p.life > 0);

  if (state.lockedId !== null && !state.enemies.find(e => e.id === state.lockedId)) {
    state.lockedId = null; state.typedLen = 0;
  }
}

function fireBullet(targetId) {
  if (!state.player) return;

  // 1. Definimos el centro real del sprite tal cual se dibuja en personaje.js
  const centroX = state.player.x;
  const centroY = state.player.y + 10;

  // 2. CONFIGURACIÓN DEL PUNTO DE SALIDA (Offsets)
  // Modifica estos valores multiplicando por 'state.player.size' para que escale bien en móviles:
  
  const puntoSalidaX = centroX; // Centrado horizontalmente (hocico/boca)
  
  // Restamos para subir el punto hacia la parte superior de la cabeza de la foca.
  // Si notas que sale muy arriba o abajo, cambia el '1.0' por '0.7', '1.2', etc.
  const puntoSalidaY = centroY - (state.player.size * 0.6); 

  // Si tu foca tuviera un cañón a un lado (ej: aleta derecha), podrías usar:
  // const puntoSalidaX = centroX + (state.player.size * 0.6);

  // 3. Insertamos la bala en la nueva posición precisa
  state.bullets.push({ 
    x: puntoSalidaX, 
    y: puntoSalidaY, 
    targetId, 
    dead: false 
  });

  if (typeof playShoot === 'function') playShoot();

  // 🔥 FORZAR LA ANIMACIÓN AQUÍ:
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
    state.lockedId = candidates[0].id; state.typedLen = 1; sistemaLector.palabraCometioError = false;
    fireBullet(candidates[0].id);
  } else {
    const target = state.enemies.find(e => e.id === state.lockedId);
    if (!target) { state.lockedId = null; state.typedLen = 0; return; }
    
    if (state.typedLen < target.romaji.length) {
      if (ch === target.romaji[state.typedLen]) {
        state.typedLen++; fireBullet(target.id);
      } else {
        if (!target.isBoss) {
          target.erroresPermitidos--;
          if (target.erroresPermitidos <= 0) {
            sistemaLector.palabraCometioError = true; 
            if (!sistemaLector.sacoErrores.some(x => x.romaji === target.romaji)) {
              sistemaLector.sacoErrores.push({ jp: target.jp, romaji: target.romaji, es: target.es, kana: target.kana });
            }
          }
        }
      }
    }
  }
}

function destroyLocked() {
  const target = state.enemies.find(e => e.id === state.lockedId);
  if (!target) { state.lockedId = null; state.typedLen = 0; return; }

  // 1. Sumamos el acierto
  target.vecesAcertada++;

  // 2. 🔥 CREAMOS EL POPUP AQUÍ (Para que salga SIEMPRE, ya sea el 1er o 2do acierto)
  // (Mantengo tu estructura original de propiedades ya que me confirmas que te funciona bien así)
  state.popups.push({ 
    text: target.kana || target.jp, 
    jp: target.es, 
    romaji: target.romaji, 
    life: 2.0, 
    scale: 0.2 
  });

  // 3. Evaluamos si es el primer acierto o el definitivo
  if (target.vecesAcertada < 2) {
    // === PRIMER ACIERTO: Reubicar arriba ===
    spawnExplosion(target.x, target.y, false);
    playExplosion();

    target.y = -30;
    target.x = 60 + Math.random() * (state.W - 120);
    target.timerAyuda = 0; 
    target.erroresPermitidos = 3; 

    state.lockedId = null; 
    state.typedLen = 0;

  } else {
    // === SEGUNDO ACIERTO: Destrucción definitiva ===
    spawnExplosion(target.x, target.y, false); 
    playExplosion();
    
    // (Borramos la línea del popup que estaba aquí antes, porque ya la pusimos arriba)
    
    if (!sistemaLector.palabraCometioError) {
      sistemaLector.sacoErrores = sistemaLector.sacoErrores.filter(x => x.romaji !== target.romaji);
      sistemaLector.palabrasSuperadasFase.push({ jp: target.jp, romaji: target.romaji, es: target.es, kana: target.kana });
    }

    sistemaLector.palabrasUnicasCompletadasSet.add(target.romaji);
    state.enemies = state.enemies.filter(e => e.id !== target.id);
    
    state.score += target.romaji.length * 20;
    state.kills++;
    
    state.lockedId = null; 
    state.typedLen = 0;
  }
}

function avanzarFaseJefe(target) {
  spawnExplosion(target.x, target.y, false); playExplosion();
  state.popups.push({ text: target.jp, jp: target.es, romaji: target.romaji, life: 2.0, scale: 0.3 });
  target.faseActual++;
  
  if (target.faseActual < target.fases.length) {
    const proxFrase = target.fases[target.faseActual];
    target.jp = proxFrase.jp; target.romaji = proxFrase.romaji; target.es = proxFrase.es;
    sistemaLector.bossTimerAyuda = 0; state.typedLen = 0; 
  } else {
    spawnExplosion(target.x, target.y, true); 
    state.enemies = state.enemies.filter(e => e.id !== target.id);
    state.score += 500; state.kills++;
    
    sistemaLector.bossMode = false; sistemaLector.activeBoss = null;
    state.lockedId = null; state.typedLen = 0;
    
    if (state.gameStructure !== "arcade") {
      sistemaLector.miniJefesDerrotados++;
      if (sistemaLector.miniJefesDerrotados > 3) {
        sistemaLector.miniJefesDerrotados = 0;
        sistemaLector.registroFasesPasadas = []; 
      }
      controladorModoFases.init(); 
    }
  }
}

function cheatSaltarAlJefe() {
  if (!state.started || state.gameOver || state.paused || sistemaLector.bossMode) return;
  if (state.gameStructure === "arcade") {
    state.kills = controladorModoArcade.proximoHitoJefe;
  } else {
    for (let i = 0; i < sistemaLector.TOTAL_PALABRAS_FASE; i++) {
      sistemaLector.palabrasUnicasCompletadasSet.add(`cheat_word_${i}`);
    }
    if (sistemaLector.palabrasSuperadasFase.length === 0) {
      sistemaLector.palabrasSuperadasFase = [...state.ALL_WORDS_POOL];
    }
  }
  state.enemies = []; state.lockedId = null; state.typedLen = 0;
  update();
}

function togglePause() {
  if (!state.started || state.gameOver) return;
  state.paused = !state.paused;

  if (state.paused) {
    btnPausa.innerHTML = "▶️ Reanudar";
    mp3.pause();
    msg.innerHTML = `JUEGO EN PAUSA<br><br>
                     <button id="btn-resume" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer;">Reanudar juego</button><br>
                     <button id="btn-restart" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer;">Volver a empezar</button><br>
                     <button id="btn-menu" style="padding:10px 20px; font-size:16px; margin:5px; cursor:pointer;">Cambiar modo</button>`;
    msg.style.display = "block"; mobileInput.blur();
    
    document.getElementById("btn-resume").addEventListener("click", togglePause);
    document.getElementById("btn-restart").addEventListener("click", () => startGame(state.currentMode));
    document.getElementById("btn-menu").addEventListener("click", showMenu);
  } else {
    btnPausa.innerHTML = "⏸️ Pausa"; msg.style.display = "none"; mobileInput.focus();
    mp3.play();
  }
}

function endGame() {
  state.gameOver = true;
  mp3.pause();
  btnPausa.style.display = "none"; btnCheatBoss.style.display = "none";
  spawnExplosion(state.player.x, state.player.y, true); playExplosion();
  const modeName = { hiragana: "Hiragana", katakana: "Katakana", kanji: "Kanji", kanji_n5: "Kanji N5" }[state.currentMode] || "Kanji Especial";
  msg.innerHTML = `GAME OVER<br>Modo: ${modeName}<br>Puntos: ${state.score}<br><button id="retry">Reintentar</button> <button id="changeMode">Cambiar modo</button>`;
  msg.style.display = "block"; mobileInput.blur();
  setTimeout(() => {
    document.getElementById("retry")?.addEventListener("click", () => startGame(state.currentMode));
    document.getElementById("changeMode")?.addEventListener("click", () => showMenu());
  }, 0);
}

function startGame(mode) {
  if (mode && MODES[mode]) {
    state.currentMode = mode;
    state.ALL_WORDS_POOL = MODES[mode].normales;
    state.BOSS_POOL = MODES[mode].jefe;
    mp3.cargar(MUSIC[mode]);
    mp3.play();
  }
  init(); state.started = true;
  menuEl.style.display = "none"; msg.style.display = "none";
  btnPausa.style.display = "block"; btnPausa.innerHTML = "⏸️ Pausa";
  btnCheatBoss.style.display = "block"; 
  mobileInput.style.pointerEvents = "auto";
  getAudio(); 
  mobileInput.focus();
}

function showMenu() {
  state.started = false; state.paused = false;
  menuEl.style.display = "block"; msg.style.display = "none";
  
  // Reseteamos las pantallas del menú para mostrar siempre el paso 1 al regresar
  document.getElementById("view-structure").classList.remove("hidden");
  document.getElementById("view-vocabulary").classList.add("hidden");
  
  btnPausa.style.display = "none"; btnCheatBoss.style.display = "none";
  mobileInput.style.pointerEvents = "none"; mobileInput.blur();
}

// ========================================================
// REFACTORIZACIÓN COMPLETA DE EVENTOS DE INTERFAZ DE USUARIO
// ========================================================

// Eventos de la Pantalla 1: Seleccionar la estructura de juego
document.querySelectorAll("#view-structure button").forEach(btn => {
  btn.addEventListener("click", () => {
    state.gameStructure = btn.dataset.structure; // Guardamos "fases" o "arcade"
    
    // Transicionamos visualmente ocultando la vista 1 y revelando la vista 2
    document.getElementById("view-structure").classList.add("hidden");
    document.getElementById("view-vocabulary").classList.remove("hidden");
  });
});

// Eventos de la Pantalla 2: Seleccionar el vocabulario e Iniciar
document.querySelectorAll("#view-vocabulary button:not(#btn-back-structure)").forEach(btn => {
  btn.addEventListener("click", () => {
    startGame(btn.dataset.mode);
  });
});

// Evento del botón "Volver atrás" dentro del submenú
document.getElementById("btn-back-structure").addEventListener("click", () => {
  document.getElementById("view-vocabulary").classList.add("hidden");
  document.getElementById("view-structure").classList.remove("hidden");
});

window.addEventListener("keydown", (ev) => {
  if (ev.key.toLowerCase() === "+") { togglePause(); return; } 
  if (!state.started || state.paused) return;
  if (ev.repeat) return; 
  if (state.gameOver) { if (ev.key === "Enter") startGame(state.currentMode); return; }
  handleChar(ev.key.toLowerCase());
});

mobileInput.addEventListener("input", () => {
  const val = mobileInput.value; for (const ch of val) handleChar(ch.toLowerCase()); mobileInput.value = "";
});
mobileInput.addEventListener("touchend", (ev) => { ev.preventDefault(); mobileInput.focus(); }, { passive: false });
mobileInput.addEventListener("blur", () => {
  if (state.started && !state.gameOver && !state.paused) { setTimeout(() => { if (state.started && !state.gameOver && !state.paused) mobileInput.focus(); }, 50); }
});

function loop() { update(); ejecutarDrawLoop(); requestAnimationFrame(loop); }
init();
resize();
loop();