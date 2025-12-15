import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FaUsers } from 'react-icons/fa'
import MetricCard from './MetricCard'

describe('MetricCard', () => {
  it('should render metric card with correct title and value', () => {
    render(
      <MetricCard
        title="Total Users"
        value="1,234"
        change={12.5}
        trend="up"
        icon={<FaUsers />}
      />
    )

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('should display positive change correctly', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$5,000"
        change={15.5}
        trend="up"
        icon={<FaUsers />}
      />
    )

    expect(screen.getByText('15.5%')).toBeInTheDocument()
    expect(screen.getByText('vs 上月')).toBeInTheDocument()
  })

  it('should display negative change correctly', () => {
    render(
      <MetricCard
        title="Orders"
        value="500"
        change={-8.2}
        trend="down"
        icon={<FaUsers />}
      />
    )

    expect(screen.getByText('8.2%')).toBeInTheDocument()
  })

  it('should render with custom icon color', () => {
    const { container } = render(
      <MetricCard
        title="Sales"
        value="$10,000"
        change={20}
        trend="up"
        icon={<FaUsers />}
        iconColor="green"
      />
    )

    const iconElement = container.querySelector('.metric-icon.green')
    expect(iconElement).toBeInTheDocument()
  })

  it('should apply positive class for upward trend', () => {
    const { container } = render(
      <MetricCard
        title="Growth"
        value="25%"
        change={5}
        trend="up"
        icon={<FaUsers />}
      />
    )

    const changeElement = container.querySelector('.metric-change.positive')
    expect(changeElement).toBeInTheDocument()
  })

  it('should apply negative class for downward trend', () => {
    const { container } = render(
      <MetricCard
        title="Decline"
        value="10%"
        change={-5}
        trend="down"
        icon={<FaUsers />}
      />
    )

    const changeElement = container.querySelector('.metric-change.negative')
    expect(changeElement).toBeInTheDocument()
  })

  it('should use default blue icon color when not specified', () => {
    const { container } = render(
      <MetricCard
        title="Default"
        value="100"
        change={0}
        trend="up"
        icon={<FaUsers />}
      />
    )

    const iconElement = container.querySelector('.metric-icon.blue')
    expect(iconElement).toBeInTheDocument()
  })
})
