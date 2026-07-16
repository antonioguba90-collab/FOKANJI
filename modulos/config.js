// ==========================================
// CONFIGURACIÓN, CANVAS Y ESTADO GLOBAL
// ==========================================
export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const hud = document.getElementById("hud");
export const msg = document.getElementById("msg");
export const mobileInput = document.getElementById("mobile-input");
export const menuEl = document.getElementById("menu");

export const state = {
  W: window.innerWidth,
  H: window.innerHeight,
  MAX_ENEMIES: 5,
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
  music:null
};

// Inyección de botones del DOM
export let btnPausa = document.getElementById("btn-pausa") || (() => {
  const btn = document.createElement("button");
  btn.id = "btn-pausa";
  btn.innerHTML = "⏸️ Pausa";
  btn.style = "position:fixed; top:15px; right:15px; z-index:100; padding:6px 12px; font-size:14px; background:rgb(0, 170, 255); color:#ffffff; border:2px solid #ffffff; border-radius:6px; cursor:pointer;";
  document.body.appendChild(btn);
  return btn;
})();

export let btnCheatBoss = document.getElementById("btn-cheat-boss") || (() => {
  const btn = document.createElement("button");
  btn.id = "btn-cheat-boss";
  btn.innerHTML = "⚡ Skip to Boss";
  btn.style = "position:fixed; top:55px; right:15px; z-index:100; padding:6px 12px; font-size:14px; background:rgb(238, 255, 3); color: #000000; border:2px solid #ffffff; border-radius:6px; cursor:pointer; display:none;";
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
    state.player.y = state.H - 80;
    state.player.x = state.W / 2;
  }
}

window.addEventListener("resize", resize);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize);
  window.visualViewport.addEventListener("scroll", resize);
}
