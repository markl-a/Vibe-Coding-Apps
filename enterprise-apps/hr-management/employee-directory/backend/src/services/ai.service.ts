import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI 輔助服務 - 為員工管理提供智能化功能
 */
export class AIService {
  /**
   * 智能員工搜索 - 使用相似度算法匹配員工
   */
  async intelligentSearch(query: string) {
    // 搜索員工
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { position: { contains: query, mode: 'insensitive' } },
          { jobTitle: { contains: query, mode: 'insensitive' } },
          { skills: { hasSome: [query] } },
        ],
      },
      include: {
        department: true,
        manager: true,
      },
      take: 10,
    });

    // 計算相關性分數
    const rankedResults = employees.map((emp) => {
      let score = 0;
      const lowerQuery = query.toLowerCase();

      // 名字完全匹配：最高分
      if (
        emp.firstName.toLowerCase() === lowerQuery ||
        emp.lastName.toLowerCase() === lowerQuery
      ) {
        score += 100;
      }

      // 職位匹配
      if (emp.position.toLowerCase().includes(lowerQuery)) {
        score += 50;
      }

      // 技能匹配
      const matchingSkills = emp.skills.filter((skill) =>
        skill.toLowerCase().includes(lowerQuery)
      );
      score += matchingSkills.length * 30;

      // 郵箱匹配
      if (emp.email.toLowerCase().includes(lowerQuery)) {
        score += 20;
      }

      return { ...emp, relevanceScore: score };
    });

    // 按相關性排序
    return rankedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * 技能匹配推薦 - 根據職位推薦具有相關技能的員工
   */
  async recommendEmployeesBySkills(requiredSkills: string[]) {
    const employees = await prisma.employee.findMany({
      where: {
        employmentStatus: 'ACTIVE',
      },
      include: {
        department: true,
      },
    });

    // 計算技能匹配度
    const recommendations = employees
      .map((emp) => {
        const matchingSkills = emp.skills.filter((skill) =>
          requiredSkills.some(
            (req) => skill.toLowerCase().includes(req.toLowerCase())
          )
        );

        const matchPercentage = (matchingSkills.length / requiredSkills.length) * 100;

        return {
          employee: emp,
          matchingSkills,
          missingSkills: requiredSkills.filter(
            (req) =>
              !emp.skills.some((skill) =>
                skill.toLowerCase().includes(req.toLowerCase())
              )
          ),
          matchPercentage,
        };
      })
      .filter((rec) => rec.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    return recommendations;
  }

  /**
   * 組織架構優化建議 - 分析組織結構並提供優化建議
   */
  async analyzeOrganizationStructure() {
    const employees = await prisma.employee.findMany({
      include: {
        subordinates: true,
        department: true,
      },
    });

    const departments = await prisma.department.findMany({
      include: {
        employees: true,
      },
    });

    // 分析問題
    const issues: any[] = [];

    // 1. 檢查主管下屬過多
    employees.forEach((emp) => {
      if (emp.subordinates.length > 10) {
        issues.push({
          type: 'SPAN_OF_CONTROL',
          severity: 'HIGH',
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          message: `主管 ${emp.firstName} ${emp.lastName} 管理 ${emp.subordinates.length} 名下屬，超出建議的管理幅度 (10人)`,
          suggestion: '考慮增設中層主管或重新分配團隊',
        });
      }
    });

    // 2. 檢查部門規模
    departments.forEach((dept) => {
      if (dept.employees.length < 3 && dept.employees.length > 0) {
        issues.push({
          type: 'SMALL_DEPARTMENT',
          severity: 'MEDIUM',
          departmentId: dept.id,
          departmentName: dept.name,
          message: `部門 ${dept.name} 僅有 ${dept.employees.length} 名員工`,
          suggestion: '考慮與其他小部門合併或擴充團隊',
        });
      }

      if (dept.employees.length > 50) {
        issues.push({
          type: 'LARGE_DEPARTMENT',
          severity: 'MEDIUM',
          departmentId: dept.id,
          departmentName: dept.name,
          message: `部門 ${dept.name} 有 ${dept.employees.length} 名員工，規模較大`,
          suggestion: '考慮拆分為子部門以提高管理效率',
        });
      }
    });

    // 3. 檢查沒有主管的員工
    const employeesWithoutManager = employees.filter(
      (emp) => !emp.managerId && emp.employmentStatus === 'ACTIVE'
    );

    if (employeesWithoutManager.length > 0) {
      issues.push({
        type: 'NO_MANAGER',
        severity: 'HIGH',
        count: employeesWithoutManager.length,
        message: `有 ${employeesWithoutManager.length} 名活躍員工未分配主管`,
        suggestion: '為所有員工分配直屬主管以確保管理鏈完整',
      });
    }

    // 4. 計算組織健康度指標
    const avgSubordinatesPerManager =
      employees.filter((e) => e.subordinates.length > 0).length > 0
        ? employees.reduce((sum, e) => sum + e.subordinates.length, 0) /
          employees.filter((e) => e.subordinates.length > 0).length
        : 0;

    const avgDepartmentSize =
      departments.length > 0
        ? departments.reduce((sum, d) => sum + d.employees.length, 0) / departments.length
        : 0;

    return {
      summary: {
        totalEmployees: employees.length,
        totalDepartments: departments.length,
        avgSubordinatesPerManager: Math.round(avgSubordinatesPerManager * 10) / 10,
        avgDepartmentSize: Math.round(avgDepartmentSize * 10) / 10,
        managersCount: employees.filter((e) => e.subordinates.length > 0).length,
      },
      issues,
      recommendations: this.generateRecommendations(issues),
    };
  }

  /**
   * 員工流失風險預測 - 基於多種因素預測員工離職風險
   */
  async predictAttritionRisk(employeeId: string) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        manager: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    let riskScore = 0;
    const riskFactors: string[] = [];

    // 1. 在職時間分析
    const tenureYears =
      (new Date().getTime() - new Date(employee.hireDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365);

    if (tenureYears < 1) {
      riskScore += 30;
      riskFactors.push('新員工（在職不到1年）');
    } else if (tenureYears > 5) {
      riskScore -= 20; // 降低風險
    }

    // 2. 薪資分析
    if (employee.baseSalary) {
      const salary = Number(employee.baseSalary);
      // 假設平均薪資為 50000
      const avgSalary = 50000;
      if (salary < avgSalary * 0.8) {
        riskScore += 25;
        riskFactors.push('薪資低於市場平均');
      }
    }

    // 3. 職位分析
    if (!employee.managerId) {
      riskScore -= 15; // 高層員工風險較低
    }

    // 4. 技能分析
    if (employee.skills.length < 3) {
      riskScore += 15;
      riskFactors.push('技能較少，職業發展受限');
    }

    // 確保分數在 0-100 之間
    riskScore = Math.max(0, Math.min(100, riskScore + 30)); // 基礎分30

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore < 40) {
      riskLevel = 'LOW';
    } else if (riskScore < 70) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    // 生成保留建議
    const retentionStrategies = this.generateRetentionStrategies(riskFactors, employee);

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      riskScore,
      riskLevel,
      riskFactors,
      tenureYears: Math.round(tenureYears * 10) / 10,
      retentionStrategies,
    };
  }

  /**
   * 團隊技能矩陣分析 - 分析團隊技能分佈和缺口
   */
  async analyzeTeamSkills(departmentId?: string) {
    const where = departmentId ? { departmentId } : {};

    const employees = await prisma.employee.findMany({
      where: {
        ...where,
        employmentStatus: 'ACTIVE',
      },
      include: {
        department: true,
      },
    });

    // 統計所有技能
    const skillMap = new Map<string, number>();
    employees.forEach((emp) => {
      emp.skills.forEach((skill) => {
        const normalizedSkill = skill.toLowerCase().trim();
        skillMap.set(normalizedSkill, (skillMap.get(normalizedSkill) || 0) + 1);
      });
    });

    // 轉換為數組並排序
    const skillDistribution = Array.from(skillMap.entries())
      .map(([skill, count]) => ({
        skill,
        count,
        percentage: Math.round((count / employees.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // 識別技能缺口（常見技能但團隊掌握率低的）
    const commonTechSkills = [
      'javascript',
      'python',
      'java',
      'react',
      'node.js',
      'sql',
      'git',
      'aws',
      'docker',
      'kubernetes',
    ];

    const skillGaps = commonTechSkills
      .map((skill) => {
        const count = skillMap.get(skill) || 0;
        return {
          skill,
          currentCount: count,
          coverage: Math.round((count / employees.length) * 100),
        };
      })
      .filter((gap) => gap.coverage < 50) // 掌握率低於50%
      .sort((a, b) => a.coverage - b.coverage);

    return {
      totalEmployees: employees.length,
      totalUniqueSkills: skillDistribution.length,
      skillDistribution,
      skillGaps,
      recommendations: this.generateSkillRecommendations(skillGaps, employees.length),
    };
  }

  /**
   * 生成建議
   */
  private generateRecommendations(issues: any[]) {
    const recommendations: string[] = [];

    const highSeverityIssues = issues.filter((i) => i.severity === 'HIGH');
    if (highSeverityIssues.length > 0) {
      recommendations.push(`發現 ${highSeverityIssues.length} 個高優先級問題，建議立即處理`);
    }

    const spanIssues = issues.filter((i) => i.type === 'SPAN_OF_CONTROL');
    if (spanIssues.length > 0) {
      recommendations.push('建議重新調整管理架構，確保每位主管的管理幅度在合理範圍內');
    }

    return recommendations;
  }

  /**
   * 生成保留策略
   */
  private generateRetentionStrategies(riskFactors: string[], employee: any) {
    const strategies: string[] = [];

    if (riskFactors.includes('新員工（在職不到1年）')) {
      strategies.push('加強新員工培訓和導師計劃');
      strategies.push('定期進行試用期反饋和關懷');
    }

    if (riskFactors.includes('薪資低於市場平均')) {
      strategies.push('進行薪資市場調查並考慮調薪');
      strategies.push('提供其他福利補償（如彈性工作、培訓機會等）');
    }

    if (riskFactors.includes('技能較少，職業發展受限')) {
      strategies.push('提供技能培訓和職業發展機會');
      strategies.push('制定個人發展計劃 (IDP)');
    }

    if (strategies.length === 0) {
      strategies.push('持續關注員工滿意度');
      strategies.push('定期進行績效面談和職涯規劃');
    }

    return strategies;
  }

  /**
   * 生成技能培訓建議
   */
  private generateSkillRecommendations(skillGaps: any[], teamSize: number) {
    const recommendations: string[] = [];

    if (skillGaps.length > 0) {
      const topGaps = skillGaps.slice(0, 3);
      recommendations.push(
        `優先培訓技能: ${topGaps.map((g) => g.skill).join(', ')}`
      );
    }

    if (teamSize < 5) {
      recommendations.push('團隊規模較小，建議員工培養全棧技能');
    } else {
      recommendations.push('可以考慮專業化分工，但需保持一定的技能冗餘');
    }

    return recommendations;
  }
}

export const aiService = new AIService();
