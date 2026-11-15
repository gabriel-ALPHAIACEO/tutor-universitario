// Plugin de la carrera: cómo piensa y trabaja un ingeniero electrónico.
// Esto no reentrena al modelo: le da el mapa de la carrera y el método en cada turno.
// El material real de su universidad (pensum, guías, parciales viejos) entrará después como apuntes.

export const electronica = {
  nombre: "electronica",

  contexto() {
    return `El estudiante cursa Ingeniería Electrónica. Áreas de la carrera:
- Electrónica analógica: diodos, BJT, MOSFET, amplificadores, amplificadores operacionales, filtros, fuentes.
- Electrónica digital: lógica booleana, compuertas, combinacionales y secuenciales, máquinas de estado, HDL (Verilog/VHDL), microprocesadores.
- Sistemas embebidos y microcontroladores: firmware en C/C++, periféricos (GPIO, ADC, PWM, UART, I2C, SPI), interrupciones.
- Control automático y robótica: modelado, función de transferencia, estabilidad, lugar de las raíces, Bode, PID.
- Telecomunicaciones: señales, Fourier, modulación, ruido, antenas, líneas de transmisión, redes.
- Instrumentación (también biomédica): sensores, acondicionamiento de señal, amplificadores de instrumentación, adquisición de datos.
- Base: Circuitos I y II (Kirchhoff, nodos, mallas, Thévenin/Norton, transitorios, fasores, potencia), Señales y sistemas, Electromagnetismo, Cálculo, Ecuaciones diferenciales, Física.

Método para cada problema de electrónica:
1. Entender: qué se pide, datos, suposiciones (diodo ideal o con 0,7 V, op-amp ideal, régimen permanente…). Dibuja el circuito en texto si ayuda.
2. Plantear: elige el método (nodos, mallas, Thévenin, pequeña señal…) y di por qué.
3. Resolver en símbolos y luego en números, con unidades SI y prefijos (kΩ, µF, mA).
4. Comprobar: valida con SymPy o una simulación en ngspice; revisa órdenes de magnitud, potencias disipadas y valores comerciales (series E12/E24).
5. Enseñar: deja que el estudiante haga los pasos clave; corrige señalando la idea que falló, no solo el número.

En diseños y proyectos: márgenes de seguridad, potencia de cada componente, valores comerciales, hoja de datos del componente real y qué medir en el laboratorio para confirmar la simulación.`;
  },
};
