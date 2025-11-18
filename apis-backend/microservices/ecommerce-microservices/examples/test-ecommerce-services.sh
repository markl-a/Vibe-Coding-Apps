#!/bin/bash

# E-commerce Microservices Test Script
# This script tests all e-commerce microservices endpoints

set -e

echo "🧪 Testing E-commerce Microservices..."
echo "======================================"

BASE_URL="http://localhost:3000"
USER_SERVICE="http://localhost:3001"
PRODUCT_SERVICE="http://localhost:3002"
ORDER_SERVICE="http://localhost:3003"
PAYMENT_SERVICE="http://localhost:3004"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local data=$3
    local description=$4

    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "URL: $url"

    if [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        response=$(curl -s -X $method -H "Content-Type: application/json" -d "$data" -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" "$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Success (HTTP $http_code)${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "$body"
        return 1
    fi
}

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}1. Testing Health Checks${NC}"
echo -e "${BLUE}========================================${NC}"

test_endpoint "$USER_SERVICE/health" "GET" "" "User Service Health"
test_endpoint "$PRODUCT_SERVICE/health" "GET" "" "Product Service Health"
test_endpoint "$ORDER_SERVICE/health" "GET" "" "Order Service Health"
test_endpoint "$PAYMENT_SERVICE/health" "GET" "" "Payment Service Health"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}2. Testing User Service${NC}"
echo -e "${BLUE}========================================${NC}"

# Register user
USER_DATA='{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}'

test_endpoint "$USER_SERVICE/api/auth/register" "POST" "$USER_DATA" "User Registration"

# Login user
LOGIN_DATA='{
  "email": "test@example.com",
  "password": "password123"
}'

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$USER_SERVICE/api/auth/login")
TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
USER_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful, token obtained${NC}"
else
    echo -e "${RED}✗ Login failed${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}3. Testing Product Service${NC}"
echo -e "${BLUE}========================================${NC}"

# Create product
PRODUCT_DATA='{
  "name": "Laptop Pro 15",
  "description": "High-performance laptop for professionals",
  "sku": "LAPTOP-PRO-15-2024",
  "category": "Electronics",
  "subcategory": "Computers",
  "brand": "TechBrand",
  "price": 1299.99,
  "inventory": {
    "quantity": 50,
    "lowStockThreshold": 10
  },
  "tags": ["laptop", "professional", "high-performance"]
}'

response=$(curl -s -X POST -H "Content-Type: application/json" -d "$PRODUCT_DATA" "$PRODUCT_SERVICE/api/products")
PRODUCT_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['product']['_id'])" 2>/dev/null || echo "")

if [ -n "$PRODUCT_ID" ]; then
    echo -e "${GREEN}✓ Product created successfully${NC}"
    echo "Product ID: $PRODUCT_ID"
else
    echo -e "${RED}✗ Product creation failed${NC}"
fi

# Get products
test_endpoint "$PRODUCT_SERVICE/api/products?limit=10" "GET" "" "Get Products List"

# Get product by ID
if [ -n "$PRODUCT_ID" ]; then
    test_endpoint "$PRODUCT_SERVICE/api/products/$PRODUCT_ID" "GET" "" "Get Product by ID"
fi

# Test AI recommendations
test_endpoint "$PRODUCT_SERVICE/api/products/recommendations/ai?limit=5" "GET" "" "AI Product Recommendations"

# Test trending products
test_endpoint "$PRODUCT_SERVICE/api/products/trending?limit=5" "GET" "" "Trending Products"

# Test categories
test_endpoint "$PRODUCT_SERVICE/api/products/categories" "GET" "" "Product Categories"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}4. Testing Order Service${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -n "$USER_ID" ] && [ -n "$PRODUCT_ID" ]; then
    ORDER_DATA='{
      "userId": "'$USER_ID'",
      "items": [
        {
          "productId": "'$PRODUCT_ID'",
          "quantity": 2
        }
      ],
      "shippingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "phone": "+1234567890"
      }
    }'

    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$ORDER_DATA" "$ORDER_SERVICE/api/orders")
    ORDER_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['order']['_id'])" 2>/dev/null || echo "")

    if [ -n "$ORDER_ID" ]; then
        echo -e "${GREEN}✓ Order created successfully${NC}"
        echo "Order ID: $ORDER_ID"
    else
        echo -e "${RED}✗ Order creation failed${NC}"
        echo "$response"
    fi

    # Get order
    if [ -n "$ORDER_ID" ]; then
        test_endpoint "$ORDER_SERVICE/api/orders/$ORDER_ID" "GET" "" "Get Order by ID"
    fi
fi

# Get orders stats
test_endpoint "$ORDER_SERVICE/api/orders/stats/summary" "GET" "" "Order Statistics"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}5. Testing Payment Service${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -n "$USER_ID" ] && [ -n "$ORDER_ID" ]; then
    PAYMENT_DATA='{
      "orderId": "'$ORDER_ID'",
      "userId": "'$USER_ID'",
      "amount": 2599.98,
      "currency": "USD",
      "method": "credit_card",
      "paymentDetails": {
        "cardLast4": "4242",
        "cardBrand": "Visa",
        "cardExpiry": "12/25"
      },
      "billingAddress": {
        "firstName": "John",
        "lastName": "Doe",
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    }'

    response=$(curl -s -X POST -H "Content-Type: application/json" -d "$PAYMENT_DATA" "$PAYMENT_SERVICE/api/payments")
    TRANSACTION_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['payment']['transactionId'])" 2>/dev/null || echo "")

    if [ -n "$TRANSACTION_ID" ]; then
        echo -e "${GREEN}✓ Payment processed successfully${NC}"
        echo "Transaction ID: $TRANSACTION_ID"

        # Get payment details
        test_endpoint "$PAYMENT_SERVICE/api/payments/$TRANSACTION_ID" "GET" "" "Get Payment Details"
    else
        echo -e "${RED}✗ Payment processing failed${NC}"
        echo "$response"
    fi
fi

# Test fraud detection
FRAUD_CHECK_DATA='{
  "amount": 5000,
  "method": "credit_card",
  "userId": "'$USER_ID'",
  "billingAddress": {
    "country": "USA"
  }
}'

test_endpoint "$PAYMENT_SERVICE/api/payments/fraud/check" "POST" "$FRAUD_CHECK_DATA" "AI Fraud Detection"

# Get payment stats
test_endpoint "$PAYMENT_SERVICE/api/payments/stats/summary" "GET" "" "Payment Statistics"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}6. Testing API Documentation${NC}"
echo -e "${BLUE}========================================${NC}"

test_endpoint "$USER_SERVICE/api-docs" "GET" "" "User Service API Docs"
test_endpoint "$PRODUCT_SERVICE/api-docs" "GET" "" "Product Service API Docs"
test_endpoint "$ORDER_SERVICE/api-docs" "GET" "" "Order Service API Docs"
test_endpoint "$PAYMENT_SERVICE/api-docs" "GET" "" "Payment Service API Docs"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}7. Testing Prometheus Metrics${NC}"
echo -e "${BLUE}========================================${NC}"

test_endpoint "$USER_SERVICE/metrics" "GET" "" "User Service Metrics"
test_endpoint "$PRODUCT_SERVICE/metrics" "GET" "" "Product Service Metrics"
test_endpoint "$ORDER_SERVICE/metrics" "GET" "" "Order Service Metrics"
test_endpoint "$PAYMENT_SERVICE/metrics" "GET" "" "Payment Service Metrics"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All tests completed!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}📚 API Documentation URLs:${NC}"
echo "User Service: http://localhost:3001/api-docs"
echo "Product Service: http://localhost:3002/api-docs"
echo "Order Service: http://localhost:3003/api-docs"
echo "Payment Service: http://localhost:3004/api-docs"

echo -e "\n${BLUE}📊 Prometheus Metrics URLs:${NC}"
echo "User Service: http://localhost:3001/metrics"
echo "Product Service: http://localhost:3002/metrics"
echo "Order Service: http://localhost:3003/metrics"
echo "Payment Service: http://localhost:3004/metrics"
