export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Vibe DevOps Dashboard
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Projects"
            value="148"
            change="+12"
            trend="up"
          />
          <MetricCard
            title="Build Success Rate"
            value="95.2%"
            change="+2.1%"
            trend="up"
          />
          <MetricCard
            title="Test Coverage"
            value="78.5%"
            change="+5.3%"
            trend="up"
          />
          <MetricCard
            title="Security Alerts"
            value="3"
            change="-2"
            trend="down"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Builds</h2>
            <p className="text-gray-600">Build status overview...</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Coverage Trends</h2>
            <p className="text-gray-600">Coverage chart...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <span
          className={`ml-2 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
