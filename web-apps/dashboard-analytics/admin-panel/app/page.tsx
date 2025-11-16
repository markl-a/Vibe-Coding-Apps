'use client'

import { Card, Title, AreaChart, BarList, DonutChart, Text, Metric, Flex, Grid, BarChart } from '@tremor/react'

// 模擬數據
const salesData = [
  { date: '2024-01', 銷售額: 2890, 目標: 2400 },
  { date: '2024-02', 銷售額: 2756, 目標: 2600 },
  { date: '2024-03', 銷售額: 3322, 目標: 2800 },
  { date: '2024-04', 銷售額: 3470, 目標: 3000 },
  { date: '2024-05', 銷售額: 3475, 目標: 3200 },
  { date: '2024-06', 銷售額: 3129, 目標: 3400 },
]

const categoryData = [
  { name: '電子產品', value: 9800 },
  { name: '服飾配件', value: 4567 },
  { name: '家居用品', value: 3908 },
  { name: '運動器材', value: 2400 },
  { name: '圖書音樂', value: 1908 },
]

const regionData = [
  { name: '台北', sales: 12000, share: 35 },
  { name: '台中', sales: 8500, share: 25 },
  { name: '高雄', sales: 7200, share: 21 },
  { name: '台南', sales: 4100, share: 12 },
  { name: '其他', sales: 2400, share: 7 },
]

const valueFormatter = (number: number) =>
  `$ ${Intl.NumberFormat('us').format(number).toString()}`

export default function Dashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Title className="text-3xl font-bold">管理後台總覽</Title>
        <Text className="mt-2">歡迎回來！這是您的營運數據儀表板</Text>
      </div>

      {/* KPI Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
        <Card>
          <Text>總收入</Text>
          <Metric>$ 34,200</Metric>
          <Flex className="mt-4">
            <Text className="truncate">較上月</Text>
            <Text className="text-green-600">+12.5%</Text>
          </Flex>
        </Card>
        <Card>
          <Text>總訂單</Text>
          <Metric>456</Metric>
          <Flex className="mt-4">
            <Text className="truncate">較上月</Text>
            <Text className="text-green-600">+8.2%</Text>
          </Flex>
        </Card>
        <Card>
          <Text>活躍用戶</Text>
          <Metric>2,350</Metric>
          <Flex className="mt-4">
            <Text className="truncate">較上月</Text>
            <Text className="text-red-600">-2.1%</Text>
          </Flex>
        </Card>
        <Card>
          <Text>轉換率</Text>
          <Metric>3.2%</Metric>
          <Flex className="mt-4">
            <Text className="truncate">較上月</Text>
            <Text className="text-green-600">+0.8%</Text>
          </Flex>
        </Card>
      </Grid>

      {/* Charts Grid */}
      <Grid numItemsLg={2} className="gap-6 mb-6">
        {/* Sales Trend */}
        <Card>
          <Title>銷售趨勢分析</Title>
          <AreaChart
            className="mt-4 h-72"
            data={salesData}
            index="date"
            categories={['銷售額', '目標']}
            colors={['blue', 'gray']}
            valueFormatter={valueFormatter}
            yAxisWidth={60}
          />
        </Card>

        {/* Category Distribution */}
        <Card>
          <Title>產品類別分布</Title>
          <DonutChart
            className="mt-4 h-72"
            data={categoryData}
            category="value"
            index="name"
            valueFormatter={valueFormatter}
            colors={['blue', 'cyan', 'indigo', 'violet', 'purple']}
          />
        </Card>
      </Grid>

      {/* Regional Sales */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>地區銷售排名</Title>
          <Flex className="mt-4">
            <Text>
              <span className="font-medium">地區</span>
            </Text>
            <Text>
              <span className="font-medium">銷售額</span>
            </Text>
          </Flex>
          <BarList
            data={regionData}
            className="mt-2"
            valueFormatter={valueFormatter}
          />
        </Card>

        <Card>
          <Title>月度銷售對比</Title>
          <BarChart
            className="mt-4 h-72"
            data={salesData}
            index="date"
            categories={['銷售額', '目標']}
            colors={['blue', 'gray']}
            valueFormatter={valueFormatter}
            yAxisWidth={60}
          />
        </Card>
      </Grid>
    </div>
  )
}
