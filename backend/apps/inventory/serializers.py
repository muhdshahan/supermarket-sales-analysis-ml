"""
Serializers for inventory app
"""
from rest_framework import serializers
from .models import Stock


class StockSerializer(serializers.ModelSerializer):
    """
    Serializer for Stock model with comprehensive validation
    """
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.unit_price', max_digits=10, decimal_places=2, read_only=True)
    category_name = serializers.CharField(source='product.category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Stock
        fields = [
            'id', 'shop', 'shop_name', 'product', 'product_name', 'product_price',
            'category_name', 'quantity', 'min_threshold', 'max_capacity',
            'is_low_stock', 'is_out_of_stock', 'last_updated', 'created_at'
        ]
        read_only_fields = ['id', 'shop_name', 'product_name', 'product_price', 'category_name', 
                           'is_low_stock', 'is_out_of_stock', 'last_updated', 'created_at']
    
    def validate_quantity(self, value):
        """
        Validate quantity
        """
        if value < 0:
            raise serializers.ValidationError("Quantity cannot be negative.")
        
        return value
    
    def validate_min_threshold(self, value):
        """
        Validate minimum threshold
        """
        if value < 0:
            raise serializers.ValidationError("Minimum threshold cannot be negative.")
        
        return value
    
    def validate_max_capacity(self, value):
        """
        Validate maximum capacity
        """
        if value is not None and value < 0:
            raise serializers.ValidationError("Maximum capacity cannot be negative.")
        
        return value
    
    def validate(self, attrs):
        """
        Cross-field validation
        """
        # Check if max_capacity is set and is less than quantity
        max_capacity = attrs.get('max_capacity')
        quantity = attrs.get('quantity', self.instance.quantity if self.instance else 0)
        
        if max_capacity is not None and quantity > max_capacity:
            raise serializers.ValidationError({
                'quantity': f'Quantity cannot exceed maximum capacity of {max_capacity}.'
            })
        
        # Check if min_threshold is greater than max_capacity
        min_threshold = attrs.get('min_threshold', self.instance.min_threshold if self.instance else 0)
        if max_capacity is not None and min_threshold > max_capacity:
            raise serializers.ValidationError({
                'min_threshold': 'Minimum threshold cannot exceed maximum capacity.'
            })
        
        # For sales managers, prevent changing shop
        request = self.context.get('request')
        if request and request.user.role == 'sales_manager' and self.instance:
            # If updating, ensure shop doesn't change
            if 'shop' in attrs and attrs['shop'].id != self.instance.shop_id:
                raise serializers.ValidationError({
                    'shop': 'You cannot change the shop for this stock record.'
                })
            # If updating, ensure shop matches user's shop
            if self.instance.shop_id != request.user.shop_id:
                raise serializers.ValidationError({
                    'shop': 'You can only update stock for your assigned shop.'
                })
        
        return attrs




