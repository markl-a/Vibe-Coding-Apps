#!/usr/bin/env python3
"""
Test Generator - AI 測試生成工具
自動生成單元測試、測試用例、覆蓋率分析和模糊測試建議
"""

import os
import sys
import json
import argparse
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class TestGenerator:
    """AI 驅動的測試生成器"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化測試生成器

        Args:
            api_key: Anthropic API 密鑰
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("未提供 ANTHROPIC_API_KEY")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def read_source_code(self, file_path: str) -> str:
        """讀取源代碼

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

    def generate_unit_tests(self, code: str, language: str = "C",
                          test_framework: str = "Unity") -> Dict:
        """生成單元測試

        Args:
            code: 源代碼
            language: 編程語言
            test_framework: 測試框架

        Returns:
            生成的單元測試
        """
        prompt = f"""請為以下 {language} 代碼生成單元測試。

源代碼：
```{language.lower()}
{code}
```

測試框架: {test_framework}

請生成：
1. 針對每個函數的基本功能測試
2. 邊界條件測試
3. 錯誤處理測試
4. 參數驗證測試
5. 狀態轉換測試（如適用）

請以 JSON 格式返回結果，包含：
- test_file_name (建議的測試文件名)
- test_code (完整的測試代碼)
- test_cases (測試用例列表，每個包含 name, description, test_type, expected_result)
- setup_code (測試設置代碼)
- teardown_code (測試清理代碼)
- dependencies (測試依賴)
- build_instructions (編譯指令)
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
                "error": f"單元測試生成失敗: {str(e)}",
                "test_code": ""
            }

    def generate_test_cases(self, code: str, language: str = "C") -> Dict:
        """生成測試用例

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            測試用例集合
        """
        prompt = f"""請為以下 {language} 代碼生成詳細的測試用例。

源代碼：
```{language.lower()}
{code}
```

請生成：
1. 正常功能測試用例
2. 邊界值測試用例
3. 異常輸入測試用例
4. 壓力測試用例
5. 並發測試用例（如適用）
6. 集成測試用例

請以 JSON 格式返回結果，包含：
- test_suite_name (測試套件名稱)
- test_cases (測試用例列表，每個包含:
  - id
  - name
  - category (functional/boundary/negative/stress/concurrent/integration)
  - priority (high/medium/low)
  - preconditions
  - test_steps
  - expected_result
  - test_data
  - notes)
- coverage_analysis (覆蓋率分析)
- suggested_test_order (建議的測試執行順序)
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
                "error": f"測試用例生成失敗: {str(e)}",
                "test_cases": []
            }

    def analyze_coverage(self, code: str, language: str = "C") -> Dict:
        """分析測試覆蓋率

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            覆蓋率分析結果
        """
        prompt = f"""請分析以下 {language} 代碼的測試覆蓋率需求。

源代碼：
```{language.lower()}
{code}
```

請分析：
1. 語句覆蓋率要求
2. 分支覆蓋率要求
3. 路徑覆蓋率要求
4. 函數覆蓋率要求
5. 條件覆蓋率要求
6. MC/DC 覆蓋率（如適用）

請以 JSON 格式返回結果，包含：
- total_statements (總語句數)
- total_branches (總分支數)
- total_paths (總路徑數)
- total_functions (總函數數)
- coverage_requirements (覆蓋率要求)
- uncovered_scenarios (可能未覆蓋的場景)
- critical_paths (關鍵路徑)
- coverage_metrics (覆蓋率指標)
- recommendations (建議)
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
                "error": f"覆蓋率分析失敗: {str(e)}",
                "coverage_requirements": {}
            }

    def generate_fuzz_testing_suggestions(self, code: str, language: str = "C") -> Dict:
        """生成模糊測試建議

        Args:
            code: 源代碼
            language: 編程語言

        Returns:
            模糊測試建議
        """
        prompt = f"""請為以下 {language} 代碼生成模糊測試建議。

源代碼：
```{language.lower()}
{code}
```

請分析：
1. 適合模糊測試的輸入點
2. 輸入範圍和類型
3. 模糊測試策略
4. 變異算法建議
5. 安全關鍵點
6. 崩潰檢測方法

請以 JSON 格式返回結果，包含：
- fuzz_targets (模糊測試目標列表，每個包含:
  - function_name
  - input_parameters
  - input_ranges
  - mutation_strategies
  - expected_behaviors
  - safety_checks)
- fuzzing_tools (推薦的模糊測試工具)
- fuzzing_strategies (模糊測試策略)
- seed_inputs (種子輸入)
- monitoring_points (監控點)
- crash_analysis (崩潰分析建議)
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
                "error": f"模糊測試建議生成失敗: {str(e)}",
                "fuzz_targets": []
            }

    def generate_test_report(self, file_path: str, language: str = "C",
                           test_framework: str = "Unity",
                           include_unit_tests: bool = True,
                           include_test_cases: bool = True,
                           include_coverage: bool = True,
                           include_fuzzing: bool = True) -> Dict:
        """生成完整的測試報告

        Args:
            file_path: 源文件路徑
            language: 編程語言
            test_framework: 測試框架
            include_unit_tests: 包含單元測試
            include_test_cases: 包含測試用例
            include_coverage: 包含覆蓋率分析
            include_fuzzing: 包含模糊測試建議

        Returns:
            完整的測試報告
        """
        code = self.read_source_code(file_path)

        print(f"正在為文件生成測試: {file_path}")
        print("=" * 60)

        report = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "language": language,
            "test_framework": test_framework,
            "code_length": len(code),
            "line_count": len(code.splitlines())
        }

        if include_unit_tests:
            print("1. 正在生成單元測試...")
            report["unit_tests"] = self.generate_unit_tests(code, language, test_framework)

        if include_test_cases:
            print("2. 正在生成測試用例...")
            report["test_cases"] = self.generate_test_cases(code, language)

        if include_coverage:
            print("3. 正在分析覆蓋率...")
            report["coverage_analysis"] = self.analyze_coverage(code, language)

        if include_fuzzing:
            print("4. 正在生成模糊測試建議...")
            report["fuzzing_suggestions"] = self.generate_fuzz_testing_suggestions(code, language)

        print("=" * 60)
        print(f"測試生成完成！")

        return report

    def save_test_file(self, test_data: Dict, output_dir: str):
        """保存測試文件

        Args:
            test_data: 測試數據
            output_dir: 輸出目錄
        """
        os.makedirs(output_dir, exist_ok=True)

        # 保存單元測試代碼
        if "unit_tests" in test_data and "test_code" in test_data["unit_tests"]:
            test_file = os.path.join(output_dir, test_data["unit_tests"].get("test_file_name", "test_generated.c"))
            with open(test_file, 'w', encoding='utf-8') as f:
                f.write(test_data["unit_tests"]["test_code"])
            print(f"單元測試已保存至: {test_file}")

        # 保存完整報告
        report_file = os.path.join(output_dir, "test_report.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(test_data, f, indent=2, ensure_ascii=False)
        print(f"測試報告已保存至: {report_file}")

    def save_report(self, report: Dict, output_file: str, format: str = "json"):
        """保存報告

        Args:
            report: 測試報告
            output_file: 輸出文件路徑
            format: 輸出格式
        """
        if format == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
        elif format == "html":
            html_content = self._generate_html_report(report)
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)

        print(f"報告已保存至: {output_file}")

    def _generate_html_report(self, report: Dict) -> str:
        """生成 HTML 格式的測試報告"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>測試報告 - {report.get('file', 'Unknown')}</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
            color: #4facfe;
            border-bottom: 2px solid #4facfe;
            padding-bottom: 10px;
        }}
        pre {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }}
        .test-case {{
            background: #e7f3ff;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #4facfe;
            border-radius: 4px;
        }}
        .meta-info {{
            color: #f0f0f0;
            font-size: 14px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>測試生成報告</h1>
        <div class="meta-info">
            <p>文件: {report.get('file', 'N/A')}</p>
            <p>時間: {report.get('timestamp', 'N/A')}</p>
            <p>語言: {report.get('language', 'N/A')}</p>
            <p>測試框架: {report.get('test_framework', 'N/A')}</p>
        </div>
    </div>

    <div class="section">
        <h2>單元測試</h2>
        <pre>{json.dumps(report.get('unit_tests', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>測試用例</h2>
        <pre>{json.dumps(report.get('test_cases', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>覆蓋率分析</h2>
        <pre>{json.dumps(report.get('coverage_analysis', {}), indent=2, ensure_ascii=False)}</pre>
    </div>

    <div class="section">
        <h2>模糊測試建議</h2>
        <pre>{json.dumps(report.get('fuzzing_suggestions', {}), indent=2, ensure_ascii=False)}</pre>
    </div>
</body>
</html>
"""
        return html


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI 測試生成工具 - 自動生成單元測試和測試用例",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 生成完整的測試套件
  %(prog)s source.c -o tests/

  # 僅生成單元測試
  %(prog)s source.c --unit-tests-only -o test_source.c

  # 生成測試用例和覆蓋率分析
  %(prog)s source.c --test-cases --coverage -o report.json

  # 使用特定測試框架
  %(prog)s source.c -t CppUTest -o tests/

  # 生成 HTML 格式報告
  %(prog)s source.c -o report.html -f html
        """
    )

    parser.add_argument("input", help="要生成測試的源文件")
    parser.add_argument("-o", "--output", required=True,
                       help="輸出文件或目錄路徑")
    parser.add_argument("-f", "--format", choices=["json", "html", "code"], default="json",
                       help="輸出格式 (默認: json)")
    parser.add_argument("-l", "--language", default="C",
                       help="編程語言 (默認: C)")
    parser.add_argument("-t", "--test-framework", default="Unity",
                       help="測試框架 (默認: Unity)")
    parser.add_argument("--unit-tests-only", action="store_true",
                       help="僅生成單元測試")
    parser.add_argument("--test-cases", action="store_true",
                       help="生成測試用例")
    parser.add_argument("--coverage", action="store_true",
                       help="進行覆蓋率分析")
    parser.add_argument("--fuzzing", action="store_true",
                       help="生成模糊測試建議")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建測試生成器
        generator = TestGenerator(api_key=args.api_key)

        # 決定要生成哪些測試
        generate_all = not (args.unit_tests_only or args.test_cases or
                          args.coverage or args.fuzzing)

        # 生成測試報告
        report = generator.generate_test_report(
            args.input,
            language=args.language,
            test_framework=args.test_framework,
            include_unit_tests=generate_all or args.unit_tests_only,
            include_test_cases=generate_all or args.test_cases,
            include_coverage=generate_all or args.coverage,
            include_fuzzing=generate_all or args.fuzzing
        )

        # 輸出結果
        if args.format == "code" or os.path.isdir(args.output):
            # 保存為代碼文件
            generator.save_test_file(report, args.output)
        else:
            # 保存為報告文件
            generator.save_report(report, args.output, args.format)

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
