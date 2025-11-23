from django.shortcuts import render
from app.utils import Indicadores, TramoImpuesto
from django.core.serializers import serialize
from django.http import JsonResponse
import json

def simular(request):
    indicadores = Indicadores.objects.last()
    ultimo_tramo = TramoImpuesto.objects.order_by('-anio', '-mes').first()
    tramos = []
    if ultimo_tramo:
        tramos_qs = TramoImpuesto.objects.filter(anio=ultimo_tramo.anio, mes=ultimo_tramo.mes).order_by('desde')
        # Convertir queryset a JSON simple
        tramos = list(tramos_qs.values('desde', 'hasta', 'factor', 'rebaja'))
    data = {
        'active_page': 'simular',
        'indicadores': indicadores,
        'tramos_json': json.dumps(tramos),
    }
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
