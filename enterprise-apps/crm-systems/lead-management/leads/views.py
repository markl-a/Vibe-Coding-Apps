from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend

from .models import Lead, Activity
from .serializers import (
    LeadListSerializer,
    LeadDetailSerializer,
    LeadCreateSerializer,
    LeadScoreUpdateSerializer,
    LeadStatusUpdateSerializer,
    LeadAssignSerializer,
    LeadStatisticsSerializer,
    ActivitySerializer,
)


class LeadViewSet(viewsets.ModelViewSet):
    """
    線索管理 ViewSet

    提供完整的 CRUD 操作以及自定義動作：
    - list: 獲取線索列表
    - retrieve: 獲取線索詳情
    - create: 創建線索
    - update: 更新線索
    - partial_update: 部分更新線索
    - destroy: 刪除線索
    - update_score: 更新線索評分
    - update_status: 更新線索狀態
    - assign: 分配線索
    - statistics: 獲取統計數據
    - my_leads: 獲取我的線索
    """

    queryset = Lead.objects.all().select_related('assigned_to').prefetch_related('activities')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'rating', 'source', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'email', 'company', 'phone']
    ordering_fields = ['created_at', 'updated_at', 'score', 'last_contacted']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """根據不同的動作返回不同的序列化器"""
        if self.action == 'list':
            return LeadListSerializer
        elif self.action == 'create':
            return LeadCreateSerializer
        elif self.action == 'update_score':
            return LeadScoreUpdateSerializer
        elif self.action == 'update_status':
            return LeadStatusUpdateSerializer
        elif self.action == 'assign':
            return LeadAssignSerializer
        elif self.action == 'statistics':
            return LeadStatisticsSerializer
        return LeadDetailSerializer

    def get_queryset(self):
        """自定義查詢集"""
        queryset = super().get_queryset()

        # 根據評分範圍過濾
        score_min = self.request.query_params.get('score_min')
        score_max = self.request.query_params.get('score_max')
        if score_min:
            queryset = queryset.filter(score__gte=score_min)
        if score_max:
            queryset = queryset.filter(score__lte=score_max)

        # 根據創建日期範圍過濾
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)

        return queryset

    def perform_create(self, serializer):
        """創建線索時的額外處理"""
        lead = serializer.save()

        # 創建初始活動記錄
        Activity.objects.create(
            lead=lead,
            activity_type='note',
            subject='線索已創建',
            description=f'線索來源: {lead.get_source_display()}',
            created_by=self.request.user
        )

    def perform_update(self, serializer):
        """更新線索時的額外處理"""
        old_status = serializer.instance.status
        lead = serializer.save()

        # 如果狀態改變，創建活動記錄
        if old_status != lead.status:
            Activity.objects.create(
                lead=lead,
                activity_type='note',
                subject='狀態已更新',
                description=f'狀態從 {dict(Lead.STATUS_CHOICES).get(old_status)} 更新為 {lead.get_status_display()}',
                created_by=self.request.user
            )

    @action(detail=True, methods=['post'])
    def update_score(self, request, pk=None):
        """
        更新線索評分

        POST /api/leads/{id}/update_score/
        {
            "score": 85,
            "reason": "客戶對產品表現出強烈興趣"
        }
        """
        lead = self.get_object()
        serializer = LeadScoreUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_score = lead.score
        new_score = serializer.validated_data['score']
        reason = serializer.validated_data.get('reason', '')

        lead.score = new_score
        lead.save(update_fields=['score', 'updated_at'])

        # 創建活動記錄
        Activity.objects.create(
            lead=lead,
            activity_type='note',
            subject='評分已更新',
            description=f'評分從 {old_score} 更新為 {new_score}。原因: {reason}',
            created_by=request.user
        )

        return Response({
            'message': '評分更新成功',
            'old_score': old_score,
            'new_score': new_score
        })

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        更新線索狀態

        POST /api/leads/{id}/update_status/
        {
            "status": "qualified",
            "notes": "已確認客戶需求和預算"
        }
        """
        lead = self.get_object()
        serializer = LeadStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = lead.status
        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')

        lead.status = new_status
        if new_status == 'contacted':
            lead.last_contacted = timezone.now()
        lead.save(update_fields=['status', 'last_contacted', 'updated_at'])

        # 創建活動記錄
        Activity.objects.create(
            lead=lead,
            activity_type='note',
            subject='狀態已更新',
            description=f'狀態從 {dict(Lead.STATUS_CHOICES).get(old_status)} 更新為 {dict(Lead.STATUS_CHOICES).get(new_status)}。備註: {notes}',
            created_by=request.user
        )

        return Response({
            'message': '狀態更新成功',
            'old_status': old_status,
            'new_status': new_status
        })

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        分配線索給銷售人員

        POST /api/leads/{id}/assign/
        {
            "assigned_to": 2,
            "notes": "分配給張經理跟進"
        }
        """
        lead = self.get_object()
        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_assignee = lead.assigned_to
        new_assignee = serializer.validated_data['assigned_to']
        notes = serializer.validated_data.get('notes', '')

        lead.assigned_to = new_assignee
        lead.save(update_fields=['assigned_to', 'updated_at'])

        # 創建活動記錄
        old_name = old_assignee.username if old_assignee else '未分配'
        new_name = new_assignee.username if new_assignee else '未分配'

        Activity.objects.create(
            lead=lead,
            activity_type='note',
            subject='線索已重新分配',
            description=f'從 {old_name} 分配給 {new_name}。備註: {notes}',
            created_by=request.user
        )

        return Response({
            'message': '線索分配成功',
            'assigned_to': new_name
        })

    @action(detail=False, methods=['get'])
    def my_leads(self, request):
        """
        獲取當前用戶的線索

        GET /api/leads/my_leads/
        """
        queryset = self.filter_queryset(
            self.get_queryset().filter(assigned_to=request.user)
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        獲取線索統計數據

        GET /api/leads/statistics/
        """
        queryset = self.get_queryset()

        # 基本統計
        total_leads = queryset.count()
        status_counts = queryset.values('status').annotate(count=Count('id'))

        # 計算各狀態數量
        status_dict = {item['status']: item['count'] for item in status_counts}
        new_leads = status_dict.get('new', 0)
        contacted_leads = status_dict.get('contacted', 0)
        qualified_leads = status_dict.get('qualified', 0)
        converted_leads = status_dict.get('converted', 0)

        # 轉化率
        conversion_rate = (converted_leads / total_leads * 100) if total_leads > 0 else 0

        # 平均評分
        avg_score = queryset.aggregate(Avg('score'))['score__avg'] or 0

        # 按來源統計
        by_source = dict(
            queryset.values('source').annotate(count=Count('id')).values_list('source', 'count')
        )

        # 按評級統計
        by_rating = dict(
            queryset.values('rating').annotate(count=Count('id')).values_list('rating', 'count')
        )

        data = {
            'total_leads': total_leads,
            'new_leads': new_leads,
            'contacted_leads': contacted_leads,
            'qualified_leads': qualified_leads,
            'converted_leads': converted_leads,
            'conversion_rate': round(conversion_rate, 2),
            'average_score': round(avg_score, 2),
            'by_source': by_source,
            'by_rating': by_rating,
        }

        serializer = LeadStatisticsSerializer(data)
        return Response(serializer.data)


class ActivityViewSet(viewsets.ModelViewSet):
    """
    活動記錄 ViewSet

    管理與線索相關的所有活動記錄
    """

    queryset = Activity.objects.all().select_related('lead', 'created_by')
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['lead', 'activity_type', 'created_by']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """自定義查詢集"""
        queryset = super().get_queryset()

        # 根據線索 ID 過濾
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        # 根據日期範圍過濾
        created_after = self.request.query_params.get('created_after')
        created_before = self.request.query_params.get('created_before')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        if created_before:
            queryset = queryset.filter(created_at__lte=created_before)

        return queryset

    def perform_create(self, serializer):
        """創建活動時自動設置創建者"""
        serializer.save(created_by=self.request.user)

        # 更新線索的最後聯繫時間
        lead = serializer.validated_data['lead']
        activity_type = serializer.validated_data['activity_type']

        if activity_type in ['call', 'email', 'meeting']:
            lead.last_contacted = timezone.now()
            lead.save(update_fields=['last_contacted'])
