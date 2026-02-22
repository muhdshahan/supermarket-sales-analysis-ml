from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    shop_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'shop', 'shop_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'shop_name', 'created_at', 'updated_at']
    
    def get_shop_name(self, obj):
        return obj.shop.name if obj.shop else None


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user (admin only)
    Allows updating role, shop, phone, is_active without password
    """
    shop_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone', 'shop', 'shop_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'email', 'shop_name', 'created_at', 'updated_at']
    
    def get_shop_name(self, obj):
        return obj.shop.name if obj.shop else None
    
    def validate_role(self, value):
        """
        Validate role
        """
        valid_roles = ['admin', 'sales_manager', 'staff']
        if value not in valid_roles:
            raise serializers.ValidationError(f"Role must be one of: {', '.join(valid_roles)}")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm Password')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'role', 'phone', 'shop']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

