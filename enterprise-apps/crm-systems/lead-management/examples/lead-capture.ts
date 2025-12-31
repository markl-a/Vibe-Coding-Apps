/**
 * Lead Capture and Qualification Examples
 *
 * This file demonstrates how to capture leads from various sources and
 * qualify them in the Lead Management system. It includes examples of
 * creating leads, updating their information, and managing lead sources.
 */

import axios, { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

type LeadStatus =
  | 'new'         // New lead
  | 'contacted'   // Contacted
  | 'qualified'   // Qualified
  | 'unqualified' // Unqualified
  | 'converted'   // Converted to customer
  | 'lost';       // Lost

type LeadRating =
  | 'hot'   // Hot lead
  | 'warm'  // Warm lead
  | 'cold'; // Cold lead

type LeadSource =
  | 'website'  // Website form
  | 'email'    // Email inquiry
  | 'phone'    // Phone call
  | 'referral' // Referral
  | 'social'   // Social media
  | 'event'    // Event/conference
  | 'other';   // Other source

interface Lead {
  id?: number;
  first_name: string;
  last_name: string;
  company?: string;
  job_title?: string;
  email: string;
  phone?: string;
  source: LeadSource;
  score?: number;
  status: LeadStatus;
  rating: LeadRating;
  assigned_to?: number;
  industry?: string;
  company_size?: string;
  budget?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_contacted?: string;
}

interface CreateLeadRequest {
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  job_title?: string;
  phone?: string;
  source: LeadSource;
  industry?: string;
  company_size?: string;
  budget?: number;
  notes?: string;
}

interface UpdateLeadRequest {
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  phone?: string;
  source?: LeadSource;
  status?: LeadStatus;
  rating?: LeadRating;
  assigned_to?: number;
  industry?: string;
  company_size?: string;
  budget?: number;
  notes?: string;
}

interface LeadFilters {
  status?: LeadStatus;
  rating?: LeadRating;
  source?: LeadSource;
  assigned_to?: number;
}

interface ApiResponse<T = Lead> {
  id?: number;
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
  detail?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token-here';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Token ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================================================
// Error Handling
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
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
// Lead Capture Operations
// ============================================================================

/**
 * Create a new lead from website form submission
 *
 * @param leadData - Lead information from form
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function captureWebsiteLead(leadData: Omit<CreateLeadRequest, 'source'>): Promise<Lead> {
  try {
    console.log(`📝 Capturing website lead: ${leadData.email}`);

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'website',
      status: 'new',
      rating: 'cold',
    });

    console.log(`✅ Lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture website lead', error);
  }
}

/**
 * Create a new lead from email inquiry
 *
 * @param leadData - Lead information from email
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function captureEmailLead(leadData: Omit<CreateLeadRequest, 'source'>): Promise<Lead> {
  try {
    console.log(`📧 Capturing email lead: ${leadData.email}`);

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'email',
      status: 'new',
      rating: 'warm',
    });

    console.log(`✅ Lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture email lead', error);
  }
}

/**
 * Create a new lead from phone call
 *
 * @param leadData - Lead information from call
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function capturePhoneLead(leadData: Omit<CreateLeadRequest, 'source'>): Promise<Lead> {
  try {
    console.log(`📞 Capturing phone lead: ${leadData.first_name} ${leadData.last_name}`);

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'phone',
      status: 'contacted',
      rating: 'warm',
    });

    console.log(`✅ Lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture phone lead', error);
  }
}

/**
 * Create a new lead from referral
 *
 * @param leadData - Lead information from referral
 * @param referrerNotes - Notes about who referred this lead
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function captureReferralLead(
  leadData: Omit<CreateLeadRequest, 'source'>,
  referrerNotes: string
): Promise<Lead> {
  try {
    console.log(`🤝 Capturing referral lead: ${leadData.email}`);

    const notes = `Referral: ${referrerNotes}\n${leadData.notes || ''}`;

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'referral',
      status: 'new',
      rating: 'hot', // Referrals are typically higher quality
      notes,
    });

    console.log(`✅ Referral lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture referral lead', error);
  }
}

/**
 * Create a new lead from event or conference
 *
 * @param leadData - Lead information from event
 * @param eventName - Name of the event
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function captureEventLead(
  leadData: Omit<CreateLeadRequest, 'source'>,
  eventName: string
): Promise<Lead> {
  try {
    console.log(`🎪 Capturing event lead from ${eventName}: ${leadData.email}`);

    const notes = `Met at: ${eventName}\n${leadData.notes || ''}`;

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'event',
      status: 'contacted',
      rating: 'warm',
      notes,
    });

    console.log(`✅ Event lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture event lead', error);
  }
}

/**
 * Create a new lead from social media inquiry
 *
 * @param leadData - Lead information from social media
 * @param platform - Social media platform (e.g., LinkedIn, Twitter)
 * @returns Created lead object
 * @throws Error if creation fails
 */
async function captureSocialLead(
  leadData: Omit<CreateLeadRequest, 'source'>,
  platform: string
): Promise<Lead> {
  try {
    console.log(`💬 Capturing social media lead from ${platform}: ${leadData.email}`);

    const notes = `Platform: ${platform}\n${leadData.notes || ''}`;

    const response = await api.post<Lead>('/leads/', {
      ...leadData,
      source: 'social',
      status: 'new',
      rating: 'cold',
      notes,
    });

    console.log(`✅ Social lead captured successfully: #${response.data.id}`);
    return response.data;
  } catch (error) {
    handleError('Capture social lead', error);
  }
}

// ============================================================================
// Lead Retrieval Operations
// ============================================================================

/**
 * Get all leads with optional filtering
 *
 * @param filters - Optional filters
 * @returns Array of leads
 * @throws Error if fetch fails
 */
async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  try {
    console.log('🔍 Fetching leads...', filters ? JSON.stringify(filters) : '');

    const response = await api.get<ApiResponse<Lead>>('/leads/', {
      params: filters,
    });

    const leads = response.data.results || [];
    console.log(`✅ Found ${leads.length} leads`);
    return leads;
  } catch (error) {
    handleError('Get leads', error);
  }
}

/**
 * Get a single lead by ID
 *
 * @param leadId - Lead ID
 * @returns Lead details
 * @throws Error if not found
 */
async function getLeadById(leadId: number): Promise<Lead> {
  try {
    console.log(`🔍 Fetching lead #${leadId}...`);

    const response = await api.get<Lead>(`/leads/${leadId}/`);

    console.log('✅ Lead retrieved successfully');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Lead #${leadId} not found`);
    }
    handleError('Get lead', error);
  }
}

/**
 * Update a lead
 *
 * @param leadId - Lead ID
 * @param updates - Fields to update
 * @returns Updated lead
 * @throws Error if update fails
 */
async function updateLead(leadId: number, updates: UpdateLeadRequest): Promise<Lead> {
  try {
    console.log(`📝 Updating lead #${leadId}...`);

    const response = await api.patch<Lead>(`/leads/${leadId}/`, updates);

    console.log('✅ Lead updated successfully');
    return response.data;
  } catch (error) {
    handleError('Update lead', error);
  }
}

// ============================================================================
// Lead Qualification Operations
// ============================================================================

/**
 * Mark lead as contacted
 *
 * @param leadId - Lead ID
 * @param contactNotes - Notes from the contact
 * @returns Updated lead
 */
async function markAsContacted(leadId: number, contactNotes?: string): Promise<Lead> {
  console.log(`📞 Marking lead #${leadId} as contacted`);

  const updates: UpdateLeadRequest = {
    status: 'contacted',
  };

  if (contactNotes) {
    const current = await getLeadById(leadId);
    updates.notes = `Contact: ${contactNotes}\n${current.notes || ''}`;
  }

  return await updateLead(leadId, updates);
}

/**
 * Qualify a lead
 *
 * @param leadId - Lead ID
 * @param qualificationNotes - Qualification notes
 * @returns Updated lead
 */
async function qualifyLead(leadId: number, qualificationNotes?: string): Promise<Lead> {
  console.log(`✅ Qualifying lead #${leadId}`);

  const updates: UpdateLeadRequest = {
    status: 'qualified',
    rating: 'hot',
  };

  if (qualificationNotes) {
    const current = await getLeadById(leadId);
    updates.notes = `Qualified: ${qualificationNotes}\n${current.notes || ''}`;
  }

  return await updateLead(leadId, updates);
}

/**
 * Disqualify a lead
 *
 * @param leadId - Lead ID
 * @param reason - Reason for disqualification
 * @returns Updated lead
 */
async function disqualifyLead(leadId: number, reason: string): Promise<Lead> {
  console.log(`❌ Disqualifying lead #${leadId}`);

  const current = await getLeadById(leadId);
  const notes = `Disqualified: ${reason}\n${current.notes || ''}`;

  return await updateLead(leadId, {
    status: 'unqualified',
    rating: 'cold',
    notes,
  });
}

/**
 * Assign lead to a sales rep
 *
 * @param leadId - Lead ID
 * @param userId - User ID to assign to
 * @returns Updated lead
 */
async function assignLead(leadId: number, userId: number): Promise<Lead> {
  console.log(`👤 Assigning lead #${leadId} to user #${userId}`);

  return await updateLead(leadId, {
    assigned_to: userId,
  });
}

/**
 * Update lead rating based on engagement
 *
 * @param leadId - Lead ID
 * @param newRating - New rating
 * @returns Updated lead
 */
async function updateLeadRating(leadId: number, newRating: LeadRating): Promise<Lead> {
  console.log(`⭐ Updating lead #${leadId} rating to: ${newRating}`);

  return await updateLead(leadId, {
    rating: newRating,
  });
}

// ============================================================================
// Lead Query Operations
// ============================================================================

/**
 * Get new leads that haven't been contacted
 *
 * @returns Array of new leads
 */
async function getNewLeads(): Promise<Lead[]> {
  return await getLeads({ status: 'new' });
}

/**
 * Get qualified leads ready for conversion
 *
 * @returns Array of qualified leads
 */
async function getQualifiedLeads(): Promise<Lead[]> {
  return await getLeads({ status: 'qualified' });
}

/**
 * Get hot leads requiring immediate attention
 *
 * @returns Array of hot leads
 */
async function getHotLeads(): Promise<Lead[]> {
  return await getLeads({ rating: 'hot' });
}

/**
 * Get leads by source
 *
 * @param source - Lead source
 * @returns Leads from that source
 */
async function getLeadsBySource(source: LeadSource): Promise<Lead[]> {
  return await getLeads({ source });
}

/**
 * Get leads assigned to a specific user
 *
 * @param userId - User ID
 * @returns User's assigned leads
 */
async function getAssignedLeads(userId: number): Promise<Lead[]> {
  return await getLeads({ assigned_to: userId });
}

// ============================================================================
// Example Usage Demonstrations
// ============================================================================

async function demonstrateLeadCapture(): Promise<void> {
  console.log('\n🚀 Starting Lead Capture Demonstration\n');
  console.log('='.repeat(70));

  try {
    // Example 1: Capture website lead
    console.log('\n📋 Example 1: Capturing lead from website form');
    console.log('-'.repeat(70));
    const websiteLead = await captureWebsiteLead({
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@techcorp.com',
      company: 'TechCorp Inc',
      job_title: 'IT Director',
      phone: '+1-555-1234',
      industry: 'Technology',
      company_size: '100-500',
      budget: 25000,
      notes: 'Interested in enterprise plan',
    });

    // Example 2: Capture email inquiry
    console.log('\n📋 Example 2: Capturing lead from email inquiry');
    console.log('-'.repeat(70));
    await captureEmailLead({
      first_name: 'Michael',
      last_name: 'Chen',
      email: 'michael.chen@startup.io',
      company: 'Startup.io',
      job_title: 'CEO',
      industry: 'Software',
      notes: 'Wants pricing information for 20 users',
    });

    // Example 3: Capture phone call lead
    console.log('\n📋 Example 3: Capturing lead from phone call');
    console.log('-'.repeat(70));
    await capturePhoneLead({
      first_name: 'Emily',
      last_name: 'Rodriguez',
      email: 'emily.r@manufacturing.com',
      company: 'Rodriguez Manufacturing',
      phone: '+1-555-5678',
      industry: 'Manufacturing',
      company_size: '500-1000',
      notes: 'Called to inquire about inventory management features',
    });

    // Example 4: Capture referral lead
    console.log('\n📋 Example 4: Capturing referral lead');
    console.log('-'.repeat(70));
    await captureReferralLead(
      {
        first_name: 'David',
        last_name: 'Kim',
        email: 'dkim@finance.com',
        company: 'Kim Financial Services',
        job_title: 'CFO',
        industry: 'Finance',
      },
      'Referred by John Smith at Acme Corp - existing customer'
    );

    // Example 5: Capture event lead
    console.log('\n📋 Example 5: Capturing lead from conference');
    console.log('-'.repeat(70));
    await captureEventLead(
      {
        first_name: 'Lisa',
        last_name: 'Anderson',
        email: 'lisa@healthtech.com',
        company: 'HealthTech Solutions',
        job_title: 'VP of Operations',
        phone: '+1-555-9012',
        industry: 'Healthcare',
      },
      'TechConf 2024'
    );

    // Example 6: Capture social media lead
    console.log('\n📋 Example 6: Capturing lead from social media');
    console.log('-'.repeat(70));
    await captureSocialLead(
      {
        first_name: 'James',
        last_name: 'Wilson',
        email: 'jwilson@retail.com',
        company: 'Wilson Retail Chain',
        industry: 'Retail',
      },
      'LinkedIn'
    );

    // Example 7: Mark lead as contacted
    if (websiteLead.id) {
      console.log('\n📋 Example 7: Marking lead as contacted');
      console.log('-'.repeat(70));
      await markAsContacted(
        websiteLead.id,
        'Had initial call, customer is interested in scheduling a demo'
      );
    }

    // Example 8: Qualify a lead
    if (websiteLead.id) {
      console.log('\n📋 Example 8: Qualifying a lead');
      console.log('-'.repeat(70));
      await qualifyLead(
        websiteLead.id,
        'Budget confirmed, decision maker identified, timeline is Q4 2024'
      );
    }

    // Example 9: Assign lead to sales rep
    if (websiteLead.id) {
      console.log('\n📋 Example 9: Assigning lead to sales rep');
      console.log('-'.repeat(70));
      await assignLead(websiteLead.id, 1);
    }

    // Example 10: Get new leads
    console.log('\n📋 Example 10: Fetching new leads');
    console.log('-'.repeat(70));
    const newLeads = await getNewLeads();
    console.log(`Found ${newLeads.length} new leads requiring attention`);

    // Example 11: Get qualified leads
    console.log('\n📋 Example 11: Fetching qualified leads');
    console.log('-'.repeat(70));
    const qualifiedLeads = await getQualifiedLeads();
    console.log(`Found ${qualifiedLeads.length} qualified leads ready for conversion`);

    // Example 12: Get hot leads
    console.log('\n📋 Example 12: Fetching hot leads');
    console.log('-'.repeat(70));
    const hotLeads = await getHotLeads();
    console.log(`Found ${hotLeads.length} hot leads requiring immediate attention`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ All lead capture demonstrations completed successfully!');

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
  Lead,
  LeadStatus,
  LeadRating,
  LeadSource,
  CreateLeadRequest,
  UpdateLeadRequest,
  LeadFilters,

  // Capture operations
  captureWebsiteLead,
  captureEmailLead,
  capturePhoneLead,
  captureReferralLead,
  captureEventLead,
  captureSocialLead,

  // CRUD operations
  getLeads,
  getLeadById,
  updateLead,

  // Qualification operations
  markAsContacted,
  qualifyLead,
  disqualifyLead,
  assignLead,
  updateLeadRating,

  // Query operations
  getNewLeads,
  getQualifiedLeads,
  getHotLeads,
  getLeadsBySource,
  getAssignedLeads,
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateLeadCapture();
}
