# Deploy Helper 範例

這個目錄包含部署輔助工具的範例，展示 `deploy_helper.py` 的功能。

## 檔案說明

- `deploy_config.yaml` - 完整的部署配置範例
- `Dockerfile` - Docker 映像建構範例
- `docker-compose.yml` - Docker Compose 多容器配置
- `k8s-deployment.yaml` - Kubernetes 部署配置
- `deploy.sh` - 自動化部署腳本

## 使用範例

### 1. Docker 部署

```bash
cd /home/user/Vibe-Coding-Apps/tools-utilities/dev-tools

# 建構 Docker 映像
python deploy_helper.py --docker-build

# 建構並指定標籤
python deploy_helper.py --docker-build --tag v1.0.0

# 使用自訂 Dockerfile
python deploy_helper.py --docker-build --dockerfile examples/deploy_examples/Dockerfile

# 推送到 Registry
python deploy_helper.py --docker-push --registry docker.io/myorg
```

### 2. Docker Compose 部署

```bash
# 啟動所有服務
python deploy_helper.py --compose-up

# 使用特定 compose 檔案
python deploy_helper.py --compose-up --compose-file examples/deploy_examples/docker-compose.yml

# 重新建構並啟動
python deploy_helper.py --compose-up --build

# 停止服務
python deploy_helper.py --compose-down

# 查看服務狀態
python deploy_helper.py --compose-ps
```

### 3. 環境部署

```bash
# 部署到測試環境
python deploy_helper.py --env staging

# 部署到生產環境
python deploy_helper.py --env production --tag v1.0.0

# 使用自訂配置
python deploy_helper.py --env production --config examples/deploy_examples/deploy_config.yaml
```

### 4. Kubernetes 部署

```bash
# 部署到 K8s
python deploy_helper.py --k8s-deploy

# 指定命名空間
python deploy_helper.py --k8s-deploy --namespace example-app

# 使用特定 manifest
python deploy_helper.py --k8s-deploy --manifest examples/deploy_examples/k8s-deployment.yaml

# 更新部署
python deploy_helper.py --k8s-rollout

# 回滾部署
python deploy_helper.py --k8s-rollback
```

### 5. 健康檢查

```bash
# 執行健康檢查
python deploy_helper.py --health-check

# 指定環境
python deploy_helper.py --health-check --env production

# 自訂健康檢查 URL
python deploy_helper.py --health-check --health-url https://api.example.com/health
```

### 6. 回滾部署

```bash
# 回滾到上一版本
python deploy_helper.py --rollback --env production

# 回滾到特定版本
python deploy_helper.py --rollback --env production --version v1.0.0

# 列出可用版本
python deploy_helper.py --list-versions --env production
```

### 7. 部署前檢查

```bash
# 執行所有檢查
python deploy_helper.py --pre-deploy-checks

# 只執行測試
python deploy_helper.py --pre-deploy-checks --checks tests

# 跳過特定檢查
python deploy_helper.py --deploy --skip-checks linting
```

## 部署策略

### 滾動更新 (Rolling Update)

逐步替換舊版本的實例：

```bash
python deploy_helper.py \
    --env production \
    --strategy rolling \
    --max-surge 1 \
    --max-unavailable 0
```

**優點**：
- 零停機時間
- 風險較低
- 易於實施

**缺點**：
- 部署速度較慢
- 新舊版本同時存在

### 藍綠部署 (Blue-Green)

同時維護兩個環境，切換流量：

```bash
python deploy_helper.py \
    --env production \
    --strategy blue-green \
    --verification-time 300
```

**優點**：
- 即時切換
- 易於回滾
- 完整測試

**缺點**：
- 資源需求雙倍
- 數據庫遷移複雜

### 金絲雀部署 (Canary)

逐步增加新版本的流量比例：

```bash
python deploy_helper.py \
    --env production \
    --strategy canary \
    --canary-steps 10,50,100
```

**優點**：
- 風險最低
- 逐步驗證
- 易於監控

**缺點**：
- 部署時間長
- 配置複雜

## Docker 範例

### 多階段建構

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
COPY --from=builder /opt/venv /opt/venv
COPY . .
CMD ["python", "app.py"]
```

### 健康檢查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/health || exit 1
```

## Docker Compose 範例

### 基本服務

```yaml
services:
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://db:5432/app
```

### 健康檢查

```yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Kubernetes 範例

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: myapp:latest
        ports:
        - containerPort: 8000
```

### 自動擴展

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 部署流程範例

### 完整部署流程

```bash
#!/bin/bash
# 完整的部署流程

# 1. 執行測試
echo "執行測試..."
python test_runner.py --coverage

# 2. 檢查程式碼格式
echo "檢查程式碼格式..."
python code_formatter.py . --check

# 3. 安全掃描
echo "執行安全掃描..."
python dependency_checker.py --security

# 4. 建構 Docker 映像
echo "建構 Docker 映像..."
python deploy_helper.py --docker-build --tag v1.0.0

# 5. 推送到 Registry
echo "推送映像..."
python deploy_helper.py --docker-push

# 6. 部署到測試環境
echo "部署到測試環境..."
python deploy_helper.py --env staging

# 7. 健康檢查
echo "執行健康檢查..."
python deploy_helper.py --health-check --env staging

# 8. 煙霧測試
echo "執行煙霧測試..."
python deploy_helper.py --smoke-tests --env staging

# 9. 部署到生產環境
read -p "部署到生產環境？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python deploy_helper.py --env production --tag v1.0.0
    python deploy_helper.py --health-check --env production
fi

echo "部署完成！"
```

## CI/CD 整合

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run tests
        run: python test_runner.py

      - name: Build Docker image
        run: python deploy_helper.py --docker-build --tag ${{ github.ref_name }}

      - name: Push to registry
        run: python deploy_helper.py --docker-push

      - name: Deploy to production
        run: python deploy_helper.py --env production --tag ${{ github.ref_name }}

      - name: Health check
        run: python deploy_helper.py --health-check --env production
```

### GitLab CI

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - python test_runner.py --coverage

build:
  stage: build
  script:
    - python deploy_helper.py --docker-build --tag $CI_COMMIT_TAG
    - python deploy_helper.py --docker-push

deploy_staging:
  stage: deploy
  script:
    - python deploy_helper.py --env staging
    - python deploy_helper.py --health-check --env staging
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - python deploy_helper.py --env production --tag $CI_COMMIT_TAG
    - python deploy_helper.py --health-check --env production
  only:
    - tags
  when: manual
```

## 監控和日誌

### 監控指標

```bash
# 查看部署狀態
python deploy_helper.py --status --env production

# 查看應用程式指標
python deploy_helper.py --metrics --env production

# 查看日誌
python deploy_helper.py --logs --env production --tail 100
```

### Prometheus 整合

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'example-app'
    static_configs:
      - targets: ['web:8000']
    metrics_path: '/metrics'
```

## 安全最佳實踐

1. **使用非 root 使用者**
2. **掃描映像漏洞**
3. **使用 Secret 管理敏感資料**
4. **啟用 HTTPS/TLS**
5. **實施網路策略**
6. **定期更新依賴**
7. **使用映像簽名**

## 常見問題

### Q: 如何回滾失敗的部署？

```bash
# 自動回滾到上一版本
python deploy_helper.py --rollback --env production

# 回滾到特定版本
python deploy_helper.py --rollback --env production --version v1.0.0
```

### Q: 如何檢視部署歷史？

```bash
# 列出所有部署版本
python deploy_helper.py --list-deployments --env production

# 顯示詳細資訊
python deploy_helper.py --deployment-info --version v1.0.0
```

### Q: 如何進行零停機部署？

使用滾動更新策略：
```bash
python deploy_helper.py \
    --env production \
    --strategy rolling \
    --max-unavailable 0
```

## 效能優化

1. **使用多階段建構** - 減少映像大小
2. **啟用快取** - 加速建構過程
3. **平行部署** - 減少部署時間
4. **使用 CDN** - 加速靜態資源
5. **實施自動擴展** - 處理流量峰值

## 故障排除

### 部署失敗

```bash
# 檢查部署日誌
python deploy_helper.py --logs --env production

# 驗證配置
python deploy_helper.py --validate-config

# 執行診斷
python deploy_helper.py --diagnose --env production
```

### 健康檢查失敗

```bash
# 詳細健康檢查
python deploy_helper.py --health-check --verbose

# 檢查服務狀態
python deploy_helper.py --service-status --env production
```
