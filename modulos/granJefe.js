// ==========================================
// MÓDULO DEL GRAN JEFE FINAL
// ==========================================
export function dibujarGranJefe(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
  // Color carmesí/dorado imponente para el Líder Supremo
  ctx.fillStyle = isLocked ? "#4a0000" : "#d32f2f"; 
  ctx.beginPath(); 
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); 
  ctx.fill();
  ctx.strokeStyle = "#ffd700"; // Borde dorado
  ctx.lineWidth = 5; 
  ctx.stroke();
  
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffd700"; 
  ctx.font = "bold 16px monospace";
  ctx.fillText(`👑 🔥 ${e.name} 🔥 👑`, e.x, e.y - e.radius - 32);
  
  // Barra de progreso del Jefe Supremo
  ctx.fillStyle = "#111"; 
  ctx.fillRect(e.x - 75, e.y - e.radius - 20, 150, 10);
  ctx.fillStyle = "#ffb300"; 
  ctx.fillRect(e.x - 75, e.y - e.radius - 20, ((e.fases.length - e.faseActual) / e.fases.length) * 150, 10);
  
  ctx.textBaseline = "middle"; 
  ctx.fillStyle = "#ffffff"; 
  ctx.font = `bold ${baseFontJp * 1.1}px sans-serif`;
  ctx.fillText(e.jp, e.x, e.y); 
  
  if (sistemaLector.bossTimerAyuda >= 600) {
    ctx.textBaseline = "alphabetic"; 
    ctx.font = `bold ${baseFontR * 1.0}px monospace`;
    const romajiYBoss = e.y - e.radius - 42;

    if (isLocked) {
      const r = e.romaji; 
      const typed = r.slice(0, state.typedLen); 
      const rest = r.slice(state.typedLen);
      const fullW = ctx.measureText(r).width; 
      const startX = e.x - fullW / 2;
      
      ctx.textAlign = "left"; 
      ctx.fillStyle = "#aa5555"; 
      ctx.fillText(typed, startX, romajiYBoss);
      ctx.textAlign = "center"; 
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(rest, startX + ctx.measureText(typed).width, romajiYBoss);
    } else {
      ctx.fillStyle = "#6cffeb"; 
      ctx.fillText(e.romaji, e.x, romajiYBoss);
    }
    ctx.textBaseline = "middle";
  }
}