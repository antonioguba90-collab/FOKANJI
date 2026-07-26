// ==========================================
// ORQUESTADOR DE RENDERIZADO (DRAW LOOP)
// ==========================================
import { ctx, state, hud, formatearNombreModo } from './config.js';
import { sistemaLector } from './sistemaFases.js';
import { obtenerAjuste } from './ajustes.js';
import { dibujarPersonaje } from './personaje.js';
import { dibujarEnemigoComun } from './enemigos.js';
import { dibujarGuardian } from './guardianes.js';
import { dibujarGranJefe } from './granJefe.js';
export const alturaHorizonte = state.H * 0.10; // El cielo ocupa el 35% superior de la pantalla



// Última cadena pintada en el HUD: solo tocamos el DOM si cambia (evita reflows por frame)
let hudPrevio = "";

/**
 * Dibuja texto multilínea centrado.
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas.
 * @param {string} text - Texto a dibujar.
 * @param {number} x - Posición X central.
 * @param {number} y - Posición Y inicial.
 * @param {number} maxWidth - Ancho máximo antes de saltar de línea.
 * @param {number} lineHeight - Espaciado entre líneas.
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // Dibujar cada línea
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), x, y + (i * lineHeight));
  }
}

// dtSeg: delta real en segundos (lo pasa el loop principal); clamp por si la pestaña estuvo en segundo plano
export function ejecutarDrawLoop(dtSeg = 1 / 60) {
  ctx.clearRect(0, 0, state.W, state.H);
  if (!state.started) {
    return; // En el menú no hay nada que renderizar (el loop principal sigue vivo)
  }
 // ==========================================
// ==========================================
// 1. FONDO: CIELO ÁRTICO Y OCÉANO
// ==========================================

// A. Dibujar el Cielo (Degradado superior claro/polar)
const gradienteCielo = ctx.createLinearGradient(0, 0, 0, alturaHorizonte);
gradienteCielo.addColorStop(0, "#87CEEB"); // Azul cielo ártico claro
gradienteCielo.addColorStop(1, "#E0F7FA"); // Blanquecino cerca del horizonte
ctx.fillStyle = gradienteCielo;
ctx.fillRect(0, 0, state.W, alturaHorizonte);

// B. Dibujar el Océano (Del horizonte hacia abajo)
const gradienteOceano = ctx.createLinearGradient(0, alturaHorizonte, 0, state.H);
gradienteOceano.addColorStop(0, "#004080"); // Azul profundo en el horizonte
gradienteOceano.addColorStop(0.5, "#0074D9");
gradienteOceano.addColorStop(1, "#7FDBFF");
ctx.fillStyle = gradienteOceano;
ctx.fillRect(0, alturaHorizonte, state.W, state.H - alturaHorizonte);

// Opcional: Una línea sutil de horizonte
ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(0, alturaHorizonte);
ctx.lineTo(state.W, alturaHorizonte);
ctx.stroke();

const time = performance.now() / 1000;
const dt = Math.min(dtSeg, 0.1);



// ==========================================
// 2. ICEBERGS CON ESCALADO POR PROFUNDIDAD
// ==========================================
// ==========================================
// PRECARGA DE IMÁGENES DE ICEBERG
// ==========================================
const imagenesIceberg = [];
// Reemplaza estos nombres con las rutas reales de tus archivos PNG
const rutasIceberg = [
  './personajes/iceberg1.png', 
  './personajes/iceberg2.png', 
  //'./personajes/iceberg3.png',
  //'./personajes/iceberg4.png', 
  './personajes/iceberg5.png', 
  //'./personajes/iceberg6.png', 
  './personajes/iceberg7.png', 
  //'./personajes/iceberg8.png', 
];

rutasIceberg.forEach(ruta => {
  const img = new Image();
  img.src = ruta;
  imagenesIceberg.push(img);
});

// Variable para alternar la trayectoria de los carriles
if (window.siguienteCarrilIceberg === undefined) {
  window.siguienteCarrilIceberg = 0;
}

// Función para reiniciar o crear el iceberg en el horizonte
function reiniciarIceberg(berg, yInicial = 0) {
  // Ahora el factor de escala parte desde arriba (horizonte = escala muy pequeña)
  const factorEscala = Math.min(1.0, Math.max(0.1, yInicial / state.H));
  const velocidadConstanteIceberg = 30;
  berg.y = yInicial;
  berg.factor = factorEscala;
  berg.bW = (state.W * 0.25) * factorEscala;
  berg.bH = (state.H * 0.18) * factorEscala;
  berg.velocidad = velocidadConstanteIceberg;
  berg.img = imagenesIceberg[Math.floor(Math.random() * imagenesIceberg.length)];

  // Asignar carril lateral fijo (izquierdo o derecho) para evitar el centro/jugador
  if (window.siguienteCarrilIceberg === 0) {
    berg.x = state.W * 0.05 + (Math.random() * (state.W * 0.15));
  } else {
    berg.x = state.W * 0.65 + (Math.random() * (state.W * 0.15));
  }
  window.siguienteCarrilIceberg = 1 - window.siguienteCarrilIceberg;
}

// ==========================================
// 2. ICEBERGS (Nacen en el horizonte y crecen)
// ==========================================

if (!state.icebergs) state.icebergs = [];
const MAX_ICEBERGS = 3; 

while (state.icebergs.length < MAX_ICEBERGS) {
  const nuevoBerg = {};
  // Si es la primera carga, los distribuimos verticalmente debajo del horizonte
  const yInicialAleatoria = state.icebergs.length === 0 
    ? alturaHorizonte + Math.random() * (state.H - alturaHorizonte) 
    : alturaHorizonte;
  
  reiniciarIceberg(nuevoBerg, yInicialAleatoria);
  state.icebergs.push(nuevoBerg);
}

// Actualización, movimiento y separación entre icebergs
state.icebergs.forEach((berg, index) => {
  berg.y += berg.velocidad * dt;
  
  // 1. Evitar que se solapen con otros icebergs en pantalla
  for (let j = index + 1; j < state.icebergs.length; j++) {
    const otroBerg = state.icebergs[j];
    
    const dx = otroBerg.x - berg.x;
    const dy = otroBerg.y - berg.y;
    const distancia = Math.hypot(dx, dy);
    
    // Distancia mínima basada en el ancho del iceberg
    const distanciaMinima = berg.bW * 0.9;
    
  }

  // El factor escala evoluciona desde el horizonte hasta la parte inferior
  berg.factor = Math.min(1.0, Math.max(0.15, berg.y / state.H));
  berg.bW = (state.W * 0.28) * berg.factor;
  berg.bH = (state.H * 0.2) * berg.factor;

  // Si el iceberg sale por abajo, reaparece arriba justo en la línea del horizonte
  if (berg.y > state.H + 50) {
    reiniciarIceberg(berg, alturaHorizonte);
  }
});

// RENDERIZADO (IMÁGENES PNG)
state.icebergs.forEach((berg) => {
  const { x, y, bW, bH, img } = berg;
  if (img && img.complete) {
    ctx.drawImage(img, x, y, bW, bH);
  }
});
// ==========================================
// 4. TORMENTA DE NIEVE ALEATORIA (Paralaje Cercano)
// ==========================================

// INICIALIZACIÓN ÚNICA: Si no existen los copos en el 'state', los creamos con valores 100% aleatorios
if (!state.snowflakes) {
  state.snowflakes = [];
  const numSnowflakes = 120; // Cantidad de copos en pantalla

  for (let i = 0; i < numSnowflakes; i++) {
    // Generamos una distribución: 85% copos pequeños (fondo), 15% copos grandes (frente)
    const esGrande = Math.random() > 0.85;
    const size = esGrande ? 2.0 + Math.random() * 2.5 : 0.5 + Math.random() * 1.3;

    state.snowflakes.push({
      x: Math.random() * state.W,
      y: Math.random() * state.H,
      size: size,
      speedY: 35 + Math.random() * 55, // Velocidad base de caída
      speedX: 8 + Math.random() * 18,   // Velocidad del vaivén horizontal
      swingDelay: Math.random() * 100  // Desfase para que no oscilen al mismo tiempo
    });
  }
}

// Viento global que cambia de dirección e intensidad de forma suave con el tiempo
const vientoGlobal = Math.sin(time * 0.3) * 35 + Math.cos(time * 0.08) * 15;

// RENDERIZADO Y ACTUALIZACIÓN DINÁMICA
state.snowflakes.forEach((flake) => {
  // 1. Calcular el vaivén individual del copo + la racha de viento global
  const vaivénIndividual = Math.sin(time * 2 + flake.swingDelay) * flake.speedX;
  
  // 2. Modificar la posición real (Los copos grandes caen un extra más rápido por peso óptico)
  flake.y += (flake.speedY + (flake.size * 12)) * dt;
  flake.x += (vaivénIndividual + vientoGlobal) * dt;

  // 3. Control de límites (Re-inyección caótica sin patrones)
  if (flake.y > state.H) {
    flake.y = -10;
    flake.x = Math.random() * state.W; // Nueva X aleatoria al reaparecer arriba
  }
  // Si el viento empuja el copo fuera de los lados, reaparece en el extremo opuesto
  if (flake.x < -10) flake.x = state.W + 10;
  if (flake.x > state.W + 10) flake.x = -10;

  // 4. Dibujo individual en el lienzo
  ctx.beginPath();
  ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
  
  // Estilo: Los copos grandes en primer plano son más sutiles y transparentes
  if (flake.size > 2.0) {
    ctx.fillStyle = "rgba(240, 250, 255, 0.45)"; 
  } else {
    ctx.fillStyle = `rgba(225, 245, 254, ${0.5 + flake.size * 0.15})`; 
  }
  
  ctx.fill();
});

  // 1. Dibujar Personaje (Nave Foca) — salvo durante la animación de game over (ha explotado)
  if (!state.gameOverAnim) dibujarPersonaje(ctx, state.player, dt * 60);

  const baseFontJp = Math.min(state.W, state.H) * 0.04 + 14;
  const baseFontR = Math.min(state.W, state.H) * 0.025 + 10;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 2. Dibujar Enemigos delegando según su Tipo (Minion, Guardián o Gran Jefe)
  // (el timerAyuda avanza en el update del juego, no aquí)
  for (const e of state.enemies) {
    const isLocked = e.id === state.lockedId;

    if (e.isBoss) {
      if (e.id === 9999) {
        dibujarGranJefe(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector);
      } else {
        dibujarGuardian(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector);
      }
    } else {
      dibujarEnemigoComun(ctx, e, isLocked, state, baseFontR);
    }
  } 

  // 3. Proyectiles, Efectos y Partículas
  ctx.textBaseline = "alphabetic";
  for (const b of state.bullets) { 
    ctx.fillStyle = "#e0f7fa"; 
    ctx.beginPath(); 
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 4); 
    ctx.fill(); 
  }
  
  for (const p of state.particles) { 
    ctx.globalAlpha = Math.max(0, p.life); 
    ctx.fillStyle = p.color; 
    ctx.beginPath(); 
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); 
    ctx.fill(); 
  }
  ctx.globalAlpha = 1;

  
// 4. Carteles emergentes (Popups) - Traducción y Romaji separados
  for (const p of state.popups) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";

    const size = (Math.min(state.W, state.H) * 0.07 + 15) * p.scale;
    const maxWidth = state.W * 0.8;
    const lineHeight = size * 1.1;

    // --- A. Texto principal (Español) ---
    ctx.font = `bold ${size}px sans-serif`;
    ctx.fillStyle = "#000"; // Sombra
    drawWrappedText(ctx, p.text, state.W / 2 + 3, state.H / 2 + 3, maxWidth, lineHeight);
    ctx.fillStyle = "#ffeb3b"; // Color principal
    drawWrappedText(ctx, p.text, state.W / 2, state.H / 2, maxWidth, lineHeight);
    
    // --- B. Texto secundario (Japonés y Romaji) ---
    if (p.jp && p.romaji) {
      
      const subSize = Math.min(state.W, state.H) * 0.04 + 10;
      const offsetBase = (size * 0.6) + (size * 0.3); // Posición inicial debajo del principal

      // 1. Dibujar Japonés (Traducción)
      ctx.font = `bold ${subSize}px sans-serif`;
      ctx.fillStyle = "#000"; // Sombra
      drawWrappedText(ctx, p.jp, state.W / 2 + 2, state.H / 2 + offsetBase + 2, maxWidth, subSize * 1.2);
      ctx.fillStyle = "#fff"; // Color Japonés
      drawWrappedText(ctx, p.jp, state.W / 2, state.H / 2 + offsetBase, maxWidth, subSize * 1.2);

      // 2. Dibujar Romaji (Debajo de la traducción con color de ayuda)
      const romajiOffset = offsetBase + (subSize * 1.5); // Separación adicional
      ctx.font = `bold ${subSize * 1.1}px monospace`; // Un poco más pequeño y en monospace
      
      const romajiText = p.romaji.toUpperCase();
      ctx.fillStyle = "#000"; // Sombra Romaji
      drawWrappedText(ctx, romajiText, state.W / 2 + 2, state.H / 2 + romajiOffset + 2, maxWidth, subSize * 1.2);
      ctx.fillStyle = "#6cffeb"; // COLOR DE AYUDA (Cian Eléctrico)
      drawWrappedText(ctx, romajiText, state.W / 2, state.H / 2 + romajiOffset, maxWidth, subSize * 1.2);
    }
}
// Importante: resetear alineación para no afectar otros dibujos del juego
ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";

  ctx.globalAlpha = 1;

// ========================================================
// 4b. ANIMACIÓN DE GAME OVER "CONGELACIÓN ÁRTICA"
// Fases: golpe de ventisca (flash) → la noche polar cae y la escarcha
// cierra los bordes mientras cruza una ráfaga de nieve → rótulo de hielo
// ========================================================
if (state.gameOverAnim) {
  const anim = state.gameOverAnim;
  const t = anim.t;

  // 1. Noche polar: tinte azul profundo progresivo
  ctx.fillStyle = `rgba(2, 14, 34, ${Math.min(0.72, t / 80)})`;
  ctx.fillRect(0, 0, state.W, state.H);

  // 2. Escarcha cerrándose desde los bordes (viñeta helada)
  const escarcha = Math.min(1, t / 110);
  const radioMax = Math.hypot(state.W, state.H) / 2;
  const gradEscarcha = ctx.createRadialGradient(
    state.W / 2, state.H / 2, radioMax * 0.3,
    state.W / 2, state.H / 2, radioMax
  );
  gradEscarcha.addColorStop(0, "rgba(200, 235, 255, 0)");
  gradEscarcha.addColorStop(0.65, `rgba(190, 228, 255, ${0.06 * escarcha})`);
  gradEscarcha.addColorStop(1, `rgba(235, 248, 255, ${0.55 * escarcha})`);
  ctx.fillStyle = gradEscarcha;
  ctx.fillRect(0, 0, state.W, state.H);

  // 3. Ráfaga de ventisca lateral (partículas propias de la animación)
  if (!anim.copos) {
    anim.copos = [];
    for (let i = 0; i < 85; i++) {
      anim.copos.push({
        x: Math.random() * state.W,
        y: Math.random() * state.H,
        vx: -(380 + Math.random() * 420),      // viento fuerte hacia la izquierda
        vy: 40 + Math.random() * 90,
        size: 0.8 + Math.random() * 2.2,
        alpha: 0.35 + Math.random() * 0.5,
      });
    }
  }
  const fuerzaVentisca = Math.min(1, t / 25) * (t > 120 ? Math.max(0.35, 1 - (t - 120) / 60) : 1);
  for (const copo of anim.copos) {
    copo.x += copo.vx * dt * fuerzaVentisca;
    copo.y += copo.vy * dt * fuerzaVentisca;
    if (copo.x < -20) { copo.x = state.W + 20; copo.y = Math.random() * state.H; }
    if (copo.y > state.H + 10) copo.y = -10;

    // Trazo alargado en la dirección del viento: sensación de ráfaga
    ctx.strokeStyle = `rgba(240, 250, 255, ${copo.alpha * fuerzaVentisca})`;
    ctx.lineWidth = copo.size;
    ctx.beginPath();
    ctx.moveTo(copo.x, copo.y);
    ctx.lineTo(copo.x - copo.vx * 0.035, copo.y - copo.vy * 0.035);
    ctx.stroke();
  }

  // 4. Golpe inicial: flash blanco-azulado de ventisca
  if (t < 14) {
    ctx.fillStyle = `rgba(225, 242, 255, ${(1 - t / 14) * 0.85})`;
    ctx.fillRect(0, 0, state.W, state.H);
  }

  // 5. Rótulo GAME OVER de hielo: entra encogiéndose con sacudida que se calma
  if (t > 25) {
    const alpha = Math.min(1, (t - 25) / 30);
    const escala = 1.18 - 0.18 * alpha;
    const fuerzaShake = Math.max(0, 60 - t);
    const offsetX = Math.sin(t * 1.3) * fuerzaShake * 0.16;
    const offsetY = Math.cos(t * 1.1) * fuerzaShake * 0.11;
    const tamano = Math.min(state.W, state.H) * 0.11 + 22;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(state.W / 2 + offsetX, state.H * 0.42 + offsetY);
    ctx.scale(escala, escala);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${tamano}px 'Arial Black', sans-serif`;
    ctx.lineJoin = "round";

    // Halo helado + contorno azul noche
    ctx.shadowColor = "#6cffeb";
    ctx.shadowBlur = 26 * alpha;
    ctx.strokeStyle = "#06263f";
    ctx.lineWidth = tamano * 0.16;
    ctx.strokeText("GAME OVER", 0, 0);
    ctx.shadowBlur = 0;

    // Relleno de hielo: blanco → azul glaciar
    const gradHielo = ctx.createLinearGradient(0, -tamano * 0.55, 0, tamano * 0.55);
    gradHielo.addColorStop(0, "#ffffff");
    gradHielo.addColorStop(0.55, "#cdeeff");
    gradHielo.addColorStop(1, "#7fdbff");
    ctx.fillStyle = gradHielo;
    ctx.fillText("GAME OVER", 0, 0);
    ctx.restore();
  }
}

  // ========================================================
// 5. Actualización del HUD (4 líneas, esquina inferior izquierda)
const modoFormateado = formatearNombreModo(state.currentMode);
let lineasHud;

// 🕹️ HUD EXCLUSIVO PARA MODO ARCADE
if (state.gameStructure === "arcade") {
  const killsPorGuardian = Math.max(1, obtenerAjuste('arcadeKillsGuardian'));
  const guardianesDerrotadosArcade = Math.floor(state.kills / killsPorGuardian);
  lineasHud = [
    `Modo: ${modoFormateado} (Arcade)`,
    `Puntos: ${state.score}`,
    `Eliminados: ${state.kills}`,
    `Guardianes: ${guardianesDerrotadosArcade}`,
  ];
}
// 🗺️ HUD EXCLUSIVO PARA MODO FASES
else {
  const totalSet = sistemaLector.palabrasFaseActual.length > 0
    ? sistemaLector.palabrasFaseActual.length
    : sistemaLector.CANTIDAD_NUEVAS;

  const completadas = sistemaLector.palabrasUnicasCompletadasSet.size;
  const fase = sistemaLector.miniJefesDerrotados + 1;

  lineasHud = [
    `Modo: ${modoFormateado}`,
    `Puntos: ${state.score}`,
    sistemaLector.bossMode ? `Fase ${fase}: ¡JEFE!` : `Fase ${fase}: ${completadas}/${totalSet}`,
    `Restan del nivel: ${state.totalPalabrasNivel !== undefined ? state.totalPalabrasNivel : "-"}`,
  ];
}

const textoHud = lineasHud.join("\n");
if (textoHud !== hudPrevio) {
  hud.textContent = textoHud; // el CSS (white-space: pre-line) pinta cada línea
  hudPrevio = textoHud;
}
}
