#!/usr/bin/env python3
"""
GTK 系統監控器 - 主程式入口點
"""

import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, GLib
import sys
import psutil

class SystemMonitorWindow(Adw.ApplicationWindow):
    """主視窗類別"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 視窗設定
        self.set_title("系統監控器")
        self.set_default_size(900, 700)

        # 建立標題列
        self.header_bar = Adw.HeaderBar()

        # 建立視圖堆疊
        self.stack = Gtk.Stack()
        self.stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)

        # 建立各個監控頁面
        self.create_cpu_page()
        self.create_memory_page()
        self.create_disk_page()
        self.create_network_page()

        # 建立視圖切換器
        switcher = Adw.ViewSwitcher()
        switcher.set_stack(self.stack)
        switcher.set_policy(Adw.ViewSwitcherPolicy.WIDE)
        self.header_bar.set_title_widget(switcher)

        # 重新整理按鈕
        refresh_button = Gtk.Button()
        refresh_button.set_icon_name("view-refresh-symbolic")
        refresh_button.set_tooltip_text("重新整理")
        refresh_button.connect("clicked", self.on_refresh_clicked)
        self.header_bar.pack_end(refresh_button)

        # 建立主佈局
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        main_box.append(self.header_bar)
        main_box.append(self.stack)

        self.set_content(main_box)

        # 啟動更新計時器（每秒更新一次）
        GLib.timeout_add_seconds(1, self.update_all_data)

        # 初始更新
        self.update_all_data()

    def create_cpu_page(self):
        """建立 CPU 監控頁面"""
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)

        cpu_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        cpu_box.set_margin_top(20)
        cpu_box.set_margin_bottom(20)
        cpu_box.set_margin_start(20)
        cpu_box.set_margin_end(20)

        # CPU 使用率標題
        self.cpu_title = Gtk.Label()
        self.cpu_title.set_markup("<span size='xx-large' weight='bold'>💻 CPU 使用率</span>")
        self.cpu_title.set_halign(Gtk.Align.START)
        cpu_box.append(self.cpu_title)

        # CPU 百分比顯示
        self.cpu_percent_label = Gtk.Label()
        self.cpu_percent_label.set_markup("<span size='xxx-large' weight='bold'>0%</span>")
        self.cpu_percent_label.set_halign(Gtk.Align.START)
        cpu_box.append(self.cpu_percent_label)

        # CPU 資訊卡片
        info_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)
        info_box.set_margin_top(20)

        # 物理核心
        physical_card = self.create_info_card("🔷 物理核心", str(psutil.cpu_count(logical=False)))
        info_box.append(physical_card)

        # 邏輯核心
        logical_card = self.create_info_card("🔶 邏輯核心", str(psutil.cpu_count(logical=True)))
        info_box.append(logical_card)

        cpu_box.append(info_box)

        # 各核心使用率
        cores_label = Gtk.Label()
        cores_label.set_markup("<span size='large' weight='bold'>各核心使用率</span>")
        cores_label.set_halign(Gtk.Align.START)
        cores_label.set_margin_top(20)
        cpu_box.append(cores_label)

        # 建立核心進度條
        self.core_bars = []
        cpu_count = psutil.cpu_count(logical=True)

        for i in range(cpu_count):
            core_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
            core_box.set_margin_top(5)

            label = Gtk.Label(label=f"核心 {i}")
            label.set_width_chars(8)
            core_box.append(label)

            progress = Gtk.ProgressBar()
            progress.set_hexpand(True)
            progress.set_show_text(True)
            core_box.append(progress)

            self.core_bars.append(progress)
            cpu_box.append(core_box)

        scrolled.set_child(cpu_box)
        self.stack.add_titled(scrolled, "cpu", "CPU")

    def create_memory_page(self):
        """建立記憶體監控頁面"""
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)

        mem_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        mem_box.set_margin_top(20)
        mem_box.set_margin_bottom(20)
        mem_box.set_margin_start(20)
        mem_box.set_margin_end(20)

        # RAM 標題
        ram_title = Gtk.Label()
        ram_title.set_markup("<span size='xx-large' weight='bold'>🧠 RAM 使用情況</span>")
        ram_title.set_halign(Gtk.Align.START)
        mem_box.append(ram_title)

        # RAM 百分比
        self.ram_percent_label = Gtk.Label()
        self.ram_percent_label.set_markup("<span size='xxx-large' weight='bold'>0%</span>")
        self.ram_percent_label.set_halign(Gtk.Align.START)
        mem_box.append(self.ram_percent_label)

        # RAM 進度條
        self.ram_progress = Gtk.ProgressBar()
        self.ram_progress.set_show_text(True)
        self.ram_progress.set_margin_top(10)
        mem_box.append(self.ram_progress)

        # RAM 詳細資訊
        ram_info_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)
        ram_info_box.set_margin_top(20)

        self.ram_total_card = self.create_info_card("總容量", "0 GB")
        ram_info_box.append(self.ram_total_card)

        self.ram_used_card = self.create_info_card("已使用", "0 GB")
        ram_info_box.append(self.ram_used_card)

        self.ram_available_card = self.create_info_card("可用", "0 GB")
        ram_info_box.append(self.ram_available_card)

        mem_box.append(ram_info_box)

        # Swap 資訊
        swap_title = Gtk.Label()
        swap_title.set_markup("<span size='xx-large' weight='bold'>💾 Swap 使用情況</span>")
        swap_title.set_halign(Gtk.Align.START)
        swap_title.set_margin_top(30)
        mem_box.append(swap_title)

        # Swap 百分比
        self.swap_percent_label = Gtk.Label()
        self.swap_percent_label.set_markup("<span size='xxx-large' weight='bold'>0%</span>")
        self.swap_percent_label.set_halign(Gtk.Align.START)
        mem_box.append(self.swap_percent_label)

        # Swap 進度條
        self.swap_progress = Gtk.ProgressBar()
        self.swap_progress.set_show_text(True)
        self.swap_progress.set_margin_top(10)
        mem_box.append(self.swap_progress)

        scrolled.set_child(mem_box)
        self.stack.add_titled(scrolled, "memory", "記憶體")

    def create_disk_page(self):
        """建立磁碟監控頁面"""
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)

        self.disk_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        self.disk_box.set_margin_top(20)
        self.disk_box.set_margin_bottom(20)
        self.disk_box.set_margin_start(20)
        self.disk_box.set_margin_end(20)

        scrolled.set_child(self.disk_box)
        self.stack.add_titled(scrolled, "disk", "磁碟")

    def create_network_page(self):
        """建立網路監控頁面"""
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)

        net_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=20)
        net_box.set_margin_top(20)
        net_box.set_margin_bottom(20)
        net_box.set_margin_start(20)
        net_box.set_margin_end(20)

        # 網路標題
        net_title = Gtk.Label()
        net_title.set_markup("<span size='xx-large' weight='bold'>🌐 網路監控</span>")
        net_title.set_halign(Gtk.Align.START)
        net_box.append(net_title)

        # 流量資訊
        traffic_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=20)
        traffic_box.set_margin_top(20)

        self.download_card = self.create_info_card("⬇️ 總下載", "0 GB")
        traffic_box.append(self.download_card)

        self.upload_card = self.create_info_card("⬆️ 總上傳", "0 GB")
        traffic_box.append(self.upload_card)

        net_box.append(traffic_box)

        # 網路介面
        self.network_interfaces_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=15)
        self.network_interfaces_box.set_margin_top(20)
        net_box.append(self.network_interfaces_box)

        scrolled.set_child(net_box)
        self.stack.add_titled(scrolled, "network", "網路")

    def create_info_card(self, title, value):
        """建立資訊卡片"""
        card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
        card.set_hexpand(True)

        # 添加 CSS 類別
        card.add_css_class("card")

        title_label = Gtk.Label(label=title)
        title_label.set_halign(Gtk.Align.START)
        title_label.add_css_class("caption")
        card.append(title_label)

        value_label = Gtk.Label()
        value_label.set_markup(f"<span size='x-large' weight='bold'>{value}</span>")
        value_label.set_halign(Gtk.Align.START)
        card.append(value_label)

        # 儲存 value_label 的引用以便更新
        card.value_label = value_label

        return card

    def format_bytes(self, bytes_value):
        """格式化位元組為可讀格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"

    def update_cpu_data(self):
        """更新 CPU 資料"""
        # 總體 CPU 使用率
        cpu_percent = psutil.cpu_percent(interval=None)
        self.cpu_percent_label.set_markup(
            f"<span size='xxx-large' weight='bold'>{cpu_percent:.1f}%</span>"
        )

        # 各核心使用率
        per_cpu = psutil.cpu_percent(interval=None, percpu=True)
        for i, (bar, percent) in enumerate(zip(self.core_bars, per_cpu)):
            bar.set_fraction(percent / 100.0)
            bar.set_text(f"{percent:.1f}%")

    def update_memory_data(self):
        """更新記憶體資料"""
        # RAM 資訊
        mem = psutil.virtual_memory()

        self.ram_percent_label.set_markup(
            f"<span size='xxx-large' weight='bold'>{mem.percent:.1f}%</span>"
        )
        self.ram_progress.set_fraction(mem.percent / 100.0)
        self.ram_progress.set_text(
            f"{self.format_bytes(mem.used)} / {self.format_bytes(mem.total)}"
        )

        self.ram_total_card.value_label.set_markup(
            f"<span size='x-large' weight='bold'>{self.format_bytes(mem.total)}</span>"
        )
        self.ram_used_card.value_label.set_markup(
            f"<span size='x-large' weight='bold'>{self.format_bytes(mem.used)}</span>"
        )
        self.ram_available_card.value_label.set_markup(
            f"<span size='x-large' weight='bold'>{self.format_bytes(mem.available)}</span>"
        )

        # Swap 資訊
        swap = psutil.swap_memory()

        self.swap_percent_label.set_markup(
            f"<span size='xxx-large' weight='bold'>{swap.percent:.1f}%</span>"
        )
        self.swap_progress.set_fraction(swap.percent / 100.0)
        self.swap_progress.set_text(
            f"{self.format_bytes(swap.used)} / {self.format_bytes(swap.total)}"
        )

    def update_disk_data(self):
        """更新磁碟資料"""
        # 清除現有內容
        while self.disk_box.get_first_child():
            self.disk_box.remove(self.disk_box.get_first_child())

        # 獲取所有磁碟分割區
        partitions = psutil.disk_partitions()

        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)

                # 建立磁碟卡片
                disk_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
                disk_card.add_css_class("card")

                # 標題
                title_label = Gtk.Label()
                title_label.set_markup(
                    f"<span size='large' weight='bold'>💾 {partition.mountpoint}</span>"
                )
                title_label.set_halign(Gtk.Align.START)
                disk_card.append(title_label)

                # 裝置資訊
                device_label = Gtk.Label(label=f"裝置: {partition.device}")
                device_label.set_halign(Gtk.Align.START)
                device_label.add_css_class("dim-label")
                disk_card.append(device_label)

                # 使用率
                usage_label = Gtk.Label()
                usage_label.set_markup(f"<span size='large'>{usage.percent:.1f}% 已使用</span>")
                usage_label.set_halign(Gtk.Align.START)
                disk_card.append(usage_label)

                # 進度條
                progress = Gtk.ProgressBar()
                progress.set_fraction(usage.percent / 100.0)
                progress.set_show_text(True)
                progress.set_text(
                    f"{self.format_bytes(usage.used)} / {self.format_bytes(usage.total)}"
                )
                disk_card.append(progress)

                self.disk_box.append(disk_card)

            except PermissionError:
                continue

    def update_network_data(self):
        """更新網路資料"""
        # 總流量
        net_io = psutil.net_io_counters()

        self.download_card.value_label.set_markup(
            f"<span size='x-large' weight='bold'>{self.format_bytes(net_io.bytes_recv)}</span>"
        )
        self.upload_card.value_label.set_markup(
            f"<span size='x-large' weight='bold'>{self.format_bytes(net_io.bytes_sent)}</span>"
        )

        # 清除介面列表
        while self.network_interfaces_box.get_first_child():
            self.network_interfaces_box.remove(self.network_interfaces_box.get_first_child())

        # 網路介面資訊
        net_if_stats = psutil.net_if_stats()
        net_if_addrs = psutil.net_if_addrs()

        for interface_name, stats in net_if_stats.items():
            if_card = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8)
            if_card.add_css_class("card")

            # 介面名稱
            name_label = Gtk.Label()
            name_label.set_markup(f"<span weight='bold'>🌐 {interface_name}</span>")
            name_label.set_halign(Gtk.Align.START)
            if_card.append(name_label)

            # 狀態
            status = "🟢 已連線" if stats.isup else "🔴 未連線"
            status_label = Gtk.Label(label=status)
            status_label.set_halign(Gtk.Align.START)
            if_card.append(status_label)

            # IP 位址
            if interface_name in net_if_addrs:
                for addr in net_if_addrs[interface_name]:
                    if addr.family == 2:  # IPv4
                        ip_label = Gtk.Label(label=f"IPv4: {addr.address}")
                        ip_label.set_halign(Gtk.Align.START)
                        ip_label.add_css_class("dim-label")
                        if_card.append(ip_label)

            self.network_interfaces_box.append(if_card)

    def update_all_data(self):
        """更新所有資料"""
        self.update_cpu_data()
        self.update_memory_data()
        self.update_disk_data()
        self.update_network_data()
        return True  # 繼續計時器

    def on_refresh_clicked(self, button):
        """重新整理按鈕點擊事件"""
        self.update_all_data()


class SystemMonitorApp(Adw.Application):
    """系統監控應用程式類別"""

    def __init__(self):
        super().__init__(application_id='com.example.SystemMonitor')
        self.window = None

    def do_activate(self):
        if not self.window:
            self.window = SystemMonitorWindow(application=self)

            # 載入 CSS 樣式
            css_provider = Gtk.CssProvider()
            css = b"""
            .card {
                padding: 15px;
                background: alpha(currentColor, 0.05);
                border-radius: 8px;
                margin: 5px;
            }

            .dim-label {
                opacity: 0.7;
            }
            """
            css_provider.load_from_data(css)
            Gtk.StyleContext.add_provider_for_display(
                self.window.get_display(),
                css_provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            )

        self.window.present()


def main():
    """主函式"""
    app = SystemMonitorApp()
    return app.run(sys.argv)


if __name__ == '__main__':
    sys.exit(main())
