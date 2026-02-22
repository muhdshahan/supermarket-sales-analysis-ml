"""
Custom permissions for inventory app
"""
from rest_framework import permissions


class IsAdminOrSalesManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - Admin: Full access (create, update, delete)
    - Sales Manager: Can update stock for their shop
    - Others: Read-only access
    """
    
    def has_permission(self, request, view):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions for admin and sales_manager
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'sales_manager']
        )
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Admin can do anything
        if request.user.role == 'admin':
            return True
        
        # Sales Manager can only update stock for their shop
        if request.user.role == 'sales_manager':
            # Check if user has a shop assigned
            if not request.user.shop:
                return False
            # Compare shop IDs instead of objects
            return obj.shop_id == request.user.shop_id
        
        return False




