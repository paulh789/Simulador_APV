import { formatoPesos, numMesToNombre } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {
    const indicadoresDiv = document.getElementById("indicadores");
    if (!indicadoresDiv) return;

    // Obtener spans de los indicadores
    const elems = {
        uf: document.getElementById("uf"),
        utm: document.getElementById("utm"),
        dolar: document.getElementById("dolar"),
    };

    // Tomar los valores de los data-atributos
    const valores = {
        uf: parseFloat(elems.uf.dataset.valor),
        utm: parseFloat(elems.utm.dataset.valor),
        dolar: parseFloat(elems.dolar.dataset.valor),
    };

    // Mostrar formateado
    elems.uf.textContent = `$${formatoPesos(valores.uf)}`;
    elems.utm.textContent = `$${formatoPesos(valores.utm)}`;
    elems.dolar.textContent = `$${formatoPesos(valores.dolar)}`;

    // Guardar para la conversión
    window.tasas = valores;

    window.convertir = function () {
        const valorInput = document.getElementById("valor");
        const tipoSelect = document.getElementById("tipo");
        const resultadoDiv = document.getElementById("resultado");

        const valor = parseFloat(valorInput.value);
        const tipo = tipoSelect.value;

        if (isNaN(valor) || valor <= 0) {
            //resultadoDiv.textContent = "Por favor ingresa un monto válido.";
            resultadoDiv.textContent = "";
            return;
        }

        let resultado = 0;
        let texto = "";

        switch (tipo) {
            case "uf":
                resultado = valor * valores.uf;
                texto = `${formatoPesos(valor)} UF = ${formatoPesos(resultado)} CLP`;
                break;
            case "utm":
                resultado = valor * valores.utm;
                texto = `${formatoPesos(valor)} UTM = ${formatoPesos(resultado)} CLP`;
                break;
            case "dolar":
                resultado = valor * valores.dolar;
                texto = `${formatoPesos(valor)} USD = ${formatoPesos(resultado)} CLP`;
                break;
            case "clp_uf":
                resultado = valor / valores.uf;
                texto = `${formatoPesos(valor)} CLP = ${formatoPesos(resultado)} UF`;
                break;
            case "clp_utm":
                resultado = valor / valores.utm;
                texto = `${formatoPesos(valor)} CLP = ${formatoPesos(resultado)} UTM`;
                break;
            case "clp_dolar":
                resultado = valor / valores.dolar;
                texto = `${formatoPesos(valor)} CLP = ${formatoPesos(resultado)} USD`;
                break;
            default:
                texto = "Conversión no reconocida.";
        }

        resultadoDiv.textContent = texto;
    };

    // --- Formatear título de la tabla ---
    const titulo = document.getElementById("titulo-tabla");
    if (titulo) {
        const mes = parseInt(titulo.dataset.mes);
        const anio = titulo.dataset.anio;
        const nombreMes = numMesToNombre(mes);
        titulo.textContent = `Tabla de Impuesto Único (${nombreMes} ${anio})`;
    }

    // --- Formatear todos los valores CLP en la tabla ---
    const celdasCLP = document.querySelectorAll('#tabla-impuesto [data-tipo="clp"]');
    celdasCLP.forEach(td => {
        const texto = td.textContent.trim();
        // Ignorar si es "y más"
        if (texto.includes('MÁS')) return;
        const valor = parseFloat(texto);
        if (!isNaN(valor)) {
        td.textContent = `$${formatoPesos(valor)}`;
        }
    });
});
