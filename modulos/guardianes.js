// ==========================================
// MÓDULO DE GUARDIANES (MINI-JEFES) WITH SPRITES
// ==========================================
import { obtenerUmbralAyuda } from "./ajustes.js";

const spriteGuardianGlobal = new Image();

spriteGuardianGlobal.src = "personajes/DientesSable.png"; // Tu ruta de imagen

export function dibujarGuardian(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
const factorEscalaMovil = Math.max(Math.min(window.innerWidth / 1200, 1), 0.6);


  // === INICIALIZACIÓN DE ESTADO ALEATORIO EN EL ENEMIGO ===
  // Si el enemigo no tiene estas propiedades guardadas, las creamos la primera vez
  if (e.ultimaVelocidadAnimacion === undefined) {
    e.ultimaVelocidadAnimacion = 175; // Velocidad inicial por defecto
    e.ultimoFrameRegistrado = -1;
  }

  // ========================================================
  // 1. CONFIGURACIÓN DEL SPRITE (EDITABLE)
  // ========================================================
  
// CONFIGURACIÓN DEL SPRITE DEL GUARDIÁN
  const configSprite = {
    img: spriteGuardianGlobal, 
    frameWidth: 981/3,   
    frameHeight: 224,  
    totalFrames: 3,   
    msPerFrame: e.ultimaVelocidadAnimacion, 
    minMs: 550, 
    maxMs: 1000, 
    
    renderWidth: (e.radius * 5) * factorEscalaMovil,  
    renderHeight: (e.radius * 5) * factorEscalaMovil,
    
    offsetX: 0, 
    offsetY: 140 * factorEscalaMovil  
  };

  // ========================================================
  // 2. RENDERIZADO DEL CUERPO CON ANIMACIÓN AUTOMÁTICA
  // ========================================================
  if (configSprite.img && configSprite.img.complete && configSprite.img.naturalWidth !== 0) {
    
    // 1. Calculamos el frame actual basado en la velocidad guardada del enemigo
    const frameIndex = Math.floor(Date.now() / configSprite.msPerFrame) % configSprite.totalFrames;

    // 2. DETECTOR DE REINICIO DE CICLO:
    // Si el frame actual vuelve a ser 0 y antes estábamos en un frame diferente (ej: el 3),
    // significa que el ciclo ha completado una vuelta entera y acaba de comenzar.
    if (frameIndex === 0 && e.ultimoFrameRegistrado !== 0) {
      // Calculamos una nueva velocidad aleatoria para el SIGUIENTE ciclo completo
      const nuevoMin = configSprite.minMs;
      const nuevoMax = configSprite.maxMs;
      e.ultimaVelocidadAnimacion = Math.floor(Math.random() * (nuevoMax - nuevoMin + 1)) + nuevoMin;
    }

    // 3. Guardamos el frame actual para la próxima comparación en el siguiente renderizado
    e.ultimoFrameRegistrado = frameIndex;
    
    // Dibujamos el Sprite animado
    ctx.drawImage(
      configSprite.img,
      frameIndex * configSprite.frameWidth, 0, 
      configSprite.frameWidth, configSprite.frameHeight, 
      e.x - (configSprite.renderWidth / 2) + configSprite.offsetX, 
      e.y - (configSprite.renderHeight / 2) + configSprite.offsetY, 
      configSprite.renderWidth, configSprite.renderHeight 
    );
  } else {
    // FALLBACK
    ctx.fillStyle = isLocked ? "#1a237e" : "#9911ff"; 
    ctx.beginPath(); 
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); 
    ctx.fill();
    ctx.strokeStyle = "#ffffff"; 
    ctx.lineWidth = 4; 
    ctx.stroke();
  }
 // Función de salto automático de línea compatible con espacios y caracteres continuos
  const drawWrappedText = (context, text, x, y, maxWidth, lineHeight, isCustomDraw = null) => {
    const stringText = text ? text.toString() : "";
    let lines = [];
    let currentLine = "";

    const chunks = stringText.includes(' ') ? stringText.split(' ') : stringText.split('');

    for (let i = 0; i < chunks.length; i++) {
      const charOrWord = chunks[i];
      const spacer = stringText.includes(' ') ? ' ' : '';
      const testLine = currentLine + (currentLine.length > 0 ? spacer : '') + charOrWord;
      const metrics = context.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = charOrWord;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    let currentY = y;
    lines.forEach((l, index) => {
      const trimmedLine = l.trim();
      if (isCustomDraw) {
        isCustomDraw(trimmedLine, x, currentY, index);
      } else {
        context.strokeText(trimmedLine, x, currentY);
        context.fillText(trimmedLine, x, currentY);
      }
      currentY += lineHeight;
    });

    return lines.length;
  };

  // Ancho máximo permitido basado en la pantalla con un margen de seguridad
  const anchoMaximoDinamico = Math.min(window.innerWidth - 40, 600);

  // A. TÍTULO DEL GUARDIÁN Y BARRA
// TÍTULO DEL GUARDIÁN
  const titleY = e.y - e.radius - (50 * factorEscalaMovil);
  const fontSizeTitleDinamico = Math.min(Math.max(30 * factorEscalaMovil, 18), 30);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `bold ${fontSizeTitleDinamico}px monospace`;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.lineWidth = 5;
  ctx.strokeText(`[ ${e.name} ]`, e.x, titleY);
  ctx.fillStyle = "#00e5ff"; 
  ctx.fillText(`[ ${e.name} ]`, e.x, titleY);
  
  // BARRA DE VIDA
  const barWidth = 100 * factorEscalaMovil;  
  const barHeight = 12 * factorEscalaMovil;
  const barX = e.x - (barWidth / 2);
  const barY = e.y - e.radius - (38 * factorEscalaMovil);

  ctx.fillStyle = "#000000"; 
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  ctx.fillStyle = "#222222"; 
  ctx.fillRect(barX, barY, barWidth, barHeight);

  const vidaRestante = (e.fases.length - e.faseActual) / e.fases.length;
  ctx.fillStyle = "#ff0055"; 
  ctx.fillRect(barX, barY, barWidth * vidaRestante, barHeight);

  // B. DIBUJAR KANJI CON WRAPTEXT AUTOMÁTICO
  ctx.textBaseline = "middle";  
  const fontSizeJpDinamico = Math.min(Math.max(baseFontJp * 1.2 * factorEscalaMovil, 20), 55);
  ctx.font = `bold ${fontSizeJpDinamico}px sans-serif`;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 6;
  ctx.fillStyle = "#ffffff"; 
  ctx.textAlign = "center";

  const kanjiLineHeight = baseFontJp * 2;
  const offsetYKanji = -30 * factorEscalaMovil; // Sube el kanji por encima del centro del sprite
  const lineasKanji = drawWrappedText(ctx, e.jp, e.x, e.y + offsetYKanji, anchoMaximoDinamico, kanjiLineHeight);  const alturaTotalKanji = lineasKanji * kanjiLineHeight;

 // D. TEXTOS INFERIORES (Traducción y Romaji debajo del Sprite)
  // ========================================================
  // Calculamos exactamente dónde termina el sprite hacia abajo
  const spriteBottomY = e.y + (configSprite.renderHeight / 2) + configSprite.offsetY;
  let textY = spriteBottomY + 5; // Margen de separación debajo del sprite

  // 1. TRADUCCIÓN
  if (state.mostrarTraduccion && e.es) {
  // Nunca menor de 12px en móviles ni mayor de 22px en PC
  const fontSizeTradDinamico = Math.min(Math.max(16 * factorEscalaMovil, 12), 22);
  const tradLineHeight = fontSizeTradDinamico * 1.25; // El interlineado se adapta solo

  ctx.font = `bold ${fontSizeTradDinamico}px sans-serif`;
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 4;
  ctx.fillStyle = "#ffffff";

  const textoTrad = `(${e.es})`;
  const lineasTrad = drawWrappedText(ctx, textoTrad, e.x, textY, anchoMaximoDinamico, tradLineHeight);
  
  textY += (lineasTrad * tradLineHeight) + 4; 
}

  // 2. ROMAJI DE AYUDA
  if (sistemaLector.bossTimerAyuda >= obtenerUmbralAyuda()) {
  // Nunca menor de 14px ni mayor de 28px
  const fontSizeRomajiDinamico = Math.min(Math.max(baseFontR * 1.2, 10), 24);
  const romajiLineHeight = fontSizeRomajiDinamico * 1.3;

  ctx.font = `bold ${fontSizeRomajiDinamico}px monospace`;
  ctx.lineJoin = "round";

  const romajiMayus = e.romaji.toUpperCase();
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 3;

  if (isLocked) {
    let globalCharCount = 0;

    drawWrappedText(ctx, romajiMayus, e.x, textY, anchoMaximoDinamico, romajiLineHeight, (lineText, lx, ly) => {
      const fullLineWidth = ctx.measureText(lineText).width;
      let currentX = lx - fullLineWidth / 2;

      for (let i = 0; i < lineText.length; i++) {
        const char = lineText[i];
        const charWidth = ctx.measureText(char).width;
        
        const isTypedChar = globalCharCount < state.typedLen;
        globalCharCount++;

        ctx.textAlign = "left";
        ctx.strokeText(char, currentX, ly);
        ctx.fillStyle = isTypedChar ? "#ffeb3b" : "#6cffeb"; 
        ctx.fillText(char, currentX, ly);

        currentX += charWidth;
      }
    });
  } else {
    ctx.textAlign = "center";
    drawWrappedText(ctx, romajiMayus, e.x, textY, anchoMaximoDinamico, romajiLineHeight, (lineText, lx, ly) => {
      ctx.strokeText(lineText, lx, ly);
      ctx.fillStyle = "#6cffeb";
      ctx.fillText(lineText, lx, ly);
    });
  }
}}
