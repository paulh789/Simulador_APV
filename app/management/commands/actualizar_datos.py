from django.core.management.base import BaseCommand
from app.utils import actualizar_datos

class Command(BaseCommand):
    help = "Actualizar indicadores diarios"

    def handle(self, *args, **kwargs):
        actualizacion = actualizar_datos()
        if actualizacion == 1:
            self.stdout.write(self.style.SUCCESS("Indicadores actualizados"))
        elif actualizacion == -1:
            self.stdout.write(self.style.ERROR("Error al acutalizar indicadores"))
