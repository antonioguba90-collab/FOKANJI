// ==========================================
// MÓDULO DE GUARDIANES (MINI-JEFES) WITH SPRITES
// ==========================================

const spriteGuardianGlobal = new Image();
spriteGuardianGlobal.src = "personajes/GUARDIAN3.png"; // Tu ruta de imagen

export function dibujarGuardian(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
  
  // === INICIALIZACIÓN DE ESTADO ALEATORIO EN EL ENEMIGO ===
  // Si el enemigo no tiene estas propiedades guardadas, las creamos la primera vez
  if (e.ultimaVelocidadAnimacion === undefined) {
    e.ultimaVelocidadAnimacion = 175; // Velocidad inicial por defecto
    e.ultimoFrameRegistrado = -1;
  }

  // ========================================================
  // 1. CONFIGURACIÓN DEL SPRITE (EDITABLE)
  // ========================================================
  const configSprite = {
    img: spriteGuardianGlobal, 
    
    frameWidth: 169,   
    frameHeight: 150,  
    
    totalFrames: 4,   
    
    // Usamos la velocidad que tiene guardada este enemigo específico
    msPerFrame: e.ultimaVelocidadAnimacion, 
    
    // Rangos de velocidad aleatoria editables (en milisegundos)
    minMs: 550, // Lo más rápido (aprox 10 frames por segundo)
    maxMs: 1000, // Lo más lento (aprox 3.5 frames por segundo)
    
    renderWidth: e.radius * 8,  
    renderHeight: e.radius * 8,
    
    offsetX: 0, 
    offsetY: 200  
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

  // ========================================================
  // 3. CAPA TEXTOS Y HUD (POR ENCIMA DEL SPRITE)
  // ========================================================
  //TITULO DEL GUARDIAN
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ff5"; 
  ctx.font = "bold 30px monospace";
  ctx.fillText(`[ ${e.name} ]`, e.x, e.y - e.radius - 32);
  //BARRA DE PROGRESO
  ctx.fillStyle = "#222"; 
  ctx.fillRect(e.x - 50, e.y - e.radius - 18, 100, 8);
  ctx.fillStyle = "#f05"; 
  ctx.fillRect(e.x - 50, e.y - e.radius - 18, ((e.fases.length - e.faseActual) / e.fases.length) * 100, 8);
  //DIBUJAR PALABRA
  ctx.textBaseline = "middle"; 
  ctx.fillStyle = "#ffffff"; 
  ctx.font = `bold ${baseFontJp * 1.5}px sans-serif`;
      //CONTORNO DEL KANJI
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.strokeText(e.jp, e.x, e.y);
  ctx.fillText(e.jp, e.x, e.y); 
  
  if (sistemaLector.bossTimerAyuda >= 600) {
    ctx.textBaseline = "alphabetic"; 
    ctx.font = `bold ${baseFontR * 1.5}px monospace`;
    const romajiYBoss = e.y - e.radius - 60;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round"; // Un extra para suavizar el contorno de las mayúsculas

    // Convertimos a mayúsculas aquí para usarlo en todo el bloque
    const romajiMayus = e.romaji.toUpperCase();

    if (isLocked) {
      // Cortamos y medimos usando la cadena en mayúsculas
      const typed = romajiMayus.slice(0, state.typedLen); 
      const rest = romajiMayus.slice(state.typedLen);
      const fullW = ctx.measureText(romajiMayus).width; 
      const startX = e.x - fullW / 2;
      
      // Ancho del texto ya escrito para posicionar correctamente el resto
      const typedWidth = ctx.measureText(typed).width;
      const restWidth = ctx.measureText(rest).width;

      ctx.textAlign = "left"; 
      ctx.strokeText(typed, startX, romajiYBoss);
      ctx.fillStyle = "#888"; 
      ctx.fillText(typed, startX, romajiYBoss);
      
      ctx.textAlign = "center"; 
      ctx.strokeText(rest, startX + typedWidth + (restWidth / 2), romajiYBoss);
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(rest, startX + typedWidth + (restWidth / 2), romajiYBoss);
    } else {
      ctx.textAlign = "center";
      ctx.strokeText(romajiMayus, e.x, romajiYBoss);
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(romajiMayus, e.x, romajiYBoss);
    }
    ctx.textBaseline = "middle";

  }
}