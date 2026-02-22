"""
Custom permissions for analytics app
"""
from rest_framework import permissions


class CanViewAlerts(permissions.BasePermission):
    """
    Permission for viewing alerts:
    - All authenticated users can view alerts
    - Sales Manager and Staff can only see alerts for their shop
    - Admin can see all alerts
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin can see all alerts
        if request.user.role == 'admin':
            return True
        
        # Sales Manager and Staff can only see alerts for their shop
        if request.user.role in ['sales_manager', 'staff']:
            if not request.user.shop:
                return False
            return obj.shop_id == request.user.shop_id
        
        return False




