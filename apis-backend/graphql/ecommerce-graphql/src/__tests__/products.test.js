/**
 * Tests for Product queries and mutations
 */

const { GraphQLError } = require('graphql');
const {
  createMockQuery,
  createMockContext,
  mockSuccessfulQuery,
  mockEmptyQuery,
  mockData
} = require('./helpers');

// Mock the dependencies
jest.mock('../utils/db');
jest.mock('../utils/auth');

const db = require('../utils/db');
const auth = require('../utils/auth');

// Import resolvers after mocking
const resolvers = require('../resolvers');

describe('Product Queries', () => {
  let context;

  beforeEach(() => {
    jest.clearAllMocks();
    context = createMockContext();
    // Reset auth requireAuth to not throw
    auth.requireAuth.mockReset();
  });

  describe('products query', () => {
    test('should return all products with default pagination', async () => {
      mockSuccessfulQuery(db.query, mockData.products);

      const result = await resolvers.Query.products(null, {}, context);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Test Product 1');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM products WHERE 1=1'),
        [50, 0]
      );
    });

    test('should filter products by category', async () => {
      mockSuccessfulQuery(db.query, [mockData.products[0]]);

      const result = await resolvers.Query.products(null, { category: 'Electronics' }, context);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product 1');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        ['Electronics', 50, 0]
      );
    });

    test('should filter products by price range', async () => {
      mockSuccessfulQuery(db.query, [mockData.products[0]]);

      const result = await resolvers.Query.products(
        null,
        { minPrice: 20, maxPrice: 40 },
        context
      );

      expect(result).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('price >='),
        [20, 40, 50, 0]
      );
    });

    test('should search products by name or description', async () => {
      mockSuccessfulQuery(db.query, [mockData.products[0]]);

      const result = await resolvers.Query.products(null, { search: 'Test' }, context);

      expect(result).toHaveLength(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        ['%Test%', 50, 0]
      );
    });

    test('should apply custom pagination', async () => {
      mockSuccessfulQuery(db.query, mockData.products);

      await resolvers.Query.products(null, { limit: 10, offset: 5 }, context);

      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [10, 5]
      );
    });

    test('should combine multiple filters', async () => {
      mockSuccessfulQuery(db.query, [mockData.products[0]]);

      await resolvers.Query.products(
        null,
        {
          category: 'Electronics',
          minPrice: 20,
          maxPrice: 40,
          search: 'Test',
          limit: 20,
          offset: 0
        },
        context
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        ['Electronics', 20, 40, '%Test%', 20, 0]
      );
    });
  });

  describe('product query', () => {
    test('should return a single product by ID', async () => {
      mockSuccessfulQuery(db.query, mockData.products[0]);

      const result = await resolvers.Query.product(null, { id: 'product-1' }, context);

      expect(result).toBeDefined();
      expect(result.id).toBe('product-1');
      expect(result.name).toBe('Test Product 1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE id = $1',
        ['product-1']
      );
    });

    test('should throw error if product not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Query.product(null, { id: 'non-existent' }, context)
      ).rejects.toThrow(GraphQLError);
    });
  });
});

describe('Product Mutations', () => {
  let context;

  beforeEach(() => {
    context = createMockContext('user-1');


    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    test('should create a new product', async () => {
      const newProduct = {
        id: 'product-3',
        name: 'New Product',
        description: 'A new product',
        price: 99.99,
        stock: 10,
        category_id: 'category-1',
        image_url: 'https://example.com/new.jpg'
      };

      mockSuccessfulQuery(db.query, newProduct);

      const input = {
        name: 'New Product',
        description: 'A new product',
        price: 99.99,
        stock: 10,
        categoryId: 'category-1',
        imageUrl: 'https://example.com/new.jpg'
      };

      const result = await resolvers.Mutation.createProduct(null, { input }, context);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Product');
      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        ['New Product', 'A new product', 99.99, 10, 'category-1', 'https://example.com/new.jpg']
      );
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      const input = {
        name: 'New Product',
        price: 99.99,
        stock: 10
      };

      await expect(
        resolvers.Mutation.createProduct(null, { input }, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('updateProduct', () => {
    test('should update product fields', async () => {
      const updatedProduct = {
        ...mockData.products[0],
        name: 'Updated Product',
        price: 39.99
      };

      mockSuccessfulQuery(db.query, updatedProduct);

      const input = {
        name: 'Updated Product',
        price: 39.99
      };

      const result = await resolvers.Mutation.updateProduct(
        null,
        { id: 'product-1', input },
        context
      );

      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(39.99);
      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE products SET'),
        expect.arrayContaining(['Updated Product', 39.99, 'product-1'])
      );
    });

    test('should handle categoryId and imageUrl field mapping', async () => {
      const updatedProduct = {
        ...mockData.products[0],
        category_id: 'category-2',
        image_url: 'https://example.com/updated.jpg'
      };

      mockSuccessfulQuery(db.query, updatedProduct);

      const input = {
        categoryId: 'category-2',
        imageUrl: 'https://example.com/updated.jpg'
      };

      await resolvers.Mutation.updateProduct(
        null,
        { id: 'product-1', input },
        context
      );

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('category_id'),
        expect.arrayContaining(['category-2', 'https://example.com/updated.jpg', 'product-1'])
      );
    });

    test('should throw error if no fields to update', async () => {
      const input = {};

      await expect(
        resolvers.Mutation.updateProduct(null, { id: 'product-1', input }, context)
      ).rejects.toThrow(GraphQLError);
    });

    test('should throw error if product not found', async () => {
      mockEmptyQuery(db.query);

      const input = { name: 'Updated' };

      await expect(
        resolvers.Mutation.updateProduct(null, { id: 'non-existent', input }, context)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('deleteProduct', () => {
    test('should delete a product', async () => {
      mockSuccessfulQuery(db.query, { id: 'product-1' });

      const result = await resolvers.Mutation.deleteProduct(
        null,
        { id: 'product-1' },
        context
      );

      expect(result).toBe(true);
      expect(auth.requireAuth).toHaveBeenCalledWith('user-1');
      expect(db.query).toHaveBeenCalledWith(
        'DELETE FROM products WHERE id = $1 RETURNING id',
        ['product-1']
      );
    });

    test('should throw error if product not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Mutation.deleteProduct(null, { id: 'non-existent' }, context)
      ).rejects.toThrow(GraphQLError);
    });

    test('should require authentication', async () => {
      auth.requireAuth.mockImplementation(() => {
        throw new Error('Authentication required');
      });

      await expect(
        resolvers.Mutation.deleteProduct(null, { id: 'product-1' }, { userId: null })
      ).rejects.toThrow('Authentication required');
    });
  });
});

describe('Product Field Resolvers', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product.category', () => {
    test('should resolve category for product', async () => {
      mockSuccessfulQuery(db.query, mockData.categories[0]);

      const product = { ...mockData.products[0], category_id: 'category-1' };
      const result = await resolvers.Product.category(product);

      expect(result).toBeDefined();
      expect(result.name).toBe('Electronics');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM categories WHERE id = $1',
        ['category-1']
      );
    });

    test('should return null if no category_id', async () => {
      const product = { ...mockData.products[0], category_id: null };
      const result = await resolvers.Product.category(product);

      expect(result).toBeNull();
      expect(db.query).not.toHaveBeenCalled();
    });
  });

  describe('Product.reviews', () => {
    test('should resolve reviews for product', async () => {
      mockSuccessfulQuery(db.query, mockData.reviews);

      const result = await resolvers.Product.reviews(mockData.products[0]);

      expect(result).toHaveLength(2);
      expect(result[0].rating).toBe(5);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
        ['product-1']
      );
    });
  });

  describe('Product.averageRating', () => {
    test('should calculate average rating', async () => {
      mockSuccessfulQuery(db.query, { avg_rating: 4.5 });

      const result = await resolvers.Product.averageRating(mockData.products[0]);

      expect(result).toBe(4.5);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT AVG(rating)::float as avg_rating FROM reviews WHERE product_id = $1',
        ['product-1']
      );
    });

    test('should return null if no reviews', async () => {
      mockSuccessfulQuery(db.query, { avg_rating: null });

      const result = await resolvers.Product.averageRating(mockData.products[0]);

      expect(result).toBeNull();
    });
  });
});

describe('Category Queries and Mutations', () => {
  let context;

  beforeEach(() => {
    context = createMockContext();


    jest.clearAllMocks();
  });

  describe('categories query', () => {
    test('should return all categories', async () => {
      mockSuccessfulQuery(db.query, mockData.categories);

      const result = await resolvers.Query.categories(null, {}, context);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Electronics');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM categories ORDER BY name',
        undefined
      );
    });
  });

  describe('category query', () => {
    test('should return a single category by ID', async () => {
      mockSuccessfulQuery(db.query, mockData.categories[0]);

      const result = await resolvers.Query.category(null, { id: 'category-1' }, context);

      expect(result).toBeDefined();
      expect(result.name).toBe('Electronics');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM categories WHERE id = $1',
        ['category-1']
      );
    });

    test('should throw error if category not found', async () => {
      mockEmptyQuery(db.query);

      await expect(
        resolvers.Query.category(null, { id: 'non-existent' }, context)
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('createCategory mutation', () => {
    test('should create a new category', async () => {
      const newCategory = {
        id: 'category-3',
        name: 'Books',
        description: 'Book products',
        created_at: '2024-01-03T00:00:00Z'
      };

      mockSuccessfulQuery(db.query, newCategory);

      const result = await resolvers.Mutation.createCategory(
        null,
        { name: 'Books', description: 'Book products' },
        context
      );

      expect(result.name).toBe('Books');
      expect(auth.requireAuth).toHaveBeenCalledWith('test-user-id');
      expect(db.query).toHaveBeenCalledWith(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        ['Books', 'Book products']
      );
    });
  });

  describe('Category.products', () => {
    test('should resolve products for category', async () => {
      mockSuccessfulQuery(db.query, [mockData.products[0]]);

      const result = await resolvers.Category.products(mockData.categories[0]);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product 1');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM products WHERE category_id = $1',
        ['category-1']
      );
    });
  });
});
