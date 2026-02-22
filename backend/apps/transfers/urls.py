"""
URL patterns for transfers app
"""
from django.urls import path
from .views import (
    TransferListCreateView,
    TransferRetrieveView,
    TransferApproveView,
    TransferRejectView,
    TransferCompleteView,
    TransferCancelView
)

app_name = 'transfers'

urlpatterns = [
    # List and create transfers
    path('', TransferListCreateView.as_view(), name='transfer-list-create'),
    
    # Retrieve transfer details
    path('<int:pk>/', TransferRetrieveView.as_view(), name='transfer-retrieve'),
    
    # Approve transfer
    path('<int:pk>/approve/', TransferApproveView.as_view(), name='transfer-approve'),
    
    # Reject transfer
    path('<int:pk>/reject/', TransferRejectView.as_view(), name='transfer-reject'),
    
    # Complete transfer
    path('<int:pk>/complete/', TransferCompleteView.as_view(), name='transfer-complete'),
    
    # Cancel transfer
    path('<int:pk>/cancel/', TransferCancelView.as_view(), name='transfer-cancel'),
]

