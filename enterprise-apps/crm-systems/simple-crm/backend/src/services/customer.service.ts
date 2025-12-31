export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status: string;
  rating: string;
  source?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerDTO {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status?: string;
  rating?: string;
  source?: string;
  userId: string;
}

export interface UpdateCustomerDTO {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  industry?: string;
  status?: string;
  rating?: string;
  source?: string;
}

export interface SearchFilters {
  status?: string;
  rating?: string;
  industry?: string;
}

export class CustomerService {
  private customers: Map<string, Customer> = new Map();

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerDTO): Promise<Customer> {
    // Validation
    if (!data.name || data.name.trim() === '') {
      throw new Error('Name is required');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    const id = this.generateId();
    const now = new Date();

    const customer: Customer = {
      id,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      industry: data.industry,
      status: data.status || '潛在客戶',
      rating: data.rating || 'C',
      source: data.source,
      userId: data.userId,
      createdAt: now,
      updatedAt: now,
    };

    this.customers.set(id, customer);
    return customer;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string, userId: string): Promise<Customer | null> {
    const customer = this.customers.get(id);

    if (!customer) {
      return null;
    }

    // Check ownership
    if (customer.userId !== userId) {
      throw new Error('Unauthorized access to customer');
    }

    return customer;
  }

  /**
   * Get all customers with optional filters
   */
  async getCustomers(userId: string, filters?: SearchFilters): Promise<Customer[]> {
    let customers = Array.from(this.customers.values()).filter(
      (c) => c.userId === userId
    );

    if (filters?.status) {
      customers = customers.filter((c) => c.status === filters.status);
    }

    if (filters?.rating) {
      customers = customers.filter((c) => c.rating === filters.rating);
    }

    if (filters?.industry) {
      customers = customers.filter((c) => c.industry === filters.industry);
    }

    // Sort by creation date (newest first)
    return customers.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Update customer
   */
  async updateCustomer(
    id: string,
    userId: string,
    data: UpdateCustomerDTO
  ): Promise<Customer> {
    const customer = this.customers.get(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check ownership
    if (customer.userId !== userId) {
      throw new Error('Unauthorized access to customer');
    }

    // Validate email if provided
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Update fields
    const updatedCustomer: Customer = {
      ...customer,
      name: data.name ?? customer.name,
      company: data.company ?? customer.company,
      email: data.email ?? customer.email,
      phone: data.phone ?? customer.phone,
      industry: data.industry ?? customer.industry,
      status: data.status ?? customer.status,
      rating: data.rating ?? customer.rating,
      source: data.source ?? customer.source,
      updatedAt: new Date(),
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string, userId: string): Promise<boolean> {
    const customer = this.customers.get(id);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check ownership
    if (customer.userId !== userId) {
      throw new Error('Unauthorized access to customer');
    }

    return this.customers.delete(id);
  }

  /**
   * Search customers by keyword
   */
  async searchCustomers(userId: string, keyword: string): Promise<Customer[]> {
    const lowerKeyword = keyword.toLowerCase();

    return Array.from(this.customers.values())
      .filter(
        (c) =>
          c.userId === userId &&
          (c.name.toLowerCase().includes(lowerKeyword) ||
            c.company?.toLowerCase().includes(lowerKeyword) ||
            c.email?.toLowerCase().includes(lowerKeyword) ||
            c.industry?.toLowerCase().includes(lowerKeyword))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get customer count by status
   */
  async getCustomerStats(userId: string): Promise<Record<string, number>> {
    const customers = Array.from(this.customers.values()).filter(
      (c) => c.userId === userId
    );

    const stats: Record<string, number> = {};

    for (const customer of customers) {
      stats[customer.status] = (stats[customer.status] || 0) + 1;
    }

    return stats;
  }

  // Helper methods
  private generateId(): string {
    return `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // For testing purposes
  clear(): void {
    this.customers.clear();
  }
}
