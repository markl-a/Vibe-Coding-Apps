from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ActivityViewSet

# 創建路由器
router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'activities', ActivityViewSet, basename='activity')

app_name = 'leads'

urlpatterns = [
    path('', include(router.urls)),
]
