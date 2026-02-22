"""
URL patterns for sales app
"""
from django.urls import path
from .views import SaleListCreateView, SaleRetrieveView
from .reports import SalesReportView, SalesByPaymentMethodView, TopProductsView

app_name = 'sales'

urlpatterns = [
    path('', SaleListCreateView.as_view(), name='sale-list-create'),
    path('<int:pk>/', SaleRetrieveView.as_view(), name='sale-detail'),
    path('reports/', SalesReportView.as_view(), name='sales-report'),
    path('reports/payment-methods/', SalesByPaymentMethodView.as_view(), name='payment-methods-report'),
    path('reports/top-products/', TopProductsView.as_view(), name='top-products-report'),
]

