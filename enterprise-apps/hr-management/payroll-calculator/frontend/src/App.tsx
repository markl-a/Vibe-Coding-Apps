import { useState } from 'react'
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Descriptions,
  Statistic,
  Row,
  Col,
  Tabs,
} from 'antd'
import {
  DollarOutlined,
  CalculatorOutlined,
  CheckOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3003/api' })

function App() {
  const [employeeId] = useState('emp-001')
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: payrolls } = useQuery({
    queryKey: ['payrolls', employeeId],
    queryFn: () => api.get('/payroll', { params: { employeeId } }),
  })

  const { data: stats } = useQuery({
    queryKey: ['payroll-stats', selectedPeriod],
    queryFn: () => api.get('/payroll/stats', { params: { period: selectedPeriod } }),
  })

  const calculateMutation = useMutation({
    mutationFn: (data: any) => api.post('/payroll/calculate', data),
    onSuccess: () => {
      message.success('薪資計算完成')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] })
      setIsModalVisible(false)
      form.resetFields()
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/approve`),
    onSuccess: () => {
      message.success('薪資已批准')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })

  const paidMutation = useMutation({
    mutationFn: (id: string) => api.put(`/payroll/${id}/paid`),
    onSuccess: () => {
      message.success('已標記為已發放')
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })

  const handleCalculate = async () => {
    const values = await form.validateFields()
    calculateMutation.mutate({
      employeeId,
      period: values.period,
      baseSalary: values.baseSalary,
      allowances: [
        { type: '交通津貼', amount: values.transportAllowance || 0 },
        { type: '餐費津貼', amount: values.mealAllowance || 0 },
      ],
      bonus: values.bonus || 0,
      overtimePay: values.overtimePay || 0,
    })
  }

  const showDetail = (record: any) => {
    setSelectedPayroll(record)
  }

  const columns = [
    {
      title: '期間',
      dataIndex: 'period',
    },
    {
      title: '底薪',
      dataIndex: 'baseSalary',
      render: (val: any) => `$${Number(val).toLocaleString()}`,
    },
    {
      title: '總收入',
      dataIndex: 'totalEarnings',
      render: (val: any) => `$${Number(val).toLocaleString()}`,
    },
    {
      title: '總扣除',
      dataIndex: 'totalDeductions',
      render: (val: any) => `$${Number(val).toLocaleString()}`,
    },
    {
      title: '實發薪資',
      dataIndex: 'netSalary',
      render: (val: any) => (
        <strong style={{ color: '#52c41a' }}>
          ${Number(val).toLocaleString()}
        </strong>
      ),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      render: (status: string) => {
        const colorMap: any = {
          DRAFT: 'default',
          CALCULATED: 'blue',
          APPROVED: 'green',
          PAID: 'success',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => showDetail(record)}
          >
            詳情
          </Button>
          {record.status === 'CALCULATED' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => approveMutation.mutate(record.id)}
            >
              批准
            </Button>
          )}
          {record.status === 'APPROVED' && (
            <Button
              type="link"
              icon={<DollarOutlined />}
              onClick={() => paidMutation.mutate(record.id)}
            >
              已發放
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Tabs
        items={[
          {
            key: '1',
            label: '薪資管理',
            children: (
              <>
                {stats?.data && (
                  <Card style={{ marginBottom: 24 }}>
                    <Row gutter={16}>
                      <Col span={6}>
                        <Statistic
                          title="員工人數"
                          value={stats.data.employeeCount}
                          suffix="人"
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="總薪資支出"
                          value={stats.data.totalPayroll}
                          prefix="$"
                          precision={2}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="平均薪資"
                          value={stats.data.averageSalary}
                          prefix="$"
                          precision={2}
                        />
                      </Col>
                      <Col span={6}>
                        <Statistic
                          title="已發放"
                          value={stats.data.byStatus?.paid || 0}
                          suffix="筆"
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                <Card
                  title="薪資記錄"
                  extra={
                    <Space>
                      <Select
                        style={{ width: 150 }}
                        value={selectedPeriod}
                        onChange={setSelectedPeriod}
                      >
                        <Select.Option value="2024-01">2024-01</Select.Option>
                        <Select.Option value="2024-02">2024-02</Select.Option>
                        <Select.Option value="2024-03">2024-03</Select.Option>
                      </Select>
                      <Button
                        type="primary"
                        icon={<CalculatorOutlined />}
                        onClick={() => setIsModalVisible(true)}
                      >
                        計算薪資
                      </Button>
                    </Space>
                  }
                >
                  <Table
                    columns={columns}
                    dataSource={payrolls?.data || []}
                    rowKey="id"
                    pagination={false}
                  />
                </Card>
              </>
            ),
          },
        ]}
      />

      <Modal
        title="計算薪資"
        open={isModalVisible}
        onOk={handleCalculate}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="period" label="薪資期間" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="2024-01">2024-01</Select.Option>
              <Select.Option value="2024-02">2024-02</Select.Option>
              <Select.Option value="2024-03">2024-03</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="baseSalary"
            label="底薪"
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item name="transportAllowance" label="交通津貼">
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item name="mealAllowance" label="餐費津貼">
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item name="bonus" label="獎金">
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
          </Form.Item>
          <Form.Item name="overtimePay" label="加班費">
            <InputNumber style={{ width: '100%' }} min={0} prefix="$" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="薪資詳情"
        open={!!selectedPayroll}
        onCancel={() => setSelectedPayroll(null)}
        footer={null}
        width={700}
      >
        {selectedPayroll && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="期間" span={2}>
              {selectedPayroll.period}
            </Descriptions.Item>
            <Descriptions.Item label="底薪">
              ${Number(selectedPayroll.baseSalary).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="獎金">
              ${Number(selectedPayroll.bonus).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="加班費">
              ${Number(selectedPayroll.overtimePay).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="總收入">
              <strong>
                ${Number(selectedPayroll.totalEarnings).toLocaleString()}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="個人所得稅">
              ${Number(selectedPayroll.tax).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="社會保險">
              ${Number(selectedPayroll.socialInsurance).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="住房公積金">
              ${Number(selectedPayroll.housingFund).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="總扣除">
              ${Number(selectedPayroll.totalDeductions).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="實發薪資" span={2}>
              <strong style={{ fontSize: '18px', color: '#52c41a' }}>
                ${Number(selectedPayroll.netSalary).toLocaleString()}
              </strong>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default App
