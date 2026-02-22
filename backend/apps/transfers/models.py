from django.db import models
from django.core.validators import MinValueValidator


class StockTransfer(models.Model):
    """
    Stock transfer requests between shops
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    from_shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='outgoing_transfers')
    to_shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='incoming_transfers')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='transfers')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, help_text="Optional notes for the transfer request")
    
    # User tracking
    requested_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='requested_transfers')
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transfers')
    
    # Timestamps
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_transfers'
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Transfer {self.id}: {self.product.name} ({self.quantity}) from {self.from_shop.name} to {self.to_shop.name} - {self.status}"
    
    def can_be_approved(self):
        """Check if transfer can be approved (must be pending)"""
        return self.status == 'pending'
    
    def can_be_completed(self):
        """Check if transfer can be completed (must be approved)"""
        return self.status == 'approved'
    
    def can_be_cancelled(self):
        """Check if transfer can be cancelled (must be pending)"""
        return self.status == 'pending'
    
    def can_be_rejected(self):
        """Check if transfer can be rejected (must be pending)"""
        return self.status == 'pending'
