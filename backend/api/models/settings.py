from django.db import models

class GlobalSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class OpeningHour(models.Model):
    DAY_CHOICES = [
        (1, 'Lunes'),
        (2, 'Martes'),
        (3, 'Miércoles'),
        (4, 'Jueves'),
        (5, 'Viernes'),
        (6, 'Sábado'),
        (7, 'Domingo'),
    ]
    day = models.IntegerField(choices=DAY_CHOICES, unique=True)
    opening_time = models.TimeField(default="20:00")
    closing_time = models.TimeField(default="00:00")
    is_open = models.BooleanField(default=True)

    class Meta:
        ordering = ['day']

    def __str__(self):
        day_name = dict(self.DAY_CHOICES).get(self.day, "Unknown")
        status = "Abierto" if self.is_open else "Cerrado"
        return f"{day_name}: {self.opening_time} - {self.closing_time} ({status})"

class DeliverySetting(models.Model):
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=1000)
    km_price = models.DecimalField(max_digits=10, decimal_places=2, default=200)
    max_km = models.DecimalField(max_digits=10, decimal_places=2, default=15)
    marquee_text = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Configuración de Delivery (Base: ${self.base_price})"
