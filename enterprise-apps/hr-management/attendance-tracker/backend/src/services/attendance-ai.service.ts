import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AttendancePattern {
  dayOfWeek: number;
  avgCheckInTime: string;
  avgCheckOutTime: string;
  frequency: number;
}

/**
 * AI 考勤分析服務
 */
export class AttendanceAIService {
  /**
   * 檢測考勤異常
   */
  async detectAnomalies(employeeId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    const anomalies = [];

    // 1. 檢測遲到模式
    const lateRecords = records.filter((r) => r.status === 'LATE');
    if (lateRecords.length > records.length * 0.3) {
      anomalies.push({
        type: 'FREQUENT_LATE',
        severity: 'HIGH',
        count: lateRecords.length,
        percentage: Math.round((lateRecords.length / records.length) * 100),
        message: `過去${days}天內，遲到次數佔 ${Math.round((lateRecords.length / records.length) * 100)}%`,
        recommendation: '建議與員工溝通，了解遲到原因並提供支持',
      });
    }

    // 2. 檢測早退模式
    const earlyLeaveRecords = records.filter((r) => r.status === 'EARLY_LEAVE');
    if (earlyLeaveRecords.length > records.length * 0.2) {
      anomalies.push({
        type: 'FREQUENT_EARLY_LEAVE',
        severity: 'MEDIUM',
        count: earlyLeaveRecords.length,
        percentage: Math.round((earlyLeaveRecords.length / records.length) * 100),
        message: `過去${days}天內，早退次數佔 ${Math.round((earlyLeaveRecords.length / records.length) * 100)}%`,
        recommendation: '建議了解員工是否有特殊情況需要彈性工時',
      });
    }

    // 3. 檢測缺勤
    const absentRecords = records.filter((r) => r.status === 'ABSENT');
    if (absentRecords.length > 3) {
      anomalies.push({
        type: 'FREQUENT_ABSENT',
        severity: 'HIGH',
        count: absentRecords.length,
        message: `過去${days}天內，缺勤 ${absentRecords.length} 次`,
        recommendation: '建議確認是否有健康或個人問題，提供必要支持',
      });
    }

    // 4. 檢測連續異常
    let consecutiveAnomalies = 0;
    let maxConsecutive = 0;
    for (const record of records) {
      if (['LATE', 'EARLY_LEAVE', 'ABSENT'].includes(record.status)) {
        consecutiveAnomalies++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveAnomalies);
      } else {
        consecutiveAnomalies = 0;
      }
    }

    if (maxConsecutive >= 3) {
      anomalies.push({
        type: 'CONSECUTIVE_ISSUES',
        severity: 'HIGH',
        count: maxConsecutive,
        message: `發現連續 ${maxConsecutive} 天的考勤異常`,
        recommendation: '建議立即與員工面談，了解情況',
      });
    }

    // 5. 加班分析
    const overtimeRecords = records.filter((r) => Number(r.overtimeHours) > 0);
    const avgOvertime =
      overtimeRecords.reduce((sum, r) => sum + Number(r.overtimeHours), 0) /
      overtimeRecords.length;

    if (avgOvertime > 2 && overtimeRecords.length > records.length * 0.5) {
      anomalies.push({
        type: 'EXCESSIVE_OVERTIME',
        severity: 'MEDIUM',
        avgHours: Math.round(avgOvertime * 10) / 10,
        frequency: overtimeRecords.length,
        message: `平均加班時數 ${Math.round(avgOvertime * 10) / 10} 小時，頻率較高`,
        recommendation: '建議評估工作量，考慮調整任務分配或增加人力',
      });
    }

    return {
      employeeId,
      period: `過去${days}天`,
      totalRecords: records.length,
      anomalyCount: anomalies.length,
      anomalies,
      summary: {
        lateCount: lateRecords.length,
        earlyLeaveCount: earlyLeaveRecords.length,
        absentCount: absentRecords.length,
        overtimeCount: overtimeRecords.length,
        presentRate: Math.round(
          ((records.length - absentRecords.length) / records.length) * 100
        ),
      },
    };
  }

  /**
   * 預測員工出勤
   */
  async predictAttendance(employeeId: string) {
    const records = await prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 90, // 最近90天
    });

    if (records.length < 30) {
      return {
        prediction: 'INSUFFICIENT_DATA',
        message: '數據不足，需要至少30天的考勤記錄',
      };
    }

    // 計算出勤率
    const presentRecords = records.filter((r) =>
      ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(r.status)
    );
    const attendanceRate = presentRecords.length / records.length;

    // 計算準時率
    const onTimeRecords = records.filter((r) => r.status === 'PRESENT');
    const punctualityRate = onTimeRecords.length / records.length;

    // 分析工作日模式
    const workdayPatterns = this.analyzeWorkdayPatterns(records);

    // 預測未來7天的出勤情況
    const predictions = [];
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();

      // 週末通常不上班
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue;
      }

      const pattern = workdayPatterns.find((p) => p.dayOfWeek === dayOfWeek);
      const probability = pattern ? pattern.frequency / records.length : attendanceRate;

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        dayOfWeek: this.getDayName(dayOfWeek),
        attendanceProbability: Math.round(probability * 100),
        expectedCheckIn: pattern?.avgCheckInTime || '09:00',
        expectedCheckOut: pattern?.avgCheckOutTime || '18:00',
        confidence: records.length > 60 ? 'HIGH' : records.length > 30 ? 'MEDIUM' : 'LOW',
      });
    }

    // 風險評估
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (attendanceRate < 0.8 || punctualityRate < 0.7) {
      riskLevel = 'HIGH';
    } else if (attendanceRate < 0.9 || punctualityRate < 0.85) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      employeeId,
      analysisDate: new Date().toISOString(),
      dataPoints: records.length,
      metrics: {
        attendanceRate: Math.round(attendanceRate * 100),
        punctualityRate: Math.round(punctualityRate * 100),
        avgWorkHours: this.calculateAvgWorkHours(records),
      },
      riskLevel,
      predictions,
      recommendations: this.generateAttendanceRecommendations(
        attendanceRate,
        punctualityRate,
        riskLevel
      ),
    };
  }

  /**
   * 團隊考勤分析
   */
  async analyzeTeamAttendance(departmentId?: string, period: string = '30') {
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      date: {
        gte: startDate,
      },
    };

    // 如果指定部門，需要先獲取該部門的員工
    let employeeIds: string[] | undefined;
    if (departmentId) {
      // 這裡應該從 employee 表查詢，但由於跨數據庫，暫時跳過
      // 實際應用中需要實現跨服務查詢
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    if (records.length === 0) {
      return {
        message: '指定期間內沒有考勤數據',
        stats: null,
      };
    }

    // 按員工分組
    const employeeMap = new Map<string, any[]>();
    records.forEach((record) => {
      if (!employeeMap.has(record.employeeId)) {
        employeeMap.set(record.employeeId, []);
      }
      employeeMap.get(record.employeeId)!.push(record);
    });

    // 計算團隊指標
    const employeeStats = Array.from(employeeMap.entries()).map(([empId, empRecords]) => {
      const present = empRecords.filter((r) =>
        ['PRESENT', 'LATE', 'EARLY_LEAVE'].includes(r.status)
      ).length;
      const onTime = empRecords.filter((r) => r.status === 'PRESENT').length;
      const late = empRecords.filter((r) => r.status === 'LATE').length;
      const absent = empRecords.filter((r) => r.status === 'ABSENT').length;

      return {
        employeeId: empId,
        recordCount: empRecords.length,
        presentCount: present,
        attendanceRate: Math.round((present / empRecords.length) * 100),
        punctualityRate: Math.round((onTime / empRecords.length) * 100),
        lateCount: late,
        absentCount: absent,
      };
    });

    // 團隊整體指標
    const teamAttendanceRate =
      employeeStats.reduce((sum, s) => sum + s.attendanceRate, 0) / employeeStats.length;
    const teamPunctualityRate =
      employeeStats.reduce((sum, s) => sum + s.punctualityRate, 0) / employeeStats.length;

    // 識別問題員工（出勤率或準時率低於75%）
    const concernEmployees = employeeStats.filter(
      (s) => s.attendanceRate < 75 || s.punctualityRate < 75
    );

    // 時間分佈分析
    const hourDistribution = this.analyzeHourDistribution(records);

    return {
      period: `過去${days}天`,
      teamSize: employeeStats.length,
      totalRecords: records.length,
      teamMetrics: {
        avgAttendanceRate: Math.round(teamAttendanceRate),
        avgPunctualityRate: Math.round(teamPunctualityRate),
        concernEmployeeCount: concernEmployees.length,
      },
      employeeStats: employeeStats.sort((a, b) => a.attendanceRate - b.attendanceRate),
      concernEmployees,
      hourDistribution,
      insights: this.generateTeamInsights(
        teamAttendanceRate,
        teamPunctualityRate,
        concernEmployees.length,
        employeeStats.length
      ),
    };
  }

  /**
   * 分析工作日模式
   */
  private analyzeWorkdayPatterns(records: any[]): AttendancePattern[] {
    const patterns = new Map<number, { checkIns: number[]; checkOuts: number[]; count: number }>();

    records.forEach((record) => {
      const dayOfWeek = new Date(record.date).getDay();
      if (!patterns.has(dayOfWeek)) {
        patterns.set(dayOfWeek, { checkIns: [], checkOuts: [], count: 0 });
      }

      const pattern = patterns.get(dayOfWeek)!;
      pattern.count++;

      if (record.checkIn) {
        const hour = new Date(record.checkIn).getHours() + new Date(record.checkIn).getMinutes() / 60;
        pattern.checkIns.push(hour);
      }

      if (record.checkOut) {
        const hour = new Date(record.checkOut).getHours() + new Date(record.checkOut).getMinutes() / 60;
        pattern.checkOuts.push(hour);
      }
    });

    return Array.from(patterns.entries()).map(([day, data]) => ({
      dayOfWeek: day,
      avgCheckInTime: this.formatHour(
        data.checkIns.reduce((a, b) => a + b, 0) / data.checkIns.length
      ),
      avgCheckOutTime: this.formatHour(
        data.checkOuts.reduce((a, b) => a + b, 0) / data.checkOuts.length
      ),
      frequency: data.count,
    }));
  }

  /**
   * 計算平均工時
   */
  private calculateAvgWorkHours(records: any[]): number {
    const workHours = records.map((r) => Number(r.workHours)).filter((h) => h > 0);
    const avg = workHours.reduce((a, b) => a + b, 0) / workHours.length;
    return Math.round(avg * 10) / 10;
  }

  /**
   * 分析打卡時間分佈
   */
  private analyzeHourDistribution(records: any[]) {
    const checkInHours = new Map<number, number>();
    const checkOutHours = new Map<number, number>();

    records.forEach((record) => {
      if (record.checkIn) {
        const hour = new Date(record.checkIn).getHours();
        checkInHours.set(hour, (checkInHours.get(hour) || 0) + 1);
      }

      if (record.checkOut) {
        const hour = new Date(record.checkOut).getHours();
        checkOutHours.set(hour, (checkOutHours.get(hour) || 0) + 1);
      }
    });

    return {
      peakCheckInHour: this.findPeakHour(checkInHours),
      peakCheckOutHour: this.findPeakHour(checkOutHours),
    };
  }

  /**
   * 找出最高峰時段
   */
  private findPeakHour(hourMap: Map<number, number>): string {
    let maxHour = 0;
    let maxCount = 0;

    hourMap.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    });

    return `${String(maxHour).padStart(2, '0')}:00`;
  }

  /**
   * 格式化小時
   */
  private formatHour(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * 獲取星期名稱
   */
  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  /**
   * 生成出勤建議
   */
  private generateAttendanceRecommendations(
    attendanceRate: number,
    punctualityRate: number,
    riskLevel: string
  ): string[] {
    const recommendations = [];

    if (attendanceRate < 0.8) {
      recommendations.push('出勤率較低，建議了解員工是否有健康或其他問題');
      recommendations.push('考慮實施彈性工時或遠程工作選項');
    }

    if (punctualityRate < 0.85) {
      recommendations.push('準時率需要改善，建議與員工溝通上班時間安排');
      recommendations.push('可考慮調整工作開始時間以適應員工需求');
    }

    if (riskLevel === 'HIGH') {
      recommendations.push('考勤風險較高，建議安排面談了解情況');
      recommendations.push('制定改善計劃並定期跟進');
    }

    if (attendanceRate > 0.95 && punctualityRate > 0.95) {
      recommendations.push('出勤表現優秀，可考慮給予表彰');
      recommendations.push('維持良好的工作習慣');
    }

    return recommendations;
  }

  /**
   * 生成團隊洞察
   */
  private generateTeamInsights(
    teamAttendanceRate: number,
    teamPunctualityRate: number,
    concernCount: number,
    teamSize: number
  ): string[] {
    const insights = [];

    if (teamAttendanceRate > 90) {
      insights.push('團隊整體出勤率良好');
    } else if (teamAttendanceRate < 80) {
      insights.push('團隊出勤率偏低，需要關注');
    }

    if (teamPunctualityRate < 85) {
      insights.push('團隊準時率有待提升，可能需要檢視工作時間政策');
    }

    if (concernCount > teamSize * 0.2) {
      insights.push(`有 ${concernCount} 名員工需要特別關注（佔團隊 ${Math.round((concernCount / teamSize) * 100)}%）`);
      insights.push('建議進行一對一面談，了解問題根源');
    }

    if (concernCount === 0) {
      insights.push('團隊所有成員表現良好');
    }

    return insights;
  }
}

export const attendanceAIService = new AttendanceAIService();
