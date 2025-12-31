import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaskService,
  TaskStatus,
  TaskPriority,
  CreateTaskDTO,
  UpdateTaskDTO,
} from '../services/task.service';

describe('TaskService', () => {
  let service: TaskService;
  let boardId: string;

  beforeEach(async () => {
    service = new TaskService();
    const board = await service.createBoard('Test Board');
    boardId = board.id;
  });

  describe('Board Management', () => {
    describe('createBoard', () => {
      it('should create a board with valid name', async () => {
        const board = await service.createBoard('My Project Board');

        expect(board).toBeDefined();
        expect(board.id).toBeTruthy();
        expect(board.name).toBe('My Project Board');
        expect(board.createdAt).toBeInstanceOf(Date);
        expect(board.tasks).toBeInstanceOf(Map);
      });

      it('should trim board name', async () => {
        const board = await service.createBoard('   Trimmed Board   ');

        expect(board.name).toBe('Trimmed Board');
      });

      it('should throw error for empty board name', async () => {
        await expect(service.createBoard('')).rejects.toThrow(
          'Board name is required'
        );
      });

      it('should throw error for whitespace-only board name', async () => {
        await expect(service.createBoard('   ')).rejects.toThrow(
          'Board name is required'
        );
      });

      it('should create multiple boards with unique IDs', async () => {
        const board1 = await service.createBoard('Board 1');
        const board2 = await service.createBoard('Board 2');
        const board3 = await service.createBoard('Board 3');

        expect(board1.id).not.toBe(board2.id);
        expect(board2.id).not.toBe(board3.id);
        expect(board1.id).not.toBe(board3.id);
      });
    });

    describe('getBoard', () => {
      it('should retrieve existing board', async () => {
        const created = await service.createBoard('Test Board');
        const retrieved = await service.getBoard(created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.name).toBe('Test Board');
      });

      it('should return null for non-existent board', async () => {
        const board = await service.getBoard('non_existent_id');

        expect(board).toBeNull();
      });
    });
  });

  describe('Task CRUD Operations', () => {
    describe('createTask', () => {
      it('should create task with all fields', async () => {
        const taskData: CreateTaskDTO = {
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication',
          assignee: 'John Doe',
          priority: TaskPriority.HIGH,
          estimatedHours: 8,
          tags: ['backend', 'security'],
        };

        const task = await service.createTask(boardId, taskData);

        expect(task).toBeDefined();
        expect(task.id).toBeTruthy();
        expect(task.title).toBe('Implement user authentication');
        expect(task.description).toBe('Add JWT-based authentication');
        expect(task.assignee).toBe('John Doe');
        expect(task.priority).toBe(TaskPriority.HIGH);
        expect(task.estimatedHours).toBe(8);
        expect(task.tags).toEqual(['backend', 'security']);
        expect(task.status).toBe(TaskStatus.TODO);
        expect(task.actualHours).toBe(0);
        expect(task.createdAt).toBeInstanceOf(Date);
        expect(task.updatedAt).toBeInstanceOf(Date);
        expect(task.comments).toHaveLength(0);
        expect(task.history).toHaveLength(1);
        expect(task.history[0].field).toBe('created');
      });

      it('should create task with minimal required fields', async () => {
        const task = await service.createTask(boardId, {
          title: 'Simple Task',
        });

        expect(task.title).toBe('Simple Task');
        expect(task.description).toBe('');
        expect(task.assignee).toBe('');
        expect(task.priority).toBe(TaskPriority.MEDIUM);
        expect(task.estimatedHours).toBe(0);
        expect(task.tags).toEqual([]);
        expect(task.status).toBe(TaskStatus.TODO);
      });

      it('should trim task title and description', async () => {
        const task = await service.createTask(boardId, {
          title: '   Trimmed Title   ',
          description: '   Trimmed Description   ',
        });

        expect(task.title).toBe('Trimmed Title');
        expect(task.description).toBe('Trimmed Description');
      });

      it('should throw error for empty task title', async () => {
        await expect(
          service.createTask(boardId, { title: '' })
        ).rejects.toThrow('Task title is required');
      });

      it('should throw error for whitespace-only task title', async () => {
        await expect(
          service.createTask(boardId, { title: '   ' })
        ).rejects.toThrow('Task title is required');
      });

      it('should throw error when board does not exist', async () => {
        await expect(
          service.createTask('non_existent_board', { title: 'Task' })
        ).rejects.toThrow('Board not found');
      });

      it('should generate unique task IDs', async () => {
        const task1 = await service.createTask(boardId, { title: 'Task 1' });
        const task2 = await service.createTask(boardId, { title: 'Task 2' });
        const task3 = await service.createTask(boardId, { title: 'Task 3' });

        expect(task1.id).not.toBe(task2.id);
        expect(task2.id).not.toBe(task3.id);
        expect(task1.id).not.toBe(task3.id);
      });
    });

    describe('getTask', () => {
      it('should retrieve existing task', async () => {
        const created = await service.createTask(boardId, {
          title: 'Test Task',
          description: 'Test Description',
        });

        const retrieved = await service.getTask(boardId, created.id);

        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(created.id);
        expect(retrieved?.title).toBe('Test Task');
      });

      it('should return null for non-existent task', async () => {
        const task = await service.getTask(boardId, 'non_existent_id');

        expect(task).toBeNull();
      });

      it('should return null for task in different board', async () => {
        const board2 = await service.createBoard('Board 2');
        const task = await service.createTask(boardId, { title: 'Task 1' });

        const retrieved = await service.getTask(board2.id, task.id);

        expect(retrieved).toBeNull();
      });
    });

    describe('getTasks', () => {
      it('should get all tasks in a board', async () => {
        await service.createTask(boardId, { title: 'Task 1' });
        await service.createTask(boardId, { title: 'Task 2' });
        await service.createTask(boardId, { title: 'Task 3' });

        const tasks = await service.getTasks(boardId);

        expect(tasks).toHaveLength(3);
      });

      it('should return tasks sorted by creation date (newest first)', async () => {
        const task1 = await service.createTask(boardId, { title: 'Task 1' });
        const task2 = await service.createTask(boardId, { title: 'Task 2' });
        const task3 = await service.createTask(boardId, { title: 'Task 3' });

        const tasks = await service.getTasks(boardId);

        expect(tasks[0].id).toBe(task3.id);
        expect(tasks[1].id).toBe(task2.id);
        expect(tasks[2].id).toBe(task1.id);
      });

      it('should return empty array for board with no tasks', async () => {
        const tasks = await service.getTasks(boardId);

        expect(tasks).toHaveLength(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(service.getTasks('non_existent_board')).rejects.toThrow(
          'Board not found'
        );
      });
    });

    describe('updateTask', () => {
      it('should update task title', async () => {
        const task = await service.createTask(boardId, { title: 'Original Title' });

        const updated = await service.updateTask(boardId, task.id, {
          title: 'Updated Title',
        });

        expect(updated.title).toBe('Updated Title');
        expect(updated.updatedAt.getTime()).toBeGreaterThan(
          task.updatedAt.getTime()
        );
      });

      it('should update multiple fields', async () => {
        const task = await service.createTask(boardId, {
          title: 'Original',
          description: 'Original desc',
          assignee: 'John',
        });

        const updated = await service.updateTask(boardId, task.id, {
          title: 'Updated',
          description: 'Updated desc',
          assignee: 'Jane',
          priority: TaskPriority.HIGH,
          estimatedHours: 10,
        });

        expect(updated.title).toBe('Updated');
        expect(updated.description).toBe('Updated desc');
        expect(updated.assignee).toBe('Jane');
        expect(updated.priority).toBe(TaskPriority.HIGH);
        expect(updated.estimatedHours).toBe(10);
      });

      it('should track changes in history', async () => {
        const task = await service.createTask(boardId, { title: 'Original' });

        await service.updateTask(boardId, task.id, { title: 'Updated' });

        const updated = await service.getTask(boardId, task.id);
        expect(updated?.history.length).toBeGreaterThan(1);

        const titleChange = updated?.history.find((h) => h.field === 'title');
        expect(titleChange).toBeDefined();
        expect(titleChange?.oldValue).toBe('Original');
        expect(titleChange?.newValue).toBe('Updated');
      });

      it('should throw error when updating with empty title', async () => {
        const task = await service.createTask(boardId, { title: 'Original' });

        await expect(
          service.updateTask(boardId, task.id, { title: '' })
        ).rejects.toThrow('Task title cannot be empty');
      });

      it('should throw error for non-existent task', async () => {
        await expect(
          service.updateTask(boardId, 'non_existent_id', { title: 'Updated' })
        ).rejects.toThrow('Task not found');
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.updateTask('non_existent_board', 'task_id', { title: 'Updated' })
        ).rejects.toThrow('Board not found');
      });

      it('should update actual hours', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        const updated = await service.updateTask(boardId, task.id, {
          actualHours: 5.5,
        });

        expect(updated.actualHours).toBe(5.5);
      });

      it('should update tags', async () => {
        const task = await service.createTask(boardId, {
          title: 'Task',
          tags: ['tag1', 'tag2'],
        });

        const updated = await service.updateTask(boardId, task.id, {
          tags: ['tag3', 'tag4', 'tag5'],
        });

        expect(updated.tags).toEqual(['tag3', 'tag4', 'tag5']);
      });
    });

    describe('deleteTask', () => {
      it('should delete existing task', async () => {
        const task = await service.createTask(boardId, { title: 'To Delete' });

        const deleted = await service.deleteTask(boardId, task.id);

        expect(deleted).toBe(true);

        const retrieved = await service.getTask(boardId, task.id);
        expect(retrieved).toBeNull();
      });

      it('should return false for non-existent task', async () => {
        const deleted = await service.deleteTask(boardId, 'non_existent_id');

        expect(deleted).toBe(false);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.deleteTask('non_existent_board', 'task_id')
        ).rejects.toThrow('Board not found');
      });
    });
  });

  describe('Status Transitions', () => {
    describe('moveTask', () => {
      it('should move task to IN_PROGRESS', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        const moved = await service.moveTask(
          boardId,
          task.id,
          TaskStatus.IN_PROGRESS
        );

        expect(moved.status).toBe(TaskStatus.IN_PROGRESS);
        expect(moved.completedAt).toBeUndefined();
      });

      it('should move task through workflow stages', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        let updated = await service.moveTask(boardId, task.id, TaskStatus.IN_PROGRESS);
        expect(updated.status).toBe(TaskStatus.IN_PROGRESS);

        updated = await service.moveTask(boardId, task.id, TaskStatus.IN_REVIEW);
        expect(updated.status).toBe(TaskStatus.IN_REVIEW);

        updated = await service.moveTask(boardId, task.id, TaskStatus.DONE);
        expect(updated.status).toBe(TaskStatus.DONE);
        expect(updated.completedAt).toBeInstanceOf(Date);
      });

      it('should set completedAt when moved to DONE', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        const moved = await service.moveTask(boardId, task.id, TaskStatus.DONE);

        expect(moved.status).toBe(TaskStatus.DONE);
        expect(moved.completedAt).toBeInstanceOf(Date);
      });

      it('should clear completedAt when moved back from DONE', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await service.moveTask(boardId, task.id, TaskStatus.DONE);
        const moved = await service.moveTask(boardId, task.id, TaskStatus.IN_PROGRESS);

        expect(moved.status).toBe(TaskStatus.IN_PROGRESS);
        expect(moved.completedAt).toBeUndefined();
      });

      it('should track status changes in history', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await service.moveTask(boardId, task.id, TaskStatus.IN_PROGRESS);

        const retrieved = await service.getTask(boardId, task.id);
        const statusChange = retrieved?.history.find((h) => h.field === 'status');

        expect(statusChange).toBeDefined();
        expect(statusChange?.oldValue).toBe(TaskStatus.TODO);
        expect(statusChange?.newValue).toBe(TaskStatus.IN_PROGRESS);
      });

      it('should throw error for invalid status', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await expect(
          service.moveTask(boardId, task.id, 'INVALID_STATUS' as TaskStatus)
        ).rejects.toThrow('Invalid task status');
      });

      it('should throw error for non-existent task', async () => {
        await expect(
          service.moveTask(boardId, 'non_existent_id', TaskStatus.DONE)
        ).rejects.toThrow('Task not found');
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.moveTask('non_existent_board', 'task_id', TaskStatus.DONE)
        ).rejects.toThrow('Board not found');
      });

      it('should allow moving task back to TODO', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await service.moveTask(boardId, task.id, TaskStatus.IN_PROGRESS);
        const moved = await service.moveTask(boardId, task.id, TaskStatus.TODO);

        expect(moved.status).toBe(TaskStatus.TODO);
      });
    });

    describe('getTasksByStatus', () => {
      beforeEach(async () => {
        await service.createTask(boardId, { title: 'Task 1' });
        const task2 = await service.createTask(boardId, { title: 'Task 2' });
        await service.moveTask(boardId, task2.id, TaskStatus.IN_PROGRESS);
        const task3 = await service.createTask(boardId, { title: 'Task 3' });
        await service.moveTask(boardId, task3.id, TaskStatus.DONE);
      });

      it('should get tasks by TODO status', async () => {
        const tasks = await service.getTasksByStatus(boardId, TaskStatus.TODO);

        expect(tasks).toHaveLength(1);
        expect(tasks.every((t) => t.status === TaskStatus.TODO)).toBe(true);
      });

      it('should get tasks by IN_PROGRESS status', async () => {
        const tasks = await service.getTasksByStatus(
          boardId,
          TaskStatus.IN_PROGRESS
        );

        expect(tasks).toHaveLength(1);
        expect(tasks.every((t) => t.status === TaskStatus.IN_PROGRESS)).toBe(true);
      });

      it('should get tasks by DONE status', async () => {
        const tasks = await service.getTasksByStatus(boardId, TaskStatus.DONE);

        expect(tasks).toHaveLength(1);
        expect(tasks.every((t) => t.status === TaskStatus.DONE)).toBe(true);
      });

      it('should return empty array for status with no tasks', async () => {
        const tasks = await service.getTasksByStatus(
          boardId,
          TaskStatus.IN_REVIEW
        );

        expect(tasks).toHaveLength(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.getTasksByStatus('non_existent_board', TaskStatus.TODO)
        ).rejects.toThrow('Board not found');
      });
    });
  });

  describe('Task Assignment and Filtering', () => {
    describe('getTasksByAssignee', () => {
      beforeEach(async () => {
        await service.createTask(boardId, { title: 'Task 1', assignee: 'Alice' });
        await service.createTask(boardId, { title: 'Task 2', assignee: 'Bob' });
        await service.createTask(boardId, { title: 'Task 3', assignee: 'Alice' });
      });

      it('should get tasks assigned to specific user', async () => {
        const tasks = await service.getTasksByAssignee(boardId, 'Alice');

        expect(tasks).toHaveLength(2);
        expect(tasks.every((t) => t.assignee === 'Alice')).toBe(true);
      });

      it('should return empty array for unassigned user', async () => {
        const tasks = await service.getTasksByAssignee(boardId, 'Charlie');

        expect(tasks).toHaveLength(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.getTasksByAssignee('non_existent_board', 'Alice')
        ).rejects.toThrow('Board not found');
      });
    });

    describe('getTasksByPriority', () => {
      beforeEach(async () => {
        await service.createTask(boardId, {
          title: 'Task 1',
          priority: TaskPriority.HIGH,
        });
        await service.createTask(boardId, {
          title: 'Task 2',
          priority: TaskPriority.LOW,
        });
        await service.createTask(boardId, {
          title: 'Task 3',
          priority: TaskPriority.HIGH,
        });
      });

      it('should get tasks by priority', async () => {
        const tasks = await service.getTasksByPriority(
          boardId,
          TaskPriority.HIGH
        );

        expect(tasks).toHaveLength(2);
        expect(tasks.every((t) => t.priority === TaskPriority.HIGH)).toBe(true);
      });

      it('should return empty array for priority with no tasks', async () => {
        const tasks = await service.getTasksByPriority(
          boardId,
          TaskPriority.URGENT
        );

        expect(tasks).toHaveLength(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.getTasksByPriority('non_existent_board', TaskPriority.HIGH)
        ).rejects.toThrow('Board not found');
      });
    });

    describe('searchTasks', () => {
      beforeEach(async () => {
        await service.createTask(boardId, {
          title: 'Implement authentication',
          description: 'Add JWT support',
          assignee: 'Alice',
          tags: ['backend', 'security'],
        });
        await service.createTask(boardId, {
          title: 'Design UI',
          description: 'Create wireframes',
          assignee: 'Bob',
          tags: ['frontend', 'design'],
        });
        await service.createTask(boardId, {
          title: 'Setup database',
          description: 'Configure PostgreSQL',
          assignee: 'Alice',
          tags: ['backend', 'database'],
        });
      });

      it('should search tasks by title', async () => {
        const tasks = await service.searchTasks(boardId, 'authentication');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toContain('authentication');
      });

      it('should search tasks by description', async () => {
        const tasks = await service.searchTasks(boardId, 'wireframes');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].description).toContain('wireframes');
      });

      it('should search tasks by assignee', async () => {
        const tasks = await service.searchTasks(boardId, 'Alice');

        expect(tasks).toHaveLength(2);
        expect(tasks.every((t) => t.assignee === 'Alice')).toBe(true);
      });

      it('should search tasks by tags', async () => {
        const tasks = await service.searchTasks(boardId, 'backend');

        expect(tasks).toHaveLength(2);
        expect(tasks.every((t) => t.tags.includes('backend'))).toBe(true);
      });

      it('should be case-insensitive', async () => {
        const tasks1 = await service.searchTasks(boardId, 'ALICE');
        const tasks2 = await service.searchTasks(boardId, 'alice');
        const tasks3 = await service.searchTasks(boardId, 'Alice');

        expect(tasks1).toEqual(tasks2);
        expect(tasks2).toEqual(tasks3);
      });

      it('should return empty array for no matches', async () => {
        const tasks = await service.searchTasks(boardId, 'nonexistent');

        expect(tasks).toHaveLength(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.searchTasks('non_existent_board', 'search')
        ).rejects.toThrow('Board not found');
      });
    });
  });

  describe('Comments', () => {
    describe('addComment', () => {
      it('should add comment to task', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        const updated = await service.addComment(
          boardId,
          task.id,
          'John Doe',
          'This is a comment'
        );

        expect(updated.comments).toHaveLength(1);
        expect(updated.comments[0].author).toBe('John Doe');
        expect(updated.comments[0].content).toBe('This is a comment');
        expect(updated.comments[0].timestamp).toBeInstanceOf(Date);
      });

      it('should add multiple comments', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await service.addComment(boardId, task.id, 'Alice', 'First comment');
        await service.addComment(boardId, task.id, 'Bob', 'Second comment');
        const updated = await service.addComment(
          boardId,
          task.id,
          'Charlie',
          'Third comment'
        );

        expect(updated.comments).toHaveLength(3);
      });

      it('should trim comment content', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        const updated = await service.addComment(
          boardId,
          task.id,
          '  John  ',
          '  Comment  '
        );

        expect(updated.comments[0].author).toBe('John');
        expect(updated.comments[0].content).toBe('Comment');
      });

      it('should throw error for empty comment', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await expect(
          service.addComment(boardId, task.id, 'John', '')
        ).rejects.toThrow('Comment content is required');
      });

      it('should throw error for whitespace-only comment', async () => {
        const task = await service.createTask(boardId, { title: 'Task' });

        await expect(
          service.addComment(boardId, task.id, 'John', '   ')
        ).rejects.toThrow('Comment content is required');
      });

      it('should throw error for non-existent task', async () => {
        await expect(
          service.addComment(boardId, 'non_existent_id', 'John', 'Comment')
        ).rejects.toThrow('Task not found');
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.addComment('non_existent_board', 'task_id', 'John', 'Comment')
        ).rejects.toThrow('Board not found');
      });
    });
  });

  describe('Board Statistics', () => {
    describe('getBoardStatistics', () => {
      it('should return zero statistics for empty board', async () => {
        const stats = await service.getBoardStatistics(boardId);

        expect(stats.totalTasks).toBe(0);
        expect(stats.completionRate).toBe(0);
        expect(stats.averageCompletionTime).toBe(0);
        expect(stats.totalEstimatedHours).toBe(0);
        expect(stats.totalActualHours).toBe(0);
        expect(stats.efficiency).toBe(0);
      });

      it('should calculate status distribution', async () => {
        await service.createTask(boardId, { title: 'Task 1' });
        const task2 = await service.createTask(boardId, { title: 'Task 2' });
        await service.moveTask(boardId, task2.id, TaskStatus.IN_PROGRESS);
        const task3 = await service.createTask(boardId, { title: 'Task 3' });
        await service.moveTask(boardId, task3.id, TaskStatus.DONE);

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.statusDistribution[TaskStatus.TODO]).toBe(1);
        expect(stats.statusDistribution[TaskStatus.IN_PROGRESS]).toBe(1);
        expect(stats.statusDistribution[TaskStatus.IN_REVIEW]).toBe(0);
        expect(stats.statusDistribution[TaskStatus.DONE]).toBe(1);
      });

      it('should calculate priority distribution', async () => {
        await service.createTask(boardId, {
          title: 'Task 1',
          priority: TaskPriority.HIGH,
        });
        await service.createTask(boardId, {
          title: 'Task 2',
          priority: TaskPriority.HIGH,
        });
        await service.createTask(boardId, {
          title: 'Task 3',
          priority: TaskPriority.LOW,
        });

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.priorityDistribution[TaskPriority.HIGH]).toBe(2);
        expect(stats.priorityDistribution[TaskPriority.MEDIUM]).toBe(0);
        expect(stats.priorityDistribution[TaskPriority.LOW]).toBe(1);
        expect(stats.priorityDistribution[TaskPriority.URGENT]).toBe(0);
      });

      it('should calculate completion rate', async () => {
        await service.createTask(boardId, { title: 'Task 1' });
        const task2 = await service.createTask(boardId, { title: 'Task 2' });
        await service.moveTask(boardId, task2.id, TaskStatus.DONE);
        const task3 = await service.createTask(boardId, { title: 'Task 3' });
        await service.moveTask(boardId, task3.id, TaskStatus.DONE);

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.totalTasks).toBe(3);
        expect(stats.completionRate).toBe(66.67);
      });

      it('should calculate total estimated and actual hours', async () => {
        await service.createTask(boardId, {
          title: 'Task 1',
          estimatedHours: 8,
        });
        const task2 = await service.createTask(boardId, {
          title: 'Task 2',
          estimatedHours: 12,
        });
        await service.updateTask(boardId, task2.id, { actualHours: 10 });

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.totalEstimatedHours).toBe(20);
        expect(stats.totalActualHours).toBe(10);
      });

      it('should calculate efficiency', async () => {
        const task1 = await service.createTask(boardId, {
          title: 'Task 1',
          estimatedHours: 10,
        });
        await service.updateTask(boardId, task1.id, { actualHours: 8 });

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.efficiency).toBe(125); // (10/8) * 100
      });

      it('should calculate average completion time for completed tasks', async () => {
        const task1 = await service.createTask(boardId, { title: 'Task 1' });
        await service.moveTask(boardId, task1.id, TaskStatus.DONE);

        const stats = await service.getBoardStatistics(boardId);

        expect(stats.averageCompletionTime).toBeGreaterThanOrEqual(0);
      });

      it('should throw error for non-existent board', async () => {
        await expect(
          service.getBoardStatistics('non_existent_board')
        ).rejects.toThrow('Board not found');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task titles', async () => {
      const longTitle = 'A'.repeat(500);
      const task = await service.createTask(boardId, { title: longTitle });

      expect(task.title).toBe(longTitle);
    });

    it('should handle special characters in task data', async () => {
      const task = await service.createTask(boardId, {
        title: 'Task & Test <Special> "Chars"',
        description: 'Description & Test <Special> "Chars"',
        assignee: "O'Brien",
      });

      expect(task.title).toBe('Task & Test <Special> "Chars"');
      expect(task.description).toBe('Description & Test <Special> "Chars"');
      expect(task.assignee).toBe("O'Brien");
    });

    it('should handle unicode characters', async () => {
      const task = await service.createTask(boardId, {
        title: '實現用戶登入',
        description: '使用 JWT 認證',
        assignee: '張三',
        tags: ['後端', '安全'],
      });

      expect(task.title).toBe('實現用戶登入');
      expect(task.description).toBe('使用 JWT 認證');
      expect(task.assignee).toBe('張三');
      expect(task.tags).toEqual(['後端', '安全']);
    });

    it('should handle decimal estimated hours', async () => {
      const task = await service.createTask(boardId, {
        title: 'Task',
        estimatedHours: 7.5,
      });

      expect(task.estimatedHours).toBe(7.5);
    });

    it('should handle decimal actual hours', async () => {
      const task = await service.createTask(boardId, { title: 'Task' });

      const updated = await service.updateTask(boardId, task.id, {
        actualHours: 3.25,
      });

      expect(updated.actualHours).toBe(3.25);
    });

    it('should maintain task history across multiple updates', async () => {
      const task = await service.createTask(boardId, { title: 'Task' });

      await service.updateTask(boardId, task.id, { title: 'Updated 1' });
      await service.updateTask(boardId, task.id, { title: 'Updated 2' });
      await service.moveTask(boardId, task.id, TaskStatus.IN_PROGRESS);
      await service.addComment(boardId, task.id, 'User', 'Comment');

      const updated = await service.getTask(boardId, task.id);

      expect(updated?.history.length).toBeGreaterThan(3);
    });

    it('should handle concurrent task creation', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.createTask(boardId, { title: `Task ${i}` })
      );

      const tasks = await Promise.all(promises);

      expect(tasks).toHaveLength(10);

      // Verify all IDs are unique
      const ids = new Set(tasks.map((t) => t.id));
      expect(ids.size).toBe(10);
    });
  });
});
