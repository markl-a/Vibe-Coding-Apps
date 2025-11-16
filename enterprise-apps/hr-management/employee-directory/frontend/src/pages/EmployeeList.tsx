import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Avatar,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
} from 'antd'
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { employeeApi, departmentApi, Employee } from '../services/api'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Option } = Select

const EmployeeList = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 獲取員工列表
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees', page, limit, search, departmentFilter, statusFilter],
    queryFn: () =>
      employeeApi.getAll({
        page,
        limit,
        search,
        department: departmentFilter,
        status: statusFilter,
      }),
  })

  // 獲取部門列表
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  // 創建員工
  const createMutation = useMutation({
    mutationFn: (data: Partial<Employee>) => employeeApi.create(data),
    onSuccess: () => {
      message.success('員工創建成功')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsModalVisible(false)
      form.resetFields()
    },
    onError: () => {
      message.error('創建失敗')
    },
  })

  // 更新員工
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.update(id, data),
    onSuccess: () => {
      message.success('員工更新成功')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsModalVisible(false)
      setEditingEmployee(null)
      form.resetFields()
    },
    onError: () => {
      message.error('更新失敗')
    },
  })

  // 刪除員工
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      message.success('員工刪除成功')
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: () => {
      message.error('刪除失敗')
    },
  })

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '確認刪除',
      content: '確定要刪除這名員工嗎？此操作無法撤銷。',
      onOk: () => deleteMutation.mutate(id),
    })
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    form.setFieldsValue({
      ...employee,
      hireDate: dayjs(employee.hireDate),
    })
    setIsModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        hireDate: values.hireDate.toISOString(),
      }

      if (editingEmployee) {
        updateMutation.mutate({ id: editingEmployee.id, data })
      } else {
        createMutation.mutate(data)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const statusColorMap: Record<string, string> = {
    ACTIVE: 'green',
    ON_LEAVE: 'orange',
    RESIGNED: 'red',
    TERMINATED: 'red',
  }

  const statusTextMap: Record<string, string> = {
    ACTIVE: '在職',
    ON_LEAVE: '請假中',
    RESIGNED: '已離職',
    TERMINATED: '已解僱',
  }

  const typeTextMap: Record<string, string> = {
    FULL_TIME: '全職',
    PART_TIME: '兼職',
    CONTRACT: '合約',
    INTERN: '實習',
  }

  const columns: ColumnsType<Employee> = [
    {
      title: '員工',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} size="large">
            {record.firstName[0]}
          </Avatar>
          <div>
            <div>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              {record.employeeNumber}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '郵箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '部門',
      dataIndex: ['department', 'name'],
      key: 'department',
    },
    {
      title: '職位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '類型',
      dataIndex: 'employeeType',
      key: 'type',
      render: (type: string) => typeTextMap[type] || type,
    },
    {
      title: '狀態',
      dataIndex: 'employmentStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status]}>
          {statusTextMap[status] || status}
        </Tag>
      ),
    },
    {
      title: '入職日期',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            刪除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        title="員工列表"
        extra={
          <Space>
            <Input
              placeholder="搜尋員工"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="篩選部門"
              style={{ width: 150 }}
              allowClear
              onChange={setDepartmentFilter}
            >
              {departmentsData?.data?.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="篩選狀態"
              style={{ width: 120 }}
              allowClear
              onChange={setStatusFilter}
            >
              <Option value="ACTIVE">在職</Option>
              <Option value="ON_LEAVE">請假中</Option>
              <Option value="RESIGNED">已離職</Option>
              <Option value="TERMINATED">已解僱</Option>
            </Select>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setEditingEmployee(null)
                form.resetFields()
                setIsModalVisible(true)
              }}
            >
              新增員工
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={employeesData?.data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: limit,
            total: employeesData?.data?.pagination?.total || 0,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        title={editingEmployee ? '編輯員工' : '新增員工'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingEmployee(null)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="firstName"
            label="名"
            rules={[{ required: true, message: '請輸入名' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="姓"
            rules={[{ required: true, message: '請輸入姓' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="郵箱"
            rules={[
              { required: true, message: '請輸入郵箱' },
              { type: 'email', message: '請輸入有效的郵箱' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="電話">
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label="部門">
            <Select>
              {departmentsData?.data?.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="position"
            label="職位"
            rules={[{ required: true, message: '請輸入職位' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="jobTitle"
            label="職稱"
            rules={[{ required: true, message: '請輸入職稱' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="employeeType" label="員工類型">
            <Select>
              <Option value="FULL_TIME">全職</Option>
              <Option value="PART_TIME">兼職</Option>
              <Option value="CONTRACT">合約</Option>
              <Option value="INTERN">實習</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="hireDate"
            label="入職日期"
            rules={[{ required: true, message: '請選擇入職日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="baseSalary" label="基本薪資">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default EmployeeList
