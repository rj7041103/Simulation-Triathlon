import { CONFIG } from "./config.js";

class Triatlon {
  constructor() {
    this.participantes = [];
    this.competidores = [];
    this.asistentes = [];
    this.tiempoActual = null;
    this.intervaloID = null;
    this.etapaActual = "";
    this.horaInicio = null;
    this.simulacionRapida = false;

    this.initEventListeners();
  }
  actualizarEstadoBotones() {
    const asistenciaLink = document.getElementById("asistencia-link");
    const competenciaLink = document.getElementById("competencia-link");
    const iniciarBtn = document.getElementById("iniciar-competencia");

    // Habilitar/deshabilitar botones de navegación
    asistenciaLink.classList.toggle("disabled", this.participantes.length < 1);
    competenciaLink.classList.toggle("disabled", this.asistentes.length < 2);

    // Habilitar/deshabilitar botón de iniciar competencia
    iniciarBtn.disabled = this.asistentes.length < 2;
  }
  initEventListeners() {
    //Seccion de activacion de las pestañas de navegacion para que habiliten la vista si se cumplen ciertas condiciones para que no vaya a ellas sin haber puesto algun registro
    document
      .getElementById("registro-link")
      .addEventListener("click", () => this.mostrarSeccion("registro"));
    document
      .getElementById("asistencia-link")
      .addEventListener("click", (e) => {
        if (this.participantes.length < 1) {
          e.preventDefault();
          return;
        }
        this.mostrarSeccion("asistencia");
      });

    document
      .getElementById("competencia-link")
      .addEventListener("click", (e) => {
        if (this.asistentes.length < 2) {
          e.preventDefault();
          return;
        }
        this.mostrarSeccion("competencia");
      });

    //Registro de participantes
    document.getElementById("registro-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.registrarParticipante();
    });

    // Asistencia
    document
      .getElementById("marcar-asistencia")
      .addEventListener("click", () => this.marcarAsistencia());

    document
      .getElementById("buscar-cedula")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.marcarAsistencia();
      });

    document
      .getElementById("llenado-automatico")
      .addEventListener("click", () => {
        this.llenadoAutomaticoAsistencia();
      });

    document
      .getElementById("remover-automatico")
      .addEventListener("click", () => {
        this.removerAutomaticoAsistencia();
      });
    // Competencia
    document
      .getElementById("iniciar-competencia")
      .addEventListener("click", () => {
        this.iniciarCompetenciaRapida();
        document.getElementById("iniciar").disabled = true;
      });

    document.getElementById("iniciar").addEventListener("click", () => {
      this.iniciarCompetencia();
      document.getElementById("iniciar-competencia").disabled = true;
    });

    document
      .getElementById("reestablecer-btn")
      .addEventListener("click", () => {
        this.reestablecerCompetencia();
      });
  }

  mostrarSeccion(seccion) {
    document
      .querySelectorAll("section")
      .forEach((s) => s.classList.remove("active"));
    document
      .querySelectorAll("nav a")
      .forEach((a) => a.classList.remove("active"));

    document.getElementById(seccion).classList.add("active");
    if (seccion === "registro") {
      document.getElementById("registro-link").classList.add("active");
    } else if (seccion === "asistencia") {
      document.getElementById("asistencia-link").classList.add("active");
      this.actualizarTablasAsistencia();
    } else if (seccion === "competencia") {
      document.getElementById("competencia-link").classList.add("active");
    }
  }
  registrarParticipante() {
    const participante = {
      cedula: document.getElementById("cedula").value,
      nombre: document.getElementById("nombre").value,
      municipio: document.getElementById("municipio").value,
      edad: parseInt(document.getElementById("edad").value),
    };

    // Validar cédula (8 dígitos numéricos)
    if (!/^\d{8}$/.test(participante.cedula)) {
      alert("La cédula debe tener 8 dígitos numéricos");
      return;
    }

    // Validar edad (entre 10 y 120)
    const edad = participante.edad;
    if (isNaN(edad) || edad < 10 || edad > 88) {
      alert("La edad debe ser un número entre 10 y 120 años");
      return;
    }

    if (this.participantes.some((p) => p.cedula === participante.cedula)) {
      alert("Ya existe un participante con esa cédula");
      return;
    }

    this.participantes.push(participante);
    this.actualizarTablaRegistrados();
    document.getElementById("registro-form").reset();
    this.actualizarEstadoBotones();
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

  marcarAsistencia() {
    const cedula = document.getElementById("buscar-cedula").value;
    const participante = this.participantes.find((p) => p.cedula === cedula);

    if (!/^\d{8}$/.test(cedula)) {
      alert("La cédula debe tener exactamente 8 dígitos numéricos");
      return;
    }

    if (!participante) {
      alert("No se encontró un participante registrado con esa cédula");
      return;
    }

    if (this.asistentes.some((a) => a.cedula === cedula)) {
      alert("Este participante ya fue marcado como presente");
      return;
    }

    this.asistentes.push(participante);
    this.actualizarTablasAsistencia();
    document.getElementById("buscar-cedula").value = "";
    this.actualizarEstadoBotones();
  }

  llenadoAutomaticoAsistencia() {
    this.asistentes = this.participantes;
    this.actualizarTablasAsistencia();
    document.getElementById("buscar-cedula").value = "";
    this.actualizarEstadoBotones();
  }

  removerAutomaticoAsistencia() {
    if (this.asistentes.length < 1) {
      alert("No hay asistentes para remover");
      return;
    }
    this.asistentes = [];
    this.actualizarTablasAsistencia();
    this.actualizarEstadoBotones();
  }
  actualizarTablasAsistencia() {
    // Actualizar tabla de por asistir
    const porAsistir = this.participantes.filter(
      (p) => !this.asistentes.some((a) => a.cedula === p.cedula)
    );

    const tbodyPorAsistir = document.querySelector("#tabla-por-asistir tbody");
    tbodyPorAsistir.innerHTML = "";
    porAsistir.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${p.cedula}</td>
            <td>${p.nombre}</td>
            <td>${p.municipio}</td>
            <td>${p.edad}</td>
        `;
      tbodyPorAsistir.appendChild(tr);
    });

    // Actualizar tabla de asistentes
    const tbodyAsistentes = document.querySelector("#tabla-asistentes tbody");
    tbodyAsistentes.innerHTML = "";
    this.asistentes.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
            <td>${p.cedula}</td>
            <td>${p.nombre}</td>
            <td>${p.municipio}</td>
            <td>${p.edad}</td>
        `;
      tbodyAsistentes.appendChild(tr);
    });
  }
  iniciarCompetenciaRapida() {
    if (this.asistentes.length < 2) {
      alert("No hay participantes presentes para iniciar la competencia");
      return;
    }
    const horaInicio = document.getElementById("hora-inicio").value;
    if (horaInicio.length === 5) {
      alert("Formato inválido. Debe ser HH:MM:SS (ej: 09:30:15)");
      return;
    }
    // Validar formato de hora (HH:MM o HH:MM:SS sin caracteres extra)
    if (
      !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(
        horaInicio.trim()
      )
    ) {
      alert("Formato inválido. Debe ser HH:MM:SS (ej: 09:30:15)");
      return;
    }

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

    /* this.competidores = this.participantes.map((p) => ({
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
        })); */

    this.competidores = this.asistentes.map((p) => ({
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

  iniciarCompetencia() {
    if (this.asistentes.length < 2) {
      alert("No hay participantes presentes para iniciar la competencia");
      return;
    }

    const horaInicio = document.getElementById("hora-inicio").value;

    if (horaInicio.length === 5) {
      alert("Formato inválido. Debe ser HH:MM:SS (ej: 09:30:15)");
      return;
    }
    // Validar formato de hora (HH:MM o HH:MM:SS sin caracteres extra)
    if (
      !/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(
        horaInicio.trim()
      )
    ) {
      alert("Formato inválido. Debe ser HH:MM:SS (ej: 09:30:15)");
      return;
    }

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

    this.simulacionRapida = true;
    CONFIG.INTERVALO_ACTUALIZACION = 1000; // 1 segundo
    // Calcular el número de intervalos para 10 minutos (600 segundos)
    const tiempoTotalSimulacion = 600; // 10 minutos en segundos
    const numIntervalos = tiempoTotalSimulacion; // Un intervalo por segundo

    // Dividir el tiempo total entre las etapas (aproximadamente igual)
    const tiempoPorEtapa = numIntervalos / 3; // Aproximadamente 200 segundos por etapa

    // Calcular velocidades requeridas para cumplir el tiempo exacto
    const distancias = CONFIG.DISTANCIAS;
    CONFIG.VELOCIDADES = {
      CAMINATA: (distancias.CAMINATA * 3600) / tiempoPorEtapa,
      NATACION: (distancias.NATACION * 3600) / tiempoPorEtapa,
      CICLISMO: (distancias.CICLISMO * 3600) / tiempoPorEtapa,
    };

    this.competidores = this.asistentes.map((p) => ({
      ...p,
      distanciaActual: 0,
      distanciaTotal: 0,
      etapa: "CAMINATA",
      tiempos: {
        CAMINATA: { inicio: "00:00:00", fin: null },
        NATACION: { inicio: null, fin: null },
        CICLISMO: { inicio: null, fin: null },
      },
      descalificado: false,
      // Añadi una propiedad para la variación de velocidad individual
      variacionVelocidad: 1 + (Math.random() - 0.5) * 0.5, // Variación entre 0.75 y 1.25 (±25%)
      incrementoDistancia: 0, // Inicializar el incremento de distancia
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

      // Verificación de descalificación, el numero de comparacion para evitar que se descalifiquen muy rapido los competidores debe ser muy bajo y si quieres mostrar lo contrario aumentalo por lo menos a 0.015
      if (Math.random() < 0.00015) {
        competidor.descalificado = true;
        // Registrar tiempo de descalificación
        competidor.tiempos[competidor.etapa].fin = this.formatearHora(
          this.tiempoActual
        );
        return;
      }

      let distanciaRecorrida = 0;

      if (this.simulacionRapida) {
        // Asegurar que la distancia recorrida sea un valor pequeño
        const incrementoBase = 0.0001; // Incremento base de 0.01 km (10 metros)
        const velocidadBase = CONFIG.VELOCIDADES[competidor.etapa];

        // Limitar la distancia recorrida a un valor máximo
        distanciaRecorrida = incrementoBase * velocidadBase * Math.random();
      } else {
        //Aqui obtenemos el valor de las velocidades dentro del archivo config.js
        const velocidadBase = CONFIG.VELOCIDADES[competidor.etapa];
        const maxDistanciaPorIntervalo = velocidadBase * 0.1 - 0.455; // Máximo teórico por segundo
        distanciaRecorrida = Math.random() * maxDistanciaPorIntervalo; // Entre 0 y máximo posible
      }

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

    //Se para la simulacion si queda solo 1 participante que no este descalificado

    this.finalizarCompetencia();
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
    if (this.simulacionRapida) {
      // Restaurar velocidades originales al cambiar de etapa
      CONFIG.VELOCIDADES = {
        CAMINATA: 7,
        NATACION: 6.192,
        CICLISMO: 45,
      };
    }
  }

  finalizarCompetencia() {
    // --- LÓGICA PARA DETENER LA SIMULACIÓN CON UN GANADOR ---

    // Buscamos todos los competidores que han FINALIZADO la carrera
    const finishedCompetitors = this.competidores.filter(
      (c) => c.etapa === "FINALIZADO"
    );

    // Buscamos todos aquellos competidores que NO se encuentran descalificados y que NO hayan terminado
    const activeCompetitors = this.competidores.filter(
      (c) => !c.descalificado && c.etapa !== "FINALIZADO"
    );
    const descalifiedCompetitors = this.competidores.filter(
      (c) => c.descalificado
    );

    // Caso 1: Alguien ha finalizado la carrera
    if (finishedCompetitors.length > 0) {
      //clearInterval(this.intervaloID); // Detener la simulación
      this.etapaActual = "FINALIZADO";

      // Determinar el ganador: el primero en finalizar
      const ganador = finishedCompetitors.sort((a, b) => {
        const tiempoFinA = new Date(`1970-01-01T${a.tiempos.CICLISMO.fin}`);
        const tiempoFinB = new Date(`1970-01-01T${b.tiempos.CICLISMO.fin}`);
        return tiempoFinA - tiempoFinB;
      })[0]; // El primero después de ordenar por tiempo de finalización

      document.getElementById(
        "etapa-actual"
      ).textContent = `¡Competencia FINALIZADA! Ganador: 🏆 ${ganador.nombre}`;
      this.actualizarTablaCompetencia();
    }
    // Caso 2: Si no hay ganadores aún, pero solo queda 1 competidor activo y al menos hubo asistentes al inicio (para evitar que con 1 solo asistente se termine de inmediato)
    else if (activeCompetitors.length <= 1 && this.asistentes.length > 1) {
      if (activeCompetitors.length === 1) {
        //clearInterval(this.intervaloID); // Detener la simulación
        this.etapaActual = "FINALIZADO";
        document.getElementById(
          "etapa-actual"
        ).textContent = `¡Competencia FINALIZADA! Ganador Potencial (Único Activo): ${activeCompetitors[0].nombre} - Esperando Finalización o Descalificación`;
        this.actualizarTablaCompetencia();
      } else if (
        activeCompetitors.length === 0 &&
        finishedCompetitors.length === 0 &&
        descalifiedCompetitors.length > 0
      ) {
        //clearInterval(this.intervaloID); // Detener la simulación
        this.etapaActual = "FINALIZADO";
        document.getElementById(
          "etapa-actual"
        ).textContent = `¡Competencia FINALIZADA! Sin Ganadores - Todos Descalificados o No Finalizaron`;
        this.actualizarTablaCompetencia();
      }
    }
  }
  reestablecerCompetencia() {
    //Borramos los valores del input
    document.getElementById("hora-inicio").value = "";
    //Borramos los registros de la tabla
    const tbody = document.querySelector("#tabla-competencia tbody");
    tbody.innerHTML = "";
    //Volvemos a habiliar los botones si estaba alguno deshabilitado
    document.getElementById("iniciar").disabled = false;
    document.getElementById("iniciar-competencia").disabled = false;

    //Borramos los valores que haya tenido el texto del reloj que se va actalizando
    document.getElementById("reloj").textContent = "";
    clearInterval(this.intervaloID);
  }
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
      }</td>          <td>${
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
