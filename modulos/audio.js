// ==========================================
// SINTETIZADOR DE AUDIO (WEB AUDIO API)
// ==========================================
import { obtenerAjuste } from './ajustes.js';

let audioCtx = null;

// Volumen maestro de efectos: viene del menú de Ajustes (0..1)
function volumenEfectos() {
  return obtenerAjuste('volumenEfectos');
}

export function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  return audioCtx;
}

export function playShoot() {
  const ac = getAudio(); // Usando tu instancia existente
    if (!ac) return;

    const volumen = volumenEfectos();
    if (volumen <= 0) return; // Efectos silenciados desde Ajustes

    // 1. Oscilador para el tono "bit" (energía)
    const osc = ac.createOscillator();
    const gainOsc = ac.createGain();
    const masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(volumen, ac.currentTime);
    masterGain.connect(ac.destination);


    osc.type = 'sine'; // 'sine' suena más suave, 'triangle' más metálico
    osc.frequency.setValueAtTime(400, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.1);

    gainOsc.gain.setValueAtTime(0.25, ac.currentTime);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    
    // 2. Ruido blanco para el "fricción" de la nieve
    const bufferSize = ac.sampleRate * 0.15;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const gainNoise = ac.createGain();
    
    // Filtro para que el ruido no sea molesto (paso bajo)
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    gainNoise.gain.setValueAtTime(0.12, ac.currentTime);
    gainNoise.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.15);
    
    // Conexiones
    osc.connect(gainOsc).connect(masterGain);
    noise.connect(filter).connect(gainNoise).connect(masterGain);
    
    osc.start();
    noise.start();
    osc.stop(ac.currentTime + 0.15);
    noise.stop(ac.currentTime + 0.15);}

export function playExplosion() {
  const ac = getAudio();
  if (!ac) return;

  const volumen = volumenEfectos();
  if (volumen <= 0) return; // Efectos silenciados desde Ajustes

  const bufferSize = ac.sampleRate * 0.4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) { 
    const t = i / bufferSize; 
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2); 
  }
  
  const noise = ac.createBufferSource(); 
  noise.buffer = buffer;
  
  const filter = ac.createBiquadFilter(); 
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, ac.currentTime); 
  filter.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.35);

  const g = ac.createGain();
  g.gain.setValueAtTime(volumen, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
  
  noise.connect(filter).connect(g).connect(ac.destination);
  noise.start();
}