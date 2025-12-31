import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerService, CreateCustomerDTO, UpdateCustomerDTO } from '../services/customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  const testUserId = 'user_123';
  const otherUserId = 'user_456';

  beforeEach(() => {
    service = new CustomerService();
  });

  describe('CRUD Operations', () => {
    describe('createCustomer', () => {
      it('should create a customer with all fields', async () => {
        const customerData: CreateCustomerDTO = {
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
          phone: '+1234567890',
          industry: 'Technology',
          status: 'Active',
          rating: 'A',
          source: 'Website',
          userId: testUserId,
        };

        const customer = await service.createCustomer(customerData);

        expect(customer).toBeDefined();
        expect(customer.id).toBeTruthy();
        expect(customer.name).toBe('John Doe');
        expect(customer.company).toBe('Acme Corp');
        expect(customer.email).toBe('john@acme.com');
        expect(customer.phone).toBe('+1234567890');
        expect(customer.industry).toBe('Technology');
        expect(customer.status).toBe('Active');
        expect(customer.rating).toBe('A');
        expect(customer.source).toBe('Website');
        expect(customer.userId).toBe(testUserId);
        expect(customer.createdAt).toBeInstanceOf(Date);
        expect(customer.updatedAt).toBeInstanceOf(Date);
      });

      it('should create a customer with minimal required fields', async () => {
        const customerData: CreateCustomerDTO = {
          name: 'Jane Smith',
          userId: testUserId,
        };

        const customer = await service.createCustomer(customerData);

        expect(customer.name).toBe('Jane Smith');
        expect(customer.status).toBe('潛在客戶');
        expect(customer.rating).toBe('C');
      });

      it('should throw error when name is empty', async () => {
        const customerData: CreateCustomerDTO = {
          name: '',
          userId: testUserId,
        };

        await expect(service.createCustomer(customerData)).rejects.toThrow('Name is required');
      });

      it('should throw error when name is only whitespace', async () => {
        const customerData: CreateCustomerDTO = {
          name: '   ',
          userId: testUserId,
        };

        await expect(service.createCustomer(customerData)).rejects.toThrow('Name is required');
      });

      it('should throw error for invalid email format', async () => {
        const customerData: CreateCustomerDTO = {
          name: 'Test User',
          email: 'invalid-email',
          userId: testUserId,
        };

        await expect(service.createCustomer(customerData)).rejects.toThrow('Invalid email format');
      });

      it('should accept valid email formats', async () => {
        const validEmails = [
          'user@example.com',
          'user.name@example.com',
          'user+tag@example.co.uk',
          'user123@test-domain.com',
        ];

        for (const email of validEmails) {
          const customer = await service.createCustomer({
            name: 'Test User',
            email,
            userId: testUserId,
          });

          expect(customer.email).toBe(email);
        }
      });
    });

    describe('getCustomerById', () => {
      it('should retrieve an existing customer', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          company: 'Acme Corp',
          userId: testUserId,
        });

        const retrieved = await service.getCustomerById(created.id, testUserId);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('John Doe');
        expect(retrieved?.company).toBe('Acme Corp');
      });

      it('should return null for non-existent customer', async () => {
        const result = await service.getCustomerById('non_existent_id', testUserId);

        expect(result).toBeNull();
      });

      it('should throw error when accessing another user\'s customer', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          userId: testUserId,
        });

        await expect(
          service.getCustomerById(created.id, otherUserId)
        ).rejects.toThrow('Unauthorized access to customer');
      });
    });

    describe('updateCustomer', () => {
      it('should update customer fields', async () => {
        const created = await service.createCustomer({
          name: 'Original Name',
          company: 'Original Company',
          userId: testUserId,
        });

        const updateData: UpdateCustomerDTO = {
          name: 'Updated Name',
          company: 'Updated Company',
          email: 'updated@example.com',
        };

        const updated = await service.updateCustomer(created.id, testUserId, updateData);

        expect(updated.name).toBe('Updated Name');
        expect(updated.company).toBe('Updated Company');
        expect(updated.email).toBe('updated@example.com');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should update only specified fields', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          company: 'Acme Corp',
          email: 'john@acme.com',
          userId: testUserId,
        });

        const updateData: UpdateCustomerDTO = {
          status: 'Active',
        };

        const updated = await service.updateCustomer(created.id, testUserId, updateData);

        expect(updated.name).toBe('John Doe');
        expect(updated.company).toBe('Acme Corp');
        expect(updated.email).toBe('john@acme.com');
        expect(updated.status).toBe('Active');
      });

      it('should throw error for invalid email during update', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          userId: testUserId,
        });

        await expect(
          service.updateCustomer(created.id, testUserId, { email: 'invalid-email' })
        ).rejects.toThrow('Invalid email format');
      });

      it('should throw error when updating non-existent customer', async () => {
        await expect(
          service.updateCustomer('non_existent_id', testUserId, { name: 'Test' })
        ).rejects.toThrow('Customer not found');
      });

      it('should throw error when updating another user\'s customer', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          userId: testUserId,
        });

        await expect(
          service.updateCustomer(created.id, otherUserId, { name: 'Updated' })
        ).rejects.toThrow('Unauthorized access to customer');
      });
    });

    describe('deleteCustomer', () => {
      it('should delete an existing customer', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          userId: testUserId,
        });

        const result = await service.deleteCustomer(created.id, testUserId);

        expect(result).toBe(true);

        const retrieved = await service.getCustomerById(created.id, testUserId);
        expect(retrieved).toBeNull();
      });

      it('should throw error when deleting non-existent customer', async () => {
        await expect(
          service.deleteCustomer('non_existent_id', testUserId)
        ).rejects.toThrow('Customer not found');
      });

      it('should throw error when deleting another user\'s customer', async () => {
        const created = await service.createCustomer({
          name: 'John Doe',
          userId: testUserId,
        });

        await expect(
          service.deleteCustomer(created.id, otherUserId)
        ).rejects.toThrow('Unauthorized access to customer');
      });
    });
  });

  describe('Search and Filtering', () => {
    beforeEach(async () => {
      // Create test customers
      await service.createCustomer({
        name: 'Alice Johnson',
        company: 'Tech Corp',
        email: 'alice@tech.com',
        industry: 'Technology',
        status: 'Active',
        rating: 'A',
        userId: testUserId,
      });

      await service.createCustomer({
        name: 'Bob Smith',
        company: 'Finance Inc',
        email: 'bob@finance.com',
        industry: 'Finance',
        status: 'Inactive',
        rating: 'B',
        userId: testUserId,
      });

      await service.createCustomer({
        name: 'Charlie Brown',
        company: 'Tech Solutions',
        email: 'charlie@techsol.com',
        industry: 'Technology',
        status: 'Active',
        rating: 'A',
        userId: testUserId,
      });

      // Create customer for another user
      await service.createCustomer({
        name: 'David Lee',
        company: 'Other Corp',
        userId: otherUserId,
      });
    });

    describe('getCustomers', () => {
      it('should get all customers for a user', async () => {
        const customers = await service.getCustomers(testUserId);

        expect(customers).toHaveLength(3);
        expect(customers.every((c) => c.userId === testUserId)).toBe(true);
      });

      it('should filter customers by status', async () => {
        const customers = await service.getCustomers(testUserId, { status: 'Active' });

        expect(customers).toHaveLength(2);
        expect(customers.every((c) => c.status === 'Active')).toBe(true);
      });

      it('should filter customers by rating', async () => {
        const customers = await service.getCustomers(testUserId, { rating: 'A' });

        expect(customers).toHaveLength(2);
        expect(customers.every((c) => c.rating === 'A')).toBe(true);
      });

      it('should filter customers by industry', async () => {
        const customers = await service.getCustomers(testUserId, { industry: 'Technology' });

        expect(customers).toHaveLength(2);
        expect(customers.every((c) => c.industry === 'Technology')).toBe(true);
      });

      it('should filter customers by multiple criteria', async () => {
        const customers = await service.getCustomers(testUserId, {
          status: 'Active',
          rating: 'A',
          industry: 'Technology',
        });

        expect(customers).toHaveLength(2);
        expect(customers.every((c) =>
          c.status === 'Active' && c.rating === 'A' && c.industry === 'Technology'
        )).toBe(true);
      });

      it('should return customers sorted by creation date (newest first)', async () => {
        const customers = await service.getCustomers(testUserId);

        for (let i = 0; i < customers.length - 1; i++) {
          expect(customers[i].createdAt.getTime()).toBeGreaterThanOrEqual(
            customers[i + 1].createdAt.getTime()
          );
        }
      });

      it('should return empty array when no customers match filters', async () => {
        const customers = await service.getCustomers(testUserId, { status: 'NonExistent' });

        expect(customers).toHaveLength(0);
      });
    });

    describe('searchCustomers', () => {
      it('should search customers by name', async () => {
        const results = await service.searchCustomers(testUserId, 'alice');

        expect(results).toHaveLength(1);
        expect(results[0].name).toBe('Alice Johnson');
      });

      it('should search customers by company', async () => {
        const results = await service.searchCustomers(testUserId, 'tech');

        expect(results.length).toBeGreaterThanOrEqual(2);
        expect(results.some((c) => c.company?.includes('Tech'))).toBe(true);
      });

      it('should search customers by email', async () => {
        const results = await service.searchCustomers(testUserId, 'finance.com');

        expect(results).toHaveLength(1);
        expect(results[0].email).toBe('bob@finance.com');
      });

      it('should search customers by industry', async () => {
        const results = await service.searchCustomers(testUserId, 'technology');

        expect(results).toHaveLength(2);
      });

      it('should be case-insensitive', async () => {
        const results1 = await service.searchCustomers(testUserId, 'ALICE');
        const results2 = await service.searchCustomers(testUserId, 'alice');
        const results3 = await service.searchCustomers(testUserId, 'Alice');

        expect(results1).toEqual(results2);
        expect(results2).toEqual(results3);
      });

      it('should only return customers belonging to the user', async () => {
        const results = await service.searchCustomers(testUserId, 'corp');

        expect(results.every((c) => c.userId === testUserId)).toBe(true);
        expect(results.some((c) => c.name === 'David Lee')).toBe(false);
      });

      it('should return empty array when no matches found', async () => {
        const results = await service.searchCustomers(testUserId, 'nonexistent');

        expect(results).toHaveLength(0);
      });
    });

    describe('getCustomerStats', () => {
      it('should return customer count by status', async () => {
        const stats = await service.getCustomerStats(testUserId);

        expect(stats['Active']).toBe(2);
        expect(stats['Inactive']).toBe(1);
      });

      it('should only count customers for the specified user', async () => {
        const stats = await service.getCustomerStats(testUserId);
        const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0);

        expect(totalCount).toBe(3);
      });

      it('should return empty object for user with no customers', async () => {
        const stats = await service.getCustomerStats('user_with_no_customers');

        expect(stats).toEqual({});
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle concurrent customer creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.createCustomer({
          name: `Customer ${i}`,
          userId: testUserId,
        })
      );

      const customers = await Promise.all(promises);

      expect(customers).toHaveLength(10);

      // Verify all IDs are unique
      const ids = new Set(customers.map((c) => c.id));
      expect(ids.size).toBe(10);
    });

    it('should handle special characters in customer data', async () => {
      const customer = await service.createCustomer({
        name: "O'Brien & Sons <Company>",
        company: 'Test & Co. "Special"',
        email: 'test+tag@example.com',
        userId: testUserId,
      });

      expect(customer.name).toBe("O'Brien & Sons <Company>");
      expect(customer.company).toBe('Test & Co. "Special"');
    });

    it('should handle unicode characters in customer data', async () => {
      const customer = await service.createCustomer({
        name: '張三',
        company: '科技公司',
        userId: testUserId,
      });

      expect(customer.name).toBe('張三');
      expect(customer.company).toBe('科技公司');
    });

    it('should maintain data integrity after failed update', async () => {
      const created = await service.createCustomer({
        name: 'John Doe',
        email: 'john@example.com',
        userId: testUserId,
      });

      // Try to update with invalid email
      await expect(
        service.updateCustomer(created.id, testUserId, { email: 'invalid' })
      ).rejects.toThrow();

      // Verify original data is unchanged
      const retrieved = await service.getCustomerById(created.id, testUserId);
      expect(retrieved?.email).toBe('john@example.com');
    });

    it('should handle empty search keyword gracefully', async () => {
      await service.createCustomer({
        name: 'Test Customer',
        userId: testUserId,
      });

      const results = await service.searchCustomers(testUserId, '');

      expect(results).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long customer names', async () => {
      const longName = 'A'.repeat(500);
      const customer = await service.createCustomer({
        name: longName,
        userId: testUserId,
      });

      expect(customer.name).toBe(longName);
    });

    it('should handle multiple updates in sequence', async () => {
      const customer = await service.createCustomer({
        name: 'Test',
        userId: testUserId,
      });

      for (let i = 0; i < 5; i++) {
        await service.updateCustomer(customer.id, testUserId, {
          name: `Updated ${i}`,
        });
      }

      const final = await service.getCustomerById(customer.id, testUserId);
      expect(final?.name).toBe('Updated 4');
    });

    it('should handle customer with all optional fields undefined', async () => {
      const customer = await service.createCustomer({
        name: 'Minimal Customer',
        userId: testUserId,
      });

      expect(customer.company).toBeUndefined();
      expect(customer.email).toBeUndefined();
      expect(customer.phone).toBeUndefined();
      expect(customer.industry).toBeUndefined();
      expect(customer.source).toBeUndefined();
    });
  });
});
