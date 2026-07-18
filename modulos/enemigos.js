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
  Tiburon:   { img: new Image(), frames: 4,  src: './personajes/Tiburon1.png' },
  Delfin:   { img: new Image(), frames: 4,  src: './personajes/Delfin5.png' },
  Tiburoncito:   { img: new Image(), frames: 4,  src: './personajes/Tiburoncito.png' },
  OsoPolar:   { img: new Image(), frames: 4,  src: './personajes/OsoPolar.png' },
  PinguinoBurla:   { img: new Image(), frames: 4, src: './personajes/PinguinoBurla.png' },
  MorsaRisa:   { img: new Image(), frames: 4, src: './personajes/MorsaRisa.png' },
  Frailecillo:   { img: new Image(), frames: 4, src: './personajes/Frailecillo.png' },
  Ballena2:   { img: new Image(), frames: 4, src: './personajes/Ballena4.png' },
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
  // CONFIGURACIÓN DE TAMAÑOS (PERSPECTIVA DINÁMICA)
  // ==========================================
  // Factor de profundidad: 0.2 (arriba/lejos) a 1.0 (abajo/cerca)
  const factorProfundidad = Math.min(2, Math.max(0.2, e.y / state.H));
  
  // Escala base multiplicada por el factor de profundidad
  const escalaSprite = 1.0 + (factorProfundidad * 2.5); // Escala de 0.5 a 2.5
  const escalaKanji = 0.9 * factorProfundidad;          // El texto también escala
  const escalaRomaji = 0.7 * factorProfundidad;         // El texto también escala 
  

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
/// TEXTOS DEL ENEMIGO (A LA DERECHA DEL SPRITE)
// ========================================================
ctx.textAlign = "left"; // Ahora alineamos a la izquierda desde el punto de origen
ctx.textBaseline = "middle"; 

// Calculamos la posición X: margen derecho del sprite + 15px de separación
const textoX = e.x + (destinoWidth / 2) + 15;
const kanjiY = e.y + 10; // Centrado verticalmente con el sprite

// 1. Tamaño mínimo garantizado
const fontSizeBase = e.radius * escalaKanji;
const fontSize = Math.max(30, fontSizeBase); 

ctx.font = `bold ${fontSize}px sans-serif`;
ctx.lineJoin = "round";

// 2. Degradado brillante
const gradient = ctx.createLinearGradient(0, kanjiY - fontSize * 0.5, 0, kanjiY + fontSize * 0.5);
gradient.addColorStop(0, "#ffffff"); 
gradient.addColorStop(1, "#77ddff"); 

// 3. CAPA DE CONTORNO (Alineado a la izquierda)
ctx.shadowBlur = 0; 
ctx.strokeStyle = "#002b5c";
ctx.lineWidth = fontSize * 0.35;
ctx.strokeText(e.jp, textoX, kanjiY);

// 4. CAPA DE RELLENO
ctx.fillStyle = gradient;
ctx.fillText(e.jp, textoX, kanjiY);

// ========================================================
// TEXTOS INFERIORES: Traducción (es) y Romaji (CENTRADOS BAJO EL SPRITE)
// ========================================================
ctx.textAlign = "center"; // Centramos respecto a la posición X del enemigo
const posInferiorX = e.x; // Punto de anclaje centrado en el sprite
const bloqueInferiorY = e.y + (destinoHeight / 2) + 15; // Debajo del sprite

const fontSizeSecundario = Math.max(16, baseFontR * escalaRomaji * 1.5); 

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

if (e.timerAyuda >= 600) {
    const offsetTraduccion = (state.mostrarTraduccion && e.es) ? (fontSizeSecundario * 1.2) : 0;
    const romajiY = bloqueInferiorY + offsetTraduccion;

    ctx.font = `bold ${fontSizeSecundario}px monospace`;
    const romajiMayus = e.romaji.toUpperCase();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";

    if (isLocked) {
        const typed = romajiMayus.slice(0, state.typedLen);
        const rest = romajiMayus.slice(state.typedLen);
        
        // Centramos el bloque completo de romaji calculando su ancho total
        const totalW = ctx.measureText(romajiMayus).width;
        const startX = posInferiorX - (totalW / 2);

        ctx.textAlign = "left"; // Usamos left para la escritura progresiva con startX
        ctx.fillStyle = "#ffeb3b"; 
        ctx.strokeText(typed, startX, romajiY);
        ctx.fillText(typed, startX, romajiY);

        ctx.fillStyle = "#e0e0e0";
        const typedW = ctx.measureText(typed).width;
        ctx.strokeText(rest, startX + typedW, romajiY);
        ctx.fillText(rest, startX + typedW, romajiY);
    } else {
        ctx.textAlign = "center"; // Centrado cuando no está bloqueado
        ctx.fillStyle = "#4dd0e1"; 
        ctx.strokeText(romajiMayus, posInferiorX, romajiY);
        ctx.fillText(romajiMayus, posInferiorX, romajiY);
    }
}
}