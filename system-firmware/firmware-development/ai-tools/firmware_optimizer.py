#!/usr/bin/env python3
"""
Firmware Optimizer - 韌體優化工具
提供大小優化、執行速度優化、記憶體優化和功耗優化建議
"""

import os
import sys
import json
import argparse
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class FirmwareOptimizer:
    """AI 驅動的韌體優化器"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化韌體優化器

        Args:
            api_key: Anthropic API 密鑰
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("未提供 ANTHROPIC_API_KEY")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def read_firmware_code(self, file_path: str) -> str:
        """讀取韌體代碼

        Args:
            file_path: 文件路徑

        Returns:
            文件內容
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise IOError(f"無法讀取文件 {file_path}: {e}")

    def optimize_size(self, code: str, language: str = "C") -> Dict:
        """優化韌體大小

        Args:
            code: 韌體代碼
            language: 編程語言

        Returns:
            大小優化建議
        """
        prompt = f"""請分析以下 {language} 韌體代碼，並提供大小優化建議。

代碼：
```{language.lower()}
{code}
```

請分析以下方面並提供優化建議：
1. 未使用的代碼和函數
2. 重複的代碼段
3. 可內聯的小函數
4. 數據結構優化（減少填充）
5. 字符串常量優化
6. 編譯器優化選項建議
7. 鏈接器腳本優化
8. 去除冗餘的庫依賴

請以 JSON 格式返回結果，包含：
- estimated_size_reduction_percent (估算減少百分比)
- optimization_suggestions (優化建議列表，每個包含 type, description, code_before, code_after, estimated_savings)
- compiler_flags (推薦的編譯器標誌)
- linker_optimizations (鏈接器優化建議)
- summary (總結)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"大小優化分析失敗: {str(e)}",
                "estimated_size_reduction_percent": 0
            }

    def optimize_speed(self, code: str, language: str = "C") -> Dict:
        """優化執行速度

        Args:
            code: 韌體代碼
            language: 編程語言

        Returns:
            速度優化建議
        """
        prompt = f"""請分析以下 {language} 韌體代碼，並提供執行速度優化建議。

代碼：
```{language.lower()}
{code}
```

請分析以下方面並提供優化建議：
1. 熱點代碼路徑識別
2. 循環優化（展開、向量化）
3. 函數內聯機會
4. 分支預測優化
5. 快取友好的數據結構
6. 算法複雜度優化
7. 避免不必要的函數調用
8. 編譯器優化級別建議

請以 JSON 格式返回結果，包含：
- estimated_speedup_percent (估算加速百分比)
- hotspots (熱點列表)
- optimization_suggestions (優化建議列表，每個包含 type, priority, description, code_before, code_after, expected_improvement)
- compiler_optimizations (編譯器優化建議)
- algorithm_improvements (算法改進建議)
- summary (總結)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"速度優化分析失敗: {str(e)}",
                "estimated_speedup_percent": 0
            }

    def optimize_memory(self, code: str, language: str = "C") -> Dict:
        """優化記憶體使用

        Args:
            code: 韌體代碼
            language: 編程語言

        Returns:
            記憶體優化建議
        """
        prompt = f"""請分析以下 {language} 韌體代碼，並提供記憶體優化建議。

代碼：
```{language.lower()}
{code}
```

請分析以下方面並提供優化建議：
1. RAM 使用優化
2. ROM/Flash 使用優化
3. 堆疊使用優化
4. 數據結構對齊和打包
5. 靜態 vs 動態分配選擇
6. 緩衝區大小優化
7. 記憶體池使用
8. 減少記憶體碎片

請以 JSON 格式返回結果，包含：
- estimated_ram_reduction_bytes (估算 RAM 減少位元組數)
- estimated_flash_reduction_bytes (估算 Flash 減少位元組數)
- current_memory_usage (當前記憶體使用估算)
- optimization_suggestions (優化建議列表)
- data_structure_improvements (數據結構改進建議)
- allocation_strategies (分配策略建議)
- summary (總結)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"記憶體優化分析失敗: {str(e)}",
                "estimated_ram_reduction_bytes": 0
            }

    def optimize_power(self, code: str, language: str = "C") -> Dict:
        """優化功耗

        Args:
            code: 韌體代碼
            language: 編程語言

        Returns:
            功耗優化建議
        """
        prompt = f"""請分析以下 {language} 韌體代碼，並提供功耗優化建議。

代碼：
```{language.lower()}
{code}
```

請分析以下方面並提供優化建議：
1. 睡眠模式使用
2. 外設電源管理
3. 時鐘頻率調整
4. 輪詢 vs 中斷
5. DMA 使用優化
6. 定時器和看門狗優化
7. 無線通信功耗
8. 待機電流優化

請以 JSON 格式返回結果，包含：
- estimated_power_reduction_percent (估算功耗減少百分比)
- power_profile (功耗分析)
- optimization_suggestions (優化建議列表，每個包含 category, priority, description, implementation, power_savings)
- sleep_mode_recommendations (睡眠模式建議)
- peripheral_management (外設管理建議)
- battery_life_impact (電池壽命影響估算)
- summary (總結)
"""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=8000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            result_text = message.content[0].text

            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            return json.loads(result_text)

        except Exception as e:
            return {
                "error": f"功耗優化分析失敗: {str(e)}",
                "estimated_power_reduction_percent": 0
            }

    def generate_optimization_report(self, file_path: str, language: str = "C",
                                     optimize_all: bool = True,
                                     optimize_size: bool = False,
                                     optimize_speed: bool = False,
                                     optimize_memory: bool = False,
                                     optimize_power: bool = False) -> Dict:
        """生成優化報告

        Args:
            file_path: 韌體文件路徑
            language: 編程語言
            optimize_all: 進行所有優化分析
            optimize_size: 進行大小優化
            optimize_speed: 進行速度優化
            optimize_memory: 進行記憶體優化
            optimize_power: 進行功耗優化

        Returns:
            完整的優化報告
        """
        code = self.read_firmware_code(file_path)

        print(f"正在分析韌體文件: {file_path}")
        print("=" * 60)

        report = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "language": language,
            "code_length": len(code),
            "line_count": len(code.splitlines()),
            "optimizations": {}
        }

        # 根據參數決定要進行哪些優化分析
        if optimize_all or optimize_size:
            print("1. 正在進行大小優化分析...")
            report["optimizations"]["size"] = self.optimize_size(code, language)

        if optimize_all or optimize_speed:
            print("2. 正在進行速度優化分析...")
            report["optimizations"]["speed"] = self.optimize_speed(code, language)

        if optimize_all or optimize_memory:
            print("3. 正在進行記憶體優化分析...")
            report["optimizations"]["memory"] = self.optimize_memory(code, language)

        if optimize_all or optimize_power:
            print("4. 正在進行功耗優化分析...")
            report["optimizations"]["power"] = self.optimize_power(code, language)

        print("=" * 60)
        print(f"優化分析完成！")

        return report

    def save_report(self, report: Dict, output_file: str, format: str = "json"):
        """保存優化報告

        Args:
            report: 優化報告
            output_file: 輸出文件路徑
            format: 輸出格式 (json 或 html)
        """
        if format == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        elif format == "html":
            html_content = self._generate_html_report(report)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

        print(f"優化報告已保存至: {output_file}")

    def _generate_html_report(self, report: Dict) -> str:
        """生成 HTML 格式的優化報告"""
        optimizations_html = ""
        for opt_type, opt_data in report.get("optimizations", {}).items():
            optimizations_html += f"""
            <div class="section">
                <h2>{opt_type.upper()} 優化</h2>
                <pre>{json.dumps(opt_data, indent=2, ensure_ascii=False)}</pre>
            </div>
            """

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>韌體優化報告 - {report.get('file', 'Unknown')}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }}
        .section {{
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .section h2 {{
            color: #f5576c;
            border-bottom: 2px solid #f5576c;
            padding-bottom: 10px;
        }}
        pre {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }}
        .meta-info {{
            color: #f0f0f0;
            font-size: 14px;
        }}
        .optimization-card {{
            background: #fff;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #f5576c;
            border-radius: 4px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>韌體優化報告</h1>
        <div class="meta-info">
            <p>文件: {report.get('file', 'N/A')}</p>
            <p>時間: {report.get('timestamp', 'N/A')}</p>
            <p>語言: {report.get('language', 'N/A')}</p>
            <p>代碼行數: {report.get('line_count', 'N/A')}</p>
        </div>
    </div>

    {optimizations_html}
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="韌體優化工具 - 使用 AI 提供韌體優化建議",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 進行所有優化分析
  %(prog)s firmware.c -o optimization_report.json

  # 僅進行大小優化分析
  %(prog)s firmware.c --size -o size_optimization.json

  # 進行速度和記憶體優化分析
  %(prog)s firmware.c --speed --memory -o report.json

  # 生成 HTML 格式報告
  %(prog)s firmware.c -o report.html -f html

  # 功耗優化分析
  %(prog)s firmware.c --power -o power_optimization.json
        """
    )

    parser.add_argument("input", help="要優化的韌體源文件")
    parser.add_argument("-o", "--output", help="輸出報告文件路徑")
    parser.add_argument("-f", "--format", choices=["json", "html"], default="json",
                       help="輸出格式 (默認: json)")
    parser.add_argument("-l", "--language", default="C",
                       help="編程語言 (默認: C)")
    parser.add_argument("--size", action="store_true",
                       help="進行大小優化分析")
    parser.add_argument("--speed", action="store_true",
                       help="進行速度優化分析")
    parser.add_argument("--memory", action="store_true",
                       help="進行記憶體優化分析")
    parser.add_argument("--power", action="store_true",
                       help="進行功耗優化分析")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建優化器
        optimizer = FirmwareOptimizer(api_key=args.api_key)

        # 決定優化類型
        optimize_all = not (args.size or args.speed or args.memory or args.power)

        # 生成優化報告
        report = optimizer.generate_optimization_report(
            args.input,
            language=args.language,
            optimize_all=optimize_all,
            optimize_size=args.size,
            optimize_speed=args.speed,
            optimize_memory=args.memory,
            optimize_power=args.power
        )

        # 輸出結果
        if args.output:
            optimizer.save_report(report, args.output, args.format)
        else:
            print(json.dumps(report, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
