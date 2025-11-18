import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SalaryBenchmark {
  position: string;
  industry: string;
  min: number;
  median: number;
  max: number;
  percentile25: number;
  percentile75: number;
}

/**
 * AI 薪資分析服務
 */
export class PayrollAIService {
  /**
   * 檢測薪資異常
   */
  async detectSalaryAnomalies(period: string) {
    const payrolls = await prisma.payroll.findMany({
      where: { period },
    });

    if (payrolls.length === 0) {
      return { anomalies: [], summary: null };
    }

    // 計算統計數據
    const salaries = payrolls.map((p) => Number(p.netSalary));
    const mean = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const variance =
      salaries.reduce((sum, salary) => sum + Math.pow(salary - mean, 2), 0) / salaries.length;
    const stdDev = Math.sqrt(variance);

    // 識別異常（超過2個標準差）
    const anomalies = [];
    for (const payroll of payrolls) {
      const salary = Number(payroll.netSalary);
      const zScore = Math.abs((salary - mean) / stdDev);

      if (zScore > 2) {
        anomalies.push({
          payrollId: payroll.id,
          employeeId: payroll.employeeId,
          salary,
          zScore: Math.round(zScore * 100) / 100,
          deviation: Math.round((salary - mean) * 100) / 100,
          type: salary > mean ? 'HIGH' : 'LOW',
          severity: zScore > 3 ? 'CRITICAL' : 'WARNING',
          recommendation:
            salary > mean
              ? '薪資明顯高於平均值，建議檢查是否有計算錯誤或特殊獎金'
              : '薪資明顯低於平均值，建議確認是否為兼職或新員工',
        });
      }
    }

    return {
      anomalies,
      summary: {
        totalEmployees: payrolls.length,
        averageSalary: Math.round(mean),
        stdDeviation: Math.round(stdDev),
        min: Math.min(...salaries),
        max: Math.max(...salaries),
        anomalyCount: anomalies.length,
        anomalyRate: Math.round((anomalies.length / payrolls.length) * 100),
      },
    };
  }

  /**
   * 薪資趨勢分析
   */
  async analyzeSalaryTrends(employeeId: string) {
    const payrolls = await prisma.payroll.findMany({
      where: { employeeId },
      orderBy: { period: 'asc' },
      take: 12, // 最近12個月
    });

    if (payrolls.length < 2) {
      return {
        trend: 'INSUFFICIENT_DATA',
        message: '數據不足，需要至少2個月的薪資記錄',
      };
    }

    const salaries = payrolls.map((p) => Number(p.netSalary));

    // 計算增長趨勢
    const firstSalary = salaries[0];
    const lastSalary = salaries[salaries.length - 1];
    const totalGrowth = ((lastSalary - firstSalary) / firstSalary) * 100;
    const avgMonthlyGrowth = totalGrowth / (salaries.length - 1);

    // 計算波動性（標準差）
    const mean = salaries.reduce((a, b) => a + b, 0) / salaries.length;
    const variance =
      salaries.reduce((sum, salary) => sum + Math.pow(salary - mean, 2), 0) / salaries.length;
    const volatility = Math.sqrt(variance) / mean;

    // 判斷趨勢
    let trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
    if (volatility > 0.15) {
      trend = 'VOLATILE';
    } else if (avgMonthlyGrowth > 1) {
      trend = 'INCREASING';
    } else if (avgMonthlyGrowth < -1) {
      trend = 'DECREASING';
    } else {
      trend = 'STABLE';
    }

    // 預測下個月薪資（簡單線性預測）
    const predictedNextMonth = lastSalary * (1 + avgMonthlyGrowth / 100);

    return {
      employeeId,
      period: `${payrolls[0].period} - ${payrolls[payrolls.length - 1].period}`,
      trend,
      totalGrowth: Math.round(totalGrowth * 100) / 100,
      avgMonthlyGrowth: Math.round(avgMonthlyGrowth * 100) / 100,
      volatility: Math.round(volatility * 100),
      currentSalary: Math.round(lastSalary),
      predictedNextMonth: Math.round(predictedNextMonth),
      dataPoints: payrolls.map((p) => ({
        period: p.period,
        salary: Number(p.netSalary),
      })),
      insights: this.generateTrendInsights(trend, totalGrowth, volatility),
    };
  }

  /**
   * 薪資市場對比分析（模擬數據）
   */
  async compareSalaryToMarket(employeeId: string, position: string, industry: string = 'IT') {
    const latestPayroll = await prisma.payroll.findFirst({
      where: { employeeId },
      orderBy: { period: 'desc' },
    });

    if (!latestPayroll) {
      throw new Error('No payroll data found for employee');
    }

    // 模擬市場數據（實際應該從外部API或數據庫獲取）
    const marketData = this.getMarketBenchmark(position, industry);

    const employeeSalary = Number(latestPayroll.netSalary) * 12; // 年薪

    // 計算百分位
    let percentile = 50;
    if (employeeSalary < marketData.percentile25) {
      percentile = 25;
    } else if (employeeSalary < marketData.median) {
      percentile = 35;
    } else if (employeeSalary > marketData.percentile75) {
      percentile = 75;
    } else if (employeeSalary > marketData.median) {
      percentile = 65;
    }

    const gap = employeeSalary - marketData.median;
    const gapPercentage = (gap / marketData.median) * 100;

    return {
      employeeId,
      position,
      industry,
      employeeSalary: Math.round(employeeSalary),
      marketData: {
        min: marketData.min,
        percentile25: marketData.percentile25,
        median: marketData.median,
        percentile75: marketData.percentile75,
        max: marketData.max,
      },
      comparison: {
        percentile,
        gap: Math.round(gap),
        gapPercentage: Math.round(gapPercentage * 100) / 100,
        status:
          gapPercentage > 10
            ? 'ABOVE_MARKET'
            : gapPercentage < -10
            ? 'BELOW_MARKET'
            : 'AT_MARKET',
      },
      recommendations: this.generateSalaryRecommendations(gapPercentage, percentile),
    };
  }

  /**
   * 成本優化分析
   */
  async analyzeCostOptimization(period: string) {
    const payrolls = await prisma.payroll.findMany({
      where: { period },
    });

    if (payrolls.length === 0) {
      return { totalCost: 0, breakdown: {}, recommendations: [] };
    }

    const totalBaseSalary = payrolls.reduce((sum, p) => sum + Number(p.baseSalary), 0);
    const totalBonus = payrolls.reduce((sum, p) => sum + Number(p.bonus), 0);
    const totalOvertime = payrolls.reduce((sum, p) => sum + Number(p.overtimePay), 0);
    const totalCommission = payrolls.reduce((sum, p) => sum + Number(p.commission), 0);
    const totalTax = payrolls.reduce((sum, p) => sum + Number(p.tax), 0);
    const totalSocialInsurance = payrolls.reduce((sum, p) => sum + Number(p.socialInsurance), 0);
    const totalNetSalary = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);

    const totalCost = totalBaseSalary + totalBonus + totalOvertime + totalCommission;

    const breakdown = {
      baseSalary: {
        amount: Math.round(totalBaseSalary),
        percentage: Math.round((totalBaseSalary / totalCost) * 100),
      },
      bonus: {
        amount: Math.round(totalBonus),
        percentage: Math.round((totalBonus / totalCost) * 100),
      },
      overtime: {
        amount: Math.round(totalOvertime),
        percentage: Math.round((totalOvertime / totalCost) * 100),
      },
      commission: {
        amount: Math.round(totalCommission),
        percentage: Math.round((totalCommission / totalCost) * 100),
      },
      tax: {
        amount: Math.round(totalTax),
        percentage: Math.round((totalTax / totalCost) * 100),
      },
      socialInsurance: {
        amount: Math.round(totalSocialInsurance),
        percentage: Math.round((totalSocialInsurance / totalCost) * 100),
      },
    };

    const recommendations = [];

    // 加班費分析
    if (breakdown.overtime.percentage > 15) {
      recommendations.push({
        type: 'OVERTIME',
        severity: 'HIGH',
        message: `加班費占總薪資成本的 ${breakdown.overtime.percentage}%，建議評估是否需要增加人力`,
        potentialSavings: Math.round(totalOvertime * 0.5),
      });
    }

    // 獎金分析
    if (breakdown.bonus.percentage > 30) {
      recommendations.push({
        type: 'BONUS',
        severity: 'MEDIUM',
        message: `獎金占比較高 (${breakdown.bonus.percentage}%)，建議確認是否有臨時性大額獎金`,
      });
    }

    // 人均成本分析
    const avgCostPerEmployee = totalNetSalary / payrolls.length;
    recommendations.push({
      type: 'INFO',
      severity: 'INFO',
      message: `人均薪資成本: NT$ ${Math.round(avgCostPerEmployee).toLocaleString()}`,
    });

    return {
      period,
      totalEmployees: payrolls.length,
      totalCost: Math.round(totalCost),
      totalNetSalary: Math.round(totalNetSalary),
      avgCostPerEmployee: Math.round(avgCostPerEmployee),
      breakdown,
      recommendations,
    };
  }

  /**
   * 生成趨勢洞察
   */
  private generateTrendInsights(
    trend: string,
    totalGrowth: number,
    volatility: number
  ): string[] {
    const insights = [];

    switch (trend) {
      case 'INCREASING':
        insights.push('薪資呈現上升趨勢，表現良好');
        if (totalGrowth > 20) {
          insights.push('增長幅度較大，可能與晉升或績效獎金有關');
        }
        break;
      case 'DECREASING':
        insights.push('薪資呈現下降趨勢，需要關注');
        insights.push('建議與員工溝通，了解是否有特殊原因');
        break;
      case 'STABLE':
        insights.push('薪資保持穩定');
        insights.push('建議定期進行薪資調整以保持競爭力');
        break;
      case 'VOLATILE':
        insights.push('薪資波動較大，可能與業績掛鉤');
        insights.push('建議評估薪資結構的合理性');
        break;
    }

    if (volatility > 20) {
      insights.push('薪資波動性較高，建議增加固定薪資比例以提供更穩定的收入');
    }

    return insights;
  }

  /**
   * 生成薪資建議
   */
  private generateSalaryRecommendations(gapPercentage: number, percentile: number): string[] {
    const recommendations = [];

    if (gapPercentage < -20) {
      recommendations.push('薪資明顯低於市場水平，存在較高的流失風險');
      recommendations.push('建議立即進行薪資調整，提升至市場中位數');
      recommendations.push('考慮提供其他福利補償，如股權激勵、培訓機會等');
    } else if (gapPercentage < -10) {
      recommendations.push('薪資略低於市場水平');
      recommendations.push('建議在下一次績效評估時考慮加薪');
    } else if (gapPercentage > 20) {
      recommendations.push('薪資明顯高於市場水平');
      recommendations.push('目前薪資具有很好的競爭力');
      recommendations.push('建議維持現有水平，關注其他留才策略');
    } else if (gapPercentage > 10) {
      recommendations.push('薪資高於市場平均水平');
      recommendations.push('具有較好的市場競爭力');
    } else {
      recommendations.push('薪資與市場水平基本持平');
      recommendations.push('建議根據績效和市場變化適時調整');
    }

    if (percentile < 30) {
      recommendations.push('當前薪資處於市場較低水平，建議關注員工滿意度');
    } else if (percentile > 70) {
      recommendations.push('當前薪資處於市場較高水平，員工保留率預計較好');
    }

    return recommendations;
  }

  /**
   * 獲取市場基準數據（模擬）
   */
  private getMarketBenchmark(position: string, industry: string): SalaryBenchmark {
    // 這裡使用模擬數據，實際應該從市場數據API獲取
    const benchmarks: { [key: string]: SalaryBenchmark } = {
      'Software Engineer': {
        position: 'Software Engineer',
        industry: 'IT',
        min: 480000,
        percentile25: 600000,
        median: 800000,
        percentile75: 1000000,
        max: 1500000,
      },
      'Senior Software Engineer': {
        position: 'Senior Software Engineer',
        industry: 'IT',
        min: 720000,
        percentile25: 900000,
        median: 1200000,
        percentile75: 1500000,
        max: 2000000,
      },
      'Product Manager': {
        position: 'Product Manager',
        industry: 'IT',
        min: 600000,
        percentile25: 800000,
        median: 1000000,
        percentile75: 1300000,
        max: 1800000,
      },
      'Designer': {
        position: 'Designer',
        industry: 'IT',
        min: 420000,
        percentile25: 550000,
        median: 700000,
        percentile75: 900000,
        max: 1200000,
      },
    };

    return (
      benchmarks[position] || {
        position,
        industry,
        min: 400000,
        percentile25: 550000,
        median: 700000,
        percentile75: 900000,
        max: 1200000,
      }
    );
  }
}

export const payrollAIService = new PayrollAIService();
