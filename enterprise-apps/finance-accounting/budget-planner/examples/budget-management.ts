/**
 * Budget Planning and Management Examples
 *
 * This example demonstrates:
 * - Creating budgets for departments and projects
 * - Tracking spending against budgets
 * - Variance analysis
 * - Budget alerts and forecasting
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type definitions for budget operations
interface BudgetCreationData {
  name: string;
  description?: string;
  fiscalYear: number;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  currency: string;
  departmentId?: string;
  projectId?: string;
  ownerId: string;
}

interface BudgetCategoryAllocation {
  category: string;
  allocatedAmount: number;
  description?: string;
}

type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'LOCKED' | 'CLOSED';

interface VarianceReport {
  category: string;
  budgetedAmount: number;
  actualSpending: number;
  variance: number;
  variancePercentage: number;
  status: 'UNDER_BUDGET' | 'ON_TARGET' | 'OVER_BUDGET';
}

/**
 * Create a new budget
 *
 * @param data - Budget creation details
 * @returns Created budget object
 */
export async function createBudget(data: BudgetCreationData) {
  try {
    // Validate dates
    if (data.endDate <= data.startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate amount
    if (data.totalAmount <= 0) {
      throw new Error('Budget amount must be greater than zero');
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        name: data.name,
        description: data.description,
        fiscalYear: data.fiscalYear,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmount: data.totalAmount,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: data.totalAmount,
        currency: data.currency,
        status: 'DRAFT',
        ownerId: data.ownerId,
        ...(data.departmentId && {
          department: {
            connect: { id: data.departmentId }
          }
        }),
        ...(data.projectId && {
          project: {
            connect: { id: data.projectId }
          }
        })
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        department: {
          select: {
            id: true,
            name: true
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

    console.log('Budget created successfully:', {
      name: budget.name,
      fiscalYear: budget.fiscalYear,
      totalAmount: `${budget.currency} ${budget.totalAmount.toFixed(2)}`,
      owner: `${budget.owner.firstName} ${budget.owner.lastName}`,
      department: budget.department?.name || 'N/A',
      project: budget.project?.name || 'N/A'
    });

    return budget;
  } catch (error) {
    console.error('Error creating budget:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('Budget with this name already exists');
      }
      if (error.code === 'P2025') {
        throw new Error('Owner, department, or project not found');
      }
    }

    throw error;
  }
}

/**
 * Allocate budget to categories
 *
 * @param budgetId - Budget ID
 * @param allocations - Category allocations
 * @returns Updated budget with allocations
 */
export async function allocateBudgetToCategories(
  budgetId: string,
  allocations: BudgetCategoryAllocation[]
) {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Calculate total allocation
    const totalAllocated = allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedAmount,
      0
    );

    // Validate total allocation doesn't exceed budget
    if (totalAllocated > budget.totalAmount) {
      throw new Error(
        `Total allocation (${totalAllocated}) exceeds budget amount (${budget.totalAmount})`
      );
    }

    // Create category allocations
    const categoryPromises = allocations.map(alloc =>
      prisma.budgetCategory.create({
        data: {
          budgetId,
          category: alloc.category,
          allocatedAmount: alloc.allocatedAmount,
          spentAmount: 0,
          remainingAmount: alloc.allocatedAmount,
          description: alloc.description
        }
      })
    );

    const categories = await Promise.all(categoryPromises);

    // Update budget allocated amount
    await prisma.budget.update({
      where: { id: budgetId },
      data: {
        allocatedAmount: totalAllocated
      }
    });

    console.log('Budget allocated to categories:', {
      budgetId,
      categoriesCount: categories.length,
      totalAllocated: `${budget.currency} ${totalAllocated.toFixed(2)}`,
      unallocated: `${budget.currency} ${(budget.totalAmount - totalAllocated).toFixed(2)}`
    });

    return categories;
  } catch (error) {
    console.error('Error allocating budget:', error);
    throw error;
  }
}

/**
 * Track spending against budget
 *
 * @param budgetId - Budget ID
 * @param category - Budget category
 * @param amount - Spending amount
 * @param description - Spending description
 * @returns Updated budget category
 */
export async function trackSpending(
  budgetId: string,
  category: string,
  amount: number,
  description: string
) {
  try {
    if (amount <= 0) {
      throw new Error('Spending amount must be greater than zero');
    }

    // Find budget category
    const budgetCategory = await prisma.budgetCategory.findFirst({
      where: {
        budgetId,
        category
      }
    });

    if (!budgetCategory) {
      throw new Error(`Budget category '${category}' not found`);
    }

    // Create spending transaction
    const transaction = await prisma.budgetTransaction.create({
      data: {
        budgetCategoryId: budgetCategory.id,
        amount,
        description,
        transactionDate: new Date(),
        type: 'EXPENSE'
      }
    });

    // Update category spent amount
    const newSpentAmount = budgetCategory.spentAmount + amount;
    const newRemainingAmount = budgetCategory.allocatedAmount - newSpentAmount;

    const updatedCategory = await prisma.budgetCategory.update({
      where: { id: budgetCategory.id },
      data: {
        spentAmount: newSpentAmount,
        remainingAmount: newRemainingAmount
      }
    });

    // Update overall budget spent amount
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { categories: true }
    });

    if (budget) {
      const totalSpent = budget.categories.reduce(
        (sum, cat) => sum + cat.spentAmount,
        0
      );

      await prisma.budget.update({
        where: { id: budgetId },
        data: {
          spentAmount: totalSpent,
          remainingAmount: budget.totalAmount - totalSpent
        }
      });
    }

    // Check if over budget
    const isOverBudget = newSpentAmount > budgetCategory.allocatedAmount;
    const utilizationPercentage = (newSpentAmount / budgetCategory.allocatedAmount) * 100;

    console.log('Spending tracked:', {
      budgetId,
      category,
      amount: `$${amount.toFixed(2)}`,
      totalSpent: `$${newSpentAmount.toFixed(2)}`,
      remaining: `$${newRemainingAmount.toFixed(2)}`,
      utilization: `${utilizationPercentage.toFixed(1)}%`,
      status: isOverBudget ? 'OVER_BUDGET' : 'WITHIN_BUDGET'
    });

    return {
      transaction,
      category: updatedCategory,
      isOverBudget,
      utilizationPercentage
    };
  } catch (error) {
    console.error('Error tracking spending:', error);
    throw error;
  }
}

/**
 * Perform variance analysis on budget
 *
 * @param budgetId - Budget ID
 * @returns Variance report by category
 */
export async function performVarianceAnalysis(
  budgetId: string
): Promise<VarianceReport[]> {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            transactions: true
          }
        }
      }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Calculate variance for each category
    const variances: VarianceReport[] = budget.categories.map(category => {
      const budgetedAmount = category.allocatedAmount;
      const actualSpending = category.spentAmount;
      const variance = budgetedAmount - actualSpending;
      const variancePercentage = budgetedAmount > 0
        ? (variance / budgetedAmount) * 100
        : 0;

      // Determine status
      let status: VarianceReport['status'];
      if (variancePercentage >= 10) {
        status = 'UNDER_BUDGET';
      } else if (variancePercentage >= -5) {
        status = 'ON_TARGET';
      } else {
        status = 'OVER_BUDGET';
      }

      return {
        category: category.category,
        budgetedAmount,
        actualSpending,
        variance,
        variancePercentage,
        status
      };
    });

    // Sort by variance (most over-budget first)
    variances.sort((a, b) => a.variancePercentage - b.variancePercentage);

    console.log('Variance analysis completed:', {
      budgetId,
      totalCategories: variances.length,
      overBudgetCount: variances.filter(v => v.status === 'OVER_BUDGET').length,
      onTargetCount: variances.filter(v => v.status === 'ON_TARGET').length,
      underBudgetCount: variances.filter(v => v.status === 'UNDER_BUDGET').length
    });

    return variances;
  } catch (error) {
    console.error('Error performing variance analysis:', error);
    throw error;
  }
}

/**
 * Get budget utilization summary
 *
 * @param budgetId - Budget ID
 * @returns Budget utilization metrics
 */
export async function getBudgetUtilization(budgetId: string) {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: true
      }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Calculate time elapsed
    const now = new Date();
    const totalDays = Math.ceil(
      (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const timeElapsedPercentage = Math.min((daysElapsed / totalDays) * 100, 100);

    // Calculate spending metrics
    const utilizationPercentage = (budget.spentAmount / budget.totalAmount) * 100;
    const allocationPercentage = (budget.allocatedAmount / budget.totalAmount) * 100;

    // Determine if spending is on track
    const expectedSpending = (budget.totalAmount * timeElapsedPercentage) / 100;
    const spendingPace = budget.spentAmount / expectedSpending;

    let paceStatus: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
    if (spendingPace > 1.1) {
      paceStatus = 'AHEAD';
    } else if (spendingPace < 0.9) {
      paceStatus = 'BEHIND';
    } else {
      paceStatus = 'ON_TRACK';
    }

    const utilization = {
      budget: {
        name: budget.name,
        totalAmount: budget.totalAmount,
        spentAmount: budget.spentAmount,
        remainingAmount: budget.remainingAmount,
        allocatedAmount: budget.allocatedAmount,
        currency: budget.currency
      },
      percentages: {
        utilization: utilizationPercentage,
        allocation: allocationPercentage,
        timeElapsed: timeElapsedPercentage
      },
      pace: {
        expectedSpending,
        actualSpending: budget.spentAmount,
        paceRatio: spendingPace,
        status: paceStatus
      },
      timeline: {
        startDate: budget.startDate,
        endDate: budget.endDate,
        daysElapsed,
        daysRemaining: totalDays - daysElapsed,
        totalDays
      },
      categories: budget.categories.map(cat => ({
        category: cat.category,
        allocated: cat.allocatedAmount,
        spent: cat.spentAmount,
        remaining: cat.remainingAmount,
        utilization: (cat.spentAmount / cat.allocatedAmount) * 100
      }))
    };

    console.log('Budget utilization:', {
      budgetName: budget.name,
      utilization: `${utilizationPercentage.toFixed(1)}%`,
      timeElapsed: `${timeElapsedPercentage.toFixed(1)}%`,
      paceStatus,
      daysRemaining: utilization.timeline.daysRemaining
    });

    return utilization;
  } catch (error) {
    console.error('Error getting budget utilization:', error);
    throw error;
  }
}

/**
 * Forecast budget needs
 *
 * @param budgetId - Budget ID
 * @returns Budget forecast
 */
export async function forecastBudget(budgetId: string) {
  try {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: {
          include: {
            transactions: {
              orderBy: { transactionDate: 'asc' }
            }
          }
        }
      }
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const now = new Date();
    const totalDays = Math.ceil(
      (budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysElapsed = Math.ceil(
      (now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = totalDays - daysElapsed;

    if (daysElapsed <= 0) {
      throw new Error('Budget period has not started yet');
    }

    // Calculate daily burn rate
    const dailyBurnRate = budget.spentAmount / daysElapsed;

    // Forecast total spending
    const forecastedTotal = dailyBurnRate * totalDays;

    // Calculate projected surplus/deficit
    const projectedVariance = budget.totalAmount - forecastedTotal;

    // Category-level forecasts
    const categoryForecasts = budget.categories.map(category => {
      const categoryDailyRate = category.spentAmount / daysElapsed;
      const categoryForecast = categoryDailyRate * totalDays;
      const categoryVariance = category.allocatedAmount - categoryForecast;

      return {
        category: category.category,
        currentSpending: category.spentAmount,
        forecastedTotal: categoryForecast,
        allocated: category.allocatedAmount,
        projectedVariance: categoryVariance,
        isOverBudget: categoryForecast > category.allocatedAmount
      };
    });

    const forecast = {
      budget: {
        name: budget.name,
        totalAmount: budget.totalAmount,
        currentSpending: budget.spentAmount
      },
      forecast: {
        dailyBurnRate,
        forecastedTotal,
        projectedVariance,
        utilizationForecast: (forecastedTotal / budget.totalAmount) * 100,
        needsAdjustment: Math.abs(projectedVariance) > budget.totalAmount * 0.1
      },
      timeline: {
        daysElapsed,
        daysRemaining,
        totalDays
      },
      categories: categoryForecasts,
      recommendations: generateRecommendations(
        budget,
        forecastedTotal,
        categoryForecasts
      )
    };

    console.log('Budget forecast generated:', {
      budgetName: budget.name,
      forecastedTotal: `$${forecastedTotal.toFixed(2)}`,
      projectedVariance: `$${projectedVariance.toFixed(2)}`,
      status: projectedVariance >= 0 ? 'UNDER_BUDGET' : 'OVER_BUDGET'
    });

    return forecast;
  } catch (error) {
    console.error('Error forecasting budget:', error);
    throw error;
  }
}

/**
 * Generate budget recommendations
 */
function generateRecommendations(
  budget: any,
  forecastedTotal: number,
  categoryForecasts: any[]
): string[] {
  const recommendations: string[] = [];

  // Overall budget recommendations
  if (forecastedTotal > budget.totalAmount * 1.1) {
    recommendations.push(
      `Overall budget is forecasted to exceed by ${((forecastedTotal / budget.totalAmount - 1) * 100).toFixed(1)}%. Consider budget reallocation or requesting additional funds.`
    );
  }

  // Category-specific recommendations
  const overBudgetCategories = categoryForecasts.filter(c => c.isOverBudget);
  if (overBudgetCategories.length > 0) {
    recommendations.push(
      `${overBudgetCategories.length} categories are forecasted to exceed their allocations: ${overBudgetCategories.map(c => c.category).join(', ')}`
    );
  }

  // Spending pace recommendation
  const utilization = budget.spentAmount / budget.totalAmount;
  if (utilization < 0.5 && forecastedTotal < budget.totalAmount * 0.8) {
    recommendations.push(
      'Current spending is below forecasted needs. Consider accelerating planned initiatives or reallocating funds.'
    );
  }

  return recommendations;
}

/**
 * Example usage demonstrating budget management workflow
 */
export async function runBudgetManagementExample() {
  try {
    console.log('=== Budget Management Example ===\n');

    // 1. Create a new budget
    console.log('1. Creating annual budget...');
    const budget = await createBudget({
      name: 'Engineering Department FY2024',
      description: 'Annual budget for engineering department',
      fiscalYear: 2024,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      totalAmount: 500000,
      currency: 'USD',
      departmentId: 'dept-eng-123', // Replace with actual department ID
      ownerId: 'emp-manager-456' // Replace with actual owner ID
    });

    // 2. Allocate budget to categories
    console.log('\n2. Allocating budget to categories...');
    await allocateBudgetToCategories(budget.id, [
      { category: 'Salaries', allocatedAmount: 300000, description: 'Employee salaries' },
      { category: 'Equipment', allocatedAmount: 75000, description: 'Computers and tools' },
      { category: 'Training', allocatedAmount: 50000, description: 'Professional development' },
      { category: 'Software', allocatedAmount: 40000, description: 'Licenses and subscriptions' },
      { category: 'Travel', allocatedAmount: 25000, description: 'Conference and client visits' },
      { category: 'Miscellaneous', allocatedAmount: 10000, description: 'Other expenses' }
    ]);

    // 3. Track some spending
    console.log('\n3. Tracking spending...');
    await trackSpending(budget.id, 'Equipment', 5000, 'New developer laptops');
    await trackSpending(budget.id, 'Software', 2400, 'Annual IDE licenses');
    await trackSpending(budget.id, 'Training', 1500, 'Cloud certification course');

    // 4. Perform variance analysis
    console.log('\n4. Performing variance analysis...');
    const variances = await performVarianceAnalysis(budget.id);
    console.log('\nVariance Summary:');
    variances.forEach(v => {
      console.log(`  ${v.category}: ${v.status} (${v.variancePercentage.toFixed(1)}%)`);
    });

    // 5. Get budget utilization
    console.log('\n5. Getting budget utilization...');
    const utilization = await getBudgetUtilization(budget.id);

    // 6. Forecast budget
    console.log('\n6. Forecasting budget...');
    const forecast = await forecastBudget(budget.id);
    if (forecast.recommendations.length > 0) {
      console.log('\nRecommendations:');
      forecast.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log('\n=== Example completed successfully ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uncomment to run the example
// runBudgetManagementExample();
