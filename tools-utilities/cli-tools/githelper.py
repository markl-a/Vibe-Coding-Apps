#!/usr/bin/env python3
"""
githelper.py - Git 輔助工具
使用 AI 輔助開發的 Git 操作簡化工具
"""

import argparse
import subprocess
import sys
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from datetime import datetime


class GitHelper:
    """Git 輔助工具類別"""

    def __init__(self, repo_path: str = "."):
        self.repo_path = Path(repo_path).resolve()
        if not self._is_git_repo():
            raise ValueError(f"不是有效的 Git 儲存庫: {repo_path}")

    def _is_git_repo(self) -> bool:
        """檢查是否為 Git 儲存庫"""
        try:
            result = self._run_command(['git', 'rev-parse', '--git-dir'])
            return result.returncode == 0
        except Exception:
            return False

    def _run_command(self, cmd: List[str], capture_output: bool = True) -> subprocess.CompletedProcess:
        """執行命令"""
        try:
            return subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=capture_output,
                text=True,
                check=False
            )
        except Exception as e:
            raise RuntimeError(f"執行命令失敗: {' '.join(cmd)}\n{e}")

    def get_status(self) -> Dict[str, List[str]]:
        """獲取工作區狀態"""
        result = self._run_command(['git', 'status', '--porcelain'])

        status = {
            'modified': [],
            'added': [],
            'deleted': [],
            'untracked': [],
            'renamed': []
        }

        for line in result.stdout.splitlines():
            if not line.strip():
                continue

            status_code = line[:2]
            filename = line[3:]

            if status_code.strip() == '??':
                status['untracked'].append(filename)
            elif 'M' in status_code:
                status['modified'].append(filename)
            elif 'A' in status_code:
                status['added'].append(filename)
            elif 'D' in status_code:
                status['deleted'].append(filename)
            elif 'R' in status_code:
                status['renamed'].append(filename)

        return status

    def get_diff_summary(self) -> str:
        """獲取變更摘要"""
        result = self._run_command(['git', 'diff', '--stat'])
        return result.stdout

    def get_recent_commits(self, count: int = 10) -> List[Dict[str, str]]:
        """獲取最近的提交記錄"""
        result = self._run_command([
            'git', 'log',
            f'-{count}',
            '--pretty=format:%H|%an|%ae|%ad|%s',
            '--date=short'
        ])

        commits = []
        for line in result.stdout.splitlines():
            parts = line.split('|')
            if len(parts) == 5:
                commits.append({
                    'hash': parts[0][:8],
                    'author': parts[1],
                    'email': parts[2],
                    'date': parts[3],
                    'message': parts[4]
                })

        return commits

    def analyze_commit_patterns(self) -> Dict[str, any]:
        """AI 輔助：分析提交模式"""
        commits = self.get_recent_commits(50)

        if not commits:
            return {"error": "沒有提交記錄"}

        # 分析提交訊息模式
        patterns = {
            'feat': 0,
            'fix': 0,
            'docs': 0,
            'style': 0,
            'refactor': 0,
            'test': 0,
            'chore': 0,
            'other': 0
        }

        for commit in commits:
            msg = commit['message'].lower()
            found = False
            for pattern in patterns:
                if msg.startswith(pattern):
                    patterns[pattern] += 1
                    found = True
                    break
            if not found:
                patterns['other'] += 1

        # 計算作者統計
        authors = {}
        for commit in commits:
            author = commit['author']
            authors[author] = authors.get(author, 0) + 1

        # 分析提交頻率
        dates = [commit['date'] for commit in commits]
        unique_dates = len(set(dates))

        return {
            'total_commits': len(commits),
            'commit_types': patterns,
            'authors': authors,
            'active_days': unique_dates,
            'avg_commits_per_day': len(commits) / max(unique_dates, 1)
        }

    def suggest_commit_message(self) -> str:
        """AI 輔助：建議提交訊息"""
        status = self.get_status()
        diff = self._run_command(['git', 'diff', '--staged']).stdout

        # 分析變更類型
        modified_count = len(status['modified'])
        added_count = len(status['added'])
        deleted_count = len(status['deleted'])

        # 分析檔案類型
        file_types = {}
        all_files = (status['modified'] + status['added'] +
                    status['deleted'] + status['untracked'])

        for file in all_files:
            ext = Path(file).suffix or 'no_ext'
            file_types[ext] = file_types.get(ext, 0) + 1

        # 生成建議
        suggestions = []

        # 根據變更類型建議
        if added_count > modified_count + deleted_count:
            suggestions.append("feat: Add new files/features")
        elif deleted_count > modified_count:
            suggestions.append("chore: Remove old files")
        elif modified_count > 0:
            suggestions.append("refactor: Update existing files")

        # 根據檔案類型建議
        if '.py' in file_types:
            suggestions.append("feat(python): Update Python code")
        if '.js' in file_types or '.ts' in file_types:
            suggestions.append("feat(js): Update JavaScript code")
        if '.md' in file_types:
            suggestions.append("docs: Update documentation")
        if '.json' in file_types or '.yaml' in file_types:
            suggestions.append("chore: Update configuration")

        # 分析最近的提交模式
        recent = self.get_recent_commits(5)
        if recent:
            # 提取常用的提交前綴
            prefixes = []
            for commit in recent:
                match = re.match(r'^([a-z]+)(\([^)]+\))?:', commit['message'])
                if match:
                    prefixes.append(match.group(1))

            if prefixes:
                most_common = max(set(prefixes), key=prefixes.count)
                suggestions.insert(0, f"{most_common}: Follow recent commit pattern")

        return "\n".join(f"{i+1}. {msg}" for i, msg in enumerate(suggestions[:5]))

    def get_branch_info(self) -> Dict[str, any]:
        """獲取分支資訊"""
        # 當前分支
        current_branch = self._run_command(['git', 'branch', '--show-current']).stdout.strip()

        # 所有分支
        all_branches = self._run_command(['git', 'branch', '-a']).stdout.splitlines()
        local_branches = [b.strip().replace('* ', '') for b in all_branches if not b.strip().startswith('remotes/')]

        # 遠端分支
        remote_branches = [b.strip() for b in all_branches if b.strip().startswith('remotes/')]

        return {
            'current': current_branch,
            'local': local_branches,
            'remote': remote_branches,
            'total_local': len(local_branches),
            'total_remote': len(remote_branches)
        }

    def suggest_branch_cleanup(self) -> List[str]:
        """AI 輔助：建議清理的分支"""
        # 獲取已合併的分支
        result = self._run_command(['git', 'branch', '--merged'])
        merged_branches = [b.strip().replace('* ', '') for b in result.stdout.splitlines()]

        # 排除主分支
        main_branches = ['main', 'master', 'develop', 'dev']
        cleanup_candidates = [b for b in merged_branches if b not in main_branches]

        return cleanup_candidates

    def cleanup_branches(self, dry_run: bool = True) -> List[str]:
        """清理已合併的分支"""
        candidates = self.suggest_branch_cleanup()

        if not candidates:
            return []

        deleted = []
        for branch in candidates:
            if dry_run:
                print(f"🔍 [模擬] 將刪除分支: {branch}")
                deleted.append(branch)
            else:
                result = self._run_command(['git', 'branch', '-d', branch])
                if result.returncode == 0:
                    print(f"✅ 已刪除分支: {branch}")
                    deleted.append(branch)
                else:
                    print(f"❌ 無法刪除分支: {branch}")

        return deleted

    def pretty_log(self, count: int = 20) -> None:
        """美化的提交歷史"""
        commits = self.get_recent_commits(count)

        if not commits:
            print("沒有提交記錄")
            return

        print("\n" + "=" * 100)
        print(f"📊 最近 {len(commits)} 筆提交")
        print("=" * 100 + "\n")

        for commit in commits:
            print(f"🔹 {commit['hash']} - {commit['date']}")
            print(f"   👤 {commit['author']} <{commit['email']}>")
            print(f"   💬 {commit['message']}")
            print()

    def statistics(self) -> None:
        """顯示統計資訊"""
        analysis = self.analyze_commit_patterns()

        if 'error' in analysis:
            print(f"❌ {analysis['error']}")
            return

        print("\n" + "=" * 100)
        print("📊 Git 儲存庫統計")
        print("=" * 100 + "\n")

        print(f"總提交數: {analysis['total_commits']}")
        print(f"活躍天數: {analysis['active_days']}")
        print(f"平均每天提交數: {analysis['avg_commits_per_day']:.2f}\n")

        print("提交類型分布:")
        for commit_type, count in sorted(analysis['commit_types'].items(), key=lambda x: x[1], reverse=True):
            if count > 0:
                percentage = (count / analysis['total_commits']) * 100
                bar = '█' * int(percentage / 2)
                print(f"  {commit_type:10s}: {bar} {count} ({percentage:.1f}%)")

        print("\n作者貢獻:")
        for author, count in sorted(analysis['authors'].items(), key=lambda x: x[1], reverse=True):
            percentage = (count / analysis['total_commits']) * 100
            bar = '█' * int(percentage / 2)
            print(f"  {author:20s}: {bar} {count} ({percentage:.1f}%)")

        print("\n" + "=" * 100 + "\n")


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='🔧 Git Helper - Git 輔助工具（AI 輔助）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 顯示狀態摘要
  python githelper.py status

  # AI 建議提交訊息
  python githelper.py suggest

  # 美化提交歷史
  python githelper.py log --pretty

  # 清理已合併分支（模擬）
  python githelper.py cleanup --dry-run

  # 顯示統計資訊
  python githelper.py stats

  # 分支資訊
  python githelper.py branches
        '''
    )

    parser.add_argument(
        'command',
        choices=['status', 'suggest', 'log', 'cleanup', 'stats', 'branches'],
        help='要執行的命令'
    )

    parser.add_argument(
        '-p', '--path',
        default='.',
        help='Git 儲存庫路徑（預設：當前目錄）'
    )

    parser.add_argument(
        '--count',
        type=int,
        default=20,
        help='顯示的提交數量（預設：20）'
    )

    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='模擬模式（不實際執行）'
    )

    parser.add_argument(
        '--version',
        action='version',
        version='Git Helper v1.0.0'
    )

    args = parser.parse_args()

    try:
        helper = GitHelper(args.path)

        if args.command == 'status':
            status = helper.get_status()
            print("\n📋 工作區狀態:")
            print("=" * 70)

            if status['modified']:
                print(f"\n🔄 已修改 ({len(status['modified'])}):")
                for file in status['modified']:
                    print(f"  • {file}")

            if status['added']:
                print(f"\n✅ 已添加 ({len(status['added'])}):")
                for file in status['added']:
                    print(f"  • {file}")

            if status['deleted']:
                print(f"\n❌ 已刪除 ({len(status['deleted'])}):")
                for file in status['deleted']:
                    print(f"  • {file}")

            if status['untracked']:
                print(f"\n❓ 未追蹤 ({len(status['untracked'])}):")
                for file in status['untracked'][:10]:  # 只顯示前 10 個
                    print(f"  • {file}")
                if len(status['untracked']) > 10:
                    print(f"  ... 還有 {len(status['untracked']) - 10} 個檔案")

            print("\n" + "=" * 70)

            # 顯示差異摘要
            diff = helper.get_diff_summary()
            if diff.strip():
                print("\n📊 變更摘要:")
                print(diff)

        elif args.command == 'suggest':
            print("\n🤖 AI 建議的提交訊息:")
            print("=" * 70)
            suggestions = helper.suggest_commit_message()
            print(suggestions)
            print("=" * 70 + "\n")

        elif args.command == 'log':
            helper.pretty_log(args.count)

        elif args.command == 'cleanup':
            candidates = helper.suggest_branch_cleanup()

            if not candidates:
                print("✅ 沒有需要清理的分支")
            else:
                print(f"\n🔍 找到 {len(candidates)} 個可清理的分支:")
                for branch in candidates:
                    print(f"  • {branch}")

                if args.dry_run:
                    print("\n[模擬模式] 使用 --no-dry-run 實際執行刪除")
                else:
                    deleted = helper.cleanup_branches(dry_run=False)
                    print(f"\n✅ 成功刪除 {len(deleted)} 個分支")

        elif args.command == 'stats':
            helper.statistics()

        elif args.command == 'branches':
            info = helper.get_branch_info()
            print("\n🌿 分支資訊:")
            print("=" * 70)
            print(f"當前分支: {info['current']}")
            print(f"本地分支數: {info['total_local']}")
            print(f"遠端分支數: {info['total_remote']}\n")

            print("本地分支:")
            for branch in info['local']:
                marker = "* " if branch == info['current'] else "  "
                print(f"{marker}{branch}")

            print("=" * 70 + "\n")

    except ValueError as e:
        print(f"❌ 錯誤: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 未預期的錯誤: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
