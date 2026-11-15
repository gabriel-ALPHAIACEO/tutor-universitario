// El Durable Object del estudiante: su memoria (SQLite) y el agente que lo atiende.

import { DurableObject } from "cloudflare:workers";
import { crearRegistro } from "./agente/herramientas.js";
import { ejecutarTurno, recortarHistorial } from "./agente/ciclo.js";
import { crearModelo } from "./agente/modelo.js";
import { armarInstrucciones } from "./agente/instrucciones.js";
import { crearComputadora } from "./agente/computadora.js";
import { PLUGINS } from "./plugins/index.js";

export class Estudiante extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;

    // El registro de la conversación: solo se agrega, nunca se borra ni se edita.
    this.sql.exec(`CREATE TABLE IF NOT EXISTS mensajes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mensaje TEXT NOT NULL,
      creado TEXT NOT NULL DEFAULT (datetime('now'))
    )`);

    this.herramientas = crearRegistro();
    for (const plugin of PLUGINS) {
      plugin.preparar?.(this.sql);
      for (const herramienta of plugin.herramientas ?? []) this.herramientas.registrar(herramienta);
    }

    this.llamarModelo = crearModelo(env);
    this.computadora = crearComputadora(ctx);
    // Cola: si llegan dos mensajes a la vez, el segundo espera a que termine el primero.
    this.cola = Promise.resolve();
  }

  conversar(texto) {
    const turno = this.cola.then(() => this.#turno(texto));
    this.cola = turno.catch(() => {});
    return turno;
  }

  async #turno(texto) {
    const guardar = (mensaje) =>
      this.sql.exec("INSERT INTO mensajes (mensaje) VALUES (?)", JSON.stringify(mensaje));

    guardar({ role: "user", content: texto });

    return ejecutarTurno({
      instrucciones: armarInstrucciones(PLUGINS, this.sql),
      historial: recortarHistorial(this.#mensajes()),
      herramientas: this.herramientas,
      llamarModelo: this.llamarModelo,
      contexto: { sql: this.sql, computadora: this.computadora },
      maxPasos: 25,
      guardar,
    });
  }

  // Para la página: solo lo que se ve en el chat (sin llamadas internas a herramientas).
  historial() {
    return this.#mensajes()
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: m.content }));
  }

  #mensajes() {
    return this.sql
      .exec("SELECT mensaje FROM mensajes ORDER BY id")
      .toArray()
      .map((fila) => JSON.parse(fila.mensaje));
  }
}
