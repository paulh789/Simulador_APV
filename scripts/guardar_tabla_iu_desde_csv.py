import pandas as pd
import numpy as np
from django.utils import timezone
from app.models import *

def guardar_tabla_iu_desde_csv(archivo_csv):
    try:
        df = pd.read_csv(archivo_csv)
        df = df.replace({pd.NA: None, np.nan: None, "": None})

        hoy = timezone.now()
        anio = hoy.year
        mes = hoy.month
        # eliminar registros del mismo mes/año antes de insertar
        TramoImpuesto.objects.filter(anio=anio, mes=mes).delete()
        for _, fila in df.iterrows():
            TramoImpuesto.objects.create(
                desde = fila["Desde"],
                hasta = fila["Hasta"],  # quedará None si es NaN
                factor = fila["Factor"],
                rebaja = fila["Rebaja"],
                anio = anio,
                mes = mes,
            )
        print(f"Tabla de Impuesto Único actualizada ({mes}/{anio}) con {len(df)} tramos.")
    except Exception as e:
        print(f"Error al guardar tabla IU: {e}")

if __name__ == "__main__":
    guardar_tabla_iu_desde_csv("planillas/impuesto_unico_limpia.csv")