from django.urls import path
from . import views

urlpatterns = [
    path('', views.simular, name='simular'),
    path('indicadores', views.indicadores, name='indicadores'),
    path("pdf/", views.pdf_simulacion, name="pdf_simulacion"),
]
