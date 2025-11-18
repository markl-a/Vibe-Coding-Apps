# E-commerce GraphQL API - AI Features

## 🤖 AI 增強功能

這個電商 GraphQL API 可以使用共享的 AI 服務來增強功能。

### 可用的 AI 功能

#### 1. 商品描述優化
```graphql
mutation {
  optimizeProductDescription(productId: "id") {
    optimizedDescription
    seoTitle
    seoDescription
    keywords
  }
}
```

#### 2. 智能商品推薦
```graphql
query {
  recommendedProducts(userId: "id", limit: 5) {
    id
    name
    price
    similarity
  }
}
```

#### 3. 評論情感分析
```graphql
query {
  productReviews(productId: "id") {
    content
    rating
    aiSentiment {
      overall
      score
    }
  }
}
```

#### 4. 智能搜尋
```graphql
query {
  searchProducts(query: "red shoes") {
    products {
      id
      name
    }
    suggestions  # AI 生成的搜尋建議
  }
}
```

#### 5. 庫存預測（進階）
```graphql
query {
  predictStockDemand(productId: "id", days: 30) {
    date
    predictedDemand
    confidence
  }
}
```

#### 6. 個性化定價建議（進階）
```graphql
mutation {
  suggestPricing(productId: "id") {
    recommendedPrice
    priceRange {
      min
      max
    }
    reasoning
  }
}
```

## 🚀 如何啟用

### 1. 複製共享工具

```bash
# 從專案根目錄
cp -r blog-graphql-api/src/services/aiService.js ecommerce-graphql/src/services/
cp -r blog-graphql-api/src/utils/customScalars.js ecommerce-graphql/src/utils/
```

### 2. 配置環境變數

在 `.env` 文件中添加：

```env
# AI Service
AI_MOCK_MODE=true
AI_PROVIDER=openai
AI_API_KEY=your-key-here
AI_MODEL=gpt-3.5-turbo
```

### 3. 在 Resolvers 中使用

```javascript
const aiService = require('./services/aiService');

const resolvers = {
  Mutation: {
    optimizeProductDescription: async (parent, { productId }, context) => {
      const product = await Product.findById(productId);
      const seo = await aiService.generateSEOContent(
        product.name,
        product.description
      );
      return seo;
    },
  },

  Query: {
    recommendedProducts: async (parent, { userId, limit }, context) => {
      const user = await User.findById(userId);
      const history = await Order.find({ userId }).populate('products');

      // 使用 AI 生成推薦
      const recommendations = await aiService.generateRecommendations(
        { title: 'User purchases' },
        history,
        limit
      );

      return recommendations;
    },
  },
};
```

## 📝 實現建議

### 商品推薦引擎

```javascript
async function generateProductRecommendations(userId, limit = 5) {
  // 1. 獲取用戶購買歷史
  const orders = await Order.find({ userId })
    .populate('items.product')
    .sort({ createdAt: -1 })
    .limit(10);

  // 2. 提取商品特徵
  const purchasedProducts = orders.flatMap(order =>
    order.items.map(item => ({
      name: item.product.name,
      category: item.product.category,
      tags: item.product.tags,
    }))
  );

  // 3. 使用 AI 生成推薦
  const context = `
    用戶購買歷史：
    ${purchasedProducts.map(p => `- ${p.name} (${p.category})`).join('\n')}
  `;

  // 4. 基於協同過濾和 AI 推薦
  const similarProducts = await Product.find({
    category: { $in: purchasedProducts.map(p => p.category) },
    _id: { $nin: purchasedProducts.map(p => p._id) },
  }).limit(limit);

  return similarProducts;
}
```

### 智能定價

```javascript
async function suggestOptimalPricing(productId) {
  const product = await Product.findById(productId);

  // 獲取競爭對手價格
  const competitors = await Product.find({
    category: product.category,
    _id: { $ne: productId },
  });

  // 獲取歷史銷售數據
  const salesHistory = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.product': productId } },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$items.price' },
        totalSold: { $sum: '$items.quantity' },
      },
    },
  ]);

  // 使用 AI 分析和建議
  const context = `
    商品：${product.name}
    當前價格：${product.price}
    類別：${product.category}
    競爭對手平均價格：${competitors.reduce((sum, p) => sum + p.price, 0) / competitors.length}
    歷史銷售：${salesHistory[0]?.totalSold || 0} 件
  `;

  return {
    recommendedPrice: product.price * 1.05, // 簡化示例
    priceRange: {
      min: product.price * 0.9,
      max: product.price * 1.2,
    },
    reasoning: 'Based on market analysis and sales history',
  };
}
```

## 🔮 未來功能

- 🎨 AI 商品圖片優化和標籤
- 📊 銷售趨勢預測
- 💬 智能客服機器人
- 🎯 動態定價策略
- 🛒 購物車放棄原因分析
- 📧 個性化行銷內容生成

---

**讓 AI 提升你的電商平台！** 🚀
