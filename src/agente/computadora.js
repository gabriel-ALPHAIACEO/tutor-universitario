// La computadora en la nube del estudiante (Cloudflare Containers).
// El Durable Object del estudiante la enciende cuando hace falta y se apaga sola tras un rato sin uso.

import { Files } from "@cloudflare/sandbox";

const CARPETA = "/proyecto";
const APAGAR_TRAS_MS = 15 * 60 * 1000;
const LIMITE_SALIDA = 12_000; // letras de salida que ve el modelo por comando

export function crearComputadora(ctx) {
  const contenedor = ctx.container;

  async function encendida() {
    if (!contenedor) {
      throw new Error("la computadora en la nube no está disponible aquí (en la PC hace falta Docker).");
    }
    if (!contenedor.running) {
      contenedor.start({ image: contenedor.images.computadora, instance: "standard-1", enableInternet: false });
      await contenedor.setInactivityTimeout(APAGAR_TRAS_MS);
    }
    return contenedor;
  }

  return {
    async ejecutar(comando, segundos = 120) {
      const c = await encendida();
      const proceso = await c.exec(["/bin/bash", "-lc", comando], {
        cwd: CARPETA,
        signal: AbortSignal.timeout(segundos * 1000),
      });
      const salida = await proceso.output();
      const texto = new TextDecoder();
      return {
        codigo: salida.exitCode,
        salida: recortar(texto.decode(salida.stdout)),
        errores: recortar(texto.decode(salida.stderr)),
      };
    },

    async escribir(ruta, contenido) {
      const c = await encendida();
      await new Files(c).writeFile(enCarpeta(ruta), contenido);
    },

    async leer(ruta) {
      const c = await encendida();
      const respuesta = await new Files(c).readFile(enCarpeta(ruta));
      return respuesta.text();
    },
  };
}

// Toda ruta relativa queda dentro de la carpeta del proyecto.
function enCarpeta(ruta) {
  return ruta.startsWith("/") ? ruta : `${CARPETA}/${ruta}`;
}

// Si la salida es enorme, el modelo ve el principio y el final (donde suelen estar los errores).
export function recortar(texto, limite = LIMITE_SALIDA) {
  if (texto.length <= limite) return texto;
  const mitad = Math.floor(limite / 2);
  return `${texto.slice(0, mitad)}\n… [${texto.length - limite} letras omitidas] …\n${texto.slice(-mitad)}`;
}
