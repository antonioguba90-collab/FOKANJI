// ==========================================
// INTERFAZ DEL MENÚ: AJUSTES, MANUAL, VOCABULARIO PROPIO Y PROGRESO
// ==========================================
import { menuEl } from './config.js';
import { obtenerAjuste, fijarAjuste, RANGOS_AJUSTES } from './ajustes.js';
import { contarDominadasGlobal, contarDominadas, borrarProgreso } from './persistencia.js';
import { playShoot } from './audio.js';
import {
  MODO_PROPIO, MIN_PALABRAS_PROPIAS,
  obtenerTextoGuardado, guardarTexto, borrarTextoGuardado, obtenerPool, esJugable
} from './vocabularioPropio.js';

let MODES = null;
let callbacks = {}; 
let alVolverDePausa = null; 

const TEXTO_BORRAR = "🗑️ Borrar progreso";
const TEXTO_CONFIRMAR = "⚠️ ¿Seguro?";
const TEXTO_BORRADO = "✅ Borrado";

const IDS_AJUSTES_PARTIDA = [
  'ajuste-palabras-fase',
  'ajuste-palabras-guardian',
  'ajuste-palabras-jefe',
  'ajuste-frases-jefe',
  'ajuste-arcade-kills'
];

const VISTAS = ["view-structure", "view-vocabulary", "view-settings", "view-manual", "view-custom"];

function mostrarVista(idVista) {
  VISTAS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("hidden", id !== idVista);
  });
}

function initSliderVolumen(idSlider, idValor, claveAjuste, alSoltar) {
  const slider = document.getElementById(idSlider);
  const etiqueta = document.getElementById(idValor);
  if (!slider || !etiqueta) return;

  const valorInicial = obtenerAjuste(claveAjuste);
  slider.value = Math.round(valorInicial * 100);
  etiqueta.textContent = `${Math.round(valorInicial * 100)}%`;

  slider.addEventListener('input', () => {
    const v = Number(slider.value) / 100;
    fijarAjuste(claveAjuste, v);
    etiqueta.textContent = `${slider.value}%`;
  });

  if (alSoltar) slider.addEventListener('change', alSoltar);
}

function initSliderNumerico(idSlider, idValor, claveAjuste) {
  const slider = document.getElementById(idSlider);
  const etiqueta = document.getElementById(idValor);
  const rango = RANGOS_AJUSTES[claveAjuste];
  if (!slider || !etiqueta || !rango) return;

  slider.min = rango.min;
  slider.max = rango.max;
  slider.step = rango.step;
  slider.value = obtenerAjuste(claveAjuste);
  etiqueta.textContent = slider.value;

  slider.addEventListener('input', () => {
    const v = Number(slider.value);
    fijarAjuste(claveAjuste, v);
    etiqueta.textContent = String(v);
  });
}

function initGrupoToggle(idGrupo, atributo, obtenerActivo, alPulsar) {
  const marcar = () => {
    const activo = obtenerActivo();
    document.querySelectorAll(`#${idGrupo} button`).forEach(btn => {
      btn.classList.toggle('activo', btn.dataset[atributo] === activo);
    });
  };
  document.querySelectorAll(`#${idGrupo} button`).forEach(btn => {
    btn.addEventListener('click', () => {
      alPulsar(btn.dataset[atributo]);
      marcar();
    });
  });
  marcar();
}

function refrescarDatoDominadas() {
  const el = document.getElementById('dato-dominadas');
  if (el) el.textContent = `📚 Palabras dominadas: ${contarDominadasGlobal()}`;
}

function initBorrarProgreso() {
  const btn = document.getElementById('btn-borrar-progreso');
  if (!btn) return;

  let confirmando = false;
  let timerReset = null;

  const restaurar = () => {
    confirmando = false;
    btn.textContent = TEXTO_BORRAR;
  };

  btn.addEventListener('click', () => {
    clearTimeout(timerReset);
    if (!confirmando) {
      confirmando = true;
      btn.textContent = TEXTO_CONFIRMAR;
      timerReset = setTimeout(restaurar, 3000);
    } else {
      borrarProgreso();
      refrescarDatoDominadas();
      refrescarProgresoVocabulario();
      btn.textContent = TEXTO_BORRADO;
      timerReset = setTimeout(restaurar, 2000);
    }
  });
}

function ajustarElementosSegunPausa(enPausa) {
  // Controlar la visibilidad del botón de pausa externo (reemplaza 'btn-pausa' por el ID de tu botón)
  const btnPausa = document.getElementById('btn-pausa');
  if (btnPausa) {
    btnPausa.classList.toggle('hidden', enPausa);
  }

  IDS_AJUSTES_PARTIDA.forEach(idSlider => {
    const slider = document.getElementById(idSlider);
    if (!slider) return;

    // Buscamos la fila de ajuste que lo contiene para cambiar su opacidad global
    const contenedorFila = slider.closest('.ajuste-fila') || slider.parentElement;
    
    // Deshabilitamos el slider para que no se pueda interactuar
    slider.disabled = enPausa;

    if (contenedorFila) {
      // Aplicamos un tono grisáceo y reducimos la opacidad visualmente en lugar de ocultarlo
      contenedorFila.style.opacity = enPausa ? "0.35" : "1";
      contenedorFila.style.pointerEvents = enPausa ? "none" : "auto";
    }
  });
}

function initNavegacionAjustes() {
  document.getElementById('btn-ajustes')?.addEventListener('click', () => {
    ajustarElementosSegunPausa(false);
    mostrarVista('view-settings');
    refrescarDatoDominadas();
  });

  document.getElementById('btn-back-ajustes')?.addEventListener('click', () => {
    if (alVolverDePausa) {
      menuEl.classList.add('hidden');
      menuEl.style.display = 'none';
      const volver = alVolverDePausa;
      alVolverDePausa = null;
      ajustarElementosSegunPausa(false); // Al volver de la pausa, se restaura el botón de pausa
      volver();
    } else {
      mostrarVista('view-structure');
    }
  });
}

export function abrirAjustesDesdePausa(alVolver) {
  alVolverDePausa = alVolver;
  menuEl.classList.remove('hidden');
  menuEl.style.display = 'flex';
  ajustarElementosSegunPausa(true); // Oculta el botón de pausa y bloquea los ajustes de partida
  mostrarVista('view-settings');
  refrescarDatoDominadas();
}

function initManual() {
  document.getElementById('btn-manual')?.addEventListener('click', () => mostrarVista('view-manual'));
  document.getElementById('btn-back-manual')?.addEventListener('click', () => mostrarVista('view-structure'));
}

function contarVocabulario(texto) {
  const pool = obtenerPool(texto);
  return { palabras: pool.normales.length, frases: pool.jefe.length };
}

function refrescarEstadoVocabPropio() {
  const textarea = document.getElementById('custom-texto');
  const estado = document.getElementById('custom-estado');
  const btnJugar = document.getElementById('btn-custom-jugar');
  if (!textarea || !estado || !btnJugar) return;

  const { palabras, frases } = contarVocabulario(textarea.value);
  const jugable = palabras >= MIN_PALABRAS_PROPIAS;

  estado.textContent = jugable
    ? `✔️ ${palabras} palabras y ${frases} frases de jefe`
    : `⚠️ ${palabras} válidas (mínimo ${MIN_PALABRAS_PROPIAS})`;
  estado.style.color = jugable ? "#7dffa8" : "#ffcf7d";
  btnJugar.disabled = !jugable;
  btnJugar.style.opacity = jugable ? "1" : "0.5";
}

function sincronizarMazoPropio() {
  if (esJugable()) {
    MODES[MODO_PROPIO] = obtenerPool();
  } else {
    delete MODES[MODO_PROPIO];
  }
  document.getElementById('btn-jugar-propio')?.classList.toggle('hidden', !MODES[MODO_PROPIO]);
  refrescarProgresoVocabulario();
}

function initVocabularioPropio() {
  const textarea = document.getElementById('custom-texto');
  const fileInput = document.getElementById('custom-file-input');
  const btnSelectFile = document.getElementById('btn-seleccionar-fichero');
  
  if (!textarea || !fileInput || !btnSelectFile) return;

  document.getElementById('btn-vocab-propio')?.addEventListener('click', () => {
    textarea.value = obtenerTextoGuardado();
    refrescarEstadoVocabPropio();
    mostrarVista('view-custom');
  });

  document.getElementById('btn-back-custom')?.addEventListener('click', () => mostrarVista('view-structure'));

  // Evento para abrir el selector nativo al pulsar nuestro botón personalizado
  btnSelectFile.addEventListener('click', () => {
    fileInput.click();
  });

  // Leer el fichero seleccionado mediante FileReader
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      textarea.value = event.target.result;
      refrescarEstadoVocabPropio();
      const estado = document.getElementById('custom-estado');
      if (estado) estado.textContent = `📁 Fichero "${file.name}" cargado con éxito`;
    };
    reader.readAsText(file);
    
    // Limpiar el input para permitir cargar el mismo archivo de nuevo si se desea
    fileInput.value = '';
  });

  textarea.addEventListener('input', refrescarEstadoVocabPropio);

  document.getElementById('btn-custom-guardar')?.addEventListener('click', () => {
    if (textarea.value.trim() === "") {
      borrarTextoGuardado();
    } else {
      guardarTexto(textarea.value);
    }
    sincronizarMazoPropio();
    const estado = document.getElementById('custom-estado');
    if (estado) estado.textContent = "💾 Guardado en el navegador";
  });

  document.getElementById('btn-custom-jugar')?.addEventListener('click', () => {
    guardarTexto(textarea.value);
    sincronizarMazoPropio();
    if (MODES[MODO_PROPIO] && callbacks.startGame) callbacks.startGame(MODO_PROPIO);
  });

  sincronizarMazoPropio();
}

export function refrescarProgresoVocabulario() {
  if (!MODES) return;
  document.querySelectorAll('#view-vocabulary button[data-mode]').forEach(btn => {
    const pool = MODES[btn.dataset.mode];
    if (!pool || !pool.normales) return;

    let badge = btn.querySelector('.progreso-mazo');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'progreso-mazo';
      btn.appendChild(badge);
    }
    badge.textContent = `${contarDominadas(pool.normales)} / ${pool.normales.length} dominadas`;
  });
}

function initRefrescoVocabulario() {
  document.querySelectorAll('#view-structure button[data-structure]').forEach(btn => {
    btn.addEventListener('click', () => {
      refrescarProgresoVocabulario();
    });
  });
}

export function initInterfazMenu(modes, cbs = {}) {
  MODES = modes;
  callbacks = cbs;

  initSliderVolumen('ajuste-musica', 'valor-musica', 'volumenMusica');
  initSliderVolumen('ajuste-efectos', 'valor-efectos', 'volumenEfectos', playShoot);

  initGrupoToggle('grupo-traduccion', 'trad',
    () => (obtenerAjuste('mostrarTraduccion') ? "si" : "no"),
    v => fijarAjuste('mostrarTraduccion', v === "si"));
  initGrupoToggle('grupo-ayuda-romaji', 'ayuda',
    () => obtenerAjuste('ayudaRomaji'),
    v => fijarAjuste('ayudaRomaji', v));

  initSliderNumerico('ajuste-palabras-fase', 'valor-palabras-fase', 'palabrasPorFase');
  initSliderNumerico('ajuste-palabras-guardian', 'valor-palabras-guardian', 'palabrasGuardian');
  initSliderNumerico('ajuste-palabras-jefe', 'valor-palabras-jefe', 'palabrasJefeFinal');
  initSliderNumerico('ajuste-frases-jefe', 'valor-frases-jefe', 'frasesJefeFinal');
  initSliderNumerico('ajuste-arcade-kills', 'valor-arcade-kills', 'arcadeKillsGuardian');

  initBorrarProgreso();
  initNavegacionAjustes();
  initManual();
  initVocabularioPropio();
  initRefrescoVocabulario();

  refrescarDatoDominadas();
  refrescarProgresoVocabulario();
}