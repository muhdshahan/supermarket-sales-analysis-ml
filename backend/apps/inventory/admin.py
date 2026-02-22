from django.contrib import admin
from .models import Stock


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['product', 'shop', 'quantity', 'min_threshold', 'last_updated']
    list_filter = ['shop', 'product__category']
    search_fields = ['product__name', 'shop__name']
    readonly_fields = ['created_at', 'last_updated']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('shop', 'product')
        }),
        ('Stock Levels', {
            'fields': ('quantity', 'min_threshold', 'max_capacity')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_updated'),
            'classes': ('collapse',)
        }),
    )
