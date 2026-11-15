// La lista de plugins activos. Para sumar una capacidad nueva: crear su archivo y agregarlo aquí.
// Un plugin es { nombre, preparar(sql)?, contexto(sql)?, herramientas: [] }.

import { memoria } from "./memoria.js";
import { calificaciones } from "./calificaciones.js";
import { electronica } from "./electronica.js";
import { computadora } from "./computadora.js";

export const PLUGINS = [memoria, calificaciones, electronica, computadora];
