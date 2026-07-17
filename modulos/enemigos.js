import { sistemaLector } from "./sistemaFases.js";
// 1. PRECARGA DE TODOS LOS PERSONAJES
let ultimaVelocidad = 150; // Velocidad inicial por defecto
let ultimoCiclo = -1;      // Nos ayuda a saber cuándo la animación dio una vuelta completa
const sprites = {
  //muneco: { img: new Image(), frames: 2, src: './personajes/munecoNieveReposo1.png' },
  //golem:  { img: new Image(), frames: 4, src: './personajes/Golem_Granizo1.png' },
  //craken:   { img: new Image(), frames: 4, src: './personajes/Craken1.png' },
 // Munecoartico:   { img: new Image(), frames: 5, src: './personajes/munecoArtico_1.png' },
 // CrakenArticoFuego:   { img: new Image(), frames: 5, src: './personajes/crakenArticoFuego1.png' },
 // golemArtico_2:   { img: new Image(), frames: 6, src: './personajes/golemArtico.png' },
 // golemArtico_1:   { img: new Image(), frames: 5, src: './personajes/golemArtico_1.png' },
  OsoPolar:   { img: new Image(), frames: 4, src: './personajes/OsoPolar.png' },
  PinguinoBurla:   { img: new Image(), frames: 4, src: './personajes/PinguinoBurla.png' },
  MorsaRisa:   { img: new Image(), frames: 4, src: './personajes/MorsaRisa.png' },
  Frailecillo:   { img: new Image(), frames: 4, src: './personajes/Frailecillo.png' },
  Ballena2:   { img: new Image(), frames: 4, src: './personajes/Ballena2.png' },
  PinguinoEnfadado:   { img: new Image(), frames: 4, src: './personajes/PinguinoEnfadado.png' },

};

// Inicializamos las rutas de las imágenes de forma automática
Object.keys(sprites).forEach(key => {
  sprites[key].img.src = sprites[key].src;
});

export function dibujarEnemigoComun(ctx, e, isLocked, state, baseFontR) {
 // ---------------------------------------------------------------------------
  // ASIGNACIÓN ALEATORIA ÚNICA POR ENEMIGO (Soporta N cantidad de enemigos)
  // ---------------------------------------------------------------------------
  if (!e.tipoSprite) {
    const listaEnemigos = Object.keys(sprites); // ['muneco', 'golem', 'mago']
    const indiceAleatorio = Math.floor(Math.random() * listaEnemigos.length);
    e.tipoSprite = listaEnemigos[indiceAleatorio];   
  }
// Inicialización de propiedades de animación dentro del objeto enemigo (si no existen)
  if (e.velocidadAnimacion === undefined) {
    e.velocidadAnimacion = 550; 
    e.ultimoCiclo = -1;
  }
  // Obtenemos los datos del enemigo seleccionado
  const datosEnemigo = sprites[e.tipoSprite];
  const spriteActual = datosEnemigo.img;
  const totalFrames = datosEnemigo.frames;

  // ==========================================
  // CONFIGURACIÓN DE TAMAÑOS (¡AJUSTA AQUÍ!)
  // ==========================================
  const escalaSprite = 2.5; 
  const escalaKanji = 0.8;   
  const escalaRomaji = 0.9;  
  

if (isLocked) {
    // 🌟 REGLA DIRECTA: ¿La palabra actual está en el pool de repaso acumulado?
    const esRepaso = sistemaLector.palabrasSuperadasFase.some(p => p.romaji === e.romaji);
// 1. Definimos los colores estrictamente basados en el estado del enemigo (1ª o 2ª aparición)
let colorRelleno, colorBorde;

if (e.vecesAcertada === 1) {
    // Colores para la segunda aparición (la "última vida")
    colorRelleno = "rgba(73, 17, 226, 0.2)";
    colorBorde   = "rgba(14, 17, 218, 0.6)";
} else {
    // Colores para la primera aparición
    colorRelleno = "rgba(98, 255, 59, 0.2)";
    colorBorde   = "rgba(59, 255, 118, 0.6)";
}

// 2. Dibujado básico usando los colores definidos arriba
ctx.fillStyle = colorRelleno; 
ctx.strokeStyle = colorBorde;
ctx.lineWidth = 3;

ctx.beginPath(); 
ctx.arc(e.x, e.y, e.radius * (escalaSprite * 0.65), 0, Math.PI * 2); 
ctx.fill();
ctx.stroke();

// 3. (Opcional) Si quieres añadir un efecto visual extra sin cambiar el color de base
// (como un borde más grueso o un resplandor) cuando esté en state.lockedId,
// puedes hacerlo aquí abajo sin tocar las variables de color:
if (state.lockedId === e.id) {
    ctx.lineWidth = 6; // Borde más grueso para resaltar que está seleccionado
    ctx.stroke();      // Volvemos a trazar el borde con más grosor
}}
// B. ¿Volvió a empezar la animación? 
// Si el frame actual es 0 y el último ciclo registrado era diferente, significa que comenzó una nueva vuelta.
const frameActual = Math.floor(Date.now() / e.velocidadAnimacion) % totalFrames;

  if (frameActual === 0 && e.ultimoCiclo !== 0) {
    // Generamos velocidad aleatoria solo para este enemigo
    e.velocidadAnimacion = Math.floor(Math.random() * (1000 - 550 + 1)) + 550;
  }
  e.ultimoCiclo = frameActual;


  // 3. Dimensiones del sprite original basadas en sus propios frames totales
  const spriteWidth = spriteActual.width / totalFrames; 
  const spriteHeight = spriteActual.height;

  // 4. Posición del cuadro actual en el Sprite Sheet
  const sourceX = frameActual * spriteWidth;
  const sourceY = 0;

  // 5. Dimensiones y centrado dinámico basados en la nueva escala
  const destinoWidth = e.radius * escalaSprite;
  const destinoHeight = e.radius * escalaSprite;
  
  const destinoX = e.x - (destinoWidth / 2);
  const destinoY = e.y - (destinoHeight / 2);

  // 6. Dibujar el cuadro del sprite en el Canvas
  if (spriteActual.complete && spriteActual.width > 0) { 
    ctx.drawImage(
      spriteActual,   
      sourceX, sourceY, spriteWidth, spriteHeight, 
      destinoX, destinoY, destinoWidth, destinoHeight 
    );
  } else {
    // Fallback por si la imagen aún no se ha cargado
    ctx.fillStyle = e.color || "#e0f7fa";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
 // TEXTOS DEL ENEMIGO (KANJI AL CENTRO Y POR DELANTE)
  // ========================================================

  ctx.textAlign = "center";
  ctx.textBaseline = "middle"; 

  // 1. Posición del Kanji: Centro geométrico del sprite (e.y)
  const kanjiY = e.y+ (destinoHeight / 4); 

  // Dibujar Kanji/Kana con su nueva escala y contorno
  ctx.font = `bold ${e.radius * escalaKanji}px sans-serif`;

  // 1. Contorno negro con un 80% de opacidad (rgba con alfa en 0.8)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";       
  ctx.lineWidth = 6;                 
  ctx.lineJoin = "round";            
  ctx.strokeText(e.jp, e.x, kanjiY);

  // 2. Relleno blanco con un 80% de opacidad (rgba con alfa en 0.8)
  ctx.fillStyle = "rgba(255, 255, 255, 1)";         
  ctx.fillText(e.jp, e.x, kanjiY);
  // --- TRADUCCIÓN Y ROMAJI (Re-ubicados abajo del todo para no solaparse con el centro) ---
  ctx.textBaseline = "top"; // Restauramos para los textos inferiores

  // La base de los textos inferiores se calculará desde la parte baja del sprite
  const textoBaseY = e.y + (destinoHeight / 2) + 10; 

  if (state.mostrarTraduccion && e.es) {
    ctx.save();
    ctx.font = "bold 14px sans-serif"; 
    ctx.fillStyle = "#0c2905";         
    ctx.textAlign = "center";
    
    ctx.fillText(`(${e.es})`, e.x, textoBaseY); 
    ctx.restore();
  }

  // 2. Texto de ayuda Romaji
  if (e.timerAyuda >= 600) {
    const offsetTraduccion = (state.mostrarTraduccion && e.es) ? 25 : 0;
    const romajiY = textoBaseY + offsetTraduccion; 

    ctx.font = `bold ${baseFontR * escalaRomaji}px monospace`;

    // Convertimos la cadena base a mayúsculas para evitar conflictos visuales
    const romajiMayus = e.romaji.toUpperCase();

    if (isLocked) {
      // Cortamos el texto usando la cadena ya convertida en mayúsculas
      const typed = romajiMayus.slice(0, state.typedLen); 
      const rest = romajiMayus.slice(state.typedLen);
      const fullW = ctx.measureText(romajiMayus).width; 
      const startX = e.x - fullW / 2;
      
      ctx.textAlign = "left"; 
      ctx.fillStyle = "#1a3a4a"; 
      ctx.fillText(typed, startX, romajiY);
      ctx.fillStyle = "#005a8d"; 
      ctx.fillText(rest, startX + ctx.measureText(typed).width, romajiY);
      ctx.textAlign = "center"; 
    } else {
      ctx.fillStyle = "#005a8d"; 
      ctx.fillText(romajiMayus, e.x, romajiY);
    }
  }
}