// ==========================================
// MÓDULO DE GUARDIANES (MINI-JEFES)
// ==========================================
export function dibujarGuardian(ctx, e, isLocked, state, baseFontJp, baseFontR, sistemaLector) {
  ctx.fillStyle = isLocked ? "#1a237e" : "#9911ff"; 
  ctx.beginPath(); 
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); 
  ctx.fill();
  ctx.strokeStyle = "#ffffff"; 
  ctx.lineWidth = 4; 
  ctx.stroke();
  
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ff5"; 
  ctx.font = "bold 14px monospace";
  ctx.fillText(`[ ${e.name} ]`, e.x, e.y - e.radius - 28);
  
  // Barra de salud/fases del mini-jefe
  ctx.fillStyle = "#222"; 
  ctx.fillRect(e.x - 50, e.y - e.radius - 18, 100, 8);
  ctx.fillStyle = "#f05"; 
  ctx.fillRect(e.x - 50, e.y - e.radius - 18, ((e.fases.length - e.faseActual) / e.fases.length) * 100, 8);
  
  ctx.textBaseline = "middle"; 
  ctx.fillStyle = "#ffffff"; 
  ctx.font = `bold ${baseFontJp * 0.9}px sans-serif`;
  ctx.fillText(e.jp, e.x, e.y); 
  
  if (sistemaLector.bossTimerAyuda >= 600) {
    ctx.textBaseline = "alphabetic"; 
    ctx.font = `bold ${baseFontR * 0.9}px monospace`;
    const romajiYBoss = e.y - e.radius - 38;

    if (isLocked) {
      const r = e.romaji; 
      const typed = r.slice(0, state.typedLen); 
      const rest = r.slice(state.typedLen);
      const fullW = ctx.measureText(r).width; 
      const startX = e.x - fullW / 2;
      
      ctx.textAlign = "left"; 
      ctx.fillStyle = "#888"; 
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