"""
Views for transfers app using Class-Based Views and Generic Views
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.db import transaction
from django.utils import timezone
from .models import StockTransfer
from .serializers import (
    StockTransferSerializer,
    StockTransferCreateSerializer,
    StockTransferActionSerializer
)
from .permissions import CanRequestTransfer, CanManageTransfer, CanCancelTransfer
from apps.inventory.models import Stock


class TransferListCreateView(generics.ListCreateAPIView):
    """
    List all transfers or create a new transfer request
    
    GET /api/transfers/ - List all transfers (all authenticated users)
    POST /api/transfers/ - Create new transfer request (sales_manager/admin only)
    """
    queryset = StockTransfer.objects.select_related(
        'from_shop', 'to_shop', 'product', 'requested_by', 'approved_by'
    ).all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StockTransferCreateSerializer
        return StockTransferSerializer
    
    def get_permissions(self):
        """Set permissions based on request method"""
        if self.request.method == 'POST':
            return [IsAuthenticated(), CanRequestTransfer()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """
        Filter transfers based on query parameters and user role
        """
        queryset = StockTransfer.objects.select_related(
            'from_shop', 'to_shop', 'product', 'requested_by', 'approved_by'
        ).all()
        
        # Sales Manager can only see transfers involving their shop
        if self.request.user.role == 'sales_manager' and self.request.user.shop:
            queryset = queryset.filter(
                from_shop=self.request.user.shop
            ) | queryset.filter(
                to_shop=self.request.user.shop
            )
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by from_shop
        from_shop_id = self.request.query_params.get('from_shop_id', None)
        if from_shop_id:
            queryset = queryset.filter(from_shop_id=from_shop_id)
        
        # Filter by to_shop
        to_shop_id = self.request.query_params.get('to_shop_id', None)
        if to_shop_id:
            queryset = queryset.filter(to_shop_id=to_shop_id)
        
        # Filter by product
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by requested_by
        requested_by_id = self.request.query_params.get('requested_by_id', None)
        if requested_by_id:
            queryset = queryset.filter(requested_by_id=requested_by_id)
        
        return queryset.order_by('-requested_at')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new transfer request
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            transfer = serializer.save()
            return Response(
                StockTransferSerializer(transfer).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class TransferRetrieveView(generics.RetrieveAPIView):
    """
    Retrieve a transfer with details
    
    GET /api/transfers/{id}/ - Get transfer details (all authenticated users)
    """
    queryset = StockTransfer.objects.select_related(
        'from_shop', 'to_shop', 'product', 'requested_by', 'approved_by'
    ).all()
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated, CanManageTransfer]
    lookup_field = 'pk'


class TransferApproveView(generics.GenericAPIView):
    """
    Approve a transfer request
    
    POST /api/transfers/{id}/approve/ - Approve transfer (admin only)
    """
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferActionSerializer
    permission_classes = [IsAuthenticated, CanManageTransfer]
    lookup_field = 'pk'
    
    def post(self, request, pk):
        """Approve transfer"""
        try:
            transfer = self.get_object()
        except StockTransfer.DoesNotExist:
            return Response(
                {'error': 'Transfer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'transfer': transfer, 'action': 'approve'}
        )
        
        if serializer.is_valid():
            transfer.status = 'approved'
            transfer.approved_by = request.user
            transfer.approved_at = timezone.now()
            transfer.save()
            
            return Response(
                StockTransferSerializer(transfer).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class TransferRejectView(generics.GenericAPIView):
    """
    Reject a transfer request
    
    POST /api/transfers/{id}/reject/ - Reject transfer (admin only)
    """
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferActionSerializer
    permission_classes = [IsAuthenticated, CanManageTransfer]
    lookup_field = 'pk'
    
    def post(self, request, pk):
        """Reject transfer"""
        try:
            transfer = self.get_object()
        except StockTransfer.DoesNotExist:
            return Response(
                {'error': 'Transfer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'transfer': transfer, 'action': 'reject'}
        )
        
        if serializer.is_valid():
            transfer.status = 'rejected'
            transfer.approved_by = request.user
            transfer.approved_at = timezone.now()
            transfer.save()
            
            return Response(
                StockTransferSerializer(transfer).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class TransferCompleteView(generics.GenericAPIView):
    """
    Complete a transfer (update stock)
    
    POST /api/transfers/{id}/complete/ - Complete transfer (admin only)
    """
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferActionSerializer
    permission_classes = [IsAuthenticated, CanManageTransfer]
    lookup_field = 'pk'
    
    def post(self, request, pk):
        """Complete transfer and update stock"""
        try:
            transfer = self.get_object()
        except StockTransfer.DoesNotExist:
            return Response(
                {'error': 'Transfer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'transfer': transfer, 'action': 'complete'}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Get source stock
                    from_stock, created = Stock.objects.get_or_create(
                        shop=transfer.from_shop,
                        product=transfer.product,
                        defaults={'quantity': 0}
                    )
                    
                    # Check stock availability
                    if from_stock.quantity < transfer.quantity:
                        return Response(
                            {'error': f'Insufficient stock. Available: {from_stock.quantity}, Required: {transfer.quantity}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Reduce stock from source shop
                    from_stock.quantity -= transfer.quantity
                    from_stock.save()
                    
                    # Check and create alerts for source shop
                    from apps.analytics.alerts import create_low_stock_alert
                    create_low_stock_alert(from_stock)
                    
                    # Get or create destination stock
                    to_stock, created = Stock.objects.get_or_create(
                        shop=transfer.to_shop,
                        product=transfer.product,
                        defaults={'quantity': 0}
                    )
                    
                    # Add stock to destination shop
                    to_stock.quantity += transfer.quantity
                    to_stock.save()
                    
                    # Note: No alert needed for destination shop (stock increased)
                    
                    # Update transfer status
                    transfer.status = 'completed'
                    transfer.completed_at = timezone.now()
                    transfer.save()
                
                return Response(
                    StockTransferSerializer(transfer).data,
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {'error': f'Error completing transfer: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class TransferCancelView(generics.GenericAPIView):
    """
    Cancel a transfer request
    
    POST /api/transfers/{id}/cancel/ - Cancel transfer (sales_manager/admin)
    """
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferActionSerializer
    permission_classes = [IsAuthenticated, CanCancelTransfer]
    lookup_field = 'pk'
    
    def post(self, request, pk):
        """Cancel transfer"""
        try:
            transfer = self.get_object()
        except StockTransfer.DoesNotExist:
            return Response(
                {'error': 'Transfer not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(
            data=request.data,
            context={'transfer': transfer, 'action': 'cancel'}
        )
        
        if serializer.is_valid():
            transfer.status = 'cancelled'
            transfer.save()
            
            return Response(
                StockTransferSerializer(transfer).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
