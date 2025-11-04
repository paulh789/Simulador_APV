from django.db import models

class Indicadores(models.Model):
    fecha_actualizacion = models.DateField()
    uf = models.FloatField()
    utm = models.FloatField()
    dolar = models.FloatField()
    
    def __str__(self):
        return f"Indicadores al {self.fecha_actualizacion}"
    
class TramoImpuesto(models.Model):
    desde = models.FloatField()
    hasta = models.FloatField(null=True, blank=True)
    factor = models.FloatField()
    rebaja = models.FloatField()
    anio = models.IntegerField()
    mes = models.IntegerField()

    class Meta:
        unique_together = ("anio", "mes", "desde")  # para evitar duplicados de tramo en el mismo mes

    def __str__(self):
        return f"Tramo {self.desde}-{self.hasta} ({self.mes}/{self.anio})"

"""
class Simulacion(models.Model):
    cliente = models.CharField(max_length=100)
    renta_bruta = models.FloatField()
    impuesto = models.FloatField()
    aporte = models.FloatField()
    tasa = models.FloatField()
    rentabilidad = models.FloatField()
    fecha = models.DateTimeField(auto_now_add=True)
"""