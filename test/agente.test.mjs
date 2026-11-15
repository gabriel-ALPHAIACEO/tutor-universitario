// Pruebas del agente sin Cloudflare ni modelo real: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { ejecutarTurno, recortarHistorial } from "../src/agente/ciclo.js";
import { crearRegistro } from "../src/agente/herramientas.js";
import { promedio } from "../src/plugins/calificaciones.js";

test("el ciclo ejecuta la herramienta que pide el modelo y luego responde", async () => {
  const registro = crearRegistro();
  registro.registrar({
    nombre: "sumar",
    descripcion: "Suma dos números",
    parametros: { type: "object", properties: {} },
    ejecutar: ({ a, b }) => String(a + b),
  });

  // Modelo falso: primero pide la herramienta, después contesta con el resultado.
  const respuestas = [
    { role: "assistant", content: "", tool_calls: [{ id: "c1", type: "function", function: { name: "sumar", arguments: '{"a":2,"b":3}' } }] },
    { role: "assistant", content: "Da 5." },
  ];
  const vistos = [];
  const llamarModelo = async ({ mensajes }) => { vistos.push(mensajes); return respuestas.shift(); };
  const guardados = [];

  const final = await ejecutarTurno({
    instrucciones: "sistema",
    historial: [{ role: "user", content: "¿2+3?" }],
    herramientas: registro,
    llamarModelo,
    contexto: {},
    guardar: (m) => guardados.push(m),
  });

  assert.equal(final, "Da 5.");
  assert.deepEqual(guardados.map((m) => m.role), ["assistant", "tool", "assistant"]);
  assert.equal(guardados[1].content, "5");
  assert.equal(vistos[1].at(-1).content, "5", "la segunda llamada ya ve el resultado");
});

test("el ciclo se detiene si el modelo nunca deja de pedir herramientas", async () => {
  const registro = crearRegistro();
  const enBucle = async () => ({ role: "assistant", content: "", tool_calls: [{ id: "x", type: "function", function: { name: "nada", arguments: "{}" } }] });
  const final = await ejecutarTurno({
    instrucciones: "", historial: [], herramientas: registro, llamarModelo: enBucle, contexto: {}, guardar: () => {}, maxPasos: 3,
  });
  assert.match(final, /demasiados pasos/);
});

test("las herramientas devuelven los errores como texto", async () => {
  const registro = crearRegistro();
  registro.registrar({ nombre: "falla", descripcion: "", parametros: {}, ejecutar: () => { throw new Error("boom"); } });
  assert.equal(await registro.ejecutar("falla", "{}", {}), "Error en falla: boom");
  assert.match(await registro.ejecutar("noexiste", "{}", {}), /no existe/);
  assert.match(await registro.ejecutar("falla", "{mal", {}), /JSON/);
  assert.throws(() => registro.registrar({ nombre: "falla" }), /ya está registrada/);
});

test("el recorte del historial empieza en un mensaje del estudiante", () => {
  const mensajes = [
    { role: "user", content: "a" },
    { role: "assistant", content: "", tool_calls: [] },
    { role: "tool", content: "r" },
    { role: "assistant", content: "b" },
    { role: "user", content: "c" },
    { role: "assistant", content: "d" },
  ];
  assert.deepEqual(recortarHistorial(mensajes, 4).map((m) => m.content), ["c", "d"]);
  assert.equal(recortarHistorial(mensajes, 10).length, 6);
});

test("promedio simple, ponderado y en otra escala", () => {
  assert.equal(promedio([{ nota: 10, sobre: 20 }, { nota: 20, sobre: 20 }]), 15);
  assert.equal(promedio([{ nota: 10, sobre: 20, peso: 25 }, { nota: 20, sobre: 20, peso: 75 }]), 17.5);
  assert.equal(promedio([{ nota: 5, sobre: 10 }]), 10);
});

test("el modelo entiende el formato chat/completions y el viejo de Workers AI", async () => {
  const { limpiar } = await import("../src/agente/modelo.js");

  const nuevo = limpiar({ choices: [{ message: { role: "assistant", content: null, reasoning_content: "pienso", tool_calls: [{ id: "t1", type: "function", function: { name: "recordar", arguments: '{"clave":"a","valor":"b"}' } }] } }] });
  assert.deepEqual(nuevo, { role: "assistant", content: "", reasoning_content: "pienso", tool_calls: [{ id: "t1", type: "function", function: { name: "recordar", arguments: '{"clave":"a","valor":"b"}' } }] });

  const viejo = limpiar({ response: null, tool_calls: [{ name: "recordar", arguments: { clave: "a", valor: "b" } }] });
  assert.equal(viejo.tool_calls[0].function.arguments, '{"clave":"a","valor":"b"}');
  assert.equal(viejo.tool_calls[0].id, "llamada-0");

  assert.equal(limpiar({ response: "hola" }).content, "hola");
  assert.throws(() => limpiar({ raro: 1 }), /ningún mensaje/);
});

test("la salida larga de un comando se recorta dejando principio y final", async () => {
  const { recortar } = await import("../src/agente/computadora.js").catch(() => ({}));
  if (!recortar) return; // en Node no existe @cloudflare/sandbox fuera de Workers: se prueba en la nube
  const texto = "A".repeat(50) + "B".repeat(50);
  const r = recortar(texto, 20);
  assert.ok(r.startsWith("AAAAAAAAAA") && r.endsWith("BBBBBBBBBB") && r.includes("80 letras omitidas"));
  assert.equal(recortar("corto", 20), "corto");
});
