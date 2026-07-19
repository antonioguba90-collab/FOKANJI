// ==========================================
// MÓDULO DE GUARDIANES (MINI-JEFES) WITH SPRITES
// ==========================================

const spriteGuardianGlobal = new Image();
spriteGuardianGlobal.src = "personajes/Guardian_Kawaii.png"; // Tu ruta de imagen

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
    
    frameWidth: 1028/3,   
    frameHeight: 243,  
    
    totalFrames: 3,   
    
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
  // Posición base para los textos debajo del Kanji
  const textoBaseY = e.y + 60; // Ajustado según la escala del Guardian

 // A. TÍTULO DEL GUARDIÁN Y BARRA
  const titleY = e.y - e.radius - 35;
  
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 30px monospace";
  
  // Contorno oscuro para el nombre del jefe
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.lineWidth = 5;
  ctx.strokeText(`[ ${e.name} ]`, e.x, titleY);
  
  // Relleno amarillo
  ctx.fillStyle = "#00e5ff"; 
  ctx.fillText(`[ ${e.name} ]`, e.x, titleY);
  
  // BARRA DE VIDA (Con borde estilo UI)
  const barWidth = 100;
  const barHeight = 12;
  const barX = e.x - (barWidth / 2);
  const barY = e.y - e.radius - 22;

  // Marco negro de la barra
  ctx.fillStyle = "#000000"; 
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

  // Fondo de la barra
  ctx.fillStyle = "#222222"; 
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Relleno de vida restante
  const vidaRestante = (e.fases.length - e.faseActual) / e.fases.length;
  ctx.fillStyle = "#ff0055"; 
  ctx.fillRect(barX, barY, barWidth * vidaRestante, barHeight);

  // B. DIBUJAR KANJI (Con contorno sólido)
  ctx.textBaseline = "middle"; 
  ctx.font = `bold ${baseFontJp * 1.5}px sans-serif`;
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 6; // Contorno un poco más grueso para jefes
  ctx.strokeText(e.jp, e.x, e.y);
  ctx.fillStyle = "#ffffff"; 
  ctx.fillText(e.jp, e.x, e.y); 
  
  // C. TRADUCCIÓN (Estilo Ártico: Blanco brillante + Borde)
  if (state.mostrarTraduccion && e.es) {
      ctx.font = "bold 18px sans-serif";
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 4;
      ctx.strokeText(`(${e.es})`, e.x, textoBaseY);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`(${e.es})`, e.x, textoBaseY);
  }

  // D. ROMAJI DE AYUDA (Estilo Ártico: Cian Eléctrico + Borde)
  if (sistemaLector.bossTimerAyuda >= 600) {
    const romajiY = textoBaseY + (state.mostrarTraduccion ? 25 : 0);
    ctx.font = `bold ${baseFontR * 1.5}px monospace`;
    ctx.lineJoin = "round";

    const romajiMayus = e.romaji.toUpperCase();
    const fullW = ctx.measureText(romajiMayus).width;
    const startX = e.x - fullW / 2;

    if (isLocked) {
      const typed = romajiMayus.slice(0, state.typedLen);
      const rest = romajiMayus.slice(state.typedLen);

      // Texto escrito (Amarillo para feedback de usuario)
      ctx.textAlign = "left";
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 4;
      ctx.strokeText(typed, startX, romajiY);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText(typed, startX, romajiY);
      
      // Texto pendiente (Cian brillante)
      const typedWidth = ctx.measureText(typed).width;
      ctx.strokeText(rest, startX + typedWidth, romajiY);
      ctx.fillStyle = "#6cffeb";
      ctx.fillText(rest, startX + typedWidth, romajiY);
    } else {
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 4;
      ctx.strokeText(romajiMayus, e.x, romajiY);
      ctx.fillStyle = "#6cffeb";
      ctx.fillText(romajiMayus, e.x, romajiY);
    }
  }}