// ==========================================
// MÓDULO DEL PERSONAJE (NAVE FOCA ANIMADA)
// ==========================================

// 1. Precarga de las imágenes de las hojas de sprites
const spriteSaludar = new Image();
spriteSaludar.src = './personajes/Foca_Saludando.png'; // Asegúrate de que la ruta apunte a tu archivo

const spriteDisparar = new Image();
spriteDisparar.src = './personajes/Foca_Disparando2.png'; // Asegúrate de que la ruta apunte a tu archivo

// 2. Configuración de fotogramas y velocidad de la animación
const animConfig = {
  saludar: { frames: 4, velocidad: 0.12 },   // Cambia el frame cada ~8 fotogramas de juego
  disparar: { frames: 3, velocidad: 0.12 }   // Disparo un poco más rápido y dinámico
};

/**
 * Renderiza y gestiona las hojas de sprites del personaje de la foca.
 * 
 * @param {CanvasRenderingContext2D} ctx - El contexto de renderizado en 2D del Canvas.
 * @param {Object} player - El objeto del jugador alojado en el estado global.
 */
export function dibujarPersonaje(ctx, player) {
  if (!player) return;

  const fx = player.x;
  const fy = player.y + 10;
  
  // Establecemos un tamaño de renderizado proporcional al tamaño (size) del jugador
  const anchoRender = player.size * 2.2;
  const altoRender = player.size * 2.2;

  // Inicializamos el estado interno de la animación en el jugador si no existe todavía
  if (player.frameAnim === undefined) player.frameAnim = 0;
  if (player.estadoAnim === undefined) player.estadoAnim = 'saludar'; 

  let spriteActual = spriteSaludar;
  let configActual = animConfig.saludar;

  // Intercambiamos la hoja de trabajo si el estado cambia a disparo
  if (player.estadoAnim === 'disparar') {
    spriteActual = spriteDisparar;
    configActual = animConfig.disparar;
  }

  // Avanzamos el contador interno de fotogramas según la velocidad asignada
  player.frameAnim += configActual.velocidad;
  
  // Control del ciclo de animación y sus transiciones de estado
  if (player.frameAnim >= configActual.frames) {
    if (player.estadoAnim === 'disparar') {
      // Al terminar la animación de disparo, regresamos inmediatamente a saludar
      player.estadoAnim = 'saludar';
      player.frameAnim = 0;
    } else {
      // Si está saludando, simplemente reinicia el ciclo de forma infinita
      player.frameAnim = 0;
    }
  }

  // Obtenemos el índice del fotograma real (un entero limpio)
  const frameIndex = Math.floor(player.frameAnim);

  // Validamos si la imagen del sprite ya está totalmente cargada en memoria
  if (spriteActual.complete && spriteActual.width > 0) {
    // Calculamos las dimensiones del fragmento individual (asumiendo tira horizontal)
    const anchoFrameOriginal = spriteActual.width / configActual.frames;
    const altoFrameOriginal = spriteActual.height;

    ctx.drawImage(
      spriteActual,
      frameIndex * anchoFrameOriginal, 0,    // Coordenadas X e Y de origen (recorte)
      anchoFrameOriginal, altoFrameOriginal, // Ancho y alto originales del recorte
      fx - anchoRender / 2, fy - altoRender / 2, // Coordenadas del destino centradas en la foca
      anchoRender, altoRender                // Escala final dibujada en pantalla
    );
  } else {
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