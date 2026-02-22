"""
Views for shops app using Class-Based Views and Generic Views
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Shop
from .serializers import ShopSerializer
from .permissions import IsAdminOrReadOnly


class ShopListCreateView(generics.ListCreateAPIView):
    """
    List all shops or create a new shop
    
    GET /api/shops/ - List all shops (all authenticated users)
    POST /api/shops/ - Create new shop (admin only)
    """
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        """
        Filter shops based on query parameters
        """
        queryset = Shop.objects.all()
        
        # Filter by is_active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('name')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new shop with proper error handling
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            shop = serializer.save()
            return Response(
                ShopSerializer(shop).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ShopRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a shop
    
    GET /api/shops/{id}/ - Get shop details (all authenticated users)
    PUT /api/shops/{id}/ - Update shop (admin only)
    PATCH /api/shops/{id}/ - Partial update shop (admin only)
    DELETE /api/shops/{id}/ - Delete shop (admin only)
    """
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """
        Update shop with proper error handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            shop = serializer.save()
            return Response(ShopSerializer(shop).data)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete shop with proper error handling
        """
        instance = self.get_object()
        
        # Check if shop has employees
        if instance.employees.exists():
            return Response(
                {
                    'error': 'Cannot delete shop. There are employees assigned to this shop. Please reassign or remove employees first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if shop has stock records
        # We'll check this when inventory app is created
        # For now, just delete
        instance.delete()
        
        return Response(
            {'message': 'Shop deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
