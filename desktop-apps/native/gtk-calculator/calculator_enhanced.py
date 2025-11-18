#!/usr/bin/env python3
"""
GTK 4 增强版计算器应用程序
带 AI 辅助功能、科学计算和历史记录
"""

import gi
gi.require_version('Gtk', '4.0')
gi.require_version('Adw', '1')
from gi.repository import Gtk, Adw, Gdk, GLib
import math
import re
from datetime import datetime


class CalculatorHistory:
    """计算历史记录管理"""

    def __init__(self, max_items=50):
        self.history = []
        self.max_items = max_items

    def add(self, expression, result):
        """添加历史记录"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.history.insert(0, {
            'expression': expression,
            'result': result,
            'timestamp': timestamp
        })

        # 限制历史记录数量
        if len(self.history) > self.max_items:
            self.history = self.history[:self.max_items]

    def get_all(self):
        """获取所有历史记录"""
        return self.history

    def clear(self):
        """清除历史记录"""
        self.history.clear()


class AICalculator:
    """AI 辅助计算器 - 解析自然语言表达式"""

    @staticmethod
    def parse_natural_language(text):
        """
        解析自然语言数学表达式
        例如: "2 加 3 乘 4" -> "2+3*4"
        """
        text = text.lower().strip()

        # 顺序很重要：先替换长的词组，再替换短的
        replacements = [
            ('除以', '/'),
            ('乘以', '*'),
            ('的平方', '**2'),
            ('平方根', 'sqrt'),
            ('開根號', 'sqrt'),
            ('加', '+'),
            ('減', '-'),
            ('乘', '*'),
            ('除', '/'),
        ]

        for chinese, symbol in replacements:
            text = text.replace(chinese, symbol)

        return text

    @staticmethod
    def evaluate_expression(expression):
        """
        安全地评估数学表达式
        支持: +, -, *, /, **, sqrt, sin, cos, tan, log, ln
        """
        try:
            # 创建安全的命名空间
            safe_dict = {
                "__builtins__": {},
                "sqrt": math.sqrt,
                "sin": math.sin,
                "cos": math.cos,
                "tan": math.tan,
                "log": math.log10,
                "ln": math.log,
                "pi": math.pi,
                "e": math.e,
            }

            # 替换符号
            expression = expression.replace('π', 'pi')

            # 只允许安全的字符
            if not re.match(r'^[0-9+\-*/().\s\w,]+$', expression):
                raise ValueError("Invalid characters in expression")

            # 评估表达式
            result = eval(expression, safe_dict)
            return result
        except Exception as e:
            raise ValueError(f"无法计算: {str(e)}")


class EnhancedCalculator(Adw.ApplicationWindow):
    """增强版计算器主窗口"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 设置窗口属性
        self.set_title("🧮 AI 智能计算器")
        self.set_default_size(500, 700)

        # 计算状态
        self.current_value = "0"
        self.previous_value = None
        self.operation = None
        self.should_reset = False

        # 历史记录
        self.history = CalculatorHistory()

        # AI 计算器
        self.ai_calc = AICalculator()

        # 创建 UI
        self.create_ui()

        # 设置键盘事件
        self.setup_keyboard()

    def create_ui(self):
        """创建用户界面"""
        # 主容器
        main_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=0)

        # 标题栏
        header_bar = Adw.HeaderBar()

        # 历史记录按钮
        history_btn = Gtk.Button()
        history_btn.set_icon_name("document-open-recent-symbolic")
        history_btn.set_tooltip_text("查看历史记录")
        history_btn.connect('clicked', self.show_history)
        header_bar.pack_start(history_btn)

        # AI 模式切换
        self.ai_switch = Gtk.Switch()
        self.ai_switch.set_tooltip_text("启用 AI 自然语言计算")
        ai_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=5)
        ai_label = Gtk.Label(label="AI")
        ai_box.append(ai_label)
        ai_box.append(self.ai_switch)
        header_bar.pack_end(ai_box)

        main_box.append(header_bar)

        # AI 输入框（初始隐藏）
        self.ai_entry = Gtk.Entry()
        self.ai_entry.set_placeholder_text("输入自然语言表达式，如: 2加3乘4, sqrt(16), sin(30)")
        self.ai_entry.set_margin_top(10)
        self.ai_entry.set_margin_start(20)
        self.ai_entry.set_margin_end(20)
        self.ai_entry.connect('activate', self.on_ai_calculate)
        self.ai_entry.set_visible(False)
        main_box.append(self.ai_entry)

        # 监听 AI 开关
        self.ai_switch.connect('state-set', self.on_ai_switch_changed)

        # 显示区域容器
        display_box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=5)
        display_box.set_margin_top(20)
        display_box.set_margin_bottom(20)
        display_box.set_margin_start(20)
        display_box.set_margin_end(20)

        # 上一个运算显示
        self.prev_display = Gtk.Label()
        self.prev_display.set_text("")
        self.prev_display.set_halign(Gtk.Align.END)
        self.prev_display.add_css_class("prev-display")
        display_box.append(self.prev_display)

        # 当前值显示
        self.display = Gtk.Label()
        self.display.set_text("0")
        self.display.set_halign(Gtk.Align.END)
        self.display.set_valign(Gtk.Align.END)
        self.display.add_css_class("display")
        display_box.append(self.display)

        main_box.append(display_box)

        # 按钮网格
        button_grid = Gtk.Grid()
        button_grid.set_row_homogeneous(True)
        button_grid.set_column_homogeneous(True)
        button_grid.set_row_spacing(2)
        button_grid.set_column_spacing(2)
        button_grid.set_margin_start(10)
        button_grid.set_margin_end(10)
        button_grid.set_margin_bottom(10)
        button_grid.set_vexpand(True)

        # 增强的按钮布局（添加科学计算功能）
        buttons = [
            ['C', '⌫', '√', 'x²'],
            ['7', '8', '9', '÷'],
            ['4', '5', '6', '×'],
            ['1', '2', '3', '−'],
            ['±', '0', '.', '+'],
            ['(', ')', 'π', '=']
        ]

        # 创建按钮
        for row_idx, row in enumerate(buttons):
            for col_idx, label in enumerate(row):
                button = self.create_button(label)
                button_grid.attach(button, col_idx, row_idx, 1, 1)

        main_box.append(button_grid)

        # 加载 CSS
        self.load_css()

        self.set_content(main_box)

    def create_button(self, label):
        """创建按钮"""
        button = Gtk.Button()
        button.set_label(label)
        button.set_hexpand(True)
        button.set_vexpand(True)
        button.connect('clicked', self.on_button_clicked)

        # 设置按钮样式类
        if label in ['C', '⌫']:
            button.add_css_class('function-btn')
        elif label in ['÷', '×', '−', '+', '=']:
            button.add_css_class('operator-btn')
        elif label in ['√', 'x²', '(', ')', 'π']:
            button.add_css_class('scientific-btn')
        else:
            button.add_css_class('number-btn')

        return button

    def setup_keyboard(self):
        """设置键盘快捷键"""
        controller = Gtk.EventControllerKey()
        controller.connect('key-pressed', self.on_key_pressed)
        self.add_controller(controller)

    def on_key_pressed(self, controller, keyval, keycode, state):
        """键盘按键处理"""
        key = Gdk.keyval_name(keyval)

        # 数字键
        if key in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
            self.handle_number(key)
        # 运算符
        elif key in ['plus', 'KP_Add']:
            self.handle_operator('+')
        elif key in ['minus', 'KP_Subtract']:
            self.handle_operator('−')
        elif key in ['asterisk', 'KP_Multiply']:
            self.handle_operator('×')
        elif key in ['slash', 'KP_Divide']:
            self.handle_operator('÷')
        # 其他
        elif key in ['period', 'KP_Decimal']:
            self.handle_decimal()
        elif key in ['Return', 'KP_Enter']:
            self.handle_equals()
        elif key in ['Escape']:
            self.handle_clear()
        elif key in ['BackSpace']:
            self.handle_backspace()

        self.update_display()
        return True

    def on_button_clicked(self, button):
        """按钮点击事件处理"""
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
        elif label == '√':
            self.handle_sqrt()
        elif label == 'x²':
            self.handle_square()
        elif label == 'π':
            self.handle_pi()
        elif label in ['(', ')']:
            self.handle_parenthesis(label)

        self.update_display()

    def handle_number(self, number):
        """处理数字输入"""
        if self.should_reset or self.current_value == "0":
            self.current_value = number
            self.should_reset = False
        else:
            if len(self.current_value) < 15:  # 限制长度
                self.current_value += number

    def handle_decimal(self):
        """处理小数点"""
        if self.should_reset:
            self.current_value = "0."
            self.should_reset = False
        elif '.' not in self.current_value:
            self.current_value += '.'

    def handle_operator(self, op):
        """处理运算符"""
        if self.operation and not self.should_reset:
            self.handle_equals()

        self.previous_value = float(self.current_value)
        self.operation = op
        self.should_reset = True
        self.update_prev_display()

    def handle_equals(self):
        """处理等号"""
        if self.operation and self.previous_value is not None:
            try:
                current = float(self.current_value)
                expression = f"{self.previous_value} {self.operation} {current}"

                if self.operation == '+':
                    result = self.previous_value + current
                elif self.operation == '−':
                    result = self.previous_value - current
                elif self.operation == '×':
                    result = self.previous_value * current
                elif self.operation == '÷':
                    if current == 0:
                        self.current_value = "错误: 除数不能为0"
                        self.should_reset = True
                        return
                    result = self.previous_value / current

                # 格式化结果
                result_str = self.format_result(result)

                # 添加到历史记录
                self.history.add(expression, result_str)

                self.current_value = result_str
                self.operation = None
                self.previous_value = None
                self.should_reset = True
                self.prev_display.set_text("")

            except Exception as e:
                self.current_value = f"错误: {str(e)}"
                self.should_reset = True

    def handle_clear(self):
        """清除"""
        self.current_value = "0"
        self.previous_value = None
        self.operation = None
        self.should_reset = False
        self.prev_display.set_text("")

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
            self.current_value = self.format_result(result)
        except:
            self.current_value = "错误"

    def handle_sign(self):
        """正负号切换"""
        try:
            value = float(self.current_value)
            result = -value
            self.current_value = self.format_result(result)
        except:
            pass

    def handle_sqrt(self):
        """平方根"""
        try:
            value = float(self.current_value)
            if value < 0:
                self.current_value = "错误: 负数无法开根"
                self.should_reset = True
                return
            result = math.sqrt(value)
            expression = f"√({value})"
            result_str = self.format_result(result)
            self.history.add(expression, result_str)
            self.current_value = result_str
            self.should_reset = True
        except Exception as e:
            self.current_value = f"错误: {str(e)}"
            self.should_reset = True

    def handle_square(self):
        """平方"""
        try:
            value = float(self.current_value)
            result = value ** 2
            expression = f"{value}²"
            result_str = self.format_result(result)
            self.history.add(expression, result_str)
            self.current_value = result_str
            self.should_reset = True
        except Exception as e:
            self.current_value = f"错误: {str(e)}"
            self.should_reset = True

    def handle_pi(self):
        """π 常数"""
        self.current_value = str(math.pi)
        self.should_reset = True

    def handle_parenthesis(self, paren):
        """处理括号"""
        if self.current_value == "0":
            self.current_value = paren
        else:
            self.current_value += paren

    def format_result(self, result):
        """格式化结果"""
        if result == int(result):
            return str(int(result))
        else:
            # 保留最多8位小数，去除尾随零
            return f"{result:.8f}".rstrip('0').rstrip('.')

    def update_display(self):
        """更新显示"""
        display_text = self.current_value
        if len(display_text) > 15:
            try:
                value = float(display_text)
                display_text = f"{value:.4e}"
            except:
                display_text = display_text[:15]

        self.display.set_text(display_text)

    def update_prev_display(self):
        """更新上一个运算显示"""
        if self.previous_value is not None and self.operation:
            self.prev_display.set_text(f"{self.previous_value} {self.operation}")

    def on_ai_switch_changed(self, switch, state):
        """AI 模式切换"""
        self.ai_entry.set_visible(state)
        return False

    def on_ai_calculate(self, entry):
        """AI 计算"""
        text = entry.get_text().strip()
        if not text:
            return

        try:
            # 解析自然语言
            expression = self.ai_calc.parse_natural_language(text)

            # 计算结果
            result = self.ai_calc.evaluate_expression(expression)
            result_str = self.format_result(result)

            # 添加到历史记录
            self.history.add(f"AI: {text}", result_str)

            # 显示结果
            self.current_value = result_str
            self.should_reset = True
            self.update_display()

            # 清空输入框
            entry.set_text("")

        except Exception as e:
            self.current_value = f"AI 错误: {str(e)}"
            self.should_reset = True
            self.update_display()

    def show_history(self, button):
        """显示历史记录"""
        dialog = Adw.MessageDialog(
            transient_for=self,
            heading="计算历史",
            body="最近的计算记录"
        )

        # 创建历史记录列表
        scrolled = Gtk.ScrolledWindow()
        scrolled.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC)
        scrolled.set_min_content_height(300)
        scrolled.set_min_content_width(400)

        list_box = Gtk.ListBox()
        list_box.add_css_class("boxed-list")

        history_items = self.history.get_all()
        if not history_items:
            empty_label = Gtk.Label(label="暂无历史记录")
            empty_label.add_css_class("dim-label")
            list_box.append(empty_label)
        else:
            for item in history_items:
                row = Gtk.ListBoxRow()
                box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=5)
                box.set_margin_top(10)
                box.set_margin_bottom(10)
                box.set_margin_start(10)
                box.set_margin_end(10)

                expr_label = Gtk.Label(label=item['expression'])
                expr_label.set_halign(Gtk.Align.START)
                box.append(expr_label)

                result_box = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
                result_label = Gtk.Label(label=f"= {item['result']}")
                result_label.set_halign(Gtk.Align.START)
                result_label.add_css_class("title-1")
                result_box.append(result_label)

                time_label = Gtk.Label(label=item['timestamp'])
                time_label.set_halign(Gtk.Align.END)
                time_label.set_hexpand(True)
                time_label.add_css_class("dim-label")
                result_box.append(time_label)

                box.append(result_box)
                row.set_child(box)
                list_box.append(row)

        scrolled.set_child(list_box)

        # 设置对话框内容
        dialog.set_extra_child(scrolled)

        # 添加按钮
        dialog.add_response("close", "关闭")
        dialog.add_response("clear", "清除历史")
        dialog.set_response_appearance("clear", Adw.ResponseAppearance.DESTRUCTIVE)

        dialog.connect('response', self.on_history_response)
        dialog.present()

    def on_history_response(self, dialog, response):
        """历史记录对话框响应"""
        if response == "clear":
            self.history.clear()
        dialog.close()

    def load_css(self):
        """加载 CSS 样式"""
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
            min-height: 80px;
        }

        .prev-display {
            font-size: 18px;
            color: #7f849c;
            font-family: 'SF Pro Display', 'Segoe UI', sans-serif;
            min-height: 25px;
        }

        button {
            font-size: 22px;
            font-weight: 600;
            border-radius: 12px;
            min-height: 60px;
            margin: 2px;
            transition: all 200ms;
        }

        button:hover {
            opacity: 0.85;
        }

        button:active {
            opacity: 0.65;
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

        .scientific-btn {
            background: #89b4fa;
            color: #1e1e2e;
            font-weight: 600;
        }
        """

        css_provider.load_from_data(css)
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            css_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        )


class CalculatorApp(Adw.Application):
    """计算器应用程序"""

    def __init__(self):
        super().__init__(application_id='com.vibecoding.calculator.enhanced')
        self.window = None

    def do_activate(self):
        if not self.window:
            self.window = EnhancedCalculator(application=self)
        self.window.present()


def main():
    """主函数"""
    app = CalculatorApp()
    return app.run(None)


if __name__ == '__main__':
    import sys
    sys.exit(main())
