import { Layout } from 'antd'
import { TeamOutlined } from '@ant-design/icons'

const { Header } = Layout

const AppHeader = () => {
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#001529',
        color: '#fff',
      }}
    >
      <TeamOutlined style={{ fontSize: '24px', marginRight: '16px' }} />
      <h1 style={{ color: '#fff', margin: 0 }}>員工檔案管理系統</h1>
    </Header>
  )
}

export default AppHeader
