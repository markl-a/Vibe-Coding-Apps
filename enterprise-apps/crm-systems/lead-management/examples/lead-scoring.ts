/**
 * Lead Scoring Examples
 *
 * This file demonstrates how to implement and use lead scoring in the
 * Lead Management system. It includes examples of calculating lead scores,
 * updating scores based on various criteria, and prioritizing leads.
 */

import axios, { AxiosError } from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

type LeadRating = 'hot' | 'warm' | 'cold';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'lost';
type LeadSource = 'website' | 'email' | 'phone' | 'referral' | 'social' | 'event' | 'other';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  job_title?: string;
  phone?: string;
  source: LeadSource;
  score: number;
  status: LeadStatus;
  rating: LeadRating;
  industry?: string;
  company_size?: string;
  budget?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
}

interface ScoringCriteria {
  // Demographic scoring
  industryMatch?: number;
  companySizeMatch?: number;
  jobTitleSeniority?: number;

  // Behavioral scoring
  websiteVisits?: number;
  emailOpens?: number;
  emailClicks?: number;
  contentDownloads?: number;
  formSubmissions?: number;

  // Engagement scoring
  responseTime?: number;
  meetingAttendance?: number;
  demoRequested?: boolean;

  // Firmographic scoring
  budgetQualified?: boolean;
  decisionMaker?: boolean;
  timelineDefined?: boolean;
}

interface ScoreBreakdown {
  demographicScore: number;
  behavioralScore: number;
  engagementScore: number;
  firmographicScore: number;
  totalScore: number;
}

interface ScoringWeights {
  demographic: number;
  behavioral: number;
  engagement: number;
  firmographic: number;
}

interface ApiResponse<T = Lead> {
  results?: T[];
  count?: number;
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

// Default scoring weights (total should be 100)
const DEFAULT_WEIGHTS: ScoringWeights = {
  demographic: 25,
  behavioral: 30,
  engagement: 25,
  firmographic: 20,
};

// ============================================================================
// Scoring Calculation Functions
// ============================================================================

/**
 * Calculate demographic score based on ideal customer profile
 *
 * @param criteria - Scoring criteria
 * @returns Demographic score (0-100)
 */
function calculateDemographicScore(criteria: ScoringCriteria): number {
  let score = 0;

  // Industry match (0-40 points)
  score += criteria.industryMatch || 0;

  // Company size match (0-30 points)
  score += criteria.companySizeMatch || 0;

  // Job title seniority (0-30 points)
  score += criteria.jobTitleSeniority || 0;

  return Math.min(score, 100);
}

/**
 * Calculate behavioral score based on digital engagement
 *
 * @param criteria - Scoring criteria
 * @returns Behavioral score (0-100)
 */
function calculateBehavioralScore(criteria: ScoringCriteria): number {
  let score = 0;

  // Website visits (2 points each, max 20)
  score += Math.min((criteria.websiteVisits || 0) * 2, 20);

  // Email opens (3 points each, max 15)
  score += Math.min((criteria.emailOpens || 0) * 3, 15);

  // Email clicks (5 points each, max 25)
  score += Math.min((criteria.emailClicks || 0) * 5, 25);

  // Content downloads (10 points each, max 30)
  score += Math.min((criteria.contentDownloads || 0) * 10, 30);

  // Form submissions (10 points each, max 10)
  score += Math.min((criteria.formSubmissions || 0) * 10, 10);

  return Math.min(score, 100);
}

/**
 * Calculate engagement score based on direct interactions
 *
 * @param criteria - Scoring criteria
 * @returns Engagement score (0-100)
 */
function calculateEngagementScore(criteria: ScoringCriteria): number {
  let score = 0;

  // Fast response time (0-30 points)
  // < 1 hour = 30, < 4 hours = 20, < 24 hours = 10, else 0
  if (criteria.responseTime !== undefined) {
    if (criteria.responseTime < 1) score += 30;
    else if (criteria.responseTime < 4) score += 20;
    else if (criteria.responseTime < 24) score += 10;
  }

  // Meeting attendance (20 points each, max 40)
  score += Math.min((criteria.meetingAttendance || 0) * 20, 40);

  // Demo requested (30 points)
  if (criteria.demoRequested) score += 30;

  return Math.min(score, 100);
}

/**
 * Calculate firmographic score based on sales qualification
 *
 * @param criteria - Scoring criteria
 * @returns Firmographic score (0-100)
 */
function calculateFirmographicScore(criteria: ScoringCriteria): number {
  let score = 0;

  // Budget qualified (40 points)
  if (criteria.budgetQualified) score += 40;

  // Decision maker (40 points)
  if (criteria.decisionMaker) score += 40;

  // Timeline defined (20 points)
  if (criteria.timelineDefined) score += 20;

  return Math.min(score, 100);
}

/**
 * Calculate total lead score with breakdown
 *
 * @param criteria - Scoring criteria
 * @param weights - Optional custom weights
 * @returns Score breakdown and total
 */
function calculateLeadScore(
  criteria: ScoringCriteria,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const demographicScore = calculateDemographicScore(criteria);
  const behavioralScore = calculateBehavioralScore(criteria);
  const engagementScore = calculateEngagementScore(criteria);
  const firmographicScore = calculateFirmographicScore(criteria);

  // Calculate weighted total
  const totalScore = Math.round(
    (demographicScore * weights.demographic / 100) +
    (behavioralScore * weights.behavioral / 100) +
    (engagementScore * weights.engagement / 100) +
    (firmographicScore * weights.firmographic / 100)
  );

  return {
    demographicScore,
    behavioralScore,
    engagementScore,
    firmographicScore,
    totalScore: Math.min(totalScore, 100),
  };
}

/**
 * Determine lead rating based on score
 *
 * @param score - Lead score (0-100)
 * @returns Lead rating
 */
function getLeadRatingFromScore(score: number): LeadRating {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

// ============================================================================
// API Operations
// ============================================================================

/**
 * Get lead by ID
 *
 * @param leadId - Lead ID
 * @returns Lead details
 */
async function getLeadById(leadId: number): Promise<Lead> {
  try {
    const response = await api.get<Lead>(`/leads/${leadId}/`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error(`Lead #${leadId} not found`);
    }
    throw error;
  }
}

/**
 * Update lead score
 *
 * @param leadId - Lead ID
 * @param score - New score
 * @param rating - Optional new rating
 * @returns Updated lead
 */
async function updateLeadScore(
  leadId: number,
  score: number,
  rating?: LeadRating
): Promise<Lead> {
  try {
    console.log(`📊 Updating lead #${leadId} score to ${score}`);

    const updates: Partial<Lead> = { score };

    // Auto-assign rating if not provided
    if (!rating) {
      rating = getLeadRatingFromScore(score);
    }
    updates.rating = rating;

    const response = await api.patch<Lead>(`/leads/${leadId}/`, updates);

    console.log(`✅ Score updated: ${score} (Rating: ${rating})`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update lead score:', error);
    throw error;
  }
}

/**
 * Score a lead based on criteria
 *
 * @param leadId - Lead ID
 * @param criteria - Scoring criteria
 * @param weights - Optional custom weights
 * @returns Updated lead with new score
 */
async function scoreLeadByCriteria(
  leadId: number,
  criteria: ScoringCriteria,
  weights?: ScoringWeights
): Promise<{ lead: Lead; breakdown: ScoreBreakdown }> {
  console.log(`🔢 Calculating score for lead #${leadId}...`);

  const breakdown = calculateLeadScore(criteria, weights);

  console.log('\nScore Breakdown:');
  console.log(`  Demographic: ${breakdown.demographicScore}/100`);
  console.log(`  Behavioral:  ${breakdown.behavioralScore}/100`);
  console.log(`  Engagement:  ${breakdown.engagementScore}/100`);
  console.log(`  Firmographic: ${breakdown.firmographicScore}/100`);
  console.log(`  TOTAL:       ${breakdown.totalScore}/100`);

  const lead = await updateLeadScore(leadId, breakdown.totalScore);

  return { lead, breakdown };
}

/**
 * Get all leads and sort by score
 *
 * @returns Leads sorted by score (highest first)
 */
async function getLeadsByScore(): Promise<Lead[]> {
  try {
    console.log('🔍 Fetching leads sorted by score...');

    const response = await api.get<ApiResponse<Lead>>('/leads/', {
      params: {
        ordering: '-score', // Django REST framework ordering
      },
    });

    const leads = response.data.results || [];
    console.log(`✅ Found ${leads.length} leads`);
    return leads;
  } catch (error) {
    console.error('❌ Failed to fetch leads:', error);
    throw error;
  }
}

/**
 * Get high-scoring leads (score >= threshold)
 *
 * @param threshold - Minimum score (default: 70)
 * @returns High-scoring leads
 */
async function getHighScoringLeads(threshold: number = 70): Promise<Lead[]> {
  const allLeads = await getLeadsByScore();
  return allLeads.filter(lead => lead.score >= threshold);
}

/**
 * Batch score multiple leads
 *
 * @param leadScoring - Map of lead IDs to their criteria
 * @returns Array of updated leads
 */
async function batchScoreLeads(
  leadScoring: Map<number, ScoringCriteria>
): Promise<Lead[]> {
  console.log(`📊 Batch scoring ${leadScoring.size} leads...`);

  const results: Lead[] = [];

  for (const [leadId, criteria] of leadScoring.entries()) {
    const { lead } = await scoreLeadByCriteria(leadId, criteria);
    results.push(lead);
  }

  console.log(`✅ Batch scoring completed for ${results.length} leads`);
  return results;
}

// ============================================================================
// Scoring Utilities
// ============================================================================

/**
 * Display score breakdown in formatted table
 *
 * @param breakdown - Score breakdown
 */
function displayScoreBreakdown(breakdown: ScoreBreakdown): void {
  console.log('\n' + '='.repeat(50));
  console.log('Lead Score Breakdown');
  console.log('='.repeat(50));
  console.log(`Demographic Score:  ${breakdown.demographicScore.toString().padStart(3)}/100`);
  console.log(`Behavioral Score:   ${breakdown.behavioralScore.toString().padStart(3)}/100`);
  console.log(`Engagement Score:   ${breakdown.engagementScore.toString().padStart(3)}/100`);
  console.log(`Firmographic Score: ${breakdown.firmographicScore.toString().padStart(3)}/100`);
  console.log('-'.repeat(50));
  console.log(`TOTAL SCORE:        ${breakdown.totalScore.toString().padStart(3)}/100`);
  console.log(`Rating:             ${getLeadRatingFromScore(breakdown.totalScore).toUpperCase()}`);
  console.log('='.repeat(50));
}

/**
 * Get scoring recommendations based on current score
 *
 * @param breakdown - Current score breakdown
 * @returns Array of recommendations
 */
function getScoringRecommendations(breakdown: ScoreBreakdown): string[] {
  const recommendations: string[] = [];

  if (breakdown.demographicScore < 50) {
    recommendations.push('Consider if this lead matches your ideal customer profile');
  }

  if (breakdown.behavioralScore < 40) {
    recommendations.push('Increase engagement with targeted content and emails');
  }

  if (breakdown.engagementScore < 40) {
    recommendations.push('Schedule a meeting or demo to increase direct engagement');
  }

  if (breakdown.firmographicScore < 60) {
    recommendations.push('Qualify budget, authority, need, and timeline (BANT)');
  }

  if (breakdown.totalScore >= 70) {
    recommendations.push('HOT LEAD! Prioritize immediate follow-up');
  } else if (breakdown.totalScore >= 40) {
    recommendations.push('Warm lead - continue nurturing with regular touchpoints');
  } else {
    recommendations.push('Cold lead - add to drip campaign for long-term nurturing');
  }

  return recommendations;
}

// ============================================================================
// Example Usage Demonstrations
// ============================================================================

async function demonstrateLeadScoring(): Promise<void> {
  console.log('\n🚀 Starting Lead Scoring Demonstration\n');
  console.log('='.repeat(70));

  try {
    // Example 1: Score a high-quality lead
    console.log('\n📋 Example 1: Scoring a high-quality lead');
    console.log('-'.repeat(70));

    const highQualityCriteria: ScoringCriteria = {
      // Demographic
      industryMatch: 40,          // Perfect industry match
      companySizeMatch: 30,       // Ideal company size
      jobTitleSeniority: 30,      // C-level executive

      // Behavioral
      websiteVisits: 10,          // 10 visits = 20 points
      emailOpens: 5,              // 5 opens = 15 points
      emailClicks: 3,             // 3 clicks = 15 points
      contentDownloads: 2,        // 2 downloads = 20 points

      // Engagement
      responseTime: 0.5,          // Responded within 30 minutes
      meetingAttendance: 2,       // Attended 2 meetings
      demoRequested: true,        // Requested demo

      // Firmographic
      budgetQualified: true,      // Has budget
      decisionMaker: true,        // Is decision maker
      timelineDefined: true,      // Has clear timeline
    };

    const highQualityScore = calculateLeadScore(highQualityCriteria);
    displayScoreBreakdown(highQualityScore);

    const recommendations = getScoringRecommendations(highQualityScore);
    console.log('\n💡 Recommendations:');
    recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });

    // Example 2: Score a medium-quality lead
    console.log('\n📋 Example 2: Scoring a medium-quality lead');
    console.log('-'.repeat(70));

    const mediumQualityCriteria: ScoringCriteria = {
      // Demographic
      industryMatch: 25,
      companySizeMatch: 20,
      jobTitleSeniority: 15,

      // Behavioral
      websiteVisits: 3,
      emailOpens: 2,
      emailClicks: 1,
      contentDownloads: 1,

      // Engagement
      responseTime: 12,
      meetingAttendance: 0,
      demoRequested: false,

      // Firmographic
      budgetQualified: false,
      decisionMaker: false,
      timelineDefined: true,
    };

    const mediumQualityScore = calculateLeadScore(mediumQualityCriteria);
    displayScoreBreakdown(mediumQualityScore);

    // Example 3: Score a low-quality lead
    console.log('\n📋 Example 3: Scoring a low-quality lead');
    console.log('-'.repeat(70));

    const lowQualityCriteria: ScoringCriteria = {
      // Demographic
      industryMatch: 10,
      companySizeMatch: 5,
      jobTitleSeniority: 5,

      // Behavioral
      websiteVisits: 1,
      emailOpens: 0,
      emailClicks: 0,
      contentDownloads: 0,

      // Engagement
      responseTime: 72,
      meetingAttendance: 0,
      demoRequested: false,

      // Firmographic
      budgetQualified: false,
      decisionMaker: false,
      timelineDefined: false,
    };

    const lowQualityScore = calculateLeadScore(lowQualityCriteria);
    displayScoreBreakdown(lowQualityScore);

    // Example 4: Update a lead's score via API (uncomment if lead exists)
    // console.log('\n📋 Example 4: Updating lead score via API');
    // console.log('-'.repeat(70));
    // const updatedLead = await scoreLeadByCriteria(1, highQualityCriteria);
    // console.log(`Lead #${updatedLead.lead.id} updated successfully`);

    // Example 5: Custom scoring weights
    console.log('\n📋 Example 5: Using custom scoring weights');
    console.log('-'.repeat(70));

    const customWeights: ScoringWeights = {
      demographic: 40,  // Emphasize fit
      behavioral: 20,
      engagement: 20,
      firmographic: 20,
    };

    const customScore = calculateLeadScore(highQualityCriteria, customWeights);
    console.log('With custom weights (40% demographic):');
    displayScoreBreakdown(customScore);

    // Example 6: Rating from score
    console.log('\n📋 Example 6: Determining rating from score');
    console.log('-'.repeat(70));
    const scores = [85, 65, 45, 25];
    scores.forEach(score => {
      const rating = getLeadRatingFromScore(score);
      console.log(`Score ${score} → Rating: ${rating.toUpperCase()}`);
    });

    // Example 7: Get scoring recommendations
    console.log('\n📋 Example 7: Getting recommendations for improvement');
    console.log('-'.repeat(70));
    const improvementRecs = getScoringRecommendations(mediumQualityScore);
    console.log('Recommendations for medium-quality lead:');
    improvementRecs.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ All lead scoring demonstrations completed successfully!');

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
  LeadRating,
  ScoringCriteria,
  ScoreBreakdown,
  ScoringWeights,

  // Scoring calculation
  calculateDemographicScore,
  calculateBehavioralScore,
  calculateEngagementScore,
  calculateFirmographicScore,
  calculateLeadScore,
  getLeadRatingFromScore,

  // API operations
  getLeadById,
  updateLeadScore,
  scoreLeadByCriteria,
  getLeadsByScore,
  getHighScoringLeads,
  batchScoreLeads,

  // Utilities
  displayScoreBreakdown,
  getScoringRecommendations,

  // Constants
  DEFAULT_WEIGHTS,
};

// Run demonstration if executed directly
if (require.main === module) {
  demonstrateLeadScoring();
}
