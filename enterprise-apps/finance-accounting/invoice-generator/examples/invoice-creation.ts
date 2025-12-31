/**
 * Invoice Creation and Management Examples
 *
 * This example demonstrates:
 * - Creating invoices with line items
 * - Adding/updating invoice line items
 * - Generating PDF invoices
 * - Managing invoice status and payments
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for invoice operations
interface InvoiceCreationData {
  customerId: string;
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  taxRate: number;
  notes?: string;
  paymentTerms?: string;
}

interface LineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  productId?: string;
}

type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'VOID';

interface InvoicePDFOptions {
  includePaymentInstructions: boolean;
  includeCompanyLogo: boolean;
  template: 'standard' | 'professional' | 'minimal';
  language: string;
}

/**
 * Generate unique invoice number
 *
 * @returns Generated invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Get the count of invoices this month
  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
}

/**
 * Create a new invoice
 *
 * @param data - Invoice creation details
 * @returns Created invoice object
 */
export async function createInvoice(data: InvoiceCreationData) {
  try {
    // Validate dates
    if (data.dueDate < data.issueDate) {
      throw new Error('Due date cannot be before issue date');
    }

    // Generate invoice number if not provided
    const invoiceNumber = data.invoiceNumber || await generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: data.customerId,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency,
        taxRate: data.taxRate,
        status: 'DRAFT',
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: data.notes,
        paymentTerms: data.paymentTerms || 'Net 30'
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            billingAddress: true
          }
        }
      }
    });

    console.log('Invoice created successfully:', {
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer.name,
      issueDate: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      status: invoice.status
    });

    return invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Invoice number already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Customer not found');
      }
    }

    throw error;
  }
}

/**
 * Add a line item to an invoice
 *
 * @param invoiceId - Invoice ID
 * @param item - Line item details
 * @returns Created line item
 */
export async function addLineItem(invoiceId: string, item: LineItemData) {
  try {
    // Validate quantity and price
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
    if (item.unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }

    // Calculate line total
    const lineTotal = item.quantity * item.unitPrice;

    // Create line item
    const lineItem = await prisma.invoiceLineItem.create({
      data: {
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        taxable: item.taxable,
        ...(item.productId && {
          product: {
            connect: { id: item.productId }
          }
        })
      }
    });

    // Recalculate invoice totals
    await recalculateInvoiceTotals(invoiceId);

    console.log('Line item added:', {
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: `$${item.unitPrice.toFixed(2)}`,
      lineTotal: `$${lineTotal.toFixed(2)}`
    });

    return lineItem;
  } catch (error) {
    console.error('Error adding line item:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Invoice not found');
      }
    }

    throw error;
  }
}

/**
 * Update an existing line item
 *
 * @param lineItemId - Line item ID
 * @param updates - Fields to update
 * @returns Updated line item
 */
export async function updateLineItem(
  lineItemId: string,
  updates: {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxable?: boolean;
  }
) {
  try {
    // Get current line item
    const currentItem = await prisma.invoiceLineItem.findUnique({
      where: { id: lineItemId }
    });

    if (!currentItem) {
      throw new Error('Line item not found');
    }

    // Calculate new line total if quantity or price changed
    const quantity = updates.quantity ?? currentItem.quantity;
    const unitPrice = updates.unitPrice ?? currentItem.unitPrice;
    const lineTotal = quantity * unitPrice;

    // Update line item
    const lineItem = await prisma.invoiceLineItem.update({
      where: { id: lineItemId },
      data: {
        ...updates,
        lineTotal
      }
    });

    // Recalculate invoice totals
    await recalculateInvoiceTotals(currentItem.invoiceId);

    console.log('Line item updated:', {
      lineItemId,
      changes: Object.keys(updates),
      newLineTotal: `$${lineTotal.toFixed(2)}`
    });

    return lineItem;
  } catch (error) {
    console.error('Error updating line item:', error);
    throw error;
  }
}

/**
 * Remove a line item from an invoice
 *
 * @param lineItemId - Line item ID
 */
export async function removeLineItem(lineItemId: string) {
  try {
    const lineItem = await prisma.invoiceLineItem.findUnique({
      where: { id: lineItemId }
    });

    if (!lineItem) {
      throw new Error('Line item not found');
    }

    const invoiceId = lineItem.invoiceId;

    // Delete line item
    await prisma.invoiceLineItem.delete({
      where: { id: lineItemId }
    });

    // Recalculate invoice totals
    await recalculateInvoiceTotals(invoiceId);

    console.log('Line item removed:', { lineItemId, invoiceId });
  } catch (error) {
    console.error('Error removing line item:', error);
    throw error;
  }
}

/**
 * Recalculate invoice totals based on line items
 *
 * @param invoiceId - Invoice ID
 */
async function recalculateInvoiceTotals(invoiceId: string) {
  try {
    // Get invoice with line items
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lineItems: true }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate subtotal
    const subtotal = invoice.lineItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );

    // Calculate tax (only on taxable items)
    const taxableAmount = invoice.lineItems
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + item.lineTotal, 0);

    const taxAmount = taxableAmount * (invoice.taxRate / 100);

    // Calculate total
    const totalAmount = subtotal + taxAmount;

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal,
        taxAmount,
        totalAmount
      }
    });

    console.log('Invoice totals recalculated:', {
      invoiceId,
      subtotal: `$${subtotal.toFixed(2)}`,
      tax: `$${taxAmount.toFixed(2)}`,
      total: `$${totalAmount.toFixed(2)}`
    });
  } catch (error) {
    console.error('Error recalculating invoice totals:', error);
    throw error;
  }
}

/**
 * Generate PDF for an invoice
 *
 * @param invoiceId - Invoice ID
 * @param options - PDF generation options
 * @returns PDF URL
 */
export async function generateInvoicePDF(
  invoiceId: string,
  options: InvoicePDFOptions = {
    includePaymentInstructions: true,
    includeCompanyLogo: true,
    template: 'professional',
    language: 'en'
  }
) {
  try {
    // Get invoice with all related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        lineItems: {
          include: {
            product: true
          }
        },
        payments: true
      }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // In a real application, you would use a PDF generation library here
    // For example: PDFKit, jsPDF, or a service like DocRaptor
    console.log('Generating PDF with options:', options);

    // Simulate PDF generation
    const pdfData = {
      invoice: {
        number: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status
      },
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
        address: invoice.customer.billingAddress
      },
      lineItems: invoice.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal
      })),
      totals: {
        subtotal: invoice.subtotal,
        tax: invoice.taxAmount,
        total: invoice.totalAmount
      },
      options
    };

    // Generate PDF URL (simulated)
    const pdfUrl = `https://storage.example.com/invoices/${invoice.invoiceNumber}.pdf`;

    // Update invoice with PDF URL
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pdfUrl,
        pdfGeneratedAt: new Date()
      }
    });

    console.log('PDF generated successfully:', {
      invoiceNumber: invoice.invoiceNumber,
      pdfUrl,
      template: options.template
    });

    return {
      pdfUrl,
      pdfData
    };
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw error;
  }
}

/**
 * Update invoice status
 *
 * @param invoiceId - Invoice ID
 * @param status - New status
 * @returns Updated invoice
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
) {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status,
        ...(status === 'SENT' && { sentAt: new Date() }),
        ...(status === 'PAID' && { paidAt: new Date() })
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Invoice status updated:', {
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer.name,
      newStatus: status
    });

    return invoice;
  } catch (error) {
    console.error('Error updating invoice status:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Invoice not found');
      }
    }

    throw error;
  }
}

/**
 * Record a payment for an invoice
 *
 * @param invoiceId - Invoice ID
 * @param amount - Payment amount
 * @param paymentMethod - Payment method
 * @param paymentDate - Payment date
 * @returns Updated invoice
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  paymentMethod: string,
  paymentDate: Date = new Date()
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true }
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate total paid amount
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;

    // Validate payment amount
    if (totalPaid > invoice.totalAmount) {
      throw new Error('Payment amount exceeds invoice total');
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        paymentMethod,
        paymentDate,
        status: 'COMPLETED'
      }
    });

    // Update invoice status
    const newStatus: InvoiceStatus =
      totalPaid >= invoice.totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        ...(newStatus === 'PAID' && { paidAt: new Date() })
      },
      include: {
        payments: true
      }
    });

    console.log('Payment recorded:', {
      invoiceNumber: invoice.invoiceNumber,
      paymentAmount: `$${amount.toFixed(2)}`,
      totalPaid: `$${totalPaid.toFixed(2)}`,
      invoiceTotal: `$${invoice.totalAmount.toFixed(2)}`,
      newStatus
    });

    return updatedInvoice;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating invoice creation workflow
 */
export async function runInvoiceCreationExample() {
  try {
    console.log('=== Invoice Creation Example ===\n');

    // 1. Create a new invoice
    console.log('1. Creating new invoice...');
    const invoice = await createInvoice({
      customerId: 'cust-123', // Replace with actual customer ID
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      currency: 'USD',
      taxRate: 8.5,
      paymentTerms: 'Net 30',
      notes: 'Thank you for your business!'
    });

    // 2. Add line items
    console.log('\n2. Adding line items...');
    await addLineItem(invoice.id, {
      description: 'Website Development - Phase 1',
      quantity: 1,
      unitPrice: 5000.00,
      taxable: true
    });

    await addLineItem(invoice.id, {
      description: 'Logo Design',
      quantity: 2,
      unitPrice: 500.00,
      taxable: true
    });

    await addLineItem(invoice.id, {
      description: 'Hosting Setup (Annual)',
      quantity: 1,
      unitPrice: 240.00,
      taxable: false
    });

    // 3. Update a line item
    console.log('\n3. Updating line item...');
    const lineItems = await prisma.invoiceLineItem.findMany({
      where: { invoiceId: invoice.id }
    });
    if (lineItems.length > 0) {
      await updateLineItem(lineItems[0].id, {
        quantity: 1,
        unitPrice: 5500.00 // Price adjustment
      });
    }

    // 4. Generate PDF
    console.log('\n4. Generating invoice PDF...');
    const { pdfUrl } = await generateInvoicePDF(invoice.id, {
      includePaymentInstructions: true,
      includeCompanyLogo: true,
      template: 'professional',
      language: 'en'
    });

    // 5. Update status to SENT
    console.log('\n5. Marking invoice as sent...');
    await updateInvoiceStatus(invoice.id, 'SENT');

    // 6. Record a partial payment
    console.log('\n6. Recording payment...');
    await recordPayment(invoice.id, 3000.00, 'BANK_TRANSFER');

    console.log('\n=== Example completed successfully ===');
    console.log(`PDF available at: ${pdfUrl}`);
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runInvoiceCreationExample();
