# Boot Optimizer - 啟動優化工具
> AI 驅動的系統啟動時間分析與優化工具

## 📋 專案簡介

Boot Optimizer 是一套完整的啟動時間分析和優化工具集,幫助開發者識別啟動瓶頸、測量各階段耗時,並提供優化建議。支援 Linux、Android、嵌入式系統等多種平台。

## 🎯 專案目標

- 精確測量啟動各階段時間
- 識別啟動性能瓶頸
- 生成詳細的啟動時間報告
- 提供優化建議和方案
- 對比優化前後效果
- 自動化啟動測試

## 🛠️ 技術棧

### 後端開發
- **語言**: Python, C, Shell Script
- **分析工具**:
  - systemd-analyze (Linux)
  - bootchart
  - ftrace
  - Custom profiling tools

### 前端開發
- **框架**: React + TypeScript
- **可視化**: ECharts, D3.js
- **功能**: 時間線視圖、瀑布圖、對比分析

## 📁 專案結構

```
boot-optimizer/
├── backend/
│   ├── profilers/
│   │   ├── boottime-profiler.c
│   │   ├── systemd-analyzer.py
│   │   └── kernel-profiler.sh
│   ├── analyzers/
│   │   ├── bottleneck-detector.py
│   │   ├── timeline-analyzer.py
│   │   └── optimization-advisor.py
│   ├── reporters/
│   │   ├── html-reporter.py
│   │   ├── json-exporter.py
│   │   └── csv-exporter.py
│   └── tools/
│       ├── auto-tester.py
│       └── benchmark.sh
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TimelineView/
│       │   ├── WaterfallChart/
│       │   ├── ComparisonView/
│       │   └── OptimizationTips/
│       └── package.json
└── README.md
```

## 🚀 核心功能

### 1. 啟動時間分析
- Bootloader 階段測量
- Kernel 初始化分析
- 用戶空間啟動分析
- 服務啟動序列分析

### 2. 瓶頸識別
- 長耗時服務檢測
- 依賴關係分析
- 並行度分析
- I/O 瓶頸識別

### 3. 優化建議
- 服務並行化建議
- 延遲加載建議
- 預載入優化
- 編譯優化選項

### 4. 可視化報告
- 時間線視圖
- 瀑布圖
- 火焰圖
- 對比報告

## 💻 開發範例

### 啟動時間分析器

```python
# boot_analyzer.py
import os
import re
import json
from datetime import datetime
from collections import defaultdict

class BootTimeAnalyzer:
    def __init__(self):
        self.events = []
        self.stages = defaultdict(float)

    def parse_dmesg(self):
        """Parse dmesg for boot events"""
        with os.popen('dmesg -T') as f:
            lines = f.readlines()

        for line in lines:
            match = re.match(r'\[([\d.]+)\] (.+)', line)
            if match:
                timestamp = float(match.group(1))
                message = match.group(2)
                self.events.append({
                    'timestamp': timestamp,
                    'message': message
                })

    def parse_systemd(self):
        """Parse systemd-analyze output"""
        import subprocess

        # Get boot time
        result = subprocess.run(
            ['systemd-analyze', 'time'],
            capture_output=True,
            text=True
        )

        # Parse output
        output = result.stdout

        # Firmware time
        firmware_match = re.search(r'(\d+\.\d+)s \(firmware\)', output)
        if firmware_match:
            self.stages['firmware'] = float(firmware_match.group(1))

        # Loader time
        loader_match = re.search(r'(\d+\.\d+)s \(loader\)', output)
        if loader_match:
            self.stages['loader'] = float(loader_match.group(1))

        # Kernel time
        kernel_match = re.search(r'(\d+\.\d+)s \(kernel\)', output)
        if kernel_match:
            self.stages['kernel'] = float(kernel_match.group(1))

        # Userspace time
        userspace_match = re.search(r'(\d+\.\d+)s \(userspace\)', output)
        if userspace_match:
            self.stages['userspace'] = float(userspace_match.group(1))

    def get_critical_chain(self):
        """Get critical chain of services"""
        import subprocess

        result = subprocess.run(
            ['systemd-analyze', 'critical-chain'],
            capture_output=True,
            text=True
        )

        return result.stdout

    def get_blame_list(self):
        """Get list of services by init time"""
        import subprocess

        result = subprocess.run(
            ['systemd-analyze', 'blame'],
            capture_output=True,
            text=True
        )

        services = []
        for line in result.stdout.split('\n'):
            match = re.match(r'\s*([\d.]+[ms]+)\s+(.+)', line)
            if match:
                time_str = match.group(1)
                service = match.group(2)

                # Convert to seconds
                if 'ms' in time_str:
                    time = float(time_str.replace('ms', '')) / 1000
                else:
                    time = float(time_str.replace('s', ''))

                services.append({
                    'service': service,
                    'time': time
                })

        return sorted(services, key=lambda x: x['time'], reverse=True)

    def generate_report(self, output_file='boot_report.json'):
        """Generate comprehensive boot analysis report"""
        self.parse_systemd()

        report = {
            'timestamp': datetime.now().isoformat(),
            'total_time': sum(self.stages.values()),
            'stages': dict(self.stages),
            'critical_chain': self.get_critical_chain(),
            'slow_services': self.get_blame_list()[:20],
            'recommendations': self.get_recommendations()
        }

        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)

        return report

    def get_recommendations(self):
        """Generate optimization recommendations"""
        recommendations = []

        slow_services = self.get_blame_list()[:10]

        for service in slow_services:
            if service['time'] > 5:
                recommendations.append({
                    'type': 'slow_service',
                    'target': service['service'],
                    'issue': f"Service takes {service['time']:.2f}s to start",
                    'suggestion': "Consider lazy loading or optimization"
                })

        # Check firmware time
        if self.stages.get('firmware', 0) > 3:
            recommendations.append({
                'type': 'firmware',
                'issue': f"Firmware initialization takes {self.stages['firmware']:.2f}s",
                'suggestion': "Enable Fast Boot in BIOS/UEFI settings"
            })

        # Check kernel time
        if self.stages.get('kernel', 0) > 5:
            recommendations.append({
                'type': 'kernel',
                'issue': f"Kernel initialization takes {self.stages['kernel']:.2f}s",
                'suggestion': "Review kernel modules and reduce initramfs size"
            })

        return recommendations

    def print_summary(self):
        """Print boot time summary"""
        print("\n" + "="*50)
        print("Boot Time Analysis Summary")
        print("="*50 + "\n")

        for stage, time in self.stages.items():
            print(f"{stage.capitalize():15} {time:>8.3f}s")

        print(f"\n{'Total':15} {sum(self.stages.values()):>8.3f}s")
        print("\n" + "="*50)

        print("\nTop 10 Slowest Services:")
        print("-"*50)

        for i, service in enumerate(self.get_blame_list()[:10], 1):
            print(f"{i:2}. {service['time']:>6.2f}s  {service['service']}")

        print("\n" + "="*50)

        recommendations = self.get_recommendations()
        if recommendations:
            print("\nOptimization Recommendations:")
            print("-"*50)

            for i, rec in enumerate(recommendations, 1):
                print(f"\n{i}. {rec.get('target', rec['type'])}")
                print(f"   Issue: {rec['issue']}")
                print(f"   Suggestion: {rec['suggestion']}")

if __name__ == '__main__':
    analyzer = BootTimeAnalyzer()
    analyzer.print_summary()
    report = analyzer.generate_report()
    print(f"\nDetailed report saved to boot_report.json")
```

### 自動化測試腳本

```bash
#!/bin/bash
# auto_boot_test.sh - 自動化啟動時間測試

ITERATIONS=10
RESULTS_DIR="./boot_test_results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULTS_DIR/$TIMESTAMP"

echo "Starting automated boot time testing..."
echo "Iterations: $ITERATIONS"
echo "Results directory: $RESULTS_DIR/$TIMESTAMP"

for i in $(seq 1 $ITERATIONS); do
    echo ""
    echo "========================================="
    echo "Test iteration $i of $ITERATIONS"
    echo "========================================="

    # Capture boot time before reboot
    systemd-analyze time > "$RESULTS_DIR/$TIMESTAMP/boot_time_$i.txt"
    systemd-analyze blame > "$RESULTS_DIR/$TIMESTAMP/blame_$i.txt"
    systemd-analyze critical-chain > "$RESULTS_DIR/$TIMESTAMP/critical_chain_$i.txt"

    # Save dmesg
    dmesg > "$RESULTS_DIR/$TIMESTAMP/dmesg_$i.log"

    echo "Captured boot data for iteration $i"

    if [ $i -lt $ITERATIONS ]; then
        echo "Rebooting in 10 seconds..."
        sleep 10
        reboot
    fi
done

echo ""
echo "Testing complete!"
echo "Analyzing results..."

# Generate summary report
python3 << 'EOF'
import os
import re
import json

results_dir = os.environ['RESULTS_DIR'] + '/' + os.environ['TIMESTAMP']
iterations = int(os.environ['ITERATIONS'])

boot_times = []

for i in range(1, iterations + 1):
    with open(f'{results_dir}/boot_time_{i}.txt', 'r') as f:
        content = f.read()
        match = re.search(r'= ([\d.]+)s', content)
        if match:
            boot_times.append(float(match.group(1)))

if boot_times:
    avg_time = sum(boot_times) / len(boot_times)
    min_time = min(boot_times)
    max_time = max(boot_times)

    summary = {
        'iterations': iterations,
        'boot_times': boot_times,
        'average': avg_time,
        'minimum': min_time,
        'maximum': max_time,
        'variance': max_time - min_time
    }

    with open(f'{results_dir}/summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print(f"\nBoot Time Statistics:")
    print(f"  Average: {avg_time:.3f}s")
    print(f"  Minimum: {min_time:.3f}s")
    print(f"  Maximum: {max_time:.3f}s")
    print(f"  Variance: {max_time - min_time:.3f}s")
EOF
```

## 🤖 AI 輔助開發

- "分析 systemd 啟動瓶頸"
- "生成啟動優化建議"
- "如何減少 initramfs 大小?"
- "並行化服務啟動策略"

## 📊 優化策略

1. **並行啟動**: 識別可並行的服務
2. **延遲加載**: 非關鍵服務延後啟動
3. **預連接**: 預先載入常用資源
4. **編譯優化**: LTO、PGO 優化

## 📄 授權

MIT License

---

**最後更新**: 2025-11-16
**狀態**: ✅ 活躍開發中
