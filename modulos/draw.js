// ==========================================
// ORQUESTADOR DE RENDERIZADO (DRAW LOOP)
// ==========================================
import { ctx, state, hud } from './config.js';
import { sistemaLector } from './sistemaFases.js';
import { dibujarPersonaje } from './personaje.js';
import { dibujarEnemigoComun } from './enemigos.js';
import { dibujarGuardian } from './guardianes.js';
import { dibujarGranJefe } from './granJefe.js';

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

export function ejecutarDrawLoop() {
  ctx.clearRect(0, 0, state.W, state.H);
  if (!state.started) {
    requestAnimationFrame(ejecutarDrawLoop);
    return; // No ejecutamos el resto del renderizado
  }
 // ==========================================
// ==========================================
// 1. FONDO: Azul océano ártico profundo
// ==========================================
const gradienteFondo = ctx.createLinearGradient(0, 0, 0, state.H);
gradienteFondo.addColorStop(0, "#001f3f"); 
gradienteFondo.addColorStop(0.6, "#0074D9"); 
gradienteFondo.addColorStop(1, "#7FDBFF"); 
ctx.fillStyle = gradienteFondo;
ctx.fillRect(0, 0, state.W, state.H);

const time = performance.now() / 1000;
const dt = 1 / 60; 

// ==========================================
// 2. ICEBERGS CON ESCALADO POR PROFUNDIDAD
// ==========================================

function crearNuevoIceberg(yInicial) {
  // El factor de escala va de 0.2 (arriba/lejos) a 1.0 (abajo/cerca)
  const factorEscala = Math.min(1.0, Math.max(0.2, yInicial / state.H));
  
  // Tamaño base que se multiplica por el factor de perspectiva
  const bW = (state.W * 0.3) * factorEscala;
  const bH = (state.H * 0.2) * factorEscala;
  
  return {
    x: Math.random() * (state.W - bW),
    y: yInicial,
    bW: bW,
    bH: bH,
    velocidad: 30 + (factorEscala * 60), // Más rápido cuanto más cerca
    factor: factorEscala // Guardamos el factor para usarlo en el dibujo
  };
}

// Inicialización
if (!state.icebergs) state.icebergs = [];
if (state.icebergs.length < 5) {
  state.icebergs.push(crearNuevoIceberg(Math.random() * state.H));
}

// Actualización y movimiento
state.icebergs.forEach((berg) => {
  berg.y += berg.velocidad * dt;
  // Actualizar escala dinámicamente según la nueva posición Y
  berg.factor = Math.min(1.0, Math.max(0.2, berg.y / state.H));
  // Re-ajustar dimensiones basadas en la nueva escala
  berg.bW = (state.W * 0.3) * berg.factor;
  berg.bH = (state.H * 0.2) * berg.factor;
});

// Filtrado (se destruyen al salir por abajo)
state.icebergs = state.icebergs.filter(berg => berg.y < state.H + 100);

// Nacimiento arriba
if (state.icebergs.length < 5) {
  state.icebergs.push(crearNuevoIceberg(-50));
}

// RENDERIZADO
state.icebergs.forEach((berg) => {
  const { x, y, bW, bH } = berg;

  // --- Cara en sombra (Izquierda) ---
  ctx.fillStyle = "rgba(130, 148, 168, 0.6)";
  ctx.beginPath();
  ctx.moveTo(x, y + bH * 0.5);
  ctx.lineTo(x + bW * 0.4, y); 
  ctx.lineTo(x + bW * 0.45, y + bH);
  ctx.lineTo(x - bW * 0.1, y + bH * 0.8);
  ctx.closePath();
  ctx.fill();

  // --- Cara iluminada (Derecha) ---
  ctx.fillStyle = "rgba(220, 240, 255, 0.9)";
  ctx.beginPath();
  ctx.moveTo(x + bW * 0.4, y); 
  ctx.lineTo(x + bW, y + bH * 0.4);
  ctx.lineTo(x + bW * 0.8, y + bH);
  ctx.lineTo(x + bW * 0.45, y + bH);
  ctx.closePath();
  ctx.fill();
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

  // 1. Dibujar Personaje (Nave Foca)
  dibujarPersonaje(ctx, state.player);

  const baseFontJp = Math.min(state.W, state.H) * 0.04 + 14;
  const baseFontR = Math.min(state.W, state.H) * 0.025 + 10;
  ctx.textAlign = "center"; 
  ctx.textBaseline = "middle"; 

  // 2. Dibujar Enemigos delegando según su Tipo (Minion, Guardián o Gran Jefe)
  for (const e of state.enemies) {
    const isLocked = e.id === state.lockedId;
    if (!e.isBoss) e.timerAyuda++;

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
// 5. Actualización del HUD del Texto Superior
const progresoFase = Math.max(0, sistemaLector.TOTAL_PALABRAS_FASE - sistemaLector.palabrasUnicasCompletadasSet.size);
  
const totalSet = sistemaLector.CANTIDAD_NUEVAS + sistemaLector.CANTIDAD_REPASO;
const completadas = sistemaLector.palabrasUnicasCompletadasSet.size;

// Preparamos el nombre del modo para que sea legible (ej: KANJI_NOKEN_5 -> Kanji Noken 5)
const nombresPersonalizados = {
  hiragana: "HIRAGANA",
  katakana: "KATAKANA",
  KANJI_NOKEN_5: "NIVEL NOKEN 5",
  KANJI_SEMANA_2: "NOKEN 2 - 1",
  KANJI_SEMANA_3: "NOKEN 2 - 2",
  KANJI_SEMANA_4: "NOKEN 2 - 3",
  KANJI_SEMANA_5: "NOKEN 2 - 4",
  KANJI_SEMANA_6: "NOKEN 2 - 5",
  KANJI_SEMANA_7: "NOKEN 2 - 6"
};

const modoFormateado = state.currentMode 
  ? (nombresPersonalizados[state.currentMode] || state.currentMode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  : "Desconocido";

let textoHud = `Modo: ${modoFormateado} | Puntos: ${state.score} | Fase: ${sistemaLector.miniJefesDerrotados + 1} | Progreso: ${sistemaLector.bossMode ? "¡JEFE!" : `${completadas}/${totalSet}`}`;
  
// Mantener tu lógica de progreso de nivel si aplica
if (state.totalPalabrasNivel !== undefined && state.gameStructure !== "arcade") {
  textoHud += `  (Restan del Nivel: ${state.totalPalabrasNivel})`;
}

hud.textContent = textoHud;
}