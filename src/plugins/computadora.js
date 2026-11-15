// Plugin «manos»: el agente trabaja en la computadora en la nube del estudiante.

export const computadora = {
  nombre: "computadora",

  contexto() {
    return `Tienes una computadora Linux propia del estudiante (carpeta /proyecto) con Python 3 (numpy, scipy, sympy, matplotlib) y ngspice.
- Úsala para CALCULAR y COMPROBAR: nunca des un resultado numérico de un circuito sin haberlo verificado ahí (SymPy para el análisis, ngspice para simular).
- Guarda los archivos del trabajo con nombres claros; las gráficas en PNG.
- No tiene internet: trabaja con lo que ya está instalado.`;
  },

  herramientas: [
    {
      nombre: "ejecutar",
      descripcion: "Ejecuta un comando de bash en la computadora del estudiante, dentro de /proyecto. Devuelve código de salida, salida y errores.",
      parametros: {
        type: "object",
        properties: {
          comando: { type: "string", description: "Por ejemplo «python3 calculo.py» o «ngspice -b circuito.cir»." },
          segundos: { type: "number", description: "Tiempo máximo. Por defecto 120." },
        },
        required: ["comando"],
      },
      ejecutar: ({ comando, segundos }, { computadora }) => computadora.ejecutar(comando, Math.min(segundos ?? 120, 600)),
    },
    {
      nombre: "escribir_archivo",
      descripcion: "Crea o reemplaza un archivo de texto en /proyecto (código Python, netlist de SPICE, informe…).",
      parametros: {
        type: "object",
        properties: {
          ruta: { type: "string", description: "Relativa a /proyecto, por ejemplo «fisica/gauss.py»." },
          contenido: { type: "string" },
        },
        required: ["ruta", "contenido"],
      },
      async ejecutar({ ruta, contenido }, { computadora }) {
        await computadora.escribir(ruta, contenido);
        return `Escrito: ${ruta} (${contenido.length} letras)`;
      },
    },
    {
      nombre: "leer_archivo",
      descripcion: "Lee un archivo de texto de /proyecto.",
      parametros: {
        type: "object",
        properties: { ruta: { type: "string" } },
        required: ["ruta"],
      },
      ejecutar: ({ ruta }, { computadora }) => computadora.leer(ruta),
    },
  ],
};
