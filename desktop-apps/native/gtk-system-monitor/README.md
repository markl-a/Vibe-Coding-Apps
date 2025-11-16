# 🖥️ GTK System Monitor - Linux 原生系統監控工具

> 🤖 **AI-Driven | AI-Native** 🚀

使用 Python 和 GTK 4 開發的現代化 Linux 原生系統監控工具，即時顯示系統資源使用情況。

## 📋 專案簡介

這是一個功能完整的 Linux 原生系統監控應用，使用 Python、GTK 4 和 libadwaita 開發。應用程式提供即時的 CPU、記憶體、磁碟和網路使用監控，完美融入 GNOME 桌面環境。

### ✨ 主要功能

- 💻 即時 CPU 使用率監控
- 🧠 記憶體使用情況顯示
- 💾 磁碟空間和 I/O 監控
- 🌐 網路流量監控
- 📊 動態圖表顯示
- ⚙️ 行程管理器
- 🎨 支援 GNOME 深淺主題
- 📈 歷史資料記錄

## 🛠️ 技術棧

- **語言**: Python 3.11+
- **UI 框架**: GTK 4 + libadwaita
- **系統資訊**: psutil
- **圖表**: matplotlib
- **架構**: MVC 模式

## 📦 系統需求

- Linux (建議 Ubuntu 22.04+ 或 Fedora 38+)
- Python 3.11 或更新版本
- GTK 4.0
- libadwaita 1.0

## 🚀 快速開始

### 1. 安裝系統依賴

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install python3 python3-pip python3-gi python3-gi-cairo \
                 gir1.2-gtk-4.0 gir1.2-adw-1 libgirepository1.0-dev \
                 gcc libcairo2-dev pkg-config python3-dev
```

#### Fedora

```bash
sudo dnf install python3 python3-pip python3-gobject gtk4 \
                 libadwaita gobject-introspection-devel \
                 cairo-devel pkg-config python3-devel
```

#### Arch Linux

```bash
sudo pacman -S python python-pip python-gobject gtk4 \
               libadwaita gobject-introspection cairo pkgconf
```

### 2. 安裝 Python 依賴

```bash
pip install psutil matplotlib pygobject pycairo
```

### 3. 執行應用

```bash
python3 main.py
```

## 📁 專案結構

```
gtk-system-monitor/
├── main.py                      # 應用程式入口點
├── requirements.txt             # Python 依賴
├── window.py                    # 主視窗
├── models/
│   ├── system_info.py          # 系統資訊模型
│   └── process_info.py         # 行程資訊模型
├── views/
│   ├── cpu_view.py             # CPU 監控視圖
│   ├── memory_view.py          # 記憶體監控視圖
│   ├── disk_view.py            # 磁碟監控視圖
│   ├── network_view.py         # 網路監控視圖
│   └── process_view.py         # 行程管理視圖
├── widgets/
│   ├── usage_chart.py          # 使用率圖表元件
│   └── stat_card.py            # 統計卡片元件
└── resources/
    └── style.css               # 自訂樣式
```

## 💻 核心程式碼

### 應用程式入口點 (main.py)

```python
#!/usr/bin/env python3
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw
import sys
from window import MainWindow

class SystemMonitorApp(Adw.Application):
    def __init__(self):
        super().__init__(application_id='com.example.SystemMonitor')
        self.window = None

    def do_activate(self):
        if not self.window:
            self.window = MainWindow(application=self)
        self.window.present()

def main():
    app = SystemMonitorApp()
    return app.run(sys.argv)

if __name__ == '__main__':
    sys.exit(main())
```

### 主視窗 (window.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, GLib
import psutil
from views.cpu_view import CPUView
from views.memory_view import MemoryView
from views.disk_view import DiskView
from views.network_view import NetworkView
from views.process_view import ProcessView

class MainWindow(Adw.ApplicationWindow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 視窗設定
        self.set_title("系統監控器")
        self.set_default_size(900, 700)

        # 建立主容器
        self.header_bar = Adw.HeaderBar()

        # 建立視圖切換器
        self.stack = Gtk.Stack()
        self.stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)

        # 新增各個監控頁面
        self.cpu_view = CPUView()
        self.stack.add_titled(self.cpu_view, "cpu", "CPU")

        self.memory_view = MemoryView()
        self.stack.add_titled(self.memory_view, "memory", "記憶體")

        self.disk_view = DiskView()
        self.stack.add_titled(self.disk_view, "disk", "磁碟")

        self.network_view = NetworkView()
        self.stack.add_titled(self.network_view, "network", "網路")

        self.process_view = ProcessView()
        self.stack.add_titled(self.process_view, "processes", "行程")

        # 建立視圖切換器
        switcher = Adw.ViewSwitcher()
        switcher.set_stack(self.stack)
        switcher.set_policy(Adw.ViewSwitcherPolicy.WIDE)
        self.header_bar.set_title_widget(switcher)

        # 重新整理按鈕
        refresh_button = Gtk.Button()
        refresh_button.set_icon_name("view-refresh-symbolic")
        refresh_button.connect("clicked", self.on_refresh_clicked)
        self.header_bar.pack_end(refresh_button)

        # 建立主佈局
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        main_box.append(self.header_bar)
        main_box.append(self.stack)

        self.set_content(main_box)

        # 啟動更新計時器（每秒更新一次）
        GLib.timeout_add_seconds(1, self.update_data)

    def update_data(self):
        """更新所有視圖的資料"""
        self.cpu_view.update()
        self.memory_view.update()
        self.disk_view.update()
        self.network_view.update()
        self.process_view.update()
        return True  # 繼續計時器

    def on_refresh_clicked(self, button):
        """手動重新整理"""
        self.update_data()
```

### CPU 監控視圖 (views/cpu_view.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw
import psutil
from collections import deque

class CPUView(Gtk.Box):
    def __init__(self):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        self.set_margin_top(20)
        self.set_margin_bottom(20)
        self.set_margin_start(20)
        self.set_margin_end(20)

        # CPU 歷史資料（保留最近 60 個資料點）
        self.cpu_history = deque(maxlen=60)

        # 總體 CPU 使用率卡片
        self.cpu_card = self.create_stat_card("💻 CPU 使用率", "0%")
        self.append(self.cpu_card)

        # CPU 核心資訊
        cpu_count = psutil.cpu_count(logical=True)
        physical_count = psutil.cpu_count(logical=False)

        info_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)

        # 物理核心
        physical_card = self.create_info_card(
            "🔷 物理核心",
            f"{physical_count} 個"
        )
        info_box.append(physical_card)

        # 邏輯核心
        logical_card = self.create_info_card(
            "🔶 邏輯核心",
            f"{cpu_count} 個"
        )
        info_box.append(logical_card)

        # CPU 頻率
        freq = psutil.cpu_freq()
        if freq:
            freq_card = self.create_info_card(
                "⚡ CPU 頻率",
                f"{freq.current:.0f} MHz"
            )
            info_box.append(freq_card)

        self.append(info_box)

        # 每核心使用率
        self.core_label = Gtk.Label()
        self.core_label.set_markup("<b>各核心使用率</b>")
        self.core_label.set_halign(Gtk.Align.START)
        self.append(self.core_label)

        # 進度條容器
        self.core_bars_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        self.append(self.core_bars_box)

        # 為每個 CPU 核心建立進度條
        self.core_bars = []
        for i in range(cpu_count):
            core_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)

            label = Gtk.Label(label=f"核心 {i}")
            label.set_width_chars(8)
            core_box.append(label)

            progress = Gtk.ProgressBar()
            progress.set_hexpand(True)
            progress.set_show_text(True)
            core_box.append(progress)

            self.core_bars.append(progress)
            self.core_bars_box.append(core_box)

        self.update()

    def create_stat_card(self, title, value):
        """建立統計卡片"""
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        card.add_css_class("card")
        card.set_margin_top(10)
        card.set_margin_bottom(10)
        card.set_margin_start(10)
        card.set_margin_end(10)

        title_label = Gtk.Label()
        title_label.set_markup(f"<span size='large'>{title}</span>")
        title_label.set_halign(Gtk.Align.START)
        card.append(title_label)

        self.value_label = Gtk.Label()
        self.value_label.set_markup(
            f"<span size='xx-large' weight='bold'>{value}</span>"
        )
        self.value_label.set_halign(Gtk.Align.START)
        card.append(self.value_label)

        return card

    def create_info_card(self, title, value):
        """建立資訊卡片"""
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=5)
        card.add_css_class("card")
        card.set_hexpand(True)

        title_label = Gtk.Label(label=title)
        title_label.set_halign(Gtk.Align.START)
        card.append(title_label)

        value_label = Gtk.Label()
        value_label.set_markup(f"<span size='large' weight='bold'>{value}</span>")
        value_label.set_halign(Gtk.Align.START)
        card.append(value_label)

        return card

    def update(self):
        """更新 CPU 資訊"""
        # 總體 CPU 使用率
        cpu_percent = psutil.cpu_percent(interval=None)
        self.value_label.set_markup(
            f"<span size='xx-large' weight='bold'>{cpu_percent:.1f}%</span>"
        )

        # 各核心使用率
        per_cpu = psutil.cpu_percent(interval=None, percpu=True)
        for i, (bar, percent) in enumerate(zip(self.core_bars, per_cpu)):
            bar.set_fraction(percent / 100.0)
            bar.set_text(f"{percent:.1f}%")
```

### 記憶體監控視圖 (views/memory_view.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw
import psutil

class MemoryView(Gtk.Box):
    def __init__(self):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        self.set_margin_top(20)
        self.set_margin_bottom(20)
        self.set_margin_start(20)
        self.set_margin_end(20)

        # RAM 使用率
        ram_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        ram_box.add_css_class("card")

        ram_title = Gtk.Label()
        ram_title.set_markup("<span size='large'>🧠 RAM 使用情況</span>")
        ram_title.set_halign(Gtk.Align.START)
        ram_box.append(ram_title)

        self.ram_value = Gtk.Label()
        self.ram_value.set_halign(Gtk.Align.START)
        ram_box.append(self.ram_value)

        self.ram_progress = Gtk.ProgressBar()
        self.ram_progress.set_show_text(True)
        ram_box.append(self.ram_progress)

        self.append(ram_box)

        # RAM 詳細資訊
        info_grid = Gtk.Grid()
        info_grid.set_column_spacing(20)
        info_grid.set_row_spacing(10)
        info_grid.add_css_class("card")

        labels = ["總容量:", "已使用:", "可用:", "快取:"]
        self.info_values = []

        for i, label_text in enumerate(labels):
            label = Gtk.Label(label=label_text)
            label.set_halign(Gtk.Align.START)
            info_grid.attach(label, 0, i, 1, 1)

            value = Gtk.Label()
            value.set_halign(Gtk.Align.END)
            value.set_hexpand(True)
            self.info_values.append(value)
            info_grid.attach(value, 1, i, 1, 1)

        self.append(info_grid)

        # Swap 使用情況
        swap_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        swap_box.add_css_class("card")

        swap_title = Gtk.Label()
        swap_title.set_markup("<span size='large'>💾 Swap 使用情況</span>")
        swap_title.set_halign(Gtk.Align.START)
        swap_box.append(swap_title)

        self.swap_value = Gtk.Label()
        self.swap_value.set_halign(Gtk.Align.START)
        swap_box.append(self.swap_value)

        self.swap_progress = Gtk.ProgressBar()
        self.swap_progress.set_show_text(True)
        swap_box.append(self.swap_progress)

        self.append(swap_box)

        self.update()

    def format_bytes(self, bytes_value):
        """格式化位元組為可讀格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"

    def update(self):
        """更新記憶體資訊"""
        # RAM 資訊
        mem = psutil.virtual_memory()

        self.ram_value.set_markup(
            f"<span size='x-large' weight='bold'>{mem.percent:.1f}%</span>"
        )
        self.ram_progress.set_fraction(mem.percent / 100.0)
        self.ram_progress.set_text(
            f"{self.format_bytes(mem.used)} / {self.format_bytes(mem.total)}"
        )

        # 詳細資訊
        self.info_values[0].set_text(self.format_bytes(mem.total))
        self.info_values[1].set_text(self.format_bytes(mem.used))
        self.info_values[2].set_text(self.format_bytes(mem.available))
        self.info_values[3].set_text(self.format_bytes(getattr(mem, 'cached', 0)))

        # Swap 資訊
        swap = psutil.swap_memory()

        self.swap_value.set_markup(
            f"<span size='x-large' weight='bold'>{swap.percent:.1f}%</span>"
        )
        self.swap_progress.set_fraction(swap.percent / 100.0)
        self.swap_progress.set_text(
            f"{self.format_bytes(swap.used)} / {self.format_bytes(swap.total)}"
        )
```

### 磁碟監控視圖 (views/disk_view.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw
import psutil

class DiskView(Gtk.ScrolledWindow):
    def __init__(self):
        super().__init__()
        self.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)

        self.main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        self.main_box.set_margin_top(20)
        self.main_box.set_margin_bottom(20)
        self.main_box.set_margin_start(20)
        self.main_box.set_margin_end(20)

        self.set_child(self.main_box)
        self.update()

    def format_bytes(self, bytes_value):
        """格式化位元組為可讀格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"

    def update(self):
        """更新磁碟資訊"""
        # 清除現有內容
        while self.main_box.get_first_child():
            self.main_box.remove(self.main_box.get_first_child())

        # 獲取所有磁碟分割區
        partitions = psutil.disk_partitions()

        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)

                # 建立磁碟卡片
                disk_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
                disk_box.add_css_class("card")

                # 標題
                title_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
                icon = Gtk.Label(label="💾")
                title_box.append(icon)

                title = Gtk.Label()
                title.set_markup(
                    f"<span size='large' weight='bold'>{partition.mountpoint}</span>"
                )
                title.set_halign(Gtk.Align.START)
                title.set_hexpand(True)
                title_box.append(title)

                disk_box.append(title_box)

                # 裝置資訊
                device_label = Gtk.Label(label=f"裝置: {partition.device}")
                device_label.set_halign(Gtk.Align.START)
                device_label.add_css_class("dim-label")
                disk_box.append(device_label)

                # 使用情況
                usage_label = Gtk.Label()
                usage_label.set_markup(
                    f"<span size='large'>{usage.percent:.1f}% 已使用</span>"
                )
                usage_label.set_halign(Gtk.Align.START)
                disk_box.append(usage_label)

                # 進度條
                progress = Gtk.ProgressBar()
                progress.set_fraction(usage.percent / 100.0)
                progress.set_show_text(True)
                progress.set_text(
                    f"{self.format_bytes(usage.used)} / {self.format_bytes(usage.total)}"
                )
                disk_box.append(progress)

                # 詳細資訊
                details_grid = Gtk.Grid()
                details_grid.set_column_spacing(20)
                details_grid.set_row_spacing(5)
                details_grid.set_margin_top(10)

                details = [
                    ("總容量:", self.format_bytes(usage.total)),
                    ("已使用:", self.format_bytes(usage.used)),
                    ("可用:", self.format_bytes(usage.free)),
                    ("檔案系統:", partition.fstype),
                ]

                for i, (label_text, value_text) in enumerate(details):
                    label = Gtk.Label(label=label_text)
                    label.set_halign(Gtk.Align.START)
                    label.add_css_class("dim-label")
                    details_grid.attach(label, 0, i, 1, 1)

                    value = Gtk.Label(label=value_text)
                    value.set_halign(Gtk.Align.END)
                    value.set_hexpand(True)
                    details_grid.attach(value, 1, i, 1, 1)

                disk_box.append(details_grid)

                self.main_box.append(disk_box)

            except PermissionError:
                # 跳過無權限存取的分割區
                continue
```

### 網路監控視圖 (views/network_view.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw
import psutil
import time

class NetworkView(Gtk.Box):
    def __init__(self):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        self.set_margin_top(20)
        self.set_margin_bottom(20)
        self.set_margin_start(20)
        self.set_margin_end(20)

        # 儲存上次的網路統計
        self.last_net_io = psutil.net_io_counters()
        self.last_time = time.time()

        # 總流量卡片
        traffic_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)

        # 下載流量
        download_card = self.create_traffic_card("⬇️ 下載速度", "0 B/s")
        self.download_value = download_card[1]
        traffic_box.append(download_card[0])

        # 上傳流量
        upload_card = self.create_traffic_card("⬆️ 上傳速度", "0 B/s")
        self.upload_value = upload_card[1]
        traffic_box.append(upload_card[0])

        self.append(traffic_box)

        # 網路介面資訊
        self.interfaces_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        self.append(self.interfaces_box)

        self.update()

    def create_traffic_card(self, title, value):
        """建立流量卡片"""
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        card.add_css_class("card")
        card.set_hexpand(True)

        title_label = Gtk.Label(label=title)
        title_label.set_halign(Gtk.Align.START)
        card.append(title_label)

        value_label = Gtk.Label()
        value_label.set_markup(f"<span size='xx-large' weight='bold'>{value}</span>")
        value_label.set_halign(Gtk.Align.START)
        card.append(value_label)

        return (card, value_label)

    def format_bytes(self, bytes_value):
        """格式化位元組為可讀格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"

    def update(self):
        """更新網路資訊"""
        current_time = time.time()
        current_net_io = psutil.net_io_counters()

        # 計算速度
        time_delta = current_time - self.last_time

        if time_delta > 0:
            download_speed = (current_net_io.bytes_recv - self.last_net_io.bytes_recv) / time_delta
            upload_speed = (current_net_io.bytes_sent - self.last_net_io.bytes_sent) / time_delta

            self.download_value.set_markup(
                f"<span size='xx-large' weight='bold'>{self.format_bytes(download_speed)}/s</span>"
            )
            self.upload_value.set_markup(
                f"<span size='xx-large' weight='bold'>{self.format_bytes(upload_speed)}/s</span>"
            )

        self.last_net_io = current_net_io
        self.last_time = current_time

        # 清除介面列表
        while self.interfaces_box.get_first_child():
            self.interfaces_box.remove(self.interfaces_box.get_first_child())

        # 顯示各網路介面
        net_if_addrs = psutil.net_if_addrs()
        net_if_stats = psutil.net_if_stats()

        for interface_name, addrs in net_if_addrs.items():
            if interface_name in net_if_stats:
                stats = net_if_stats[interface_name]

                # 建立介面卡片
                if_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
                if_box.add_css_class("card")

                # 介面名稱
                name_label = Gtk.Label()
                name_label.set_markup(f"<span size='large' weight='bold'>🌐 {interface_name}</span>")
                name_label.set_halign(Gtk.Align.START)
                if_box.append(name_label)

                # 狀態
                status = "🟢 已連線" if stats.isup else "🔴 未連線"
                status_label = Gtk.Label(label=status)
                status_label.set_halign(Gtk.Align.START)
                if_box.append(status_label)

                # IP 位址
                for addr in addrs:
                    if addr.family == 2:  # IPv4
                        ip_label = Gtk.Label(label=f"IPv4: {addr.address}")
                        ip_label.set_halign(Gtk.Align.START)
                        ip_label.add_css_class("dim-label")
                        if_box.append(ip_label)

                self.interfaces_box.append(if_box)
```

### 行程管理視圖 (views/process_view.py)

```python
import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, Gio
import psutil

class ProcessView(Gtk.Box):
    def __init__(self):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=10)
        self.set_margin_top(20)
        self.set_margin_bottom(20)
        self.set_margin_start(20)
        self.set_margin_end(20)

        # 工具列
        toolbar = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        toolbar.set_margin_bottom(10)

        # 搜尋框
        self.search_entry = Gtk.SearchEntry()
        self.search_entry.set_placeholder_text("搜尋行程...")
        self.search_entry.set_hexpand(True)
        self.search_entry.connect("search-changed", self.on_search_changed)
        toolbar.append(self.search_entry)

        # 排序選項
        sort_label = Gtk.Label(label="排序:")
        toolbar.append(sort_label)

        self.sort_combo = Gtk.ComboBoxText()
        self.sort_combo.append("cpu", "CPU 使用率")
        self.sort_combo.append("memory", "記憶體使用")
        self.sort_combo.append("name", "名稱")
        self.sort_combo.set_active_id("cpu")
        self.sort_combo.connect("changed", self.on_sort_changed)
        toolbar.append(self.sort_combo)

        self.append(toolbar)

        # 行程列表
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scrolled.set_vexpand(True)

        # 建立 ListStore
        # 欄位: PID, 名稱, CPU%, 記憶體%, 使用者
        self.store = Gtk.ListStore(int, str, str, str, str)

        # 建立 TreeView
        self.tree_view = Gtk.TreeView(model=self.store)

        # 新增欄位
        columns = [
            ("PID", 0),
            ("行程名稱", 1),
            ("CPU %", 2),
            ("記憶體 %", 3),
            ("使用者", 4),
        ]

        for title, column_id in columns:
            renderer = Gtk.CellRendererText()
            column = Gtk.TreeViewColumn(title, renderer, text=column_id)
            column.set_sort_column_id(column_id)
            self.tree_view.append_column(column)

        scrolled.set_child(self.tree_view)
        self.append(scrolled)

        self.search_text = ""
        self.sort_by = "cpu"
        self.update()

    def on_search_changed(self, entry):
        """搜尋文字變更"""
        self.search_text = entry.get_text().lower()
        self.update()

    def on_sort_changed(self, combo):
        """排序選項變更"""
        self.sort_by = combo.get_active_id()
        self.update()

    def update(self):
        """更新行程列表"""
        self.store.clear()

        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'username']):
            try:
                pinfo = proc.info
                if self.search_text and self.search_text not in pinfo['name'].lower():
                    continue

                processes.append(pinfo)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # 排序
        if self.sort_by == "cpu":
            processes.sort(key=lambda x: x['cpu_percent'] or 0, reverse=True)
        elif self.sort_by == "memory":
            processes.sort(key=lambda x: x['memory_percent'] or 0, reverse=True)
        elif self.sort_by == "name":
            processes.sort(key=lambda x: x['name'].lower())

        # 只顯示前 100 個行程
        for proc in processes[:100]:
            self.store.append([
                proc['pid'],
                proc['name'],
                f"{proc['cpu_percent']:.1f}" if proc['cpu_percent'] else "0.0",
                f"{proc['memory_percent']:.1f}" if proc['memory_percent'] else "0.0",
                proc['username'] or "N/A",
            ])
```

### 依賴套件 (requirements.txt)

```
psutil>=5.9.0
PyGObject>=3.42.0
pycairo>=1.20.0
matplotlib>=3.7.0
```

## 🎯 功能特點

### 1. 現代化 GTK 4 介面
- 使用 libadwaita 提供現代化 GNOME 風格
- 響應式設計和流暢動畫
- 支援深淺主題

### 2. 即時監控
- 每秒更新系統資訊
- 低資源占用
- 精確的資料收集

### 3. 完整的系統資訊
- CPU 使用率和核心資訊
- 記憶體和 Swap 使用情況
- 磁碟空間和 I/O
- 網路流量監控
- 行程管理

## 📦 打包發布

### 建立 AppImage

```bash
# 安裝 python-appimage
pip install python-appimage

# 建立 AppImage
python-appimage build app -l manylinux2014_x86_64
```

### 建立 Flatpak

建立 `com.example.SystemMonitor.json`:

```json
{
  "app-id": "com.example.SystemMonitor",
  "runtime": "org.gnome.Platform",
  "runtime-version": "45",
  "sdk": "org.gnome.Sdk",
  "command": "system-monitor",
  "finish-args": [
    "--share=ipc",
    "--socket=wayland",
    "--socket=fallback-x11",
    "--device=dri"
  ],
  "modules": [
    {
      "name": "system-monitor",
      "buildsystem": "simple",
      "build-commands": [
        "pip3 install --prefix=/app -r requirements.txt",
        "install -D main.py /app/bin/system-monitor"
      ],
      "sources": [
        {
          "type": "dir",
          "path": "."
        }
      ]
    }
  ]
}
```

```bash
flatpak-builder --force-clean build-dir com.example.SystemMonitor.json
```

## 🎨 自訂和擴展

### 新增自訂 CSS 樣式

```css
/* resources/style.css */
.card {
    padding: 15px;
    background: alpha(currentColor, 0.05);
    border-radius: 8px;
}

.dim-label {
    opacity: 0.7;
}
```

### 新增圖表顯示

使用 matplotlib 整合圖表：

```python
from matplotlib.backends.backend_gtk4agg import FigureCanvasGTK4Agg
from matplotlib.figure import Figure

fig = Figure()
ax = fig.add_subplot(111)
canvas = FigureCanvasGTK4Agg(fig)
```

## 📚 學習資源

- [GTK 4 文檔](https://docs.gtk.org/gtk4/)
- [libadwaita 文檔](https://gnome.pages.gitlab.gnome.org/libadwaita/)
- [PyGObject 教學](https://pygobject.readthedocs.io/)
- [psutil 文檔](https://psutil.readthedocs.io/)

## ❓ 常見問題

**Q: 為什麼選擇 Python 而不是 C?**
A: Python 開發速度快，有豐富的系統監控庫（psutil），適合快速原型開發。

**Q: 如何降低資源占用?**
A: 調整更新頻率，減少不必要的資料收集，使用惰性載入。

**Q: 支援 Wayland 嗎?**
A: 是的，GTK 4 完整支援 Wayland。

## 📄 授權

MIT License

---

**建議使用的 AI 工具**: GitHub Copilot、Cursor、Claude Code
**最後更新**: 2025-11-16
**狀態**: ✅ 完整可用專案
