// Registro de herramientas: aquí cada plugin anota lo que el modelo puede hacer.
// Una herramienta es { nombre, descripcion, parametros (JSON Schema), ejecutar(args, contexto) }.

export function crearRegistro() {
  const lista = new Map();

  return {
    registrar(herramienta) {
      if (lista.has(herramienta.nombre)) {
        throw new Error(`La herramienta «${herramienta.nombre}» ya está registrada.`);
      }
      lista.set(herramienta.nombre, herramienta);
    },

    // Lo que se le manda al modelo para que sepa qué herramientas existen.
    esquemas() {
      return [...lista.values()].map((h) => ({
        type: "function",
        function: { name: h.nombre, description: h.descripcion, parameters: h.parametros },
      }));
    },

    // Nunca lanza: si algo falla, el error vuelve como texto para que el modelo lo vea y se corrija.
    async ejecutar(nombre, argumentosTexto, contexto) {
      const herramienta = lista.get(nombre);
      if (!herramienta) return `Error: no existe la herramienta «${nombre}».`;

      let argumentos;
      try {
        argumentos = JSON.parse(argumentosTexto || "{}");
      } catch {
        return "Error: los argumentos no son JSON válido.";
      }

      try {
        const resultado = await herramienta.ejecutar(argumentos, contexto);
        return typeof resultado === "string" ? resultado : JSON.stringify(resultado);
      } catch (error) {
        return `Error en ${nombre}: ${error.message}`;
      }
    },
  };
}
