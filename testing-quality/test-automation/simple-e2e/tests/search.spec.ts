import { test, expect } from '../src/fixtures/index.js';
import { mockApiResponse } from '../src/utils/test-helpers.js';

/**
 * Search Page Tests
 *
 * These tests demonstrate:
 * - Complex page interactions
 * - Data mocking
 * - Pagination testing
 * - Filter testing
 */

test.describe('Search Page', () => {
  const mockSearchResults = {
    results: [
      { id: 1, title: 'Result 1', description: 'First result' },
      { id: 2, title: 'Result 2', description: 'Second result' },
      { id: 3, title: 'Result 3', description: 'Third result' },
    ],
    total: 3,
    page: 1,
    pageSize: 10,
  };

  test.beforeEach(async ({ searchPage, page }) => {
    // Mock search API
    await mockApiResponse(page, '**/api/search*', {
      status: 200,
      body: mockSearchResults,
    });

    await searchPage.goto();
  });

  test('should display search input', async ({ searchPage }) => {
    await searchPage.assertVisible(searchPage.searchInput);
    await searchPage.assertVisible(searchPage.searchButton);
  });

  test('should perform search and show results', async ({ searchPage }) => {
    await searchPage.search('test');

    const resultCount = await searchPage.getResultCount();
    expect(resultCount).toBe(3);
  });

  test('should show no results message for empty search', async ({ searchPage, page }) => {
    // Override mock for this test
    await mockApiResponse(page, '**/api/search*', {
      status: 200,
      body: { results: [], total: 0, page: 1, pageSize: 10 },
    });

    await searchPage.search('nonexistent');

    const hasNoResults = await searchPage.hasNoResults();
    expect(hasNoResults).toBe(true);
  });

  test('should click on search result', async ({ searchPage, page }) => {
    await searchPage.search('test');

    await searchPage.clickResult(0);

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/detail|\/item|\/\d+/);
  });

  test('should get result titles', async ({ searchPage }) => {
    await searchPage.search('test');

    const titles = await searchPage.getAllResultTitles();
    expect(titles).toHaveLength(3);
    expect(titles).toContain('Result 1');
  });
});

test.describe('Search Page - Sorting', () => {
  test.beforeEach(async ({ searchPage, page }) => {
    await mockApiResponse(page, '**/api/search*', {
      status: 200,
      body: {
        results: [
          { id: 1, title: 'Alpha', date: '2024-01-01' },
          { id: 2, title: 'Beta', date: '2024-01-02' },
          { id: 3, title: 'Gamma', date: '2024-01-03' },
        ],
        total: 3,
      },
    });

    await searchPage.goto();
    await searchPage.search('test');
  });

  test('should sort by date', async ({ searchPage, page }) => {
    let sortParam = '';
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url());
      sortParam = url.searchParams.get('sort') ?? '';
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ results: [], total: 0 }),
      });
    });

    await searchPage.sortBy('date');

    expect(sortParam).toBe('date');
  });
});

test.describe('Search Page - Pagination', () => {
  test('should navigate to next page', async ({ searchPage, page }) => {
    await mockApiResponse(page, '**/api/search*', {
      status: 200,
      body: {
        results: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `Result ${i + 1}`,
        })),
        total: 25,
        page: 1,
        pageSize: 10,
        hasNext: true,
      },
    });

    await searchPage.goto();
    await searchPage.search('test');

    const hasPagination = await searchPage.hasPagination();
    expect(hasPagination).toBe(true);

    // Try to go to next page
    await searchPage.nextPage();
  });
});

test.describe('Search Page - Filters', () => {
  test('should apply category filter', async ({ searchPage, page }) => {
    let filterParam = '';
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url());
      filterParam = url.searchParams.get('category') ?? '';
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ results: [], total: 0 }),
      });
    });

    await searchPage.goto();
    await searchPage.search('test');
    await searchPage.applyFilter('category', 'electronics');

    expect(filterParam).toBe('electronics');
  });
});
