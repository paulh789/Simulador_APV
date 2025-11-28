from django.core.management.base import BaseCommand
from app.utils import actualizar_datos

class Command(BaseCommand):
    help = "Actualizar indicadores diarios"

    def handle(self, *args, **kwargs):
        actualizar_datos()
        self.stdout.write(self.style.SUCCESS("Indicadores actualizados"))
