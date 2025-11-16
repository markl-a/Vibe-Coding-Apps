import { Layout, Menu } from 'antd'
import { TeamOutlined, ApartmentOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

const AppSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/employees',
      icon: <TeamOutlined />,
      label: '員工管理',
    },
    {
      key: '/departments',
      icon: <ApartmentOutlined />,
      label: '部門管理',
    },
  ]

  return (
    <Sider width={200} style={{ background: '#fff' }}>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  )
}

export default AppSidebar
