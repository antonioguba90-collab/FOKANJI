import { sistemaLector } from "./sistemaFases.js";
import { obtenerUmbralAyuda } from "./ajustes.js";
const esMovil = window.innerWidth < 768;
const factorEscalaMovil = esMovil ? 0.7 : 1.0;
import { alturaHorizonte } from "./draw.js";
// 1. PRECARGA DE TODOS LOS PERSONAJES
let ultimaVelocidad = 150; // Velocidad inicial por defecto
let ultimoCiclo = -1;      // Nos ayuda a saber cuándo la animación dio una vuelta completa
const sprites = {
  Tiburon:   { img: new Image(), frames: 4,  src: './personajes/tiburon4.png' },
  Gloton:   { img: new Image(), frames: 5,  src: './personajes/gloton7.png' },
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
  // CONFIGURACIÓN DE TAMAÑOS Y ONDULACIÓN DE LAS OLAS
  // ==========================================
  
  // Factor de profundidad adaptado al horizonte: 
  const factorProfundidad = Math.min(2.0, Math.max(0.15, (e.y - alturaHorizonte) / (state.H - alturaHorizonte) || 0.25));
  
  // Escala base ajustada para que empiece muy pequeño en el horizonte
  const escalaSprite = (0.2 + (factorProfundidad * 3.8)) * factorEscalaMovil; 
  const escalaKanji = (0.9 * factorProfundidad) * factorEscalaMovil;
  const escalaRomaji = (0.7 * factorProfundidad) * factorEscalaMovil;

  // --- CÁLCULO DE LA ONDULACIÓN DEL OCÉANO (USANDO TIEMPO REAL) ---
  const oceanoH = state.H - alturaHorizonte;
  const numTiras = 16;
  const altoTiraCanvas = oceanoH / numTiras;
  
  let indiceTira = Math.floor((e.y - alturaHorizonte) / altoTiraCanvas);
  indiceTira = Math.max(0, Math.min(numTiras - 1, indiceTira));

// Usamos el mismo patrón de tiempo y fórmula exacta que el océano
  // (Asumiendo que 'time' viene en el state o podemos calcular el equivalente exacto)
  const tiempoRelativo = Date.now() / 1000; // O la variable de tiempo global que use tu bucle principal
  const desfaseOndulacion = Math.sin(tiempoRelativo * 3 + indiceTira * 0.5) * (1.5 + indiceTira * 0.2);
  
  // Como la tira del océano ya se desplaza con esta medida, aplicamos lo mismo al enemigo
  const ondaX = desfaseOndulacion - 4;
  const ondaY = desfaseOndulacion * 0.3; // Un pequeño balanceo vertical muy sutil

  // POSICIÓN REAL CON LA OLA APLICADA PARA TODO EL RENDERIZADO
  const posicionRealX = e.x + ondaX;
  const posicionRealY = e.y + ondaY;

  if (isLocked) {
    const esRepaso = sistemaLector.palabrasSuperadasFase.some(p => p.romaji === e.romaji);
    let colorRelleno, colorBorde;

    if (e.vecesAcertada === 0) {
      colorRelleno = "rgba(98, 255, 59, 0.2)"; // Verde suave
      colorBorde   = "rgba(59, 255, 118, 0.6)";
      } else if (e.vecesAcertada === 1) {
      colorRelleno = "rgba(255, 152, 0, 0.2)"; // Naranja suave
      colorBorde   = "rgba(255, 140, 0, 0.6)";
    } else {
      colorRelleno = "rgba(73, 17, 226, 0.2)"; // Azul / Violeta suave
      colorBorde   = "rgba(14, 17, 218, 0.6)";
    }

    ctx.fillStyle = colorRelleno; 
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 3;

    ctx.beginPath(); 
    ctx.arc(posicionRealX, posicionRealY, e.radius * (escalaSprite * 0.65), 0, Math.PI * 2); 
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

  // Dimensiones y centrado dinámico basados en la posición real con onda
  const destinoWidth = (e.radius * escalaSprite);
  const destinoHeight = (e.radius * escalaSprite);
  const destinoX = posicionRealX - (destinoWidth / 2);
  const destinoY = posicionRealY - (destinoHeight / 2);

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
    ctx.arc(posicionRealX, posicionRealY, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // TEXTOS DEL ENEMIGO (A LA DERECHA DEL SPRITE)
  // ==========================================
  ctx.textAlign = "left"; 
  ctx.textBaseline = "middle"; 

  const textoX = posicionRealX + (destinoWidth / 2) + 15;
  const kanjiY = posicionRealY + 10; 

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
// ========================================================
// TEXTOS SECUNDARIOS: Romaji (encima del Kanji) y Traducción (abajo)
  // ========================================================
  const fontSizeSecundario = Math.max(10 * factorEscalaMovil, baseFontR * escalaRomaji * 1.2); 
  const lineHeight = fontSizeSecundario * 1.2;
  const maxAnchoTexto = Math.max(destinoWidth * 1.2, 120); 

  // Función para limitar estrictamente a un máximo de 2 líneas
  const obtenerDosLineasTexto = (texto) => {
    const palabras = texto.split(' ');
    let lineas = [];
    let lineaActual = '';
    
    for (let i = 0; i < palabras.length; i++) {
      let prueba = lineaActual ? lineaActual + ' ' + palabras[i] : palabras[i];
      if (ctx.measureText(prueba).width > maxAnchoTexto && lineaActual) {
        lineas.push(lineaActual);
        lineaActual = palabras[i];
      } else {
        lineaActual = prueba;
      }
    }
    if (lineaActual) lineas.push(lineaActual);

    if (lineas.length > 2) {
      let primera = lineas[0];
      let segunda = lineas.slice(1).join(' ');
      while (ctx.measureText(segunda + '...').width > maxAnchoTexto && segunda.length > 0) {
        segunda = segunda.slice(0, -1);
      }
      return [primera, segunda + '...'];
    }

    return lineas;
  };

  // 1. ROMAJI DE AYUDA (Colocado justo ENCIMA del Kanji situado a la derecha)
  if (e.timerAyuda >= obtenerUmbralAyuda()) {
    ctx.font = `bold ${fontSizeSecundario}px monospace`;
    const romajiMayus = e.romaji.toUpperCase();
    const lineasRomaji = obtenerDosLineasTexto(romajiMayus);
    
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";

    // Calculamos la posición X alineada con el kanji y la Y justo encima de él
    const romajiX = textoX; 
    let currentRomajiY = kanjiY - fontSize - 6; // Justo arriba del kanji

    if (isLocked) {
      let globalCharCount = 0;

      lineasRomaji.forEach((linea) => {
        // Si quieres que el romaji de arriba esté centrado respecto al kanji o alineado a la izquierda como él:
        // Usamos romajiX como base de inicio
        let currentX = romajiX;

        for (let i = 0; i < linea.length; i++) {
          const char = linea[i];
          const charWidth = ctx.measureText(char).width;

          const isTypedChar = globalCharCount < state.typedLen;
          globalCharCount++;

          ctx.textAlign = "left";
          ctx.strokeText(char, currentX, currentRomajiY);
          ctx.fillStyle = isTypedChar ? "#ffeb3b" : "#e0e0e0"; 
          ctx.fillText(char, currentX, currentRomajiY);

          currentX += charWidth;
        }
        currentRomajiY += lineHeight; 
      });
    } else {
      ctx.textAlign = "left"; // Alineado con el bloque del kanji
      lineasRomaji.forEach((linea) => {
        ctx.strokeText(linea, romajiX, currentRomajiY);
        ctx.fillStyle = "#4dd0e1";
        ctx.fillText(linea, romajiX, currentRomajiY);
        currentRomajiY += lineHeight;
      });
    }
  }

  // 2. TRADUCCIÓN EN ESPAÑOL (Ubicada abajo del todo, respetando el tamaño del sprite)
  if (state.mostrarTraduccion && e.es) {
    ctx.save();
    ctx.font = `bold ${fontSizeSecundario}px sans-serif`;
    
    const textoTraduccion = `(${e.es})`;
    const lineasTrad = obtenerDosLineasTexto(textoTraduccion);
    
    // Posición inferior centrada respecto al sprite (o puedes usar textoX si prefieres que vaya abajo del kanji)
    const posInferiorX = e.x; 
    let tradY = e.y + (destinoHeight / 2) + 12;

    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 3.5;
    ctx.fillStyle = "#ffffff";        

    lineasTrad.forEach((linea) => {
      ctx.textAlign = "center";
      ctx.strokeText(linea, posInferiorX, tradY);
      ctx.fillText(linea, posInferiorX, tradY);
      tradY += lineHeight;
    });

    ctx.restore();
  }
}
