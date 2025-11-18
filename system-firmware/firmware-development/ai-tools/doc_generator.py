#!/usr/bin/env python3
"""
Documentation Generator - AI 文檔生成工具
自動生成 API 文檔、代碼註釋、使用手冊和 README
"""

import os
import sys
import json
import argparse
import anthropic
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional


class DocGenerator:
    """AI 驅動的文檔生成器"""

    def __init__(self, api_key: Optional[str] = None):
        """初始化文檔生成器

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

    def generate_api_documentation(self, code: str, language: str = "C",
                                   format: str = "markdown") -> Dict:
        """生成 API 文檔

        Args:
            code: 源代碼
            language: 編程語言
            format: 文檔格式

        Returns:
            API 文檔
        """
        prompt = f"""請為以下 {language} 代碼生成詳細的 API 文檔。

源代碼：
```{language.lower()}
{code}
```

文檔格式: {format}

請生成：
1. 每個函數的詳細說明
2. 參數說明（類型、用途、範圍）
3. 返回值說明
4. 使用示例
5. 注意事項和限制
6. 相關函數引用
7. 錯誤處理說明

請以 JSON 格式返回結果，包含：
- api_documentation (完整的 API 文檔文本)
- functions (函數列表，每個包含:
  - name
  - description
  - parameters
  - return_value
  - usage_example
  - notes
  - related_functions
  - complexity)
- data_structures (數據結構文檔)
- constants (常量說明)
- macros (宏定義說明)
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
                "error": f"API 文檔生成失敗: {str(e)}",
                "api_documentation": ""
            }

    def generate_code_comments(self, code: str, language: str = "C",
                             style: str = "doxygen") -> Dict:
        """生成代碼註釋

        Args:
            code: 源代碼
            language: 編程語言
            style: 註釋風格

        Returns:
            帶註釋的代碼
        """
        prompt = f"""請為以下 {language} 代碼添加詳細的註釋。

源代碼：
```{language.lower()}
{code}
```

註釋風格: {style}

請添加：
1. 文件頭註釋（版權、作者、描述）
2. 函數註釋（功能、參數、返回值）
3. 複雜邏輯的行內註釋
4. 數據結構註釋
5. 常量和宏的註釋
6. TODO/FIXME 標記（如需要）

請以 JSON 格式返回結果，包含：
- commented_code (帶註釋的完整代碼)
- file_header (文件頭註釋)
- function_comments (函數註釋列表)
- inline_comments (行內註釋列表)
- summary (註釋摘要)
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
                "error": f"代碼註釋生成失敗: {str(e)}",
                "commented_code": code
            }

    def generate_user_manual(self, code: str, language: str = "C",
                           project_name: str = "Firmware") -> Dict:
        """生成使用手冊

        Args:
            code: 源代碼
            language: 編程語言
            project_name: 項目名稱

        Returns:
            使用手冊
        """
        prompt = f"""請為以下 {language} 代碼生成用戶使用手冊。

項目名稱: {project_name}

源代碼：
```{language.lower()}
{code}
```

請生成包含以下內容的手冊：
1. 簡介和概述
2. 系統要求
3. 安裝和配置
4. 快速開始指南
5. 功能說明
6. API 使用方法
7. 配置選項
8. 故障排除
9. 常見問題 FAQ
10. 示例和最佳實踐

請以 JSON 格式返回結果，包含：
- manual_content (Markdown 格式的完整手冊)
- sections (章節列表，每個包含 title, content)
- examples (使用示例列表)
- faq (常見問題列表)
- troubleshooting (故障排除指南)
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
                "error": f"使用手冊生成失敗: {str(e)}",
                "manual_content": ""
            }

    def generate_readme(self, code: str, language: str = "C",
                       project_name: str = "Firmware Project",
                       repository_url: str = "") -> Dict:
        """生成 README 文件

        Args:
            code: 源代碼
            language: 編程語言
            project_name: 項目名稱
            repository_url: 倉庫 URL

        Returns:
            README 內容
        """
        prompt = f"""請為以下 {language} 項目生成 README.md 文件。

項目名稱: {project_name}
倉庫 URL: {repository_url}

源代碼：
```{language.lower()}
{code}
```

請生成包含以下內容的 README：
1. 項目標題和描述
2. 功能特性
3. 技術棧
4. 快速開始
5. 安裝說明
6. 使用方法
7. API 文檔連結
8. 配置說明
9. 貢獻指南
10. 許可證信息
11. 聯繫方式

請以 JSON 格式返回結果，包含：
- readme_content (Markdown 格式的完整 README)
- badges (建議的徽章列表)
- features (功能特性列表)
- installation_steps (安裝步驟)
- usage_examples (使用示例)
- contributing_guidelines (貢獻指南)
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
                "error": f"README 生成失敗: {str(e)}",
                "readme_content": ""
            }

    def generate_documentation_package(self, file_path: str, language: str = "C",
                                      project_name: str = "Firmware",
                                      doc_format: str = "markdown",
                                      comment_style: str = "doxygen",
                                      include_api: bool = True,
                                      include_comments: bool = True,
                                      include_manual: bool = True,
                                      include_readme: bool = True) -> Dict:
        """生成完整的文檔包

        Args:
            file_path: 源文件路徑
            language: 編程語言
            project_name: 項目名稱
            doc_format: 文檔格式
            comment_style: 註釋風格
            include_api: 包含 API 文檔
            include_comments: 包含代碼註釋
            include_manual: 包含使用手冊
            include_readme: 包含 README

        Returns:
            完整的文檔包
        """
        code = self.read_source_code(file_path)

        print(f"正在為文件生成文檔: {file_path}")
        print("=" * 60)

        report = {
            "file": file_path,
            "timestamp": datetime.now().isoformat(),
            "language": language,
            "project_name": project_name,
            "code_length": len(code),
            "line_count": len(code.splitlines())
        }

        if include_api:
            print("1. 正在生成 API 文檔...")
            report["api_documentation"] = self.generate_api_documentation(
                code, language, doc_format
            )

        if include_comments:
            print("2. 正在生成代碼註釋...")
            report["code_comments"] = self.generate_code_comments(
                code, language, comment_style
            )

        if include_manual:
            print("3. 正在生成使用手冊...")
            report["user_manual"] = self.generate_user_manual(
                code, language, project_name
            )

        if include_readme:
            print("4. 正在生成 README...")
            report["readme"] = self.generate_readme(
                code, language, project_name
            )

        print("=" * 60)
        print(f"文檔生成完成！")

        return report

    def save_documentation(self, doc_data: Dict, output_dir: str):
        """保存文檔文件

        Args:
            doc_data: 文檔數據
            output_dir: 輸出目錄
        """
        os.makedirs(output_dir, exist_ok=True)

        # 保存 API 文檔
        if "api_documentation" in doc_data and "api_documentation" in doc_data["api_documentation"]:
            api_file = os.path.join(output_dir, "API.md")
            with open(api_file, 'w', encoding='utf-8') as f:
                f.write(doc_data["api_documentation"]["api_documentation"])
            print(f"API 文檔已保存至: {api_file}")

        # 保存帶註釋的代碼
        if "code_comments" in doc_data and "commented_code" in doc_data["code_comments"]:
            code_file = os.path.join(output_dir, "commented_code.c")
            with open(code_file, 'w', encoding='utf-8') as f:
                f.write(doc_data["code_comments"]["commented_code"])
            print(f"註釋代碼已保存至: {code_file}")

        # 保存使用手冊
        if "user_manual" in doc_data and "manual_content" in doc_data["user_manual"]:
            manual_file = os.path.join(output_dir, "USER_MANUAL.md")
            with open(manual_file, 'w', encoding='utf-8') as f:
                f.write(doc_data["user_manual"]["manual_content"])
            print(f"使用手冊已保存至: {manual_file}")

        # 保存 README
        if "readme" in doc_data and "readme_content" in doc_data["readme"]:
            readme_file = os.path.join(output_dir, "README.md")
            with open(readme_file, 'w', encoding='utf-8') as f:
                f.write(doc_data["readme"]["readme_content"])
            print(f"README 已保存至: {readme_file}")

        # 保存完整報告
        report_file = os.path.join(output_dir, "documentation_report.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(doc_data, f, indent=2, ensure_ascii=False)
        print(f"文檔報告已保存至: {report_file}")

    def save_report(self, report: Dict, output_file: str, format: str = "json"):
        """保存報告

        Args:
            report: 文檔報告
            output_file: 輸出文件路徑
            format: 輸出格式
        """
        if format == "json":
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"報告已保存至: {output_file}")


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="AI 文檔生成工具 - 自動生成 API 文檔、註釋和使用手冊",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  # 生成完整的文檔包
  %(prog)s source.c -o docs/

  # 僅生成 API 文檔
  %(prog)s source.c --api-only -o API.md

  # 僅生成帶註釋的代碼
  %(prog)s source.c --comments-only -o commented_source.c

  # 生成 README
  %(prog)s source.c --readme-only -p "My Project" -o README.md

  # 使用 Doxygen 風格註釋
  %(prog)s source.c --comment-style doxygen -o docs/

  # 生成所有文檔
  %(prog)s source.c -p "Firmware Project" -o documentation/
        """
    )

    parser.add_argument("input", help="要生成文檔的源文件")
    parser.add_argument("-o", "--output", required=True,
                       help="輸出文件或目錄路徑")
    parser.add_argument("-l", "--language", default="C",
                       help="編程語言 (默認: C)")
    parser.add_argument("-p", "--project-name", default="Firmware",
                       help="項目名稱")
    parser.add_argument("--doc-format", default="markdown",
                       choices=["markdown", "html", "rst"],
                       help="文檔格式 (默認: markdown)")
    parser.add_argument("--comment-style", default="doxygen",
                       choices=["doxygen", "javadoc", "sphinx"],
                       help="註釋風格 (默認: doxygen)")
    parser.add_argument("--api-only", action="store_true",
                       help="僅生成 API 文檔")
    parser.add_argument("--comments-only", action="store_true",
                       help="僅生成代碼註釋")
    parser.add_argument("--manual-only", action="store_true",
                       help="僅生成使用手冊")
    parser.add_argument("--readme-only", action="store_true",
                       help="僅生成 README")
    parser.add_argument("--api-key", help="Anthropic API 密鑰")

    args = parser.parse_args()

    try:
        # 創建文檔生成器
        generator = DocGenerator(api_key=args.api_key)

        # 決定要生成哪些文檔
        generate_all = not (args.api_only or args.comments_only or
                          args.manual_only or args.readme_only)

        # 生成文檔
        report = generator.generate_documentation_package(
            args.input,
            language=args.language,
            project_name=args.project_name,
            doc_format=args.doc_format,
            comment_style=args.comment_style,
            include_api=generate_all or args.api_only,
            include_comments=generate_all or args.comments_only,
            include_manual=generate_all or args.manual_only,
            include_readme=generate_all or args.readme_only
        )

        # 保存結果
        if os.path.isdir(args.output) or generate_all:
            # 保存為多個文件
            generator.save_documentation(report, args.output)
        else:
            # 保存為單個文件
            generator.save_report(report, args.output)

    except Exception as e:
        print(f"錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
