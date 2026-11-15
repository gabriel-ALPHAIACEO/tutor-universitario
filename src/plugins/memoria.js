// Plugin de memoria: datos sueltos del estudiante (carrera, semestre, cómo aprende mejor…).
// Lo guardado se le muestra al modelo en cada turno, en sus instrucciones.

export const memoria = {
  nombre: "memoria",

  preparar(sql) {
    sql.exec(`CREATE TABLE IF NOT EXISTS datos (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      actualizado TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  },

  contexto(sql) {
    const filas = sql.exec("SELECT clave, valor FROM datos ORDER BY clave").toArray();
    if (filas.length === 0) return "Todavía no sabes nada del estudiante: pregúntale su carrera y sus materias.";
    return "Lo que sabes del estudiante:\n" + filas.map((f) => `- ${f.clave}: ${f.valor}`).join("\n");
  },

  herramientas: [
    {
      nombre: "recordar",
      descripcion:
        "Guarda o actualiza un dato importante del estudiante (carrera, semestre, metas, cómo aprende mejor, temas que le cuestan).",
      parametros: {
        type: "object",
        properties: {
          clave: { type: "string", description: "Nombre corto del dato, por ejemplo «carrera»." },
          valor: { type: "string", description: "El dato." },
        },
        required: ["clave", "valor"],
      },
      ejecutar({ clave, valor }, { sql }) {
        sql.exec(
          `INSERT INTO datos (clave, valor) VALUES (?, ?)
           ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado = datetime('now')`,
          clave.trim().toLowerCase(),
          valor.trim(),
        );
        return `Guardado: ${clave} = ${valor}`;
      },
    },
    {
      nombre: "olvidar",
      descripcion: "Borra un dato guardado del estudiante que ya no es cierto.",
      parametros: {
        type: "object",
        properties: { clave: { type: "string" } },
        required: ["clave"],
      },
      ejecutar({ clave }, { sql }) {
        sql.exec("DELETE FROM datos WHERE clave = ?", clave.trim().toLowerCase());
        return `Borrado: ${clave}`;
      },
    },
  ],
};
