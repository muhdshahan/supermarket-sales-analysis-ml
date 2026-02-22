"""
Views for sales app using Class-Based Views and Generic Views
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers as drf_serializers
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import Sale, SaleItem
from .serializers import SaleSerializer, SaleCreateSerializer
from .permissions import IsStaffOrSalesManagerOrAdmin


class SaleListCreateView(generics.ListCreateAPIView):
    """
    List all sales or create a new sale
    
    GET /api/sales/ - List all sales (all authenticated users)
    POST /api/sales/ - Create new sale (staff/sales_manager/admin only)
    """
    queryset = Sale.objects.select_related('shop', 'staff').prefetch_related('items__product').all()
    permission_classes = [IsAuthenticated, IsStaffOrSalesManagerOrAdmin]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleSerializer
    
    def get_queryset(self):
        """
        Filter sales based on query parameters and user role
        """
        queryset = Sale.objects.select_related('shop', 'staff').prefetch_related('items__product').all()
        
        # Sales Manager and Staff can only see their shop's sales
        if self.request.user.role in ['sales_manager', 'staff'] and self.request.user.shop:
            queryset = queryset.filter(shop=self.request.user.shop)
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop_id', None)
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by staff
        staff_id = self.request.query_params.get('staff_id', None)
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        return queryset.order_by('-transaction_date', '-created_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new sale with proper error handling
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                sale = serializer.save()
                return Response(
                    SaleSerializer(sale).data,
                    status=status.HTTP_201_CREATED
                )
            except drf_serializers.ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class SaleRetrieveView(generics.RetrieveAPIView):
    """
    Retrieve a sale with all items
    
    GET /api/sales/{id}/ - Get sale details (all authenticated users)
    """
    queryset = Sale.objects.select_related('shop', 'staff').prefetch_related('items__product').all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated, IsStaffOrSalesManagerOrAdmin]
    lookup_field = 'pk'
