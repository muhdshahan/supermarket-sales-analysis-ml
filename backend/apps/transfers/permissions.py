"""
Custom permissions for transfers app
"""
from rest_framework import permissions


class CanRequestTransfer(permissions.BasePermission):
    """
    Permission for requesting transfers:
    - Sales Manager: Can request transfers from their assigned shop
    - Admin: Can request transfers from any shop
    """
    
    def has_permission(self, request, view):
        if request.method == 'POST':
            return (
                request.user and
                request.user.is_authenticated and
                request.user.role in ['admin', 'sales_manager']
            )
        return True


class CanManageTransfer(permissions.BasePermission):
    """
    Permission for managing transfers (approve/reject/complete):
    - Admin: Full access
    - Others: Read-only
    """
    
    def has_permission(self, request, view):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Only admin can approve/reject/complete
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            # Sales Manager can only see transfers involving their shop
            if request.user.role == 'sales_manager' and request.user.shop:
                return (
                    obj.from_shop_id == request.user.shop_id or
                    obj.to_shop_id == request.user.shop_id
                )
            return True
        
        # Only admin can modify transfers
        return request.user.role == 'admin'


class CanCancelTransfer(permissions.BasePermission):
    """
    Permission for cancelling transfers:
    - Sales Manager: Can cancel their own pending transfers
    - Admin: Can cancel any pending transfer
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'sales_manager']
        )
    
    def has_object_permission(self, request, view, obj):
        # Only pending transfers can be cancelled
        if obj.status != 'pending':
            return False
        
        # Admin can cancel any pending transfer
        if request.user.role == 'admin':
            return True
        
        # Sales Manager can only cancel their own transfers
        if request.user.role == 'sales_manager':
            return obj.requested_by_id == request.user.id
        
        return False

