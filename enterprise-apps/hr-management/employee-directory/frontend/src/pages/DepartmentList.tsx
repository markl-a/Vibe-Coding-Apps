import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Card, Button, Space, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { departmentApi, Department } from '../services/api'

const DepartmentList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Department>) => departmentApi.create(data),
    onSuccess: () => {
      message.success('部門創建成功')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setIsModalVisible(false)
      form.resetFields()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentApi.update(id, data),
    onSuccess: () => {
      message.success('部門更新成功')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setIsModalVisible(false)
      setEditingDepartment(null)
      form.resetFields()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.delete(id),
    onSuccess: () => {
      message.success('部門刪除成功')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingDepartment) {
        updateMutation.mutate({ id: editingDepartment.id, data: values })
      } else {
        createMutation.mutate(values)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns = [
    { title: '部門名稱', dataIndex: 'name', key: 'name' },
    { title: '部門代碼', dataIndex: 'code', key: 'code' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '員工數',
      dataIndex: ['_count', 'employees'],
      key: 'employeeCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Department) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDepartment(record)
              form.setFieldsValue(record)
              setIsModalVisible(true)
            }}
          >
            編輯
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '確認刪除',
                content: '確定要刪除此部門嗎？',
                onOk: () => deleteMutation.mutate(record.id),
              })
            }}
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
        title="部門列表"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingDepartment(null)
              form.resetFields()
              setIsModalVisible(true)
            }}
          >
            新增部門
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingDepartment ? '編輯部門' : '新增部門'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          setEditingDepartment(null)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="部門名稱"
            rules={[{ required: true, message: '請輸入部門名稱' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="code"
            label="部門代碼"
            rules={[{ required: true, message: '請輸入部門代碼' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default DepartmentList
