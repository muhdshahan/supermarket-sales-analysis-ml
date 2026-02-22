"""
URL patterns for shops app
"""
from django.urls import path
from .views import ShopListCreateView, ShopRetrieveUpdateDestroyView

app_name = 'shops'

urlpatterns = [
    path('', ShopListCreateView.as_view(), name='shop-list-create'),
    path('<int:pk>/', ShopRetrieveUpdateDestroyView.as_view(), name='shop-detail'),
]

