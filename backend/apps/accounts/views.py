from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User
from .serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer
from .permissions import IsAdminOnly


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login and get JWT tokens
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username is None or password is None:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'User account is disabled'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    """
    List all users or create a new user (Admin only)
    
    GET /api/auth/users/ - List all users (admin only)
    POST /api/auth/users/ - Create new user (admin only)
    """
    queryset = User.objects.select_related('shop').all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]
    
    def get_queryset(self):
        """
        Filter users based on query parameters
        """
        queryset = User.objects.select_related('shop').all()
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by shop
        shop_id = self.request.query_params.get('shop_id', None)
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        
        # Filter by is_active
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | Q(email__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def get_serializer_class(self):
        """
        Use RegisterSerializer for POST, UserSerializer for GET
        """
        if self.request.method == 'POST':
            return RegisterSerializer
        return UserSerializer


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user (Admin only)
    
    GET /api/auth/users/{id}/ - Get user details (admin only)
    PUT /api/auth/users/{id}/ - Update user (admin only)
    PATCH /api/auth/users/{id}/ - Partial update user (admin only)
    DELETE /api/auth/users/{id}/ - Delete user (admin only)
    """
    queryset = User.objects.select_related('shop').all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]
    lookup_field = 'pk'
    
    def update(self, request, *args, **kwargs):
        """
        Update user with proper error handling
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Prevent admin from deleting themselves
        if instance.id == request.user.id and not request.data.get('is_active', True):
            return Response(
                {'error': 'You cannot deactivate your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data)
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete user - prevent admin from deleting themselves
        """
        instance = self.get_object()
        
        # Prevent admin from deleting themselves
        if instance.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.delete()
        
        return Response(
            {'message': 'User deleted successfully.'},
            status=status.HTTP_204_NO_CONTENT
        )
