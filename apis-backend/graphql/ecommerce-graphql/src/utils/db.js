const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL 連接池配置
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'ecommerce_db',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // 最大連接數
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 測試資料庫連接
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// 查詢輔助函數
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// 初始化資料庫表格（開發用）
const initDatabase = async () => {
  try {
    // 創建用戶表
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建分類表
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建商品表
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        category_id UUID REFERENCES categories(id),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建購物車表
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    // 創建訂單表
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建訂單項目表
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建評論表
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 創建索引
    await query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)`);

    console.log('✅ Database tables initialized successfully');

    // 插入測試資料
    await insertSampleData();
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// 插入範例資料
const insertSampleData = async () => {
  try {
    // 檢查是否已有資料
    const categoriesCount = await query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesCount.rows[0].count) > 0) {
      console.log('📝 Sample data already exists, skipping insertion');
      return;
    }

    // 插入分類
    const categories = [
      { name: 'Electronics', description: '電子產品' },
      { name: 'Clothing', description: '服飾' },
      { name: 'Books', description: '書籍' },
      { name: 'Home & Garden', description: '家居園藝' }
    ];

    for (const cat of categories) {
      await query(
        'INSERT INTO categories (name, description) VALUES ($1, $2)',
        [cat.name, cat.description]
      );
    }

    // 獲取分類 ID
    const electronicsRes = await query("SELECT id FROM categories WHERE name = 'Electronics'");
    const clothingRes = await query("SELECT id FROM categories WHERE name = 'Clothing'");
    const booksRes = await query("SELECT id FROM categories WHERE name = 'Books'");

    const electronicsId = electronicsRes.rows[0]?.id;
    const clothingId = clothingRes.rows[0]?.id;
    const booksId = booksRes.rows[0]?.id;

    // 插入商品
    const products = [
      { name: 'Laptop Pro 15', description: '高效能筆記型電腦', price: 1299.99, stock: 50, categoryId: electronicsId },
      { name: 'Wireless Mouse', description: '無線滑鼠', price: 29.99, stock: 200, categoryId: electronicsId },
      { name: 'USB-C Cable', description: 'Type-C 充電線', price: 12.99, stock: 500, categoryId: electronicsId },
      { name: 'Cotton T-Shirt', description: '純棉 T恤', price: 19.99, stock: 300, categoryId: clothingId },
      { name: 'Denim Jeans', description: '牛仔褲', price: 49.99, stock: 150, categoryId: clothingId },
      { name: 'Programming Book', description: 'JavaScript 完全指南', price: 39.99, stock: 100, categoryId: booksId }
    ];

    for (const product of products) {
      await query(
        'INSERT INTO products (name, description, price, stock, category_id) VALUES ($1, $2, $3, $4, $5)',
        [product.name, product.description, product.price, product.stock, product.categoryId]
      );
    }

    console.log('✅ Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

module.exports = {
  query,
  pool,
  initDatabase
};
