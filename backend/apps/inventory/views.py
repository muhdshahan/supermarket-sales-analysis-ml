"""
Views for inventory app using Class-Based Views and Generic Views
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from .models import Stock
from .serializers import StockSerializer
from .permissions import IsAdminOrSalesManagerOrReadOnly


class StockListCreateView(generics.ListCreateAPIView):
    """
    List all stock records or create a new stock record
    
    GET /api/inventory/stock/ - List all stock (all authenticated users)
    POST /api/inventory/stock/ - Create new stock (admin/sales_manager only)
    """
    queryset = Stock.objects.select_related('shop', 'product', 'product__category').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSalesManagerOrReadOnly]
    
    def get_queryset(self):
        """
        Filter stock based on query parameters and user role
        """
        queryset = Stock.objects.select_related('shop', 'product', 'product__category').all()
        
        # Sales Manager can only see their shop's stock
        if self.request.user.role == 'sales_manager' and self.request.user.shop:
            queryset = queryset.filter(shop=self.request.user.shop)
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop_id', None)
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by product
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter low stock items
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(quantity__lte=F('min_threshold'))
        
        # Filter out of stock items
        out_of_stock = self.request.query_params.get('out_of_stock', None)
        if out_of_stock and out_of_stock.lower() == 'true':
            queryset = queryset.filter(quantity=0)
        
        # Search by product name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(product__name__icontains=search)
        
        return queryset.order_by('shop__name', 'product__name')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new stock record with proper error handling
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Check if stock record already exists for this shop-product combination
            shop_id = serializer.validated_data.get('shop').id
            product_id = serializer.validated_data.get('product').id
            
            if Stock.objects.filter(shop_id=shop_id, product_id=product_id).exists():
                return Response(
                    {'error': 'Stock record already exists for this product in this shop. Use update instead.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            stock = serializer.save()
            return Response(
                StockSerializer(stock).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class StockRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a stock record
    
    GET /api/inventory/stock/{id}/ - Get stock details (all authenticated users)
    PUT /api/inventory/stock/{id}/ - Update stock (admin/sales_manager only)
    PATCH /api/inventory/stock/{id}/ - Partial update stock (admin/sales_manager only)
    DELETE /api/inventory/stock/{id}/ - Delete stock (admin only)
    """
    queryset = Stock.objects.select_related('shop', 'product', 'product__category').all()
    serializer_class = StockSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSalesManagerOrReadOnly]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """
        Update stock with proper error handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        
        if serializer.is_valid():
            stock = serializer.save()
            
            # Check and create alerts for low stock
            from apps.analytics.alerts import create_low_stock_alert
            create_low_stock_alert(stock)
            
            return Response(StockSerializer(stock).data)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete stock - only admin can delete
        """
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only admin can delete stock records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        instance.delete()
        
        return Response(
            {'message': 'Stock record deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
