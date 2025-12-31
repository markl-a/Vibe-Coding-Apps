import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Search Page Object
 *
 * Encapsulates all interactions with the search results page.
 */
export class SearchPage extends BasePage {
  readonly url = '/search';

  // Locators
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly resultsContainer: Locator;
  readonly resultItems: Locator;
  readonly noResultsMessage: Locator;
  readonly filterSidebar: Locator;
  readonly sortDropdown: Locator;
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.searchButton = page.locator('[data-testid="search-button"]');
    this.resultsContainer = page.locator('[data-testid="results-container"]');
    this.resultItems = page.locator('[data-testid="result-item"]');
    this.noResultsMessage = page.locator('[data-testid="no-results"]');
    this.filterSidebar = page.locator('[data-testid="filter-sidebar"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.paginationContainer = page.locator('[data-testid="pagination"]');
    this.nextPageButton = page.locator('[data-testid="next-page"]');
    this.prevPageButton = page.locator('[data-testid="prev-page"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  /**
   * Search for a term
   */
  async search(term: string): Promise<void> {
    await this.safeFill(this.searchInput, term);
    await this.safeClick(this.searchButton);
    await this.waitForResults();
  }

  /**
   * Wait for search results to load
   */
  async waitForResults(): Promise<void> {
    // Wait for loading to complete
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.waitForPageLoad();
  }

  /**
   * Get number of results
   */
  async getResultCount(): Promise<number> {
    return this.resultItems.count();
  }

  /**
   * Check if there are no results
   */
  async hasNoResults(): Promise<boolean> {
    return this.isVisible(this.noResultsMessage);
  }

  /**
   * Click on a result by index
   */
  async clickResult(index: number): Promise<void> {
    await this.resultItems.nth(index).click();
    await this.waitForPageLoad();
  }

  /**
   * Get result title by index
   */
  async getResultTitle(index: number): Promise<string> {
    const titleLocator = this.resultItems.nth(index).locator('h3, [data-testid="result-title"]');
    return this.getText(titleLocator);
  }

  /**
   * Sort results by option
   */
  async sortBy(option: string): Promise<void> {
    await this.sortDropdown.selectOption(option);
    await this.waitForResults();
  }

  /**
   * Apply filter
   */
  async applyFilter(filterName: string, value: string): Promise<void> {
    const filterLocator = this.filterSidebar.locator(`[data-filter="${filterName}"]`);
    await filterLocator.selectOption(value);
    await this.waitForResults();
  }

  /**
   * Go to next page
   */
  async nextPage(): Promise<void> {
    await this.safeClick(this.nextPageButton);
    await this.waitForResults();
  }

  /**
   * Go to previous page
   */
  async previousPage(): Promise<void> {
    await this.safeClick(this.prevPageButton);
    await this.waitForResults();
  }

  /**
   * Check if pagination exists
   */
  async hasPagination(): Promise<boolean> {
    return this.isVisible(this.paginationContainer);
  }

  /**
   * Get all result titles
   */
  async getAllResultTitles(): Promise<string[]> {
    const count = await this.getResultCount();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      titles.push(await this.getResultTitle(i));
    }
    return titles;
  }
}
