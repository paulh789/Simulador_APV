from django import template
import locale

register = template.Library()
locale.setlocale(locale.LC_ALL, 'es_CL.UTF-8')

@register.filter
def formatoCL(n):
    """
    Convierte el número n al formato chileno con punto separador de miles 
    y coma separador decimal.
    """
    s = str(n)
    if "." in s:
        _, dec = s.split(".")
    else:
        dec = ""
    return locale.format_string(f"%.{len(dec) if dec != "0" else 0}f", n, grouping=True)

@register.filter
def porcentaje(t):
    """
    Convierte una tasa a porcentaje.
    """
    return formatoCL(t*100)

@register.filter
def nombre_mes(num):
    """
    Convierte un número de mes a su nombre.
    """
    meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo',
        'Junio', 'Julio', 'Agosto', 'Septiembre',
        'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[num-1]

@register.filter
def mensualToAnual(n):
    """
    Convierte un valor mensual a anual en formato chileno.
    """
    return formatoCL(n*12)