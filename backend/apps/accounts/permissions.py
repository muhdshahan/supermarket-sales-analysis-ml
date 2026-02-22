"""
Custom permissions for accounts app
"""
from rest_framework import permissions


class IsAdminOnly(permissions.BasePermission):
    """
    Custom permission: Only admin can access
    """
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )

