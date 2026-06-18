// ==========================================
// SINTETIZADOR DE AUDIO (WEB AUDIO API)
// ==========================================
let audioCtx = null;

export function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

export function playShoot() {
  const ac = getAudio(); if (!ac) return;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = "square"; o.frequency.setValueAtTime(900, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.08);
  g.gain.setValueAtTime(0.08, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.1);
  o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.12);
}

export function playExplosion() {
  const ac = getAudio(); if (!ac) return;
  const bufferSize = ac.sampleRate * 0.4; const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) { const t = i / bufferSize; data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2); }
  const noise = ac.createBufferSource(); noise.buffer = buffer;
  const filter = ac.createBiquadFilter(); filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, ac.currentTime); filter.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.35);
  const g = ac.createGain(); g.gain.setValueAtTime(0.4, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  noise.connect(filter).connect(g).connect(ac.destination); noise.start();
}