// ========================================================
// MÓDULO DE FÍSICAS, MOVIMIENTO Y COLISIONES
// ========================================================

/**
 * Gestiona el movimiento de los enemigos, las repulsiones entre ellos
 * y comprueba si alguno ha colisionado con la nave foca del jugador.
 * 
 * @param {Object} state - El estado global del juego (config.js)
 * @param {Function} endGame - Función callback para terminar la partida (juego.js)
 */
export function actualizarFisicasYColisiones(state, endGame) {
  const minions = state.enemies.filter(e => !e.isBoss);

  // 1. Repulsión horizontal entre enemigos comunes (evita que se amontonen)
  for (let i = 0; i < minions.length; i++) {
    for (let j = i + 1; j < minions.length; j++) {
      const e1 = minions[i]; 
      const e2 = minions[j];
      
      // Si acaban de nacer arriba del todo, permitimos que avancen antes de empujarse
      if (e1.y < 0 || e2.y < 0) continue;
      
      const dx = e2.x - e1.x; 
      const dy = e2.y - e1.y;
      const distancia = Math.hypot(dx, dy) || 1;
      const distanciaMinima = (e1.radius + e2.radius) * 1.2; // Margen de separación
      
      if (distancia < distanciaMinima) {
        const solapamiento = distanciaMinima - distancia;
        // Si están exactamente en la misma X, calculamos una dirección aleatoria
        const direccionX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : (dx / distancia);
        const fuerzaX = direccionX * solapamiento * 0.40; 
        
        e1.x -= fuerzaX; 
        e2.x += fuerzaX;
        
        // Mantener a los enemigos dentro de los límites del Canvas izquierdo/derecho
        e1.x = Math.max(e1.radius, Math.min(state.W - e1.radius, e1.x));
        e2.x = Math.max(e2.radius, Math.min(state.W - e2.radius, e2.x));
      }
    }
  }

  // 2. Movimiento de las entidades hacia su objetivo
  for (const e of state.enemies) {
    if (e.isBoss) {
      // Los jefes bajan en línea recta hasta su posición de combate designada (targetY)
      if (e.y < e.targetY) {
        e.y += 1.5;
      }
    } else {
      // Los minions persiguen activamente la posición actual de la nave foca
      const dx = state.player.x - e.x; 
      const dy = state.player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      
      e.x += (dx / d) * e.speed; 
      e.y += (dy / d) * e.speed;
    }

    // 3. Detección de impacto contra el jugador (Game Over)
    const distanciaAlJugador = Math.hypot(state.player.x - e.x, state.player.y - e.y);
    const radioDeColision = state.player.size + e.radius;

    if (distanciaAlJugador < radioDeColision) {
      endGame(); 
      return; // Salimos de la función inmediatamente para congelar el estado
    }
  }
}