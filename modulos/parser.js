// ==========================================
// TRADUCTOR / PARSER DE FRASES Y PALABRAS
// ==========================================
export function parsearLista(textoPlano) {
  const palabrasNormales = [];
  const frasesJefe = [];

  textoPlano.split("\n").forEach(linea => {
    const l = linea.trim();
    if (l === "" || l.startsWith("//")) return;

    if (l.startsWith("BOSS_FRAS|")) {
      const partes = l.replace("BOSS_FRAS|", "").split("|");
      if (partes.length >= 3) {
        frasesJefe.push({
          jp: partes[0].trim(),
          romaji: partes[1].trim().toLowerCase(),
          es: partes[2].trim()
        });
      }
    } else {
      const partes = l.split("|");
      if (partes.length < 3) return;
      
      if (partes.length === 4) {
        palabrasNormales.push({
          jp: partes[0].trim(),
          kana: partes[1].trim(),
          romaji: partes[2].trim().toLowerCase(),
          es: partes[3].trim()
        });
      } else {
        const jpClean = partes[0].trim();
        palabrasNormales.push({ 
          jp: jpClean, 
          kana: jpClean, 
          romaji: partes[1].trim().toLowerCase(), 
          es: partes[2].trim() 
        });
      }
    }
  });

  return { normales: palabrasNormales, jefe: frasesJefe };
}