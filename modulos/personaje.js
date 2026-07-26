// ==========================================
// MÓDULO DEL PERSONAJE (NAVE FOCA ANIMADA)
// ==========================================

const spriteSaludar = new Image();
spriteSaludar.src = './personajes/Foca_Saludando.png'; 

const spriteDisparar = new Image();
spriteDisparar.src = './personajes/Foca_Disparando2.png'; 

const animConfig = {
  saludar:  { frames: 4, velocidad: 0.12, anchoFrame: 1316/4, altoFrame: 472 },
  disparar: { frames: 3, velocidad: 0.12, anchoFrame: 939/3, altoFrame: 456 }, 
  backflip: { frames: 6, velocidad: 0.05, anchoFrame: 112.33, altoFrame: 110 }
};

export function dibujarPersonaje(ctx, player, dtFactor = 1) {
  if (!player) return;

  const fx = player.x;
  const fy = player.y + 10;
  
  const anchoRender = player.size * 3;
  const altoRender = player.size * 4;

  // ==========================================
  // 1. DIBUJAR EL ÁREA DE COLISIÓN (OVALO ENVOLVENTE PARA FLANCOS)
  // ==========================================
  ctx.save();
  
  const pulso = Math.sin(Date.now() / 200) * 0.04 + 1; 

  // Ampliamos significativamente el radio horizontal (radioX) para cubrir los flancos
  const radioX = player.size * 9 * pulso; 
  const radioY = player.size * 0.7 * pulso; 

  ctx.beginPath();
  
  // Dibujamos una elipse completa (de 0 a 2 * Math.PI) centrada en la posición del jugador
  // Esto genera un óvalo horizontal que abarca tanto el cuerpo central como los costados (flancos).
  ctx.ellipse(
    player.x, 
    player.y, 
    radioX, 
    radioY, 
    0,                  
    0,            
    2 * Math.PI,        
    false               
  );

  // Estilo visual de zona de peligro/colisión
  ctx.fillStyle = "rgba(241, 246, 248, 0.6)"; 
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(120, 240, 255, 0.6)";
  ctx.stroke();
  
  ctx.restore();

  // ==========================================
  // 2. GESTIÓN DE ANIMACIÓN DE SPRITES
  // ==========================================
  if (player.frameAnim === undefined) player.frameAnim = 0;
  if (player.estadoAnim === undefined) player.estadoAnim = 'saludar'; 

  let spriteActual = spriteSaludar;
  let configActual = animConfig.saludar;

  if (player.estadoAnim === 'disparar') {
    spriteActual = spriteDisparar;
    configActual = animConfig.disparar;
  }

  player.frameAnim += configActual.velocidad * dtFactor;

  if (player.frameAnim >= configActual.frames) {
    if (player.estadoAnim === 'disparar') {
      player.estadoAnim = 'saludar';
      player.frameAnim = 0;
    } else {
      player.frameAnim = 0;
    }
  }

  const frameIndex = Math.floor(player.frameAnim);

  if (spriteActual.complete && spriteActual.width > 0) {
    const anchoFrame = configActual.anchoFrame;
    const altoFrame = configActual.altoFrame;

    ctx.drawImage(
      spriteActual,
      frameIndex * anchoFrame, 0, 
      anchoFrame, altoFrame,      
      fx - anchoRender / 2, fy - altoRender / 2, 
      anchoRender, altoRender     
    );
  } else {
    // FALLBACK GEOMÉTRICO
    ctx.fillStyle = player.estadoAnim === 'disparar' ? "#4dd0e1" : "#78909c";
    ctx.beginPath();
    ctx.arc(fx, fy, player.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.arc(fx, fy - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}