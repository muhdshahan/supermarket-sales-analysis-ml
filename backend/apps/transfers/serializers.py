"""
Serializers for transfers app
"""
from rest_framework import serializers
from django.db import transaction
from .models import StockTransfer
from apps.inventory.models import Stock


class StockTransferSerializer(serializers.ModelSerializer):
    """
    Serializer for StockTransfer model
    """
    from_shop_name = serializers.CharField(source='from_shop.name', read_only=True)
    to_shop_name = serializers.CharField(source='to_shop.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = StockTransfer
        fields = [
            'id', 'from_shop', 'from_shop_name', 'to_shop', 'to_shop_name',
            'product', 'product_id', 'product_name', 'quantity', 'status',
            'notes', 'requested_by', 'requested_by_username', 'approved_by',
            'approved_by_username', 'requested_at', 'approved_at', 'completed_at',
            'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'requested_by', 'approved_by', 'requested_at',
            'approved_at', 'completed_at', 'updated_at', 'from_shop_name',
            'to_shop_name', 'product_name', 'product_id', 'requested_by_username',
            'approved_by_username'
        ]
    
    def validate_quantity(self, value):
        """Validate quantity"""
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value
    
    def validate(self, data):
        """Validate transfer request"""
        from_shop = data.get('from_shop')
        to_shop = data.get('to_shop')
        product = data.get('product')
        quantity = data.get('quantity')
        
        # Cannot transfer to the same shop
        if from_shop and to_shop and from_shop.id == to_shop.id:
            raise serializers.ValidationError({
                'to_shop': 'Cannot transfer to the same shop.'
            })
        
        # Check stock availability in source shop
        if from_shop and product and quantity:
            try:
                stock = Stock.objects.get(shop=from_shop, product=product)
                if stock.quantity < quantity:
                    raise serializers.ValidationError({
                        'quantity': f'Insufficient stock. Available: {stock.quantity}, Requested: {quantity}'
                    })
            except Stock.DoesNotExist:
                raise serializers.ValidationError({
                    'product': f'Product {product.name} is not available in {from_shop.name}.'
                })
        
        return data


class StockTransferCreateSerializer(StockTransferSerializer):
    """
    Serializer for creating transfer requests
    """
    class Meta(StockTransferSerializer.Meta):
        read_only_fields = [
            'id', 'status', 'requested_by', 'approved_by', 'requested_at',
            'approved_at', 'completed_at', 'updated_at', 'from_shop_name',
            'to_shop_name', 'product_name', 'product_id', 'requested_by_username',
            'approved_by_username'
        ]
    
    def validate_from_shop(self, value):
        """Validate that sales manager can only request from their shop"""
        request = self.context.get('request')
        if request and request.user.role == 'sales_manager':
            if not request.user.shop:
                raise serializers.ValidationError('You must be assigned to a shop to request transfers.')
            if value.id != request.user.shop_id:
                raise serializers.ValidationError('You can only request transfers from your assigned shop.')
        return value
    
    def create(self, validated_data):
        """Create transfer request"""
        request = self.context.get('request')
        validated_data['requested_by'] = request.user
        return super().create(validated_data)


class StockTransferActionSerializer(serializers.Serializer):
    """
    Serializer for transfer actions (approve/reject/complete)
    """
    notes = serializers.CharField(required=False, allow_blank=True, help_text="Optional notes for the action")
    
    def validate(self, data):
        """Validate action"""
        transfer = self.context.get('transfer')
        action = self.context.get('action')
        
        if action == 'approve' and not transfer.can_be_approved():
            raise serializers.ValidationError('Transfer can only be approved if it is pending.')
        
        if action == 'reject' and not transfer.can_be_rejected():
            raise serializers.ValidationError('Transfer can only be rejected if it is pending.')
        
        if action == 'complete' and not transfer.can_be_completed():
            raise serializers.ValidationError('Transfer can only be completed if it is approved.')
        
        if action == 'complete':
            # Check stock availability before completing
            try:
                stock = Stock.objects.get(shop=transfer.from_shop, product=transfer.product)
                if stock.quantity < transfer.quantity:
                    raise serializers.ValidationError(
                        f'Insufficient stock to complete transfer. Available: {stock.quantity}, Required: {transfer.quantity}'
                    )
            except Stock.DoesNotExist:
                raise serializers.ValidationError(
                    f'Product {transfer.product.name} is not available in {transfer.from_shop.name}.'
                )
        
        return data

