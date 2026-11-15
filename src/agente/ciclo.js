// El ciclo del agente (la misma idea que el «turn» de DeepSeek Harness):
// 1. se le manda al modelo las instrucciones + el historial + las herramientas;
// 2. si el modelo pide herramientas, se ejecutan y sus resultados se agregan al historial;
// 3. se vuelve a preguntar, hasta que el modelo conteste sin pedir nada más.
// Todo lo que el modelo ve se guarda con `guardar`, así cada respuesta se puede reconstruir.

export async function ejecutarTurno({
  instrucciones,
  historial,
  herramientas,
  llamarModelo,
  contexto,
  guardar,
  maxPasos = 8,
}) {
  for (let paso = 1; paso <= maxPasos; paso++) {
    const respuesta = await llamarModelo({
      mensajes: [{ role: "system", content: instrucciones }, ...historial],
      herramientas: herramientas.esquemas(),
    });
    guardar(respuesta);
    historial.push(respuesta);

    const llamadas = respuesta.tool_calls ?? [];
    if (llamadas.length === 0) return respuesta.content;

    for (const llamada of llamadas) {
      const resultado = await herramientas.ejecutar(
        llamada.function.name,
        llamada.function.arguments,
        contexto,
      );
      const mensaje = { role: "tool", tool_call_id: llamada.id, content: resultado };
      guardar(mensaje);
      historial.push(mensaje);
    }
  }
  return "Me enredé con demasiados pasos. ¿Me lo puedes preguntar de otra forma?";
}

// Solo se le mandan los últimos mensajes al modelo (cuesta menos y responde más rápido).
// El recorte siempre empieza en un mensaje del estudiante: si empezara en un resultado
// de herramienta suelto, la API lo rechaza.
export function recortarHistorial(mensajes, maximo = 40) {
  const recorte = mensajes.slice(-maximo);
  const inicio = recorte.findIndex((m) => m.role === "user");
  return inicio === -1 ? [] : recorte.slice(inicio);
}
