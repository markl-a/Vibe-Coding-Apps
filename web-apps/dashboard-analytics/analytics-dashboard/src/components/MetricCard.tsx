import { FaArrowUp, FaArrowDown } from 'react-icons/fa'

interface MetricCardProps {
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  icon: React.ReactNode
  iconColor?: string
}

const MetricCard = ({ title, value, change, trend, icon, iconColor = 'blue' }: MetricCardProps) => {
  const isPositive = trend === 'up'

  return (
    <div className="card metric-card">
      <div className="metric-info">
        <h3>{title}</h3>
        <div className="value">{value}</div>
        <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
          <span>{Math.abs(change)}%</span>
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
            vs 上月
          </span>
        </div>
      </div>
      <div className={`metric-icon ${iconColor}`}>
        {icon}
      </div>
    </div>
  )
}

export default MetricCard
