# HR 管理系統 (Human Resource Management System)
🤖 **AI-Driven | AI-Native** 🚀

人力資源管理系統 (HRMS) 幫助企業高效管理員工生命週期的各個階段，從招聘到離職。使用 AI 輔助開發可以快速建立功能完整、智能化的 HR 系統。

## 📋 目錄

- [HRMS 概述](#hrms-概述)
- [核心功能模組](#核心功能模組)
- [技術架構](#技術架構)
- [推薦技術棧](#推薦技術棧)
- [AI 智能功能](#ai-智能功能)
- [開發實例](#開發實例)
- [開發路線圖](#開發路線圖)

---

## 🎯 HRMS 概述

### 什麼是 HRMS？

人力資源管理系統 (HRMS) 是整合人力資源管理各項功能的綜合平台，包括：
- **員工管理**：員工檔案、組織架構
- **招聘管理**：職位發布、應聘追蹤、面試安排
- **考勤管理**：打卡記錄、請假加班、排班
- **薪資管理**：薪資結構、薪資計算、個稅申報
- **績效管理**：目標設定、考核評估、績效面談
- **培訓發展**：培訓計劃、課程管理、職涯規劃

### HRMS 的價值

- 📊 **提升效率**：自動化人事流程，減少重複工作
- 🎯 **數據驅動**：人力數據分析，支持決策
- 💼 **員工體驗**：自助服務，提升員工滿意度
- 📈 **合規管理**：符合勞動法規，降低風險
- 🤝 **人才發展**：系統化培養，提升組織能力

---

## 🧩 核心功能模組

### 1. 組織與員工管理

#### 組織架構
```typescript
interface Organization {
  id: string;
  name: string;
  type: 'COMPANY' | 'DEPARTMENT' | 'TEAM';
  parentId?: string;
  managerId: string;
  children: Organization[];
  employees: Employee[];
  level: number;
  path: string; // 如: "/公司/技術部/前端組"
}
```

#### 員工檔案
```typescript
interface Employee {
  // 基本資料
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  idNumber: string;

  // 職位資訊
  department: string;
  position: string;
  jobTitle: string;
  employeeType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  hireDate: Date;
  probationEndDate?: Date;

  // 直屬主管
  managerId?: string;
  manager?: Employee;

  // 薪資資訊
  baseSalary: number;
  currency: string;
  payGrade: string;

  // 聯絡資訊
  address: Address;
  emergencyContacts: EmergencyContact[];

  // 合同資訊
  contracts: Contract[];
  currentContract?: Contract;

  // 其他
  avatar?: string;
  skills: string[];
  certifications: Certification[];
  documents: Document[];

  createdAt: Date;
  updatedAt: Date;
}
```

#### 核心功能
- **組織架構管理**：部門、團隊層級管理
- **職位管理**：職位定義、編制管理
- **員工檔案**：完整員工資訊管理
- **合同管理**：合同簽訂、續約、到期提醒
- **證照管理**：證照記錄、到期提醒
- **離職管理**：離職流程、離職面談

### 2. 招聘管理 (ATS - Applicant Tracking System)

#### 招聘流程
```
需求提出 → 職位發布 → 簡歷篩選 → 面試安排 →
Offer 發放 → 入職準備 → 試用期管理
```

#### 職位與應聘者
```typescript
interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  openings: number; // 招聘人數
  publishedAt?: Date;
  closedAt?: Date;
  applications: Application[];
}

interface Application {
  id: string;
  jobPostingId: string;
  candidateId: string;
  candidate: Candidate;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED';
  source: 'WEBSITE' | 'REFERRAL' | 'LINKEDIN' | 'JOB_BOARD';
  appliedAt: Date;
  interviews: Interview[];
  notes: Note[];
  rating?: number;
  rejectionReason?: string;
}

interface Interview {
  id: string;
  applicationId: string;
  round: number;
  type: 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL';
  scheduledAt: Date;
  duration: number; // 分鐘
  interviewers: User[];
  location?: string;
  meetingLink?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  feedback?: InterviewFeedback[];
}
```

#### 核心功能
- **職位管理**：職位創建、發布、關閉
- **簡歷管理**：簡歷解析、篩選、評分
- **面試管理**：面試安排、面試官分配、反饋收集
- **Offer 管理**：Offer 生成、發送、接受追蹤
- **入職管理**：入職流程、文件準備
- **數據分析**：招聘漏斗、來源分析、時效分析

### 3. 考勤管理

#### 考勤記錄
```typescript
interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  workHours: number;
  overtimeHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'ON_LEAVE';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  device?: string;
  isRemote: boolean;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'ANNUAL' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approver?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  documents?: string[];
}

interface LeaveBalance {
  employeeId: string;
  year: number;
  leaveType: string;
  total: number;      // 總天數
  used: number;       // 已使用
  pending: number;    // 待審批
  available: number;  // 可用
}
```

#### 核心功能
- **打卡管理**：上下班打卡、GPS 定位
- **請假管理**：請假申請、審批、餘額管理
- **加班管理**：加班申請、審批、補休管理
- **排班管理**：班次定義、排班計劃
- **考勤報表**：出勤統計、異常分析
- **假期管理**：年假、病假、事假等各類假期

### 4. 薪資管理

#### 薪資結構
```typescript
interface Payroll {
  id: string;
  employeeId: string;
  period: string; // "2024-01"
  currency: string;

  // 固定薪資
  baseSalary: number;
  allowances: Allowance[]; // 津貼
  totalEarnings: number;

  // 扣除項
  deductions: Deduction[]; // 扣款
  tax: number;
  socialInsurance: number;
  totalDeductions: number;

  // 實際發放
  netSalary: number;

  // 其他
  overtimePay: number;
  bonus: number;
  commission: number;

  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
  paidAt?: Date;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK';
  payslip?: string; // PDF URL
}

interface Allowance {
  type: string; // '交通津貼', '餐費補助', '住房津貼'
  amount: number;
  taxable: boolean;
}

interface Deduction {
  type: string; // '遲到扣款', '缺勤扣款', '借款'
  amount: number;
}
```

#### 核心功能
- **薪資結構**：底薪、津貼、獎金配置
- **薪資計算**：自動計算薪資、加班費、扣款
- **社保公積金**：社保繳納計算、公積金管理
- **個稅計算**：個人所得稅計算、申報
- **薪資發放**：批量發薪、薪資單生成
- **薪資報表**：薪資統計、成本分析

### 5. 績效管理

#### 績效考核
```typescript
interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string; // 考核人
  period: string; // "2024-Q1"
  type: 'PROBATION' | 'ANNUAL' | 'QUARTERLY' | 'PROJECT';
  status: 'NOT_STARTED' | 'SELF_REVIEW' | 'MANAGER_REVIEW' | 'CALIBRATION' | 'COMPLETED';

  // 目標與評分
  goals: Goal[];
  competencies: CompetencyRating[];

  // 評分
  selfRating?: number;
  managerRating?: number;
  finalRating?: number;
  ratingLevel: 'OUTSTANDING' | 'EXCEEDS' | 'MEETS' | 'NEEDS_IMPROVEMENT' | 'UNSATISFACTORY';

  // 評語
  selfComments?: string;
  managerComments?: string;
  strengths?: string[];
  areasForImprovement?: string[];

  // 發展計劃
  developmentPlan?: DevelopmentPlan;

  // 時間
  dueDate: Date;
  completedAt?: Date;
}

interface Goal {
  id: string;
  description: string;
  weight: number; // 權重百分比
  targetValue?: string;
  actualValue?: string;
  rating?: number; // 1-5
  comments?: string;
}
```

#### 核心功能
- **目標管理 (OKR/KPI)**：目標設定、追蹤、評估
- **績效考核**：自評、主管評、360度評估
- **績效校準**：跨部門校準會議
- **績效面談**：面談記錄、發展計劃
- **績效分析**：績效分佈、趨勢分析
- **晉升管理**：晉升流程、職級管理

### 6. 培訓與發展

#### 培訓管理
```typescript
interface TrainingProgram {
  id: string;
  name: string;
  description: string;
  type: 'ONBOARDING' | 'SKILL' | 'LEADERSHIP' | 'COMPLIANCE';
  category: string;
  duration: number; // 小時
  capacity: number;
  instructor?: string;
  location?: string;
  isOnline: boolean;
  cost: number;
  status: 'PLANNED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
  endDate: Date;
  enrollments: Enrollment[];
  materials: string[];
}

interface Enrollment {
  id: string;
  employeeId: string;
  programId: string;
  status: 'REGISTERED' | 'ATTENDING' | 'COMPLETED' | 'FAILED' | 'WITHDRAWN';
  registeredAt: Date;
  completedAt?: Date;
  score?: number;
  certificate?: string;
  feedback?: string;
}
```

#### 核心功能
- **培訓計劃**：年度培訓計劃、課程管理
- **培訓實施**：報名管理、簽到、評估
- **證書管理**：證書頒發、記錄管理
- **效果評估**：培訓反饋、效果追蹤
- **職涯發展**：職涯路徑、繼任計劃
- **技能矩陣**：技能評估、缺口分析

---

## 🏗️ 技術架構

### 系統架構

```
┌─────────────────────────────────────────────────────────┐
│                     前端應用層                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 員工      │  │ 經理      │  │ HR       │  │ 管理員   │ │
│  │ 自助平台  │  │ 工作台    │  │ 工作台   │  │ 後台     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     API 層                                │
│         RESTful API / GraphQL                             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   業務服務層                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │ 員工   │ │ 招聘   │ │ 考勤   │ │ 薪資   │  ...       │
│  │ 服務   │ │ 服務   │ │ 服務   │ │ 服務   │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     數據層                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ PostgreSQL │ │   Redis    │ │   S3/OSS   │           │
│  │  (主庫)    │ │  (快取)    │ │  (文件)    │           │
│  └────────────┘ └────────────┘ └────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 推薦技術棧

### 後端: Node.js + NestJS

```typescript
// 範例：考勤服務
@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  // 打卡
  async checkIn(employeeId: string, location?: Location): Promise<Attendance> {
    const today = startOfDay(new Date());

    // 檢查是否已經打卡
    const existing = await this.attendanceRepository.findOne({
      where: { employeeId, date: today },
    });

    if (existing && existing.checkIn) {
      throw new BadRequestException('今日已打卡');
    }

    const now = new Date();
    const workStartTime = setHours(today, 9); // 9:00 AM
    const isLate = now > workStartTime;

    const attendance = existing || new Attendance();
    attendance.employeeId = employeeId;
    attendance.date = today;
    attendance.checkIn = now;
    attendance.location = location;
    attendance.status = isLate ? 'LATE' : 'PRESENT';

    return await this.attendanceRepository.save(attendance);
  }

  // 下班打卡
  async checkOut(employeeId: string): Promise<Attendance> {
    const today = startOfDay(new Date());

    const attendance = await this.attendanceRepository.findOne({
      where: { employeeId, date: today },
    });

    if (!attendance || !attendance.checkIn) {
      throw new BadRequestException('請先上班打卡');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('今日已下班打卡');
    }

    const now = new Date();
    attendance.checkOut = now;

    // 計算工作時數
    const hours = differenceInHours(now, attendance.checkIn);
    attendance.workHours = hours;

    // 計算加班時數（超過8小時）
    if (hours > 8) {
      attendance.overtimeHours = hours - 8;
    }

    return await this.attendanceRepository.save(attendance);
  }

  // 請假申請
  async createLeaveRequest(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const employee = await this.employeeService.findOne(dto.employeeId);

    // 檢查假期餘額
    const balance = await this.getLeaveBalance(dto.employeeId, dto.leaveType);
    if (balance.available < dto.days) {
      throw new BadRequestException('假期餘額不足');
    }

    const leaveRequest = new LeaveRequest();
    leaveRequest.employeeId = dto.employeeId;
    leaveRequest.leaveType = dto.leaveType;
    leaveRequest.startDate = dto.startDate;
    leaveRequest.endDate = dto.endDate;
    leaveRequest.days = dto.days;
    leaveRequest.reason = dto.reason;
    leaveRequest.status = 'PENDING';

    // 自動分配審批人（直屬主管）
    if (employee.managerId) {
      leaveRequest.approver = employee.managerId;

      // 發送通知給審批人
      await this.notificationService.sendLeaveApprovalNotification(
        employee.managerId,
        leaveRequest,
      );
    }

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  // 審批請假
  async approveLeaveRequest(
    requestId: string,
    approverId: string,
    approved: boolean,
    reason?: string,
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne(requestId);

    if (request.status !== 'PENDING') {
      throw new BadRequestException('該請假申請已處理');
    }

    request.status = approved ? 'APPROVED' : 'REJECTED';
    request.approver = approverId;
    request.approvedAt = new Date();
    if (!approved && reason) {
      request.rejectionReason = reason;
    }

    await this.leaveRequestRepository.save(request);

    // 如果批准，更新假期餘額
    if (approved) {
      await this.updateLeaveBalance(
        request.employeeId,
        request.leaveType,
        -request.days,
      );
    }

    // 通知員工
    await this.notificationService.sendLeaveStatusNotification(request);

    return request;
  }
}
```

### 前端: React + Ant Design

```tsx
// 範例：員工列表頁面
import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Avatar, Input } from 'antd';
import { UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { employeeService } from '@/services';

const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const columns = [
    {
      title: '員工',
      key: 'employee',
      render: (_, record: Employee) => (
        <Space>
          <Avatar src={record.avatar} size="large">
            {record.firstName[0]}
          </Avatar>
          <div>
            <div>
              <a href={`/employees/${record.id}`}>
                {record.firstName} {record.lastName}
              </a>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.employeeNumber}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '部門',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '職位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '狀態',
      dataIndex: 'employmentStatus',
      key: 'status',
      render: (status: string) => {
        const colorMap = {
          ACTIVE: 'green',
          ON_LEAVE: 'orange',
          RESIGNED: 'red',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: '入職日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Employee) => (
        <Space>
          <Button type="link" href={`/employees/${record.id}`}>
            查看
          </Button>
          <Button type="link" href={`/employees/${record.id}/edit`}>
            編輯
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.employeeNumber.includes(searchText),
  );

  return (
    <Card
      title="員工列表"
      extra={
        <Space>
          <Input
            placeholder="搜尋員工"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button type="primary" icon={<UserAddOutlined />} href="/employees/new">
            新增員工
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredEmployees}
        loading={loading}
        rowKey="id"
      />
    </Card>
  );
};

export default EmployeeList;
```

---

## 🤖 AI 智能功能

### 1. 智能簡歷篩選

```python
# AI 簡歷解析與評分
from transformers import pipeline

class ResumeScreeningService:
    def __init__(self):
        self.ner_model = pipeline("ner", model="bert-base-ner")

    def parse_resume(self, resume_text: str) -> dict:
        """解析簡歷，提取關鍵資訊"""
        # 使用 NLP 提取實體
        entities = self.ner_model(resume_text)

        # 提取技能
        skills = self.extract_skills(resume_text)

        # 提取教育背景
        education = self.extract_education(resume_text)

        # 提取工作經驗
        experience = self.extract_experience(resume_text)

        return {
            'skills': skills,
            'education': education,
            'experience': experience,
            'years_of_experience': self.calculate_years(experience),
        }

    def score_candidate(self, resume_data: dict, job_requirements: dict) -> float:
        """根據職位要求評分候選人"""
        score = 0
        max_score = 100

        # 技能匹配 (40%)
        skill_score = self.calculate_skill_match(
            resume_data['skills'],
            job_requirements['required_skills']
        )
        score += skill_score * 0.4

        # 經驗匹配 (30%)
        exp_score = self.calculate_experience_match(
            resume_data['years_of_experience'],
            job_requirements['min_years']
        )
        score += exp_score * 0.3

        # 教育背景 (20%)
        edu_score = self.calculate_education_match(
            resume_data['education'],
            job_requirements['education']
        )
        score += edu_score * 0.2

        # 其他因素 (10%)
        other_score = self.calculate_other_factors(resume_data)
        score += other_score * 0.1

        return min(score, max_score)
```

### 2. 離職預測

```typescript
// 員工離職風險預測
interface ChurnRiskFactors {
  // 工作滿意度指標
  performanceRating: number;  // 績效評分
  salaryPercentile: number;   // 薪資百分位
  promotionYears: number;     // 距上次晉升年數

  // 參與度指標
  trainingHours: number;      // 培訓時數
  projectInvolvement: number; // 專案參與度

  // 其他因素
  yearsInCompany: number;     // 在職年資
  managerRating: number;      // 主管評分
  workLifeBalance: number;    // 工作生活平衡
}

class ChurnPredictionService {
  async predictChurnRisk(employeeId: string): Promise<ChurnPrediction> {
    const employee = await this.getEmployee(employeeId);
    const factors = await this.extractRiskFactors(employeeId);

    // 使用機器學習模型預測
    const riskScore = await this.mlModel.predict(factors);

    // 識別主要風險因素
    const topRiskFactors = this.identifyTopRiskFactors(factors);

    // 生成保留建議
    const retentionActions = this.generateRetentionActions(topRiskFactors);

    return {
      employeeId,
      riskLevel: riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW',
      riskScore,
      riskFactors: topRiskFactors,
      recommendedActions: retentionActions,
      predictedDate: this.estimateChurnDate(riskScore),
    };
  }
}
```

### 3. 智能排班

```typescript
// AI 優化排班
class SmartSchedulingService {
  async generateSchedule(params: SchedulingParams): Promise<Schedule> {
    const { employees, requirements, constraints, period } = params;

    // 收集員工偏好和可用性
    const availability = await this.getEmployeeAvailability(employees);

    // 使用遺傳算法優化排班
    const schedule = await this.optimizeSchedule({
      employees,
      availability,
      requirements, // 每個時段需要的人數
      constraints: {
        maxHoursPerWeek: 40,
        minRestBetweenShifts: 11, // 小時
        weekendRotation: true,
        skillMatching: true,
      },
    });

    // 計算公平性分數
    const fairnessScore = this.calculateFairness(schedule);

    return {
      schedule,
      fairnessScore,
      coverageRate: this.calculateCoverage(schedule, requirements),
      conflicts: this.detectConflicts(schedule),
    };
  }
}
```

---

## 🗺️ 開發路線圖

### MVP 階段（6-8 週）

#### Week 1-2: 基礎設施
- [ ] 專案初始化
- [ ] 資料庫設計
- [ ] 認證授權
- [ ] 組織架構管理

#### Week 3-4: 員工管理
- [ ] 員工檔案管理
- [ ] 合同管理
- [ ] 部門職位管理
- [ ] 員工自助平台

#### Week 5-6: 考勤管理
- [ ] 打卡功能
- [ ] 請假管理
- [ ] 考勤報表
- [ ] 手機端打卡

#### Week 7-8: 基礎報表
- [ ] 員工統計
- [ ] 考勤報表
- [ ] 部署測試

### 完整版（4-5 個月）

#### 第二階段: 招聘管理
- [ ] 職位管理
- [ ] 應聘者追蹤
- [ ] 面試管理
- [ ] Offer 管理

#### 第三階段: 薪資管理
- [ ] 薪資結構配置
- [ ] 薪資計算
- [ ] 個稅計算
- [ ] 薪資單生成

#### 第四階段: 績效管理
- [ ] 目標設定
- [ ] 績效考核
- [ ] 360度評估
- [ ] 績效面談

#### 第五階段: 培訓發展
- [ ] 培訓計劃
- [ ] 課程管理
- [ ] 證書管理
- [ ] 職涯發展

#### 第六階段: AI 功能
- [ ] 智能簡歷篩選
- [ ] 離職預測
- [ ] 智能排班
- [ ] 數據分析

---

## 📚 參考資源

### 開源 HRMS
- **OrangeHRM** - 功能完整的開源 HRMS
- **iCIMS** - 招聘管理系統
- **BambooHR** - 中小企業 HR 解決方案
- **Odoo HR** - Odoo 的 HR 模組

### 學習資源
- 人力資源管理最佳實踐
- 勞動法規合規指南
- HRMS 系統設計模式

---

**🚀 開始使用 AI 建立你的 HR 管理系統，提升人力資源管理效率！**
