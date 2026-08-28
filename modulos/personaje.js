import { state } from './config.js';
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
import { alturaHorizonte } from "./draw.js"; // Asegúrate de importar esto si no lo tenías ya

export function dibujarPersonaje(ctx, player, dtFactor = 1, state = {}) {
  if (!player) return;

  // --- CÁLCULO DE LA ONDULACIÓN DEL OCÉANO PARA LA FOCA ---
  // Si state.H o state no están disponibles por parámetro, usamos window.innerHeight como recurso de seguridad
  const alturaH = state.H || window.innerHeight;
  const oceanoH = alturaH - alturaHorizonte;
  const numTiras = 16;
  const altoTiraCanvas = oceanoH / numTiras;
  
  let indiceTira = Math.floor((player.y - alturaHorizonte) / altoTiraCanvas);
  indiceTira = Math.max(0, Math.min(numTiras - 1, indiceTira));

  const tiempoRelativo = Date.now() / 1000;
  const desfaseOndulacion = Math.sin(tiempoRelativo * 3 + indiceTira * 0.5) * (1.5 + indiceTira * 0.2);
  
  const ondaX = desfaseOndulacion - 4;
  const ondaY = desfaseOndulacion * 0.3;

  // Posiciones reales con la ola aplicada
  const renderX = player.x + ondaX;
  const renderY = player.y + ondaY;

  const fx = renderX;
  const fy = renderY + 10;
  
  const anchoRender = player.size * 3;
  const altoRender = player.size * 4;

  // ==========================================
  // 1. DIBUJAR EL ÁREA DE COLISIÓN (OVALO ENVOLVENTE)
  // ==========================================
  ctx.save();
  
  const pulso = Math.sin(Date.now() / 200) * 0.04 + 1; 

  const radioX = Math.min(player.size * 9 * pulso, renderX, (state.W || window.innerWidth) - renderX); 
  const radioY = player.size * 0.7 * pulso;

  ctx.beginPath();
  
  ctx.ellipse(
    renderX, 
    renderY, 
    radioX, 
    radioY, 
    0,                     
    0,             
    2 * Math.PI,        
    false              
  );

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
