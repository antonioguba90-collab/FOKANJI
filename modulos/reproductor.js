export class ReproductorMP3 {
    constructor() {
        this.audio = null;
        this.urlActual = '';
    }

    // Carga el archivo MP3 sin reproducirlo inmediatamente
    cargar(url) {
        this.urlActual = url;
        this.audio = new Audio(url);
        
        // Opcional: Escuchar cuando el archivo esté listo para reproducirse
        this.audio.addEventListener('canplaythrough', () => {
            console.log(`Archivo cargado con éxito: ${url}`);
        });

        // Manejo de errores básico
        this.audio.addEventListener('error', (e) => {
            console.error("Error al cargar el archivo MP3:", e);
        });
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
}