/**
 * Certificate Generation Example for Assessment Tools
 *
 * Demonstrates generating certificates of completion, digital badges,
 * verification, and credential management for educational achievements.
 */

// Types
interface Certificate {
  id: string;
  certificateNumber: string;
  type: 'completion' | 'achievement' | 'participation' | 'excellence';
  recipient: Recipient;
  course: CourseInfo;
  issuedBy: Organization;
  issuedAt: Date;
  expiresAt?: Date;
  grade?: string;
  score?: number;
  skills: string[];
  metadata: CertificateMetadata;
  verification: VerificationInfo;
  template: string;
  format: 'pdf' | 'png' | 'svg';
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  profileUrl?: string;
}

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  instructor: string;
  completedAt: Date;
  duration: number; // hours
  credits?: number;
}

interface Organization {
  name: string;
  logo: string;
  website: string;
  accreditation?: string;
  signatory: Signatory;
}

interface Signatory {
  name: string;
  title: string;
  signature: string; // URL or base64
}

interface CertificateMetadata {
  earnedPoints: number;
  lessonsCompleted: number;
  quizzesPassed: number;
  finalExamScore?: number;
  timeSpent: number; // hours
  achievements: string[];
}

interface VerificationInfo {
  verificationCode: string;
  verificationUrl: string;
  qrCode: string; // Base64 or URL
  blockchainHash?: string;
  isVerified: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  criteria: BadgeCriteria;
  earnedAt: Date;
  issuer: Organization;
  metadata: BadgeMetadata;
  sharingLinks: SharingLinks;
}

interface BadgeCriteria {
  type: 'course-completion' | 'skill-mastery' | 'achievement' | 'milestone';
  requirements: string[];
  minimumScore?: number;
  timeFrame?: string;
}

interface BadgeMetadata {
  color: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  points: number;
}

interface SharingLinks {
  linkedin: string;
  twitter: string;
  facebook: string;
  email: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  type: Certificate['type'];
  layout: 'portrait' | 'landscape';
  design: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    accentColor: string;
    fontFamily: string;
    backgroundImage?: string;
  };
  elements: TemplateElement[];
}

interface TemplateElement {
  type: 'text' | 'image' | 'qr-code' | 'signature' | 'seal';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content?: string;
  style?: Record<string, string>;
}

// Certificate Generation Service
class CertificateService {
  private certificates: Map<string, Certificate> = new Map();
  private badges: Map<string, Badge> = new Map();
  private templates: Map<string, CertificateTemplate> = new Map();
  private verificationRegistry: Map<string, Certificate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Generate certificate for course completion
   */
  async generateCertificate(data: {
    recipient: Recipient;
    course: CourseInfo;
    organization: Organization;
    grade?: string;
    score?: number;
    skills: string[];
    metadata: CertificateMetadata;
    templateId?: string;
  }): Promise<Certificate> {
    console.log(`📜 Generating certificate for ${data.recipient.name}...`);

    const certificateNumber = this.generateCertificateNumber();
    const verificationCode = this.generateVerificationCode();

    const certificate: Certificate = {
      id: this.generateId(),
      certificateNumber,
      type: this.determineCertificateType(data.score, data.metadata),
      recipient: data.recipient,
      course: data.course,
      issuedBy: data.organization,
      issuedAt: new Date(),
      grade: data.grade,
      score: data.score,
      skills: data.skills,
      metadata: data.metadata,
      verification: {
        verificationCode,
        verificationUrl: `https://verify.example.com/${verificationCode}`,
        qrCode: await this.generateQRCode(verificationCode),
        isVerified: true,
      },
      template: data.templateId || 'default',
      format: 'pdf',
    };

    // Set expiration for certain types
    if (certificate.type === 'achievement' && data.course.credits) {
      certificate.expiresAt = new Date();
      certificate.expiresAt.setFullYear(
        certificate.expiresAt.getFullYear() + 3
      );
    }

    this.certificates.set(certificate.id, certificate);
    this.verificationRegistry.set(verificationCode, certificate);

    console.log(`✅ Certificate generated: ${certificateNumber}`);
    console.log(`   Type: ${certificate.type}`);
    console.log(`   Verification: ${certificate.verification.verificationUrl}`);

    // Generate associated badges
    await this.generateAssociatedBadges(certificate);

    return certificate;
  }

  /**
   * Issue digital badge
   */
  async issueBadge(data: {
    recipient: Recipient;
    name: string;
    description: string;
    category: string;
    criteria: BadgeCriteria;
    metadata: BadgeMetadata;
    issuer: Organization;
  }): Promise<Badge> {
    console.log(`🎖️ Issuing badge: ${data.name}...`);

    const badge: Badge = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      imageUrl: await this.generateBadgeImage(data.name, data.metadata),
      category: data.category,
      criteria: data.criteria,
      earnedAt: new Date(),
      issuer: data.issuer,
      metadata: data.metadata,
      sharingLinks: this.generateSharingLinks(data.recipient, data.name),
    };

    this.badges.set(badge.id, badge);

    console.log(`✅ Badge issued: ${badge.name} (${badge.metadata.level})`);
    return badge;
  }

  /**
   * Verify certificate
   */
  verifyCertificate(
    verificationCode: string
  ): { valid: boolean; certificate?: Certificate; message: string } {
    const certificate = this.verificationRegistry.get(verificationCode);

    if (!certificate) {
      return {
        valid: false,
        message: 'Certificate not found',
      };
    }

    // Check expiration
    if (certificate.expiresAt && certificate.expiresAt < new Date()) {
      return {
        valid: false,
        certificate,
        message: 'Certificate has expired',
      };
    }

    // Check revocation (simplified)
    if (!certificate.verification.isVerified) {
      return {
        valid: false,
        certificate,
        message: 'Certificate has been revoked',
      };
    }

    return {
      valid: true,
      certificate,
      message: 'Certificate is valid',
    };
  }

  /**
   * Revoke certificate
   */
  revokeCertificate(certificateId: string, reason: string): void {
    const certificate = this.certificates.get(certificateId);

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    certificate.verification.isVerified = false;
    console.log(`❌ Certificate revoked: ${certificate.certificateNumber}`);
    console.log(`   Reason: ${reason}`);
  }

  /**
   * Export certificate to different formats
   */
  async exportCertificate(
    certificateId: string,
    format: 'pdf' | 'png' | 'svg' | 'json'
  ): Promise<string> {
    const certificate = this.certificates.get(certificateId);

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    console.log(`📤 Exporting certificate as ${format.toUpperCase()}...`);

    switch (format) {
      case 'pdf':
        return await this.generatePDF(certificate);
      case 'png':
        return await this.generatePNG(certificate);
      case 'svg':
        return await this.generateSVG(certificate);
      case 'json':
        return JSON.stringify(certificate, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Get recipient's certificates
   */
  getRecipientCertificates(recipientId: string): Certificate[] {
    return Array.from(this.certificates.values()).filter(
      c => c.recipient.id === recipientId
    );
  }

  /**
   * Get recipient's badges
   */
  getRecipientBadges(recipientId: string): Badge[] {
    return Array.from(this.badges.values()).filter(
      b => b.id.includes(recipientId) // Simplified
    );
  }

  /**
   * Generate certificate analytics
   */
  getCertificateAnalytics(courseId: string) {
    const courseCertificates = Array.from(this.certificates.values()).filter(
      c => c.course.id === courseId
    );

    const byType = courseCertificates.reduce((acc, cert) => {
      acc[cert.type] = (acc[cert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scores = courseCertificates
      .filter(c => c.score !== undefined)
      .map(c => c.score!);

    return {
      totalIssued: courseCertificates.length,
      byType,
      averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length || 0,
      topSkills: this.getTopSkills(courseCertificates),
      issuedThisMonth: courseCertificates.filter(
        c =>
          c.issuedAt.getMonth() === new Date().getMonth() &&
          c.issuedAt.getFullYear() === new Date().getFullYear()
      ).length,
    };
  }

  /**
   * Create custom template
   */
  createTemplate(template: Omit<CertificateTemplate, 'id'>): CertificateTemplate {
    const newTemplate: CertificateTemplate = {
      id: this.generateId(),
      ...template,
    };

    this.templates.set(newTemplate.id, newTemplate);
    console.log(`✅ Template created: ${newTemplate.name}`);
    return newTemplate;
  }

  /**
   * Generate blockchain-verified certificate
   */
  async generateBlockchainCertificate(
    certificate: Certificate
  ): Promise<string> {
    console.log('🔗 Generating blockchain hash...');

    // Simplified - in production would interact with actual blockchain
    const hash = this.generateBlockchainHash(certificate);
    certificate.verification.blockchainHash = hash;

    console.log(`✅ Blockchain hash: ${hash}`);
    return hash;
  }

  // Helper methods

  private determineCertificateType(
    score?: number,
    metadata?: CertificateMetadata
  ): Certificate['type'] {
    if (score !== undefined && score >= 95) {
      return 'excellence';
    }
    if (metadata?.finalExamScore && metadata.finalExamScore >= 90) {
      return 'achievement';
    }
    return 'completion';
  }

  private async generateAssociatedBadges(certificate: Certificate): Promise<void> {
    const organization = certificate.issuedBy;
    const recipient = certificate.recipient;

    // Course completion badge
    await this.issueBadge({
      recipient,
      name: `${certificate.course.title} - Completed`,
      description: `Successfully completed ${certificate.course.title}`,
      category: 'course-completion',
      criteria: {
        type: 'course-completion',
        requirements: ['Complete all lessons', 'Pass all assessments'],
      },
      metadata: {
        color: '#4CAF50',
        level: 'bronze',
        rarity: 'common',
        points: 100,
      },
      issuer: organization,
    });

    // Excellence badge if high score
    if (certificate.score && certificate.score >= 95) {
      await this.issueBadge({
        recipient,
        name: 'Excellence Award',
        description: 'Achieved excellence with 95%+ score',
        category: 'achievement',
        criteria: {
          type: 'achievement',
          requirements: ['Score 95% or higher'],
          minimumScore: 95,
        },
        metadata: {
          color: '#FFD700',
          level: 'gold',
          rarity: 'rare',
          points: 500,
        },
        issuer: organization,
      });
    }

    // Skill badges
    for (const skill of certificate.skills.slice(0, 3)) {
      await this.issueBadge({
        recipient,
        name: `${skill} Proficiency`,
        description: `Demonstrated proficiency in ${skill}`,
        category: 'skill-mastery',
        criteria: {
          type: 'skill-mastery',
          requirements: [`Master ${skill} concepts`],
        },
        metadata: {
          color: '#2196F3',
          level: 'silver',
          rarity: 'uncommon',
          points: 200,
        },
        issuer: organization,
      });
    }
  }

  private async generateQRCode(data: string): Promise<string> {
    // Simplified - in production would use actual QR code library
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }

  private async generateBadgeImage(
    name: string,
    metadata: BadgeMetadata
  ): Promise<string> {
    // Simplified - in production would generate actual badge image
    return `https://badges.example.com/${name.toLowerCase().replace(/\s+/g, '-')}.png`;
  }

  private generateSharingLinks(recipient: Recipient, badgeName: string): SharingLinks {
    const encodedName = encodeURIComponent(badgeName);
    const encodedRecipient = encodeURIComponent(recipient.name);

    return {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=https://badges.example.com/${recipient.id}`,
      twitter: `https://twitter.com/intent/tweet?text=I%20earned%20the%20${encodedName}%20badge!`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=https://badges.example.com/${recipient.id}`,
      email: `mailto:?subject=${encodedRecipient}%20earned%20${encodedName}&body=Check%20out%20my%20badge!`,
    };
  }

  private async generatePDF(certificate: Certificate): Promise<string> {
    console.log('   Generating PDF...');
    return `certificate-${certificate.certificateNumber}.pdf`;
  }

  private async generatePNG(certificate: Certificate): Promise<string> {
    console.log('   Generating PNG...');
    return `certificate-${certificate.certificateNumber}.png`;
  }

  private async generateSVG(certificate: Certificate): Promise<string> {
    console.log('   Generating SVG...');
    return `<svg><!-- Certificate SVG --></svg>`;
  }

  private getTopSkills(certificates: Certificate[]): string[] {
    const skillCounts = new Map<string, number>();

    certificates.forEach(cert => {
      cert.skills.forEach(skill => {
        skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
      });
    });

    return Array.from(skillCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill]) => skill);
  }

  private generateCertificateNumber(): string {
    const prefix = 'CERT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  private generateBlockchainHash(certificate: Certificate): string {
    // Simplified - in production would use actual blockchain
    const data = JSON.stringify(certificate);
    return `0x${Math.random().toString(16).substring(2, 66)}`;
  }

  private initializeTemplates(): void {
    this.templates.set('default', {
      id: 'default',
      name: 'Classic Certificate',
      type: 'completion',
      layout: 'landscape',
      design: {
        backgroundColor: '#FFFFFF',
        borderColor: '#1E3A8A',
        textColor: '#1F2937',
        accentColor: '#3B82F6',
        fontFamily: 'Georgia, serif',
      },
      elements: [],
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example Usage
async function demonstrateCertificateGeneration() {
  console.log('=== Certificate Generation Example ===\n');

  const service = new CertificateService();

  // Organization info
  const organization: Organization = {
    name: 'Tech Academy',
    logo: 'https://academy.example.com/logo.png',
    website: 'https://academy.example.com',
    accreditation: 'Accredited by Tech Education Board',
    signatory: {
      name: 'Dr. Jane Smith',
      title: 'Director of Education',
      signature: 'https://academy.example.com/signatures/jane-smith.png',
    },
  };

  // Recipient info
  const recipient: Recipient = {
    id: 'student-001',
    name: 'John Doe',
    email: 'john.doe@email.com',
    profileUrl: 'https://academy.example.com/students/john-doe',
  };

  // Course info
  const course: CourseInfo = {
    id: 'course-webdev',
    title: 'Full Stack Web Development',
    description: 'Comprehensive web development bootcamp',
    instructor: 'Prof. Sarah Johnson',
    completedAt: new Date(),
    duration: 120,
    credits: 12,
  };

  // Generate certificate
  console.log('📜 Generating course completion certificate...\n');

  const certificate = await service.generateCertificate({
    recipient,
    course,
    organization,
    grade: 'A',
    score: 96,
    skills: [
      'JavaScript',
      'React',
      'Node.js',
      'MongoDB',
      'RESTful APIs',
    ],
    metadata: {
      earnedPoints: 9600,
      lessonsCompleted: 45,
      quizzesPassed: 15,
      finalExamScore: 96,
      timeSpent: 120,
      achievements: [
        'Perfect Quiz Scores',
        '30-day Learning Streak',
        'All Projects Completed',
      ],
    },
  });

  // Verify certificate
  console.log('\n🔍 Verifying certificate...');
  const verification = service.verifyCertificate(
    certificate.verification.verificationCode
  );
  console.log(`   Status: ${verification.valid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`   Message: ${verification.message}`);

  // Export certificate
  console.log('\n📤 Exporting certificate...');
  await service.exportCertificate(certificate.id, 'pdf');
  await service.exportCertificate(certificate.id, 'png');

  // Generate blockchain verification
  console.log('\n🔗 Adding blockchain verification...');
  await service.generateBlockchainCertificate(certificate);

  // Get recipient's achievements
  console.log('\n🏆 Recipient Achievements:');
  const certificates = service.getRecipientCertificates(recipient.id);
  const badges = service.getRecipientBadges(recipient.id);

  console.log(`   Certificates: ${certificates.length}`);
  console.log(`   Badges: ${badges.length}`);

  console.log('\n🎖️ Earned Badges:');
  badges.forEach(badge => {
    console.log(
      `   - ${badge.name} (${badge.metadata.level}) - ${badge.metadata.points} points`
    );
  });

  // Course analytics
  console.log('\n📊 Course Certificate Analytics:');
  const analytics = service.getCertificateAnalytics(course.id);
  console.log(`   Total Issued: ${analytics.totalIssued}`);
  console.log(`   Average Score: ${analytics.averageScore.toFixed(2)}%`);
  console.log(`   Issued This Month: ${analytics.issuedThisMonth}`);
  console.log(`   Top Skills: ${analytics.topSkills.join(', ')}`);

  // Create custom template
  console.log('\n🎨 Creating custom certificate template...');
  service.createTemplate({
    name: 'Modern Certificate',
    type: 'achievement',
    layout: 'portrait',
    design: {
      backgroundColor: '#F3F4F6',
      borderColor: '#6366F1',
      textColor: '#111827',
      accentColor: '#8B5CF6',
      fontFamily: 'Inter, sans-serif',
      backgroundImage: 'https://templates.example.com/modern-bg.svg',
    },
    elements: [],
  });

  console.log('\n✅ Certificate generation demonstration complete!');
}

// Run the example
demonstrateCertificateGeneration().catch(console.error);
