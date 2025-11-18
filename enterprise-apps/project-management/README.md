# 專案管理系統 (Project Management System)
🤖 **AI-Driven | AI-Native** 🚀

專案管理系統幫助團隊有效規劃、執行和追蹤專案進度，確保專案按時、按預算完成。使用 AI 輔助開發可以快速建立功能完整、協作高效的專案管理平台。

## 🆕 最新更新

### ✨ AI 增強功能已全面整合

本專案管理系統現已整合完整的 AI 輔助功能：

- ✅ **AI 助手整合模組**: 提供任務估時、風險預測、資源優化等核心 AI 功能
- ✅ **AI 增強 Sprint Manager**: 智能故事點估算、自動化 Sprint 規劃、實時進度預測
- ✅ **整合示例**: 展示所有模組協同工作的完整示例
- ✅ **Docker 部署**: 一鍵啟動完整系統，支持 Docker Compose
- ✅ **完整文檔**: 詳細的使用指南和 API 文檔

### 🚀 快速開始

```bash
# 使用 Docker 快速啟動（推薦）
./docker-run.sh

# 或手動啟動
docker-compose up -d
```

訪問服務：
- Sprint Manager: http://localhost:8501
- Kanban Board: http://localhost:8502
- Gantt Chart: http://localhost:8503
- Dashboard: http://localhost:8504

## 📋 目錄

- [專案管理概述](#專案管理概述)
- [核心功能](#核心功能)
- [技術架構](#技術架構)
- [推薦技術棧](#推薦技術棧)
- [AI 智能功能](#ai-智能功能)
- [開發實例](#開發實例)
- [開發路線圖](#開發路線圖)

---

## 🎯 專案管理概述

### 什麼是專案管理系統？

專案管理系統是協助團隊規劃、組織和管理資源以達成特定目標的工具，核心功能包括：
- **專案規劃**：WBS、甘特圖、里程碑
- **任務管理**：任務分配、優先級、狀態追蹤
- **資源管理**：人力、預算、設備分配
- **時程管理**：排程、關鍵路徑、延遲警示
- **團隊協作**：討論、文檔共享、即時通訊
- **報表分析**：進度報告、成本分析、風險評估

### 專案管理的價值

- 📊 **提升效率**：清晰的任務分配和進度追蹤
- 🎯 **控制成本**：預算管理和成本追蹤
- ⏱️ **準時交付**：時程管理和風險預警
- 🤝 **團隊協作**：統一平台，高效溝通
- 📈 **數據驅動**：基於數據的決策支持

---

## 🧩 核心功能

### 1. 專案管理

#### 專案結構
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  code: string; // 專案代碼
  type: 'WATERFALL' | 'AGILE' | 'HYBRID';
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // 時間
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;

  // 團隊
  owner: User;
  manager: User;
  team: TeamMember[];
  stakeholders: Stakeholder[];

  // 預算
  budget: number;
  actualCost: number;
  currency: string;

  // 進度
  progress: number; // 0-100
  health: 'GREEN' | 'YELLOW' | 'RED';

  // 關聯
  phases: ProjectPhase[];
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  risks: Risk[];

  createdAt: Date;
  updatedAt: Date;
}

interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  startDate: Date;
  endDate: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  tasks: Task[];
}

interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'PENDING' | 'ACHIEVED' | 'MISSED';
  deliverables: Deliverable[];
}
```

### 2. 任務管理

#### 任務結構
```typescript
interface Task {
  id: string;
  projectId: string;
  phaseId?: string;
  parentTaskId?: string; // 父任務（子任務）

  title: string;
  description: string;
  type: 'TASK' | 'BUG' | 'FEATURE' | 'IMPROVEMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';

  // 分配
  assignee?: User;
  reporter: User;
  watchers: User[];

  // 時間
  startDate?: Date;
  dueDate?: Date;
  estimatedHours: number;
  actualHours: number;
  completedDate?: Date;

  // 依賴關係
  dependencies: TaskDependency[];
  blockedBy: Task[];

  // 其他
  tags: string[];
  attachments: Attachment[];
  comments: Comment[];
  subtasks: Task[];

  createdAt: Date;
  updatedAt: Date;
}

interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH';
  lag?: number; // 延遲天數
}
```

### 3. 敏捷看板 (Kanban/Scrum)

#### Sprint 管理
```typescript
interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';

  startDate: Date;
  endDate: Date;

  // 容量
  capacity: number; // 故事點或小時
  committed: number;
  completed: number;

  // 任務
  backlogItems: BacklogItem[];

  // 會議
  dailyStandups: DailyStandup[];
  retrospective?: Retrospective;

  // 指標
  velocity: number;
  burndownChart: BurndownPoint[];
}

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: 'USER_STORY' | 'BUG' | 'TASK' | 'EPIC';
  storyPoints?: number;
  priority: number;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
  acceptanceCriteria: string[];
  tasks: Task[];
}
```

### 4. 資源管理

#### 資源分配
```typescript
interface ResourceAllocation {
  id: string;
  projectId: string;
  resourceId: string;
  resourceType: 'HUMAN' | 'EQUIPMENT' | 'MATERIAL';

  // 人力資源
  user?: User;
  role: string;
  allocationPercentage: number; // 0-100

  // 時間
  startDate: Date;
  endDate: Date;

  // 成本
  hourlyRate?: number;
  totalCost: number;

  // 可用性
  availability: Availability[];
}

interface Availability {
  date: Date;
  availableHours: number;
  allocatedHours: number;
  isOverallocated: boolean;
}
```

### 5. 時程管理

#### 甘特圖數據
```typescript
interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number; // 天數
  progress: number; // 0-100
  dependencies: string[]; // 依賴的任務 ID
  assignee?: string;
  milestone: boolean;
  critical: boolean; // 是否在關鍵路徑上
}

// 關鍵路徑分析
interface CriticalPath {
  tasks: Task[];
  totalDuration: number;
  slack: number; // 浮動時間
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### 6. 風險管理

#### 風險追蹤
```typescript
interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: 'TECHNICAL' | 'SCHEDULE' | 'COST' | 'RESOURCE' | 'EXTERNAL';

  // 評估
  probability: 'LOW' | 'MEDIUM' | 'HIGH'; // 發生機率
  impact: 'LOW' | 'MEDIUM' | 'HIGH'; // 影響程度
  severity: number; // 嚴重性 = 機率 × 影響

  // 應對
  mitigation: string; // 緩解措施
  contingency: string; // 應急計劃
  owner: User;

  status: 'IDENTIFIED' | 'ANALYZING' | 'MITIGATING' | 'RESOLVED' | 'OCCURRED';

  identifiedDate: Date;
  reviewDate?: Date;
}
```

---

## 🏗️ 技術架構

### 推薦架構

```
┌─────────────────────────────────────────────┐
│             前端應用層                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Web App  │  │ Mobile   │  │ Desktop  │  │
│  │ (React)  │  │ App      │  │ App      │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            API 層 (REST/GraphQL)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              業務服務層                       │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ 專案   │ │ 任務   │ │ 資源   │  ...     │
│  │ 服務   │ │ 服務   │ │ 服務   │          │
│  └────────┘ └────────┘ └────────┘          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│               數據層                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │PostgreSQL│ │  Redis   │ │ MinIO/S3 │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│            整合服務                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  郵件    │ │  通知    │ │  日曆    │   │
│  └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────┘
```

---

## 💻 推薦技術棧

### 後端: Node.js + NestJS

```typescript
// 範例：任務服務
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private notificationService: NotificationService,
  ) {}

  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = new Task();
    Object.assign(task, createTaskDto);

    // 檢查依賴關係
    if (createTaskDto.dependencyIds?.length > 0) {
      const dependencies = await this.taskRepository.findByIds(
        createTaskDto.dependencyIds,
      );
      task.dependencies = dependencies.map((dep) => ({
        taskId: task.id,
        dependsOnTaskId: dep.id,
        type: 'FINISH_TO_START',
      }));
    }

    const savedTask = await this.taskRepository.save(task);

    // 通知相關人員
    if (task.assignee) {
      await this.notificationService.sendTaskAssignedNotification(
        task.assignee,
        savedTask,
      );
    }

    return savedTask;
  }

  async updateTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
  ): Promise<Task> {
    const task = await this.findOne(taskId);
    const oldStatus = task.status;

    task.status = newStatus;
    task.updatedBy = userId;

    // 自動設置完成時間
    if (newStatus === 'DONE' && !task.completedDate) {
      task.completedDate = new Date();
    }

    // 檢查依賴任務
    if (newStatus === 'DONE') {
      await this.checkAndUnblockDependentTasks(taskId);
    }

    await this.taskRepository.save(task);

    // 記錄歷史
    await this.createTaskHistory(taskId, {
      field: 'status',
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy: userId,
    });

    // 通知相關人員
    await this.notificationService.sendTaskStatusChangeNotification(task);

    return task;
  }

  async checkAndUnblockDependentTasks(taskId: string): Promise<void> {
    // 查找依賴此任務的其他任務
    const dependentTasks = await this.taskRepository
      .createQueryBuilder('task')
      .innerJoin('task.dependencies', 'dep')
      .where('dep.dependsOnTaskId = :taskId', { taskId })
      .andWhere('task.status = :status', { status: 'BLOCKED' })
      .getMany();

    for (const task of dependentTasks) {
      // 檢查是否所有依賴都已完成
      const allDependenciesCompleted =
        await this.checkAllDependenciesCompleted(task.id);

      if (allDependenciesCompleted) {
        task.status = 'TODO';
        await this.taskRepository.save(task);

        // 通知任務負責人
        await this.notificationService.sendTaskUnblockedNotification(task);
      }
    }
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    const tasks = await this.taskRepository.find({
      where: { projectId },
    });

    if (tasks.length === 0) return 0;

    const totalWeight = tasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 1),
      0,
    );
    const completedWeight = tasks
      .filter((task) => task.status === 'DONE')
      .reduce((sum, task) => sum + (task.estimatedHours || 1), 0);

    return Math.round((completedWeight / totalWeight) * 100);
  }
}
```

### 前端: React + Ant Design + DnD

```tsx
// 範例：看板視圖
import React, { useState } from 'react';
import { Card, Avatar, Tag, Tooltip } from 'antd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ClockCircleOutlined, UserOutlined } from '@ant-design/icons';

interface KanbanBoardProps {
  projectId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'TODO', title: '待處理', tasks: [] },
    { id: 'IN_PROGRESS', title: '進行中', tasks: [] },
    { id: 'IN_REVIEW', title: '審查中', tasks: [] },
    { id: 'DONE', title: '已完成', tasks: [] },
  ]);

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // 更新任務狀態
    await taskService.updateTaskStatus(draggableId, destColumn.id);

    // 更新本地狀態
    const newColumns = [...columns];
    const [movedTask] = sourceColumn.tasks.splice(source.index, 1);
    destColumn.tasks.splice(destination.index, 0, movedTask);
    setColumns(newColumns);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '16px', overflow: 'auto' }}>
        {columns.map((column) => (
          <Droppable key={column.id} droppableId={column.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  minWidth: '300px',
                  backgroundColor: snapshot.isDraggingOver ? '#f0f0f0' : '#fafafa',
                  padding: '8px',
                  borderRadius: '4px',
                }}
              >
                <h3>{column.title}</h3>
                {column.tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          marginBottom: '8px',
                          ...provided.draggableProps.style,
                        }}
                        size="small"
                      >
                        <div>{task.title}</div>
                        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <Tag color={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Tag>
                          <div>
                            {task.estimatedHours && (
                              <Tooltip title="預估時數">
                                <ClockCircleOutlined /> {task.estimatedHours}h
                              </Tooltip>
                            )}
                            {task.assignee && (
                              <Tooltip title={task.assignee.name}>
                                <Avatar size="small" src={task.assignee.avatar}>
                                  {task.assignee.name[0]}
                                </Avatar>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
```

---

## 🤖 AI 智能功能

### 1. 智能任務估時

```python
# 使用機器學習預測任務工時
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

class TaskEstimationService:
    def __init__(self):
        self.model = RandomForestRegressor()

    def train_model(self, historical_tasks):
        """基於歷史任務訓練模型"""
        features = self.extract_features(historical_tasks)
        actual_hours = [task['actual_hours'] for task in historical_tasks]

        self.model.fit(features, actual_hours)

    def estimate_task(self, task: dict) -> dict:
        """預測任務工時"""
        features = self.extract_features([task])
        predicted_hours = self.model.predict(features)[0]

        # 計算信心區間
        confidence = self.calculate_confidence(task)

        return {
            'estimated_hours': round(predicted_hours, 1),
            'confidence': confidence,
            'range': {
                'min': round(predicted_hours * 0.8, 1),
                'max': round(predicted_hours * 1.2, 1),
            },
            'similar_tasks': self.find_similar_tasks(task),
        }

    def extract_features(self, tasks):
        """提取任務特徵"""
        features = []
        for task in tasks:
            features.append([
                task['complexity'],  # 複雜度 1-5
                task['priority'],    # 優先級 1-4
                len(task['description']),  # 描述長度
                task['num_subtasks'],  # 子任務數量
                task['assignee_experience'],  # 負責人經驗值
                task['dependencies_count'],  # 依賴任務數
            ])
        return features
```

### 2. 風險預測

```typescript
// AI 驅動的專案風險預測
class ProjectRiskPredictionService {
  async analyzeProjectRisks(projectId: string): Promise<RiskAnalysis> {
    const project = await this.getProjectWithMetrics(projectId);

    // 收集風險指標
    const riskIndicators = {
      // 進度風險
      scheduleVariance: this.calculateScheduleVariance(project),
      criticalPathDelay: this.checkCriticalPathDelay(project),
      milestonesMissed: this.countMissedMilestones(project),

      // 成本風險
      budgetVariance: this.calculateBudgetVariance(project),
      burnRate: this.calculateBurnRate(project),

      // 資源風險
      resourceUtilization: this.getResourceUtilization(project),
      keyPersonDependency: this.assessKeyPersonRisk(project),

      // 團隊風險
      teamVelocityTrend: this.analyzeVelocityTrend(project),
      teamMorale: this.estimateTeamMorale(project),
    };

    // 使用機器學習模型評估整體風險
    const overallRisk = await this.mlModel.predictRisk(riskIndicators);

    // 生成風險報告
    return {
      overallRiskLevel: this.categorizeRisk(overallRisk),
      riskScore: overallRisk,
      topRisks: this.identifyTopRisks(riskIndicators),
      recommendations: this.generateRecommendations(riskIndicators),
      forecast: this.forecastProjectOutcome(project, overallRisk),
    };
  }
}
```

### 3. 智能資源分配

```typescript
// 優化資源分配
class ResourceOptimizationService {
  async optimizeResourceAllocation(
    project: Project,
    availableResources: Resource[],
  ): Promise<AllocationPlan> {
    const tasks = await this.getProjectTasks(project.id);

    // 使用遺傳算法優化分配
    const allocationPlan = await this.geneticAlgorithm({
      tasks,
      resources: availableResources,
      constraints: {
        workHoursPerDay: 8,
        maxUtilization: 0.9,
        skillMatching: true,
      },
      objectives: {
        minimizeDuration: 0.4,
        balanceWorkload: 0.3,
        minimizeCost: 0.3,
      },
    });

    return {
      allocations: allocationPlan,
      metrics: {
        estimatedDuration: this.calculateDuration(allocationPlan),
        estimatedCost: this.calculateCost(allocationPlan),
        resourceUtilization: this.calculateUtilization(allocationPlan),
      },
      conflicts: this.detectConflicts(allocationPlan),
      recommendations: this.generateAllocationRecommendations(allocationPlan),
    };
  }
}
```

---

## 🗺️ 開發路線圖

### MVP (4-6 週)

#### Week 1-2
- [ ] 專案基礎架構
- [ ] 專案CRUD
- [ ] 任務CRUD
- [ ] 基礎看板

#### Week 3-4
- [ ] 任務拖拽
- [ ] 任務依賴
- [ ] 團隊成員管理
- [ ] 評論功能

#### Week 5-6
- [ ] 甘特圖
- [ ] 進度追蹤
- [ ] 基礎報表
- [ ] 通知系統

### 完整版 (3-4 個月)

- [ ] Scrum/Sprint 管理
- [ ] 資源管理
- [ ] 時間追蹤
- [ ] 風險管理
- [ ] AI 功能整合
- [ ] 移動端應用

---

## 📚 參考資源

### 開源專案管理工具
- **Jira** - Atlassian 的專案管理工具
- **Trello** - 簡單的看板工具
- **Asana** - 團隊協作平台
- **Monday.com** - 工作作業系統
- **ClickUp** - 全能生產力平台
- **Taiga** - 敏捷專案管理（開源）

---

**🚀 開始使用 AI 建立你的專案管理系統，提升團隊協作效率！**
