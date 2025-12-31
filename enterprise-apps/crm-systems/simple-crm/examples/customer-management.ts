/**
 * Customer Management Examples
 *
 * This file demonstrates CRUD operations for customer management in the Simple CRM system.
 * It includes examples of creating, reading, updating, and deleting customers with proper
 * type safety and error handling.
 */

import axios, { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

interface Customer {
  id?: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status?: string;
  rating?: 'A' | 'B' | 'C' | 'D';
  source?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  contacts?: Contact[];
  opportunities?: Opportunity[];
}

interface Contact {
  id: number;
  customer_id: number;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  is_primary: boolean;
  created_at: string;
}

interface Opportunity {
  id: number;
  customer_id: number;
  name: string;
  stage: string;
  amount: number;
  probability: number;
  expected_close_date?: string;
}

interface ApiResponse<T> {
  message?: string;
  customer?: T;
  customers?: T[];
  total?: number;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

interface CustomerFilters {
  status?: string;
  rating?: string;
  industry?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token-here';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Extract error message from API response
 */
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<Customer>>;
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    if (axiosError.response?.data?.errors) {
      return axiosError.response.data.errors.map(e => e.msg).join(', ');
    }
    return axiosError.message;
  }
  return String(error);
}

/**
 * Handle API errors with detailed logging
 */
function handleError(operation: string, error: unknown): never {
  const message = getErrorMessage(error);
  console.error(`❌ ${operation} failed:`, message);
  throw new Error(`${operation} failed: ${message}`);
}

// ============================================================================
// Customer CRUD Operations
// ============================================================================

/**
 * Create a new customer
 *
 * @param customerData - Customer information
 * @returns Created customer object
 * @throws Error if creation fails
 */
async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  try {
    console.log('📝 Creating new customer:', customerData.name);

    const response = await api.post<ApiResponse<Customer>>('/customers', customerData);

    if (response.data.customer) {
      console.log('✅ Customer created successfully:', response.data.customer.id);
      return response.data.customer;
    }

    throw new Error('No customer data in response');
  } catch (error) {
    handleError('Create customer', error);
  }
}

/**
 * Get all customers with optional filtering
 *
 * @param filters - Optional filters (status, rating, industry)
 * @returns Array of customers
 * @throws Error if fetch fails
 */
async function getCustomers(filters?: CustomerFilters): Promise<Customer[]> {
  try {
    console.log('🔍 Fetching customers...', filters ? `with filters: ${JSON.stringify(filters)}` : '');

    const response = await api.get<ApiResponse<Customer>>('/customers', {
      params: filters,
    });

    if (response.data.customers) {
      console.log(`✅ Found ${response.data.total || 0} customers`);
      return response.data.customers;
    }

    return [];
  } catch (error) {
    handleError('Get customers', error);
  }
}

/**
 * Get a single customer by ID with related data
 *
 * @param customerId - Customer ID
 * @returns Customer with contacts and opportunities
 * @throws Error if customer not found or fetch fails
 */
async function getCustomerById(customerId: number): Promise<Customer> {
  try {
    console.log(`🔍 Fetching customer #${customerId}...`);

    const response = await api.get<Customer>(`/customers/${customerId}`);

    console.log('✅ Customer retrieved successfully');
    console.log(`   - Contacts: ${response.data.contacts?.length || 0}`);
    console.log(`   - Opportunities: ${response.data.opportunities?.length || 0}`);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Customer #${customerId} not found`);
    }
    handleError('Get customer', error);
  }
}

/**
 * Update an existing customer
 *
 * @param customerId - Customer ID
 * @param updates - Fields to update
 * @returns Updated customer object
 * @throws Error if update fails
 */
async function updateCustomer(
  customerId: number,
  updates: Partial<Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Customer> {
  try {
    console.log(`📝 Updating customer #${customerId}...`);

    const response = await api.put<ApiResponse<Customer>>(`/customers/${customerId}`, updates);

    if (response.data.customer) {
      console.log('✅ Customer updated successfully');
      return response.data.customer;
    }

    throw new Error('No customer data in response');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Customer #${customerId} not found`);
    }
    handleError('Update customer', error);
  }
}

/**
 * Delete a customer
 *
 * @param customerId - Customer ID
 * @throws Error if deletion fails
 */
async function deleteCustomer(customerId: number): Promise<void> {
  try {
    console.log(`🗑️  Deleting customer #${customerId}...`);

    await api.delete(`/customers/${customerId}`);

    console.log('✅ Customer deleted successfully');
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Customer #${customerId} not found`);
    }
    handleError('Delete customer', error);
  }
}

// ============================================================================
// Advanced Customer Operations
// ============================================================================

/**
 * Upgrade customer rating based on business value
 *
 * @param customerId - Customer ID
 * @param newRating - New rating (A/B/C/D)
 * @returns Updated customer
 */
async function upgradeCustomerRating(customerId: number, newRating: 'A' | 'B' | 'C' | 'D'): Promise<Customer> {
  console.log(`⭐ Upgrading customer #${customerId} to rating ${newRating}`);
  return await updateCustomer(customerId, { rating: newRating });
}

/**
 * Convert prospect to active customer
 *
 * @param customerId - Customer ID
 * @returns Updated customer
 */
async function convertProspectToCustomer(customerId: number): Promise<Customer> {
  console.log(`🎉 Converting prospect #${customerId} to active customer`);
  return await updateCustomer(customerId, { status: '活躍客戶' });
}

/**
 * Search customers by industry
 *
 * @param industry - Industry name
 * @returns Array of customers in that industry
 */
async function searchCustomersByIndustry(industry: string): Promise<Customer[]> {
  return await getCustomers({ industry });
}

/**
 * Get high-value customers (A-rated)
 *
 * @returns Array of A-rated customers
 */
async function getHighValueCustomers(): Promise<Customer[]> {
  return await getCustomers({ rating: 'A' });
}

// ============================================================================
// Example Usage Demonstrations
// ============================================================================

/**
 * Main demonstration function
 */
async function demonstrateCustomerManagement(): Promise<void> {
  console.log('\n🚀 Starting Customer Management Demonstration\n');
  console.log('='.repeat(60));

  try {
    // Example 1: Create a new customer
    console.log('\n📋 Example 1: Creating a new customer');
    console.log('-'.repeat(60));
    const newCustomer = await createCustomer({
      name: 'John Smith',
      company: 'Acme Corporation',
      email: 'john.smith@acme.com',
      phone: '+1-555-0123',
      industry: 'Technology',
      status: '潛在客戶',
      rating: 'B',
      source: 'Website',
    });
    console.log('New customer ID:', newCustomer.id);

    // Example 2: Get all customers
    console.log('\n📋 Example 2: Fetching all customers');
    console.log('-'.repeat(60));
    const allCustomers = await getCustomers();
    console.log(`Total customers: ${allCustomers.length}`);

    // Example 3: Filter customers by status
    console.log('\n📋 Example 3: Filtering customers by status');
    console.log('-'.repeat(60));
    const prospects = await getCustomers({ status: '潛在客戶' });
    console.log(`Prospects found: ${prospects.length}`);

    // Example 4: Get customer with full details
    if (newCustomer.id) {
      console.log('\n📋 Example 4: Getting customer details');
      console.log('-'.repeat(60));
      const customerDetails = await getCustomerById(newCustomer.id);
      console.log('Customer:', customerDetails.name);
      console.log('Company:', customerDetails.company);
    }

    // Example 5: Update customer information
    if (newCustomer.id) {
      console.log('\n📋 Example 5: Updating customer information');
      console.log('-'.repeat(60));
      const updated = await updateCustomer(newCustomer.id, {
        phone: '+1-555-9999',
        industry: 'Software Development',
      });
      console.log('Updated phone:', updated.phone);
      console.log('Updated industry:', updated.industry);
    }

    // Example 6: Upgrade customer rating
    if (newCustomer.id) {
      console.log('\n📋 Example 6: Upgrading customer rating');
      console.log('-'.repeat(60));
      await upgradeCustomerRating(newCustomer.id, 'A');
    }

    // Example 7: Convert prospect to customer
    if (newCustomer.id) {
      console.log('\n📋 Example 7: Converting prospect to active customer');
      console.log('-'.repeat(60));
      await convertProspectToCustomer(newCustomer.id);
    }

    // Example 8: Search by industry
    console.log('\n📋 Example 8: Searching customers by industry');
    console.log('-'.repeat(60));
    const techCustomers = await searchCustomersByIndustry('Technology');
    console.log(`Technology customers: ${techCustomers.length}`);

    // Example 9: Get high-value customers
    console.log('\n📋 Example 9: Getting high-value customers');
    console.log('-'.repeat(60));
    const highValue = await getHighValueCustomers();
    console.log(`High-value (A-rated) customers: ${highValue.length}`);

    // Example 10: Delete customer (optional - uncomment to test)
    // if (newCustomer.id) {
    //   console.log('\n📋 Example 10: Deleting customer');
    //   console.log('-'.repeat(60));
    //   await deleteCustomer(newCustomer.id);
    // }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All demonstrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Export functions for use in other modules
// ============================================================================

export {
  // Types
  Customer,
  Contact,
  Opportunity,
  ApiResponse,
  CustomerFilters,

  // CRUD operations
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,

  // Advanced operations
  upgradeCustomerRating,
  convertProspectToCustomer,
  searchCustomersByIndustry,
  getHighValueCustomers,
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateCustomerManagement();
}
