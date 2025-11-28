from django.apps import AppConfig

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        import sys
        # Evita ejecución en comandos de administración
        blocked_commands = ['collectstatic', 'migrate', 'makemigrations', 'test', 'shell']

        if any(cmd in sys.argv for cmd in blocked_commands):
            return  # No ejecutar actualizar_datos en estos casos

        from app.utils import actualizar_datos
        actualizar_datos()