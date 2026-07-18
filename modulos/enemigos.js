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
 // TEXTOS DEL ENEMIGO: KANJI CON DEGRADADO Y RESPLANDOR
// ========================================================
ctx.textAlign = "left"; 
ctx.textBaseline = "middle"; 

const textoX = e.x + (destinoWidth / 2) + 15;
const kanjiY = e.y;

const fontSize = Math.max(30, e.radius * escalaKanji);
ctx.font = `bold ${fontSize}px sans-serif`;
ctx.lineJoin = "round";

// 1. Degradado para el interior del texto
const gradient = ctx.createLinearGradient(0, kanjiY - fontSize * 0.5, 0, kanjiY + fontSize * 0.5);
gradient.addColorStop(0, "#ffffff"); 
gradient.addColorStop(1, "#77ddff"); 

// 2. CAPA: Resplandor blanco (se dibuja primero para quedar detrás)
ctx.shadowColor = "#ffffff";
ctx.shadowBlur = 15; // Intensidad del brillo
ctx.lineWidth = fontSize * 0.3;
ctx.strokeStyle = "#ffffff";
ctx.strokeText(e.jp, textoX, kanjiY);

// 3. CAPA: Contorno oscuro (para contraste)
ctx.shadowBlur = 0; // Apagamos el resplandor para el borde
ctx.strokeStyle = "#002b5c";
ctx.lineWidth = fontSize * 0.15;
ctx.strokeText(e.jp, textoX, kanjiY);

// 4. CAPA: Relleno con degradado
ctx.fillStyle = gradient;
ctx.fillText(e.jp, textoX, kanjiY);
// Restaurar configuración para los textos siguientes
ctx.shadowBlur = 0;
ctx.textBaseline = "top";
  // La base de los textos inferiores se calculará desde la parte baja del sprite
  const textoBaseY = e.y + (destinoHeight / 2) + 10; 

  if (state.mostrarTraduccion && e.es) {
    ctx.save();
    ctx.font = "bold 16px sans-serif"; // Ligeramente más grande
    ctx.textAlign = "center";
    
    // Contorno para legibilidad
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 4;
    ctx.strokeText(`(${e.es})`, e.x, textoBaseY);
    
    // Relleno blanco brillante
    ctx.fillStyle = "#ffffff";         
    ctx.fillText(`(${e.es})`, e.x, textoBaseY); 
    ctx.restore();
  }

if (e.timerAyuda >= 600) {
    const offsetTraduccion = (state.mostrarTraduccion && e.es) ? 25 : 0;
    const romajiY = textoBaseY + offsetTraduccion;

    ctx.font = `bold ${baseFontR * escalaRomaji}px monospace`;
    const romajiMayus = e.romaji.toUpperCase();
    
    // Configuramos el contorno para que el romaji también destaque
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.textAlign = "center"; // Alineación base

    if (isLocked) {
        // ... (mantenemos tu lógica de colores para las teclas pulsadas)
        const typed = romajiMayus.slice(0, state.typedLen);
        const rest = romajiMayus.slice(state.typedLen);
        const fullW = ctx.measureText(romajiMayus).width;
        const startX = e.x - fullW / 2;

        ctx.textAlign = "left";
        
        // Color de lo ya escrito (Amarillo neón para destacar)
        ctx.fillStyle = "#ffeb3b"; 
        ctx.strokeText(typed, startX, romajiY);
        ctx.fillText(typed, startX, romajiY);

        // Color de lo que falta (Blanco tenue)
        ctx.fillStyle = "#e0e0e0";
        ctx.strokeText(rest, startX + ctx.measureText(typed).width, romajiY);
        ctx.fillText(rest, startX + ctx.measureText(typed).width, romajiY);
    } else {
        // Color por defecto cuando no está lockeado (Cian arcade)
        ctx.fillStyle = "#4dd0e1"; 
        ctx.strokeText(romajiMayus, e.x, romajiY);
        ctx.fillText(romajiMayus, e.x, romajiY);
    }
}
}