#!/bin/bash
# 範例部署腳本
# 使用 deploy_helper.py 輔助生成

set -e

ENV=${1:-staging}
TAG=${2:-latest}

echo "開始部署到 $ENV 環境..."
echo "版本標籤: $TAG"

# 1. 執行測試
echo "執行測試..."
python test_runner.py --coverage

# 2. 檢查程式碼格式
echo "檢查程式碼格式..."
python code_formatter.py src/ --check

# 3. 檢查依賴
echo "檢查依賴..."
python dependency_checker.py --security

# 4. 建立 Docker 映像
echo "建立 Docker 映像..."
python deploy_helper.py --docker-build

# 5. 部署
echo "部署應用..."
python deploy_helper.py --env $ENV --tag $TAG

# 6. 健康檢查
echo "執行健康檢查..."
python deploy_helper.py --health-check

echo "✓ 部署完成！"
