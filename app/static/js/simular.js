
document.addEventListener("DOMContentLoaded", () => {

    // --- Elementos ---
    const container = document.getElementById("simulacion-container");
    const form = document.getElementById("form");
    const rentaInput = form.querySelector("#renta");
    const aporteInput = form.querySelector("#aporte");
    const tipoAporteSelect = form.querySelector("#tipo-aporte");
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
    const formatearTasa = (input) => {
        let val = input.value;
        if (val === "") return;
        let num = parseFloat(val.replace(",", "."));
        if (num < 0) input.value = "0";
        if (num > 100) input.value = "100";
        if (val.length > 5) input.value = val.slice(0, 5);
    };

    // --- Formatear años ---
    const formatearAnios = (input) => {
        let v = input.value.replace(/\D/g, "");
        if (v === "") { input.value = ""; return; }

        let num = parseInt(v, 10);
        if (num < 1) num = 1;
        if (num > 30) num = 30;

        input.value = num;
    };

    // --- Formatear cobertura ---
    let coberturaTimeout;
    const formatearCobertura = (input) => {
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
        const tipo = tipoAporteSelect.value;
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
        if (tipo === "UF") {
            // num = UF units -> mostrar CLP
            if (!valorUF) {
            preview.textContent = "UF no disponible";
            return;
            }
            const clp = num * valorUF;
            preview.textContent = `${clp.toLocaleString("es-CL")} CLP`;
        } else {
            // tipo CLP -> mostrar UF (4 decimales, comma)
            if (!valorUF) {
            preview.textContent = "UF no disponible";
            return;
            }
            const uf = num / valorUF;
            // formatear con 4 decimales y coma decimal
            const ufFormatted = uf.toFixed(1).replace(".", ",");
            preview.textContent = `${ufFormatted} UF`;
        }
    }

    // ---- Eventos ----
    rentaInput.addEventListener("input", () => formatearCLP(rentaInput));

    aporteInput.addEventListener("input", () => {
        formatearCLP(aporteInput);
        actualizarPreview();
        });

        // cuando cambie tipo actualizar placeholder y preview
        tipoAporteSelect.addEventListener("change", () => {
        if (tipoAporteSelect.value === "UF") {
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
    //const tablaRentabilidad = modal.querySelector(".tabla-rentabilidad");
    const tablaBody = document.getElementById("tabla-rentabilidad-body");
    const btnCerrar = document.getElementById("modal-cerrar");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnEliminar = document.getElementById("btn-eliminar");

    const datoRenta = document.getElementById("dato-renta");
    const datoAporte = document.getElementById("dato-aporte");
    const datoAporteAnual = document.getElementById("dato-aporte-anual");
    const datoAnios = document.getElementById("dato-anios");
    const datoTasa = document.getElementById("dato-tasa");
    const datoCobertura = document.getElementById("dato-cobertura");

    // lista de simulaciones guardadas y la actual
    let simulacionesGuardadas = [];
    let simulacionActual = {};

    // --- Funciones tabla de rentabilidad ---
    function crearTablaRentabilidad(aporteAnual, tasaRentabilidad, costoInicial, numAnios) {
        let anio = 1;
        let capital = aporteAnual;
        let rentabilidad = parseInt(capital*tasaRentabilidad);
        let nuevoCapital = capital+rentabilidad;
        let costoUF = costoInicial;
        let costoCLP = parseInt(costoUF*valorUF);
        let capitalFinal = nuevoCapital-costoCLP;
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
            capitalFinal = nuevoCapital-costoCLP;
            let fila = [anio, capital, aporteAnual, rentabilidad, nuevoCapital, costoUF, capitalFinal];
            tabla.push(fila);
        }
        return tabla;
    }

   function escribirTablaHTML(tabla, tasaRentabilidad) {
        const largo = tabla.length;
        tablaBody.textContent = "";
        for (let i = 0; i < largo; i++) {
            const fila = tabla[i];
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${fila[0]}</td>
                <td>$${fila[1].toLocaleString("es-CL")}</td>
                <td>${i === 0 ? "—" : "$" + fila[2].toLocaleString("es-CL")}</td>
                <td>$${fila[3].toLocaleString("es-CL")}</td>
                <td>$${fila[4].toLocaleString("es-CL")}</td>
                <td class="costo-uf-cell">
                    <button class="btn-uf menos">−</button>
                    <input type="text" class="input-costo-uf" value="${fila[5]}">
                    <button class="btn-uf mas">+</button>
                </td>
                <td class="capital-final-td">
                    $${fila[6].toLocaleString("es-CL")}
                </td>
            `;
            const estilo = i%2 === 0 ? "row-white" : "row-gray";
            tr.classList.add(estilo);
            tablaBody.appendChild(tr);
        }
        activarEventosCosto(tabla, tasaRentabilidad);
    }

    function actualizarTabla(tabla, nuevoCosto, indice, tasaRentabilidad) {
        let fila = tabla[indice];
        let anio = fila[0];
        let capital = fila[1];
        let aporteAnual = fila[2];
        let rentabilidad = fila[3];
        let nuevoCapital = fila[4];
        let costoUF = nuevoCosto;
        let costoCLP = parseInt(costoUF*valorUF);
        let capitalFinal = nuevoCapital-costoCLP;
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
            capitalFinal = nuevoCapital-costoCLP;
            fila = [anio, capital, aporteAnual, rentabilidad, nuevoCapital, costoUF, capitalFinal];
            tabla[i] = fila;
        }
        simulacionActual.tablaRentabilidad = tabla;
        escribirTablaHTML(tabla, tasaRentabilidad);
    }

    function activarEventosCosto(tabla, tasaRentabilidad) {
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
                let v = parseInt(inputUF.value, 10);
                if (isNaN(v)) v = 0;
                if (v < 99) v++;
                inputUF.value = v;
                // actualizar inmediatamente (botones confirman cambio)
                actualizarTabla(tabla, v, i, tasaRentabilidad);
            });

            btnMenos.addEventListener("click", () => {
                let v = parseInt(inputUF.value, 10);
                if (isNaN(v)) v = 0;
                if (v > 0) v--;
                inputUF.value = v;
                actualizarTabla(tabla, v, i, tasaRentabilidad);
            });

            // limitar caracteres pero sin actualizar la tabla
            inputUF.addEventListener("input", () => {
                // permitir solo dígitos y máximo 2 caracteres visibles
                let s = inputUF.value.replace(/\D/g, "");
                if (s.length > 2) s = s.slice(0, 2);
                inputUF.value = s;
            });

            // función local para confirmar y aplicar cambio desde blur/enter
            function commitInputCambio(indexFila) {
                let v = parseInt(inputUF.value, 10);
                if (isNaN(v) || v < 0) v = 0;
                if (v > 99) v = 99;
                inputUF.value = v;
                actualizarTabla(tabla, v, indexFila, tasaRentabilidad);
            }
        });
    }


    // --- Modal con resultados ---
    function abrirModal(renta, aporte, aporteAnual, anios, tasa, cobertura) {

        // datos régimen tributario
        datoRenta.textContent = `$${renta.toLocaleString("es-CL")}`;
        datoAporte.textContent = `$${aporte.toLocaleString("es-CL")}`
        datoAporteAnual.textContent = `$${aporteAnual.toLocaleString("es-CL")}`

        // régimen A
        const tasaA = 0.15;
        const topeA_utm = 6;
        const topeA_mensual = parseInt((topeA_utm*valorUTM)/12);
        let topeA_str = "";
        let beneficioA = parseInt(aporte*tasaA);
        if (beneficioA >= topeA_mensual) {
            topeA_str = " (tope)";
            beneficioA = topeA_mensual;
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
                El Estado entrega una bonificación anual del <strong>${(tasaA*100).toLocaleString("es-CL")}%</strong> del aporte, con un tope de 6 UTM.
                </p>
            </div>
            <hr style="margin: 0.2rem 0 0.1rem;">
            <div class="regimen-bottom">
                <h5>Bonificación fiscal</h5>
                <p>Mensual: <span id="beneficio-a-mensual"><strong>$${beneficioA.toLocaleString("es-CL")}</strong></span></p>
                <p>Anual: <span id="beneficio-a-anual"><strong>$${(beneficioA*12).toLocaleString("es-CL")}${topeA_str}</strong></span></p>
            </div>
        `;

        // régimen B
        const tramo = tramos.find(t => 
            renta >= t.desde && (t.hasta === null || renta < t.hasta)
        );
        const tasaB = tramo.factor;
        const topeB_uf = 600;
        const topeB_mensual = parseInt((topeB_uf*valorUF)/12);
        let topeB_str = "";
        let beneficioB = parseInt(aporte*tasaB);
        if (beneficioB >= topeB_mensual) {
            topeB_str = " (tope)";
            beneficioB = topeB_mensual;
        }
        
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
                El ahorro voluntario se reduce de la renta imponible, lo que se traduce en una rebaja de impuestos.<br>
                La tasa de impuesto a rebajar para la renta es del <strong>${(tasaB*100).toLocaleString("es-CL")}%</strong>.
                </p>
            </div>
            <hr style="margin: 0.2rem 0 0.1rem;">
            <div class="regimen-bottom">
                <h5>Rebaja tributaria</h5>
                <p>Mensual: <span id="beneficio-a-mensual"><strong>$${beneficioB.toLocaleString("es-CL")}</strong></span></p>
                <p>Anual: <span id="beneficio-a-anual"><strong>$${(beneficioB*12).toLocaleString("es-CL")}${topeB_str}</strong></span></p>
            </div>
        `;

        // recomendación de régimen
        let recomendado = "";
        const regimenGrid = document.getElementById("modal-regimen-grid");
        regimenGrid.innerHTML = "";
        if (beneficioA > beneficioB) {
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
        datoTasa.textContent = `${tasa}%`;
        datoCobertura.textContent = `${parseInt(cobertura).toLocaleString("es-CL")} UF`;

        // tabla de rentabilidad
        const tabla = crearTablaRentabilidad(aporteAnual, tasa/100, 9, anios);
        escribirTablaHTML(tabla, tasa/100);

        // actualizar simulación actual
        simulacionActual = {
            id: simulacionesGuardadas.length+1,

            inputs: {
                renta: renta,
                aporteMensual: aporte,
                aporteAnual: aporteAnual,
                tasaRentabilidad: tasa,
                anios: anios,
                cobertura: cobertura
            },

            outputs: {
                tasaImpuestos: tasaB,
                regimenA: {
                    beneficioMensual: beneficioA,
                    html: boxA.outerHTML 
                },
                regimenB: {
                    beneficioMensual: beneficioB,
                    html: boxB.outerHTML
                },
                recomendado: recomendado,
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
                        <div><strong>Renta bruta:</strong> $${sim.inputs.renta.toLocaleString("es-CL")}</div>
                        <div style="text-align:center;"><strong>Aporte mensual:</strong> $${sim.inputs.aporteMensual.toLocaleString("es-CL")}</div>
                        <div style="text-align:end;"><strong>Aporte anual:</strong> $${sim.inputs.aporteAnual.toLocaleString("es-CL")}</div>
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
                                <th>Aporte anual</th>
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
                                    <td>$${f[1].toLocaleString("es-CL")}</td>
                                    <td>${f[2] === 0 ? "—" : "$" + f[2].toLocaleString("es-CL")}</td>
                                    <td>$${f[3].toLocaleString("es-CL")}</td>
                                    <td>$${f[4].toLocaleString("es-CL")}</td>
                                    <td>${f[5]}</td>
                                    <td class="capital-final-td">$${f[6].toLocaleString("es-CL")}</td>
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
    btnPDF.addEventListener("click", () =>
        alert("Generar PDF con todas las simulaciones (en desarrollo)")
    );

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
    errorMsg.style.marginLeft = "1px";
    errorMsg.style.fontWeight = "600";
    errorMsg.style.display = "none";
    form.appendChild(errorMsg);

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
            errorMsg.style.display = "block";
            return; // No continuar
        }

        // parsear a enteros
        const rentaNum = parseInt(renta);
        let aporteNum = 0;
        if (tipoAporte === "CLP") {
            aporteNum = parseInt(aporte);
        }
        else {
            aporteNum = parseInt(aporte*valorUF);
        }
        const aporteAnualNum = aporteNum*12;
        const coberturaNum = parseInt(cobertura);
        const aniosNum = parseInt(anios);
        const tasaNum = parseFloat(tasa);

        // --- Validar duplicados ---
        const simulacionInputs = {
            renta: rentaNum,
            aporteMensual: aporteNum,
            aporteAnual: aporteNum*12,
            tasaRentabilidad: tasaNum,
            anios: aniosNum,
            cobertura: coberturaNum
        }
        const existe = simulacionesGuardadas.some(
            s => JSON.stringify(s.inputs) === JSON.stringify(simulacionInputs)
        );
        if (existe) {
            errorMsg.textContent = "Esta simulación ya existe";
            errorMsg.style.display = "block";
            return;
        }

        // si todo está bien -> abrir modal
        abrirModal(rentaNum, aporteNum, aporteAnualNum, aniosNum, tasaNum, coberturaNum);
    });

});
