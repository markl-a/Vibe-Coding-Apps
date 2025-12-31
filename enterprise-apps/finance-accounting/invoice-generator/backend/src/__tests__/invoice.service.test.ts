import { describe, it, expect, beforeEach } from 'vitest';
import {
  InvoiceService,
  CreateInvoiceDTO,
  InvoiceItem,
  Customer,
} from '../services/invoice.service';

describe('InvoiceService', () => {
  let service: InvoiceService;

  const validCustomer: Customer = {
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    address: '123 Business St, Tech City, TC 12345',
    taxId: 'TAX-123456',
  };

  const validItems: InvoiceItem[] = [
    {
      description: 'Web Development Services',
      quantity: 40,
      unitPrice: 100,
      taxRate: 10,
    },
    {
      description: 'Design Consultation',
      quantity: 10,
      unitPrice: 150,
      taxRate: 10,
    },
  ];

  beforeEach(() => {
    service = new InvoiceService();
  });

  describe('Invoice Creation', () => {
    describe('createInvoice', () => {
      it('should create a valid invoice with all fields', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: validItems,
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-14',
          paymentTerms: 'Net 30',
          currency: 'USD',
          notes: 'Thank you for your business',
        };

        const invoice = await service.createInvoice(invoiceData);

        expect(invoice).toBeDefined();
        expect(invoice.invoiceNumber).toBeTruthy();
        expect(invoice.customer).toEqual(validCustomer);
        expect(invoice.items).toHaveLength(2);
        expect(invoice.invoiceDate).toBe('2024-01-15');
        expect(invoice.dueDate).toBe('2024-02-14');
        expect(invoice.paymentTerms).toBe('Net 30');
        expect(invoice.currency).toBe('USD');
        expect(invoice.notes).toBe('Thank you for your business');
        expect(invoice.status).toBe('draft');
        expect(invoice.createdAt).toBeInstanceOf(Date);
      });

      it('should create invoice with minimal required fields', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: validItems,
        };

        const invoice = await service.createInvoice(invoiceData);

        expect(invoice.invoiceNumber).toBeTruthy();
        expect(invoice.paymentTerms).toBe('Net 30');
        expect(invoice.currency).toBe('USD');
        expect(invoice.invoiceDate).toBeTruthy();
        expect(invoice.dueDate).toBeTruthy();
      });

      it('should generate unique invoice numbers', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: validItems,
        };

        const invoice1 = await service.createInvoice(invoiceData);
        const invoice2 = await service.createInvoice(invoiceData);
        const invoice3 = await service.createInvoice(invoiceData);

        expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
        expect(invoice2.invoiceNumber).not.toBe(invoice3.invoiceNumber);
        expect(invoice1.invoiceNumber).not.toBe(invoice3.invoiceNumber);
      });

      it('should set default due date to 30 days from invoice date', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: validItems,
          invoiceDate: '2024-01-01',
        };

        const invoice = await service.createInvoice(invoiceData);

        expect(invoice.dueDate).toBe('2024-01-31');
      });

      it('should throw error when customer is missing', async () => {
        const invoiceData = {
          customer: null as any,
          items: validItems,
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Customer information is required'
        );
      });

      it('should throw error when customer name is empty', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: { ...validCustomer, name: '' },
          items: validItems,
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Customer name is required'
        );
      });

      it('should throw error when customer email is empty', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: { ...validCustomer, email: '' },
          items: validItems,
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Customer email is required'
        );
      });

      it('should throw error when customer email is invalid', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: { ...validCustomer, email: 'invalid-email' },
          items: validItems,
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Invalid customer email format'
        );
      });

      it('should throw error when items array is empty', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'At least one item is required'
        );
      });

      it('should throw error when item description is empty', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [{ description: '', quantity: 1, unitPrice: 100, taxRate: 10 }],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Description is required'
        );
      });

      it('should throw error when item quantity is zero or negative', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [
            { description: 'Service', quantity: 0, unitPrice: 100, taxRate: 10 },
          ],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Quantity must be greater than 0'
        );
      });

      it('should throw error when item unit price is zero or negative', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [
            { description: 'Service', quantity: 1, unitPrice: 0, taxRate: 10 },
          ],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Unit price must be greater than 0'
        );
      });

      it('should throw error when tax rate is negative', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [
            { description: 'Service', quantity: 1, unitPrice: 100, taxRate: -5 },
          ],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Tax rate must be between 0 and 100'
        );
      });

      it('should throw error when tax rate exceeds 100', async () => {
        const invoiceData: CreateInvoiceDTO = {
          customer: validCustomer,
          items: [
            { description: 'Service', quantity: 1, unitPrice: 100, taxRate: 150 },
          ],
        };

        await expect(service.createInvoice(invoiceData)).rejects.toThrow(
          'Tax rate must be between 0 and 100'
        );
      });
    });
  });

  describe('Calculate Totals', () => {
    describe('calculateTotals', () => {
      it('should calculate totals correctly for single item', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 10,
            unitPrice: 100,
            taxRate: 10,
          },
        ];

        const totals = service.calculateTotals(items);

        expect(totals.subtotal).toBe(1000);
        expect(totals.tax).toBe(100);
        expect(totals.total).toBe(1100);
      });

      it('should calculate totals correctly for multiple items', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service A',
            quantity: 10,
            unitPrice: 100,
            taxRate: 10,
          },
          {
            description: 'Service B',
            quantity: 5,
            unitPrice: 200,
            taxRate: 20,
          },
        ];

        const totals = service.calculateTotals(items);

        // Service A: 10 * 100 = 1000, tax = 100
        // Service B: 5 * 200 = 1000, tax = 200
        expect(totals.subtotal).toBe(2000);
        expect(totals.tax).toBe(300);
        expect(totals.total).toBe(2300);
      });

      it('should handle items with zero tax rate', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 10,
            unitPrice: 100,
            taxRate: 0,
          },
        ];

        const totals = service.calculateTotals(items);

        expect(totals.subtotal).toBe(1000);
        expect(totals.tax).toBe(0);
        expect(totals.total).toBe(1000);
      });

      it('should handle decimal quantities and prices', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 2.5,
            unitPrice: 99.99,
            taxRate: 7.5,
          },
        ];

        const totals = service.calculateTotals(items);

        expect(totals.subtotal).toBe(249.98);
        expect(totals.tax).toBe(18.75);
        expect(totals.total).toBe(268.73);
      });

      it('should round totals to two decimal places', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 3,
            unitPrice: 33.33,
            taxRate: 6.5,
          },
        ];

        const totals = service.calculateTotals(items);

        expect(totals.subtotal).toBe(99.99);
        expect(totals.tax).toBe(6.49);
        expect(totals.total).toBe(106.48);
      });

      it('should handle large numbers correctly', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Enterprise Service',
            quantity: 1000,
            unitPrice: 10000,
            taxRate: 15,
          },
        ];

        const totals = service.calculateTotals(items);

        expect(totals.subtotal).toBe(10000000);
        expect(totals.tax).toBe(1500000);
        expect(totals.total).toBe(11500000);
      });

      it('should throw error for invalid quantity', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: -5,
            unitPrice: 100,
            taxRate: 10,
          },
        ];

        expect(() => service.calculateTotals(items)).toThrow('Invalid quantity');
      });

      it('should throw error for invalid unit price', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 5,
            unitPrice: -100,
            taxRate: 10,
          },
        ];

        expect(() => service.calculateTotals(items)).toThrow('Invalid unit price');
      });

      it('should throw error for invalid tax rate', () => {
        const items: InvoiceItem[] = [
          {
            description: 'Service',
            quantity: 5,
            unitPrice: 100,
            taxRate: 150,
          },
        ];

        expect(() => service.calculateTotals(items)).toThrow('Invalid tax rate');
      });
    });
  });

  describe('PDF Generation', () => {
    describe('generatePDF', () => {
      it('should generate PDF for valid invoice', async () => {
        const invoice = await service.createInvoice({
          customer: validCustomer,
          items: validItems,
        });

        const result = await service.generatePDF(invoice.invoiceNumber);

        expect(result.success).toBe(true);
        expect(result.filePath).toContain(invoice.invoiceNumber);
        expect(result.filePath).toContain('.pdf');
      });

      it('should generate PDF with custom options', async () => {
        const invoice = await service.createInvoice({
          customer: validCustomer,
          items: validItems,
        });

        const result = await service.generatePDF(invoice.invoiceNumber, {
          includeNotes: true,
          includeTaxBreakdown: true,
          logoUrl: 'https://example.com/logo.png',
        });

        expect(result.success).toBe(true);
      });

      it('should generate PDF without notes', async () => {
        const invoice = await service.createInvoice({
          customer: validCustomer,
          items: validItems,
        });

        const result = await service.generatePDF(invoice.invoiceNumber, {
          includeNotes: false,
          includeTaxBreakdown: true,
        });

        expect(result.success).toBe(true);
      });

      it('should return error for non-existent invoice', async () => {
        const result = await service.generatePDF('NON_EXISTENT');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invoice not found');
      });

      it('should generate PDFs for multiple invoices', async () => {
        const invoice1 = await service.createInvoice({
          customer: validCustomer,
          items: validItems,
        });
        const invoice2 = await service.createInvoice({
          customer: validCustomer,
          items: validItems,
        });

        const result1 = await service.generatePDF(invoice1.invoiceNumber);
        const result2 = await service.generatePDF(invoice2.invoiceNumber);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result1.filePath).not.toBe(result2.filePath);
      });
    });
  });

  describe('Invoice Retrieval', () => {
    it('should retrieve invoice by number', async () => {
      const created = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });

      const retrieved = await service.getInvoice(created.invoiceNumber);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent invoice', async () => {
      const result = await service.getInvoice('NON_EXISTENT');

      expect(result).toBeNull();
    });

    it('should get all invoices', async () => {
      await service.createInvoice({ customer: validCustomer, items: validItems });
      await service.createInvoice({ customer: validCustomer, items: validItems });
      await service.createInvoice({ customer: validCustomer, items: validItems });

      const invoices = await service.getAllInvoices();

      expect(invoices).toHaveLength(3);
    });

    it('should return invoices sorted by creation date (newest first)', async () => {
      const invoice1 = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });
      const invoice2 = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });
      const invoice3 = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });

      const invoices = await service.getAllInvoices();

      expect(invoices[0].invoiceNumber).toBe(invoice3.invoiceNumber);
      expect(invoices[1].invoiceNumber).toBe(invoice2.invoiceNumber);
      expect(invoices[2].invoiceNumber).toBe(invoice1.invoiceNumber);
    });
  });

  describe('Invoice Status Management', () => {
    it('should update invoice status', async () => {
      const invoice = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });

      const updated = await service.updateInvoiceStatus(
        invoice.invoiceNumber,
        'sent'
      );

      expect(updated.status).toBe('sent');
    });

    it('should transition through multiple statuses', async () => {
      const invoice = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });

      let updated = await service.updateInvoiceStatus(invoice.invoiceNumber, 'sent');
      expect(updated.status).toBe('sent');

      updated = await service.updateInvoiceStatus(invoice.invoiceNumber, 'paid');
      expect(updated.status).toBe('paid');
    });

    it('should throw error when updating non-existent invoice', async () => {
      await expect(
        service.updateInvoiceStatus('NON_EXISTENT', 'sent')
      ).rejects.toThrow('Invoice not found');
    });

    it('should get invoices by status', async () => {
      await service.createInvoice({ customer: validCustomer, items: validItems });
      const invoice2 = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });
      await service.updateInvoiceStatus(invoice2.invoiceNumber, 'sent');

      const draftInvoices = await service.getInvoicesByStatus('draft');
      const sentInvoices = await service.getInvoicesByStatus('sent');

      expect(draftInvoices).toHaveLength(1);
      expect(sentInvoices).toHaveLength(1);
    });
  });

  describe('Invoice Filtering', () => {
    it('should get invoices by customer email', async () => {
      const customer1 = { ...validCustomer, email: 'customer1@test.com' };
      const customer2 = { ...validCustomer, email: 'customer2@test.com' };

      await service.createInvoice({ customer: customer1, items: validItems });
      await service.createInvoice({ customer: customer1, items: validItems });
      await service.createInvoice({ customer: customer2, items: validItems });

      const customer1Invoices = await service.getInvoicesByCustomer(
        'customer1@test.com'
      );

      expect(customer1Invoices).toHaveLength(2);
      expect(
        customer1Invoices.every((inv) => inv.customer.email === 'customer1@test.com')
      ).toBe(true);
    });

    it('should get overdue invoices', async () => {
      const pastDate = '2020-01-01';
      const futureDate = '2099-12-31';

      await service.createInvoice({
        customer: validCustomer,
        items: validItems,
        dueDate: pastDate,
      });
      await service.createInvoice({
        customer: validCustomer,
        items: validItems,
        dueDate: futureDate,
      });

      const overdueInvoices = await service.getOverdueInvoices();

      expect(overdueInvoices.length).toBeGreaterThanOrEqual(1);
      expect(overdueInvoices.every((inv) => inv.status !== 'paid')).toBe(true);
    });

    it('should not include paid invoices in overdue list', async () => {
      const pastDate = '2020-01-01';

      const invoice = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
        dueDate: pastDate,
      });

      await service.updateInvoiceStatus(invoice.invoiceNumber, 'paid');

      const overdueInvoices = await service.getOverdueInvoices();

      expect(
        overdueInvoices.find((inv) => inv.invoiceNumber === invoice.invoiceNumber)
      ).toBeUndefined();
    });
  });

  describe('Revenue Calculation', () => {
    it('should calculate total revenue', async () => {
      await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0 }],
      });
      await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 2000, taxRate: 0 }],
      });

      const revenue = await service.calculateRevenue();

      expect(revenue.totalRevenue).toBe(3000);
    });

    it('should calculate paid and pending revenue', async () => {
      const invoice1 = await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0 }],
      });
      await service.updateInvoiceStatus(invoice1.invoiceNumber, 'paid');

      await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 2000, taxRate: 0 }],
      });

      const revenue = await service.calculateRevenue();

      expect(revenue.paidRevenue).toBe(1000);
      expect(revenue.pendingRevenue).toBe(2000);
      expect(revenue.totalRevenue).toBe(3000);
    });

    it('should filter revenue by date range', async () => {
      await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 1000, taxRate: 0 }],
        invoiceDate: '2024-01-01',
      });
      await service.createInvoice({
        customer: validCustomer,
        items: [{ description: 'Service', quantity: 1, unitPrice: 2000, taxRate: 0 }],
        invoiceDate: '2024-06-01',
      });

      const revenue = await service.calculateRevenue('2024-05-01', '2024-12-31');

      expect(revenue.totalRevenue).toBe(2000);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long customer names', async () => {
      const longName = 'A'.repeat(500);
      const invoice = await service.createInvoice({
        customer: { ...validCustomer, name: longName },
        items: validItems,
      });

      expect(invoice.customer.name).toBe(longName);
    });

    it('should handle special characters in descriptions', async () => {
      const invoice = await service.createInvoice({
        customer: validCustomer,
        items: [
          {
            description: 'Service & Support <Premium> "Special"',
            quantity: 1,
            unitPrice: 100,
            taxRate: 10,
          },
        ],
      });

      expect(invoice.items[0].description).toBe(
        'Service & Support <Premium> "Special"'
      );
    });

    it('should handle unicode characters', async () => {
      const invoice = await service.createInvoice({
        customer: { ...validCustomer, name: '科技公司' },
        items: [
          {
            description: '網站開發服務',
            quantity: 1,
            unitPrice: 100,
            taxRate: 10,
          },
        ],
      });

      expect(invoice.customer.name).toBe('科技公司');
      expect(invoice.items[0].description).toBe('網站開發服務');
    });

    it('should delete invoice successfully', async () => {
      const invoice = await service.createInvoice({
        customer: validCustomer,
        items: validItems,
      });

      const deleted = await service.deleteInvoice(invoice.invoiceNumber);
      expect(deleted).toBe(true);

      const retrieved = await service.getInvoice(invoice.invoiceNumber);
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent invoice', async () => {
      const deleted = await service.deleteInvoice('NON_EXISTENT');

      expect(deleted).toBe(false);
    });
  });
});
