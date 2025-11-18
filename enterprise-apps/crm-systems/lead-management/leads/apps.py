from django.apps import AppConfig


class LeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'leads'
    verbose_name = '線索管理'

    def ready(self):
        """應用程序初始化時執行"""
        # 導入信號處理器（如果需要）
        # import leads.signals
        pass
