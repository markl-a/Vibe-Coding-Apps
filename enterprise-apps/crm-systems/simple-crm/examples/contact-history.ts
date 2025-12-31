/**
 * Contact History and Activity Tracking Examples
 *
 * This file demonstrates how to track customer interactions and activities
 * in the Simple CRM system. It includes creating activities, logging interactions,
 * and analyzing customer engagement history.
 */

import axios, { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

type ActivityType =
  | '電話'       // Phone call
  | '郵件'       // Email
  | '會議'       // Meeting
  | '備註';      // Note

type ActivityStatus =
  | '計劃'       // Planned
  | '進行中'     // In progress
  | '完成'       // Completed
  | '取消';      // Cancelled

interface Activity {
  id?: number;
  customer_id: number;
  opportunity_id?: number;
  type: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  due_date?: string;
  completed_at?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  customer_name?: string;
}

interface CreateActivityRequest {
  customerId: number;
  opportunityId?: number;
  type: ActivityType;
  subject: string;
  description?: string;
  status?: ActivityStatus;
  dueDate?: string;
}

interface UpdateActivityRequest {
  type?: ActivityType;
  subject?: string;
  description?: string;
  status?: ActivityStatus;
  dueDate?: string;
}

interface ActivityFilters {
  customerId?: number;
  opportunityId?: number;
  status?: ActivityStatus;
  type?: ActivityType;
}

interface ActivitySummary {
  totalActivities: number;
  byType: Record<ActivityType, number>;
  byStatus: Record<ActivityStatus, number>;
  completionRate: number;
}

interface ApiResponse<T> {
  message?: string;
  activity?: T;
  activities?: T[];
  total?: number;
  error?: string;
  errors?: Array<{ msg: string; param: string }>;
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
// Error Handling
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<Activity>>;
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
// Activity CRUD Operations
// ============================================================================

/**
 * Create a new activity
 *
 * @param request - Activity creation request
 * @returns Created activity
 * @throws Error if creation fails
 */
async function createActivity(request: CreateActivityRequest): Promise<Activity> {
  try {
    console.log(`📝 Creating ${request.type} activity: ${request.subject}`);

    const response = await api.post<ApiResponse<Activity>>('/activities', {
      ...request,
      status: request.status || '計劃',
    });

    if (response.data.activity) {
      console.log(`✅ Activity created: #${response.data.activity.id}`);
      return response.data.activity;
    }

    throw new Error('No activity data in response');
  } catch (error) {
    handleError('Create activity', error);
  }
}

/**
 * Get all activities with optional filtering
 *
 * @param filters - Optional filters
 * @returns Array of activities
 * @throws Error if fetch fails
 */
async function getActivities(filters?: ActivityFilters): Promise<Activity[]> {
  try {
    console.log('🔍 Fetching activities...', filters ? JSON.stringify(filters) : '');

    const response = await api.get<ApiResponse<Activity>>('/activities', {
      params: filters,
    });

    if (response.data.activities) {
      console.log(`✅ Found ${response.data.total || 0} activities`);
      return response.data.activities;
    }

    return [];
  } catch (error) {
    handleError('Get activities', error);
  }
}

/**
 * Get a single activity by ID
 *
 * @param activityId - Activity ID
 * @returns Activity details
 * @throws Error if not found
 */
async function getActivityById(activityId: number): Promise<Activity> {
  try {
    console.log(`🔍 Fetching activity #${activityId}...`);

    const response = await api.get<Activity>(`/activities/${activityId}`);

    console.log('✅ Activity retrieved successfully');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Activity #${activityId} not found`);
    }
    handleError('Get activity', error);
  }
}

/**
 * Update an activity
 *
 * @param activityId - Activity ID
 * @param updates - Fields to update
 * @returns Updated activity
 * @throws Error if update fails
 */
async function updateActivity(
  activityId: number,
  updates: UpdateActivityRequest
): Promise<Activity> {
  try {
    console.log(`📝 Updating activity #${activityId}...`);

    const response = await api.put<ApiResponse<Activity>>(
      `/activities/${activityId}`,
      updates
    );

    if (response.data.activity) {
      console.log('✅ Activity updated successfully');
      return response.data.activity;
    }

    throw new Error('No activity data in response');
  } catch (error) {
    handleError('Update activity', error);
  }
}

/**
 * Mark an activity as completed
 *
 * @param activityId - Activity ID
 * @returns Updated activity
 * @throws Error if update fails
 */
async function completeActivity(activityId: number): Promise<Activity> {
  try {
    console.log(`✓ Marking activity #${activityId} as completed...`);

    const response = await api.patch<ApiResponse<Activity>>(
      `/activities/${activityId}/complete`
    );

    if (response.data.activity) {
      console.log('✅ Activity marked as completed');
      return response.data.activity;
    }

    throw new Error('No activity data in response');
  } catch (error) {
    handleError('Complete activity', error);
  }
}

/**
 * Delete an activity
 *
 * @param activityId - Activity ID
 * @throws Error if deletion fails
 */
async function deleteActivity(activityId: number): Promise<void> {
  try {
    console.log(`🗑️  Deleting activity #${activityId}...`);

    await api.delete(`/activities/${activityId}`);

    console.log('✅ Activity deleted successfully');
  } catch (error) {
    handleError('Delete activity', error);
  }
}

// ============================================================================
// Specialized Activity Operations
// ============================================================================

/**
 * Log a phone call activity
 *
 * @param customerId - Customer ID
 * @param subject - Call subject
 * @param description - Call notes
 * @param opportunityId - Optional opportunity ID
 * @returns Created activity
 */
async function logPhoneCall(
  customerId: number,
  subject: string,
  description: string,
  opportunityId?: number
): Promise<Activity> {
  console.log(`📞 Logging phone call with customer #${customerId}`);

  return await createActivity({
    customerId,
    opportunityId,
    type: '電話',
    subject,
    description,
    status: '完成',
  });
}

/**
 * Log an email activity
 *
 * @param customerId - Customer ID
 * @param subject - Email subject
 * @param description - Email content summary
 * @param opportunityId - Optional opportunity ID
 * @returns Created activity
 */
async function logEmail(
  customerId: number,
  subject: string,
  description: string,
  opportunityId?: number
): Promise<Activity> {
  console.log(`📧 Logging email to customer #${customerId}`);

  return await createActivity({
    customerId,
    opportunityId,
    type: '郵件',
    subject,
    description,
    status: '完成',
  });
}

/**
 * Schedule a meeting
 *
 * @param customerId - Customer ID
 * @param subject - Meeting subject
 * @param dueDate - Meeting date/time
 * @param description - Meeting agenda
 * @param opportunityId - Optional opportunity ID
 * @returns Created activity
 */
async function scheduleMeeting(
  customerId: number,
  subject: string,
  dueDate: string,
  description?: string,
  opportunityId?: number
): Promise<Activity> {
  console.log(`📅 Scheduling meeting with customer #${customerId}`);

  return await createActivity({
    customerId,
    opportunityId,
    type: '會議',
    subject,
    description,
    dueDate,
    status: '計劃',
  });
}

/**
 * Add a note to customer record
 *
 * @param customerId - Customer ID
 * @param subject - Note subject
 * @param description - Note content
 * @param opportunityId - Optional opportunity ID
 * @returns Created activity
 */
async function addNote(
  customerId: number,
  subject: string,
  description: string,
  opportunityId?: number
): Promise<Activity> {
  console.log(`📝 Adding note to customer #${customerId}`);

  return await createActivity({
    customerId,
    opportunityId,
    type: '備註',
    subject,
    description,
    status: '完成',
  });
}

// ============================================================================
// Activity Query and Analysis Functions
// ============================================================================

/**
 * Get all activities for a specific customer
 *
 * @param customerId - Customer ID
 * @returns Customer's activity history
 */
async function getCustomerActivities(customerId: number): Promise<Activity[]> {
  return await getActivities({ customerId });
}

/**
 * Get all activities for a specific opportunity
 *
 * @param opportunityId - Opportunity ID
 * @returns Opportunity's activities
 */
async function getOpportunityActivities(opportunityId: number): Promise<Activity[]> {
  return await getActivities({ opportunityId });
}

/**
 * Get pending activities (not completed)
 *
 * @returns Array of pending activities
 */
async function getPendingActivities(): Promise<Activity[]> {
  const allActivities = await getActivities();
  return allActivities.filter(a => a.status !== '完成' && a.status !== '取消');
}

/**
 * Get overdue activities
 *
 * @returns Array of overdue activities
 */
async function getOverdueActivities(): Promise<Activity[]> {
  const pending = await getPendingActivities();
  const now = new Date();

  return pending.filter(activity => {
    if (!activity.due_date) return false;
    const dueDate = new Date(activity.due_date);
    return dueDate < now;
  });
}

/**
 * Get activities by type
 *
 * @param type - Activity type
 * @returns Activities of that type
 */
async function getActivitiesByType(type: ActivityType): Promise<Activity[]> {
  return await getActivities({ type });
}

/**
 * Calculate activity summary statistics
 *
 * @param activities - Array of activities
 * @returns Activity summary
 */
function calculateActivitySummary(activities: Activity[]): ActivitySummary {
  const byType: Record<ActivityType, number> = {
    '電話': 0,
    '郵件': 0,
    '會議': 0,
    '備註': 0,
  };

  const byStatus: Record<ActivityStatus, number> = {
    '計劃': 0,
    '進行中': 0,
    '完成': 0,
    '取消': 0,
  };

  let completedCount = 0;

  activities.forEach(activity => {
    byType[activity.type]++;
    byStatus[activity.status]++;
    if (activity.status === '完成') {
      completedCount++;
    }
  });

  const completionRate = activities.length > 0
    ? (completedCount / activities.length) * 100
    : 0;

  return {
    totalActivities: activities.length,
    byType,
    byStatus,
    completionRate,
  };
}

/**
 * Display activity summary
 *
 * @param summary - Activity summary data
 */
function displayActivitySummary(summary: ActivitySummary): void {
  console.log('\n📊 Activity Summary');
  console.log('='.repeat(50));
  console.log(`Total Activities: ${summary.totalActivities}`);
  console.log(`Completion Rate: ${summary.completionRate.toFixed(1)}%`);

  console.log('\nBy Type:');
  Object.entries(summary.byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nBy Status:');
  Object.entries(summary.byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  console.log('='.repeat(50));
}

/**
 * Get customer engagement timeline
 *
 * @param customerId - Customer ID
 * @returns Chronological activity list
 */
async function getCustomerTimeline(customerId: number): Promise<Activity[]> {
  const activities = await getCustomerActivities(customerId);

  // Sort by creation date (most recent first)
  return activities.sort((a, b) => {
    const dateA = new Date(a.created_at || 0);
    const dateB = new Date(b.created_at || 0);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Display customer timeline
 *
 * @param activities - Customer activities
 */
function displayCustomerTimeline(activities: Activity[]): void {
  console.log('\n📅 Customer Engagement Timeline');
  console.log('='.repeat(70));

  activities.forEach(activity => {
    const date = activity.created_at
      ? new Date(activity.created_at).toLocaleDateString()
      : 'N/A';
    const status = activity.status === '完成' ? '✓' : '○';

    console.log(`${status} ${date} | ${activity.type.padEnd(6)} | ${activity.subject}`);
    if (activity.description) {
      console.log(`  → ${activity.description.substring(0, 60)}${activity.description.length > 60 ? '...' : ''}`);
    }
  });

  console.log('='.repeat(70));
}

// ============================================================================
// Example Usage Demonstrations
// ============================================================================

async function demonstrateContactHistory(): Promise<void> {
  console.log('\n🚀 Starting Contact History Demonstration\n');
  console.log('='.repeat(70));

  try {
    const customerId = 1; // Example customer ID

    // Example 1: Log a phone call
    console.log('\n📋 Example 1: Logging a phone call');
    console.log('-'.repeat(70));
    await logPhoneCall(
      customerId,
      'Initial Discovery Call',
      'Discussed customer requirements and pain points. Customer interested in enterprise solution.'
    );

    // Example 2: Log an email
    console.log('\n📋 Example 2: Logging an email');
    console.log('-'.repeat(70));
    await logEmail(
      customerId,
      'Follow-up: Product Information',
      'Sent detailed product brochure and pricing information as requested.'
    );

    // Example 3: Schedule a meeting
    console.log('\n📋 Example 3: Scheduling a meeting');
    console.log('-'.repeat(70));
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    await scheduleMeeting(
      customerId,
      'Product Demo',
      futureDate.toISOString(),
      'Demonstrate key features and answer technical questions'
    );

    // Example 4: Add a note
    console.log('\n📋 Example 4: Adding a customer note');
    console.log('-'.repeat(70));
    await addNote(
      customerId,
      'Budget Information',
      'Customer mentioned budget range of $50k-$75k for Q4'
    );

    // Example 5: Get customer activity history
    console.log('\n📋 Example 5: Retrieving customer activity history');
    console.log('-'.repeat(70));
    const customerActivities = await getCustomerActivities(customerId);
    console.log(`Found ${customerActivities.length} activities for customer #${customerId}`);

    // Example 6: Get pending activities
    console.log('\n📋 Example 6: Getting pending activities');
    console.log('-'.repeat(70));
    const pending = await getPendingActivities();
    console.log(`You have ${pending.length} pending activities`);

    // Example 7: Check for overdue activities
    console.log('\n📋 Example 7: Checking for overdue activities');
    console.log('-'.repeat(70));
    const overdue = await getOverdueActivities();
    if (overdue.length > 0) {
      console.log(`⚠️  Warning: ${overdue.length} overdue activities!`);
      overdue.forEach(activity => {
        console.log(`  - ${activity.subject} (Due: ${activity.due_date})`);
      });
    } else {
      console.log('✅ No overdue activities');
    }

    // Example 8: Get activities by type
    console.log('\n📋 Example 8: Getting activities by type');
    console.log('-'.repeat(70));
    const phoneCalls = await getActivitiesByType('電話');
    const meetings = await getActivitiesByType('會議');
    console.log(`Phone calls: ${phoneCalls.length}`);
    console.log(`Meetings: ${meetings.length}`);

    // Example 9: Calculate activity summary
    console.log('\n📋 Example 9: Generating activity summary');
    console.log('-'.repeat(70));
    const allActivities = await getActivities();
    const summary = calculateActivitySummary(allActivities);
    displayActivitySummary(summary);

    // Example 10: Display customer timeline
    console.log('\n📋 Example 10: Displaying customer engagement timeline');
    console.log('-'.repeat(70));
    const timeline = await getCustomerTimeline(customerId);
    displayCustomerTimeline(timeline);

    // Example 11: Complete an activity
    if (customerActivities.length > 0) {
      const firstActivity = customerActivities[0];
      if (firstActivity.id && firstActivity.status !== '完成') {
        console.log('\n📋 Example 11: Completing an activity');
        console.log('-'.repeat(70));
        await completeActivity(firstActivity.id);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ All contact history demonstrations completed successfully!');

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
  Activity,
  ActivityType,
  ActivityStatus,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityFilters,
  ActivitySummary,

  // CRUD operations
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  completeActivity,
  deleteActivity,

  // Specialized operations
  logPhoneCall,
  logEmail,
  scheduleMeeting,
  addNote,

  // Query functions
  getCustomerActivities,
  getOpportunityActivities,
  getPendingActivities,
  getOverdueActivities,
  getActivitiesByType,
  getCustomerTimeline,

  // Analysis
  calculateActivitySummary,
  displayActivitySummary,
  displayCustomerTimeline,
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateContactHistory();
}
