from django.apps import AppConfig

class AppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        # Importar aquí para evitar problemas de import circular
        from app.utils import actualizar_datos
        actualizar_datos()

