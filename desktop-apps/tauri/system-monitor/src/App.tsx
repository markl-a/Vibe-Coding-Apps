import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SystemInfo {
  os: string;
  kernel_version: string;
  hostname: string;
  cpu_count: number;
}

interface MemoryInfo {
  total: number;
  used: number;
  available: number;
}

interface DiskInfo {
  name: string;
  mount_point: string;
  total: number;
  used: number;
  available: number;
}

function App() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);

  // 獲取系統基本資訊（只需獲取一次）
  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const info = await invoke<SystemInfo>('get_system_info');
        setSystemInfo(info);
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      }
    };

    fetchSystemInfo();
  }, []);

  // 定期更新系統資源資訊
  useEffect(() => {
    const updateStats = async () => {
      try {
        // 獲取 CPU 使用率
        const cpu = await invoke<number>('get_cpu_usage');
        setCpuUsage(cpu);

        // 獲取記憶體資訊
        const memory = await invoke<MemoryInfo>('get_memory_info');
        setMemoryInfo(memory);

        // 獲取磁碟資訊
        const disks = await invoke<DiskInfo[]>('get_disk_info');
        setDiskInfo(disks);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    // 立即執行一次
    updateStats();

    // 每秒更新一次
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    const gb = bytes / 1024 / 1024 / 1024;
    return gb.toFixed(2);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return '#4CAF50'; // 綠色
    if (percentage < 80) return '#FF9800'; // 橙色
    return '#F44336'; // 紅色
  };

  return (
    <div className="container">
      <header>
        <h1>🖥️ 系統監控工具</h1>
        <p className="subtitle">即時監控系統資源使用情況</p>
      </header>

      <main>
        {/* 系統基本資訊 */}
        <section className="info-card">
          <h2>📋 系統資訊</h2>
          {systemInfo ? (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">作業系統:</span>
                <span className="value">{systemInfo.os}</span>
              </div>
              <div className="info-item">
                <span className="label">核心版本:</span>
                <span className="value">{systemInfo.kernel_version}</span>
              </div>
              <div className="info-item">
                <span className="label">主機名稱:</span>
                <span className="value">{systemInfo.hostname}</span>
              </div>
              <div className="info-item">
                <span className="label">CPU 核心:</span>
                <span className="value">{systemInfo.cpu_count} 核心</span>
              </div>
            </div>
          ) : (
            <p>載入中...</p>
          )}
        </section>

        {/* CPU 使用率 */}
        <section className="stat-card">
          <h2>⚡ CPU 使用率</h2>
          <div className="stat-value-large">{cpuUsage.toFixed(1)}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${cpuUsage}%`,
                backgroundColor: getProgressColor(cpuUsage),
              }}
            />
          </div>
        </section>

        {/* 記憶體使用 */}
        <section className="stat-card">
          <h2>💾 記憶體使用</h2>
          {memoryInfo && (
            <>
              <div className="stat-value-large">
                {formatBytes(memoryInfo.used)} / {formatBytes(memoryInfo.total)} GB
              </div>
              <div className="stat-percentage">
                {((memoryInfo.used / memoryInfo.total) * 100).toFixed(1)}%
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(memoryInfo.used / memoryInfo.total) * 100}%`,
                    backgroundColor: getProgressColor(
                      (memoryInfo.used / memoryInfo.total) * 100
                    ),
                  }}
                />
              </div>
            </>
          )}
        </section>

        {/* 磁碟使用 */}
        <section className="stat-card">
          <h2>💿 磁碟使用</h2>
          <div className="disk-list">
            {diskInfo.map((disk, index) => {
              const percentage = (disk.used / disk.total) * 100;
              return (
                <div key={index} className="disk-item">
                  <div className="disk-header">
                    <span className="disk-name">{disk.name}</span>
                    <span className="disk-mount">{disk.mount_point}</span>
                  </div>
                  <div className="disk-stats">
                    <span>
                      {formatBytes(disk.used)} / {formatBytes(disk.total)} GB
                    </span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getProgressColor(percentage),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer>
        <p>每秒自動更新 | Tauri + React</p>
      </footer>
    </div>
  );
}

export default App;
