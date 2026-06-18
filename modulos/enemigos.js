const spriteMuneco = new Image();
spriteMuneco.src = './personajes/munecoNieveReposo1.png'; 

const TOTAL_FRAMES = 2;

export function dibujarEnemigoComun(ctx, e, isLocked, state, baseFontR) {
  // ==========================================
  // CONFIGURACIÓN DE TAMAÑOS (¡AJUSTA AQUÍ!)
  // ==========================================
  const escalaSprite = 2.5; // Por defecto era 2. Más alto = Muñeco más grande.
  const escalaKanji = 0.8;   // Multiplicador para el tamaño de la letra japonesa.
  const escalaRomaji = 0.9;  // Multiplicador para el tamaño de la letra de ayuda.

  // 1. Efecto de fijado de objetivo (Lock-On) adaptado al tamaño visual del sprite
  if (isLocked) {
    ctx.fillStyle = "rgba(255, 235, 59, 0.2)"; 
    ctx.beginPath(); 
    // Multiplicamos por la escala del sprite para que el círculo de fijado envuelva bien al personaje
    ctx.arc(e.x, e.y, e.radius * (escalaSprite * 0.65), 0, Math.PI * 2); 
    ctx.fill();
    
    ctx.strokeStyle = "rgba(255, 235, 59, 0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 2. Control de la animación por tiempo
  const frameActual = Math.floor(Date.now() / 150) % TOTAL_FRAMES; 

  // 3. Dimensiones del sprite original
  const spriteWidth = spriteMuneco.width / TOTAL_FRAMES; 
  const spriteHeight = spriteMuneco.height;

  // 4. Posición del cuadro actual en el Sprite Sheet
  const sourceX = frameActual * spriteWidth;
  const sourceY = 0;

  // 5. Dimensiones y centrado dinámico basados en la nueva escala
  const destinoWidth = e.radius * escalaSprite;
  const destinoHeight = e.radius * escalaSprite;
  
  // Centramos usando la mitad de las nuevas dimensiones calculadas
  const destinoX = e.x - (destinoWidth / 2);
  const destinoY = e.y - (destinoHeight / 2);

  // 6. Dibujar el cuadro del sprite en el Canvas
  if (spriteMuneco.complete && spriteMuneco.width > 0) { 
    ctx.drawImage(
      spriteMuneco,   
      sourceX, sourceY, spriteWidth, spriteHeight, 
      destinoX, destinoY, destinoWidth, destinoHeight 
    );
  } else {
    // Fallback
    ctx.fillStyle = e.color || "#e0f7fa";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // TEXTOS DEL ENEMIGO (KANJI Y ROMAJI) ABAJO
  // ==========================================

  ctx.textAlign = "center";
  ctx.textBaseline = "top"; 

  // 1. Posición del Kanji: Centro + la mitad del alto visual del muñeco + un margen de 12px
  const kanjiY = e.y + (destinoHeight / 2) + 12; 

  // Dibujar Kanji/Kana con su nueva escala
  ctx.fillStyle = "#ffffff"; 
  ctx.font = `bold ${e.radius * escalaKanji}px sans-serif`;
  ctx.fillText(e.jp, e.x, kanjiY); 

  // 2. Texto de ayuda Romaji
  if (e.timerAyuda >= 600) {
    // Se calcula automáticamente tomando la posición del Kanji + el alto del Kanji + un extra
    const romajiY = kanjiY + (e.radius * escalaKanji) + 8; 

    ctx.font = `bold ${baseFontR * escalaRomaji}px monospace`;

    if (isLocked) {
      const r = e.romaji; 
      const typed = r.slice(0, state.typedLen); 
      const rest = r.slice(state.typedLen);
      const fullW = ctx.measureText(r).width; 
      const startX = e.x - fullW / 2;
      
      ctx.textAlign = "left"; 
      ctx.fillStyle = "#888"; 
      ctx.fillText(typed, startX, romajiY);
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(rest, startX + ctx.measureText(typed).width, romajiY);
      ctx.textAlign = "center"; 
    } else {
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(e.romaji, e.x, romajiY);
    }
  }
}
