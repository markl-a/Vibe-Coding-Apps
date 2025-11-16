import { useState } from 'react'
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import dayjs from 'dayjs'

const api = axios.create({ baseURL: 'http://localhost:3002/api' })

const leaveTypeMap: Record<string, string> = {
  ANNUAL: '年假',
  SICK: '病假',
  PERSONAL: '事假',
  MARRIAGE: '婚假',
  MATERNITY: '產假',
  PATERNITY: '陪產假',
  BEREAVEMENT: '喪假',
  UNPAID: '無薪假',
}

function App() {
  const [employeeId] = useState('emp-001')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: requests } = useQuery({
    queryKey: ['leaves', employeeId],
    queryFn: () => api.get('/leaves', { params: { employeeId } }),
  })

  const { data: balances } = useQuery({
    queryKey: ['balances', employeeId],
    queryFn: () =>
      api.get('/leaves/balance', {
        params: { employeeId, year: new Date().getFullYear() },
      }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/leaves', data),
    onSuccess: () => {
      message.success('請假申請已提交')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['balances'] })
      setIsModalVisible(false)
      form.resetFields()
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/leaves/${id}/approve`, { approverId: 'manager-001' }),
    onSuccess: () => {
      message.success('已批准請假')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.put(`/leaves/${id}/reject`, {
        approverId: 'manager-001',
        rejectionReason: '業務繁忙',
      }),
    onSuccess: () => {
      message.success('已拒絕請假')
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
  })

  const handleSubmit = async () => {
    const values = await form.validateFields()
    createMutation.mutate({
      employeeId,
      leaveType: values.leaveType,
      startDate: values.dates[0].toISOString(),
      endDate: values.dates[1].toISOString(),
      reason: values.reason,
    })
  }

  const columns = [
    {
      title: '假期類型',
      dataIndex: 'leaveType',
      render: (type: string) => leaveTypeMap[type],
    },
    {
      title: '開始日期',
      dataIndex: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '結束日期',
      dataIndex: 'endDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '天數',
      dataIndex: 'days',
      render: (days: number) => `${days} 天`,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: true,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      render: (status: string) => {
        const colorMap: any = {
          PENDING: 'orange',
          APPROVED: 'green',
          REJECTED: 'red',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: '操作',
      render: (_: any, record: any) =>
        record.status === 'PENDING' ? (
          <Space>
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => approveMutation.mutate(record.id)}
            >
              批准
            </Button>
            <Button
              type="link"
              danger
              icon={<CloseOutlined />}
              onClick={() => rejectMutation.mutate(record.id)}
            >
              拒絕
            </Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card title="假期餘額" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          {balances?.data?.map((balance: any) => (
            <Col span={6} key={balance.leaveType}>
              <Statistic
                title={leaveTypeMap[balance.leaveType]}
                value={balance.available}
                suffix={`/ ${balance.total} 天`}
                valueStyle={{
                  color: balance.available < 3 ? '#cf1322' : '#3f8600',
                }}
              />
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title="請假記錄"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            申請請假
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={requests?.data || []}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title="申請請假"
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="leaveType"
            label="假期類型"
            rules={[{ required: true }]}
          >
            <Select>
              {Object.entries(leaveTypeMap).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dates" label="日期範圍" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="請假原因" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default App
