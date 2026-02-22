"""
Serializers for sales app
"""
from rest_framework import serializers
from decimal import Decimal
from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    """
    Serializer for SaleItem model
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_id', 'product_name', 'quantity', 'unit_price', 'subtotal', 'created_at']
        read_only_fields = ['id', 'product_name', 'product_id', 'subtotal', 'created_at']
    
    def validate_quantity(self, value):
        """
        Validate quantity
        """
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value
    
    def validate_unit_price(self, value):
        """
        Validate unit price
        """
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value


class SaleSerializer(serializers.ModelSerializer):
    """
    Serializer for Sale model with nested items
    """
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    staff_name = serializers.CharField(source='staff.username', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'shop', 'shop_name', 'staff', 'staff_name', 'transaction_date',
            'total_amount', 'discount', 'tax', 'final_amount', 'payment_method',
            'notes', 'items', 'item_count', 'created_at'
        ]
        read_only_fields = ['id', 'shop_name', 'staff_name', 'total_amount', 'final_amount', 'item_count', 'created_at']
    
    def validate_discount(self, value):
        """
        Validate discount
        """
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value
    
    def validate_tax(self, value):
        """
        Validate tax
        """
        if value < 0:
            raise serializers.ValidationError("Tax cannot be negative.")
        return value


class SaleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new sale with items
    """
    items = SaleItemSerializer(many=True)
    
    class Meta:
        model = Sale
        fields = [
            'shop', 'discount', 'tax', 'payment_method', 'notes', 'items'
        ]
    
    def validate_items(self, value):
        """
        Validate that items list is not empty
        """
        if not value or len(value) == 0:
            raise serializers.ValidationError("Sale must have at least one item.")
        return value
    
    def validate_discount(self, value):
        """
        Validate discount
        """
        if value < 0:
            raise serializers.ValidationError("Discount cannot be negative.")
        return value
    
    def validate_tax(self, value):
        """
        Validate tax
        """
        if value < 0:
            raise serializers.ValidationError("Tax cannot be negative.")
        return value
    
    def validate_shop(self, value):
        """
        Validate that staff/sales_manager can only create sales for their assigned shop
        """
        request = self.context.get('request')
        if request and request.user:
            user = request.user
            # Staff and sales_manager must use their assigned shop
            if user.role in ['staff', 'sales_manager']:
                if not user.shop:
                    raise serializers.ValidationError(
                        "You must have a shop assigned to create sales. Please contact admin."
                    )
                if value.id != user.shop.id:
                    raise serializers.ValidationError(
                        f"You can only create sales for your assigned shop: {user.shop.name}"
                    )
        return value
    
    def create(self, validated_data):
        """
        Create sale with items and update stock
        Uses database transaction to ensure atomicity
        """
        from django.db import transaction
        from apps.inventory.models import Stock
        
        items_data = validated_data.pop('items')
        shop = validated_data.get('shop')
        
        # Validate stock availability BEFORE creating anything
        stock_issues = []
        stock_updates = []  # Store (stock, quantity) tuples for updates
        
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            try:
                stock = Stock.objects.get(shop=shop, product=product)
                if stock.quantity < quantity:
                    stock_issues.append(
                        f"Insufficient stock for {product.name}. Available: {stock.quantity}, Requested: {quantity}"
                    )
                else:
                    # Store for later update
                    stock_updates.append((stock, quantity))
            except Stock.DoesNotExist:
                stock_issues.append(
                    f"Stock record not found for {product.name} in {shop.name}"
                )
        
        # If any stock issues, raise error before creating anything
        if stock_issues:
            raise serializers.ValidationError({
                'items': stock_issues
            })
        
        # All stock checks passed - create sale and items in a transaction
        with transaction.atomic():
            # Create sale
            sale = Sale.objects.create(
                **validated_data,
                staff=self.context['request'].user
            )
            
            # Create sale items
            for item_data in items_data:
                SaleItem.objects.create(
                    sale=sale,
                    **item_data
                )
            
            # Update stock quantities and check for alerts
            for stock, quantity in stock_updates:
                stock.quantity -= quantity
                stock.save()
                
                # Check and create alerts for low stock
                from apps.analytics.alerts import create_low_stock_alert
                create_low_stock_alert(stock)
            
            # Calculate totals
            sale.calculate_totals()
        
        return sale

