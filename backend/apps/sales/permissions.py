"""
Custom permissions for sales app
"""
from rest_framework import permissions


class IsStaffOrSalesManagerOrAdmin(permissions.BasePermission):
    """
    Custom permission:
    - Staff: Can create sales (billing)
    - Sales Manager: Can view sales for their shop
    - Admin: Full access
    """
    
    def has_permission(self, request, view):
        # All authenticated users can view sales
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Only staff, sales_manager, and admin can create sales
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['staff', 'sales_manager', 'admin']
        )
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            # Sales Manager and Staff can only see their shop's sales
            if request.user.role in ['sales_manager', 'staff'] and request.user.shop:
                return obj.shop_id == request.user.shop_id
            return True
        
        # Only admin can modify/delete sales
        return request.user.role == 'admin'

