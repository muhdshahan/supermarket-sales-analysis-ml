"""
Serializers for products app
"""
from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model with comprehensive validation
    """
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_name(self, value):
        """
        Validate category name
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Category name cannot be empty.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Category name must be at least 2 characters long.")
        
        if len(value) > 100:
            raise serializers.ValidationError("Category name cannot exceed 100 characters.")
        
        # Check for duplicate names (case-insensitive)
        queryset = Category.objects.filter(name__iexact=value.strip())
        if self.instance:  # Update case - exclude current instance
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        
        return value.strip()
    
    def validate_description(self, value):
        """
        Validate description
        """
        if value and len(value) > 500:
            raise serializers.ValidationError("Description cannot exceed 500 characters.")
        
        return value.strip() if value else value


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model with comprehensive validation
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'description', 
            'unit_price', 'barcode', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'category_name', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """
        Validate product name
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Product name must be at least 2 characters long.")
        
        if len(value) > 200:
            raise serializers.ValidationError("Product name cannot exceed 200 characters.")
        
        return value.strip()
    
    def validate_unit_price(self, value):
        """
        Validate unit price
        """
        if value is None:
            raise serializers.ValidationError("Unit price is required.")
        
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        
        if value > 99999999.99:
            raise serializers.ValidationError("Unit price is too large.")
        
        return value
    
    def validate_barcode(self, value):
        """
        Validate barcode - convert empty strings to None
        """
        # Convert empty string or whitespace-only string to None
        if not value or (isinstance(value, str) and not value.strip()):
            return None
        
        # Check for duplicate barcodes
        queryset = Product.objects.filter(barcode=value.strip())
        if self.instance:  # Update case - exclude current instance
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A product with this barcode already exists.")
        
        if len(value.strip()) > 50:
            raise serializers.ValidationError("Barcode cannot exceed 50 characters.")
        
        return value.strip()
    
    def validate_description(self, value):
        """
        Validate description
        """
        if value and len(value) > 1000:
            raise serializers.ValidationError("Description cannot exceed 1000 characters.")
        
        return value.strip() if value else value

