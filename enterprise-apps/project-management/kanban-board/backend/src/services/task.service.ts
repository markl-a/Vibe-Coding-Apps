export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  tags: string[];
  estimatedHours: number;
  actualHours: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  comments: Comment[];
  history: HistoryEntry[];
}

export interface Comment {
  author: string;
  content: string;
  timestamp: Date;
}

export interface HistoryEntry {
  field: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  assignee?: string;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface Board {
  id: string;
  name: string;
  tasks: Map<string, Task>;
  createdAt: Date;
}

export interface BoardStatistics {
  totalTasks: number;
  completionRate: number;
  statusDistribution: Record<TaskStatus, number>;
  priorityDistribution: Record<TaskPriority, number>;
  averageCompletionTime: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  efficiency: number;
}

export class TaskService {
  private boards: Map<string, Board> = new Map();
  private taskCounter = 1;

  /**
   * Create a new board
   */
  async createBoard(name: string): Promise<Board> {
    if (!name || name.trim() === '') {
      throw new Error('Board name is required');
    }

    const boardId = this.generateBoardId();
    const board: Board = {
      id: boardId,
      name: name.trim(),
      tasks: new Map(),
      createdAt: new Date(),
    };

    this.boards.set(boardId, board);
    return board;
  }

  /**
   * Get board by ID
   */
  async getBoard(boardId: string): Promise<Board | null> {
    return this.boards.get(boardId) || null;
  }

  /**
   * Create a new task
   */
  async createTask(boardId: string, data: CreateTaskDTO): Promise<Task> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    if (!data.title || data.title.trim() === '') {
      throw new Error('Task title is required');
    }

    const taskId = this.generateTaskId();
    const now = new Date();

    const task: Task = {
      id: taskId,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      status: TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      assignee: data.assignee?.trim() || '',
      tags: data.tags || [],
      estimatedHours: data.estimatedHours || 0,
      actualHours: 0,
      createdAt: now,
      updatedAt: now,
      comments: [],
      history: [
        {
          field: 'created',
          oldValue: null,
          newValue: 'Task created',
          timestamp: now,
        },
      ],
    };

    board.tasks.set(taskId, task);
    return task;
  }

  /**
   * Get task by ID
   */
  async getTask(boardId: string, taskId: string): Promise<Task | null> {
    const board = this.boards.get(boardId);
    if (!board) {
      return null;
    }

    return board.tasks.get(taskId) || null;
  }

  /**
   * Get all tasks in a board
   */
  async getTasks(boardId: string): Promise<Task[]> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return Array.from(board.tasks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Update task
   */
  async updateTask(
    boardId: string,
    taskId: string,
    data: UpdateTaskDTO
  ): Promise<Task> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const task = board.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const now = new Date();

    // Track changes
    if (data.title !== undefined && data.title !== task.title) {
      if (!data.title.trim()) {
        throw new Error('Task title cannot be empty');
      }
      this.addHistory(task, 'title', task.title, data.title);
      task.title = data.title.trim();
    }

    if (data.description !== undefined && data.description !== task.description) {
      this.addHistory(task, 'description', task.description, data.description);
      task.description = data.description.trim();
    }

    if (data.assignee !== undefined && data.assignee !== task.assignee) {
      this.addHistory(task, 'assignee', task.assignee, data.assignee);
      task.assignee = data.assignee.trim();
    }

    if (data.priority !== undefined && data.priority !== task.priority) {
      this.addHistory(task, 'priority', task.priority, data.priority);
      task.priority = data.priority;
    }

    if (data.estimatedHours !== undefined && data.estimatedHours !== task.estimatedHours) {
      this.addHistory(
        task,
        'estimatedHours',
        String(task.estimatedHours),
        String(data.estimatedHours)
      );
      task.estimatedHours = data.estimatedHours;
    }

    if (data.actualHours !== undefined && data.actualHours !== task.actualHours) {
      this.addHistory(
        task,
        'actualHours',
        String(task.actualHours),
        String(data.actualHours)
      );
      task.actualHours = data.actualHours;
    }

    if (data.tags !== undefined) {
      this.addHistory(
        task,
        'tags',
        task.tags.join(', '),
        data.tags.join(', ')
      );
      task.tags = [...data.tags];
    }

    task.updatedAt = now;
    board.tasks.set(taskId, task);

    return task;
  }

  /**
   * Move task to a different status
   */
  async moveTask(
    boardId: string,
    taskId: string,
    newStatus: TaskStatus
  ): Promise<Task> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const task = board.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Validate status transition
    if (!Object.values(TaskStatus).includes(newStatus)) {
      throw new Error('Invalid task status');
    }

    const oldStatus = task.status;
    const now = new Date();

    task.status = newStatus;
    task.updatedAt = now;

    // Mark completion time when moved to DONE
    if (newStatus === TaskStatus.DONE && !task.completedAt) {
      task.completedAt = now;
    } else if (newStatus !== TaskStatus.DONE && task.completedAt) {
      task.completedAt = undefined;
    }

    this.addHistory(task, 'status', oldStatus, newStatus);

    board.tasks.set(taskId, task);
    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(boardId: string, taskId: string): Promise<boolean> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return board.tasks.delete(taskId);
  }

  /**
   * Add comment to task
   */
  async addComment(
    boardId: string,
    taskId: string,
    author: string,
    content: string
  ): Promise<Task> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const task = board.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!content || content.trim() === '') {
      throw new Error('Comment content is required');
    }

    const comment: Comment = {
      author: author.trim(),
      content: content.trim(),
      timestamp: new Date(),
    };

    task.comments.push(comment);
    task.updatedAt = new Date();

    board.tasks.set(taskId, task);
    return task;
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(boardId: string, status: TaskStatus): Promise<Task[]> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return Array.from(board.tasks.values())
      .filter((task) => task.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get tasks by assignee
   */
  async getTasksByAssignee(boardId: string, assignee: string): Promise<Task[]> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return Array.from(board.tasks.values())
      .filter((task) => task.assignee === assignee)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Search tasks
   */
  async searchTasks(boardId: string, keyword: string): Promise<Task[]> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const lowerKeyword = keyword.toLowerCase();

    return Array.from(board.tasks.values())
      .filter(
        (task) =>
          task.title.toLowerCase().includes(lowerKeyword) ||
          task.description.toLowerCase().includes(lowerKeyword) ||
          task.assignee.toLowerCase().includes(lowerKeyword) ||
          task.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get board statistics
   */
  async getBoardStatistics(boardId: string): Promise<BoardStatistics> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const tasks = Array.from(board.tasks.values());
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        totalTasks: 0,
        completionRate: 0,
        statusDistribution: {
          [TaskStatus.TODO]: 0,
          [TaskStatus.IN_PROGRESS]: 0,
          [TaskStatus.IN_REVIEW]: 0,
          [TaskStatus.DONE]: 0,
        },
        priorityDistribution: {
          [TaskPriority.LOW]: 0,
          [TaskPriority.MEDIUM]: 0,
          [TaskPriority.HIGH]: 0,
          [TaskPriority.URGENT]: 0,
        },
        averageCompletionTime: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        efficiency: 0,
      };
    }

    // Status distribution
    const statusDistribution = {
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.IN_REVIEW]: 0,
      [TaskStatus.DONE]: 0,
    };

    for (const task of tasks) {
      statusDistribution[task.status]++;
    }

    // Priority distribution
    const priorityDistribution = {
      [TaskPriority.LOW]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.URGENT]: 0,
    };

    for (const task of tasks) {
      priorityDistribution[task.priority]++;
    }

    // Completion rate
    const doneTasks = statusDistribution[TaskStatus.DONE];
    const completionRate = (doneTasks / totalTasks) * 100;

    // Hours
    const totalEstimatedHours = tasks.reduce(
      (sum, task) => sum + task.estimatedHours,
      0
    );
    const totalActualHours = tasks.reduce(
      (sum, task) => sum + task.actualHours,
      0
    );

    // Average completion time
    const completedTasks = tasks.filter((task) => task.completedAt);
    let averageCompletionTime = 0;

    if (completedTasks.length > 0) {
      const completionTimes = completedTasks.map((task) => {
        const created = task.createdAt.getTime();
        const completed = task.completedAt!.getTime();
        return (completed - created) / (1000 * 60 * 60); // hours
      });

      averageCompletionTime =
        completionTimes.reduce((sum, time) => sum + time, 0) /
        completionTimes.length;
    }

    // Efficiency
    const efficiency =
      totalActualHours > 0 ? (totalEstimatedHours / totalActualHours) * 100 : 0;

    return {
      totalTasks,
      completionRate: this.roundToTwo(completionRate),
      statusDistribution,
      priorityDistribution,
      averageCompletionTime: this.roundToTwo(averageCompletionTime),
      totalEstimatedHours: this.roundToTwo(totalEstimatedHours),
      totalActualHours: this.roundToTwo(totalActualHours),
      efficiency: this.roundToTwo(efficiency),
    };
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(
    boardId: string,
    priority: TaskPriority
  ): Promise<Task[]> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    return Array.from(board.tasks.values())
      .filter((task) => task.priority === priority)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Helper methods
  private generateBoardId(): string {
    return `board_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${this.taskCounter++}`;
  }

  private addHistory(
    task: Task,
    field: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    task.history.push({
      field,
      oldValue,
      newValue,
      timestamp: new Date(),
    });
  }

  private roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
  }

  // For testing purposes
  clear(): void {
    this.boards.clear();
    this.taskCounter = 1;
  }
}
