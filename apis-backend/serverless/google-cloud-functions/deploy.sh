#!/bin/bash

# Google Cloud Functions 部署腳本
# 使用方法: ./deploy.sh [function-name] [region]

set -e

# 配置
PROJECT_ID=${GCP_PROJECT:-"your-project-id"}
REGION=${2:-"asia-east1"}
RUNTIME="nodejs18"

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Google Cloud Functions 部署工具${NC}"
echo "======================================"

# 檢查 gcloud 是否安裝
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}錯誤: gcloud CLI 未安裝${NC}"
    echo "請訪問 https://cloud.google.com/sdk/docs/install 安裝"
    exit 1
fi

# 設定專案
echo -e "${YELLOW}設定專案: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# 部署函數
deploy_function() {
    local FUNCTION_NAME=$1
    local TRIGGER_TYPE=$2
    local ENTRY_POINT=$3
    local SOURCE_DIR=$4

    echo -e "${GREEN}部署 ${FUNCTION_NAME}...${NC}"

    case $TRIGGER_TYPE in
        "http")
            gcloud functions deploy ${FUNCTION_NAME} \
                --gen2 \
                --runtime=${RUNTIME} \
                --region=${REGION} \
                --source=${SOURCE_DIR} \
                --entry-point=${ENTRY_POINT} \
                --trigger-http \
                --allow-unauthenticated
            ;;

        "storage")
            gcloud functions deploy ${FUNCTION_NAME} \
                --gen2 \
                --runtime=${RUNTIME} \
                --region=${REGION} \
                --source=${SOURCE_DIR} \
                --entry-point=${ENTRY_POINT} \
                --trigger-bucket=${BUCKET_NAME}
            ;;

        "pubsub")
            gcloud functions deploy ${FUNCTION_NAME} \
                --gen2 \
                --runtime=${RUNTIME} \
                --region=${REGION} \
                --source=${SOURCE_DIR} \
                --entry-point=${ENTRY_POINT} \
                --trigger-topic=${TOPIC_NAME}
            ;;

        "firestore")
            gcloud functions deploy ${FUNCTION_NAME} \
                --gen2 \
                --runtime=${RUNTIME} \
                --region=${REGION} \
                --source=${SOURCE_DIR} \
                --entry-point=${ENTRY_POINT} \
                --trigger-event-filters="type=google.cloud.firestore.document.v1.created" \
                --trigger-event-filters="database=(default)" \
                --trigger-location=${REGION}
            ;;
    esac

    echo -e "${GREEN}✓ ${FUNCTION_NAME} 部署成功${NC}"
}

# 根據參數部署特定函數或全部函數
if [ -z "$1" ]; then
    echo -e "${YELLOW}部署所有函數...${NC}"

    # HTTP 函數
    deploy_function "helloWorld" "http" "helloWorld" "./functions/http"
    deploy_function "usersAPI" "http" "usersAPI" "./functions/http"
    deploy_function "imageOptimizer" "http" "imageOptimizer" "./functions/http"
    deploy_function "emailSender" "http" "emailSender" "./functions/http"

    echo -e "${GREEN}======================================"
    echo -e "所有函數部署完成！${NC}"
else
    FUNCTION=$1

    case $FUNCTION in
        "hello")
            deploy_function "helloWorld" "http" "helloWorld" "./functions/http"
            ;;
        "users")
            deploy_function "usersAPI" "http" "usersAPI" "./functions/http"
            ;;
        "image")
            deploy_function "imageOptimizer" "http" "imageOptimizer" "./functions/http"
            ;;
        "email")
            deploy_function "emailSender" "http" "emailSender" "./functions/http"
            ;;
        *)
            echo -e "${RED}未知函數: $FUNCTION${NC}"
            echo "可用的函數:"
            echo "  hello  - Hello World"
            echo "  users  - Users API"
            echo "  image  - Image Optimizer"
            echo "  email  - Email Sender"
            exit 1
            ;;
    esac
fi

echo ""
echo -e "${GREEN}部署完成！${NC}"
echo "查看函數: https://console.cloud.google.com/functions/list?project=${PROJECT_ID}"
