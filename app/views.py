from django.shortcuts import render
from app.utils import obtener_datos, render_pdf_from_html
from django.http import HttpResponse
from django.template.loader import render_to_string
import json
import uuid
import os

def simular(request):
    indicadores, tramos = obtener_datos(tramos_as_json=True)
    data = {
        'active_page': 'simular',
        'indicadores': indicadores,
        'tramos': tramos,
    }
    return render(request, 'simular.html', data)

def indicadores(request):
    indicadores, tramos = obtener_datos()
    data = {
        'active_page': 'indicadores',
        'indicadores': indicadores,
        'tramos': tramos,
    }
    return render(request, 'indicadores.html', data)

def pdf_simulacion(request):
    
    # Obtener data
    data = json.loads(request.body)

    # Renderizar template HTML
    html_string = render_to_string("pdf_simulacion.html", data)

    # Generar nombre temporal del PDF
    filename = f"{uuid.uuid4()}.pdf"
    pdf_path = os.path.join("media/temp", filename)

    # Intentar generar el PDF con Playwright
    pdf_ok = render_pdf_from_html(html_string, pdf_path)

    if not pdf_ok:
        # Playwright no instalado, se retorna el HTML
        return HttpResponse(html_string, content_type="text/html")

    # Devolver el PDF como descarga
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()

    # Borrar archivo temporal
    try:
        os.remove(pdf_path)
    except FileNotFoundError:
        pass

    return HttpResponse(pdf_data, content_type="application/pdf")