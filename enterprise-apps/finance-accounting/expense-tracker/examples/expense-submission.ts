/**
 * Expense Submission and Management Examples
 *
 * This example demonstrates:
 * - Submitting expense reports
 * - Attaching receipts and documents
 * - Expense categorization
 * - Approval workflows
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for expense operations
interface ExpenseSubmissionData {
  employeeId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  expenseDate: Date;
  merchantName: string;
  paymentMethod: PaymentMethod;
  projectId?: string;
  notes?: string;
}

interface ReceiptAttachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

type ExpenseCategory =
  | 'TRAVEL'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'TRANSPORTATION'
  | 'SUPPLIES'
  | 'EQUIPMENT'
  | 'TRAINING'
  | 'OTHER';

type PaymentMethod =
  | 'CORPORATE_CARD'
  | 'PERSONAL_CARD'
  | 'CASH'
  | 'BANK_TRANSFER';

type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'REIMBURSED';

/**
 * Submit a new expense report
 *
 * @param data - Expense submission details
 * @returns Created expense object
 */
export async function submitExpense(data: ExpenseSubmissionData) {
  try {
    // Validate expense amount
    if (data.amount <= 0) {
      throw new Error('Expense amount must be greater than zero');
    }

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        employeeId: data.employeeId,
        amount: data.amount,
        category: data.category,
        description: data.description,
        expenseDate: data.expenseDate,
        merchantName: data.merchantName,
        paymentMethod: data.paymentMethod,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        notes: data.notes,
        // Link to project if specified
        ...(data.projectId && {
          project: {
            connect: { id: data.projectId }
          }
        })
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    console.log('Expense submitted successfully:', {
      id: expense.id,
      employee: `${expense.employee.firstName} ${expense.employee.lastName}`,
      amount: `$${expense.amount.toFixed(2)}`,
      category: expense.category,
      status: expense.status
    });

    return expense;
  } catch (error) {
    console.error('Error submitting expense:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Employee or project not found');
      }
    }

    throw error;
  }
}

/**
 * Attach a receipt to an expense
 *
 * @param expenseId - Expense ID
 * @param receipt - Receipt attachment details
 * @returns Updated expense with receipt
 */
export async function attachReceipt(
  expenseId: string,
  receipt: ReceiptAttachment
) {
  try {
    // Validate file type (accept images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(receipt.fileType)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, and PDF files are allowed'
      );
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
    if (receipt.fileSize > maxFileSize) {
      throw new Error('File size exceeds maximum limit of 10MB');
    }

    // Create receipt attachment
    const attachment = await prisma.receipt.create({
      data: {
        expenseId,
        fileName: receipt.fileName,
        fileType: receipt.fileType,
        fileSize: receipt.fileSize,
        fileUrl: receipt.fileUrl,
        uploadedAt: receipt.uploadedAt
      }
    });

    // Update expense to mark receipt as attached
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: { hasReceipt: true },
      include: {
        receipts: true
      }
    });

    console.log('Receipt attached successfully:', {
      expenseId: expense.id,
      fileName: attachment.fileName,
      fileSize: `${(attachment.fileSize / 1024).toFixed(2)} KB`,
      totalReceipts: expense.receipts.length
    });

    return expense;
  } catch (error) {
    console.error('Error attaching receipt:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Expense not found');
      }
    }

    throw error;
  }
}

/**
 * Categorize expenses using predefined rules
 *
 * @param expenses - Array of expenses to categorize
 * @returns Categorized expenses summary
 */
export async function categorizeExpenses(expenses: Array<{
  id: string;
  description: string;
  merchantName: string;
  amount: number;
}>) {
  try {
    const categorized: Record<ExpenseCategory, Array<typeof expenses[0]>> = {
      TRAVEL: [],
      MEALS: [],
      ACCOMMODATION: [],
      TRANSPORTATION: [],
      SUPPLIES: [],
      EQUIPMENT: [],
      TRAINING: [],
      OTHER: []
    };

    // Auto-categorization rules based on keywords
    const categoryRules: Record<ExpenseCategory, string[]> = {
      TRAVEL: ['flight', 'airline', 'airport', 'train', 'bus'],
      MEALS: ['restaurant', 'food', 'cafe', 'lunch', 'dinner', 'breakfast'],
      ACCOMMODATION: ['hotel', 'airbnb', 'lodging', 'accommodation'],
      TRANSPORTATION: ['uber', 'lyft', 'taxi', 'car rental', 'parking', 'gas'],
      SUPPLIES: ['office', 'stationery', 'supplies', 'paper'],
      EQUIPMENT: ['laptop', 'computer', 'monitor', 'keyboard', 'mouse'],
      TRAINING: ['course', 'training', 'workshop', 'conference', 'seminar'],
      OTHER: []
    };

    for (const expense of expenses) {
      let assigned = false;
      const searchText = `${expense.description} ${expense.merchantName}`.toLowerCase();

      // Try to match with categorization rules
      for (const [category, keywords] of Object.entries(categoryRules)) {
        if (keywords.some(keyword => searchText.includes(keyword))) {
          categorized[category as ExpenseCategory].push(expense);

          // Update expense category in database
          await prisma.expense.update({
            where: { id: expense.id },
            data: { category: category as ExpenseCategory }
          });

          assigned = true;
          break;
        }
      }

      // If no category matched, assign to OTHER
      if (!assigned) {
        categorized.OTHER.push(expense);
        await prisma.expense.update({
          where: { id: expense.id },
          data: { category: 'OTHER' }
        });
      }
    }

    // Calculate totals by category
    const summary = Object.entries(categorized).map(([category, items]) => ({
      category,
      count: items.length,
      total: items.reduce((sum, item) => sum + item.amount, 0)
    }));

    console.log('Expenses categorized:', {
      totalExpenses: expenses.length,
      categories: summary.filter(s => s.count > 0)
    });

    return {
      categorized,
      summary
    };
  } catch (error) {
    console.error('Error categorizing expenses:', error);
    throw error;
  }
}

/**
 * Update expense status (for approval workflow)
 *
 * @param expenseId - Expense ID
 * @param status - New status
 * @param approverId - ID of approver (if applicable)
 * @param comments - Approval/rejection comments
 * @returns Updated expense
 */
export async function updateExpenseStatus(
  expenseId: string,
  status: ExpenseStatus,
  approverId?: string,
  comments?: string
) {
  try {
    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        status,
        ...(approverId && { approverId }),
        ...(status === 'APPROVED' && { approvedAt: new Date() }),
        ...(status === 'REJECTED' && { rejectedAt: new Date() }),
        ...(status === 'REIMBURSED' && { reimbursedAt: new Date() }),
        ...(comments && { approvalComments: comments })
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log('Expense status updated:', {
      expenseId: expense.id,
      newStatus: status,
      employee: `${expense.employee.firstName} ${expense.employee.lastName}`,
      approver: expense.approver
        ? `${expense.approver.firstName} ${expense.approver.lastName}`
        : 'N/A'
    });

    return expense;
  } catch (error) {
    console.error('Error updating expense status:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        throw new Error('Expense not found');
      }
    }

    throw error;
  }
}

/**
 * Get expense statistics for an employee
 *
 * @param employeeId - Employee ID
 * @param startDate - Start date for the report period
 * @param endDate - End date for the report period
 * @returns Expense statistics
 */
export async function getEmployeeExpenseStats(
  employeeId: string,
  startDate: Date,
  endDate: Date
) {
  try {
    const expenses = await prisma.expense.findMany({
      where: {
        employeeId,
        expenseDate: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate statistics
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = expenses.reduce((acc, exp) => {
      const category = exp.category;
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0 };
      }
      acc[category].count++;
      acc[category].total += exp.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const byStatus = expenses.reduce((acc, exp) => {
      const status = exp.status;
      if (!acc[status]) {
        acc[status] = { count: 0, total: 0 };
      }
      acc[status].count++;
      acc[status].total += exp.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const stats = {
      period: {
        start: startDate,
        end: endDate
      },
      totalExpenses: expenses.length,
      totalAmount: total,
      averageAmount: expenses.length > 0 ? total / expenses.length : 0,
      byCategory,
      byStatus,
      pendingReimbursement: expenses
        .filter(e => e.status === 'APPROVED')
        .reduce((sum, e) => sum + e.amount, 0)
    };

    console.log('Employee expense statistics:', {
      employeeId,
      totalExpenses: stats.totalExpenses,
      totalAmount: `$${stats.totalAmount.toFixed(2)}`,
      pendingReimbursement: `$${stats.pendingReimbursement.toFixed(2)}`
    });

    return stats;
  } catch (error) {
    console.error('Error calculating expense statistics:', error);
    throw error;
  }
}

/**
 * Example usage demonstrating expense submission workflow
 */
export async function runExpenseSubmissionExample() {
  try {
    console.log('=== Expense Submission Example ===\n');

    // 1. Submit a new expense
    console.log('1. Submitting new expense...');
    const expense = await submitExpense({
      employeeId: 'emp-123', // Replace with actual employee ID
      amount: 125.50,
      category: 'MEALS',
      description: 'Client dinner meeting',
      expenseDate: new Date('2024-03-15'),
      merchantName: 'The Steakhouse Restaurant',
      paymentMethod: 'CORPORATE_CARD',
      notes: 'Discussed Q2 project requirements with client'
    });

    // 2. Attach receipt
    console.log('\n2. Attaching receipt...');
    await attachReceipt(expense.id, {
      fileName: 'receipt_20240315.pdf',
      fileType: 'application/pdf',
      fileSize: 245678,
      fileUrl: 'https://storage.example.com/receipts/receipt_20240315.pdf',
      uploadedAt: new Date()
    });

    // 3. Categorize multiple expenses
    console.log('\n3. Categorizing expenses...');
    await categorizeExpenses([
      {
        id: 'exp-1',
        description: 'Flight to NYC',
        merchantName: 'United Airlines',
        amount: 450.00
      },
      {
        id: 'exp-2',
        description: 'Office supplies',
        merchantName: 'Staples',
        amount: 35.99
      }
    ]);

    // 4. Update expense status (approval)
    console.log('\n4. Approving expense...');
    await updateExpenseStatus(
      expense.id,
      'APPROVED',
      'mgr-456', // Replace with actual manager ID
      'Approved - valid business expense'
    );

    // 5. Get expense statistics
    console.log('\n5. Getting expense statistics...');
    const stats = await getEmployeeExpenseStats(
      'emp-123',
      new Date('2024-03-01'),
      new Date('2024-03-31')
    );

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runExpenseSubmissionExample();
