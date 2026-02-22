"""
Views for products app using Class-Based Views and Generic Views
"""
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer
from .permissions import IsAdminOrReadOnly


# ============ Category Views ============

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    List all categories or create a new category
    
    GET /api/categories/ - List all categories (all authenticated users)
    POST /api/categories/ - Create new category (admin only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        """
        Filter categories based on query parameters
        """
        queryset = Category.objects.all()
        
        # Search by name
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('name')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new category with proper error handling
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            category = serializer.save()
            return Response(
                CategorySerializer(category).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a category
    
    GET /api/categories/{id}/ - Get category details (all authenticated users)
    PUT /api/categories/{id}/ - Update category (admin only)
    PATCH /api/categories/{id}/ - Partial update category (admin only)
    DELETE /api/categories/{id}/ - Delete category (admin only)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """
        Update category with proper error handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            category = serializer.save()
            return Response(CategorySerializer(category).data)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete category with proper error handling
        """
        instance = self.get_object()
        
        # Check if category has products
        if instance.products.exists():
            return Response(
                {
                    'error': 'Cannot delete category. There are products assigned to this category. Please reassign or remove products first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.delete()
        
        return Response(
            {'message': 'Category deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ============ Product Views ============

class ProductListCreateView(generics.ListCreateAPIView):
    """
    List all products or create a new product
    
    GET /api/products/ - List all products (all authenticated users)
    POST /api/products/ - Create new product (admin only)
    """
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    
    def get_queryset(self):
        """
        Filter products based on query parameters
        """
        queryset = Product.objects.select_related('category').all()
        
        # Filter by category
        category_id = self.request.query_params.get('category_id', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
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
        Create a new product with proper error handling
        """
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            product = serializer.save()
            return Response(
                ProductSerializer(product).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product
    
    GET /api/products/{id}/ - Get product details (all authenticated users)
    PUT /api/products/{id}/ - Update product (admin only)
    PATCH /api/products/{id}/ - Partial update product (admin only)
    DELETE /api/products/{id}/ - Delete product (admin only)
    """
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """
        Update product with proper error handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete product with proper error handling
        """
        instance = self.get_object()
        
        # Check if product has stock records
        # We'll check this when inventory app is created
        # For now, just delete
        instance.delete()
        
        return Response(
            {'message': 'Product deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
