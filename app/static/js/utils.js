export function formatoPesos(valor) {
    if (isNaN(valor)) return "0";
    return valor.toLocaleString("es-CL", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export function formatoLimpio(valor) {
    return valor.replace(".", "").replace(",", ".");
}

export function numMesToNombre(num_mes) {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
        'Junio', 'Julio', 'Agosto', 'Septiembre',
        'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[num_mes - 1];
}