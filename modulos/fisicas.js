// MÓDULO DE FÍSICAS, MOVIMIENTO Y COLISIONES
// ========================================================
import { alturaHorizonte } from "./draw.js";
/**
 * Gestiona el movimiento de los enemigos, las repulsiones entre ellos
 * y comprueba si alguno ha colisionado con la nave foca del jugador.
 * dtFactor: 1.0 a 60fps; escala el movimiento para igualar la velocidad
 * en cualquier tasa de refresco (120/144 Hz...).
 */
export function actualizarFisicasYColisiones(state, endGame, dtFactor = 1) {
  const minions = state.enemies.filter(e => !e.isBoss);

// 1. Repulsión vertical asimétrica (el de abajo repele al de arriba hacia arriba)
  for (let i = 0; i < minions.length; i++) {
    for (let j = i + 1; j < minions.length; j++) {
      let e1 = minions[i]; 
      let e2 = minions[j];
      
      if (e1.y < 0 || e2.y < 0) continue;
      
      // Asegurarnos de identificar quién está realmente más arriba y quién más abajo
      if (e1.y > e2.y) {
        const temp = e1;
        e1 = e2; // e1 pasa a ser el de arriba
        e2 = temp; // e2 pasa a ser el de abajo
      }
      
      const dx = e2.x - e1.x; 
      const dy = e2.y - e1.y; // Siempre será positivo o cero porque e2 está más abajo
      const distancia = Math.hypot(dx, dy) || 1;

      // Calcular el espacio necesario para el sprite y todos los textos (Kanji, traducción, ayuda)
      const factorProfundidad1 = Math.min(2.0, Math.max(0.15, (e1.y - alturaHorizonte) / (state.H - alturaHorizonte) || 0.25));
      const factorProfundidad2 = Math.min(2.0, Math.max(0.15, (e2.y - alturaHorizonte) / (state.H - alturaHorizonte) || 0.25));
      
      const altoEfectivo1 = (e1.radius * factorProfundidad1) + 45; 
      const altoEfectivo2 = (e2.radius * factorProfundidad2) + 45;
      const distanciaMinimaVertical = altoEfectivo1 + altoEfectivo2;
      
      // Comprobamos si están demasiado cerca en su área general (afectando a ambos carriles si se aproximan)
      if (distancia < distanciaMinimaVertical) {
        const solapamiento = distanciaMinimaVertical - distancia;
        
        // REPELIR EXCLUSIVAMENTE HACIA ARRIBA: 
        // Solo el enemigo de arriba retrocede subiendo, el de abajo no baja (evita acercarlo al jugador)
        e1.y -= solapamiento; 
        
        // RESTRICCIÓN: El enemigo que sube nunca puede rebasar la línea del horizonte
        e1.y = Math.max(alturaHorizonte + 15, e1.y);
      }
    }
  }

// 2. Movimiento en línea recta hacia los puntos laterales del jugador
  for (const e of state.enemies) {
    if (e.isBoss) {
      if (e.y < e.targetY) e.y += 1.5 * dtFactor;
    } else {
      // Calculamos la distancia total en X e Y desde el origen hasta el objetivo final
      const deltaX = e.targetX - e.x0;
      const deltaY = e.targetY - alturaHorizonte;
      const distanciaTotal = Math.hypot(deltaX, deltaY) || 1;

      // La proporción de avance basada en su velocidad uniforme
      // Esto hace que se muevan en línea recta geométrica perfecta
      const vx = (deltaX / distanciaTotal) * e.speed;
      const vy = (deltaY / distanciaTotal) * e.speed;

      e.x += vx * dtFactor;
      e.y += vy * dtFactor;
    }

 // En tu bucle de colisiones de fisicas.js:
const deltaXPlayer = Math.abs(state.player.x - e.x);
const deltaYPlayer = state.player.y - e.y;

// Calculamos el radio de colisión horizontal idéntico al que se dibuja
const radioColisionX = Math.min(state.player.size * 9, state.player.x, state.W - state.player.x);
const radioColisionY = state.player.size * 0.7; //[cite: 3]

// Ecuación de la elipse ampliada y acotada a la pantalla[cite: 3]
const colisionOvalo = (Math.pow(deltaXPlayer, 2) / Math.pow(radioColisionX, 2)) + 
                      (Math.pow(deltaYPlayer, 2) / Math.pow(radioColisionY, 2)) <= 1; //[cite: 3]

const distanciaAlJugador = Math.hypot(state.player.x - e.x, state.player.y - e.y); //[cite: 3]
const radioDeColision = state.player.size + e.radius; //[cite: 3]

if (distanciaAlJugador < radioDeColision || colisionOvalo) {
  endGame(e); 
  return;
}}}
