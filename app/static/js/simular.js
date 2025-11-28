import { formatoCL } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {

    // --- Elementos ---
    const container = document.getElementById("simulacion-container");
    const form = document.getElementById("form");
    const rentaInput = form.querySelector("#renta");
    const aporteInput = form.querySelector("#aporte");
    const tipoAporteSelect = form.querySelector("#tipo-aporte");
    const monedaAporteSelect = form.querySelector("#moneda-aporte");
    const preview = form.querySelector("#preview-aporte");
    const aniosInput = form.querySelector("#anios");
    const tasaInput = form.querySelector("#tasa");
    const coberturaInput = form.querySelector("#cobertura");
    const dataElem = document.getElementById("datos");

    // --- Data ---
    const valorUF = parseFloat(dataElem.dataset.uf);
    const valorUTM = parseFloat(dataElem.dataset.utm);
    const tramos = JSON.parse(dataElem.dataset.tramos);

    // --- Formatear CLP ---
    let clpTimeout; // delay de formateo
    const formatearCLP = (input) => {
        clearTimeout(clpTimeout); // cancelar timeout previo
        clpTimeout = setTimeout(() => {
            const soloNumeros = input.value.replace(/\./g, "").replace(/\D/g, "");
            if (soloNumeros === "") {
                input.value = "";
                return;
            }
            input.value = parseInt(soloNumeros, 10).toLocaleString("es-CL");
        }, 125); // delay de 125 ms
    };

    // --- Formatear tasa ---
    function formatearTasa(input) {
        let val = input.value;
        if (val === "") return;
        let num = parseFloat(val.replace(",", "."));
        if (num < 0) input.value = "0";
        if (num > 100) input.value = "100";
        if (val.length > 5) input.value = val.slice(0, 5);
    };

    // --- Formatear años ---
    function formatearAnios(input) {
        let v = input.value.replace(/\D/g, "");
        if (v === "") { input.value = ""; return; }

        let num = parseInt(v, 10);
        if (num < 1) num = 1;
        if (num > 30) num = 30;

        input.value = num;
    };

    // --- Formatear cobertura ---
    let coberturaTimeout;
    function formatearCobertura(input) {
        clearTimeout(coberturaTimeout);
        coberturaTimeout = setTimeout(() => {
            let v = input.value.replace(/\./g, "").replace(/\D/g, "");
            if (v === "") { input.value = ""; return; }

            let num = parseInt(v, 10);
            if (num < 0) num = 0;
            if (num > 99999) num = 99999;

            input.value = num.toLocaleString("es-CL");
        }, 120);
    };

    // --- Actualizar preview ---
    function actualizarPreview() {
        const moneda = monedaAporteSelect.value;
        // obtener valor numérico sin puntos y con coma->dot if any
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
        if (moneda === "UF") {
            // si está en UF -> mostrar preview en CLP
            if (!valorUF) {
            preview.textContent = "UF no disponible";
            return;
            }
            const clp = num * valorUF;
            preview.textContent = `${formatoCL(clp)} CLP`;
        } else {
            // si está en CLP -> mostrar preview en UF
            if (!valorUF) {
            preview.textContent = "UF no disponible";
            return;
            }
            const uf = num / valorUF;
            // formatear con 1 decimal y coma
            preview.textContent = `${formatoCL(uf, 1)} UF`;
        }
    }

    // ---- Eventos ----
    rentaInput.addEventListener("input", () => formatearCLP(rentaInput));

    aporteInput.addEventListener("input", () => {
        formatearCLP(aporteInput);
        actualizarPreview();
    });

    // cuando cambie moneda actualizar placeholder y preview
    monedaAporteSelect.addEventListener("change", () => {
        if (monedaAporteSelect.value === "UF") {
            aporteInput.placeholder = "Ej: 10";
            aporteInput.maxLength = 6;
        } else {
            aporteInput.placeholder = "Ej: 200.000";
            aporteInput.maxLength = 12;
        }
        aporteInput.value = "";
        preview.textContent = "—";
    });

    tasaInput.addEventListener('input', () => formatearTasa(tasaInput));
    aniosInput.addEventListener("input", () => formatearAnios(aniosInput));
    coberturaInput.addEventListener("input", () => formatearCobertura(coberturaInput));

    // --- Elementos modal ---
    const modal = document.getElementById("modal");
    const tablaBody = document.getElementById("tabla-rentabilidad-body");
    const btnCerrar = document.getElementById("modal-cerrar");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnEliminar = document.getElementById("btn-eliminar");

    const datosRegimen = document.getElementById("datos-regimen");
    const datoAnios = document.getElementById("dato-anios");
    const datoTasa = document.getElementById("dato-tasa");
    const datoCobertura = document.getElementById("dato-cobertura");

    // lista de simulaciones guardadas y la actual
    let simulacionesGuardadas = [];
    let simulacionActual = {};

    // --- Funciones tabla de rentabilidad ---
    function crearTablaRentabilidad(tipoAporte, aporteAnual, tasaRentabilidad, costoInicial, numAnios) {
        let anio = 1;
        let capital = aporteAnual;
        if (tipoAporte === "unico") aporteAnual = 0;
        let rentabilidad = parseInt(capital*tasaRentabilidad);
        let nuevoCapital = capital+rentabilidad;
        let costoUF = costoInicial;
        let costoCLP = parseInt(costoUF*valorUF);
        let capitalFinal = Math.max(nuevoCapital-costoCLP, 0);
        const tabla = [[anio, capital, 0, rentabilidad, nuevoCapital, costoUF, capitalFinal]];
        anio++;
        for (anio; anio<=numAnios; anio++) {
            capital = capitalFinal;
            rentabilidad = parseInt((capital+aporteAnual)*tasaRentabilidad);
            nuevoCapital = capital+aporteAnual+rentabilidad;
            costoUF--;
            if (costoUF===2) {
                costoUF = 3;
            }
            costoCLP = parseInt(costoUF*valorUF);
            capitalFinal = Math.max(nuevoCapital-costoCLP, 0);
            const fila = [anio, capital, aporteAnual, rentabilidad, nuevoCapital, costoUF, capitalFinal];
            tabla.push(fila);
        }
        return tabla;
    }

   function escribirTablaHTML(tabla, tipoAporte, tasaRentabilidad) {
        const largo = tabla.length;
        tablaBody.textContent = "";
        const aporteDisplay = tipoAporte === "mensual" ? "table-cell" : "none";
        for (let i = 0; i < largo; i++) {
            const fila = tabla[i];
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${fila[0]}</td>
                <td>$${formatoCL(fila[1])}</td>
                <td style="display: ${aporteDisplay};">${fila[2] === 0 ? "—" : "$" + formatoCL(fila[2])}</td>
                <td>$${formatoCL(fila[3])}</td>
                <td>$${formatoCL(fila[4])}</td>
                <td class="costo-uf-td">
                    <button class="btn-uf menos">−</button>
                    <input type="text" class="input-costo-uf" value="${formatoCL(fila[5], 2)}">
                    <button class="btn-uf mas">+</button>
                </td>
                <td class="capital-final-td">
                    $${formatoCL(fila[6])}
                </td>
            `;
            const estilo = i%2 === 0 ? "row-white" : "row-gray";
            tr.classList.add(estilo);
            tablaBody.appendChild(tr);
        }
        const thAporte = document.getElementById("aporte-anual-th");
        thAporte.style.display = aporteDisplay;
        activarEventosCosto(tabla, tipoAporte, tasaRentabilidad);
    }

    function actualizarTabla(tabla, nuevoCosto, indice, tipoAporte, tasaRentabilidad) {
        let fila = tabla[indice];
        let anio = fila[0];
        let capital = fila[1];
        let aporteAnual = fila[2];
        let rentabilidad = fila[3];
        let nuevoCapital = fila[4];
        let costoUF = nuevoCosto;
        let costoCLP = parseInt(costoUF*valorUF);
        let capitalFinal = Math.max(nuevoCapital-costoCLP, 0);
        fila = [anio, capital, fila[2], rentabilidad, nuevoCapital, costoUF, capitalFinal];
        tabla[indice] = fila;
        const largo = tabla.length;
        for (let i=indice+1; i<largo; i++) {
            fila = tabla[i];
            anio = fila[0];
            capital = capitalFinal;
            aporteAnual = fila[2];
            rentabilidad = parseInt((capital+aporteAnual)*tasaRentabilidad);
            nuevoCapital = capital+aporteAnual+rentabilidad;
            costoUF = fila[5];
            costoCLP = parseInt(costoUF*valorUF);
            capitalFinal = Math.max(nuevoCapital-costoCLP, 0);
            fila = [anio, capital, aporteAnual, rentabilidad, nuevoCapital, costoUF, capitalFinal];
            tabla[i] = fila;
        }
        simulacionActual.tablaRentabilidad = tabla;
        escribirTablaHTML(tabla, tipoAporte, tasaRentabilidad);
    }

    function activarEventosCosto(tabla, tipoAporte, tasaRentabilidad) {
        tablaBody.querySelectorAll("tr").forEach((tr, i) => {
            const inputUF = tr.querySelector(".input-costo-uf");
            const btnMas = tr.querySelector(".mas");
            const btnMenos = tr.querySelector(".menos");

            // asegurar que el input sea texto aunque sea number para mejor UX de edición
            inputUF.type = "text";

            // cuando hace foco, seleccionar todo para facilitar reemplazo
            inputUF.addEventListener("focus", (ev) => {
                // dejar una copia del valor original por si se cancela
                inputUF.dataset.original = inputUF.value;
                // seleccionar todo (con pequeño timeout para compat con algunos navegadores)
                setTimeout(() => inputUF.select(), 0);
            });

            // Confirmar con Enter
            inputUF.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter") {
                    ev.preventDefault();
                    commitInputCambio(i);
                    // quitar el foco para disparar también blur si se desea
                    inputUF.blur();
                } else if (ev.key === "Escape") {
                    // revertir al valor original y quitar foco
                    inputUF.value = inputUF.dataset.original ?? inputUF.value;
                    inputUF.blur();
                }
            });

            // Confirmar al perder foco
            inputUF.addEventListener("blur", () => {
                commitInputCambio(i);
            });

            // Manejo de botones +/-
            btnMas.addEventListener("click", () => {
                let v = parseFloat(inputUF.value);
                if (isNaN(v)) v = 0;
                if (v < 99) v++;
                inputUF.value = v;
                // actualizar inmediatamente (botones confirman cambio)
                actualizarTabla(tabla, v, i, tipoAporte, tasaRentabilidad);
            });

            btnMenos.addEventListener("click", () => {
                let v = parseFloat(inputUF.value);
                if (isNaN(v)) v = 0;
                if (v > 0) v--;
                inputUF.value = v;
                actualizarTabla(tabla, v, i, tipoAporte, tasaRentabilidad);
            });

            // limitar caracteres pero sin actualizar la tabla
            inputUF.addEventListener("input", () => {
                // permitir solo dígitos y una coma y máximo 4 caracteres visibles
                let s = inputUF.value
                            .replace(/\./g, ",") // convertir puntos a comas
                            .replace(/[^0-9,]/g, "") // permitir dígitos y coma
                            .replace(/(,)(?=.*,)/g, ""); // solo una coma
                if (s.length > 4) s = s.slice(0, 4);
                inputUF.value = s;
            });

            // función local para confirmar y aplicar cambio desde blur/enter
            function commitInputCambio(indexFila) {
                let v = parseFloat(inputUF.value.replace(",", "."));
                if (isNaN(v) || v < 0) v = 0;
                if (v > 99) v = 99;
                inputUF.value = formatoCL(v, 2);
                actualizarTabla(tabla, v, indexFila, tipoAporte, tasaRentabilidad);
            }
        });
    }

    // --- Modal con resultados ---
    function abrirModal(renta, tipoAporte, aporte, anios, tasa, cobertura) {

        // datos régimen tributario
        let aporteAnual;
        if (tipoAporte === "mensual") {
            aporteAnual = aporte*12;
            datosRegimen.innerHTML = `
                <div><strong>Renta bruta:</strong> $${formatoCL(renta)}</div>
                <div style="text-align: center;"><strong>Aporte mensual:</strong> $${formatoCL(aporte)}</div>
                <div style="text-align: end;"><strong>Aporte anual:</strong> $${formatoCL(aporteAnual)}</div>
            `;
        }
        else {
            aporteAnual = aporte;
            datosRegimen.innerHTML = `
                <div><strong>Renta bruta:</strong> $${formatoCL(renta)}</div>
                <div style="text-align: center;"><strong>Aporte único:</strong> $${formatoCL(aporte)}</div>
                <div></div>
            `;
        }
        
        // régimen A
        const tasaA = 0.15;
        const topeA_utm = 6;
        const topeA = parseInt(topeA_utm*valorUTM);
        let esTopeA = false;
        let beneficioAnualA = parseInt(aporteAnual*tasaA);
        if (beneficioAnualA >= topeA) {
            esTopeA = true;
            beneficioAnualA = topeA;
        }
        let boxA = document.createElement("div");
        boxA.classList.add("regimen-box");
        boxA.id = "regimen-a";
        boxA.innerHTML = `
            <div class="regimen-top">
                <div class="regimen-header">
                <h4>APV Régimen A</h4>
                <span class="badge-recomendado" style="display:none;">Recomendado</span>
                </div>
                <p class="descripcion">
                El Estado entrega una bonificación anual del <strong>${formatoCL(tasaA*100)}%</strong> del aporte, con un tope de ${topeA_utm} UTM.
                </p>
            </div>
            <hr style="margin: 0.2rem 0 0.1rem;">
            <div class="regimen-bottom">
                <h5>Bonificación fiscal</h5>
                <p>Mensual: <span id="beneficio-a-mensual"><strong>$${formatoCL(beneficioAnualA/12)}</strong></span></p>
                <p>Anual: <span id="beneficio-a-anual"><strong>$${formatoCL(beneficioAnualA)}${esTopeA ? " (tope)" : ""}</strong></span></p>
            </div>
        `;

        // régimen B
        const tramo = tramos.find(t => 
            renta >= t.desde && (t.hasta === null || renta < t.hasta)
        );
        const tasaB = tramo.factor;
        const topeB_uf = 600;
        const topeB = parseInt(topeB_uf*valorUF);
        let esTopeB = false;
        let beneficioAnualB = parseInt(aporteAnual*tasaB);
        if (beneficioAnualB >= topeB) {
            esTopeB = true;
            beneficioAnualB = topeB;
        }
        const beneficioMensualB = tipoAporte === "mensual" ? `$${formatoCL(beneficioAnualB/12)}` : "—";
        let boxB = document.createElement("div");
        boxB.classList.add("regimen-box");
        boxB.id = "regimen-b";
        boxB.innerHTML = `
            <div class="regimen-top">
                <div class="regimen-header">
                <h4>APV Régimen B</h4>
                <span class="badge-recomendado" style="display:none;">Recomendado</span>
                </div>
                <p class="descripcion">
                El ahorro voluntario se reduce de la renta imponible, lo que se traduce en una rebaja de impuestos (tope anual de ${topeB_uf} UF).<br>
                La tasa de impuesto a rebajar para la renta es del <strong>${formatoCL(tasaB*100, 2)}%</strong>.
                </p>
            </div>
            <hr style="margin: 0.2rem 0 0.1rem;">
            <div class="regimen-bottom">
                <h5>Rebaja tributaria</h5>
                <p>Mensual: <span id="beneficio-a-mensual"><strong>${beneficioMensualB}</strong></span></p>
                <p>Anual: <span id="beneficio-a-anual"><strong>$${formatoCL(beneficioAnualB)}${esTopeB ? " (tope)" : ""}</strong></span></p>
            </div>
        `;

        // recomendación de régimen
        let recomendado;
        const regimenGrid = document.getElementById("modal-regimen-grid");
        regimenGrid.innerHTML = "";
        if (beneficioAnualA > beneficioAnualB) {
            recomendado = "A";
            boxA.classList.add("recommended");
            boxA.querySelector(".badge-recomendado").style.display = "inline-block";
            boxB.classList.add("not-recommended");
        }
        else {
            recomendado = "B";
            boxB.classList.add("recommended");
            boxB.querySelector(".badge-recomendado").style.display = "inline-block";
            boxA.classList.add("not-recommended");
        }   
        regimenGrid.appendChild(boxA);
        regimenGrid.appendChild(boxB); 

        // datos rentabilidad
        datoAnios.textContent = `${anios} años`;
        datoTasa.textContent = `${formatoCL(tasa, 2)}%`;
        datoCobertura.textContent = `${formatoCL(cobertura)} UF`;

        // tabla de rentabilidad
        const tabla = crearTablaRentabilidad(tipoAporte, aporteAnual, tasa/100, 9, anios);
        escribirTablaHTML(tabla, tipoAporte, tasa/100);

        // actualizar simulación actual
        simulacionActual = {
            id: simulacionesGuardadas.length+1,

            inputs: {
                renta: renta,
                tipoAporte: tipoAporte,
                aporte: aporte,
                anios: anios,
                tasaRentabilidad: tasa,
                cobertura: cobertura
            },

            outputs: {
                regimenA: {
                    tasa: tasaA,
                    beneficioAnual: beneficioAnualA,
                    beneficioMensual: parseInt((beneficioAnualA/12).toFixed(0)),
                    esTope: esTopeA,
                    recomendado: recomendado === "A" ? true : false,
                    html: boxA.outerHTML // solo para mostrar en simulaciones guardadas
                },
                regimenB: {
                    tasa: tasaB,
                    beneficioAnual: beneficioAnualB,
                    beneficioMensual: parseInt((beneficioAnualB/12).toFixed(0)),
                    esTope: esTopeB,
                    recomendado: recomendado === "B" ? true : false,
                    html: boxB.outerHTML // solo para mostrar en simulaciones guardadas
                },
                tablaRentabilidad: tabla
            }
        }

        // mostrar modal
        modal.style.display = "block";
        modal.scrollTop = 0;
    }

    // --- Cerrar modal ---
    function cerrarModal() {
        simulacionActual = {};
        modal.style.display = "none";
    }
    // evento click fuera del modal
    window.onclick = function (event) {
        if (event.target === modal) {
            cerrarModal();
        }
    };
    btnCerrar.onclick = cerrarModal;

    // --- Guardar simulación ---
    btnGuardar.addEventListener("click", () => {
        // verificar si ya existe una simulación con los mismos datos
        const existe = simulacionesGuardadas.some(
            s => JSON.stringify(s.inputs) === JSON.stringify(simulacionActual.inputs)
        );
        if (existe) {
            alert("Esta simulación ya existe.");
            return;
        }

        // si no existe, guardarla
        simulacionesGuardadas.push(simulacionActual);
        agregarSimulacionBox(simulacionActual);
        cerrarModal();
    });

    // --- Eliminar simulación ---
    btnEliminar.addEventListener("click", () => {
        cerrarModal();
    });

    // --- Crear box de simulación guardada ---
    function agregarSimulacionBox(sim) {
        const box = document.createElement("div");
        box.classList.add("simulacion-box", "simulacion-guardada");

        let displayAporte;
        let datosRegimen;
        if (sim.inputs.tipoAporte === "mensual") {
            displayAporte = "table-cell";
            datosRegimen = `
                <div><strong>Renta bruta:</strong> $${formatoCL(sim.inputs.renta)}</div>
                <div style="text-align:center;"><strong>Aporte mensual:</strong> $${formatoCL(sim.inputs.aporte)}</div>
                <div style="text-align:end;"><strong>Aporte anual:</strong> $${formatoCL(sim.inputs.aporte*12)}</div>
            `;
        }
        else {
            displayAporte = "none";
            datosRegimen = `
                <div><strong>Renta bruta:</strong> $${formatoCL(sim.inputs.renta)}</div>
                <div style="text-align:center;"><strong>Aporte único:</strong> $${formatoCL(sim.inputs.aporte)}</div>
                <div></div>
            `;
        }

        box.innerHTML = `
            <div class="header-simulacion">
                <h1>Simulación #${sim.id}</h1>
                <span class="toggle-arrow">▾</span>
            </div>

            <hr style="margin: 0.6rem 0 0; display: none">

            <div class="resultados" style="display: none">

                <!-- ===== RÉGIMEN TRIBUTARIO ===== -->
                <section class="resultados-seccion">
                    <h2>Régimen tributario</h2>
                    <div class="resultados-datos">                        
                        ${datosRegimen}
                    </div>
                    <div class="regimen-grid">
                        ${sim.outputs.regimenA.html}
                        ${sim.outputs.regimenB.html}
                    </div>
                </section>

                <!-- ===== RENTABILIDAD ===== -->
                <section class="resultados-seccion">
                    <h2>Rentabilidad</h2>
                    <div class="resultados-datos">
                        <div><strong>Período:</strong> ${sim.inputs.anios} años</div>
                        <div style="text-align:center;"><strong>Tasa de rentabilidad:</strong> ${sim.inputs.tasaRentabilidad}%</div>
                        <div style="text-align:end;"><strong>Cobertura:</strong> ${sim.inputs.cobertura} UF</div>
                    </div>
                    <table class="tabla-rentabilidad">
                        <thead>
                            <tr>
                                <th>Año</th>
                                <th>Capital inicial</th>
                                <th style="display: ${displayAporte}">Aporte anual</th>
                                <th>Rentabilidad</th>
                                <th>Nuevo capital</th>
                                <th style="width: 90px">Costo cobertura (UF)</th>
                                <th class="capital-final-th">Capital final</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sim.outputs.tablaRentabilidad.map(f => `
                                <tr class="${f[0]%2 === 0 ? "row-gray" : "row-white"}">
                                    <td>${f[0]}</td>
                                    <td>$${formatoCL(f[1])}</td>
                                    <td style="display: ${displayAporte}">${f[2] === 0 ? "—" : "$" + formatoCL(f[2])}</td>
                                    <td>$${formatoCL(f[3])}</td>
                                    <td>$${formatoCL(f[4])}</td>
                                    <td>${f[5]}</td>
                                    <td class="capital-final-td">$${formatoCL(f[6])}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </section>

            </div>
        `;

        // --- expandir/colapsar ---
        const header = box.querySelector(".header-simulacion");
        const divisor = box.querySelector("hr");
        const contenido = box.querySelector(".resultados");
        const arrow = box.querySelector(".toggle-arrow");

        header.addEventListener("click", () => {
            const isVisible = contenido.style.display === "block";
            if (isVisible) {
                contenido.style.display = "none";
                divisor.style.display = "none";
                arrow.textContent = "▾";
            }
            else {
                contenido.style.display = "block";
                divisor.style.display = "block";
                arrow.textContent = "▴";
            }
        });

        // agregar al contenedor
        container.appendChild(box);

        // actualizar botón PDF
        actualizarBotonPDF();
    }

    // --- Botón generar PDF ---
    const btnPDF = document.getElementById("btn-pdf");
    const csrftoken = document.querySelector('meta[name="csrf-token"]').content;
    function generarNombrePDF() {
        const uuid = crypto.randomUUID();
        return `simulacion_APV_${uuid}.pdf`;
    }
    btnPDF.addEventListener("click", () => {
        // Evitar múltiples clics
        btnPDF.disabled = true;
        btnPDF.classList.add("btn-loading");
        const originalText = btnPDF.innerHTML;
        btnPDF.innerHTML = "Generando...";

        simulacionesGuardadas.forEach(sim => {
            delete sim.outputs.regimenA.html;
            delete sim.outputs.regimenB.html;
        });

        const data = {
            context: {
                valorUF: valorUF,
                valorUTM: valorUTM,
                tramos: tramos
            },
            simulaciones: simulacionesGuardadas
        };

        fetch("/pdf/", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken },
            body: JSON.stringify(data)
        }) // enviar POST a backend
        .then(res => res.blob()) // backend responde con PDF
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = generarNombrePDF();
            a.click();
            window.URL.revokeObjectURL(url);
        }) // crear url temporal para el PDF y simular click para descargar
        .catch(err => {
            alert("Error al generar PDF");
            console.error(err);
        })
        .finally(() => {
            btnPDF.disabled = false;
            btnPDF.classList.remove("btn-loading");
            btnPDF.innerHTML = originalText;
        });
    });

    // --- Actualizar botón PDF ---
    function actualizarBotonPDF() {
        if (simulacionesGuardadas.length > 0) {
            btnPDF.hidden = false;
        }
        else {
            btnPDF.hidden = true;
        }
    }
    
    // ---- Botón simular ----
    const btnSimular = document.getElementById("btn-simular");

    // crear contenedor para el mensaje de error (una sola vez)
    const errorMsg = document.createElement("div");
    errorMsg.id = "form-error-msg";
    errorMsg.style.color = "#d11a2a";
    errorMsg.style.marginTop = "0px";
    errorMsg.style.marginLeft = "2rem";
    errorMsg.style.fontWeight = "600";
    errorMsg.style.alignItems = "center";
    errorMsg.style.display = "none";
    //form.appendChild(errorMsg);
    const buttons = document.querySelector(".buttons");
    buttons.appendChild(errorMsg);

    btnSimular.addEventListener("click", (e) => {
        e.preventDefault();

        // limpiar estilos previos
        [rentaInput, aporteInput, tasaInput, aniosInput, coberturaInput].forEach((input) => {
            input.style.borderColor = "#ccc";
        });
        errorMsg.style.display = "none";

        // obtener valores limpios
        const renta = rentaInput.value.trim().replace(/\./g, "");
        const tipoAporte = tipoAporteSelect.value;
        const monedaAporte = monedaAporteSelect.value;
        const aporte = aporteInput.value.trim().replace(/\./g, "").replace(",", ".");
        const tasa = tasaInput.value.trim().replace(",", ".");
        const anios = aniosInput.value.trim();
        const cobertura = coberturaInput.value.trim().replace(/\./g, "");

        // validaciones básicas
        let camposInvalidos = [];
        let mensaje = "";

        if (renta === "" || isNaN(renta) || parseInt(renta) <= 0) {
            camposInvalidos.push(rentaInput);
            mensaje = "Ingresa una renta válida mayor que 0";
        } 
        else if (aporte === "" || isNaN(aporte) || parseFloat(aporte) <= 0) {
            camposInvalidos.push(aporteInput);
            mensaje = "Ingresa un aporte válido mayor que 0";
        }
        else if (tasa === "" || isNaN(tasa) || parseFloat(tasa) < 0 || parseFloat(tasa) > 100) {
            camposInvalidos.push(tasaInput);
            mensaje = "Ingresa una tasa entre 0 y 100";
        }
        else if (anios === "" || isNaN(anios) || parseInt(anios) < 1 || parseInt(anios) > 30) {
            camposInvalidos.push(aniosInput);
            mensaje = "Ingresa un número de años entre 1 y 30";
        }
        else if (cobertura === "" || isNaN(cobertura) || parseInt(cobertura) < 0 || parseInt(cobertura) > 99999) {
            camposInvalidos.push(coberturaInput);
            mensaje = "Ingresa una cobertura válida entre 0 y 99.999 UF";
        }

        if (camposInvalidos.length > 0) {
            camposInvalidos.forEach((input) => {
            input.style.borderColor = "#d11a2a";
            });
            errorMsg.textContent = mensaje || "Rellena los campos faltantes";
            errorMsg.style.display = "flex";
            return; // No continuar
        }

        // parsear a enteros
        const rentaNum = parseInt(renta);
        const aporteNum = monedaAporte === "CLP" ? parseInt(aporte) : parseInt(aporte*valorUF);
        const coberturaNum = parseInt(cobertura);
        const aniosNum = parseInt(anios);
        const tasaNum = parseFloat(tasa);

        // --- Validar duplicados ---
        const simulacionInputs = {
            renta: rentaNum,
            tipoAporte: tipoAporte,
            aporte: aporteNum,
            anios: aniosNum,
            tasaRentabilidad: tasaNum,
            cobertura: coberturaNum
        }
        const existe = simulacionesGuardadas.some(
            s => JSON.stringify(s.inputs) === JSON.stringify(simulacionInputs)
        );
        if (existe) {
            errorMsg.textContent = "Esta simulación ya existe";
            errorMsg.style.display = "flex";
            return;
        }

        // si todo está bien -> abrir modal
        abrirModal(rentaNum, tipoAporte, aporteNum, aniosNum, tasaNum, coberturaNum);
    });

});