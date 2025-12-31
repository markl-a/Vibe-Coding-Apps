import { BasePage } from './BasePage';
import type { Page } from '@playwright/test';

/**
 * Product Page Object Model
 *
 * Encapsulates interactions with product listing and detail pages
 */
export class ProductPage extends BasePage {
  // Selectors
  private readonly selectors = {
    productList: '[data-testid="product-list"]',
    productItem: '[data-testid*="product-item"]',
    productTitle: 'h1, [data-testid="product-title"]',
    productPrice: '[data-testid="product-price"]',
    addToCartButton: 'button:has-text("Add to Cart")',
    quantityInput: 'input[type="number"], input[name="quantity"]',
    categoryFilter: 'select[name="category"], [data-testid="category-filter"]',
    searchInput: 'input[type="search"], input[placeholder*="search" i]',
    sortDropdown: 'select[name="sort"], [data-testid="sort"]',
  };

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to products page
   */
  async navigate(): Promise<void> {
    await this.goto('/products');
  }

  /**
   * Get all product items
   */
  async getProductItems() {
    await this.waitForElement(this.selectors.productList);
    return this.page.locator(this.selectors.productItem);
  }

  /**
   * Get count of products
   */
  async getProductCount(): Promise<number> {
    const products = await this.getProductItems();
    return await products.count();
  }

  /**
   * Click on a product by index
   */
  async clickProduct(index = 0): Promise<void> {
    const products = await this.getProductItems();
    await products.nth(index).click();
  }

  /**
   * Get product title
   */
  async getProductTitle(): Promise<string> {
    return await this.getTextContent(this.selectors.productTitle);
  }

  /**
   * Get product price
   */
  async getProductPrice(): Promise<string> {
    return await this.getTextContent(this.selectors.productPrice);
  }

  /**
   * Add product to cart
   */
  async addToCart(quantity = 1): Promise<void> {
    if (quantity > 1) {
      await this.fillInput(
        this.selectors.quantityInput,
        quantity.toString()
      );
    }
    await this.clickElement(this.selectors.addToCartButton);
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string): Promise<void> {
    const filter = this.page.locator(this.selectors.categoryFilter);
    await filter.selectOption(category);
    await this.waitForPageLoad();
  }

  /**
   * Search for products
   */
  async searchProducts(query: string): Promise<void> {
    await this.fillInput(this.selectors.searchInput, query);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Sort products
   */
  async sortBy(option: string): Promise<void> {
    const sort = this.page.locator(this.selectors.sortDropdown);
    await sort.selectOption(option);
    await this.waitForPageLoad();
  }

  /**
   * Check if product is in stock
   */
  async isInStock(): Promise<boolean> {
    const outOfStock = await this.isElementVisible(
      'text=/out of stock|unavailable/i'
    );
    return !outOfStock;
  }
}
