# Tutor universitario

Agente de estudio de código abierto que ayuda a un universitario a subir sus calificaciones.
Corre en Cloudflare Workers. Las ideas vienen de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness):
un ciclo de agente pequeño, un historial al que solo se le agrega y capacidades que entran como plugins.

## Cómo está armado

```
public/index.html          la página del chat
src/index.js               la puerta: sirve la página, revisa la clave y pasa /api/ al estudiante
src/estudiante.js          Durable Object: la memoria SQLite del estudiante y su turno
src/agente/ciclo.js        el ciclo: modelo → herramientas → modelo… hasta que responde
src/agente/herramientas.js el registro de herramientas
src/agente/modelo.js       la llamada al modelo (formato chat/completions: DeepSeek, OpenAI…)
src/agente/instrucciones.js cómo se comporta el tutor
src/plugins/               las capacidades: memoria, calificaciones (sumar una = un archivo + una línea en index.js)
test/                      pruebas sin Cloudflare ni modelo real
```

## Probar en la PC

1. Crea `.dev.vars` con `ACCESO_CLAVE=una-clave` (no se sube a git).
2. `npm test` para las pruebas.
3. `npm run dev` y abre http://localhost:8787 (el modelo corre en Workers AI aunque sea local: gasta de la cuenta).

## Publicar

Solo desde `main`: GitHub Actions prueba y publica cada cambio que entra (`.github/workflows/publicar.yml`).
Ahí se arma la imagen de la computadora en la nube, así que la PC no necesita Docker.
Secretos del repo: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` y `ACCESO_CLAVE`.

El modelo es Kimi K2.5 en Workers AI (`MODELO_NOMBRE` en `wrangler.jsonc`).
Para usar una API externa como DeepSeek: `MODELO_PROVEEDOR` = `api`, `MODELO_URL`, `MODELO_NOMBRE` y el secreto `MODELO_CLAVE`.

## Licencia

MIT. Ver `LICENSE`.
