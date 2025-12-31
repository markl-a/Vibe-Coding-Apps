import { useState } from 'react'
import { Card, Button, Space, Table, Tag, message, DatePicker } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import dayjs, { Dayjs } from 'dayjs'
import { getErrorMessage } from '@vibe/shared-utils'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
})

function App() {
  const [employeeId] = useState('emp-001') // 示例員工ID
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])
  const queryClient = useQueryClient()

  const checkInMutation = useMutation({
    mutationFn: () =>
      api.post('/attendance/check-in', {
        employeeId,
        location: { latitude: 25.033, longitude: 121.565 },
      }),
    onSuccess: () => {
      message.success('上班打卡成功')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message.error(error.response.data.error)
      } else {
        message.error(getErrorMessage(error) || '打卡失敗')
      }
    },
  })

  const checkOutMutation = useMutation({
    mutationFn: () =>
      api.post('/attendance/check-out', {
        employeeId,
        location: { latitude: 25.033, longitude: 121.565 },
      }),
    onSuccess: () => {
      message.success('下班打卡成功')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        message.error(error.response.data.error)
      } else {
        message.error(getErrorMessage(error) || '打卡失敗')
      }
    },
  })

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', employeeId, dateRange],
    queryFn: () =>
      api.get('/attendance', {
        params: {
          employeeId,
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
        },
      }),
  })

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '上班時間',
      dataIndex: 'checkIn',
      render: (time: string) => (time ? dayjs(time).format('HH:mm:ss') : '-'),
    },
    {
      title: '下班時間',
      dataIndex: 'checkOut',
      render: (time: string) => (time ? dayjs(time).format('HH:mm:ss') : '-'),
    },
    {
      title: '工時',
      dataIndex: 'workHours',
      render: (hours: number) => `${hours.toFixed(1)} 小時`,
    },
    {
      title: '狀態',
      dataIndex: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PRESENT: 'green',
          LATE: 'orange',
          ABSENT: 'red',
          EARLY_LEAVE: 'orange',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card title="考勤打卡系統">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => checkInMutation.mutate()}
              loading={checkInMutation.isPending}
            >
              上班打卡
            </Button>
            <Button
              size="large"
              icon={<ClockCircleOutlined />}
              onClick={() => checkOutMutation.mutate()}
              loading={checkOutMutation.isPending}
            >
              下班打卡
            </Button>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            />
          </Space>

          <Table
            columns={columns}
            dataSource={attendanceData?.data || []}
            rowKey="id"
            pagination={false}
          />
        </Space>
      </Card>
    </div>
  )
}

export default App
