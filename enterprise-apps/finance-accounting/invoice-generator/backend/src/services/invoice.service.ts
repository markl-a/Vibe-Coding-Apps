export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface Customer {
  name: string;
  email: string;
  address?: string;
  taxId?: string;
}

export interface Invoice {
  invoiceNumber: string;
  customer: Customer;
  items: InvoiceItem[];
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

export interface CreateInvoiceDTO {
  customer: Customer;
  items: InvoiceItem[];
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: string;
  currency?: string;
  notes?: string;
}

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface PDFOptions {
  includeNotes: boolean;
  includeTaxBreakdown: boolean;
  logoUrl?: string;
}

export class InvoiceService {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceCounter = 1;

  /**
   * Generate a unique invoice number
   */
  generateInvoiceNumber(prefix = 'INV'): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const number = String(this.invoiceCounter++).padStart(4, '0');
    return `${prefix}-${timestamp}-${number}`;
  }

  /**
   * Calculate invoice totals
   */
  calculateTotals(items: InvoiceItem[]): InvoiceTotals {
    let subtotal = 0;
    let tax = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error(`Invalid quantity for item: ${item.description}`);
      }

      if (item.unitPrice < 0) {
        throw new Error(`Invalid unit price for item: ${item.description}`);
      }

      if (item.taxRate < 0 || item.taxRate > 100) {
        throw new Error(`Invalid tax rate for item: ${item.description}`);
      }

      const lineSubtotal = item.quantity * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate / 100);

      subtotal += lineSubtotal;
      tax += lineTax;
    }

    return {
      subtotal: this.roundToTwo(subtotal),
      tax: this.roundToTwo(tax),
      total: this.roundToTwo(subtotal + tax),
    };
  }

  /**
   * Validate invoice data
   */
  validateInvoice(data: CreateInvoiceDTO): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Customer validation
    if (!data.customer) {
      errors.push('Customer information is required');
    } else {
      if (!data.customer.name || data.customer.name.trim() === '') {
        errors.push('Customer name is required');
      }

      if (!data.customer.email || data.customer.email.trim() === '') {
        errors.push('Customer email is required');
      } else if (!this.isValidEmail(data.customer.email)) {
        errors.push('Invalid customer email format');
      }
    }

    // Items validation
    if (!data.items || data.items.length === 0) {
      errors.push('At least one item is required');
    } else {
      data.items.forEach((item, index) => {
        if (!item.description || item.description.trim() === '') {
          errors.push(`Item ${index + 1}: Description is required`);
        }

        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
        }

        if (item.unitPrice <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
        }

        if (item.taxRate < 0 || item.taxRate > 100) {
          errors.push(`Item ${index + 1}: Tax rate must be between 0 and 100`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new invoice
   */
  async createInvoice(data: CreateInvoiceDTO): Promise<Invoice> {
    // Validate invoice data
    const validation = this.validateInvoice(data);
    if (!validation.valid) {
      throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate totals
    const totals = this.calculateTotals(data.items);

    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber();

    // Set dates
    const invoiceDate = data.invoiceDate || new Date().toISOString().split('T')[0];
    const dueDate = data.dueDate || this.calculateDueDate(invoiceDate, 30);

    // Create invoice
    const invoice: Invoice = {
      invoiceNumber,
      customer: { ...data.customer },
      items: data.items.map((item) => ({ ...item })),
      invoiceDate,
      dueDate,
      paymentTerms: data.paymentTerms || 'Net 30',
      currency: data.currency || 'USD',
      notes: data.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      createdAt: new Date(),
      status: 'draft',
    };

    this.invoices.set(invoiceNumber, invoice);
    return invoice;
  }

  /**
   * Get invoice by number
   */
  async getInvoice(invoiceNumber: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceNumber) || null;
  }

  /**
   * Get all invoices
   */
  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceNumber: string,
    status: Invoice['status']
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceNumber);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.status = status;
    this.invoices.set(invoiceNumber, invoice);

    return invoice;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceNumber: string): Promise<boolean> {
    return this.invoices.delete(invoiceNumber);
  }

  /**
   * Generate PDF (mock implementation)
   */
  async generatePDF(invoiceNumber: string, options?: PDFOptions): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> {
    const invoice = this.invoices.get(invoiceNumber);

    if (!invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      };
    }

    // Mock PDF generation
    const fileName = `invoice_${invoiceNumber}.pdf`;
    const filePath = `/generated_invoices/${fileName}`;

    // Simulate PDF generation with options
    const pdfData = {
      invoice,
      options: options || {
        includeNotes: true,
        includeTaxBreakdown: true,
      },
    };

    return {
      success: true,
      filePath,
    };
  }

  /**
   * Get invoices by status
   */
  async getInvoicesByStatus(status: Invoice['status']): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter((invoice) => invoice.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get invoices by customer email
   */
  async getInvoicesByCustomer(customerEmail: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter((invoice) => invoice.customer.email === customerEmail)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get overdue invoices
   */
  async getOverdueInvoices(): Promise<Invoice[]> {
    const today = new Date().toISOString().split('T')[0];

    return Array.from(this.invoices.values())
      .filter(
        (invoice) =>
          invoice.status !== 'paid' && invoice.dueDate < today
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  /**
   * Calculate total revenue
   */
  async calculateRevenue(
    startDate?: string,
    endDate?: string
  ): Promise<{ totalRevenue: number; paidRevenue: number; pendingRevenue: number }> {
    let invoices = Array.from(this.invoices.values());

    if (startDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate >= startDate);
    }

    if (endDate) {
      invoices = invoices.filter((inv) => inv.invoiceDate <= endDate);
    }

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingRevenue = totalRevenue - paidRevenue;

    return {
      totalRevenue: this.roundToTwo(totalRevenue),
      paidRevenue: this.roundToTwo(paidRevenue),
      pendingRevenue: this.roundToTwo(pendingRevenue),
    };
  }

  // Helper methods
  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private calculateDueDate(invoiceDate: string, daysToAdd: number): string {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

  // For testing purposes
  clear(): void {
    this.invoices.clear();
    this.invoiceCounter = 1;
  }
}
