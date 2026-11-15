// Plugin de calificaciones: anota cada evaluación y calcula el promedio por materia.
// Si las evaluaciones traen peso (%), el promedio es ponderado; si no, es simple.

export const calificaciones = {
  nombre: "calificaciones",

  preparar(sql) {
    sql.exec(`CREATE TABLE IF NOT EXISTS calificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      materia TEXT NOT NULL,
      evaluacion TEXT NOT NULL,
      nota REAL NOT NULL,
      sobre REAL NOT NULL DEFAULT 20,
      peso REAL,
      fecha TEXT NOT NULL DEFAULT (date('now'))
    )`);
  },

  herramientas: [
    {
      nombre: "registrar_calificacion",
      descripcion: "Anota la nota de una evaluación del estudiante.",
      parametros: {
        type: "object",
        properties: {
          materia: { type: "string" },
          evaluacion: { type: "string", description: "Por ejemplo «Parcial 1» o «Taller 3»." },
          nota: { type: "number" },
          sobre: { type: "number", description: "Nota máxima de la escala. Por defecto 20." },
          peso: { type: "number", description: "Porcentaje que vale en la materia, si se sabe." },
        },
        required: ["materia", "evaluacion", "nota"],
      },
      ejecutar({ materia, evaluacion, nota, sobre = 20, peso = null }, { sql }) {
        if (!(sobre > 0) || nota < 0 || nota > sobre) {
          throw new Error(`la nota ${nota} no cabe en una escala de 0 a ${sobre}.`);
        }
        sql.exec(
          "INSERT INTO calificaciones (materia, evaluacion, nota, sobre, peso) VALUES (?, ?, ?, ?, ?)",
          materia.trim(),
          evaluacion.trim(),
          nota,
          sobre,
          peso,
        );
        return `Anotado: ${materia} · ${evaluacion} · ${nota}/${sobre}`;
      },
    },
    {
      nombre: "ver_calificaciones",
      descripcion: "Muestra las notas y el promedio (sobre 20) de una materia o de todas.",
      parametros: {
        type: "object",
        properties: { materia: { type: "string", description: "Vacío para ver todas." } },
      },
      ejecutar({ materia }, { sql }) {
        const filas = materia
          ? sql.exec("SELECT * FROM calificaciones WHERE materia = ? COLLATE NOCASE ORDER BY fecha", materia.trim()).toArray()
          : sql.exec("SELECT * FROM calificaciones ORDER BY materia, fecha").toArray();
        if (filas.length === 0) return "No hay calificaciones anotadas.";

        const porMateria = Map.groupBy(filas, (f) => f.materia);
        return [...porMateria].map(([nombre, notas]) => ({
          materia: nombre,
          promedio_sobre_20: promedio(notas),
          evaluaciones: notas.map((f) => ({ evaluacion: f.evaluacion, nota: `${f.nota}/${f.sobre}`, peso: f.peso, fecha: f.fecha })),
        }));
      },
    },
  ],
};

// Lleva cada nota a la escala de 20 y promedia (ponderado solo si todas tienen peso).
export function promedio(notas) {
  const enVeinte = notas.map((f) => ({ valor: (f.nota / f.sobre) * 20, peso: f.peso }));
  const conPeso = enVeinte.every((n) => n.peso > 0);
  const total = enVeinte.reduce((suma, n) => suma + n.valor * (conPeso ? n.peso : 1), 0);
  const divisor = conPeso ? enVeinte.reduce((suma, n) => suma + n.peso, 0) : enVeinte.length;
  return Math.round((total / divisor) * 100) / 100;
}
