const spriteGranJefe = new Image();
spriteGranJefe.src = "personajes/Guardian_Hacha3.png"; // Tu ruta de imagen

export function dibujarGranJefe(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
  const factorMobile = state.isMobile ? 0.85 : 1.0;
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
    img: spriteGranJefe, 
    
    frameWidth: 1028/4,   
    frameHeight: 243,  
    
    totalFrames: 4,   
    
    // Usamos la velocidad que tiene guardada este enemigo específico
    msPerFrame: e.ultimaVelocidadAnimacion, 
    
    // Rangos de velocidad aleatoria editables (en milisegundos)
    minMs: 550, // Lo más rápido (aprox 10 frames por segundo)
    maxMs: 1000, // Lo más lento (aprox 3.5 frames por segundo)
    
    renderWidth: (e.radius * 8) * factorMobile,  
    renderHeight: (e.radius * 8) * factorMobile,
    
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
  ctx.fillStyle = isLocked ? "#4a0000" : "#d32f2f"; 
  ctx.beginPath(); 
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); 
  ctx.fill();
  ctx.strokeStyle = "#ffd700"; // Borde dorado
  ctx.lineWidth = 5; 
  ctx.stroke();
  }
  // A. TÍTULO DEL GRAN JEFE (Violeta Vibrante + Estilo Épico)
  const titleY = e.y - e.radius - (40 * factorMobile); // Un poco más arriba para destacar
  
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 35px monospace"; // Un poco más grande para el Gran Jefe
  
  // Contorno oscuro para legibilidad total
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.lineWidth = 6;
  ctx.strokeText(`👑 🔥 ${e.name} 🔥 👑`, e.x, titleY);
  
  // Relleno Violeta Vibrante
  ctx.fillStyle = "#bc13fe"; 
  ctx.fillText(`👑 🔥 ${e.name} 🔥 👑`, e.x, titleY);

  // B. BARRA DE VIDA (Con marco estilo interfaz)
  const barWidth = 150 * factorMobile;  const barHeight = 12;
  const barX = e.x - (barWidth / 2);
  const barY = e.y - e.radius - 22;

  // Marco negro
  ctx.fillStyle = "#000000"; 
  ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
  
  // Fondo barra
  ctx.fillStyle = "#111"; 
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Relleno vida
  const vidaRestante = (e.fases.length - e.faseActual) / e.fases.length;
  ctx.fillStyle = "#f32408"; 
  ctx.fillRect(barX, barY, barWidth * vidaRestante, barHeight);

  // C. DIBUJAR KANJI (Contorno estándar 4px)
  ctx.textBaseline = "middle"; 
  ctx.font = `bold ${baseFontJp * 1.8 * factorMobile}px sans-serif`; // Más grande por ser jefe
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.strokeText(e.jp, e.x, e.y);
  ctx.fillStyle = "#fbf8ff";
  ctx.fillText(e.jp, e.x, e.y);
  
  // D. ROMAJI DE AYUDA (Estilo Ártico: Cian Eléctrico con borde)
if (sistemaLector.bossTimerAyuda >= 600) {
    // Definimos la base debajo del Kanji tal como en el Guardián
    const textoBaseY = e.y + 60; 
    // Calculamos la Y final (añadiendo espacio si mostraras traducción, 
    // ajusta el '+ 0' si decides agregar la traducción también)
    const romajiY = textoBaseY + 0; 
    
    ctx.font = `bold ${baseFontR * 1.5*factorMobile}px monospace`;
    ctx.lineJoin = "round";

    const romajiMayus = e.romaji.toUpperCase();
    const fullW = ctx.measureText(romajiMayus).width;
    const startX = e.x - fullW / 2;

    // Configuración de bordes para que coincida con el estilo del guardián
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 4;

    if (isLocked) {
      const typed = romajiMayus.slice(0, state.typedLen);
      const rest = romajiMayus.slice(state.typedLen);
      const typedWidth = ctx.measureText(typed).width;

      ctx.textAlign = "left"; 
      ctx.strokeText(typed, startX, romajiY);
      ctx.fillStyle = "#ffeb3b"; 
      ctx.fillText(typed, startX, romajiY);
      
      ctx.strokeText(rest, startX + typedWidth, romajiY);
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(rest, startX + typedWidth, romajiY);
    } else {
      ctx.textAlign = "center"; 
      ctx.strokeText(romajiMayus, e.x, romajiY);
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(romajiMayus, e.x, romajiY);
    }
  }}