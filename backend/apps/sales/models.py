from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Sale(models.Model):
    """
    Sales transaction header (bill/receipt)
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('upi', 'UPI'),
        ('other', 'Other'),
    ]
    
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='sales')
    staff = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='sales_made')
    transaction_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(Decimal('0.00'))])
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(Decimal('0.00'))])
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(Decimal('0.00'))])
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, validators=[MinValueValidator(Decimal('0.00'))])
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sales'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['shop', 'transaction_date']),
            models.Index(fields=['staff', 'transaction_date']),
        ]
    
    def __str__(self):
        return f"Sale #{self.id} - {self.shop.name} - {self.transaction_date.strftime('%Y-%m-%d %H:%M')}"
    
    def calculate_totals(self):
        """
        Calculate total_amount and final_amount from sale items
        """
        total = sum(item.subtotal for item in self.items.all())
        self.total_amount = total
        self.final_amount = total - self.discount + self.tax
        self.save()
    
    @property
    def item_count(self):
        """Get total number of items in this sale"""
        return self.items.count()


class SaleItem(models.Model):
    """
    Individual items in a sale (line items)
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sale_items'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity} - Sale #{self.sale.id}"
    
    def save(self, *args, **kwargs):
        """
        Auto-calculate subtotal before saving
        """
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # Recalculate sale totals after saving item
        if self.sale:
            self.sale.calculate_totals()
