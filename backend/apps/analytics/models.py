from django.db import models


class Alert(models.Model):
    """
    System alerts for low stock, high demand, etc.
    """
    ALERT_TYPE_CHOICES = [
        ('low_stock', 'Low Stock'),
        ('stockout_risk', 'Stockout Risk'),
        ('high_demand', 'High Demand'),
        ('seasonal', 'Seasonal'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='alerts')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, null=True, blank=True, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    read_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='read_alerts')
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop', 'is_read'], name='alerts_shop_read_idx'),
            models.Index(fields=['alert_type', 'severity'], name='alerts_type_severity_idx'),
        ]
    
    def __str__(self):
        product_name = self.product.name if self.product else 'General'
        return f"{self.alert_type} alert for {product_name} at {self.shop.name} - {self.severity}"
    
    def mark_as_read(self, user):
        """Mark alert as read by a user"""
        self.is_read = True
        self.read_by = user
        from django.utils import timezone
        self.read_at = timezone.now()
        self.save()
