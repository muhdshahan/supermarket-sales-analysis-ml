"""
Reports views for sales analytics
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, Q, DecimalField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Sale, SaleItem
from .permissions import IsStaffOrSalesManagerOrAdmin


class SalesReportView(APIView):
    """
    Generate sales reports for different time periods
    GET /api/sales/reports/?period=daily|weekly|monthly|yearly&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated, IsStaffOrSalesManagerOrAdmin]
    
    def get(self, request):
        period = request.query_params.get('period', 'daily')
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        shop_id = request.query_params.get('shop_id', None)
        
        # Base queryset
        queryset = Sale.objects.all()
        
        # Filter by user role
        if request.user.role in ['sales_manager', 'staff'] and request.user.shop:
            queryset = queryset.filter(shop=request.user.shop)
        
        # Filter by shop if provided
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Set default date range if not provided
        if not end_date:
            end_date = timezone.now()
        else:
            end_date = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
        
        if not start_date:
            # Default to last 30 days for daily, last 12 weeks for weekly, etc.
            if period == 'daily':
                start_date = end_date - timedelta(days=30)
            elif period == 'weekly':
                start_date = end_date - timedelta(weeks=12)
            elif period == 'monthly':
                start_date = end_date - timedelta(days=365)
            else:  # yearly
                start_date = end_date - timedelta(days=365*5)
        else:
            start_date = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
        
        queryset = queryset.filter(transaction_date__gte=start_date, transaction_date__lte=end_date)
        
        # Aggregate based on period
        if period == 'daily':
            queryset = queryset.annotate(period=TruncDate('transaction_date'))
            group_by = 'period'
        elif period == 'weekly':
            queryset = queryset.annotate(period=TruncWeek('transaction_date'))
            group_by = 'period'
        elif period == 'monthly':
            queryset = queryset.annotate(period=TruncMonth('transaction_date'))
            group_by = 'period'
        elif period == 'yearly':
            queryset = queryset.annotate(period=TruncYear('transaction_date'))
            group_by = 'period'
        else:
            return Response(
                {'error': 'Invalid period. Use: daily, weekly, monthly, or yearly'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Aggregate data
        report_data = queryset.values(group_by).annotate(
            total_sales=Count('id'),
            total_revenue=Sum('final_amount', output_field=DecimalField()),
            total_amount=Sum('total_amount', output_field=DecimalField()),
            total_discount=Sum('discount', output_field=DecimalField()),
            total_tax=Sum('tax', output_field=DecimalField()),
        ).order_by(group_by)
        
        # Format the data
        formatted_data = []
        for item in report_data:
            formatted_data.append({
                'period': item['period'].isoformat() if item['period'] else None,
                'total_sales': item['total_sales'],
                'total_revenue': float(item['total_revenue'] or 0),
                'total_amount': float(item['total_amount'] or 0),
                'total_discount': float(item['total_discount'] or 0),
                'total_tax': float(item['total_tax'] or 0),
            })
        
        # Calculate summary statistics
        summary = {
            'total_sales': sum(item['total_sales'] for item in formatted_data),
            'total_revenue': sum(item['total_revenue'] for item in formatted_data),
            'total_amount': sum(item['total_amount'] for item in formatted_data),
            'total_discount': sum(item['total_discount'] for item in formatted_data),
            'total_tax': sum(item['total_tax'] for item in formatted_data),
            'average_sale': sum(item['total_revenue'] for item in formatted_data) / len(formatted_data) if formatted_data else 0,
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }
        
        return Response({
            'summary': summary,
            'data': formatted_data
        })


class SalesByPaymentMethodView(APIView):
    """
    Get sales breakdown by payment method
    GET /api/sales/reports/payment-methods/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated, IsStaffOrSalesManagerOrAdmin]
    
    def get(self, request):
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        shop_id = request.query_params.get('shop_id', None)
        
        queryset = Sale.objects.all()
        
        # Filter by user role
        if request.user.role in ['sales_manager', 'staff'] and request.user.shop:
            queryset = queryset.filter(shop=request.user.shop)
        
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        if start_date:
            start_date = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
            queryset = queryset.filter(transaction_date__gte=start_date)
        
        if end_date:
            end_date = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        payment_data = queryset.values('payment_method').annotate(
            count=Count('id'),
            total_revenue=Sum('final_amount', output_field=DecimalField())
        ).order_by('-total_revenue')
        
        formatted_data = []
        for item in payment_data:
            formatted_data.append({
                'payment_method': item['payment_method'],
                'count': item['count'],
                'total_revenue': float(item['total_revenue'] or 0),
            })
        
        return Response({'data': formatted_data})


class TopProductsView(APIView):
    """
    Get top selling products
    GET /api/sales/reports/top-products/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&limit=10
    """
    permission_classes = [IsAuthenticated, IsStaffOrSalesManagerOrAdmin]
    
    def get(self, request):
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        shop_id = request.query_params.get('shop_id', None)
        limit = int(request.query_params.get('limit', 10))
        
        queryset = SaleItem.objects.select_related('sale', 'product')
        
        # Filter by user role
        if request.user.role in ['sales_manager', 'staff'] and request.user.shop:
            queryset = queryset.filter(sale__shop=request.user.shop)
        
        if shop_id:
            queryset = queryset.filter(sale__shop_id=shop_id)
        
        if start_date:
            start_date = timezone.datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
            queryset = queryset.filter(sale__transaction_date__gte=start_date)
        
        if end_date:
            end_date = timezone.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
            queryset = queryset.filter(sale__transaction_date__lte=end_date)
        
        top_products = queryset.values('product__name', 'product__id').annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal', output_field=DecimalField())
        ).order_by('-total_quantity')[:limit]
        
        formatted_data = []
        for item in top_products:
            formatted_data.append({
                'product_id': item['product__id'],
                'product_name': item['product__name'],
                'total_quantity': float(item['total_quantity'] or 0),
                'total_revenue': float(item['total_revenue'] or 0),
            })
        
        return Response({'data': formatted_data})

