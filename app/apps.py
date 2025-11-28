from django.apps import AppConfig

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        import sys
        # Evitar ejecutar en comandos de administración
        if "runserver" in sys.argv:
            from app.utils import actualizar_datos
            actualizar_datos()

