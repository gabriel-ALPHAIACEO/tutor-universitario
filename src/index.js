// La puerta de entrada: la página se sirve desde public/; aquí solo llegan las rutas /api/.

export { Estudiante } from "./estudiante.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (!(await autorizado(request, env))) return json({ error: "Clave incorrecta." }, 401);

    // Por ahora hay un solo estudiante. Cuando sean varios, cada uno tendrá su propio nombre aquí.
    const estudiante = env.ESTUDIANTE.get(env.ESTUDIANTE.idFromName("principal"));

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { texto } = await request.json().catch(() => ({}));
      if (typeof texto !== "string" || !texto.trim()) return json({ error: "Falta el mensaje." }, 400);
      try {
        return json({ respuesta: await estudiante.conversar(texto.trim().slice(0, 8000)) });
      } catch (error) {
        console.error("Fallo en el turno:", error);
        return json({ error: "El tutor no pudo responder. Intenta de nuevo en un momento." }, 502);
      }
    }

    if (url.pathname === "/api/historial" && request.method === "GET") {
      return json({ mensajes: await estudiante.historial() });
    }

    return json({ error: "Ruta no encontrada." }, 404);
  },
};

// Compara la clave en tiempo constante para que no se pueda adivinar letra por letra.
async function autorizado(request, env) {
  if (!env.ACCESO_CLAVE) return false;
  const enviada = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const [a, b] = await Promise.all(
    [enviada, env.ACCESO_CLAVE].map((t) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))),
  );
  return crypto.subtle.timingSafeEqual(a, b);
}

function json(datos, estado = 200) {
  return Response.json(datos, { status: estado });
}
