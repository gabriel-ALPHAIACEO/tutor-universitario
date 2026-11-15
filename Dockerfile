# La computadora en la nube del estudiante: Linux con las herramientas de Electrónica.
# El «shim» viene de la imagen de Cloudflare; su versión debe ser igual a la de @cloudflare/sandbox en package.json.
ARG SANDBOX_TOOLS_IMAGE=docker.io/cloudflare/sandbox:1.0.3
FROM ${SANDBOX_TOOLS_IMAGE} AS sandbox-tools

FROM debian:trixie-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-numpy python3-scipy python3-sympy python3-matplotlib \
      ngspice \
    && rm -rf /var/lib/apt/lists/*
COPY --from=sandbox-tools /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim
# Las gráficas se guardan como imagen, sin pantalla.
ENV MPLBACKEND=Agg
RUN mkdir -p /proyecto
WORKDIR /proyecto
CMD ["sleep", "infinity"]
