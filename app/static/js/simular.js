document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("simulaciones-container");
  const btnNueva = document.getElementById("btn-nueva");
  const dataElem = document.getElementById("datos");
  const uf_valor = parseFloat(dataElem.dataset.uf);
  let num_simulaciones = 0;
  const MAX_SIMULACIONES = 5;

  // --- Crear nueva simulación ---
  const agregarSimulacion = (i) => {
    if (num_simulaciones >= MAX_SIMULACIONES) {
      alert("Solo puedes tener hasta 5 simulaciones.");
      return;
    }

    const simulacion = crearFormularioSimulacion(i);
    container.appendChild(simulacion);
    num_simulaciones++;
  };

  // --- Eliminar simulación y reindexar ---
  const eliminarSimulacion = (i) => {
    const simulacionEliminar = document.getElementById(`simulacion_${i}`);
    if (!simulacionEliminar) return;

    // agregar clase fade-out
    simulacionEliminar.classList.add("fade-out");

    // esperar la animación antes de eliminar
    simulacionEliminar.addEventListener("animationend", () => {
      simulacionEliminar.remove();

        // Actualizar simulación 1 si corresponde
        if (num_simulaciones === 2 && i===2) {
            const simulacion1 = document.getElementById(`simulacion_1`);
            const simulacion1_h3 = simulacion1.querySelector("h3");
            simulacion1_h3.innerText = "Simulación";
        }

        // Reindexar simulaciones siguientes
        for (let j = i + 1; j <= num_simulaciones; j++) {
        const sim = document.getElementById(`simulacion_${j}`);
        if (!sim) continue;

        // actualizar id principal
        sim.id = `simulacion_${j - 1}`;
        const header = sim.querySelector("h3");
        
        if (j===2 && num_simulaciones===2) {
            header.innerText = `Simulación`;
        }
        else {
            header.innerText = `Simulación ${j - 1}`;
        }

        // actualizar ids internos
        const ids = sim.querySelectorAll("[id]");
        ids.forEach(el => {
            el.id = el.id.replace(`_${j}`, `_${j - 1}`);
        });

        // actualizar names
        const names = sim.querySelectorAll("[name]");
        names.forEach(el => {
            el.name = el.name.replace(`_${j}`, `_${j - 1}`);
        });

        // actualizar evento del botón eliminar
        const btnCerrar = sim.querySelector(".btn-cerrar-simulacion");
        btnCerrar.replaceWith(btnCerrar.cloneNode(true));
        sim.querySelector(".btn-cerrar-simulacion")
            .addEventListener("click", () => eliminarSimulacion(j - 1));
        }

        num_simulaciones--;
    }, { once: true });
  };

  // --- Crear formulario individual ---
  const crearFormularioSimulacion = (i) => {
    const form = document.createElement("div");
    form.className = "simulacion-form";
    form.id = `simulacion_${i}`;

    form.innerHTML = `
      <button class="btn-cerrar-simulacion" title="Eliminar simulación">×</button>
      <h3>${i === 1 ? "Simulación" : `Simulación ${i}`}</h3>
      <div class="simulacion-seccion">
        <h4>Datos del cliente</h4>
        <div class="simulacion-grid">
          <div class="input-group">
            <label for="renta_${i}">Renta bruta (mensual):</label>
            <input type="text" id="renta_${i}" name="renta_${i}" maxlength="12" placeholder="Ej: 1.200.000">
          </div>

          <div class="input-group">
            <label for="aporte_${i}">Aporte mensual:</label>
            <div class="select-inline">
              <select id="tipo-aporte_${i}" name="tipo-aporte_${i}">
                <option value="UF" selected>UF</option>
                <option value="CLP">CLP</option>
              </select>
              <input type="text" id="aporte_${i}" name="aporte_${i}" maxlength="6" placeholder="Ej: 5">
              <div class="conversion-preview" id="preview-aporte_${i}">—</div>
            </div>
          </div>
        </div>
      </div>

      <div class="simulacion-seccion">
        <h4>Datos bancarios</h4>
        <div class="simulacion-grid">
          <div class="input-group">
            <label for="tasa_${i}">Tasa de rentabilidad (% anual):</label>
            <input type="number" id="tasa_${i}" name="tasa_${i}" maxlength="5" placeholder="Ej: 4,5" step="1" min="0" max="100">
          </div>
        </div>
      </div>

      <button class="btn btn-simular" id="simular_${i}">Simular</button>
    `;

    // actualizar formulario 1 si corresponde
    if (i === 2) {
        const simulacion1 = document.getElementById(`simulacion_1`);
        const simulacion1_h3 = simulacion1.querySelector("h3");
        simulacion1_h3.innerText = "Simulación 1";
    }

    // elementos
    const rentaInput = form.querySelector(`#renta_${i}`);
    const aporteInput = form.querySelector(`#aporte_${i}`);
    const tipoAporteSelect = form.querySelector(`#tipo-aporte_${i}`);
    const preview = form.querySelector(`#preview-aporte_${i}`);
    const tasaInput = form.querySelector(`#tasa_${i}`);

    // --- Formateadores ---
    const formatearCLP = (input) => {
      const soloNumeros = input.value.replace(/\./g, "").replace(/\D/g, "");
      if (soloNumeros === "") {
        input.value = "";
        return;
      }
      input.value = parseInt(soloNumeros, 10).toLocaleString("es-CL");
    };

    const formatearTasa = (input) => {
      let val = input.value;
      if (val === "") return;
      let num = parseFloat(val.replace(",", "."));
      if (num < 0) input.value = "0";
      if (num > 100) input.value = "100";
      if (val.length > 5) input.value = val.slice(0, 5);
    };

    const actualizarPreview = () => {
      const tipo = tipoAporteSelect.value;
      const raw = aporteInput.value.replace(/\./g, "").replace(",", ".");
      if (raw === "") {
        preview.textContent = "—";
        return;
      }
      const num = Number(raw);
      if (isNaN(num)) {
        preview.textContent = "—";
        return;
      }

      if (tipo === "UF") {
        if (!uf_valor) {
          preview.textContent = "UF no disponible";
          return;
        }
        const clp = num * uf_valor;
        preview.textContent = `${clp.toLocaleString("es-CL")} CLP`;
      } else {
        if (!uf_valor) {
          preview.textContent = "UF no disponible";
          return;
        }
        const uf = num / uf_valor;
        const ufFormatted = uf.toFixed(4).replace(".", ",");
        preview.textContent = `${ufFormatted} UF`;
      }
    };

    // --- Eventos ---
    rentaInput.addEventListener("input", () => formatearCLP(rentaInput));
    aporteInput.addEventListener("input", () => {
      formatearCLP(aporteInput);
      actualizarPreview();
    });
    tipoAporteSelect.addEventListener("change", () => {
      if (tipoAporteSelect.value === "UF") {
        aporteInput.placeholder = "Ej: 5";
        aporteInput.maxLength = 6;
      } else {
        aporteInput.placeholder = "Ej: 200.000";
        aporteInput.maxLength = 12;
      }
      aporteInput.value = "";
      preview.textContent = "—";
    });
    tasaInput.addEventListener("input", () => formatearTasa(tasaInput));

    form.querySelector(`#simular_${i}`).addEventListener("click", (e) => {
      e.preventDefault();
      const renta = rentaInput.value.replace(/\./g, "");
      const tipoAporte = tipoAporteSelect.value;
      const aporte = aporteInput.value.replace(/\./g, "").replace(",", ".");
      const tasa = tasaInput.value;
      console.log({ renta, aporte, tipoAporte, tasa });
      alert(`Simulación ${i} creada:\nRenta: ${renta}\nAporte: ${aporte} ${tipoAporte}\nTasa: ${tasa}%`);
    });

    // --- Botón cerrar ---
    form.querySelector(".btn-cerrar-simulacion").addEventListener("click", () => eliminarSimulacion(i));

    return form;
  };

  // --- Evento del botón "Nueva simulación" ---
  btnNueva.addEventListener("click", () => agregarSimulacion(num_simulaciones + 1));
});
