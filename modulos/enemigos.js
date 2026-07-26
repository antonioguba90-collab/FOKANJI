import { sistemaLector } from "./sistemaFases.js";
import { obtenerUmbralAyuda } from "./ajustes.js";
const esMovil = window.innerWidth < 768;
const factorEscalaMovil = esMovil ? 0.7 : 1.0;
import { alturaHorizonte } from "./draw.js";
// 1. PRECARGA DE TODOS LOS PERSONAJES
let ultimaVelocidad = 150; // Velocidad inicial por defecto
let ultimoCiclo = -1;      // Nos ayuda a saber cuándo la animación dio una vuelta completa
const sprites = {
  Tiburon:   { img: new Image(), frames: 4,  src: './personajes/Tiburon1.png' },
  Delfin:   { img: new Image(), frames: 4,  src: './personajes/Delfin5.png' },
  Tiburoncito:   { img: new Image(), frames: 4,  src: './personajes/Tiburoncito.png' },
  OsoPolar:   { img: new Image(), frames: 4,  src: './personajes/OsoPolar.png' },
  PinguinoBurla:   { img: new Image(), frames: 4, src: './personajes/PinguinoBurla.png' },
  MorsaRisa:   { img: new Image(), frames: 4, src: './personajes/MorsaRisa.png' },
  Frailecillo:   { img: new Image(), frames: 4, src: './personajes/Frailecillo.png' },
  Ballena2:   { img: new Image(), frames: 4, src: './personajes/Ballena4.png' },
  PinguinoEnfadado:   { img: new Image(), frames: 4, src: './personajes/PinguinoEnfadado.png' },
  MorsaNadando:   { img: new Image(), frames: 3, src: './personajes/morsa_nadando.png' },
};

// Inicializamos las rutas de las imágenes de forma automática
Object.keys(sprites).forEach(key => {
  sprites[key].img.src = sprites[key].src;
});

export function dibujarEnemigoComun(ctx, e, isLocked, state, baseFontR) {
  // ---------------------------------------------------------------------------
  // ASIGNACIÓN ALEATORIA ÚNICA POR ENEMIGO
  // ---------------------------------------------------------------------------
  if (!e.tipoSprite) {
    const listaEnemigos = Object.keys(sprites);
    const indiceAleatorio = Math.floor(Math.random() * listaEnemigos.length);
    e.tipoSprite = listaEnemigos[indiceAleatorio];   
  }

  // Inicialización de propiedades de animación dentro del objeto enemigo
  if (e.velocidadAnimacion === undefined) {
    e.velocidadAnimacion = 550; 
    e.ultimoCiclo = -1;
  }

  // Obtenemos los datos del enemigo seleccionado
  const datosEnemigo = sprites[e.tipoSprite];
  const spriteActual = datosEnemigo.img;
  const totalFrames = datosEnemigo.frames;

  // ==========================================
  // CONFIGURACIÓN DE TAMAÑOS (PERSPECTIVA DESDE EL HORIZONTE)
  // ==========================================
  
  // Factor de profundidad adaptado al horizonte: 
  // Arriba en el horizonte (y = alturaHorizonte) la escala es mínima (0.15), abajo del todo es 1.0
  const factorProfundidad = Math.min(2.0, Math.max(0.15, (e.y - alturaHorizonte) / (state.H - alturaHorizonte) || 0.25));
  
  // Escala base ajustada para que empiece muy pequeño en el horizonte
  const escalaSprite = (0.2 + (factorProfundidad * 3.8)) * factorEscalaMovil; 
  const escalaKanji = (0.9 * factorProfundidad) * factorEscalaMovil;
  const escalaRomaji = (0.7 * factorProfundidad) * factorEscalaMovil;

  if (isLocked) {
    const esRepaso = sistemaLector.palabrasSuperadasFase.some(p => p.romaji === e.romaji);
    let colorRelleno, colorBorde;

    if (e.vecesAcertada === 1) {
      colorRelleno = "rgba(73, 17, 226, 0.2)";
      colorBorde   = "rgba(14, 17, 218, 0.6)";
    } else {
      colorRelleno = "rgba(98, 255, 59, 0.2)";
      colorBorde   = "rgba(59, 255, 118, 0.6)";
    }

    ctx.fillStyle = colorRelleno; 
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 3;

    ctx.beginPath(); 
    ctx.arc(e.x, e.y, e.radius * (escalaSprite * 0.65), 0, Math.PI * 2); 
    ctx.fill();
    ctx.stroke();

    if (state.lockedId === e.id) {
      ctx.lineWidth = 6;
      ctx.stroke();      
    }
  }

  // Control de frames de la animación
  const frameActual = Math.floor(Date.now() / e.velocidadAnimacion) % totalFrames;
  if (frameActual === 0 && e.ultimoCiclo !== 0) {
    e.velocidadAnimacion = Math.floor(Math.random() * (1000 - 550 + 1)) + 550;
  }
  e.ultimoCiclo = frameActual;

  // Dimensiones del sprite original y del recorte
  const spriteWidth = spriteActual.width / totalFrames; 
  const spriteHeight = spriteActual.height;
  const sourceX = frameActual * spriteWidth;
  const sourceY = 0;

  // Dimensiones y centrado dinámico basados en la escala de profundidad
  const destinoWidth = (e.radius * escalaSprite);
  const destinoHeight = (e.radius * escalaSprite);
  const destinoX = e.x - (destinoWidth / 2);
  const destinoY = e.y - (destinoHeight / 2);

  // Dibujar el cuadro del sprite en el Canvas
  if (spriteActual.complete && spriteActual.width > 0) { 
    ctx.drawImage(
      spriteActual,   
      sourceX, sourceY, spriteWidth, spriteHeight, 
      destinoX, destinoY, destinoWidth, destinoHeight 
    );
  } else {
    ctx.fillStyle = e.color || "#e0f7fa";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // TEXTOS DEL ENEMIGO (A LA DERECHA DEL SPRITE)
  // ==========================================
  ctx.textAlign = "left"; 
  ctx.textBaseline = "middle"; 

  const textoX = e.x + (destinoWidth / 2) + 15;
  const kanjiY = e.y + 10; 

  const fontSizeBase = Math.max(20 * factorEscalaMovil, e.radius * escalaKanji);
  const fontSize = Math.max(20 * factorEscalaMovil, fontSizeBase); 

  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.lineJoin = "round";

  const gradient = ctx.createLinearGradient(0, kanjiY - fontSize * 0.5, 0, kanjiY + fontSize * 0.5);
  gradient.addColorStop(0, "#ffffff"); 
  gradient.addColorStop(1, "#77ddff"); 

  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 15;
  ctx.lineWidth = fontSize * 0.3;
  ctx.strokeStyle = "#ffffff";
  ctx.strokeText(e.jp, textoX, kanjiY);

  ctx.shadowBlur = 0; 
  ctx.strokeStyle = "#002b5c";
  ctx.lineWidth = fontSize * 0.15;
  ctx.strokeText(e.jp, textoX, kanjiY);

  ctx.fillStyle = gradient;
  ctx.fillText(e.jp, textoX, kanjiY);

  // ========================================================
  // TEXTOS INFERIORES: Traducción (es) y Romaji
  // ========================================================
  ctx.textAlign = "center"; 
  const posInferiorX = e.x; 
  const bloqueInferiorY = e.y + (destinoHeight / 2) + 15; 

  const fontSizeSecundario = Math.max(12 * factorEscalaMovil, baseFontR * escalaRomaji * 1.5); 

  if (state.mostrarTraduccion && e.es) {
    ctx.save();
    ctx.font = `bold ${fontSizeSecundario}px sans-serif`;
    
    const textoTraduccion = `(${e.es})`;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 4;
    ctx.strokeText(textoTraduccion, posInferiorX, bloqueInferiorY);
    ctx.fillStyle = "#ffffff";         
    ctx.fillText(textoTraduccion, posInferiorX, bloqueInferiorY);
    ctx.restore();
  }

  if (e.timerAyuda >= obtenerUmbralAyuda()) {
    const offsetTraduccion = (state.mostrarTraduccion && e.es) ? (fontSizeSecundario * 1.2) : 0;
    const romajiY = bloqueInferiorY + offsetTraduccion;

    ctx.font = `bold ${fontSizeSecundario}px monospace`;
    const romajiMayus = e.romaji.toUpperCase();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";

    if (isLocked) {
      const typed = romajiMayus.slice(0, state.typedLen);
      const rest = romajiMayus.slice(state.typedLen);
      
      const totalW = ctx.measureText(romajiMayus).width;
      const startX = posInferiorX - (totalW / 2);

      ctx.textAlign = "left"; 
      ctx.fillStyle = "#ffeb3b"; 
      ctx.strokeText(typed, startX, romajiY);
      ctx.fillText(typed, startX, romajiY);

      ctx.fillStyle = "#e0e0e0";
      const typedW = ctx.measureText(typed).width;
      ctx.strokeText(rest, startX + typedW, romajiY);
      ctx.fillText(rest, startX + typedW, romajiY);
    } else {
      ctx.textAlign = "center"; 
      ctx.fillStyle = "#4dd0e1"; 
      ctx.strokeText(romajiMayus, posInferiorX, romajiY);
      ctx.fillText(romajiMayus, posInferiorX, romajiY);
    }
  }
}