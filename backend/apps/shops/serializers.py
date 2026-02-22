"""
Serializers for shops app
"""
from rest_framework import serializers
from .models import Shop


class ShopSerializer(serializers.ModelSerializer):
    """
    Serializer for Shop model with comprehensive validation
    """
    
    class Meta:
        model = Shop
        fields = ['id', 'name', 'address', 'phone', 'email', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """
        Validate shop name
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Shop name cannot be empty.")
        
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Shop name must be at least 2 characters long.")
        
        if len(value) > 200:
            raise serializers.ValidationError("Shop name cannot exceed 200 characters.")
        
        # Check for duplicate names (case-insensitive)
        queryset = Shop.objects.filter(name__iexact=value.strip())
        if self.instance:  # Update case - exclude current instance
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A shop with this name already exists.")
        
        return value.strip()
    
    def validate_address(self, value):
        """
        Validate shop address
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Address must be at least 5 characters long.")
        
        return value.strip()
    
    def validate_phone(self, value):
        """
        Validate phone number
        """
        if value:
            # Remove common separators
            cleaned_phone = value.replace('-', '').replace(' ', '').replace('(', '').replace(')', '').replace('+', '')
            
            # Check if it's all digits
            if not cleaned_phone.isdigit():
                raise serializers.ValidationError("Phone number must contain only digits and common separators.")
            
            # Check length (assuming 10-15 digits)
            if len(cleaned_phone) < 10 or len(cleaned_phone) > 15:
                raise serializers.ValidationError("Phone number must be between 10 and 15 digits.")
            
            return value.strip()
        
        return value
    
    def validate_email(self, value):
        """
        Validate email format
        """
        if value:
            # Basic email validation (Django's EmailField already does this, but we add custom message)
            if '@' not in value or '.' not in value.split('@')[-1]:
                raise serializers.ValidationError("Please enter a valid email address.")
            
            # Check for duplicate emails (case-insensitive)
            queryset = Shop.objects.filter(email__iexact=value.strip())
            if self.instance:  # Update case - exclude current instance
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError("A shop with this email already exists.")
            
            return value.strip().lower()
        
        return value
    
    def validate(self, attrs):
        """
        Cross-field validation
        """
        # Additional validation if needed
        return attrs

