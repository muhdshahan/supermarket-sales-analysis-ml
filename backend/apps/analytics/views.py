"""
Views for analytics app
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Alert
from .serializers import AlertSerializer, AlertMarkReadSerializer
from .permissions import CanViewAlerts


class AlertListView(generics.ListAPIView):
    """
    List all alerts with filters
    
    GET /api/alerts/ - List alerts (all authenticated users)
    """
    queryset = Alert.objects.select_related('shop', 'product', 'read_by').all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated, CanViewAlerts]
    
    def get_queryset(self):
        """
        Filter alerts based on query parameters and user role
        """
        queryset = Alert.objects.select_related('shop', 'product', 'read_by').all()
        
        # Sales Manager and Staff can only see alerts for their shop
        if self.request.user.role in ['sales_manager', 'staff'] and self.request.user.shop:
            queryset = queryset.filter(shop=self.request.user.shop)
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop_id', None)
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by alert_type
        alert_type = self.request.query_params.get('alert_type', None)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        # Filter by severity
        severity = self.request.query_params.get('severity', None)
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by is_read
        is_read = self.request.query_params.get('is_read', None)
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Filter by product
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset.order_by('-created_at')


class AlertMarkReadView(generics.GenericAPIView):
    """
    Mark an alert as read
    
    PUT /api/alerts/{id}/read/ - Mark alert as read (all authenticated users)
    """
    queryset = Alert.objects.all()
    serializer_class = AlertMarkReadSerializer
    permission_classes = [IsAuthenticated, CanViewAlerts]
    lookup_field = 'pk'
    
    def put(self, request, pk):
        """Mark alert as read"""
        try:
            alert = self.get_object()
        except Alert.DoesNotExist:
            return Response(
                {'error': 'Alert not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if alert.is_read:
            return Response(
                {'message': 'Alert is already read.'},
                status=status.HTTP_200_OK
            )
        
        alert.mark_as_read(request.user)
        
        return Response(
            AlertSerializer(alert).data,
            status=status.HTTP_200_OK
        )


class AlertMarkAllReadView(generics.GenericAPIView):
    """
    Mark all unread alerts as read for the user's shop
    
    PUT /api/alerts/mark-all-read/ - Mark all alerts as read
    """
    permission_classes = [IsAuthenticated, CanViewAlerts]
    
    def put(self, request):
        """Mark all unread alerts as read"""
        queryset = Alert.objects.filter(is_read=False)
        
        # Sales Manager and Staff can only mark alerts for their shop
        if request.user.role in ['sales_manager', 'staff'] and request.user.shop:
            queryset = queryset.filter(shop=request.user.shop)
        
        # Filter by shop if provided
        shop_id = request.data.get('shop_id', None)
        if shop_id and request.user.role == 'admin':
            queryset = queryset.filter(shop_id=shop_id)
        
        count = queryset.count()
        queryset.update(
            is_read=True,
            read_by=request.user,
            read_at=timezone.now()
        )
        
        return Response(
            {'message': f'{count} alerts marked as read.'},
            status=status.HTTP_200_OK
        )
