#!/usr/bin/env python3
"""
GTK 4 計算器應用程式
使用 Python + GTK 4 開發的現代化計算器
"""

import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, Gdk
import math


class Calculator(Adw.ApplicationWindow):
    """計算器主視窗"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 設定視窗屬性
        self.set_title("計算器")
        self.set_default_size(400, 500)

        # 計算狀態
        self.current_value = "0"
        self.previous_value = None
        self.operation = None
        self.should_reset = False

        # 建立 UI
        self.create_ui()

    def create_ui(self):
        """建立使用者介面"""
        # 主容器
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)

        # 標題列
        header_bar = Adw.HeaderBar()
        main_box.append(header_bar)

        # 顯示區域
        self.display = Gtk.Label()
        self.display.set_text("0")
        self.display.set_halign(Gtk.Align.END)
        self.display.set_valign(Gtk.Align.END)
        self.display.set_margin_top(20)
        self.display.set_margin_bottom(20)
        self.display.set_margin_start(20)
        self.display.set_margin_end(20)
        self.display.add_css_class("display")
        main_box.append(self.display)

        # 按鈕網格
        button_grid = Gtk.Grid()
        button_grid.set_row_homogeneous(True)
        button_grid.set_column_homogeneous(True)
        button_grid.set_row_spacing(1)
        button_grid.set_column_spacing(1)
        button_grid.set_margin_start(10)
        button_grid.set_margin_end(10)
        button_grid.set_margin_bottom(10)
        button_grid.set_vexpand(True)

        # 按鈕佈局
        buttons = [
            ['C', '⌫', '%', '÷'],
            ['7', '8', '9', '×'],
            ['4', '5', '6', '−'],
            ['1', '2', '3', '+'],
            ['±', '0', '.', '=']
        ]

        # 建立按鈕
        for row_idx, row in enumerate(buttons):
            for col_idx, label in enumerate(row):
                button = self.create_button(label)
                button_grid.attach(button, col_idx, row_idx, 1, 1)

        main_box.append(button_grid)

        # 載入 CSS
        self.load_css()

        self.set_content(main_box)

    def create_button(self, label):
        """建立按鈕"""
        button = Gtk.Button()
        button.set_label(label)
        button.set_hexpand(True)
        button.set_vexpand(True)
        button.connect('clicked', self.on_button_clicked)

        # 設定按鈕樣式類別
        if label in ['C', '⌫', '%', '±']:
            button.add_css_class('function-btn')
        elif label in ['÷', '×', '−', '+', '=']:
            button.add_css_class('operator-btn')
        else:
            button.add_css_class('number-btn')

        return button

    def on_button_clicked(self, button):
        """按鈕點擊事件處理"""
        label = button.get_label()

        if label.isdigit():
            self.handle_number(label)
        elif label == '.':
            self.handle_decimal()
        elif label in ['÷', '×', '−', '+']:
            self.handle_operator(label)
        elif label == '=':
            self.handle_equals()
        elif label == 'C':
            self.handle_clear()
        elif label == '⌫':
            self.handle_backspace()
        elif label == '%':
            self.handle_percent()
        elif label == '±':
            self.handle_sign()

        self.update_display()

    def handle_number(self, number):
        """處理數字輸入"""
        if self.should_reset or self.current_value == "0":
            self.current_value = number
            self.should_reset = False
        else:
            if len(self.current_value) < 12:  # 限制長度
                self.current_value += number

    def handle_decimal(self):
        """處理小數點"""
        if self.should_reset:
            self.current_value = "0."
            self.should_reset = False
        elif '.' not in self.current_value:
            self.current_value += '.'

    def handle_operator(self, op):
        """處理運算符"""
        if self.operation and not self.should_reset:
            self.handle_equals()

        self.previous_value = float(self.current_value)
        self.operation = op
        self.should_reset = True

    def handle_equals(self):
        """處理等號"""
        if self.operation and self.previous_value is not None:
            try:
                current = float(self.current_value)

                if self.operation == '+':
                    result = self.previous_value + current
                elif self.operation == '−':
                    result = self.previous_value - current
                elif self.operation == '×':
                    result = self.previous_value * current
                elif self.operation == '÷':
                    if current == 0:
                        self.current_value = "錯誤"
                        self.should_reset = True
                        return
                    result = self.previous_value / current

                # 格式化結果
                if result == int(result):
                    self.current_value = str(int(result))
                else:
                    self.current_value = f"{result:.8f}".rstrip('0').rstrip('.')

                self.operation = None
                self.previous_value = None
                self.should_reset = True

            except Exception as e:
                self.current_value = "錯誤"
                self.should_reset = True

    def handle_clear(self):
        """清除"""
        self.current_value = "0"
        self.previous_value = None
        self.operation = None
        self.should_reset = False

    def handle_backspace(self):
        """退格"""
        if not self.should_reset and len(self.current_value) > 1:
            self.current_value = self.current_value[:-1]
        else:
            self.current_value = "0"

    def handle_percent(self):
        """百分比"""
        try:
            value = float(self.current_value)
            result = value / 100
            if result == int(result):
                self.current_value = str(int(result))
            else:
                self.current_value = f"{result:.8f}".rstrip('0').rstrip('.')
        except:
            self.current_value = "錯誤"

    def handle_sign(self):
        """正負號切換"""
        try:
            value = float(self.current_value)
            result = -value
            if result == int(result):
                self.current_value = str(int(result))
            else:
                self.current_value = f"{result:.8f}".rstrip('0').rstrip('.')
        except:
            pass

    def update_display(self):
        """更新顯示"""
        # 限制顯示長度
        display_text = self.current_value
        if len(display_text) > 12:
            try:
                value = float(display_text)
                display_text = f"{value:.4e}"
            except:
                display_text = display_text[:12]

        self.display.set_text(display_text)

    def load_css(self):
        """載入 CSS 樣式"""
        css_provider = Gtk.CssProvider()
        css = b"""
        window {
            background: #1e1e2e;
        }

        .display {
            font-size: 48px;
            font-weight: bold;
            color: #cdd6f4;
            font-family: 'SF Pro Display', 'Segoe UI', sans-serif;
            min-height: 100px;
        }

        button {
            font-size: 24px;
            font-weight: 600;
            border-radius: 12px;
            min-height: 70px;
            margin: 4px;
            transition: all 200ms;
        }

        button:hover {
            opacity: 0.8;
        }

        button:active {
            opacity: 0.6;
        }

        .number-btn {
            background: #313244;
            color: #cdd6f4;
        }

        .operator-btn {
            background: #f38ba8;
            color: #1e1e2e;
            font-weight: 700;
        }

        .function-btn {
            background: #45475a;
            color: #cdd6f4;
        }
        """

        css_provider.load_from_data(css)
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            css_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )


class CalculatorApp(Adw.Application):
    """計算器應用程式"""

    def __init__(self):
        super().__init__(application_id='com.vibecoding.calculator')
        self.window = None

    def do_activate(self):
        if not self.window:
            self.window = Calculator(application=self)
        self.window.present()


def main():
    """主函式"""
    app = CalculatorApp()
    return app.run(None)


if __name__ == '__main__':
    import sys
    sys.exit(main())
