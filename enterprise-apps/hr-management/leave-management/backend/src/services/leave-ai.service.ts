import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI 請假分析服務
 */
export class LeaveAIService {
  /**
   * 智能審批建議
   */
  async getApprovalRecommendation(leaveRequestId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    // 獲取員工的請假歷史
    const employeeLeaveHistory = await prisma.leaveRequest.findMany({
      where: {
        employeeId: leaveRequest.employeeId,
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 獲取同期請假情況（檢查衝突）
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { not: leaveRequest.employeeId },
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: leaveRequest.startDate } },
              { endDate: { gte: leaveRequest.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: leaveRequest.endDate } },
              { endDate: { gte: leaveRequest.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: leaveRequest.startDate } },
              { endDate: { lte: leaveRequest.endDate } },
            ],
          },
        ],
      },
    });

    // 計算分數
    let approvalScore = 50; // 基礎分數
    const factors = [];
    const risks = [];

    // 1. 請假歷史分析
    const approvedCount = employeeLeaveHistory.filter((l) => l.status === 'APPROVED').length;
    const totalHistoryCount = employeeLeaveHistory.length;

    if (totalHistoryCount > 0) {
      const approvalRate = approvedCount / totalHistoryCount;
      approvalScore += approvalRate * 10;
      factors.push({
        factor: '歷史審批率',
        impact: approvalRate > 0.8 ? 'POSITIVE' : approvalRate < 0.5 ? 'NEGATIVE' : 'NEUTRAL',
        description: `過去審批率為 ${Math.round(approvalRate * 100)}%`,
      });
    }

    // 2. 請假類型分析
    const urgentTypes = ['SICK', 'EMERGENCY'];
    if (urgentTypes.includes(leaveRequest.leaveType)) {
      approvalScore += 15;
      factors.push({
        factor: '請假類型',
        impact: 'POSITIVE',
        description: `${leaveRequest.leaveType} 類型通常需要優先處理`,
      });
    }

    // 3. 請假天數分析
    const days = leaveRequest.days;
    if (days > 7) {
      approvalScore -= 10;
      risks.push({
        type: 'LONG_DURATION',
        severity: 'MEDIUM',
        message: `請假天數較長 (${days}天)，可能影響工作安排`,
      });
    } else if (days <= 3) {
      approvalScore += 5;
      factors.push({
        factor: '請假天數',
        impact: 'POSITIVE',
        description: '請假天數較短，對工作影響較小',
      });
    }

    // 4. 團隊衝突分析
    if (overlappingLeaves.length > 0) {
      const conflictImpact = Math.min(overlappingLeaves.length * 10, 20);
      approvalScore -= conflictImpact;
      risks.push({
        type: 'TEAM_OVERLAP',
        severity: overlappingLeaves.length > 2 ? 'HIGH' : 'MEDIUM',
        message: `同期有 ${overlappingLeaves.length} 名其他員工請假`,
        affectedEmployees: overlappingLeaves.length,
      });
    }

    // 5. 提前申請時間分析
    const daysInAdvance = Math.floor(
      (new Date(leaveRequest.startDate).getTime() - new Date(leaveRequest.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysInAdvance >= 7) {
      approvalScore += 10;
      factors.push({
        factor: '提前申請',
        impact: 'POSITIVE',
        description: `提前 ${daysInAdvance} 天申請，有充足時間安排`,
      });
    } else if (daysInAdvance < 2) {
      approvalScore -= 5;
      risks.push({
        type: 'SHORT_NOTICE',
        severity: 'LOW',
        message: '申請時間較倉促，可能影響工作交接',
      });
    }

    // 6. 頻率分析
    const recentLeaves = employeeLeaveHistory.filter((l) => {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 3);
      return new Date(l.createdAt) > monthsAgo;
    });

    if (recentLeaves.length > 5) {
      approvalScore -= 10;
      risks.push({
        type: 'FREQUENT_LEAVE',
        severity: 'MEDIUM',
        message: `最近3個月已請假 ${recentLeaves.length} 次，頻率較高`,
      });
    }

    // 確保分數在0-100之間
    approvalScore = Math.max(0, Math.min(100, approvalScore));

    // 判斷推薦結果
    let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
    if (approvalScore >= 70) {
      recommendation = 'APPROVE';
    } else if (approvalScore >= 40) {
      recommendation = 'REVIEW';
    } else {
      recommendation = 'REJECT';
    }

    // 生成建議理由
    const reasons = this.generateReasons(recommendation, factors, risks);

    // 生成條件建議
    const conditions = this.generateConditions(risks, leaveRequest);

    return {
      leaveRequestId,
      employeeId: leaveRequest.employeeId,
      leaveType: leaveRequest.leaveType,
      days: leaveRequest.days,
      approvalScore,
      recommendation,
      confidence: approvalScore > 80 || approvalScore < 20 ? 'HIGH' : approvalScore > 60 || approvalScore < 40 ? 'MEDIUM' : 'LOW',
      factors,
      risks,
      reasons,
      conditions,
      overlappingLeaves: overlappingLeaves.length,
      analysisDate: new Date().toISOString(),
    };
  }

  /**
   * 分析員工請假模式
   */
  async analyzeLeavePattern(employeeId: string) {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: ['APPROVED', 'REJECTED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (leaves.length === 0) {
      return {
        employeeId,
        message: '無足夠的請假記錄',
        pattern: null,
      };
    }

    // 按類型統計
    const typeStats = new Map<string, number>();
    leaves.forEach((leave) => {
      typeStats.set(leave.leaveType, (typeStats.get(leave.leaveType) || 0) + 1);
    });

    const mostCommonType = Array.from(typeStats.entries()).sort((a, b) => b[1] - a[1])[0];

    // 按月份統計
    const monthStats = new Map<number, number>();
    leaves.forEach((leave) => {
      const month = new Date(leave.startDate).getMonth();
      monthStats.set(month, (monthStats.get(month) || 0) + 1);
    });

    const peakMonth = Array.from(monthStats.entries()).sort((a, b) => b[1] - a[1])[0];

    // 計算平均請假天數
    const avgDays =
      leaves.reduce((sum, leave) => sum + leave.days, 0) / leaves.length;

    // 審批率
    const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
    const approvalRate = approvedCount / leaves.length;

    // 識別模式
    const patterns = [];

    if (mostCommonType[1] > leaves.length * 0.4) {
      patterns.push({
        type: 'TYPE_PREFERENCE',
        description: `最常請 ${mostCommonType[0]} 假，佔 ${Math.round((mostCommonType[1] / leaves.length) * 100)}%`,
      });
    }

    if (peakMonth && peakMonth[1] > 3) {
      patterns.push({
        type: 'SEASONAL_PATTERN',
        description: `${peakMonth[0] + 1} 月請假較頻繁（${peakMonth[1]} 次）`,
      });
    }

    if (avgDays < 2) {
      patterns.push({
        type: 'SHORT_LEAVE_PATTERN',
        description: '偏好短期請假（平均 < 2天）',
      });
    } else if (avgDays > 5) {
      patterns.push({
        type: 'LONG_LEAVE_PATTERN',
        description: '偏好長期請假（平均 > 5天）',
      });
    }

    return {
      employeeId,
      totalLeaves: leaves.length,
      approvalRate: Math.round(approvalRate * 100),
      avgDays: Math.round(avgDays * 10) / 10,
      mostCommonType: mostCommonType[0],
      peakMonth: peakMonth ? peakMonth[0] + 1 : null,
      typeDistribution: Array.from(typeStats.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / leaves.length) * 100),
      })),
      patterns,
      insights: this.generatePatternInsights(patterns, approvalRate, avgDays),
    };
  }

  /**
   * 團隊請假分析
   */
  async analyzeTeamLeave(departmentId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      status: { in: ['PENDING', 'APPROVED'] },
    };

    if (startDate && endDate) {
      where.OR = [
        {
          AND: [{ startDate: { lte: startDate } }, { endDate: { gte: startDate } }],
        },
        {
          AND: [{ startDate: { lte: endDate } }, { endDate: { gte: endDate } }],
        },
        {
          AND: [{ startDate: { gte: startDate } }, { endDate: { lte: endDate } }],
        },
      ];
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    // 按日期統計
    const dateMap = new Map<string, number>();
    leaves.forEach((leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });

    // 找出衝突最嚴重的日期
    const peakDates = Array.from(dateMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([date, count]) => ({
        date,
        employeeCount: count,
        severity: count > 5 ? 'HIGH' : count > 3 ? 'MEDIUM' : 'LOW',
      }));

    // 按類型統計
    const typeStats = new Map<string, number>();
    leaves.forEach((leave) => {
      typeStats.set(leave.leaveType, (typeStats.get(leave.leaveType) || 0) + 1);
    });

    return {
      period: startDate && endDate ? `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}` : 'All',
      totalLeaves: leaves.length,
      uniqueEmployees: new Set(leaves.map((l) => l.employeeId)).size,
      peakDates,
      typeDistribution: Array.from(typeStats.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / leaves.length) * 100),
      })),
      warnings: this.generateTeamWarnings(peakDates, leaves.length),
    };
  }

  /**
   * 生成推薦理由
   */
  private generateReasons(
    recommendation: string,
    factors: any[],
    risks: any[]
  ): string[] {
    const reasons = [];

    if (recommendation === 'APPROVE') {
      reasons.push('綜合評估分數較高，建議批准');
      const positiveFactors = factors.filter((f) => f.impact === 'POSITIVE');
      if (positiveFactors.length > 0) {
        reasons.push(`有 ${positiveFactors.length} 個正面因素支持批准`);
      }
      if (risks.length === 0) {
        reasons.push('未發現明顯風險因素');
      }
    } else if (recommendation === 'REVIEW') {
      reasons.push('建議進一步審查');
      if (risks.length > 0) {
        reasons.push(`存在 ${risks.length} 個需要關注的風險因素`);
      }
      reasons.push('建議與員工溝通確認詳細情況');
    } else {
      reasons.push('綜合評估分數較低，建議拒絕或重新安排');
      if (risks.length > 0) {
        reasons.push(`發現 ${risks.length} 個高風險因素`);
      }
    }

    return reasons;
  }

  /**
   * 生成條件建議
   */
  private generateConditions(risks: any[], leaveRequest: any): string[] {
    const conditions = [];

    risks.forEach((risk) => {
      switch (risk.type) {
        case 'TEAM_OVERLAP':
          conditions.push('確認其他團隊成員可以覆蓋工作');
          conditions.push('安排工作交接');
          break;
        case 'LONG_DURATION':
          conditions.push('要求提供詳細的工作交接計劃');
          conditions.push('確定緊急聯絡方式');
          break;
        case 'SHORT_NOTICE':
          conditions.push('確認是否為緊急情況');
          conditions.push('評估對當前項目的影響');
          break;
        case 'FREQUENT_LEAVE':
          conditions.push('了解頻繁請假的原因');
          conditions.push('必要時提供員工支持');
          break;
      }
    });

    if (conditions.length === 0) {
      conditions.push('無特殊條件');
    }

    return conditions;
  }

  /**
   * 生成模式洞察
   */
  private generatePatternInsights(patterns: any[], approvalRate: number, avgDays: number): string[] {
    const insights = [];

    if (approvalRate > 90) {
      insights.push('請假記錄良好，審批率高');
    } else if (approvalRate < 70) {
      insights.push('審批率較低，建議了解原因');
    }

    if (avgDays < 2) {
      insights.push('多為短期請假，對工作影響較小');
    } else if (avgDays > 5) {
      insights.push('平均請假天數較長，需注意工作安排');
    }

    patterns.forEach((pattern) => {
      if (pattern.type === 'SEASONAL_PATTERN') {
        insights.push('存在季節性請假模式，可提前規劃');
      }
    });

    return insights;
  }

  /**
   * 生成團隊警告
   */
  private generateTeamWarnings(peakDates: any[], totalLeaves: number): string[] {
    const warnings = [];

    const highSeverityDates = peakDates.filter((d) => d.severity === 'HIGH');
    if (highSeverityDates.length > 0) {
      warnings.push(
        `發現 ${highSeverityDates.length} 個高風險日期，多名員工同時請假`
      );
      warnings.push('建議協調請假時間，確保團隊正常運作');
    }

    if (totalLeaves > 20) {
      warnings.push('團隊請假總數較多，注意人力資源調配');
    }

    if (warnings.length === 0) {
      warnings.push('團隊請假安排合理');
    }

    return warnings;
  }
}

export const leaveAIService = new LeaveAIService();
