from django.shortcuts import render
from app.utils import Indicadores, TramoImpuesto

def simular(request):
    indicadores = Indicadores.objects.last()
    ultimo_tramo = TramoImpuesto.objects.order_by('-anio', '-mes').first()
    tramos = []
    if ultimo_tramo:
        tramos = TramoImpuesto.objects.filter(anio=ultimo_tramo.anio, mes=ultimo_tramo.mes).order_by('desde')
    data = {'active_page': 'simular',
            'indicadores': indicadores,
            'tramos': tramos,}
    return render(request, 'simular.html', data)

def indicadores(request):
    indicadores = Indicadores.objects.last()

    ultimo_tramo = TramoImpuesto.objects.order_by('-anio', '-mes').first()
    tramos = []
    if ultimo_tramo:
        tramos = TramoImpuesto.objects.filter(anio=ultimo_tramo.anio, mes=ultimo_tramo.mes).order_by('desde')

    data = {
        'active_page': 'indicadores',
        'indicadores': indicadores,
        'tramos': tramos,
    }
    return render(request, 'indicadores.html', data)
