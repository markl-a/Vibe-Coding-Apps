// GraphQL Schema 定義
const typeDefs = `#graphql
  # 用戶類型
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
  }

  # 分類類型
  type Category {
    id: ID!
    name: String!
    description: String
    products: [Product!]!
  }

  # 商品類型
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    stock: Int!
    category: Category
    imageUrl: String
    reviews: [Review!]!
    averageRating: Float
    createdAt: String!
    updatedAt: String!
  }

  # 購物車項目
  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    subtotal: Float!
    createdAt: String!
  }

  # 訂單類型
  type Order {
    id: ID!
    user: User!
    items: [OrderItem!]!
    totalAmount: Float!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  # 訂單項目
  type OrderItem {
    id: ID!
    product: Product!
    quantity: Int!
    price: Float!
    subtotal: Float!
  }

  # 評論類型
  type Review {
    id: ID!
    product: Product!
    user: User!
    rating: Int!
    comment: String
    createdAt: String!
  }

  # 認證回應
  type AuthPayload {
    token: String!
    user: User!
  }

  # 商品創建輸入
  input CreateProductInput {
    name: String!
    description: String
    price: Float!
    stock: Int!
    categoryId: ID
    imageUrl: String
  }

  # 商品更新輸入
  input UpdateProductInput {
    name: String
    description: String
    price: Float
    stock: Int
    categoryId: ID
    imageUrl: String
  }

  # 查詢
  type Query {
    # 商品查詢
    products(
      limit: Int
      offset: Int
      category: String
      minPrice: Float
      maxPrice: Float
      search: String
    ): [Product!]!

    product(id: ID!): Product

    # 分類
    categories: [Category!]!
    category(id: ID!): Category

    # 購物車
    myCart: [CartItem!]!

    # 訂單
    myOrders: [Order!]!
    order(id: ID!): Order

    # 用戶
    me: User
  }

  # 變更
  type Mutation {
    # 用戶認證
    register(name: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # 購物車操作
    addToCart(productId: ID!, quantity: Int!): CartItem!
    updateCartItem(productId: ID!, quantity: Int!): CartItem!
    removeFromCart(productId: ID!): Boolean!
    clearCart: Boolean!

    # 訂單
    createOrder: Order!
    updateOrderStatus(orderId: ID!, status: String!): Order!

    # 商品管理
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!

    # 分類管理
    createCategory(name: String!, description: String): Category!

    # 評論
    addReview(productId: ID!, rating: Int!, comment: String): Review!
  }

  # 訂閱
  type Subscription {
    # 商品庫存更新通知
    productStockUpdated(productId: ID): Product!

    # 新訂單通知（管理員用）
    newOrder: Order!
  }
`;

module.exports = typeDefs;
