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

export const alturaHorizonte = state.H * 0.10; // El cielo ocupa el 10% superior de la pantalla

// ==========================================
// PRECARGA DE IMÁGENES DE FONDO (CAPAS DIVIDIDAS)
// ==========================================
const imgCielo = new Image();
imgCielo.src = './personajes/fondo_cielo.png'; // Asegúrate de colocar tu imagen de cielo aquí

const imgOceano = new Image();
imgOceano.src = './personajes/fondo_oceano.png';   // Asegúrate de colocar tu imagen de agua aquí

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
// dtSeg: delta real en segundos (lo pasa el loop principal); clamp por si la pestaña estuvo en segundo plano
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
    return; // En el menú no hay nada que renderizar
  }

  // 1. Declaramos el tiempo y el dt al principio de todo el dibujado
  const time = performance.now() / 1000;
  const dt = Math.min(dtSeg, 0.1);

  // ==========================================
  // 2. FONDO: CAPAS EN PIXEL ART (CIELO Y OCÉANO)
  // ==========================================

  // A. Dibujar el Cielo y Montañas
  if (imgCielo.complete) {
    ctx.drawImage(imgCielo, 0, 0, state.W, alturaHorizonte);
  } else {
    const gradienteCielo = ctx.createLinearGradient(0, 0, 0, alturaHorizonte);
    gradienteCielo.addColorStop(0, "#87CEEB");
    gradienteCielo.addColorStop(1, "#E0F7FA");
    ctx.fillStyle = gradienteCielo;
    ctx.fillRect(0, 0, state.W, alturaHorizonte);
  }

  // B. DIBUJAR EL OCÉANO CON ONDULACIÓN POR TIRAS (OPCIÓN 2)
  if (imgOceano.complete) {
    const oceanoH = state.H - alturaHorizonte;
    const numTiras = 16; // Número de franjas horizontales
    const altoTiraCanvas = oceanoH / numTiras;
    const altoTiraImg = imgOceano.height / numTiras;

    for (let i = 0; i < numTiras; i++) {
      const ySrc = i * altoTiraImg;
      const yDest = alturaHorizonte + (i * altoTiraCanvas);

      // Pulso desfasado usando 'time'
      const desfaseOndulacion = Math.sin(time * 3 + i * 0.5) * (1.5 + i * 0.2);

      ctx.drawImage(
        imgOceano,
        0, ySrc, imgOceano.width, altoTiraImg,
        desfaseOndulacion - 4, yDest, state.W + 8, altoTiraCanvas + 0.5
      );
    }
  } else {
    // Fallback por si la imagen tarda en cargar
    const gradienteOceano = ctx.createLinearGradient(0, alturaHorizonte, 0, state.H);
    gradienteOceano.addColorStop(0, "#004080");
    gradienteOceano.addColorStop(0.5, "#0074D9");
    gradienteOceano.addColorStop(1, "#7FDBFF");
    ctx.fillStyle = gradienteOceano;
    ctx.fillRect(0, alturaHorizonte, state.W, state.H - alturaHorizonte);
  }

  // Línea sutil de horizonte
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, alturaHorizonte);
  ctx.lineTo(state.W, alturaHorizonte);
  ctx.stroke();

  // ==========================================
 // ==========================================
// 2. ICEBERGS CON ESCALADO POR PROFUNDIDAD Y CARRIL PROTEGIDO (ORIGINAL INTACTO)
  // ==========================================
  const imagenesIceberg = [];
  const rutasIceberg = [
    './personajes/iceberg9.png',
    './personajes/iceberg10.png',
    './personajes/iceberg11.png',
    './personajes/iceberg12.png',
    './personajes/iceberg14.png',
    './personajes/iceberg15.png',
    './personajes/iceberg16.png',
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

  // Función para reiniciar o crear el iceberg en su carril original del horizonte (EXACTAMENTE TUYA)
  function reiniciarIceberg(berg, yInicial = alturaHorizonte) {
    const factorEscala = Math.min(2.0, Math.max(0.1, yInicial / state.H));
    const velocidadConstanteIceberg = 10;
    berg.y = yInicial;
    berg.factor = factorEscala;
    berg.bW = (state.W * 0.25) * factorEscala;
    berg.bH = (state.H * 0.18) * factorEscala;
    berg.velocidad = velocidadConstanteIceberg;
    berg.img = imagenesIceberg[Math.floor(Math.random() * imagenesIceberg.length)];

    // Guardamos qué carril le tocó (0 = Izquierdo, 1 = Derecho) para respetarlo siempre
    berg.carrilTipo = window.siguienteCarrilIceberg;

    // Nacen exactamente en sus carriles originales seguros
    if (berg.carrilTipo === 0) {
      berg.x = state.W * 0.10 + (Math.random() * (state.W * 0.05)); // Rango inicial izq
    } else {
      berg.x = state.W * 0.80 + (Math.random() * (state.W * 0.05)); // Rango inicial der
    }
    
    // CONGELAMOS LA PANTALLA BASE AL NACER (Esto evita que el teclado del móvil deforme el iceberg en marcha)
    berg.baseH = state.H;
    berg.baseW = state.W;

    window.siguienteCarrilIceberg = 1 - window.siguienteCarrilIceberg;
  }

  if (!state.icebergs) state.icebergs = [];
  const MAX_ICEBERGS = 5; 

  while (state.icebergs.length < MAX_ICEBERGS) {
    const nuevoBerg = {};
    const rangoY = state.H - alturaHorizonte;
    const espacioEntreIcebergs = rangoY / MAX_ICEBERGS;
    const yInicialEscalonada = alturaHorizonte + (state.icebergs.length * espacioEntreIcebergs) + (Math.random() * 20);
    
    reiniciarIceberg(nuevoBerg, yInicialEscalonada);
    state.icebergs.push(nuevoBerg);
  }

  // Actualización, movimiento y RESTRICCIÓN DE CARRIL
  state.icebergs.forEach((berg, index) => {
    // Definimos la velocidad base que tenía tu código original
    let velocidadMovimiento = berg.velocidad;

    // CONTROL DE DISTANCIA: Si hay otro iceberg delante en el mismo carril muy cerca, 
    // adaptamos la velocidad para evitar que se junten o solapen.
    state.icebergs.forEach(otro => {
      if (otro !== berg && otro.carrilTipo === berg.carrilTipo) {
        if (otro.y > berg.y && (otro.y - berg.y) < 130) {
          velocidadMovimiento = Math.min(velocidadMovimiento, otro.velocidad * 0.8);
        }
      }
    });

    berg.y += velocidadMovimiento * dt;
    
    // Si por lo que sea el iceberg es antiguo y no tiene base registrada, la coge ahora
    if (!berg.baseH) berg.baseH = state.H;
    if (!berg.baseW) berg.baseW = state.W;

    // El factor escala evoluciona desde el horizonte usando su base fija (así el teclado del móvil no lo rompe)
    berg.factor = Math.min(0.5, Math.max(0.15, berg.y / berg.baseH));
    berg.bW = (berg.baseW * 0.28) * berg.factor;
    berg.bH = (berg.baseH * 0.2) * berg.factor;

    // RESTRICCIÓN HORIZONTAL ESTRICTA EN MOVIMIENTO:
    if (berg.carrilTipo === 0) {
      // Carril Izquierdo: Tope máximo para que su lado derecho no rebase el 20%
      berg.x = Math.min(berg.x, state.W * 0.20 - berg.bW);
      berg.x = Math.max(0, berg.x); // Evita que se salga por la izquierda
    } else {
      // Carril Derecho: Tope mínimo para que su lado izquierdo no baje del 80%
      berg.x = Math.max(berg.x, state.W * 0.80);
      berg.x = Math.min(state.W - berg.bW, berg.x); // Evita que se salga por la derecha
    }

    // Si el iceberg sale por abajo, reaparece arriba justo en la línea del horizonte
    if (berg.y > state.H + 50) {
      reiniciarIceberg(berg, alturaHorizonte);
    }
  });

// RENDERIZADO (IMÁGENES PNG SINCRONIZADAS CON LAS OLAAS)
  state.icebergs.forEach((berg) => {
    const { x, y, bW, bH, img } = berg;
    if (img && img.complete) {
      
      // 1. Calculamos a qué franja (tira) del océano corresponde la posición 'y' del iceberg
      const oceanoH = state.H - alturaHorizonte;
      const numTiras = 16;
      const altoTiraCanvas = oceanoH / numTiras;
      
      // Averiguamos el índice de la tira (de 0 a 15) basado en la altura del iceberg
      let indiceTira = Math.floor((y - alturaHorizonte) / altoTiraCanvas);
      indiceTira = Math.max(0, Math.min(numTiras - 1, indiceTira)); // Asegurarnos de que no se salga de rango

      // 2. Aplicamos exactamente el mismo pulso desfasado que usa el agua para esa tira
      const desfaseOndulacion = Math.sin(time * 3 + indiceTira * 0.5) * (1.5 + indiceTira * 0.2);

      // 3. Dibujamos el iceberg aplicando el desplazamiento de la onda en su eje X y un ligero sutil vaivén en Y
      const xOndeada = x + desfaseOndulacion - 4;
      const yOndeada = y + (desfaseOndulacion * 0.3); // Un pequeño balanceo vertical extra para redondear el efecto

      ctx.drawImage(img, xOndeada, yOndeada, bW, bH);
    }
  });
  // ==========================================
  // 4. TORMENTA DE NIEVE ALEATORIA (Paralaje Cercano)
  // ==========================================
  if (!state.snowflakes) {
    state.snowflakes = [];
    const numSnowflakes = 120;

    for (let i = 0; i < numSnowflakes; i++) {
      const esGrande = Math.random() > 0.85;
      const size = esGrande ? 1.0 + Math.random() * 2.5 : 0.5 + Math.random() * 1.3;

      state.snowflakes.push({
        x: Math.random() * state.W,
        y: Math.random() * state.H,
        size: size,
        speedY: 35 + Math.random() * 55,
        speedX: 8 + Math.random() * 18,
        swingDelay: Math.random() * 100
      });
    }
  }

  const vientoGlobal = Math.sin(time * 0.3) * 35 + Math.cos(time * 0.08) * 15;

  state.snowflakes.forEach((flake) => {
    const vaivénIndividual = Math.sin(time * 2 + flake.swingDelay) * flake.speedX;
    
    flake.y += (flake.speedY + (flake.size * 12)) * dt;
    flake.x += (vaivénIndividual + vientoGlobal) * dt;

    if (flake.y > state.H) {
      flake.y = -10;
      flake.x = Math.random() * state.W;
    }
    if (flake.x < -10) flake.x = state.W + 10;
    if (flake.x > state.W + 10) flake.x = -10;

    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
    
    if (flake.size > 2.0) {
      ctx.fillStyle = "rgba(240, 250, 255, 0.45)"; 
    } else {
      ctx.fillStyle = `rgba(225, 245, 254, ${0.5 + flake.size * 0.15})`; 
    }
    
    ctx.fill();
  });

  // 1. Dibujar Personaje (Nave Foca) — salvo durante la animación de game over
  if (!state.gameOverAnim) dibujarPersonaje(ctx, state.player, dt * 60);

  const baseFontJp = Math.min(state.W, state.H) * 0.04 + 14;
  const baseFontR = Math.min(state.W, state.H) * 0.025 + 10;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 2. Dibujar Enemigos delegando según su Tipo (Minion, Guardián o Gran Jefe)
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
      const offsetBase = (size * 0.6) + (size * 0.3);

      // 1. Dibujar Japonés (Traducción)
      ctx.font = `bold ${subSize}px sans-serif`;
      ctx.fillStyle = "#000";
      drawWrappedText(ctx, p.jp, state.W / 2 + 2, state.H / 2 + offsetBase + 2, maxWidth, subSize * 1.2);
      ctx.fillStyle = "#fff";
      drawWrappedText(ctx, p.jp, state.W / 2, state.H / 2 + offsetBase, maxWidth, subSize * 1.2);

      // 2. Dibujar Romaji
      const romajiOffset = offsetBase + (subSize * 1.5);
      ctx.font = `bold ${subSize * 1.1}px monospace`;
      
      const romajiText = p.romaji.toUpperCase();
      ctx.fillStyle = "#000";
      drawWrappedText(ctx, romajiText, state.W / 2 + 2, state.H / 2 + romajiOffset + 2, maxWidth, subSize * 1.2);
      ctx.fillStyle = "#6cffeb"; // COLOR DE AYUDA (Cian Eléctrico)
      drawWrappedText(ctx, romajiText, state.W / 2, state.H / 2 + romajiOffset, maxWidth, subSize * 1.2);
    }
  }

  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;

  // ========================================================
  // 4b. ANIMACIÓN DE GAME OVER "CONGELACIÓN ÁRTICA"
  // ========================================================
  if (state.gameOverAnim) {
    const anim = state.gameOverAnim;
    const t = anim.t;

    ctx.fillStyle = `rgba(2, 14, 34, ${Math.min(0.72, t / 80)})`;
    ctx.fillRect(0, 0, state.W, state.H);

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

    if (!anim.copos) {
      anim.copos = [];
      for (let i = 0; i < 85; i++) {
        anim.copos.push({
          x: Math.random() * state.W,
          y: Math.random() * state.H,
          vx: -(380 + Math.random() * 420),
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

      ctx.strokeStyle = `rgba(240, 250, 255, ${copo.alpha * fuerzaVentisca})`;
      ctx.lineWidth = copo.size;
      ctx.beginPath();
      ctx.moveTo(copo.x, copo.y);
      ctx.lineTo(copo.x - copo.vx * 0.035, copo.y - copo.vy * 0.035);
      ctx.stroke();
    }

    if (t < 14) {
      ctx.fillStyle = `rgba(225, 242, 255, ${(1 - t / 14) * 0.85})`;
      ctx.fillRect(0, 0, state.W, state.H);
    }

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

      ctx.shadowColor = "#6cffeb";
      ctx.shadowBlur = 26 * alpha;
      ctx.strokeStyle = "#06263f";
      ctx.lineWidth = tamano * 0.16;
      ctx.strokeText("GAME OVER", 0, 0);
      ctx.shadowBlur = 0;

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
  // ========================================================
  const modoFormateado = formatearNombreModo(state.currentMode);
  let lineasHud;

  if (state.gameStructure === "arcade") {
    const killsPorGuardian = Math.max(1, obtenerAjuste('arcadeKillsGuardian'));
    const guardianesDerrotadosArcade = Math.floor(state.kills / killsPorGuardian);
    lineasHud = [
      `Modo: ${modoFormateado} (Arcade)`,
      `Puntos: ${state.score}`,
      `Eliminados: ${state.kills}`,
      `Guardianes: ${guardianesDerrotadosArcade}`,
    ];
  } else {
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
    hud.textContent = textoHud;
    hudPrevio = textoHud;
  }
}
