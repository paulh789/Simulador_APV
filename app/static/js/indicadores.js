import { formatoCL } from './utils.js';

document.addEventListener("DOMContentLoaded", () => {

    // --- Mostrar indicadores ---
    const elems = {
        uf: document.getElementById("uf"),
        utm: document.getElementById("utm"),
        dolar: document.getElementById("dolar"),
    };

    const valores = {
        uf: parseFloat(elems.uf.dataset.valor.replace(",", ".")),
        utm: parseFloat(elems.utm.dataset.valor.replace(",", ".")),
        dolar: parseFloat(elems.dolar.dataset.valor.replace(",", ".")),
    };

    elems.uf.textContent = `$${formatoCL(valores.uf, 2)}`;
    elems.utm.textContent = `$${formatoCL(valores.utm, 2)}`;
    elems.dolar.textContent = `$${formatoCL(valores.dolar, 2)}`;

    // --- Formatear input ---
    function formatearInput(input) {
        let val = input.value;
        if (val === "") return;
        let num = parseFloat(val.replace(",", "."));
        if (num < 0) input.value = "0";
        if (num > 999999999999999) input.value = "999999999999999";
        if (val.length > 15) input.value = val.slice(0, 15);
    };
    
    // --- Función de conversión ---
    const valorInput = document.getElementById("valor");
    const tipoSelect = document.getElementById("tipo");
    const resultadoDiv = document.getElementById("resultado");

    function convertir() {
        const valor = parseFloat(valorInput.value);
        const tipo = tipoSelect.value;

        if (isNaN(valor) || valor <= 0) {
            resultadoDiv.textContent = "";
            return;
        }

        let resultado = 0;
        let texto = "";

        switch (tipo) {
            case "uf":
                resultado = valor * valores.uf;
                texto = `${formatoCL(valor, 2)} UF = ${formatoCL(resultado, 2)} CLP`;
                break;
            case "utm":
                resultado = valor * valores.utm;
                texto = `${formatoCL(valor, 2)} UTM = ${formatoCL(resultado, 2)} CLP`;
                break;
            case "dolar":
                resultado = valor * valores.dolar;
                texto = `${formatoCL(valor, 2)} USD = ${formatoCL(resultado, 2)} CLP`;
                break;
            case "clp_uf":
                resultado = valor / valores.uf;
                texto = `${formatoCL(valor, 2)} CLP = ${formatoCL(resultado, 2)} UF`;
                break;
            case "clp_utm":
                resultado = valor / valores.utm;
                texto = `${formatoCL(valor, 2)} CLP = ${formatoCL(resultado, 2)} UTM`;
                break;
            case "clp_dolar":
                resultado = valor / valores.dolar;
                texto = `${formatoCL(valor, 2)} CLP = ${formatoCL(resultado, 2)} USD`;
                break;
            default:
                texto = "Conversión no reconocida.";
        }
        resultadoDiv.textContent = texto;
    }

    // --- Eventos ---
    tipoSelect.addEventListener("input", convertir);
    valorInput.addEventListener("input", () => {
        formatearInput(valorInput);
        convertir();
    });

});
