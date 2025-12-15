import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AnomalyDetection from './AnomalyDetection'

describe('AnomalyDetection', () => {
  it('should show analyzing state initially', () => {
    render(
      <AnomalyDetection
        data={[100, 100, 100]}
        labels={['Jan', 'Feb', 'Mar']}
        metricName="Revenue"
      />
    )

    expect(screen.getByText('分析中...')).toBeInTheDocument()
  })

  it('should display no anomalies for consistent data', async () => {
    render(
      <AnomalyDetection
        data={[100, 100, 100, 100, 100]}
        labels={['Jan', 'Feb', 'Mar', 'Apr', 'May']}
        metricName="Revenue"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('未发现异常')).toBeInTheDocument()
      expect(screen.getByText('数据正常，未检测到异常波动')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should detect anomalies in data', async () => {
    render(
      <AnomalyDetection
        data={[100, 100, 100, 500, 100, 100]}
        labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
        metricName="Sales"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/发现.*个异常/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should display metric name in header', async () => {
    render(
      <AnomalyDetection
        data={[100, 100, 100]}
        labels={['Jan', 'Feb', 'Mar']}
        metricName="Test Metric"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Metric/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should show footer information', async () => {
    render(
      <AnomalyDetection
        data={[100, 100, 100]}
        labels={['Jan', 'Feb', 'Mar']}
        metricName="Revenue"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/使用 Z-score 统计方法检测异常值/)).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})
