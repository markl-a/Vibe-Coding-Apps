# Lead Management System

基於 Django + MySQL 的線索管理系統，幫助銷售團隊有效捕獲、評分和轉化潛在客戶。

## 功能特點

- 📥 線索捕獲 - 多渠道線索收集（Web表單、API、批量導入）
- ⭐ 智能評分 - 基於規則和機器學習的線索評分
- 🎯 線索分配 - 自動化線索分配規則
- 📧 郵件整合 - 自動發送跟進郵件
- 📊 線索追蹤 - 完整的線索生命週期管理
- 🔄 線索轉化 - 轉化為商機和客戶
- 📈 分析報表 - 線索來源分析、轉化率統計
- 🔔 自動提醒 - 跟進提醒和任務通知
- 👥 團隊協作 - 銷售團隊協作功能
- 🌐 Web 界面 - 現代化的管理界面

## 技術棧

- **Web 框架**: Django 4.2
- **資料庫**: MySQL 8.0
- **ORM**: Django ORM
- **前端**: Django Templates + Bootstrap 5
- **表單**: Django Forms + Crispy Forms
- **認證**: Django Auth
- **任務隊列**: Celery + Redis
- **郵件**: Django Email + SendGrid/SMTP
- **API**: Django REST Framework

## 快速開始

### 環境要求

- Python 3.9+
- MySQL 8.0+
- Redis (用於 Celery)

### 安裝

```bash
# 創建虛擬環境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt
```

### 配置資料庫

```bash
# 創建 MySQL 資料庫
mysql -u root -p
CREATE DATABASE lead_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'leaduser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON lead_management.* TO 'leaduser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 配置環境變數

```bash
cp .env.example .env
# 編輯 .env 文件設置資料庫連接等
```

### 初始化資料庫

```bash
# 運行遷移
python manage.py migrate

# 創建超級用戶
python manage.py createsuperuser

# 載入測試數據 (可選)
python manage.py loaddata initial_data.json
```

### 啟動開發伺服器

```bash
# 啟動 Django 伺服器
python manage.py runserver

# 啟動 Celery worker (新終端)
celery -A lead_management worker -l info

# 啟動 Celery beat (新終端)
celery -A lead_management beat -l info
```

訪問 http://localhost:8000

## 專案結構

```
lead-management/
├── lead_management/       # 專案配置
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── leads/                 # 線索應用
│   ├── models.py         # 數據模型
│   ├── views.py          # 視圖
│   ├── forms.py          # 表單
│   ├── admin.py          # 管理後台
│   ├── tasks.py          # Celery 任務
│   └── api.py            # REST API
├── templates/            # 模板文件
├── static/              # 靜態文件
├── manage.py
└── requirements.txt
```

## 數據模型

### Lead (線索)

```python
class Lead(models.Model):
    # 基本信息
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    company = CharField(max_length=255)
    job_title = CharField(max_length=100)
    email = EmailField(unique=True)
    phone = CharField(max_length=50)

    # 來源信息
    source = CharField(max_length=50)  # Web, Email, Phone, Referral
    campaign = ForeignKey('Campaign')

    # 評分和狀態
    score = IntegerField(default=0)
    status = CharField(max_length=20)  # New, Contacted, Qualified, Lost
    rating = CharField(max_length=10)  # Hot, Warm, Cold

    # 分配和所有權
    assigned_to = ForeignKey(User)

    # 額外信息
    industry = CharField(max_length=100)
    company_size = CharField(max_length=50)
    budget = DecimalField()
    notes = TextField()

    # 時間戳
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
    last_contacted = DateTimeField()
```

## 主要功能

### 1. 線索捕獲

#### Web 表單捕獲
```html
<!-- 在網站上嵌入表單 -->
<form action="{% url 'leads:capture' %}" method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">提交</button>
</form>
```

#### API 捕獲
```bash
curl -X POST http://localhost:8000/api/leads/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token your-api-token" \
  -d '{
    "first_name": "張",
    "last_name": "三",
    "email": "zhang@example.com",
    "company": "ABC 公司",
    "source": "Website"
  }'
```

#### CSV 批量導入
```python
python manage.py import_leads leads.csv
```

### 2. 線索評分

自動評分規則：

```python
# 評分規則範例
scoring_rules = {
    'job_title': {
        'CEO': 20,
        'Director': 15,
        'Manager': 10,
        'Other': 5
    },
    'company_size': {
        '1000+': 20,
        '100-1000': 15,
        '10-100': 10,
        '<10': 5
    },
    'email_opened': 5,
    'website_visited': 10,
    'form_submitted': 15
}
```

### 3. 線索分配

自動分配規則：
- 輪詢分配 (Round-robin)
- 地理位置分配
- 技能匹配分配
- 負載均衡分配

### 4. 郵件自動化

```python
# 自動發送跟進郵件
from leads.tasks import send_follow_up_email

# 新線索歡迎郵件
send_follow_up_email.delay(
    lead_id=lead.id,
    template='welcome',
    delay_hours=0
)

# 3天後跟進
send_follow_up_email.apply_async(
    args=[lead.id, 'follow_up_1'],
    countdown=3 * 24 * 60 * 60
)
```

## API 文檔

### 認證

```bash
# 獲取 Token
curl -X POST http://localhost:8000/api/auth/token/ \
  -d "username=admin&password=password"
```

### 線索管理 API

#### 獲取線索列表
```http
GET /api/leads/?status=new&rating=hot
Authorization: Token {your-token}
```

#### 創建線索
```http
POST /api/leads/
Authorization: Token {your-token}
Content-Type: application/json

{
  "first_name": "李",
  "last_name": "四",
  "email": "li@example.com",
  "company": "XYZ 公司",
  "phone": "0912-345-678",
  "source": "Website",
  "job_title": "經理"
}
```

#### 更新線索
```http
PATCH /api/leads/{id}/
Authorization: Token {your-token}
Content-Type: application/json

{
  "status": "qualified",
  "rating": "hot",
  "score": 85
}
```

#### 轉化為客戶
```http
POST /api/leads/{id}/convert/
Authorization: Token {your-token}
```

## 管理命令

```bash
# 重新計算所有線索評分
python manage.py recalculate_scores

# 清理舊線索
python manage.py cleanup_old_leads --days=180

# 發送每日摘要
python manage.py send_daily_digest

# 導入線索
python manage.py import_leads data.csv

# 導出線索
python manage.py export_leads --status=qualified --format=csv
```

## 測試

```bash
# 運行所有測試
python manage.py test

# 運行特定測試
python manage.py test leads.tests.test_scoring

# 測試覆蓋率
coverage run --source='.' manage.py test
coverage report
```

## 部署

### 生產環境設置

```bash
# 收集靜態文件
python manage.py collectstatic --noinput

# 使用 Gunicorn
gunicorn lead_management.wsgi:application --bind 0.0.0.0:8000
```

### Docker 部署

```bash
docker-compose up -d
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /path/to/static/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 環境變數

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,yourdomain.com

# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=lead_management
DB_USER=leaduser
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 開發計劃

- [x] 基礎 CRUD 功能
- [x] 線索評分系統
- [x] 線索分配功能
- [x] Django Admin 後台
- [x] REST API
- [x] 郵件自動化
- [ ] 機器學習評分
- [ ] 進階報表
- [ ] WhatsApp 整合
- [ ] 行動應用
- [ ] 多語言支援
- [ ] 權限管理系統

## 授權

MIT License

## 相關資源

- [Django 文檔](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Celery 文檔](https://docs.celeryproject.org/)
