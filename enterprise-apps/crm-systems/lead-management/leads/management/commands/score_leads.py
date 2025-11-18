"""
線索評分管理命令

用於批量計算和更新線索評分
"""

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q
from leads.models import Lead
from leads.ai_scoring import BatchLeadScorer, LeadAnalytics


class Command(BaseCommand):
    help = '批量計算線索評分'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='為所有線索重新計算評分',
        )
        parser.add_argument(
            '--new',
            action='store_true',
            help='只為新線索（評分為0）計算評分',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='重新評分多少天前的線索（默認30天）',
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['new', 'contacted', 'qualified', 'unqualified'],
            help='只為特定狀態的線索計算評分',
        )
        parser.add_argument(
            '--analytics',
            action='store_true',
            help='顯示評分分析報告',
        )

    def handle(self, *args, **options):
        if options['analytics']:
            self.show_analytics()
            return

        updated_count = 0

        if options['all']:
            self.stdout.write('正在為所有線索重新計算評分...')
            updated_count = BatchLeadScorer.score_all_leads()

        elif options['new']:
            self.stdout.write('正在為新線索計算評分...')
            updated_count = BatchLeadScorer.score_new_leads()

        elif options['status']:
            status = options['status']
            self.stdout.write(f'正在為狀態為 {status} 的線索計算評分...')
            leads = Lead.objects.filter(status=status)
            updated_count = BatchLeadScorer.score_all_leads(leads)

        else:
            self.stdout.write(f'正在重新評分 {options["days"]} 天前的線索...')
            updated_count = BatchLeadScorer.rescore_old_leads(options['days'])

        self.stdout.write(
            self.style.SUCCESS(f'✓ 成功更新 {updated_count} 個線索的評分')
        )

        # 顯示簡要統計
        self.show_brief_stats()

    def show_brief_stats(self):
        """顯示簡要統計信息"""
        distribution = LeadAnalytics.get_score_distribution()

        self.stdout.write('\n📊 評分分佈：')
        self.stdout.write(f'  優秀 (80-100): {distribution["excellent"]} 個線索')
        self.stdout.write(f'  良好 (60-79):  {distribution["good"]} 個線索')
        self.stdout.write(f'  一般 (40-59):  {distribution["average"]} 個線索')
        self.stdout.write(f'  較差 (0-39):   {distribution["poor"]} 個線索')

    def show_analytics(self):
        """顯示詳細分析報告"""
        self.stdout.write(self.style.SUCCESS('\n=== 線索評分分析報告 ===\n'))

        # 評分分佈
        distribution = LeadAnalytics.get_score_distribution()
        total = sum(distribution.values())

        self.stdout.write('📊 評分分佈：')
        for category, count in distribution.items():
            percentage = (count / total * 100) if total > 0 else 0
            self.stdout.write(f'  {category.capitalize():10s}: {count:4d} ({percentage:5.1f}%)')

        # 轉化率分析
        self.stdout.write('\n📈 評分範圍轉化率：')
        conversion_data = LeadAnalytics.get_conversion_by_score()

        for data in conversion_data:
            self.stdout.write(
                f"  {data['range'].capitalize():10s} ({data['min_score']}-{data['max_score']}): "
                f"{data['total_leads']:4d} 線索, "
                f"{data['converted_leads']:3d} 轉化, "
                f"{data['conversion_rate']:5.1f}% 轉化率"
            )

        self.stdout.write('\n')
