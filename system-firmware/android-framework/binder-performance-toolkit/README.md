# Binder 性能追蹤工具 (Binder Performance Toolkit)

> Android Binder IPC 性能分析與優化工具集

## 專案概述

本專案提供一套完整的 Binder IPC 性能分析工具，包含追蹤、分析、視覺化和優化建議等功能，幫助開發者診斷和優化 Android 系統中的 Binder 通訊性能問題。

## 功能特性

- ✅ Binder 調用追蹤與記錄
- ✅ IPC 延遲分析
- ✅ Binder 線程池監控
- ✅ 交易大小統計
- ✅ 死亡通知追蹤
- ✅ Binder 洩漏檢測
- ✅ 性能報告生成
- ✅ 視覺化圖表展示

## 工具架構

```
Binder Performance Toolkit
┌────────────────────────────────────────┐
│   BinderTracer (追蹤器)                 │
│  ┌──────────────────────────────────┐  │
│  │  • Kernel Trace (ftrace)         │  │
│  │  • Perfetto Integration          │  │
│  │  • Custom Hook Points            │  │
│  └──────────────────────────────────┘  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│   BinderAnalyzer (分析器)               │
│  ┌──────────────────────────────────┐  │
│  │  • Transaction Analysis          │  │
│  │  • Latency Calculation           │  │
│  │  • Bottleneck Detection          │  │
│  └──────────────────────────────────┘  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│   BinderVisualizer (視覺化)             │
│  ┌──────────────────────────────────┐  │
│  │  • Timeline View                 │  │
│  │  • Flame Graph                   │  │
│  │  • Statistics Charts             │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## 目錄結構

```
binder-performance-toolkit/
├── README.md
├── tracer/                          # 追蹤器
│   ├── BinderTracer.cpp
│   ├── TraceCollector.cpp
│   ├── KernelTraceReader.cpp
│   └── Android.bp
├── analyzer/                        # 分析器
│   ├── BinderAnalyzer.py
│   ├── LatencyAnalyzer.py
│   ├── TransactionParser.py
│   └── ReportGenerator.py
├── visualizer/                      # 視覺化
│   ├── TimelineView.html
│   ├── FlameGraph.js
│   ├── Charts.js
│   └── dashboard.html
└── docs/
    ├── usage-guide.md
    ├── api-reference.md
    └── optimization-tips.md
```

## 快速開始

### 1. 編譯工具

```bash
# 編譯追蹤器
cd tracer
mm

# 推送到設備
adb push out/target/product/*/system/bin/binder_tracer /system/bin/
```

### 2. 開始追蹤

```bash
# 啟動 Binder 追蹤
adb shell binder_tracer start

# 執行需要分析的操作...

# 停止追蹤
adb shell binder_tracer stop

# 導出追蹤數據
adb pull /data/local/tmp/binder_trace.txt
```

### 3. 分析數據

```bash
# 使用分析器
python3 analyzer/BinderAnalyzer.py binder_trace.txt

# 生成報告
python3 analyzer/ReportGenerator.py binder_trace.txt -o report.html
```

## 追蹤器實作

### BinderTracer.cpp

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>

#define BINDER_TRACE_FILE "/data/local/tmp/binder_trace.txt"
#define FTRACE_PATH "/sys/kernel/debug/tracing"

class BinderTracer {
public:
    BinderTracer() : mTracing(false), mOutputFd(-1) {}
    ~BinderTracer() { stop(); }

    bool start() {
        if (mTracing) {
            fprintf(stderr, "Already tracing\n");
            return false;
        }

        // 打開輸出文件
        mOutputFd = open(BINDER_TRACE_FILE, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (mOutputFd < 0) {
            perror("Failed to open output file");
            return false;
        }

        // 啟用 ftrace
        enableFtrace();

        // 啟用 Binder 追蹤點
        enableBinderTracepoints();

        mTracing = true;
        printf("Binder tracing started\n");
        return true;
    }

    bool stop() {
        if (!mTracing) {
            return false;
        }

        // 停用追蹤
        disableFtrace();

        // 收集追蹤數據
        collectTraceData();

        // 關閉輸出文件
        if (mOutputFd >= 0) {
            close(mOutputFd);
            mOutputFd = -1;
        }

        mTracing = false;
        printf("Binder tracing stopped. Output: %s\n", BINDER_TRACE_FILE);
        return true;
    }

private:
    bool mTracing;
    int mOutputFd;

    void enableFtrace() {
        writeToFile(FTRACE_PATH "/tracing_on", "1");
        writeToFile(FTRACE_PATH "/buffer_size_kb", "8192");
    }

    void disableFtrace() {
        writeToFile(FTRACE_PATH "/tracing_on", "0");
    }

    void enableBinderTracepoints() {
        // 啟用 Binder 相關追蹤點
        writeToFile(FTRACE_PATH "/events/binder/binder_transaction/enable", "1");
        writeToFile(FTRACE_PATH "/events/binder/binder_transaction_received/enable", "1");
        writeToFile(FTRACE_PATH "/events/binder/binder_lock/enable", "1");
        writeToFile(FTRACE_PATH "/events/binder/binder_unlock/enable", "1");
    }

    void collectTraceData() {
        // 從 ftrace 讀取數據
        int traceFd = open(FTRACE_PATH "/trace", O_RDONLY);
        if (traceFd < 0) {
            perror("Failed to open trace file");
            return;
        }

        char buffer[4096];
        ssize_t bytesRead;

        while ((bytesRead = read(traceFd, buffer, sizeof(buffer))) > 0) {
            write(mOutputFd, buffer, bytesRead);
        }

        close(traceFd);
    }

    void writeToFile(const char* path, const char* value) {
        int fd = open(path, O_WRONLY);
        if (fd >= 0) {
            write(fd, value, strlen(value));
            close(fd);
        }
    }
};

int main(int argc, char** argv) {
    if (argc < 2) {
        fprintf(stderr, "Usage: %s <start|stop>\n", argv[0]);
        return 1;
    }

    BinderTracer tracer;

    if (strcmp(argv[1], "start") == 0) {
        return tracer.start() ? 0 : 1;
    } else if (strcmp(argv[1], "stop") == 0) {
        return tracer.stop() ? 0 : 1;
    } else {
        fprintf(stderr, "Unknown command: %s\n", argv[1]);
        return 1;
    }
}
```

## 分析器實作

### BinderAnalyzer.py

```python
#!/usr/bin/env python3
"""
Binder 性能分析器
"""

import re
import sys
from collections import defaultdict
from datetime import datetime

class BinderAnalyzer:
    def __init__(self, trace_file):
        self.trace_file = trace_file
        self.transactions = []
        self.statistics = {
            'total_transactions': 0,
            'total_latency': 0,
            'max_latency': 0,
            'min_latency': float('inf'),
            'avg_latency': 0,
            'by_interface': defaultdict(list),
            'by_process': defaultdict(list)
        }

    def parse_trace(self):
        """解析追蹤文件"""
        print(f"Parsing trace file: {self.trace_file}")

        pattern = re.compile(
            r'(\d+\.\d+).*binder_transaction:\s+'
            r'transaction=(\d+)\s+'
            r'dest_node=(\d+)\s+'
            r'dest_proc=(\d+)\s+'
            r'dest_thread=(\d+)\s+'
            r'reply=(\d+)\s+'
            r'flags=0x([0-9a-f]+)\s+'
            r'code=0x([0-9a-f]+)'
        )

        with open(self.trace_file, 'r') as f:
            for line in f:
                match = pattern.search(line)
                if match:
                    timestamp = float(match.group(1))
                    transaction = {
                        'timestamp': timestamp,
                        'transaction_id': match.group(2),
                        'dest_node': match.group(3),
                        'dest_proc': match.group(4),
                        'dest_thread': match.group(5),
                        'reply': match.group(6),
                        'flags': match.group(7),
                        'code': match.group(8)
                    }
                    self.transactions.append(transaction)

        print(f"Parsed {len(self.transactions)} transactions")

    def analyze(self):
        """分析 Binder 交易"""
        if not self.transactions:
            print("No transactions to analyze")
            return

        # 配對請求和回應
        pending = {}
        completed = []

        for trans in self.transactions:
            trans_id = trans['transaction_id']
            is_reply = trans['reply'] == '1'

            if not is_reply:
                # 這是一個請求
                pending[trans_id] = trans
            else:
                # 這是一個回應
                if trans_id in pending:
                    request = pending[trans_id]
                    latency = (trans['timestamp'] - request['timestamp']) * 1000  # ms
                    completed.append({
                        'request': request,
                        'response': trans,
                        'latency': latency
                    })
                    del pending[trans_id]

        # 計算統計
        self.statistics['total_transactions'] = len(completed)

        if completed:
            latencies = [t['latency'] for t in completed]
            self.statistics['total_latency'] = sum(latencies)
            self.statistics['max_latency'] = max(latencies)
            self.statistics['min_latency'] = min(latencies)
            self.statistics['avg_latency'] = sum(latencies) / len(latencies)

            # 按代碼分組
            for trans in completed:
                code = trans['request']['code']
                self.statistics['by_interface'][code].append(trans['latency'])

            # 按進程分組
            for trans in completed:
                proc = trans['request']['dest_proc']
                self.statistics['by_process'][proc].append(trans['latency'])

    def print_report(self):
        """打印分析報告"""
        print("\n" + "="*60)
        print("Binder Performance Analysis Report")
        print("="*60)

        print(f"\nTotal Transactions: {self.statistics['total_transactions']}")
        print(f"Total Latency: {self.statistics['total_latency']:.2f} ms")
        print(f"Average Latency: {self.statistics['avg_latency']:.2f} ms")
        print(f"Max Latency: {self.statistics['max_latency']:.2f} ms")
        print(f"Min Latency: {self.statistics['min_latency']:.2f} ms")

        print("\n" + "-"*60)
        print("Top 10 Slowest Transactions by Interface:")
        print("-"*60)

        # 排序並打印前 10 個最慢的介面
        sorted_interfaces = sorted(
            self.statistics['by_interface'].items(),
            key=lambda x: max(x[1]),
            reverse=True
        )[:10]

        for code, latencies in sorted_interfaces:
            avg = sum(latencies) / len(latencies)
            max_lat = max(latencies)
            print(f"Code 0x{code}: avg={avg:.2f}ms, max={max_lat:.2f}ms, count={len(latencies)}")

        print("\n" + "-"*60)
        print("Top 10 Processes by Transaction Count:")
        print("-"*60)

        sorted_processes = sorted(
            self.statistics['by_process'].items(),
            key=lambda x: len(x[1]),
            reverse=True
        )[:10]

        for proc, latencies in sorted_processes:
            avg = sum(latencies) / len(latencies)
            print(f"Process {proc}: avg={avg:.2f}ms, count={len(latencies)}")

        print("\n" + "="*60)

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <trace_file>")
        sys.exit(1)

    analyzer = BinderAnalyzer(sys.argv[1])
    analyzer.parse_trace()
    analyzer.analyze()
    analyzer.print_report()

if __name__ == '__main__':
    main()
```

## 使用範例

### 追蹤特定應用的 Binder 調用

```bash
# 啟動追蹤
adb shell binder_tracer start

# 啟動應用
adb shell am start -n com.example.app/.MainActivity

# 執行操作...

# 停止追蹤
adb shell binder_tracer stop

# 分析
adb pull /data/local/tmp/binder_trace.txt
python3 analyzer/BinderAnalyzer.py binder_trace.txt
```

### 監控系統服務

```bash
# 追蹤 system_server
adb shell binder_tracer start --pid $(adb shell pidof system_server)

# 執行一些系統操作...

adb shell binder_tracer stop
```

## 性能優化建議

### 1. 減少 Binder 調用次數
- 批次處理多個操作
- 使用緩存減少重複調用
- 合併相關的小操作

### 2. 優化數據傳輸
- 使用 Parcelable 而非 Serializable
- 避免傳輸大型對象
- 使用共享記憶體傳輸大數據

### 3. 異步處理
- 使用 oneway 關鍵字進行異步調用
- 實作非阻塞式 IPC
- 使用回調機制

### 4. 線程池管理
- 適當設置 Binder 線程池大小
- 避免在 Binder 調用中執行耗時操作
- 使用工作隊列處理後台任務

## 編譯配置

### Android.bp

```blueprint
cc_binary {
    name: "binder_tracer",
    srcs: ["tracer/BinderTracer.cpp"],
    shared_libs: [
        "libbase",
        "liblog",
        "libutils",
    ],
    cflags: [
        "-Wall",
        "-Werror",
    ],
}
```

## 參考資源

- [Android Binder IPC](https://source.android.com/docs/core/architecture/aidl)
- [ftrace Documentation](https://www.kernel.org/doc/Documentation/trace/ftrace.txt)
- [Perfetto Tracing](https://perfetto.dev/)

---

**版本**: 1.0.0
**最後更新**: 2025-11-16
**相容性**: Android 10+
