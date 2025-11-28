export function formatoCL(valor, max_dec=0) {
    if (isNaN(valor)) return "0";
    return parseFloat(valor.toFixed(max_dec)).toLocaleString("es-CL");
}
