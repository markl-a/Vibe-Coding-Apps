#!/usr/bin/env python3
"""
dependency_checker.py - 依賴檢查工具
檢查和管理專案依賴的工具
"""

import os
import sys
import argparse
import subprocess
import json
from pathlib import Path
from typing import List, Dict, Optional
import re


class DependencyChecker:
    """依賴檢查器類別"""

    def __init__(self, requirements_file: str = 'requirements.txt'):
        self.requirements_file = Path(requirements_file)
        self.dependencies = []

    def check_dependencies(self) -> Dict:
        """檢查依賴"""
        if not self.requirements_file.exists():
            return {
                'status': 'error',
                'message': f'找不到依賴檔案: {self.requirements_file}'
            }

        # 讀取依賴
        self.dependencies = self._parse_requirements()

        return {
            'status': 'success',
            'total': len(self.dependencies),
            'dependencies': self.dependencies
        }

    def check_outdated(self) -> List[Dict]:
        """檢查過時的依賴"""
        outdated = []

        try:
            # 使用 pip list --outdated
            result = subprocess.run(
                ['pip', 'list', '--outdated', '--format=json'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                outdated = json.loads(result.stdout)

        except Exception as e:
            print(f"檢查過時依賴時發生錯誤: {e}", file=sys.stderr)

        return outdated

    def check_security(self) -> List[Dict]:
        """檢查安全漏洞"""
        vulnerabilities = []

        try:
            # 使用 pip-audit
            result = subprocess.run(
                ['pip-audit', '--format=json'],
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                vulnerabilities = data.get('vulnerabilities', [])

        except FileNotFoundError:
            print("警告: pip-audit 未安裝，跳過安全檢查", file=sys.stderr)
            print("安裝: pip install pip-audit", file=sys.stderr)
        except Exception as e:
            print(f"安全檢查時發生錯誤: {e}", file=sys.stderr)

        return vulnerabilities

    def show_dependency_tree(self) -> str:
        """顯示依賴樹"""
        try:
            result = subprocess.run(
                ['pipdeptree'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                return result.stdout

        except FileNotFoundError:
            return "警告: pipdeptree 未安裝\n安裝: pip install pipdeptree"
        except Exception as e:
            return f"錯誤: {e}"

        return ""

    def check_licenses(self) -> List[Dict]:
        """檢查依賴的 License"""
        licenses = []

        try:
            result = subprocess.run(
                ['pip-licenses', '--format=json'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                licenses = json.loads(result.stdout)

        except FileNotFoundError:
            print("警告: pip-licenses 未安裝，跳過 License 檢查", file=sys.stderr)
            print("安裝: pip install pip-licenses", file=sys.stderr)
        except Exception as e:
            print(f"License 檢查時發生錯誤: {e}", file=sys.stderr)

        return licenses

    def suggest_updates(self, outdated: List[Dict]) -> List[str]:
        """生成更新建議"""
        suggestions = []

        for pkg in outdated:
            name = pkg.get('name')
            current = pkg.get('version')
            latest = pkg.get('latest_version')

            suggestions.append(
                f"pip install --upgrade {name}=={latest}  # 當前: {current}"
            )

        return suggestions

    def detect_conflicts(self) -> List[Dict]:
        """偵測依賴衝突"""
        conflicts = []

        try:
            result = subprocess.run(
                ['pip', 'check'],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode != 0:
                # 解析衝突訊息
                for line in result.stdout.split('\n'):
                    if line.strip():
                        conflicts.append({
                            'message': line.strip()
                        })

        except Exception as e:
            print(f"偵測衝突時發生錯誤: {e}", file=sys.stderr)

        return conflicts

    def _parse_requirements(self) -> List[Dict]:
        """解析 requirements.txt"""
        dependencies = []

        with open(self.requirements_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()

                # 跳過註解和空行
                if not line or line.startswith('#'):
                    continue

                # 解析依賴
                match = re.match(r'^([a-zA-Z0-9_-]+)([><=!~]=?)?(.*)?$', line)
                if match:
                    name = match.group(1)
                    operator = match.group(2) or ''
                    version = match.group(3) or ''

                    dependencies.append({
                        'name': name,
                        'operator': operator,
                        'version': version.strip(),
                        'raw': line
                    })

        return dependencies

    def generate_report(self, include_outdated: bool = False,
                       include_security: bool = False,
                       include_licenses: bool = False,
                       include_tree: bool = False) -> str:
        """生成報告"""
        lines = [
            "\n" + "="*60,
            "依賴檢查報告",
            "="*60,
        ]

        # 基本資訊
        result = self.check_dependencies()
        if result['status'] == 'success':
            lines.append(f"\n總依賴數: {result['total']}")
            lines.append("\n已安裝的依賴:")
            for dep in result['dependencies']:
                lines.append(f"  - {dep['name']} {dep['operator']}{dep['version']}")

        # 過時依賴
        if include_outdated:
            lines.append("\n" + "-"*60)
            lines.append("過時的依賴:")
            lines.append("-"*60)

            outdated = self.check_outdated()
            if outdated:
                for pkg in outdated:
                    lines.append(
                        f"  - {pkg['name']}: {pkg['version']} → {pkg['latest_version']}"
                    )

                lines.append("\n更新建議:")
                for suggestion in self.suggest_updates(outdated):
                    lines.append(f"  {suggestion}")
            else:
                lines.append("  ✓ 所有依賴都是最新的")

        # 安全漏洞
        if include_security:
            lines.append("\n" + "-"*60)
            lines.append("安全漏洞:")
            lines.append("-"*60)

            vulnerabilities = self.check_security()
            if vulnerabilities:
                for vuln in vulnerabilities:
                    lines.append(f"  ⚠ {vuln.get('name', 'Unknown')}")
                    lines.append(f"    影響版本: {vuln.get('affected_version', 'N/A')}")
                    lines.append(f"    修復版本: {vuln.get('fixed_version', 'N/A')}")
            else:
                lines.append("  ✓ 未發現安全漏洞")

        # License 檢查
        if include_licenses:
            lines.append("\n" + "-"*60)
            lines.append("License 資訊:")
            lines.append("-"*60)

            licenses = self.check_licenses()
            if licenses:
                license_groups = {}
                for lic in licenses:
                    license_type = lic.get('License', 'Unknown')
                    if license_type not in license_groups:
                        license_groups[license_type] = []
                    license_groups[license_type].append(lic.get('Name'))

                for license_type, packages in license_groups.items():
                    lines.append(f"\n  {license_type}:")
                    for pkg in packages:
                        lines.append(f"    - {pkg}")

        # 依賴樹
        if include_tree:
            lines.append("\n" + "-"*60)
            lines.append("依賴樹:")
            lines.append("-"*60)
            tree = self.show_dependency_tree()
            lines.append(tree)

        # 衝突檢測
        conflicts = self.detect_conflicts()
        if conflicts:
            lines.append("\n" + "-"*60)
            lines.append("⚠ 依賴衝突:")
            lines.append("-"*60)
            for conflict in conflicts:
                lines.append(f"  {conflict['message']}")

        lines.append("\n" + "="*60)
        return '\n'.join(lines)


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description="依賴檢查工具 - 管理專案依賴",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s                              # 基本依賴檢查
  %(prog)s --outdated                   # 檢查過時依賴
  %(prog)s --security                   # 安全漏洞掃描
  %(prog)s --tree                       # 顯示依賴樹
  %(prog)s --licenses                   # License 檢查
  %(prog)s --all                        # 完整檢查
  %(prog)s --suggest-updates            # 生成更新建議
        """
    )

    parser.add_argument('--requirements', default='requirements.txt',
                       help='requirements 檔案路徑')
    parser.add_argument('--outdated', action='store_true',
                       help='檢查過時的依賴')
    parser.add_argument('--security', action='store_true',
                       help='檢查安全漏洞')
    parser.add_argument('--tree', action='store_true',
                       help='顯示依賴樹')
    parser.add_argument('--licenses', action='store_true',
                       help='檢查 License')
    parser.add_argument('--suggest-updates', action='store_true',
                       help='生成更新建議')
    parser.add_argument('--all', action='store_true',
                       help='執行所有檢查')

    args = parser.parse_args()

    checker = DependencyChecker(requirements_file=args.requirements)

    try:
        if args.all:
            args.outdated = True
            args.security = True
            args.licenses = True
            args.tree = True

        # 生成報告
        report = checker.generate_report(
            include_outdated=args.outdated,
            include_security=args.security,
            include_licenses=args.licenses,
            include_tree=args.tree
        )

        print(report)

        # 只顯示更新建議
        if args.suggest_updates:
            print("\n更新建議:")
            print("-"*60)
            outdated = checker.check_outdated()
            suggestions = checker.suggest_updates(outdated)
            for suggestion in suggestions:
                print(suggestion)

    except Exception as e:
        print(f"\n錯誤: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
