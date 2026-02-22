"""
Custom permissions for shops app
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - Admin: Full access (create, update, delete)
    - Others: Read-only access
    """
    
    def has_permission(self, request, view):
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for admin
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )

