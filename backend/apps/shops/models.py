from django.db import models


class Shop(models.Model):
    """
    Supermarket shops/branches
    """
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'shops'
        ordering = ['name']
    
    def __str__(self):
        return self.name
