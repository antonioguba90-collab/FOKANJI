
const volumeaudio = 0.75
export class ReproductorMP3 {
    constructor() {
        this.audio = null;
        this.urlActual = '';
        this.volume = volumeaudio; // Establecido al 75%
    }
    // Carga el archivo MP3 sin reproducirlo inmediatamente
    cargar(url) {
        this.urlActual = url;
        this.audio = new Audio(url);
        this.audio.volume = this.volume; // Aplicar volumen al cargar
        
        // Opcional: Escuchar cuando el archivo esté listo para reproducirse
        this.audio.addEventListener('canplaythrough', () => {
            console.log(`Archivo cargado con éxito: ${url}`);
        });

        // Manejo de errores básico
        this.audio.addEventListener('error', (e) => {
            console.error("Error al cargar el archivo MP3:", e);
        });
    }
    setVolume(vol) {
        this.volume = vol;
        if (this.audio) this.audio.volume = vol;
    }

    // Inicia o reanuda la reproducción
    play() {
        if (!this.audio) {
            console.warn("No hay ningún archivo cargado. Usa cargar(url) primero.");
            return;
        }
        
        // play() devuelve una promesa en los navegadores modernos
        this.audio.play()
            .then(() => console.log("Reproduciendo..."))
            .catch(error => console.error("Error al iniciar reproducción:", error));
    }

    // Pausa la reproducción
    pause() {
        if (this.audio) {
            this.audio.pause();
            console.log("Audio pausado.");
        } else {
            console.warn("No hay ningún audio en reproducción para pausar.");
        }
    }
    // ESTE ES EL MÉTODO QUE NECESITAMOS
    setRepeat(activado) {
        this.bucle = activado;
        if (this.audio) {
            this.audio.loop = activado;
            console.warn("ha cargado la repetición.");
        } else {
            console.warn("No ha cargado la repetición.");
        }
    }
}