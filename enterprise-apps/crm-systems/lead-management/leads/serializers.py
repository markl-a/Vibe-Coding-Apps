from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Lead, Activity


class UserSerializer(serializers.ModelSerializer):
    """用戶序列化器"""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ActivitySerializer(serializers.ModelSerializer):
    """活動記錄序列化器"""

    created_by_detail = UserSerializer(source='created_by', read_only=True)
    activity_type_display = serializers.CharField(
        source='get_activity_type_display',
        read_only=True
    )

    class Meta:
        model = Activity
        fields = [
            'id', 'lead', 'activity_type', 'activity_type_display',
            'subject', 'description', 'created_by', 'created_by_detail',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # 自動設置創建者
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class LeadListSerializer(serializers.ModelSerializer):
    """線索列表序列化器（簡化版本）"""

    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'company',
            'email', 'phone', 'status', 'status_display', 'rating',
            'rating_display', 'score', 'source', 'source_display',
            'assigned_to', 'assigned_to_detail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeadDetailSerializer(serializers.ModelSerializer):
    """線索詳細序列化器（完整版本）"""

    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    activities = ActivitySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'company',
            'job_title', 'email', 'phone', 'source', 'source_display',
            'score', 'status', 'status_display', 'rating', 'rating_display',
            'assigned_to', 'assigned_to_detail', 'industry', 'company_size',
            'budget', 'notes', 'created_at', 'updated_at', 'last_contacted',
            'activities'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_email(self, value):
        """驗證郵箱唯一性"""
        instance = self.instance
        if instance and instance.email == value:
            # 更新時，如果郵箱未改變，則跳過檢查
            return value

        if Lead.objects.filter(email=value).exists():
            raise serializers.ValidationError('此郵箱已被使用')
        return value

    def validate_score(self, value):
        """驗證評分範圍"""
        if value < 0 or value > 100:
            raise serializers.ValidationError('評分必須在 0-100 之間')
        return value


class LeadCreateSerializer(serializers.ModelSerializer):
    """線索創建序列化器"""

    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'company', 'job_title', 'email',
            'phone', 'source', 'status', 'rating', 'assigned_to',
            'industry', 'company_size', 'budget', 'notes'
        ]

    def validate_email(self, value):
        """驗證郵箱唯一性"""
        if Lead.objects.filter(email=value).exists():
            raise serializers.ValidationError('此郵箱已被使用')
        return value


class LeadScoreUpdateSerializer(serializers.Serializer):
    """線索評分更新序列化器"""

    score = serializers.IntegerField(min_value=0, max_value=100)
    reason = serializers.CharField(max_length=500, required=False)


class LeadStatusUpdateSerializer(serializers.Serializer):
    """線索狀態更新序列化器"""

    status = serializers.ChoiceField(choices=Lead.STATUS_CHOICES)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class LeadAssignSerializer(serializers.Serializer):
    """線索分配序列化器"""

    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=True
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)


class LeadStatisticsSerializer(serializers.Serializer):
    """線索統計序列化器"""

    total_leads = serializers.IntegerField()
    new_leads = serializers.IntegerField()
    contacted_leads = serializers.IntegerField()
    qualified_leads = serializers.IntegerField()
    converted_leads = serializers.IntegerField()
    conversion_rate = serializers.FloatField()
    average_score = serializers.FloatField()
    by_source = serializers.DictField()
    by_rating = serializers.DictField()
