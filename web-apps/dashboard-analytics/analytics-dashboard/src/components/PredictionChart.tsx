import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { generateForecast } from '../services/aiService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface PredictionChartProps {
  historicalData: number[];
  labels: string[];
  title?: string;
}

const PredictionChart = ({ historicalData, labels, title = '收入趋势与 AI 预测' }: PredictionChartProps) => {
  const [forecastData, setForecastData] = useState<number[]>([]);

  useEffect(() => {
    const forecast = generateForecast(historicalData, 5);
    setForecastData(forecast);
  }, [historicalData]);

  // 生成预测标签
  const forecastLabels = ['预测+1', '预测+2', '预测+3', '预测+4', '预测+5'];

  // 合并历史数据和预测数据
  const allLabels = [...labels, ...forecastLabels];
  const historicalValues = [...historicalData, ...Array(5).fill(null)];
  const predictionValues = [...Array(historicalData.length).fill(null), ...forecastData];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: '历史数据',
        data: historicalValues,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'AI 预测',
        data: predictionValues,
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        borderWidth: 3,
        borderDash: [10, 5],
        pointRadius: 5,
        pointHoverRadius: 7,
        pointStyle: 'rectRot',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + Math.round(context.parsed.y).toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function (value: any) {
            return '$' + value.toLocaleString();
          },
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      height: '400px'
    }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default PredictionChart;
