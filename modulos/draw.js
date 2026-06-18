// ==========================================
// ORQUESTADOR DE RENDERIZADO (DRAW LOOP)
// ==========================================
import { ctx, state, hud } from './config.js';
import { sistemaLector } from './sistemaFases.js';
import { dibujarPersonaje } from './personaje.js';
import { dibujarEnemigoComun } from './enemigos.js';
import { dibujarGuardian } from './guardianes.js';
import { dibujarGranJefe } from './granJefe.js';

export function ejecutarDrawLoop() {
  ctx.clearRect(0, 0, state.W, state.H);
  
 // 1. Fondo: Azul océano ártico profundo (Gradiente vertical)
  const gradienteFondo = ctx.createLinearGradient(0, 0, 0, state.H);
  gradienteFondo.addColorStop(0, "#081b29");   // Azul noche polar arriba
  gradienteFondo.addColorStop(0.5, "#030344"); // Azul océano medio
  gradienteFondo.addColorStop(1, "#054d5f");   // Tono más claro abajo donde está la foca
  ctx.fillStyle = gradienteFondo;
  ctx.fillRect(0, 0, state.W, state.H);
  
  const time = performance.now() / 1000;

  // 2. Témpanos de Hielo / Icebergs de fondo (Efecto Paralaje Lejano)
  // Generamos bloques geométricos flotantes simulando trozos de hielo gigantes
  ctx.fillStyle = "rgba(178, 181, 194, 0.54)"; // Azul hielo muy tenue para que no distraiga
  for (let i = 0; i < 4; i++) {
    // Calculamos posiciones que bajen muy lento para dar sensación de lejanía
    const bW = state.W * 0.4; // Bloques grandes
    const bH = state.H * 0.25;
    const xBase = (i * (state.W * 0.35)) % state.W;
    const y = (i * (state.H * 0.3) + (time * 15)) % (state.H + bH) - bH;
    
    // Dibujamos formas poligonales e irregulares como bloques de hielo
    ctx.beginPath();
    ctx.moveTo(xBase, y);
    ctx.lineTo(xBase + bW * 0.6, y - 20);
    ctx.lineTo(xBase + bW, y + bH * 0.3);
    ctx.lineTo(xBase + bW * 0.7, y + bH);
    ctx.lineTo(xBase - bW * 0.1, y + bH * 0.8);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Tormenta de Nieve Ártica Activa (Paralaje Cercano)
  const numSnowflakes = 120; 
  ctx.fillStyle = "rgba(225, 245, 254, 0.65)"; // Blanco gélido cristalino
  ctx.beginPath();

  for (let i = 0; i < numSnowflakes; i++) {
    const sizeMultiplier = (i * 0.17) % 1; 
    const baseSpeed = 80 + (sizeMultiplier * 180); // Caída más veloz y dinámica
    
    const baseX = (i * 197) % state.W;
    const swingX = Math.sin(time * 0.7 + i) * 20; // Viento racheado polar
    const x = (baseX + swingX + state.W) % state.W;
    
    const y = (i * 71 + (time * baseSpeed)) % state.H;
    const size = 0.6 + sizeMultiplier * 2.8;

    ctx.moveTo(x, y);
    ctx.arc(x, y, size, 0, Math.PI * 2);
  }
  ctx.fill();

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
    ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); 
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
    ctx.globalAlpha = Math.min(1, p.life * 1.5);
    const size = (Math.min(state.W, state.H) * 0.07 + 15) * p.scale;
    ctx.font = `bold ${size}px sans-serif`;
    
    ctx.fillStyle = "#000"; 
    ctx.fillText(p.text, state.W / 2 + 3, state.H / 2 + 3);
    ctx.fillStyle = "#ffeb3b"; 
    ctx.fillText(p.text, state.W / 2, state.H / 2);
    
    if (p.jp && p.romaji) {
      ctx.font = `bold ${Math.min(state.W, state.H) * 0.03 + 10}px sans-serif`;
      ctx.fillStyle = "#000"; 
      ctx.fillText(`${p.jp} (${p.romaji})`, state.W / 2 + 2, state.H / 2 + size * 0.85 + 2);
      ctx.fillStyle = "#fff"; 
      ctx.fillText(`${p.jp} (${p.romaji})`, state.W / 2, state.H / 2 + size * 0.85);
    }
  }
  ctx.globalAlpha = 1;

  // 5. Actualización del HUD del Texto Superior
  const progresoFase = Math.max(0, sistemaLector.TOTAL_PALABRAS_FASE - sistemaLector.palabrasUnicasCompletadasSet.size);
  hud.textContent = `Puntos: ${state.score}  |  Fase Actual: ${sistemaLector.miniJefesDerrotados + 1}  |  Palabras restantes: ${sistemaLector.bossMode ? "¡JEFE!" : progresoFase}`;
}