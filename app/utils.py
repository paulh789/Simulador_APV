from django.utils import timezone
import requests
from bs4 import BeautifulSoup
from app.models import *
import json
try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_ENABLED = True
except ImportError:
    PLAYWRIGHT_ENABLED = False

def actualizar_datos():
    """
    Actualiza los indicadores diarios y la tabla de impuesto único en la BD.
    Si los datos almacenados ya están actualizados no se hace nada y retorna 0, sino, 
    se obtienen de páginas web y se guardan en la BD, retornando 1. Si hay error se
    retorna -1.
    """
    # Indicadores
    now = timezone.localtime(timezone.now()).date()
    print(now.strftime("%d/%m/%Y"))
    indicadores = Indicadores.objects.last()
    estado = 0
    # Si no hay datos guardados aún o están desactualizados:
    if not indicadores or indicadores.fecha_actualizacion < now:
        try:
            # API mindicador.cl
            data = requests.get("https://mindicador.cl/api").json()
            fecha_data = data["fecha"].split("T")[0]
            nuevos_datos = {"fecha_actualizacion": fecha_data,
                            "uf": data["uf"]["valor"],
                            "utm": data["utm"]["valor"],
                            "dolar": data["dolar"]["valor"]}
            guardar_indicadores(nuevos_datos)
            estado = 1
        except Exception as e:
            # usar los últimos datos si falla
            print("Error al actualizar indicadores:", e)
            estado = -1
    else: 
        print("Indicadores ya están actualizados")

    # Tabla IU
    ultimo_tramo = TramoImpuesto.objects.last()
    # Si no hay datos guardados aún o están desactualizados:
    if not ultimo_tramo or f"{ultimo_tramo.anio}-{ultimo_tramo.mes}" < now.strftime('%Y-%m'):
        try:
            # Scraping de sii.cl
            tramos = scrapear_tabla_impuestos(now.year)
            guardar_tabla_impuestos(tramos)
        except Exception as e:
            print("Error al actualizar tabla:", e)
            estado = -1
    else:
        print("Tabla IU ya está actualizada")
    return estado

def obtener_datos(tramos_as_json=False):
    """
    Obtiene los indicadores diarios y la tabla de impuesto único desde la BD.
    """
    # Indicadores actualizados
    indicadores = Indicadores.objects.last()
    # Tabla de impuesto actualizada
    ultimo_tramo = TramoImpuesto.objects.order_by('-anio', '-mes').first()
    tramos = []
    if ultimo_tramo:
        tramos = TramoImpuesto.objects.filter(anio=ultimo_tramo.anio, mes=ultimo_tramo.mes).order_by('desde')
        if tramos_as_json:
            # Convertir queryset a JSON simple
            tramos = json.dumps(list(tramos.values('desde', 'hasta', 'factor', 'rebaja', 'anio', 'mes')))
    return indicadores, tramos

def guardar_indicadores(datos):
    """
    Recibe los indicadores en un diccionario y los guarda en la BD.
    """
    # Si ya existe un registro para hoy, se actualiza
    indicador, creado = Indicadores.objects.update_or_create(
        fecha_actualizacion = datos["fecha_actualizacion"],
        defaults = {
            "uf": datos["uf"],
            "utm": datos["utm"],
            "dolar": datos["dolar"],
        },
    )
    print(f"Indicadores guardados correctamente ({'nuevo' if creado else 'actualizado'})")

def limpiar_valor_tabla_impuestos(valor):
    """
    Limpia los valores de la tabla de impuestos del SII.
    """
    valor = str(valor).strip()
    if valor in ["-.-", "Exento", "EXENTO"]:
        return 0.0
    if "Y MÁS" in valor.upper():
        return None
    valor = (valor.replace("$", "")
                   .replace(".", "")
                   .replace(",", ".")
                   .replace("%", "")
                   .replace(" ", ""))
    try:
        return float(valor)
    except ValueError:
        return None
    
def nombre_mes_to_num(nombre_mes):
    """
    Retorna el número del mes dado.
    """
    meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    return meses.index(nombre_mes.lower()) + 1

def num_mes_to_nombre(num_mes):
    """
    Retorna el nombre del mes (en lowercase) a partir de su número.
    """
    meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    return meses[num_mes-1]

def scrapear_tabla_impuestos(anio):
    """
    Obtiene los tramos de la tabla de impuesto único desde la página web del SII.
    """
    url = f"https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto{anio}.htm"
    
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
        "Referer": "https://www.sii.cl/",
    }

    r = requests.get(url, headers=headers)
    r.raise_for_status() # levanta error si falla la request

    soup = BeautifulSoup(r.content, "html.parser")

    # Buscar el div que contiene la tabla del último mes
    meses_divs = soup.find_all("div", class_="meses")
    if not meses_divs:
        raise ValueError("No se encontraron divs de meses en la página")

    # Elegimos el último div visible
    ultimo_div = meses_divs[0]

    # Extraemos año y mes del h3
    h3 = ultimo_div.find("h3")
    if not h3:
        raise ValueError("No se encontró h3 con mes y año")
    
    # Ej: "Noviembre 2025"
    mes_text, anio_text = h3.text.strip().split(" ")
    mes_num = nombre_mes_to_num(mes_text)
    anio_num = int(anio_text)

    # Encontramos la tabla
    tabla = ultimo_div.find("table")
    if not tabla:
        raise ValueError("No se encontró la tabla en el div")

    # Recorremos filas
    tramos = []
    filas = tabla.find_all("tr")[3:] # saltamos encabezados
    for fila in filas:
        celdas = fila.find_all("td")
        if len(celdas) < 6:
            continue # ignoramos filas incompletas
        periodo = celdas[0].text.strip()
        if periodo != "" and periodo.upper() != "MENSUAL":
            return tramos # solo interesa mensual
        desde_val = limpiar_valor_tabla_impuestos(celdas[1].text.strip())
        hasta_val = limpiar_valor_tabla_impuestos(celdas[2].text.strip())
        factor_val = limpiar_valor_tabla_impuestos(celdas[3].text.strip())
        rebaja_val = limpiar_valor_tabla_impuestos(celdas[4].text.strip())
        tramo = {
            "desde": desde_val,
            "hasta": hasta_val,
            "factor": factor_val,
            "rebaja": rebaja_val,
            "anio": anio_num,
            "mes": mes_num
        }
        tramos.append(tramo)

def guardar_tabla_impuestos(tramos):
    """
    Guarda los tramos de la tabla de IU en la BD.
    """
    for tramo in tramos:
        TramoImpuesto.objects.create(
            anio = tramo["anio"],
            mes = tramo["mes"],
            desde = tramo["desde"],
            hasta = tramo["hasta"],
            factor = tramo["factor"],
            rebaja = tramo["rebaja"],
        )
    print(f"Tabla IU guardada correctamente")

def render_pdf_from_html(html_content: str, pdf_path: str):
    """
    Genera un PDF en la ruta especificada a partir de un HTML.
    Retorna True si se logra generar el PDF y False en caso contrario.
    """
    if PLAYWRIGHT_ENABLED:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Cargar el HTML directamente
            page.set_content(html_content, wait_until="networkidle")

            # Exportar el PDF
            page.pdf(
                path=pdf_path,
                format="A4",
                scale=0.825,
                margin={"top": "40px", "bottom": "40px", "left": "20px", "right": "20px"},
                print_background=True,
            )

            browser.close()
            return True
    return False