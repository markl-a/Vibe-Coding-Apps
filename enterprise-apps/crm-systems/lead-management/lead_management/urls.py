"""
URL configuration for lead_management project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API認證
    path('api/auth/token/', obtain_auth_token, name='api_token_auth'),
    path('api/auth/', include('rest_framework.urls', namespace='rest_framework')),

    # Leads API
    path('api/', include('leads.urls', namespace='leads')),
]

# 開發環境下提供靜態文件和媒體文件服務
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# 自定義 Admin 標題
admin.site.site_header = '線索管理系統'
admin.site.site_title = '線索管理'
admin.site.index_title = '歡迎使用線索管理系統'
