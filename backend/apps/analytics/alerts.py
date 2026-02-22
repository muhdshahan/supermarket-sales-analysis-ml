"""
Alert generation logic
"""
from django.utils import timezone
from .models import Alert
from apps.inventory.models import Stock


def create_low_stock_alert(stock):
    """
    Create a low stock alert if stock is below threshold
    
    Args:
        stock: Stock instance
    
    Returns:
        Alert instance or None
    """
    if stock.quantity > stock.min_threshold:
        return None
    
    # Determine severity based on how low the stock is
    if stock.quantity == 0:
        severity = 'critical'
        alert_type = 'stockout_risk'
        message = f"{stock.product.name} is out of stock at {stock.shop.name}"
    elif stock.quantity <= stock.min_threshold * 0.5:
        severity = 'high'
        alert_type = 'stockout_risk'
        message = f"{stock.product.name} is critically low at {stock.shop.name} ({stock.quantity} units remaining, threshold: {stock.min_threshold})"
    else:
        severity = 'medium'
        alert_type = 'low_stock'
        message = f"{stock.product.name} is below minimum threshold at {stock.shop.name} ({stock.quantity} units, threshold: {stock.min_threshold})"
    
    # Check if similar alert already exists (not read)
    existing_alert = Alert.objects.filter(
        shop=stock.shop,
        product=stock.product,
        alert_type=alert_type,
        is_read=False
    ).first()
    
    if existing_alert:
        # Update existing alert if severity increased
        if severity == 'critical' and existing_alert.severity != 'critical':
            existing_alert.severity = severity
            existing_alert.message = message
            existing_alert.created_at = timezone.now()  # Update timestamp
            existing_alert.save()
            return existing_alert
        return existing_alert
    
    # Create new alert
    alert = Alert.objects.create(
        shop=stock.shop,
        product=stock.product,
        alert_type=alert_type,
        message=message,
        severity=severity
    )
    
    return alert


def check_and_create_stock_alerts(shop=None, product=None):
    """
    Check all stocks and create alerts for low stock items
    
    Args:
        shop: Optional Shop instance to check only that shop
        product: Optional Product instance to check only that product
    
    Returns:
        List of created alerts
    """
    alerts_created = []
    
    # Build query
    stocks = Stock.objects.select_related('shop', 'product').all()
    
    if shop:
        stocks = stocks.filter(shop=shop)
    if product:
        stocks = stocks.filter(product=product)
    
    # Check each stock
    for stock in stocks:
        if stock.quantity <= stock.min_threshold:
            alert = create_low_stock_alert(stock)
            if alert:
                alerts_created.append(alert)
    
    return alerts_created




