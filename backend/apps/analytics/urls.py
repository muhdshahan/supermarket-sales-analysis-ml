"""
URL patterns for analytics app
"""
from django.urls import path
from .views import AlertListView, AlertMarkReadView, AlertMarkAllReadView

app_name = 'analytics'

urlpatterns = [
    # List alerts
    path('alerts/', AlertListView.as_view(), name='alert-list'),
    
    # Mark alert as read
    path('alerts/<int:pk>/read/', AlertMarkReadView.as_view(), name='alert-mark-read'),
    
    # Mark all alerts as read
    path('alerts/mark-all-read/', AlertMarkAllReadView.as_view(), name='alert-mark-all-read'),
]




