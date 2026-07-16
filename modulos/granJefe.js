const spriteGranJefe = new Image();
spriteGranJefe.src = "personajes/JEFE_FINAL.png"; // Tu ruta de imagen

export function dibujarGranJefe(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
  
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
    
    frameWidth: 169,   
    frameHeight: 369,  
    
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
  ctx.fillStyle = isLocked ? "#4a0000" : "#d32f2f"; 
  ctx.beginPath(); 
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); 
  ctx.fill();
  ctx.strokeStyle = "#ffd700"; // Borde dorado
  ctx.lineWidth = 5; 
  ctx.stroke();
  }
  //Titulo del Gran Jefe
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ff0800"; 
  ctx.font = "bold 30px monospace";
  ctx.fillText(`👑 🔥 ${e.name} 🔥 👑`, e.x, e.y - e.radius - 32);
  
  // Barra de progreso del Gran Jefe
  ctx.fillStyle = "#111"; 
  ctx.fillRect(e.x - 75, e.y - e.radius - 20, 150, 10);
  ctx.fillStyle = "#f32408"; 
  ctx.fillRect(e.x - 75, e.y - e.radius - 20, ((e.fases.length - e.faseActual) / e.fases.length) * 150, 10);
  //Dibujar frase del Gran Jefe
 ctx.textBaseline = "middle"; 
ctx.font = `bold ${baseFontJp * 1.5}px sans-serif`;

      // 1. Configurar y dibujar el contorno (atrás)
ctx.strokeStyle = "#000000"; // Color del contorno (Negro)
ctx.lineWidth = 4;           // Grosor del contorno
ctx.lineJoin = "round";      // Suaviza los bordes y uniones de los trazos
ctx.strokeText(e.jp, e.x, e.y);

      // 2. Configurar y dibujar el relleno (adelante)
ctx.fillStyle = "#fbf8ff";   // Tu color original (Blanco hueso)
ctx.fillText(e.jp, e.x, e.y);
  
  if (sistemaLector.bossTimerAyuda >= 600) {
    ctx.textBaseline = "alphabetic"; 
    ctx.font = `bold ${baseFontR * 1.5}px monospace`;
    const romajiYBoss = e.y - e.radius - 60;

   if (isLocked) {
  // Convertimos todo a mayúsculas primero
  const romajiMayus = e.romaji.toUpperCase(); 
  
  // Cortamos sobre la versión en mayúsculas
  const typed = romajiMayus.slice(0, state.typedLen); 
  const rest = romajiMayus.slice(state.typedLen);
  
  // Medimos el ancho correcto de las mayúsculas
  const fullW = ctx.measureText(romajiMayus).width; 
  const startX = e.x - fullW / 2;
  const typedWidth = ctx.measureText(typed).width; // Guardamos el ancho para evitar repetir código
  
  ctx.textAlign = "left"; 
  ctx.fillStyle = "#aa5555"; 
  ctx.fillText(typed, startX, romajiYBoss);
  
  ctx.textAlign = "left"; // Ojo aquí: lo cambié a "left" para que el 'rest' encaje perfecto después del 'typed'
  ctx.fillStyle = "#6cffeb"; 
  ctx.fillText(rest, startX + typedWidth, romajiYBoss);
} else {
  const romajiMayus = e.romaji.toUpperCase();
  ctx.textAlign = "center"; 
  ctx.fillStyle = "#6cffeb"; 
  ctx.fillText(romajiMayus, e.x, romajiYBoss);
}
ctx.textBaseline = "middle";
}}