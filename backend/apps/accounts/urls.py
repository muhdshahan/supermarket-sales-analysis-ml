from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register, login, profile, UserListCreateView, UserRetrieveUpdateDestroyView

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('profile/', profile, name='profile'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(), name='user-detail'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

