"""
Serializers for analytics app
"""
from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    """
    Serializer for Alert model
    """
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_id = serializers.IntegerField(source='shop.id', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True, allow_null=True)
    read_by_username = serializers.CharField(source='read_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'shop', 'shop_id', 'shop_name', 'product', 'product_id',
            'product_name', 'alert_type', 'message', 'severity', 'is_read',
            'read_by', 'read_by_username', 'read_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'shop_name', 'shop_id', 'product_name', 'product_id',
            'read_by', 'read_by_username', 'read_at', 'created_at'
        ]


class AlertMarkReadSerializer(serializers.Serializer):
    """
    Serializer for marking alert as read
    """
    pass  # No fields needed, just mark as read




