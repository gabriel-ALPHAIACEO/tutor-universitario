// Conexión con el modelo. Hay dos caminos y los dos devuelven lo mismo:
// - "workers-ai": el modelo corre en Cloudflare (env.AI), sin claves aparte.
// - "api": cualquier API con formato chat/completions (DeepSeek, OpenAI…), con MODELO_URL y MODELO_CLAVE.

export function crearModelo(env) {
  const pedir = env.MODELO_PROVEEDOR === "workers-ai" ? pedirAWorkersAI : pedirAUnaAPI;

  return async function llamarModelo({ mensajes, herramientas }) {
    const cuerpo = {
      messages: mensajes,
      tools: herramientas.length ? herramientas : undefined,
    };
    return limpiar(await pedir(env, cuerpo));
  };
}

async function pedirAWorkersAI(env, cuerpo) {
  return env.AI.run(env.MODELO_NOMBRE, cuerpo);
}

async function pedirAUnaAPI(env, cuerpo) {
  const respuesta = await fetch(`${env.MODELO_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.MODELO_CLAVE}`,
    },
    body: JSON.stringify({ model: env.MODELO_NOMBRE, ...cuerpo }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!respuesta.ok) {
    const detalle = (await respuesta.text()).slice(0, 300);
    throw new Error(`El modelo respondió ${respuesta.status}: ${detalle}`);
  }
  return respuesta.json();
}

// Se guarda solo lo necesario, con la misma forma que la API espera de vuelta.
// Acepta el formato chat/completions ({ choices: [{ message }] }) y el viejo de Workers AI ({ response, tool_calls }).
export function limpiar(datos) {
  const mensaje = datos?.choices?.[0]?.message ?? (datos && "response" in datos ? { content: datos.response, tool_calls: datos.tool_calls } : null);
  if (!mensaje) throw new Error(`El modelo no devolvió ningún mensaje: ${JSON.stringify(datos).slice(0, 300)}`);

  const limpio = { role: "assistant", content: mensaje.content ?? "" };
  // Los modelos que piensan (Kimi, DeepSeek) piden que su razonamiento vuelva junto a sus llamadas a herramientas.
  if (mensaje.reasoning_content) limpio.reasoning_content = mensaje.reasoning_content;
  if (mensaje.tool_calls?.length) {
    limpio.tool_calls = mensaje.tool_calls.map((llamada, i) => {
      const funcion = llamada.function ?? llamada;
      const argumentos = funcion.arguments;
      return {
        id: llamada.id ?? `llamada-${i}`,
        type: "function",
        function: {
          name: funcion.name,
          arguments: typeof argumentos === "string" ? argumentos : JSON.stringify(argumentos ?? {}),
        },
      };
    });
  }
  return limpio;
}
