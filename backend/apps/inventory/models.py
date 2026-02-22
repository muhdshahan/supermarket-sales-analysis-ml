from django.db import models
from django.core.validators import MinValueValidator


class Stock(models.Model):
    """
    Stock levels for each product in each shop
    """
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='stocks')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='stocks')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    min_threshold = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    max_capacity = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'stocks'
        unique_together = ['shop', 'product']  # One stock record per product per shop
        ordering = ['shop', 'product']
    
    def __str__(self):
        return f"{self.product.name} - {self.shop.name} (Qty: {self.quantity})"
    
    @property
    def is_low_stock(self):
        """Check if stock is below minimum threshold"""
        return self.quantity <= self.min_threshold
    
    @property
    def is_out_of_stock(self):
        """Check if stock is out"""
        return self.quantity == 0
