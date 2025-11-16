import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  departmentId?: string
  department?: Department
  position: string
  jobTitle: string
  employeeType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'
  hireDate: string
  baseSalary?: number
  managerId?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
  }
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  parentId?: string
  managerId?: string
  manager?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const employeeApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    department?: string
    status?: string
  }) => api.get<PaginatedResponse<Employee>>('/employees', { params }),

  getById: (id: string) => api.get<Employee>(`/employees/${id}`),

  create: (data: Partial<Employee>) => api.post<Employee>('/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<Employee>(`/employees/${id}`, data),

  delete: (id: string) => api.delete(`/employees/${id}`),

  getStatistics: () => api.get('/employees/statistics'),
}

export const departmentApi = {
  getAll: () => api.get<Department[]>('/departments'),

  getById: (id: string) => api.get<Department>(`/departments/${id}`),

  create: (data: Partial<Department>) =>
    api.post<Department>('/departments', data),

  update: (id: string, data: Partial<Department>) =>
    api.put<Department>(`/departments/${id}`, data),

  delete: (id: string) => api.delete(`/departments/${id}`),

  getTree: () => api.get('/departments/tree'),
}
