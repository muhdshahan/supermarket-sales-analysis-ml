from django.contrib import admin
from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['subtotal', 'created_at']
    fields = ['product', 'quantity', 'unit_price', 'subtotal', 'created_at']


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['id', 'shop', 'staff', 'transaction_date', 'total_amount', 'final_amount', 'payment_method', 'item_count']
    list_filter = ['shop', 'payment_method', 'transaction_date', 'created_at']
    search_fields = ['id', 'shop__name', 'staff__username']
    readonly_fields = ['total_amount', 'final_amount', 'created_at', 'item_count']
    inlines = [SaleItemInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('shop', 'staff', 'transaction_date')
        }),
        ('Amounts', {
            'fields': ('total_amount', 'discount', 'tax', 'final_amount')
        }),
        ('Payment', {
            'fields': ('payment_method', 'notes')
        }),
        ('Metadata', {
            'fields': ('item_count', 'created_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'sale', 'product', 'quantity', 'unit_price', 'subtotal', 'created_at']
    list_filter = ['sale__shop', 'product__category', 'created_at']
    search_fields = ['sale__id', 'product__name']
    readonly_fields = ['subtotal', 'created_at']
