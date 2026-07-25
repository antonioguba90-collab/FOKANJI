// ==========================================
// SERVIDOR LOCAL PARA JUGAR A FOKANJI
// ==========================================
// El juego usa módulos ES, que los navegadores bloquean al abrir el
// index.html directamente (file://). Este mini servidor lo sirve por
// http://localhost y abre el navegador. Arranca con doble clic en
// JUGAR.bat o con: node servidor.mjs
import http from 'http';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO_INICIAL = 8137;
const MAX_INTENTOS_PUERTO = 20;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
};

const servidor = http.createServer((req, res) => {
  const rutaUrl = decodeURIComponent(req.url.split('?')[0]);
  const fichero = path.normalize(path.join(RAIZ, rutaUrl === '/' ? 'index.html' : rutaUrl));

  // Seguridad: nunca servir nada fuera de la carpeta del juego
  if (!fichero.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }

  fs.readFile(fichero, (err, datos) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    const extension = path.extname(fichero).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[extension] || 'application/octet-stream' });
    res.end(datos);
  });
});

// Si el puerto está ocupado (otra ventana del juego, otro programa...),
// prueba con el siguiente en vez de fallar.
let puerto = PUERTO_INICIAL;

servidor.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && puerto < PUERTO_INICIAL + MAX_INTENTOS_PUERTO) {
    puerto++;
    console.log(`  Puerto ${puerto - 1} ocupado, probando el ${puerto}...`);
    servidor.listen(puerto);
  } else {
    console.error('No se pudo arrancar el servidor:', err.message);
    process.exit(1);
  }
});

servidor.listen(puerto, () => {
  const url = `http://localhost:${puerto}`;
  console.log('==========================================');
  console.log(`  FOKANJI corriendo en ${url}`);
  console.log('  Deja esta ventana abierta mientras juegas.');
  console.log('  Para salir: cierra la ventana o pulsa Ctrl+C.');
  console.log('==========================================');
  // Abrir el navegador automáticamente (salvo en tests)
  if (!process.env.FOKANJI_NO_OPEN) exec(`start "" "${url}"`);
});
