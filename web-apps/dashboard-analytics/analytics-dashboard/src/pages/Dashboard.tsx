import { FaDollarSign, FaUsers, FaShoppingCart, FaChartLine } from 'react-icons/fa'
import MetricCard from '../components/MetricCard'
import LineChartComponent from '../components/LineChartComponent'
import BarChartComponent from '../components/BarChartComponent'
import DoughnutChartComponent from '../components/DoughnutChartComponent'

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p>實時數據分析與視覺化</p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <MetricCard
          title="總收入"
          value="$52,340"
          change={14.5}
          trend="up"
          icon={<FaDollarSign size={24} color="white" />}
          iconColor="blue"
        />
        <MetricCard
          title="總用戶數"
          value="3,245"
          change={9.3}
          trend="up"
          icon={<FaUsers size={24} color="white" />}
          iconColor="green"
        />
        <MetricCard
          title="總訂單"
          value="892"
          change={-4.2}
          trend="down"
          icon={<FaShoppingCart size={24} color="white" />}
          iconColor="orange"
        />
        <MetricCard
          title="轉換率"
          value="3.8%"
          change={12.1}
          trend="up"
          icon={<FaChartLine size={24} color="white" />}
          iconColor="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="card">
          <h2 className="card-title">銷售趨勢</h2>
          <LineChartComponent />
        </div>

        <div className="card">
          <h2 className="card-title">月收入統計</h2>
          <BarChartComponent />
        </div>
      </div>

      {/* Additional Charts */}
      <div className="charts-grid">
        <div className="card">
          <h2 className="card-title">產品類別分布</h2>
          <DoughnutChartComponent />
        </div>

        <div className="card">
          <h2 className="card-title">最近活動</h2>
          <div style={{ padding: '1rem 0' }}>
            {[
              { action: '新訂單 #12345', time: '2 分鐘前', status: 'success' },
              { action: '用戶註冊', time: '15 分鐘前', status: 'info' },
              { action: '付款完成', time: '1 小時前', status: 'success' },
              { action: '退款請求', time: '2 小時前', status: 'warning' },
            ].map((activity, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < 3 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {activity.action}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
