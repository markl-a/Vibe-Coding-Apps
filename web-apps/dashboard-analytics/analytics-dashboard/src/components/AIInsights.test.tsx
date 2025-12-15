import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AIInsights from './AIInsights'

describe('AIInsights', () => {
  it('should show loading state initially', () => {
    render(
      <AIInsights
        revenueData={[1000, 1200, 1400]}
        usersData={[100, 120, 140]}
        ordersData={[50, 60, 70]}
      />
    )

    expect(screen.getByText('分析中...')).toBeInTheDocument()
    expect(screen.getByText('AI 正在分析您的数据...')).toBeInTheDocument()
  })

  it('should display insights after loading', async () => {
    render(
      <AIInsights
        revenueData={[1000, 1200, 1400, 1600, 1800]}
        usersData={[100, 120, 140, 160, 180]}
        ordersData={[50, 60, 70, 80, 90]}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('分析中...')).not.toBeInTheDocument()
    }, { timeout: 2000 })

    expect(screen.getByText(/AI 驱动/)).toBeInTheDocument()
  })

  it('should display confidence percentage for insights', async () => {
    render(
      <AIInsights
        revenueData={[1000, 1500, 2000, 2500, 3000]}
        usersData={[100, 150, 200, 250, 300]}
        ordersData={[50, 75, 100, 125, 150]}
      />
    )

    await waitFor(() => {
      const confidenceBadges = screen.queryAllByText(/% 可信度/)
      expect(confidenceBadges.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('should handle empty data gracefully', async () => {
    render(
      <AIInsights
        revenueData={[]}
        usersData={[]}
        ordersData={[]}
      />
    )

    await waitFor(() => {
      expect(screen.queryByText('分析中...')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should display footer information', async () => {
    render(
      <AIInsights
        revenueData={[1000, 1200, 1400]}
        usersData={[100, 120, 140]}
        ordersData={[50, 60, 70]}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/这些洞察由 AI 算法基于历史数据生成/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
