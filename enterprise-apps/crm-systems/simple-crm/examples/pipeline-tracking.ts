/**
 * Sales Pipeline Tracking Examples
 *
 * This file demonstrates how to track and manage sales opportunities through
 * different stages of the sales pipeline. It includes examples of creating
 * opportunities, moving them through stages, and generating pipeline reports.
 */

import axios, { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

type OpportunityStage =
  | '探索'       // Discovery
  | '評估'       // Evaluation
  | '提案'       // Proposal
  | '談判'       // Negotiation
  | '成交'       // Won
  | '失敗';      // Lost

interface Opportunity {
  id?: number;
  customer_id: number;
  name: string;
  stage: OpportunityStage;
  amount: number;
  probability: number;
  expected_close_date?: string;
  next_steps?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
  customer_company?: string;
}

interface CreateOpportunityRequest {
  customerId: number;
  name: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  nextSteps?: string;
}

interface UpdateOpportunityRequest {
  name?: string;
  stage?: OpportunityStage;
  amount?: number;
  probability?: number;
  expectedCloseDate?: string;
  nextSteps?: string;
}

interface StageUpdateRequest {
  stage: OpportunityStage;
  probability?: number;
}

interface PipelineForecast {
  stage: OpportunityStage;
  count: number;
  total_amount: number;
  weighted_amount: number;
}

interface ApiResponse<T> {
  message?: string;
  opportunity?: T;
  opportunities?: T[];
  forecast?: PipelineForecast[];
  total?: number;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
}

interface OpportunityFilters {
  stage?: OpportunityStage;
  customerId?: number;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token-here';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================================================
// Stage Configuration and Utilities
// ============================================================================

/**
 * Default probability for each stage
 */
const STAGE_PROBABILITIES: Record<OpportunityStage, number> = {
  '探索': 10,
  '評估': 25,
  '提案': 50,
  '談判': 75,
  '成交': 100,
  '失敗': 0,
};

/**
 * Get default probability for a stage
 */
function getDefaultProbability(stage: OpportunityStage): number {
  return STAGE_PROBABILITIES[stage];
}

/**
 * Validate stage transition
 */
function isValidStageTransition(currentStage: OpportunityStage, newStage: OpportunityStage): boolean {
  // Allow any forward movement or moving to Won/Lost from any stage
  const stages: OpportunityStage[] = ['探索', '評估', '提案', '談判', '成交', '失敗'];
  const currentIndex = stages.indexOf(currentStage);
  const newIndex = stages.indexOf(newStage);

  // Can always mark as Won or Lost
  if (newStage === '成交' || newStage === '失敗') {
    return true;
  }

  // Can move forward
  if (newIndex > currentIndex && newIndex < 4) {
    return true;
  }

  return false;
}

// ============================================================================
// Error Handling
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<Opportunity>>;
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

function handleError(operation: string, error: unknown): never {
  const message = getErrorMessage(error);
  console.error(`❌ ${operation} failed:`, message);
  throw new Error(`${operation} failed: ${message}`);
}

// ============================================================================
// Opportunity Pipeline Operations
// ============================================================================

/**
 * Create a new sales opportunity
 *
 * @param request - Opportunity creation request
 * @returns Created opportunity
 * @throws Error if creation fails
 */
async function createOpportunity(request: CreateOpportunityRequest): Promise<Opportunity> {
  try {
    console.log(`📝 Creating opportunity: ${request.name}`);

    const probability = request.probability || getDefaultProbability(request.stage || '探索');

    const response = await api.post<ApiResponse<Opportunity>>('/opportunities', {
      ...request,
      probability,
    });

    if (response.data.opportunity) {
      console.log(`✅ Opportunity created: #${response.data.opportunity.id}`);
      console.log(`   Stage: ${response.data.opportunity.stage} (${probability}%)`);
      return response.data.opportunity;
    }

    throw new Error('No opportunity data in response');
  } catch (error) {
    handleError('Create opportunity', error);
  }
}

/**
 * Get all opportunities with optional filtering
 *
 * @param filters - Optional filters
 * @returns Array of opportunities
 * @throws Error if fetch fails
 */
async function getOpportunities(filters?: OpportunityFilters): Promise<Opportunity[]> {
  try {
    console.log('🔍 Fetching opportunities...', filters ? JSON.stringify(filters) : '');

    const response = await api.get<ApiResponse<Opportunity>>('/opportunities', {
      params: filters,
    });

    if (response.data.opportunities) {
      console.log(`✅ Found ${response.data.total || 0} opportunities`);
      return response.data.opportunities;
    }

    return [];
  } catch (error) {
    handleError('Get opportunities', error);
  }
}

/**
 * Get a single opportunity by ID
 *
 * @param opportunityId - Opportunity ID
 * @returns Opportunity details
 * @throws Error if not found
 */
async function getOpportunityById(opportunityId: number): Promise<Opportunity> {
  try {
    console.log(`🔍 Fetching opportunity #${opportunityId}...`);

    const response = await api.get<Opportunity>(`/opportunities/${opportunityId}`);

    console.log('✅ Opportunity retrieved successfully');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Opportunity #${opportunityId} not found`);
    }
    handleError('Get opportunity', error);
  }
}

/**
 * Update an opportunity
 *
 * @param opportunityId - Opportunity ID
 * @param updates - Fields to update
 * @returns Updated opportunity
 * @throws Error if update fails
 */
async function updateOpportunity(
  opportunityId: number,
  updates: UpdateOpportunityRequest
): Promise<Opportunity> {
  try {
    console.log(`📝 Updating opportunity #${opportunityId}...`);

    const response = await api.put<ApiResponse<Opportunity>>(
      `/opportunities/${opportunityId}`,
      updates
    );

    if (response.data.opportunity) {
      console.log('✅ Opportunity updated successfully');
      return response.data.opportunity;
    }

    throw new Error('No opportunity data in response');
  } catch (error) {
    handleError('Update opportunity', error);
  }
}

/**
 * Move opportunity to a new stage
 *
 * @param opportunityId - Opportunity ID
 * @param newStage - New stage
 * @param probability - Optional custom probability
 * @returns Updated opportunity
 * @throws Error if stage transition is invalid
 */
async function moveOpportunityToStage(
  opportunityId: number,
  newStage: OpportunityStage,
  probability?: number
): Promise<Opportunity> {
  try {
    // Get current opportunity to validate transition
    const current = await getOpportunityById(opportunityId);

    if (!isValidStageTransition(current.stage, newStage)) {
      console.warn(`⚠️  Warning: Unusual stage transition from ${current.stage} to ${newStage}`);
    }

    console.log(`🔄 Moving opportunity #${opportunityId} to stage: ${newStage}`);

    const updateProbability = probability || getDefaultProbability(newStage);

    const response = await api.patch<ApiResponse<Opportunity>>(
      `/opportunities/${opportunityId}/stage`,
      {
        stage: newStage,
        probability: updateProbability,
      }
    );

    if (response.data.opportunity) {
      console.log(`✅ Stage updated: ${newStage} (${updateProbability}%)`);
      return response.data.opportunity;
    }

    throw new Error('No opportunity data in response');
  } catch (error) {
    handleError('Move opportunity to stage', error);
  }
}

/**
 * Mark opportunity as won
 *
 * @param opportunityId - Opportunity ID
 * @returns Updated opportunity
 */
async function markAsWon(opportunityId: number): Promise<Opportunity> {
  console.log(`🎉 Marking opportunity #${opportunityId} as WON`);
  return await moveOpportunityToStage(opportunityId, '成交', 100);
}

/**
 * Mark opportunity as lost
 *
 * @param opportunityId - Opportunity ID
 * @returns Updated opportunity
 */
async function markAsLost(opportunityId: number): Promise<Opportunity> {
  console.log(`😞 Marking opportunity #${opportunityId} as LOST`);
  return await moveOpportunityToStage(opportunityId, '失敗', 0);
}

/**
 * Get sales pipeline forecast
 *
 * @returns Pipeline forecast by stage
 */
async function getPipelineForecast(): Promise<PipelineForecast[]> {
  try {
    console.log('📊 Fetching pipeline forecast...');

    const response = await api.get<ApiResponse<never>>('/opportunities/forecast/summary');

    if (response.data.forecast) {
      console.log('✅ Forecast retrieved successfully');
      return response.data.forecast;
    }

    return [];
  } catch (error) {
    handleError('Get pipeline forecast', error);
  }
}

/**
 * Delete an opportunity
 *
 * @param opportunityId - Opportunity ID
 */
async function deleteOpportunity(opportunityId: number): Promise<void> {
  try {
    console.log(`🗑️  Deleting opportunity #${opportunityId}...`);

    await api.delete(`/opportunities/${opportunityId}`);

    console.log('✅ Opportunity deleted successfully');
  } catch (error) {
    handleError('Delete opportunity', error);
  }
}

// ============================================================================
// Pipeline Analysis Functions
// ============================================================================

/**
 * Calculate total pipeline value
 *
 * @param opportunities - Array of opportunities
 * @returns Total and weighted values
 */
function calculatePipelineValue(opportunities: Opportunity[]): {
  total: number;
  weighted: number;
} {
  const total = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
  const weighted = opportunities.reduce(
    (sum, opp) => sum + (opp.amount * opp.probability / 100),
    0
  );

  return { total, weighted };
}

/**
 * Get opportunities by stage
 *
 * @param stage - Pipeline stage
 * @returns Opportunities in that stage
 */
async function getOpportunitiesByStage(stage: OpportunityStage): Promise<Opportunity[]> {
  return await getOpportunities({ stage });
}

/**
 * Get opportunities for a specific customer
 *
 * @param customerId - Customer ID
 * @returns Customer's opportunities
 */
async function getCustomerOpportunities(customerId: number): Promise<Opportunity[]> {
  return await getOpportunities({ customerId });
}

/**
 * Display pipeline forecast summary
 *
 * @param forecast - Pipeline forecast data
 */
function displayForecastSummary(forecast: PipelineForecast[]): void {
  console.log('\n📊 Pipeline Forecast Summary');
  console.log('='.repeat(70));
  console.log(`${'Stage'.padEnd(15)} ${'Count'.padStart(8)} ${'Total'.padStart(15)} ${'Weighted'.padStart(15)}`);
  console.log('-'.repeat(70));

  let totalCount = 0;
  let totalAmount = 0;
  let totalWeighted = 0;

  forecast.forEach(item => {
    totalCount += item.count;
    totalAmount += item.total_amount;
    totalWeighted += item.weighted_amount;

    console.log(
      `${item.stage.padEnd(15)} ` +
      `${item.count.toString().padStart(8)} ` +
      `$${item.total_amount.toFixed(2).padStart(14)} ` +
      `$${item.weighted_amount.toFixed(2).padStart(14)}`
    );
  });

  console.log('-'.repeat(70));
  console.log(
    `${'TOTAL'.padEnd(15)} ` +
    `${totalCount.toString().padStart(8)} ` +
    `$${totalAmount.toFixed(2).padStart(14)} ` +
    `$${totalWeighted.toFixed(2).padStart(14)}`
  );
  console.log('='.repeat(70));
}

// ============================================================================
// Example Usage Demonstrations
// ============================================================================

async function demonstratePipelineTracking(): Promise<void> {
  console.log('\n🚀 Starting Sales Pipeline Tracking Demonstration\n');
  console.log('='.repeat(70));

  try {
    // Example 1: Create a new opportunity
    console.log('\n📋 Example 1: Creating a new opportunity');
    console.log('-'.repeat(70));
    const newOpp = await createOpportunity({
      customerId: 1,
      name: 'Enterprise Software License',
      amount: 50000,
      expectedCloseDate: '2024-12-31',
      nextSteps: 'Schedule demo with decision makers',
    });

    // Example 2: Get all opportunities
    console.log('\n📋 Example 2: Viewing all opportunities');
    console.log('-'.repeat(70));
    const allOpps = await getOpportunities();
    console.log(`Total opportunities in pipeline: ${allOpps.length}`);

    // Example 3: Move opportunity through stages
    if (newOpp.id) {
      console.log('\n📋 Example 3: Moving opportunity through pipeline stages');
      console.log('-'.repeat(70));

      await moveOpportunityToStage(newOpp.id, '評估');
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay

      await moveOpportunityToStage(newOpp.id, '提案');
      await new Promise(resolve => setTimeout(resolve, 500));

      await moveOpportunityToStage(newOpp.id, '談判');
    }

    // Example 4: Update opportunity details
    if (newOpp.id) {
      console.log('\n📋 Example 4: Updating opportunity amount');
      console.log('-'.repeat(70));
      await updateOpportunity(newOpp.id, {
        amount: 75000,
        nextSteps: 'Send final proposal and contract',
      });
    }

    // Example 5: Get opportunities by stage
    console.log('\n📋 Example 5: Filtering opportunities by stage');
    console.log('-'.repeat(70));
    const proposalStage = await getOpportunitiesByStage('提案');
    console.log(`Opportunities in proposal stage: ${proposalStage.length}`);

    // Example 6: Calculate pipeline value
    console.log('\n📋 Example 6: Calculating pipeline value');
    console.log('-'.repeat(70));
    const pipelineValue = calculatePipelineValue(allOpps);
    console.log(`Total pipeline value: $${pipelineValue.total.toFixed(2)}`);
    console.log(`Weighted pipeline value: $${pipelineValue.weighted.toFixed(2)}`);

    // Example 7: Get pipeline forecast
    console.log('\n📋 Example 7: Getting sales forecast');
    console.log('-'.repeat(70));
    const forecast = await getPipelineForecast();
    displayForecastSummary(forecast);

    // Example 8: Mark opportunity as won
    if (newOpp.id) {
      console.log('\n📋 Example 8: Marking opportunity as WON');
      console.log('-'.repeat(70));
      await markAsWon(newOpp.id);
    }

    // Example 9: Get customer opportunities (if you have customer ID)
    console.log('\n📋 Example 9: Getting opportunities for a specific customer');
    console.log('-'.repeat(70));
    const customerOpps = await getCustomerOpportunities(1);
    console.log(`Customer #1 has ${customerOpps.length} opportunities`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ All pipeline tracking demonstrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Types
  Opportunity,
  OpportunityStage,
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  StageUpdateRequest,
  PipelineForecast,

  // Core operations
  createOpportunity,
  getOpportunities,
  getOpportunityById,
  updateOpportunity,
  moveOpportunityToStage,
  deleteOpportunity,

  // Pipeline management
  markAsWon,
  markAsLost,
  getPipelineForecast,
  getOpportunitiesByStage,
  getCustomerOpportunities,

  // Analysis
  calculatePipelineValue,
  displayForecastSummary,

  // Utilities
  getDefaultProbability,
  isValidStageTransition,
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstratePipelineTracking();
}
