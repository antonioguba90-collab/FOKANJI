//import { state } from "./config.js";
// ==========================================
// MÓDULO DEL PERSONAJE (NAVE FOCA ANIMADA)
// ==========================================

// 1. Precarga de las imágenes de las hojas de sprites
const spriteSaludar = new Image();
spriteSaludar.src = './personajes/Foca_Saludando.png'; // Asegúrate de que la ruta apunte a tu archivo

const spriteDisparar = new Image();
spriteDisparar.src = './personajes/Foca_Disparando2.png'; // Asegúrate de que la ruta apunte a tu archivo

//const spritebackflip = new Image();
//spritebackflip.src = './personajes/Foca_backflip.png';
// 2. Configuración de fotogramas y velocidad de la animación
const animConfig = {
  saludar:  { frames: 4, velocidad: 0.12, anchoFrame: 116.25, altoFrame: 110 },
  disparar: { frames: 3, velocidad: 0.12, anchoFrame: 116.25, altoFrame: 126 }, // Asegúrate de poner estos valores
  backflip: { frames: 6, velocidad: 0.05, anchoFrame: 112.33, altoFrame: 110 }
};
export function dibujarPersonaje(ctx, player) {
  if (!player) return;

  const fx = player.x;
  const fy = player.y + 10;
  
  const anchoRender = player.size * 3;
  const altoRender = player.size * 3;

  if (player.frameAnim === undefined) player.frameAnim = 0;
  if (player.estadoAnim === undefined) player.estadoAnim = 'saludar'; 

  let spriteActual = spriteSaludar;
  let configActual = animConfig.saludar;

  if (player.estadoAnim === 'disparar') {
    spriteActual = spriteDisparar;
    configActual = animConfig.disparar;
  }

  player.frameAnim += configActual.velocidad;
  
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
    // --- AQUÍ ESTÁ EL CAMBIO ---
    // Usamos las propiedades definidas en configActual
    const anchoFrame = configActual.anchoFrame;
    const altoFrame = configActual.altoFrame;

    ctx.drawImage(
      spriteActual,
      frameIndex * anchoFrame, 0, // Recorte X usando el ancho definido
      anchoFrame, altoFrame,      // Dimensiones del recorte
      fx - anchoRender / 2, fy - altoRender / 2, 
      anchoRender, altoRender     
    );
  } else {
    // Fallback geométrico (mantenlo como está)
    // 
      // FALLBACK GEOMÉTRICO: Si hay lentitud en la red o falla el archivo, no rompe el juego
    ctx.fillStyle = player.estadoAnim === 'disparar' ? "#4dd0e1" : "#78909c";
    ctx.beginPath();
    ctx.arc(fx, fy, player.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Pequeña referencia visual para el hocico en el fallback
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.arc(fx, fy - 10, 5, 0, Math.PI * 2);
    ctx.fill();
  }
// Dentro de dibujarPersonaje en personaje.js, abajo de donde sumas la velocidad:
if (player.estadoAnim === 'disparar') {
  console.log("¡La foca está en estado DISPARAR!, Frame actual:", Math.floor(player.frameAnim));
}}