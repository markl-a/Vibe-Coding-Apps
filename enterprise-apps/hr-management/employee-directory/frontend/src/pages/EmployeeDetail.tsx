import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, Descriptions, Avatar, Tag, Spin } from 'antd'
import { employeeApi } from '../services/api'
import dayjs from 'dayjs'

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spin size="large" />
  if (!data?.data) return <div>未找到員工</div>

  const employee = data.data

  return (
    <Card title="員工詳情">
      <div style={{ marginBottom: 24 }}>
        <Avatar size={64} src={employee.avatar}>
          {employee.firstName[0]}
        </Avatar>
      </div>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="員工編號">
          {employee.employeeNumber}
        </Descriptions.Item>
        <Descriptions.Item label="姓名">
          {employee.firstName} {employee.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="郵箱">{employee.email}</Descriptions.Item>
        <Descriptions.Item label="電話">{employee.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="部門">
          {employee.department?.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="職位">{employee.position}</Descriptions.Item>
        <Descriptions.Item label="職稱">{employee.jobTitle}</Descriptions.Item>
        <Descriptions.Item label="員工類型">
          {employee.employeeType}
        </Descriptions.Item>
        <Descriptions.Item label="狀態">
          <Tag color="green">{employee.employmentStatus}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="入職日期">
          {dayjs(employee.hireDate).format('YYYY-MM-DD')}
        </Descriptions.Item>
        <Descriptions.Item label="基本薪資">
          {employee.baseSalary
            ? `${employee.baseSalary.toLocaleString()} TWD`
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="主管">
          {employee.manager
            ? `${employee.manager.firstName} ${employee.manager.lastName}`
            : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default EmployeeDetail
