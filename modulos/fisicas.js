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

  // 1. Repulsión horizontal entre enemigos comunes (evita que se amontonen sus cuerpos y textos)
  for (let i = 0; i < minions.length; i++) {
    for (let j = i + 1; j < minions.length; j++) {
      const e1 = minions[i]; 
      const e2 = minions[j];
      
      // Si acaban de nacer arriba del todo, permitimos que avancen antes de empujarse
      if (e1.y < 0 || e2.y < 0) continue;
      
      const dx = e2.x - e1.x; 
      const dy = e2.y - e1.y;
      const distancia = Math.hypot(dx, dy) || 1;

      // --- ESTIMACIÓN DEL ANCHO DEL TEXTO ---
      // Estimamos cuántos píxeles ocupa el texto del enemigo i (Romaji suele ser el más largo)
      const largoTexto1 = Math.max(e1.romaji?.length || 0, (e1.es?.length || 0) + 2);
      const largoTexto2 = Math.max(e2.romaji?.length || 0, (e2.es?.length || 0) + 2);

      // Asumimos un aproximado de 7px a 8px de ancho por carácter físico en pantalla
      const radioTexto1 = (largoTexto1 * 7.5) / 2;
      const radioTexto2 = (largoTexto2 * 7.5) / 2;

      // El "radio efectivo" será el que sea mayor: el cuerpo del muñeco o el espacio del texto
      const radioEfectivo1 = Math.max(e1.radius, radioTexto1);
      const radioEfectivo2 = Math.max(e2.radius, radioTexto2);

      // Margen de separación usando los radios efectivos modificados
      const distanciaMinima = (radioEfectivo1 + radioEfectivo2) * 1.2; 
      
      if (distancia < distanciaMinima) {
        const solapamiento = distanciaMinima - distancia;
        // Si están exactamente en la misma X, calculamos una dirección aleatoria
        const direccionX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : (dx / distancia);
        const fuerzaX = direccionX * solapamiento * 0.40; 
        
        e1.x -= fuerzaX; 
        e2.x += fuerzaX;
        
        // Mantener a los enemigos y sus textos dentro de los límites del Canvas izquierdo/derecho
        // Usamos el radioEfectivo para que el texto no se corte en los bordes de la pantalla
        e1.x = Math.max(radioEfectivo1, Math.min(state.W - radioEfectivo1, e1.x));
        e2.x = Math.max(radioEfectivo2, Math.min(state.W - radioEfectivo2, e2.x));
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