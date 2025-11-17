#!/usr/bin/env python3
"""
Markdown Preview - Markdown 預覽工具
在終端中渲染 Markdown 或在瀏覽器中預覽
"""

import argparse
import json
import os
import sys
import webbrowser
import http.server
import socketserver
import threading
from pathlib import Path
from typing import Optional


class MarkdownRenderer:
    """Markdown 渲染器"""

    # 簡單的 Markdown 到終端的轉換
    @staticmethod
    def render_to_terminal(content: str) -> str:
        """將 Markdown 渲染為終端友好的格式"""
        lines = content.split('\n')
        output = []

        for line in lines:
            # 標題
            if line.startswith('# '):
                output.append('\n' + '=' * 60)
                output.append(line[2:].upper())
                output.append('=' * 60)
            elif line.startswith('## '):
                output.append('\n' + '-' * 60)
                output.append(line[3:].upper())
                output.append('-' * 60)
            elif line.startswith('### '):
                output.append('\n' + line[4:].upper())
                output.append('-' * len(line[4:]))
            elif line.startswith('#### '):
                output.append('\n' + line[5:])
                output.append('~' * len(line[5:]))

            # 列表
            elif line.strip().startswith('- ') or line.strip().startswith('* '):
                indent = len(line) - len(line.lstrip())
                output.append(' ' * indent + '• ' + line.lstrip()[2:])
            elif line.strip().startswith('+ '):
                indent = len(line) - len(line.lstrip())
                output.append(' ' * indent + '▸ ' + line.lstrip()[2:])

            # 有序列表
            elif any(line.strip().startswith(f'{i}. ') for i in range(1, 10)):
                output.append(line)

            # 程式碼區塊
            elif line.strip().startswith('```'):
                if line.strip() == '```':
                    output.append('┌' + '─' * 58 + '┐')
                else:
                    lang = line.strip()[3:].strip()
                    output.append('┌─ ' + lang + ' ' + '─' * (55 - len(lang)) + '┐')

            # 引用
            elif line.startswith('> '):
                output.append('│ ' + line[2:])

            # 粗體和斜體（簡單替換）
            else:
                processed = line
                # 移除 Markdown 語法，在終端中用大寫或特殊字符替代
                processed = processed.replace('**', '')  # 粗體
                processed = processed.replace('__', '')  # 粗體
                processed = processed.replace('*', '')   # 斜體
                processed = processed.replace('_', '')   # 斜體
                output.append(processed)

        return '\n'.join(output)

    @staticmethod
    def generate_html(content: str, title: str = "Markdown Preview") -> str:
        """生成 HTML 預覽頁面"""
        html_template = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            color: #333;
        }}
        h2 {{
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            color: #444;
            margin-top: 30px;
        }}
        h3 {{
            color: #555;
            margin-top: 25px;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d73a49;
        }}
        pre {{
            background-color: #282c34;
            color: #abb2bf;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }}
        pre code {{
            background-color: transparent;
            color: #abb2bf;
            padding: 0;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            margin-left: 0;
            padding-left: 20px;
            color: #666;
            font-style: italic;
        }}
        a {{
            color: #0366d6;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }}
        th {{
            background-color: #f4f4f4;
            font-weight: bold;
        }}
        ul, ol {{
            padding-left: 30px;
        }}
        li {{
            margin: 5px 0;
        }}
        img {{
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }}
        hr {{
            border: none;
            border-top: 2px solid #ddd;
            margin: 30px 0;
        }}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
    <div class="container">
        <div id="content"></div>
    </div>
    <script>
        const markdown = {json.dumps(content)};
        document.getElementById('content').innerHTML = marked.parse(markdown);
    </script>
</body>
</html>"""
        return html_template


class PreviewServer:
    """預覽服務器"""

    def __init__(self, html_content: str, port: int = 8000):
        self.html_content = html_content
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        """啟動服務器"""
        handler = self._create_handler()

        try:
            self.server = socketserver.TCPServer(("", self.port), handler)
            self.thread = threading.Thread(target=self.server.serve_forever)
            self.thread.daemon = True
            self.thread.start()
            return True
        except OSError as e:
            print(f"❌ 無法啟動服務器在端口 {self.port}: {e}")
            return False

    def stop(self):
        """停止服務器"""
        if self.server:
            self.server.shutdown()
            self.server.server_close()

    def _create_handler(self):
        """創建請求處理器"""
        html_content = self.html_content

        class CustomHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(html_content.encode('utf-8'))

            def log_message(self, format, *args):
                pass  # 禁用訪問日誌

        return CustomHandler


def read_markdown_file(file_path: str) -> Optional[str]:
    """讀取 Markdown 文件"""
    try:
        path = Path(file_path)
        if not path.exists():
            print(f"❌ 錯誤: 文件不存在: {file_path}")
            return None

        if not path.suffix.lower() in ['.md', '.markdown', '.txt']:
            print(f"⚠️  警告: 文件可能不是 Markdown 格式: {file_path}")

        with open(path, 'r', encoding='utf-8') as f:
            return f.read()

    except Exception as e:
        print(f"❌ 錯誤讀取文件: {e}")
        return None


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='📝 Markdown Preview - Markdown 預覽工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 在終端預覽
  python markdown_preview.py README.md

  # 在瀏覽器預覽
  python markdown_preview.py README.md --browser

  # 指定端口
  python markdown_preview.py README.md --browser --port 8080

  # 生成 HTML 文件
  python markdown_preview.py README.md --output preview.html
        '''
    )

    parser.add_argument(
        'file',
        help='Markdown 文件路徑'
    )

    parser.add_argument(
        '-b', '--browser',
        action='store_true',
        help='在瀏覽器中打開預覽'
    )

    parser.add_argument(
        '-p', '--port',
        type=int,
        default=8000,
        help='預覽服務器端口（默認：8000）'
    )

    parser.add_argument(
        '-o', '--output',
        help='輸出 HTML 文件路徑'
    )

    parser.add_argument(
        '--no-watch',
        action='store_true',
        help='不監視文件變化'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='Markdown Preview v1.0.0'
    )

    args = parser.parse_args()

    # 讀取 Markdown 文件
    content = read_markdown_file(args.file)
    if content is None:
        sys.exit(1)

    file_name = Path(args.file).stem
    renderer = MarkdownRenderer()

    # 如果指定輸出文件
    if args.output:
        html = renderer.generate_html(content, file_name)
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"✅ HTML 已生成: {args.output}")
        except Exception as e:
            print(f"❌ 錯誤寫入文件: {e}")
            sys.exit(1)

    # 如果在瀏覽器中預覽
    elif args.browser:
        html = renderer.generate_html(content, file_name)
        server = PreviewServer(html, args.port)

        if server.start():
            url = f"http://localhost:{args.port}"
            print(f"🌐 預覽服務器已啟動: {url}")
            print("📝 在瀏覽器中打開...")
            webbrowser.open(url)
            print("\n按 Ctrl+C 停止服務器")

            try:
                # 保持服務器運行
                while True:
                    threading.Event().wait(1)
            except KeyboardInterrupt:
                print("\n\n👋 關閉服務器...")
                server.stop()

    # 否則在終端預覽
    else:
        print("\n" + "=" * 60)
        print(f"📝 預覽: {args.file}")
        print("=" * 60 + "\n")
        terminal_output = renderer.render_to_terminal(content)
        print(terminal_output)
        print("\n" + "=" * 60 + "\n")


if __name__ == '__main__':
    main()
