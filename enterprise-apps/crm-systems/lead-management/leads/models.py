from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Lead(models.Model):
    """線索模型"""

    STATUS_CHOICES = [
        ('new', '新線索'),
        ('contacted', '已聯繫'),
        ('qualified', '已確認'),
        ('unqualified', '不符合'),
        ('converted', '已轉化'),
        ('lost', '失敗'),
    ]

    RATING_CHOICES = [
        ('hot', '熱門'),
        ('warm', '溫和'),
        ('cold', '冷淡'),
    ]

    SOURCE_CHOICES = [
        ('website', '網站'),
        ('email', '郵件'),
        ('phone', '電話'),
        ('referral', '推薦'),
        ('social', '社交媒體'),
        ('event', '活動'),
        ('other', '其他'),
    ]

    # 基本信息
    first_name = models.CharField('名', max_length=100)
    last_name = models.CharField('姓', max_length=100)
    company = models.CharField('公司', max_length=255, blank=True)
    job_title = models.CharField('職位', max_length=100, blank=True)
    email = models.EmailField('電子郵件', unique=True)
    phone = models.CharField('電話', max_length=50, blank=True)

    # 來源信息
    source = models.CharField('來源', max_length=50, choices=SOURCE_CHOICES, default='website')

    # 評分和狀態
    score = models.IntegerField(
        '評分',
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    status = models.CharField('狀態', max_length=20, choices=STATUS_CHOICES, default='new')
    rating = models.CharField('評級', max_length=10, choices=RATING_CHOICES, default='cold')

    # 分配
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads',
        verbose_name='分配給'
    )

    # 額外信息
    industry = models.CharField('行業', max_length=100, blank=True)
    company_size = models.CharField('公司規模', max_length=50, blank=True)
    budget = models.DecimalField('預算', max_digits=15, decimal_places=2, null=True, blank=True)
    notes = models.TextField('備註', blank=True)

    # 時間戳
    created_at = models.DateTimeField('創建時間', auto_now_add=True)
    updated_at = models.DateTimeField('更新時間', auto_now=True)
    last_contacted = models.DateTimeField('最後聯繫時間', null=True, blank=True)

    class Meta:
        verbose_name = '線索'
        verbose_name_plural = '線索'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.company}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Activity(models.Model):
    """活動記錄"""

    ACTIVITY_TYPES = [
        ('call', '電話'),
        ('email', '郵件'),
        ('meeting', '會議'),
        ('note', '備註'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField('類型', max_length=20, choices=ACTIVITY_TYPES)
    subject = models.CharField('主題', max_length=255)
    description = models.TextField('描述', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField('創建時間', auto_now_add=True)

    class Meta:
        verbose_name = '活動'
        verbose_name_plural = '活動'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.subject}"
