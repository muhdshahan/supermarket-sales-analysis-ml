"""
URL patterns for inventory app
"""
from django.urls import path
from .views import StockListCreateView, StockRetrieveUpdateDestroyView

app_name = 'inventory'

urlpatterns = [
    path('stock/', StockListCreateView.as_view(), name='stock-list-create'),
    path('stock/<int:pk>/', StockRetrieveUpdateDestroyView.as_view(), name='stock-detail'),
]




