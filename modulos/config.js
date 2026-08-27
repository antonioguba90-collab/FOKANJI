// ==========================================
// CONFIGURACIÓN, CANVAS Y ESTADO GLOBAL
// ==========================================
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const hud = document.getElementById("hud");
export const msg = document.getElementById("msg");
export const mobileInput = document.getElementById("mobile-input");
export const menuEl = document.getElementById("menu");

// Nombres legibles de cada modo de vocabulario (única fuente para HUD y mensajes)
export const NOMBRES_MODOS = {
  hiragana: "HIRAGANA",
  katakana: "KATAKANA",
  KANJI_NOKEN_5: "NIVEL NOKEN 5",
  KANJI_SEMANA_2: "NOKEN 2 - 1",
  KANJI_SEMANA_3: "NOKEN 2 - 2",
  KANJI_SEMANA_4: "NOKEN 2 - 3",
  KANJI_SEMANA_5: "NOKEN 2 - 4",
  KANJI_SEMANA_6: "NOKEN 2 - 5",
  KANJI_SEMANA_7: "NOKEN 2 - 6",
  custom: "MI VOCABULARIO",
};

export function formatearNombreModo(modo) {
  if (!modo) return "Desconocido";
  return NOMBRES_MODOS[modo] || modo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export const state = {
  W: window.innerWidth,
  H: window.innerHeight,
  MAX_ENEMIES: 6,
  player: null,
  enemies: [],
  bullets: [],
  particles: [],
  popups: [],
  lockedId: null,
  typedLen: 0,
  score: 0,
  kills: 0,
  gameOver: false,
  started: false,
  paused: false,
  spawnTimer: 0,
  spawnInterval: 180,
  nextId: 1,
  currentMode: "hiragana",
  ALL_WORDS_POOL: [],
  BOSS_POOL: [],
  music:null,
  ultimoCarrilUsado: "derecho",
  colaClonesPendientes: [],
};

// Inyección de botones del DOM
export let btnPausa = document.getElementById("btn-pausa") || (() => {
  const btn = document.createElement("button");
  btn.id = "btn-pausa";
  btn.innerHTML = "⏸️ Pausa";
  btn.className = "control-btn2"; // Usamos la clase CSS
  btn.style.top = "15px";
  btn.style.background = "rgba(34, 156, 170, 0.5)";
  btn.style.color = "#ffffff";
  document.body.appendChild(btn);
  return btn;
})();

export let btnCheatBoss = document.getElementById("btn-cheat-boss") || (() => {
  const btn = document.createElement("button");
  btn.id = "btn-cheat-boss";
  btn.innerHTML = "⚡ Skip to Boss";
  btn.className = "control-btn1"; // Usamos la clase CSS
  btn.style.top = "15px";
  btn.style.background = "rgba(74, 20, 140, 0.5)";
  btn.style.color = "#ffffff";
  btn.style.display = "none";
  document.body.appendChild(btn);
  return btn;
})();

export function resize() {
  const dpr = window.devicePixelRatio || 1;
  const vv = window.visualViewport;
  state.W = vv ? vv.width : window.innerWidth;
  state.H = vv ? vv.height : window.innerHeight; 
  
  canvas.width = state.W * dpr;
  canvas.height = state.H * dpr;
  canvas.style.width = state.W + "px";
  canvas.style.height = state.H + "px";
  
  const top = vv ? vv.offsetTop : 0;
  const left = vv ? vv.offsetLeft : 0;
  canvas.style.top = top + "px";
  canvas.style.left = left + "px";
  msg.style.top = (top + state.H / 2) + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

 if (state.player) {
    state.player.y = state.H - 30;
    state.player.x = state.W / 2;
  }
}

window.addEventListener("resize", resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize);
  window.visualViewport.addEventListener("scroll", resize);
}
