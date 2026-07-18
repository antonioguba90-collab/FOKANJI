// MÓDULO DE FÍSICAS, MOVIMIENTO Y COLISIONES
// ========================================================

/**
 * Gestiona el movimiento de los enemigos, las repulsiones entre ellos
 * y comprueba si alguno ha colisionado con la nave foca del jugador.
 */
export function actualizarFisicasYColisiones(state, endGame) {
  const minions = state.enemies.filter(e => !e.isBoss);

  // 1. Repulsión horizontal entre enemigos (considerando el texto a la derecha)
  for (let i = 0; i < minions.length; i++) {
    for (let j = i + 1; j < minions.length; j++) {
      const e1 = minions[i]; 
      const e2 = minions[j];
      
      if (e1.y < 0 || e2.y < 0) continue;
      
      const dx = e2.x - e1.x; 
      const dy = e2.y - e1.y;
      const distancia = Math.hypot(dx, dy) || 1;

      // Estimación del espacio ocupado (Sprite + Texto a la derecha)
      const estimarAnchoTexto = (e) => {
        const largoTexto = Math.max(e.romaji?.length || 0, (e.es?.length || 0) + 4.5);
        // Radio del sprite + ancho del texto desplazado
        return e.radius + (largoTexto * 8); 
      };

      const radioEfectivo1 = estimarAnchoTexto(e1);
      const radioEfectivo2 = estimarAnchoTexto(e2);

      // Margen de separación ajustado para evitar solapamiento de textos
      const distanciaMinima = (radioEfectivo1 + radioEfectivo2) * 0.7; 
      
      if (distancia < distanciaMinima) {
        const solapamiento = distanciaMinima - distancia;
        const direccionX = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : (dx / distancia);
        const fuerzaX = direccionX * solapamiento * 0.40; 
        
        e1.x -= fuerzaX; 
        e2.x += fuerzaX;
        
        // Limites de pantalla
        e1.x = Math.max(radioEfectivo1, Math.min(state.W - radioEfectivo1, e1.x));
        e2.x = Math.max(radioEfectivo2, Math.min(state.W - radioEfectivo2, e2.x));
      }
    }
  }  

  // 2. Movimiento hacia el jugador
  for (const e of state.enemies) {
    if (e.isBoss) {
      if (e.y < e.targetY) e.y += 1.5;
    } else {
      const dx = state.player.x - e.x; 
      const dy = state.player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      
      e.x += (dx / d) * e.speed; 
      e.y += (dy / d) * e.speed;
    }

    // 3. Colisión con el jugador
    const distanciaAlJugador = Math.hypot(state.player.x - e.x, state.player.y - e.y);
    const radioDeColision = state.player.size + e.radius;

    if (distanciaAlJugador < radioDeColision) {
      endGame(); 
      return;
    }
  }
}