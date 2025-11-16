from django.contrib import admin
from django.utils.html import format_html
from .models import Lead, Activity


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'company', 'email', 'status_badge', 'rating_badge', 'score', 'assigned_to', 'created_at']
    list_filter = ['status', 'rating', 'source', 'assigned_to', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'company']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'

    fieldsets = (
        ('基本信息', {
            'fields': ('first_name', 'last_name', 'company', 'job_title', 'email', 'phone')
        }),
        ('評分和狀態', {
            'fields': ('status', 'rating', 'score', 'assigned_to')
        }),
        ('來源和詳情', {
            'fields': ('source', 'industry', 'company_size', 'budget')
        }),
        ('備註', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('時間戳', {
            'fields': ('created_at', 'updated_at', 'last_contacted'),
            'classes': ('collapse',)
        }),
    )

    def status_badge(self, obj):
        colors = {
            'new': 'blue',
            'contacted': 'orange',
            'qualified': 'green',
            'converted': 'purple',
            'lost': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = '狀態'

    def rating_badge(self, obj):
        colors = {
            'hot': 'red',
            'warm': 'orange',
            'cold': 'blue',
        }
        color = colors.get(obj.rating, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_rating_display()
        )
    rating_badge.short_description = '評級'


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['lead', 'activity_type', 'subject', 'created_by', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['subject', 'description', 'lead__first_name', 'lead__last_name']
    date_hierarchy = 'created_at'
