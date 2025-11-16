/**
 * 需求預測儀表板
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  Button,
  Table,
  Statistic,
  Space,
  message,
  Spin,
  InputNumber,
  Form,
  Tag,
} from 'antd';
import {
  LineChartOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { demandAPI } from '../services/api';
import dayjs from 'dayjs';

const ForecastDashboard = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forecasting, setForecasting] = useState(false);

  const [form] = Form.useForm();

  // 載入物料列表
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const result = await demandAPI.getItems();
      setItems(result.items || []);
      if (result.items && result.items.length > 0) {
        setSelectedItem(result.items[0].item_id);
      }
    } catch (error) {
      message.error(`載入物料列表失敗: ${error.message}`);
    }
  };

  // 載入歷史數據
  useEffect(() => {
    if (selectedItem) {
      loadHistoricalData(selectedItem);
      loadAnomalies(selectedItem);
    }
  }, [selectedItem]);

  const loadHistoricalData = async (itemId) => {
    setLoading(true);
    try {
      const result = await demandAPI.getDemandHistory(itemId, 100);
      const data = result.records.map((r) => ({
        ...r,
        date: dayjs(r.date).format('YYYY-MM-DD'),
        dateObj: new Date(r.date),
      })).sort((a, b) => a.dateObj - b.dateObj);

      setHistoricalData(data);
    } catch (error) {
      message.error(`載入歷史數據失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async (itemId) => {
    try {
      const result = await demandAPI.detectAnomalies(itemId, 0.1);
      setAnomalies(result.anomalies || []);
    } catch (error) {
      console.error('載入異常數據失敗:', error);
    }
  };

  // 生成預測
  const handleGenerateForecast = async (values) => {
    if (!selectedItem) {
      message.warning('請先選擇物料');
      return;
    }

    setForecasting(true);
    try {
      const result = await demandAPI.generateForecast({
        item_id: selectedItem,
        periods: values.periods || 12,
        frequency: values.frequency || 'M',
        include_promotions: values.include_promotions || false,
      });

      setForecastData(result);
      message.success('預測生成成功!');
    } catch (error) {
      message.error(`預測失敗: ${error.message}`);
    } finally {
      setForecasting(false);
    }
  };

  // 準備圖表數據
  const prepareChartData = () => {
    if (!forecastData) return historicalData;

    const historical = historicalData.slice(-24).map((d) => ({
      date: d.date,
      actual: d.quantity,
      type: 'historical',
    }));

    const forecast = forecastData.forecasts.map((f) => ({
      date: dayjs(f.date).format('YYYY-MM-DD'),
      predicted: f.predicted_quantity,
      lower: f.lower_bound,
      upper: f.upper_bound,
      type: 'forecast',
    }));

    return [...historical, ...forecast];
  };

  // 計算統計數據
  const calculateStats = () => {
    if (historicalData.length === 0) return {};

    const recentData = historicalData.slice(-12);
    const avgDemand = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;

    const previousData = historicalData.slice(-24, -12);
    const prevAvg = previousData.length > 0
      ? previousData.reduce((sum, d) => sum + d.quantity, 0) / previousData.length
      : avgDemand;

    const trend = ((avgDemand - prevAvg) / prevAvg) * 100;

    return {
      avgDemand: avgDemand.toFixed(0),
      trend: trend.toFixed(1),
      maxDemand: Math.max(...recentData.map((d) => d.quantity)).toFixed(0),
      minDemand: Math.min(...recentData.map((d) => d.quantity)).toFixed(0),
    };
  };

  const stats = calculateStats();
  const chartData = prepareChartData();

  return (
    <div style={{ padding: '24px' }}>
      {/* 頁面標題 */}
      <div style={{ marginBottom: '24px' }}>
        <h1>
          <LineChartOutlined /> 智能需求預測系統
        </h1>
        <p>基於 AI 的時間序列預測，幫助優化庫存和採購決策</p>
      </div>

      {/* 物料選擇 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space>
              <span>選擇物料:</span>
              <Select
                style={{ width: 200 }}
                value={selectedItem}
                onChange={setSelectedItem}
                options={items.map((item) => ({
                  label: `${item.item_id} - ${item.item_name}`,
                  value: item.item_id,
                }))}
              />
            </Space>
          </Col>
          <Col span={18}>
            <Form
              form={form}
              layout="inline"
              onFinish={handleGenerateForecast}
              initialValues={{ periods: 12, frequency: 'M' }}
            >
              <Form.Item name="periods" label="預測週期">
                <InputNumber min={1} max={36} />
              </Form.Item>
              <Form.Item name="frequency" label="頻率">
                <Select style={{ width: 100 }}>
                  <Select.Option value="D">日</Select.Option>
                  <Select.Option value="W">週</Select.Option>
                  <Select.Option value="M">月</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ThunderboltOutlined />}
                  loading={forecasting}
                >
                  生成預測
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>

      {/* 統計卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均需求（近12期）"
              value={stats.avgDemand}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="需求趨勢"
              value={stats.trend}
              precision={1}
              valueStyle={{ color: parseFloat(stats.trend) >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={parseFloat(stats.trend) >= 0 ? <RiseOutlined /> : <FallOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最高需求"
              value={stats.maxDemand}
              suffix="件"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="異常檢測"
              value={anomalies.length}
              prefix={<WarningOutlined />}
              suffix="筆"
              valueStyle={{ color: anomalies.length > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 預測準確度 */}
      {forecastData && (
        <Card title="預測準確度指標" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="MAPE (平均絕對百分比誤差)"
                value={forecastData.accuracy_metrics.mape}
                suffix="%"
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="RMSE (均方根誤差)"
                value={forecastData.accuracy_metrics.rmse}
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="MAE (平均絕對誤差)"
                value={forecastData.accuracy_metrics.mae}
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="R² Score"
                value={forecastData.accuracy_metrics.r2_score}
                precision={4}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 圖表 */}
      <Card title="需求預測趨勢圖" loading={loading} style={{ marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#1890ff"
              fill="#1890ff"
              fillOpacity={0.3}
              name="實際需求"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#52c41a"
              fill="#52c41a"
              fillOpacity={0.3}
              name="預測需求"
            />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="#ff7875"
              fill="none"
              strokeDasharray="5 5"
              name="上界"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="#ff7875"
              fill="none"
              strokeDasharray="5 5"
              name="下界"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* 預測結果表格 */}
      {forecastData && (
        <Card title="預測結果明細">
          <Table
            dataSource={forecastData.forecasts}
            pagination={{ pageSize: 12 }}
            rowKey="date"
            columns={[
              {
                title: '日期',
                dataIndex: 'date',
                key: 'date',
                render: (text) => dayjs(text).format('YYYY-MM-DD'),
              },
              {
                title: '預測需求',
                dataIndex: 'predicted_quantity',
                key: 'predicted_quantity',
                render: (val) => val.toFixed(0),
              },
              {
                title: '下界',
                dataIndex: 'lower_bound',
                key: 'lower_bound',
                render: (val) => val.toFixed(0),
              },
              {
                title: '上界',
                dataIndex: 'upper_bound',
                key: 'upper_bound',
                render: (val) => val.toFixed(0),
              },
              {
                title: '置信區間',
                key: 'confidence',
                render: (_, record) => {
                  const range = record.upper_bound - record.lower_bound;
                  return `± ${(range / 2).toFixed(0)}`;
                },
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default ForecastDashboard;
