from django import template
import locale

register = template.Library()
locale.setlocale(locale.LC_ALL, 'es_CL.UTF-8')

@register.simple_tag
def mult(n, m):
    """
    Multiplica dos números y retorna el resultado en formato chileno.
    """
    return locale.format_string(f"%d", n*m, grouping=True)