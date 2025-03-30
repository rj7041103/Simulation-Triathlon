import { CONFIG } from "./config.js";

class Triatlon {
  constructor() {
    this.participantes = [];
    this.competidores = [];
    this.tiempoActual = null;
    this.intervaloID = null;
    this.etapaActual = "";

    this.initEventListeners();
  }

  initEventListeners() {
    document
      .getElementById("registro-link")
      .addEventListener("click", () => this.mostrarSeccion("registro"));
    document
      .getElementById("competencia-link")
      .addEventListener("click", () => this.mostrarSeccion("competencia"));

    document.getElementById("registro-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.registrarParticipante();
    });

    document
      .getElementById("iniciar-competencia")
      .addEventListener("click", () => this.iniciarCompetencia());
  }

  mostrarSeccion(seccion) {
    document
      .querySelectorAll("section")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll("nav a")
      .forEach((a) => a.classList.remove("active"));
    document.getElementById(seccion).classList.add("active");
    document.getElementById(`${seccion}-link`).classList.add("active");
  }

  registrarParticipante() {
    const participante = {
      cedula: document.getElementById("cedula").value,
      nombre: document.getElementById("nombre").value,
      municipio: document.getElementById("municipio").value,
      edad: parseInt(document.getElementById("edad").value),
    };

    if (this.participantes.some((p) => p.cedula === participante.cedula)) {
      alert("Ya existe un participante con esa cédula");
      return;
    }

    this.participantes.push(participante);
    this.actualizarTablaRegistrados();
    document.getElementById("registro-form").reset();
  }

  actualizarTablaRegistrados() {
    const tbody = document.querySelector("#tabla-registrados tbody");
    tbody.innerHTML = "";

    this.participantes.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.cedula}</td>
        <td>${p.nombre}</td>
        <td>${p.municipio}</td>
        <td>${p.edad}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  iniciarCompetencia() {
    const horaInicio = document.getElementById("hora-inicio").value;
    if (!horaInicio) {
      alert("Por favor ingrese la hora de inicio");
      return;
    }

    this.tiempoActual = new Date();
    const [horas, minutos, segundos] = horaInicio.split(":");
    this.tiempoActual.setHours(
      parseInt(horas),
      parseInt(minutos),
      parseInt(segundos)
    );

    this.competidores = this.participantes.map((p) => ({
      ...p,
      distanciaActual: 0,
      distanciaTotal: 0,
      etapa: "CAMINATA",
      tiempos: {
        CAMINATA: { inicio: horaInicio, fin: null },
        NATACION: { inicio: null, fin: null },
        CICLISMO: { inicio: null, fin: null },
      },
      descalificado: false,
    }));

    this.etapaActual = "CAMINATA";
    this.iniciarSimulacion();
  }

  iniciarSimulacion() {
    this.intervaloID = setInterval(() => {
      this.actualizarCompetencia();
      this.actualizarTablaCompetencia();
    }, CONFIG.INTERVALO_ACTUALIZACION);
  }
  formatearHora(date) {
    const horas = date.getHours().toString().padStart(2, "0");
    const minutos = date.getMinutes().toString().padStart(2, "0");
    const segundos = date.getSeconds().toString().padStart(2, "0");
    return `${horas}:${minutos}:${segundos}`;
  }

  actualizarCompetencia() {
    this.tiempoActual = new Date(
      this.tiempoActual.getTime() + CONFIG.INTERVALO_ACTUALIZACION
    );
    const tiempoFormateado = this.formatearHora(this.tiempoActual);
    document.getElementById("reloj").textContent = tiempoFormateado;

    this.competidores.forEach((competidor) => {
      if (competidor.descalificado || competidor.etapa === "FINALIZADO") return;

      // Verificación de descalificación (1.5%)
      if (Math.random() < 0.015) {
        competidor.descalificado = true;
        // Registrar tiempo de descalificación
        competidor.tiempos[competidor.etapa].fin = this.formatearHora(
          this.tiempoActual
        );
        return;
      }

      const velocidadBase = CONFIG.VELOCIDADES[competidor.etapa];
      const maxDistanciaPorIntervalo = (velocidadBase * 1000) / 3600; // Máximo teórico por segundo que si son 7k por hora estariamos convirtiendolo en metros/segundos por lo que tendriamos que serian 7000/3600 en la primera etapa de la competencia
      const distanciaRecorrida = Math.random() * maxDistanciaPorIntervalo; // Entre 0 y máximo posible

      competidor.distanciaActual += distanciaRecorrida;

      if (competidor.distanciaActual >= CONFIG.DISTANCIAS[competidor.etapa]) {
        this.finalizarEtapa(competidor);
      }
    });

    // Actualizar etapa general
    const etapasActivas = new Set(
      this.competidores
        .filter((c) => !c.descalificado && c.etapa !== "FINALIZADO")
        .map((c) => c.etapa)
    );
    this.etapaActual =
      etapasActivas.size > 0 ? Array.from(etapasActivas)[0] : "FINALIZADO";
    document.getElementById(
      "etapa-actual"
    ).textContent = `Etapa actual: ${this.etapaActual}`;
  }

  finalizarEtapa(competidor) {
    const horaFin = this.formatearHora(this.tiempoActual);
    competidor.tiempos[competidor.etapa].fin = horaFin;

    // Acumular distancia de la etapa completada
    competidor.distanciaTotal += CONFIG.DISTANCIAS[competidor.etapa];

    switch (competidor.etapa) {
      case "CAMINATA":
        competidor.etapa = "NATACION";
        competidor.tiempos.NATACION.inicio = horaFin;
        break;
      case "NATACION":
        competidor.etapa = "CICLISMO";
        competidor.tiempos.CICLISMO.inicio = horaFin;
        break;
      case "CICLISMO":
        competidor.etapa = "FINALIZADO";
        break;
    }

    competidor.distanciaActual = 0;
    this.actualizarTablaCompetencia(); // Actualización inmediata
  }
  /* mostrarResultadosFinales() {
    const competidoresFinales = this.competidores
      .filter((c) => c.tiempos.CICLISMO.fin)
      .sort((a, b) => {
        const tiempoA = new Date(`1970-01-01T${a.tiempos.CICLISMO.fin}`);
        const tiempoB = new Date(`1970-01-01T${b.tiempos.CICLISMO.fin}`);
        return tiempoA - tiempoB;
      });

    const descalificados = this.competidores.filter((c) => c.descalificado);
    docuemnt.getElementById("tabla-competencia").classList.add("hidden");
    const table = document.createElement("table");
    document.write(`
        <html>
            <head>
                <title>Resultados Finales Triatlón</title>
                <style>${document.querySelector("style").innerHTML}</style>
            </head>
            <body class="ventana-resultados">
                <h2>Resultados Finales del Triatlón</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Nombre</th>
                            <th>Cédula</th>
                            <th>Tiempo Caminata</th>
                            <th>Tiempo Natación</th>
                            <th>Tiempo Ciclismo</th>
                            <th>Tiempo Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${competidoresFinales
                          .map(
                            (c, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${c.nombre}</td>
                                <td>${c.cedula}</td>
                                <td>${c.tiempos.CAMINATA.inicio} - ${
                              c.tiempos.CAMINATA.fin
                            }</td>
                                <td>${c.tiempos.NATACION.inicio} - ${
                              c.tiempos.NATACION.fin
                            }</td>
                                <td>${c.tiempos.CICLISMO.inicio} - ${
                              c.tiempos.CICLISMO.fin
                            }</td>
                                <td>${c.tiempos.CICLISMO.fin}</td>
                            </tr>
                        `
                          )
                          .join("")}
                        ${descalificados
                          .map(
                            (c) => `
                            <tr class="descalificado">
                                <td>-</td>
                                <td>${c.nombre}</td>
                                <td>${c.cedula}</td>
                                <td colspan="4">DESCALIFICADO</td>
                            </tr>
                        `
                          )
                          .join("")}
                    </tbody>
                </table>
            </body>
        </html>
    `);
  } */

  actualizarTablaCompetencia() {
    const tbody = document.querySelector("#tabla-competencia tbody");
    tbody.innerHTML = "";
    const horaActual = this.tiempoActual
      ? this.formatearHora(this.tiempoActual)
      : "...";

    if (
      this.competidores.every(
        (c) => c.etapa === "FINALIZADO" || c.descalificado
      )
    ) {
      clearInterval(this.intervaloID);
    }

    const competidoresOrdenados = [...this.competidores].sort((a, b) => {
      if (a.descalificado && !b.descalificado) return 1;
      if (!a.descalificado && b.descalificado) return -1;

      // Ordenar por tiempo de finalización de la última etapa completada
      const getUltimoTiempo = (c) => {
        if (c.tiempos.CICLISMO.fin) return c.tiempos.CICLISMO.fin;
        if (c.tiempos.NATACION.fin) return c.tiempos.NATACION.fin;
        return c.tiempos.CAMINATA.fin;
      };

      const tiempoA = new Date(`1970-01-01T${getUltimoTiempo(a)}`);
      const tiempoB = new Date(`1970-01-01T${getUltimoTiempo(b)}`);

      return tiempoA - tiempoB;
    });

    competidoresOrdenados.forEach((c, index) => {
      const tr = document.createElement("tr");
      tr.className = c.descalificado ? "descalificado" : "";

      // Calcular distancia total
      let distanciaTotal = c.distanciaTotal;
      if (c.etapa !== "FINALIZADO" && !c.descalificado) {
        distanciaTotal += c.distanciaActual;
      }

      tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${c.nombre}</td>
          <td>${c.cedula}</td>
          <td>${c.municipio}</td>
          <td>${c.edad}</td>
          <td>${c.tiempos.CAMINATA.inicio} - ${
        c.tiempos.CAMINATA.fin || "..."
      }</td>
          <td>${
            c.tiempos.NATACION.inicio ||
            (c.etapa === "NATACION" ? horaActual : "...")
          } - ${
        c.tiempos.NATACION.fin ||
        (c.descalificado && c.etapa === "NATACION" ? horaActual : "...")
      }</td>
          <td>${
            c.tiempos.CICLISMO.inicio ||
            (c.etapa === "CICLISMO" ? horaActual : "...")
          } - ${
        c.tiempos.CICLISMO.fin ||
        (c.descalificado && c.etapa === "CICLISMO" ? horaActual : "...")
      }</td>
          <td>${c.descalificado ? "DESCALIFICADO" : c.etapa}</td>
          <td>${distanciaTotal.toFixed(2)} km</td>
        `;
      tbody.appendChild(tr);
    });

    if (
      this.competidores.every(
        (c) => c.etapa === "FINALIZADO" || c.descalificado
      )
    ) {
      clearInterval(this.intervaloID);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Triatlon();
});
