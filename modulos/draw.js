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
gradienteFondo.addColorStop(0, "#87CEEB");   
gradienteFondo.addColorStop(0.6, "#E0F7FA"); 
gradienteFondo.addColorStop(1, "#B2EBF2");   
ctx.fillStyle = gradienteFondo;
ctx.fillRect(0, 0, state.W, state.H);

const time = performance.now() / 1000;
// Delta time estimado para mantener la velocidad constante a 60fps
const dt = 1 / 60; 

// ==========================================
// ==========================================
// 2. ICEBERGS CON GENERACIÓN Y DESTRUCCIÓN EN VIVO (Sin patrones)
// ==========================================

// Función interna para generar un iceberg único sin colisiones en una Y específica
function crearNuevoIceberg(yInicial, intentosMax = 30) {
  let intentos = 0;
  while (intentos < intentosMax) {
    intentos++;
    
    // Proporciones y escala únicas
    const escalaAncho = 0.25 + Math.random() * 0.22;
    const escalaAlto = 0.15 + Math.random() * 0.15;
    const bW = state.W * escalaAncho;
    const bH = state.H * escalaAlto;
    const x = Math.random() * (state.W - bW);
    
    const radioColision = Math.max(bW, bH) * 0.5;
    const centroX = x + bW / 2;
    const centroY = yInicial + bH / 2;

    // Verificar si colisiona con los existentes en el state
    let solapado = false;
    if (state.icebergs) {
      for (let j = 0; j < state.icebergs.length; j++) {
        const otro = state.icebergs[j];
        const dx = centroX - (otro.x + otro.bW / 2);
        const dy = centroY - (otro.y + otro.bH / 2);
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < (radioColision + otro.radio + 25)) {
          solapado = true;
          break;
        }
      }
    }

    if (!solapado) {
      return {
        x: x,
        y: yInicial,
        bW: bW,
        bH: bH,
        radio: radioColision,
        velocidad: 16 + escalaAlto * 18
      };
    }
  }
  return null; // Si no encuentra sitio libre, devuelve null para reintentar en el próximo frame
}

// INICIALIZACIÓN ÚNICA: Poblado inicial repartido por la pantalla
if (!state.icebergs) {
  state.icebergs = [];
  const cantidadInicial = 4;
  for (let i = 0; i < cantidadInicial; i++) {
    // En el inicio los repartimos verticalmente por toda la pantalla
    const yRepartida = (i * (state.H * 0.25)) - (state.H * 0.1);
    const berg = crearNuevoIceberg(yRepartida);
    if (berg) state.icebergs.push(berg);
  }
}

// ACTUALIZACIÓN DEL CICLO DE VIDA (Movimiento y Filtrado)
state.icebergs.forEach((berg) => {
  berg.y += berg.velocidad * dt;
});

// 1. DESTRUCCIÓN: Eliminamos del mapa los que se han hundido por el fondo
const longitudAntes = state.icebergs.length;
state.icebergs = state.icebergs.filter(berg => berg.y < state.H);
const cuantosMurieron = longitudAntes - state.icebergs.length;

// 2. NACIMIENTO: Si murió algún iceberg (o hay menos del mínimo), creamos nuevos ARRIBA
// Ponemos un límite máximo de 5 a la vez para mantener el equilibrio visual
if (cuantosMurieron > 0 || state.icebergs.length < 3) {
  if (state.icebergs.length < 5) {
    // Nacen ocultos en la parte superior (-bH aprox), con un desfase aleatorio de tiempo
    const desfaseSuperior = -120 - Math.random() * 100;
    const nuevoBerg = crearNuevoIceberg(desfaseSuperior);
    if (nuevoBerg) {
      state.icebergs.push(nuevoBerg);
    }
  }
}

// RENDERIZADO DE LOS ICEBERGS ÚNICOS
state.icebergs.forEach((berg) => {
  const xBase = berg.x;
  const y = berg.y;
  const bW = berg.bW;
  const bH = berg.bH;

  // --- Cara en sombra (Izquierda) ---
  ctx.fillStyle = "rgba(130, 148, 168, 0.35)";
  ctx.beginPath();
  ctx.moveTo(xBase, y + bH * 0.5);
  ctx.lineTo(xBase + bW * 0.4, y); 
  ctx.lineTo(xBase + bW * 0.45, y + bH);
  ctx.lineTo(xBase - bW * 0.1, y + bH * 0.8);
  ctx.closePath();
  ctx.fill();

  // --- Cara iluminada (Derecha) ---
  ctx.fillStyle = "rgba(205, 225, 245, 0.55)";
  ctx.beginPath();
  ctx.moveTo(xBase + bW * 0.4, y); 
  ctx.lineTo(xBase + bW, y + bH * 0.4);
  ctx.lineTo(xBase + bW * 0.8, y + bH);
  ctx.lineTo(xBase + bW * 0.45, y + bH);
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

  
  // 4. Carteles emergentes con significados en Español (Popups)
  for (const p of state.popups) {
  ctx.globalAlpha = Math.min(1, p.life * 2);
  ctx.textAlign = "center"; 
  ctx.textBaseline = "middle";

  const size = (Math.min(state.W, state.H) * 0.07 + 15) * p.scale;
  const maxWidth = state.W * 0.8; // Máximo 80% del ancho de pantalla
  const lineHeight = size * 1.1;

  // --- Dibujo del texto principal (Español) ---
  ctx.font = `bold ${size}px sans-serif`;
  
  // Sombra
  ctx.fillStyle = "#000";
  drawWrappedText(ctx, p.text, state.W / 2 + 3, state.H / 2 + 3, maxWidth, lineHeight);
  // Color principal
  ctx.fillStyle = "#ffeb3b";
  drawWrappedText(ctx, p.text, state.W / 2, state.H / 2, maxWidth, lineHeight);
  
  // --- Dibujo del texto secundario (Japonés + Romaji) ---
  if (p.jp && p.romaji) {
    const subSize = Math.min(state.W, state.H) * 0.03 + 10;
    ctx.font = `bold ${subSize}px sans-serif`;
    const subText = `${p.jp} (${p.romaji.toUpperCase()})`;
    
    // Calculamos posición justo debajo del texto principal
    // (Aproximamos la altura basada en el número de líneas dibujadas)
    const offset = (size * 0.6) + (size * 0.3); 

    ctx.fillStyle = "#000";
    drawWrappedText(ctx, subText, state.W / 2 + 2, state.H / 2 + offset + 2, maxWidth, subSize * 1.2);
    
    ctx.fillStyle = "#fff";
    drawWrappedText(ctx, subText, state.W / 2, state.H / 2 + offset, maxWidth, subSize * 1.2);
  }
}
// Importante: resetear alineación para no afectar otros dibujos del juego
ctx.textAlign = "start";
ctx.textBaseline = "alphabetic";

  ctx.globalAlpha = 1;

  // ========================================================
  // 5. Actualización del HUD del Texto Superior
  // ========================================================
  const progresoFase = Math.max(0, sistemaLector.TOTAL_PALABRAS_FASE - sistemaLector.palabrasUnicasCompletadasSet.size);
  
  const totalSet = sistemaLector.CANTIDAD_NUEVAS + sistemaLector.CANTIDAD_REPASO;
const completadas = sistemaLector.palabrasUnicasCompletadasSet.size;

let textoHud = `Puntos: ${state.score}  |  Fase Actual: ${sistemaLector.miniJefesDerrotados + 1}  |  Progreso: ${sistemaLector.bossMode ? "¡JEFE!" : `${completadas}/${totalSet}`}`;
  
  // 🔥 MODIFICADO: Condición más segura y directa
  // Si el total de palabras del nivel existe, es mayor que 0, y no es el modo arcade puro, lo pintamos:
  if (state.totalPalabrasNivel !== undefined && state.gameStructure !== "arcade") {
    textoHud += `  (Restan del Nivel: ${state.totalPalabrasNivel})`;
  }

  hud.textContent = textoHud;
}