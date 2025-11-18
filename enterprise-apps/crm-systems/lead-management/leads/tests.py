from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Lead, Activity


class LeadModelTest(TestCase):
    """Lead 模型測試"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_create_lead(self):
        """測試創建線索"""
        lead = Lead.objects.create(
            first_name='張',
            last_name='三',
            email='zhang@example.com',
            company='測試公司',
            assigned_to=self.user
        )
        self.assertEqual(lead.full_name, '張 三')
        self.assertEqual(lead.status, 'new')
        self.assertEqual(lead.score, 0)

    def test_lead_str(self):
        """測試線索字符串表示"""
        lead = Lead.objects.create(
            first_name='李',
            last_name='四',
            email='li@example.com',
            company='ABC公司'
        )
        self.assertEqual(str(lead), '李 四 - ABC公司')


class ActivityModelTest(TestCase):
    """Activity 模型測試"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.lead = Lead.objects.create(
            first_name='王',
            last_name='五',
            email='wang@example.com'
        )

    def test_create_activity(self):
        """測試創建活動記錄"""
        activity = Activity.objects.create(
            lead=self.lead,
            activity_type='call',
            subject='初次通話',
            description='與客戶進行初次溝通',
            created_by=self.user
        )
        self.assertEqual(activity.activity_type, 'call')
        self.assertEqual(activity.lead, self.lead)


class LeadAPITest(APITestCase):
    """Lead API 測試"""

    def setUp(self):
        """設置測試環境"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        # 創建測試數據
        self.lead = Lead.objects.create(
            first_name='張',
            last_name='三',
            email='zhang@example.com',
            company='測試公司',
            assigned_to=self.user
        )

    def test_get_leads_list(self):
        """測試獲取線索列表"""
        response = self.client.get('/api/leads/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_get_lead_detail(self):
        """測試獲取線索詳情"""
        response = self.client.get(f'/api/leads/{self.lead.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'zhang@example.com')

    def test_create_lead(self):
        """測試創建線索"""
        data = {
            'first_name': '李',
            'last_name': '四',
            'email': 'li@example.com',
            'company': '新公司',
            'status': 'new',
            'rating': 'warm'
        }
        response = self.client.post('/api/leads/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 2)

    def test_update_lead(self):
        """測試更新線索"""
        data = {
            'first_name': '張',
            'last_name': '三',
            'email': 'zhang@example.com',
            'company': '更新後的公司',
            'status': 'contacted',
            'rating': 'hot'
        }
        response = self.client.put(f'/api/leads/{self.lead.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.company, '更新後的公司')

    def test_update_lead_score(self):
        """測試更新線索評分"""
        data = {
            'score': 85,
            'reason': '客戶興趣濃厚'
        }
        response = self.client.post(f'/api/leads/{self.lead.id}/update_score/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.score, 85)

    def test_update_lead_status(self):
        """測試更新線索狀態"""
        data = {
            'status': 'qualified',
            'notes': '已確認需求'
        }
        response = self.client.post(f'/api/leads/{self.lead.id}/update_status/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.status, 'qualified')

    def test_assign_lead(self):
        """測試分配線索"""
        new_user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='newpass123'
        )
        data = {
            'assigned_to': new_user.id,
            'notes': '分配給新銷售'
        }
        response = self.client.post(f'/api/leads/{self.lead.id}/assign/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.assigned_to, new_user)

    def test_my_leads(self):
        """測試獲取我的線索"""
        # 創建另一個用戶的線索
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='otherpass123'
        )
        Lead.objects.create(
            first_name='王',
            last_name='五',
            email='wang@example.com',
            assigned_to=other_user
        )

        response = self.client.get('/api/leads/my_leads/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['email'], 'zhang@example.com')

    def test_lead_statistics(self):
        """測試獲取統計數據"""
        # 創建不同狀態的線索
        Lead.objects.create(
            first_name='李',
            last_name='四',
            email='li@example.com',
            status='contacted'
        )
        Lead.objects.create(
            first_name='王',
            last_name='五',
            email='wang@example.com',
            status='converted'
        )

        response = self.client.get('/api/leads/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_leads'], 3)

    def test_unauthorized_access(self):
        """測試未授權訪問"""
        self.client.credentials()  # 移除認證
        response = self.client.get('/api/leads/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ActivityAPITest(APITestCase):
    """Activity API 測試"""

    def setUp(self):
        """設置測試環境"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        self.lead = Lead.objects.create(
            first_name='張',
            last_name='三',
            email='zhang@example.com'
        )

    def test_create_activity(self):
        """測試創建活動記錄"""
        data = {
            'lead': self.lead.id,
            'activity_type': 'call',
            'subject': '電話溝通',
            'description': '討論產品需求'
        }
        response = self.client.post('/api/activities/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Activity.objects.count(), 1)

    def test_get_activities(self):
        """測試獲取活動列表"""
        Activity.objects.create(
            lead=self.lead,
            activity_type='email',
            subject='發送郵件',
            created_by=self.user
        )
        response = self.client.get('/api/activities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_activities_by_lead(self):
        """測試按線索過濾活動"""
        Activity.objects.create(
            lead=self.lead,
            activity_type='meeting',
            subject='會議',
            created_by=self.user
        )

        response = self.client.get(f'/api/activities/?lead_id={self.lead.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
