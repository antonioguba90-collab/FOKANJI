// ==========================================
// MÓDULO DEL PERSONAJE (NAVE FOCA)
// ==========================================
export function dibujarPersonaje(ctx, player) {
  const fx = player.x; 
  const fy = player.y + 10; 
  const r = player.size * 0.6; 

  // Base de la nave/aletas posteriores
  ctx.fillStyle = "#e0f7fa"; 
  ctx.strokeStyle = "#4dd0e1"; 
  ctx.lineWidth = 3;
  ctx.beginPath(); 
  ctx.moveTo(fx - r * 2, fy + r); 
  ctx.lineTo(fx + r * 2, fy + r);
  ctx.lineTo(fx + r * 1.4, fy + r * 1.8); 
  ctx.lineTo(fx - r * 1.4, fy + r * 1.8);
  ctx.closePath(); 
  ctx.fill(); 
  ctx.stroke();

  // Aletas laterales de la foca
  ctx.fillStyle = "#78909c";
  ctx.beginPath(); 
  ctx.ellipse(fx - r * 1.1, fy + r * 0.7, r * 0.5, r * 0.2, -Math.PI / 6, 0, Math.PI * 2); 
  ctx.fill();
  ctx.beginPath(); 
  ctx.ellipse(fx + r * 1.1, fy + r * 0.7, r * 0.5, r * 0.2, Math.PI / 6, 0, Math.PI * 2); 
  ctx.fill();

  // Cuerpo central
  ctx.beginPath(); 
  ctx.ellipse(fx, fy + r * 0.4, r * 1.1, r * 0.7, 0, 0, Math.PI * 2); 
  ctx.fill();

  // Cabeza
  ctx.beginPath(); 
  ctx.arc(fx, fy - r * 0.4, r * 0.7, 0, Math.PI * 2); 
  ctx.fill();

  // Ojos (Pupilas grandes)
  ctx.fillStyle = "#000";
  ctx.beginPath(); 
  ctx.arc(fx - r * 0.25, fy - r * 0.5, r * 0.08, 0, Math.PI * 2); 
  ctx.fill();
  ctx.beginPath(); 
  ctx.arc(fx + r * 0.25, fy - r * 0.5, r * 0.08, 0, Math.PI * 2); 
  ctx.fill();

  // Brillo de los ojos
  ctx.fillStyle = "#fff";
  ctx.beginPath(); 
  ctx.arc(fx - r * 0.28, fy - r * 0.53, r * 0.03, 0, Math.PI * 2); 
  ctx.fill();
  ctx.beginPath(); 
  ctx.arc(fx + r * 0.22, fy - r * 0.53, r * 0.03, 0, Math.PI * 2); 
  ctx.fill();

  // Hocico y nariz
  ctx.fillStyle = "#cfd8dc"; 
  ctx.beginPath(); 
  ctx.ellipse(fx, fy - r * 0.25, r * 0.25, r * 0.15, 0, 0, Math.PI * 2); 
  ctx.fill();
  
  ctx.fillStyle = "#263238"; 
  ctx.beginPath(); 
  ctx.arc(fx, fy - r * 0.3, r * 0.08, 0, Math.PI * 2); 
  ctx.fill();
}