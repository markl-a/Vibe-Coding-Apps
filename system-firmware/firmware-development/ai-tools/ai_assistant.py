#!/usr/bin/env python3
"""
AI Assistant - AI 輔助開發主程序
統一的 CLI 界面，集成所有 AI 工具
"""

import os
import sys
import json
import yaml
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

# 導入所有 AI 工具
try:
    from code_analyzer import CodeAnalyzer
    from firmware_optimizer import FirmwareOptimizer
    from test_generator import TestGenerator
    from doc_generator import DocGenerator
    from bug_hunter import BugHunter
except ImportError:
    print("警告: 某些工具模塊無法導入，請確保所有工具文件都在同一目錄下")


class AIAssistant:
    """AI 輔助開發助手主程序"""

    def __init__(self, config_file: Optional[str] = None):
        """初始化 AI 助手

        Args:
            config_file: 配置文件路徑
        """
        self.config = self._load_config(config_file)
        self.api_key = self.config.get('api_key') or os.environ.get("ANTHROPIC_API_KEY")

        if not self.api_key:
            raise ValueError("未提供 ANTHROPIC_API_KEY，請在配置文件中設置或設置環境變量")

        # 初始化各個工具
        self.code_analyzer = CodeAnalyzer(api_key=self.api_key)
        self.firmware_optimizer = FirmwareOptimizer(api_key=self.api_key)
        self.test_generator = TestGenerator(api_key=self.api_key)
        self.doc_generator = DocGenerator(api_key=self.api_key)
        self.bug_hunter = BugHunter(api_key=self.api_key)

    def _load_config(self, config_file: Optional[str]) -> Dict:
        """加載配置文件

        Args:
            config_file: 配置文件路徑

        Returns:
            配置字典
        """
        if not config_file:
            # 嘗試在當前目錄和工具目錄尋找配置文件
            possible_paths = [
                "config.yaml",
                "ai-tools/config.yaml",
                os.path.join(os.path.dirname(__file__), "config.yaml")
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    config_file = path
                    break

        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f) or {}
            except Exception as e:
                print(f"警告: 無法加載配置文件 {config_file}: {e}")
                return {}
        else:
            return {}

    def analyze_code(self, file_path: str, output: Optional[str] = None,
                    format: str = "json") -> Dict:
        """代碼分析

        Args:
            file_path: 源文件路徑
            output: 輸出文件路徑
            format: 輸出格式

        Returns:
            分析報告
        """
        print("\n" + "=" * 60)
        print("代碼質量分析")
        print("=" * 60)

        language = self.config.get('language', 'C')
        report = self.code_analyzer.generate_comprehensive_report(file_path, language)

        if output:
            self.code_analyzer.save_report(report, output, format)

        return report

    def optimize_firmware(self, file_path: str, output: Optional[str] = None,
                         format: str = "json", optimization_types: List[str] = None) -> Dict:
        """韌體優化

        Args:
            file_path: 韌體文件路徑
            output: 輸出文件路徑
            format: 輸出格式
            optimization_types: 優化類型列表

        Returns:
            優化報告
        """
        print("\n" + "=" * 60)
        print("韌體優化分析")
        print("=" * 60)

        language = self.config.get('language', 'C')
        optimize_all = not optimization_types

        report = self.firmware_optimizer.generate_optimization_report(
            file_path,
            language=language,
            optimize_all=optimize_all,
            optimize_size='size' in (optimization_types or []),
            optimize_speed='speed' in (optimization_types or []),
            optimize_memory='memory' in (optimization_types or []),
            optimize_power='power' in (optimization_types or [])
        )

        if output:
            self.firmware_optimizer.save_report(report, output, format)

        return report

    def generate_tests(self, file_path: str, output: Optional[str] = None,
                      format: str = "json") -> Dict:
        """生成測試

        Args:
            file_path: 源文件路徑
            output: 輸出路徑
            format: 輸出格式

        Returns:
            測試報告
        """
        print("\n" + "=" * 60)
        print("測試生成")
        print("=" * 60)

        language = self.config.get('language', 'C')
        test_framework = self.config.get('test_framework', 'Unity')

        report = self.test_generator.generate_test_report(
            file_path,
            language=language,
            test_framework=test_framework
        )

        if output:
            if os.path.isdir(output) or format == "code":
                self.test_generator.save_test_file(report, output)
            else:
                self.test_generator.save_report(report, output, format)

        return report

    def generate_documentation(self, file_path: str, output: Optional[str] = None,
                             doc_types: List[str] = None) -> Dict:
        """生成文檔

        Args:
            file_path: 源文件路徑
            output: 輸出路徑
            doc_types: 文檔類型列表

        Returns:
            文檔報告
        """
        print("\n" + "=" * 60)
        print("文檔生成")
        print("=" * 60)

        language = self.config.get('language', 'C')
        project_name = self.config.get('project_name', 'Firmware')
        doc_format = self.config.get('doc_format', 'markdown')
        comment_style = self.config.get('comment_style', 'doxygen')

        generate_all = not doc_types

        report = self.doc_generator.generate_documentation_package(
            file_path,
            language=language,
            project_name=project_name,
            doc_format=doc_format,
            comment_style=comment_style,
            include_api=generate_all or 'api' in (doc_types or []),
            include_comments=generate_all or 'comments' in (doc_types or []),
            include_manual=generate_all or 'manual' in (doc_types or []),
            include_readme=generate_all or 'readme' in (doc_types or [])
        )

        if output:
            if os.path.isdir(output) or generate_all:
                self.doc_generator.save_documentation(report, output)
            else:
                self.doc_generator.save_report(report, output)

        return report

    def hunt_bugs(self, file_path: str, output: Optional[str] = None,
                 format: str = "json") -> Dict:
        """Bug 檢測

        Args:
            file_path: 源文件路徑
            output: 輸出文件路徑
            format: 輸出格式

        Returns:
            Bug 檢測報告
        """
        print("\n" + "=" * 60)
        print("Bug 檢測")
        print("=" * 60)

        language = self.config.get('language', 'C')

        report = self.bug_hunter.generate_bug_report(file_path, language=language)

        if output:
            self.bug_hunter.save_report(report, output, format)

        return report

    def batch_process(self, file_list: List[str], operations: List[str],
                     output_dir: str = "ai_analysis_results") -> Dict:
        """批處理多個文件

        Args:
            file_list: 文件列表
            operations: 操作列表
            output_dir: 輸出目錄

        Returns:
            批處理結果摘要
        """
        print("\n" + "=" * 60)
        print(f"批處理 {len(file_list)} 個文件")
        print("=" * 60)

        os.makedirs(output_dir, exist_ok=True)

        results = {
            "timestamp": datetime.now().isoformat(),
            "total_files": len(file_list),
            "operations": operations,
            "files": {}
        }

        for i, file_path in enumerate(file_list, 1):
            print(f"\n處理文件 {i}/{len(file_list)}: {file_path}")
            file_results = {}

            try:
                base_name = Path(file_path).stem

                if 'analyze' in operations:
                    output = os.path.join(output_dir, f"{base_name}_analysis.json")
                    file_results['analysis'] = self.analyze_code(file_path, output)

                if 'optimize' in operations:
                    output = os.path.join(output_dir, f"{base_name}_optimization.json")
                    file_results['optimization'] = self.optimize_firmware(file_path, output)

                if 'test' in operations:
                    output = os.path.join(output_dir, f"{base_name}_tests")
                    file_results['tests'] = self.generate_tests(file_path, output, "code")

                if 'document' in operations:
                    output = os.path.join(output_dir, f"{base_name}_docs")
                    file_results['documentation'] = self.generate_documentation(file_path, output)

                if 'bugs' in operations:
                    output = os.path.join(output_dir, f"{base_name}_bugs.json")
                    file_results['bugs'] = self.hunt_bugs(file_path, output)

                results["files"][file_path] = {
                    "status": "success",
                    "results": file_results
                }

            except Exception as e:
                results["files"][file_path] = {
                    "status": "failed",
                    "error": str(e)
                }
                print(f"錯誤: {e}")

        # 保存批處理摘要
        summary_file = os.path.join(output_dir, "batch_summary.json")
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"\n批處理完成！結果保存在: {output_dir}")
        print(f"摘要文件: {summary_file}")

        return results

    def interactive_mode(self):
        """交互式模式"""
        print("\n" + "=" * 60)
        print("AI 輔助開發助手 - 交互式模式")
        print("=" * 60)
        print("\n可用命令:")
        print("  1. analyze <file>   - 代碼質量分析")
        print("  2. optimize <file>  - 韌體優化")
        print("  3. test <file>      - 生成測試")
        print("  4. document <file>  - 生成文檔")
        print("  5. bugs <file>      - Bug 檢測")
        print("  6. batch <files>    - 批處理")
        print("  7. config           - 顯示配置")
        print("  8. help             - 顯示幫助")
        print("  9. quit             - 退出")
        print()

        while True:
            try:
                command = input("請輸入命令 > ").strip()

                if not command:
                    continue

                parts = command.split()
                cmd = parts[0].lower()

                if cmd in ['quit', 'exit', 'q']:
                    print("再見！")
                    break

                elif cmd == 'help':
                    print("詳細幫助請使用: ai_assistant.py --help")

                elif cmd == 'config':
                    print(json.dumps(self.config, indent=2, ensure_ascii=False))

                elif cmd == 'analyze' and len(parts) > 1:
                    self.analyze_code(parts[1], format="json")

                elif cmd == 'optimize' and len(parts) > 1:
                    self.optimize_firmware(parts[1], format="json")

                elif cmd == 'test' and len(parts) > 1:
                    self.generate_tests(parts[1])

                elif cmd == 'document' and len(parts) > 1:
                    self.generate_documentation(parts[1])

                elif cmd == 'bugs' and len(parts) > 1:
                    self.hunt_bugs(parts[1])

                elif cmd == 'batch' and len(parts) > 1:
                    files = parts[1:]
                    self.batch_process(files, ['analyze', 'bugs'])

                else:
                    print("未知命令或缺少參數，請輸入 'help' 查看幫助")

            except KeyboardInterrupt:
                print("\n\n使用 'quit' 命令退出")
            except Exception as e:
                print(f"錯誤: {e}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI 輔助開發助手 - 集成所有 AI 工具的統一界面",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 交互式模式
  %(prog)s -i

  # 代碼質量分析
  %(prog)s analyze source.c -o report.json

  # 韌體優化
  %(prog)s optimize firmware.c -o optimization.json --types size speed

  # 生成測試
  %(prog)s test source.c -o tests/

  # 生成文檔
  %(prog)s document source.c -o docs/

  # Bug 檢測
  %(prog)s bugs source.c -o bugs.html -f html

  # 批處理
  %(prog)s batch file1.c file2.c file3.c --operations analyze optimize bugs

  # 使用配置文件
  %(prog)s -c config.yaml analyze source.c
        """
    )

    parser.add_argument("command", nargs='?',
                       choices=['analyze', 'optimize', 'test', 'document', 'bugs', 'batch'],
                       help="要執行的命令")
    parser.add_argument("files", nargs='*', help="要處理的文件")
    parser.add_argument("-c", "--config", help="配置文件路徑")
    parser.add_argument("-o", "--output", help="輸出文件或目錄路徑")
    parser.add_argument("-f", "--format", choices=["json", "html", "code"],
                       default="json", help="輸出格式")
    parser.add_argument("-i", "--interactive", action="store_true",
                       help="交互式模式")
    parser.add_argument("--types", nargs='+',
                       choices=['size', 'speed', 'memory', 'power', 'api', 'comments', 'manual', 'readme'],
                       help="優化或文檔類型")
    parser.add_argument("--operations", nargs='+',
                       choices=['analyze', 'optimize', 'test', 'document', 'bugs'],
                       help="批處理操作")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建 AI 助手
        assistant = AIAssistant(config_file=args.config)

        # 如果提供了 API key，覆蓋配置
        if args.api_key:
            assistant.api_key = args.api_key
            assistant.code_analyzer.api_key = args.api_key
            assistant.firmware_optimizer.api_key = args.api_key
            assistant.test_generator.api_key = args.api_key
            assistant.doc_generator.api_key = args.api_key
            assistant.bug_hunter.api_key = args.api_key

        # 交互式模式
        if args.interactive:
            assistant.interactive_mode()
            return

        # 命令模式
        if not args.command:
            parser.print_help()
            return

        if not args.files:
            print("錯誤: 請提供要處理的文件", file=sys.stderr)
            sys.exit(1)

        if args.command == 'analyze':
            assistant.analyze_code(args.files[0], args.output, args.format)

        elif args.command == 'optimize':
            assistant.optimize_firmware(args.files[0], args.output, args.format, args.types)

        elif args.command == 'test':
            assistant.generate_tests(args.files[0], args.output, args.format)

        elif args.command == 'document':
            assistant.generate_documentation(args.files[0], args.output, args.types)

        elif args.command == 'bugs':
            assistant.hunt_bugs(args.files[0], args.output, args.format)

        elif args.command == 'batch':
            operations = args.operations or ['analyze', 'bugs']
            output_dir = args.output or "ai_analysis_results"
            assistant.batch_process(args.files, operations, output_dir)

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
