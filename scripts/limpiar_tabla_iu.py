import pandas as pd
import numpy as np

def limpiar_valor(valor):
    """Convierte un valor de texto del Excel del SII a número limpio (float)."""
    if pd.isna(valor):
        return np.nan
    valor = str(valor).strip()
    if valor in ["-.-", "Exento", "EXENTO"]:
        return 0.0
    if "Y MÁS" in valor.upper():
        return "Y MÁS"
    valor = (valor.replace("$", "")
                   .replace(".", "")
                   .replace(",", ".")
                   .replace("%", "")
                   .replace(" ", ""))
    try:
        return float(valor)
    except ValueError:
        return np.nan

def limpiar_tabla_iu(archivo_origen, archivo_salida_csv=None):
    # leer todo el Excel sin encabezados
    df_raw = pd.read_excel(archivo_origen, header=None, dtype=str)

    # empezar desde la cuarta fila (índice 3) — ajusta si cambia
    df = df_raw.iloc[3:].reset_index(drop=True)

    # columnas esperadas: Desde, Hasta, Factor, Rebaja
    columnas = ["Desde", "Hasta", "Factor", "Rebaja"]
    df = df.iloc[:, 1:5].copy()  # ajusta si las columnas están corridas

    df.columns = columnas

    registros = []
    for _, row in df.iterrows():
        desde = limpiar_valor(row["Desde"])
        hasta = limpiar_valor(row["Hasta"])
        factor = limpiar_valor(row["Factor"])
        rebaja = limpiar_valor(row["Rebaja"])

        # cortar cuando llega a "Y MÁS"
        if isinstance(hasta, str) and "Y MÁS" in hasta:
            registros.append({
                "Desde": desde,
                "Hasta": np.nan,
                "Factor": factor,
                "Rebaja": rebaja
            })
            break

        # omitir filas vacías
        if pd.isna(desde) and pd.isna(hasta):
            continue

        registros.append({
            "Desde": desde,
            "Hasta": hasta,
            "Factor": factor,
            "Rebaja": rebaja
        })

    df_limpia = pd.DataFrame(registros)

    # opcional: guardar a CSV
    if archivo_salida_csv:
        df_limpia.to_csv(archivo_salida_csv, index=False)
        print(f"Tabla limpia exportada: {archivo_salida_csv}")

    return df_limpia

if __name__ == "__main__":
    tabla = limpiar_tabla_iu("planillas/impuesto_unico.xlsx", "planillas/impuesto_unico_limpia.csv")
    print(tabla)
