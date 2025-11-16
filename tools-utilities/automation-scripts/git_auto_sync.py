#!/usr/bin/env python3
"""
git_auto_sync.py - Git 倉庫自動同步工具

自動同步多個 Git 倉庫，支援拉取、推送和狀態檢查。
"""

import os
import sys
import argparse
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import json

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GitRepo:
    """Git 倉庫操作類"""

    def __init__(self, path: Path):
        """
        初始化 Git 倉庫

        Args:
            path: 倉庫路徑
        """
        self.path = path.resolve()
        self.name = path.name

    def is_git_repo(self) -> bool:
        """
        檢查是否為 Git 倉庫

        Returns:
            bool: 是否為 Git 倉庫
        """
        git_dir = self.path / '.git'
        return git_dir.exists() and git_dir.is_dir()

    def run_git_command(self, *args) -> Tuple[bool, str, str]:
        """
        執行 Git 命令

        Args:
            *args: Git 命令參數

        Returns:
            Tuple[bool, str, str]: (成功/失敗, stdout, stderr)
        """
        try:
            result = subprocess.run(
                ['git', '-C', str(self.path)] + list(args),
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, '', 'Git 命令超時'
        except Exception as e:
            return False, '', str(e)

    def get_status(self) -> Dict:
        """
        獲取倉庫狀態

        Returns:
            Dict: 倉庫狀態資訊
        """
        if not self.is_git_repo():
            return {
                'is_repo': False,
                'error': '不是 Git 倉庫'
            }

        status = {
            'is_repo': True,
            'path': str(self.path),
            'name': self.name
        }

        # 獲取當前分支
        success, stdout, stderr = self.run_git_command('rev-parse', '--abbrev-ref', 'HEAD')
        status['branch'] = stdout.strip() if success else 'unknown'

        # 獲取遠端 URL
        success, stdout, stderr = self.run_git_command('remote', 'get-url', 'origin')
        status['remote_url'] = stdout.strip() if success else None

        # 檢查是否有未提交的更改
        success, stdout, stderr = self.run_git_command('status', '--porcelain')
        status['has_changes'] = bool(stdout.strip()) if success else None
        status['changes'] = stdout.strip().split('\n') if stdout.strip() else []

        # 檢查是否有未推送的提交
        success, stdout, stderr = self.run_git_command('rev-list', '--count', '@{u}..HEAD')
        status['commits_ahead'] = int(stdout.strip()) if success and stdout.strip().isdigit() else 0

        # 檢查是否有未拉取的提交
        success, stdout, stderr = self.run_git_command('rev-list', '--count', 'HEAD..@{u}')
        status['commits_behind'] = int(stdout.strip()) if success and stdout.strip().isdigit() else 0

        return status

    def fetch(self) -> Tuple[bool, str]:
        """
        從遠端獲取更新

        Returns:
            Tuple[bool, str]: (成功/失敗, 訊息)
        """
        logger.info(f"[{self.name}] 從遠端獲取更新...")
        success, stdout, stderr = self.run_git_command('fetch', '--all', '--prune')
        message = stdout + stderr if success else f"獲取失敗: {stderr}"
        return success, message

    def pull(self, rebase: bool = False) -> Tuple[bool, str]:
        """
        拉取遠端更新

        Args:
            rebase: 是否使用 rebase

        Returns:
            Tuple[bool, str]: (成功/失敗, 訊息)
        """
        logger.info(f"[{self.name}] 拉取遠端更新...")
        args = ['pull']
        if rebase:
            args.append('--rebase')

        success, stdout, stderr = self.run_git_command(*args)
        message = stdout + stderr if success else f"拉取失敗: {stderr}"
        return success, message

    def push(self) -> Tuple[bool, str]:
        """
        推送到遠端

        Returns:
            Tuple[bool, str]: (成功/失敗, 訊息)
        """
        logger.info(f"[{self.name}] 推送到遠端...")
        success, stdout, stderr = self.run_git_command('push')
        message = stdout + stderr if success else f"推送失敗: {stderr}"
        return success, message

    def commit_all(self, message: str) -> Tuple[bool, str]:
        """
        提交所有更改

        Args:
            message: 提交訊息

        Returns:
            Tuple[bool, str]: (成功/失敗, 訊息)
        """
        logger.info(f"[{self.name}] 提交所有更改...")

        # 添加所有更改
        success, stdout, stderr = self.run_git_command('add', '-A')
        if not success:
            return False, f"添加檔案失敗: {stderr}"

        # 提交
        success, stdout, stderr = self.run_git_command('commit', '-m', message)
        message_text = stdout + stderr if success else f"提交失敗: {stderr}"
        return success, message_text

    def sync(
        self,
        pull: bool = True,
        push: bool = True,
        commit_changes: bool = False,
        commit_message: str = None,
        rebase: bool = False
    ) -> Dict:
        """
        同步倉庫

        Args:
            pull: 是否拉取
            push: 是否推送
            commit_changes: 是否提交更改
            commit_message: 提交訊息
            rebase: 是否使用 rebase

        Returns:
            Dict: 同步結果
        """
        result = {
            'name': self.name,
            'path': str(self.path),
            'success': True,
            'operations': []
        }

        # 檢查是否為 Git 倉庫
        if not self.is_git_repo():
            result['success'] = False
            result['error'] = '不是 Git 倉庫'
            return result

        # 獲取初始狀態
        initial_status = self.get_status()
        result['initial_status'] = initial_status

        # 提交更改（如果需要）
        if commit_changes and initial_status.get('has_changes'):
            if not commit_message:
                commit_message = f"Auto-commit: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

            success, message = self.commit_all(commit_message)
            result['operations'].append({
                'operation': 'commit',
                'success': success,
                'message': message
            })

            if not success:
                result['success'] = False
                return result

        # 拉取（如果需要）
        if pull:
            success, message = self.pull(rebase=rebase)
            result['operations'].append({
                'operation': 'pull',
                'success': success,
                'message': message
            })

            if not success:
                result['success'] = False
                return result

        # 推送（如果需要）
        if push and (commit_changes or initial_status.get('commits_ahead', 0) > 0):
            success, message = self.push()
            result['operations'].append({
                'operation': 'push',
                'success': success,
                'message': message
            })

            if not success:
                result['success'] = False

        # 獲取最終狀態
        result['final_status'] = self.get_status()

        return result


def find_git_repos(base_path: Path, recursive: bool = True, max_depth: int = 3) -> List[Path]:
    """
    查找 Git 倉庫

    Args:
        base_path: 基礎路徑
        recursive: 是否遞迴搜索
        max_depth: 最大深度

    Returns:
        List[Path]: Git 倉庫路徑列表
    """
    repos = []

    def search_repos(path: Path, current_depth: int = 0):
        if current_depth > max_depth:
            return

        try:
            # 檢查當前目錄是否為 Git 倉庫
            if (path / '.git').exists():
                repos.append(path)
                return  # 不再搜索子目錄

            # 遞迴搜索子目錄
            if recursive:
                for item in path.iterdir():
                    if item.is_dir() and not item.name.startswith('.'):
                        search_repos(item, current_depth + 1)
        except PermissionError:
            logger.warning(f"無權限訪問: {path}")

    search_repos(base_path)
    return repos


def load_config(config_file: Path) -> Optional[Dict]:
    """
    載入設定檔

    Args:
        config_file: 設定檔路徑

    Returns:
        Optional[Dict]: 設定內容
    """
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"載入設定檔失敗: {e}")
        return None


def main():
    """主函數"""
    parser = argparse.ArgumentParser(
        description='Git 倉庫自動同步工具 - 自動同步多個 Git 倉庫',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用範例:
  # 同步單個倉庫
  %(prog)s /path/to/repo

  # 同步目錄下的所有倉庫
  %(prog)s /path/to/repos --recursive

  # 只拉取不推送
  %(prog)s /path/to/repos --no-push

  # 自動提交並同步
  %(prog)s /path/to/repos --commit --message "Auto sync"

  # 使用 rebase
  %(prog)s /path/to/repos --rebase

  # 只查看狀態
  %(prog)s /path/to/repos --status-only

  # 使用設定檔
  %(prog)s --config repos.json
        """
    )

    parser.add_argument(
        'path',
        nargs='?',
        help='Git 倉庫或包含倉庫的目錄路徑'
    )

    parser.add_argument(
        '--config',
        help='設定檔路徑（JSON 格式）'
    )

    parser.add_argument(
        '--recursive', '-r',
        action='store_true',
        help='遞迴搜索子目錄中的 Git 倉庫'
    )

    parser.add_argument(
        '--max-depth',
        type=int,
        default=3,
        help='遞迴搜索的最大深度（預設: 3）'
    )

    parser.add_argument(
        '--no-pull',
        action='store_true',
        help='不拉取遠端更新'
    )

    parser.add_argument(
        '--no-push',
        action='store_true',
        help='不推送到遠端'
    )

    parser.add_argument(
        '--commit',
        action='store_true',
        help='自動提交所有更改'
    )

    parser.add_argument(
        '--message', '-m',
        help='提交訊息（配合 --commit 使用）'
    )

    parser.add_argument(
        '--rebase',
        action='store_true',
        help='使用 rebase 而非 merge'
    )

    parser.add_argument(
        '--status-only',
        action='store_true',
        help='只顯示狀態，不進行同步'
    )

    parser.add_argument(
        '--output',
        choices=['text', 'json'],
        default='text',
        help='輸出格式（預設: text）'
    )

    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='顯示詳細資訊'
    )

    args = parser.parse_args()

    # 設定日誌級別
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # 獲取倉庫列表
    repos = []

    if args.config:
        # 從設定檔載入
        config = load_config(Path(args.config))
        if config and 'repos' in config:
            repos = [Path(repo) for repo in config['repos']]
        else:
            logger.error("無效的設定檔")
            sys.exit(1)
    elif args.path:
        # 從路徑搜索
        base_path = Path(args.path).resolve()
        if not base_path.exists():
            logger.error(f"路徑不存在: {base_path}")
            sys.exit(1)

        if GitRepo(base_path).is_git_repo():
            repos = [base_path]
        elif args.recursive:
            repos = find_git_repos(base_path, recursive=True, max_depth=args.max_depth)
        else:
            logger.error(f"路徑不是 Git 倉庫且未啟用遞迴搜索: {base_path}")
            sys.exit(1)
    else:
        parser.error('請指定路徑或設定檔')

    if not repos:
        logger.warning("未找到 Git 倉庫")
        sys.exit(0)

    logger.info(f"找到 {len(repos)} 個 Git 倉庫")

    # 處理每個倉庫
    results = []

    for repo_path in repos:
        repo = GitRepo(repo_path)

        if args.status_only:
            # 只查看狀態
            status = repo.get_status()
            results.append(status)
        else:
            # 同步倉庫
            result = repo.sync(
                pull=not args.no_pull,
                push=not args.no_push,
                commit_changes=args.commit,
                commit_message=args.message,
                rebase=args.rebase
            )
            results.append(result)

    # 輸出結果
    if args.output == 'json':
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        print("\n" + "=" * 80)
        print(f"Git 倉庫同步報告")
        print("=" * 80)

        for i, result in enumerate(results, 1):
            if args.status_only:
                # 顯示狀態
                print(f"\n[{i}] {result.get('name', 'Unknown')}")
                print(f"路徑: {result.get('path', 'N/A')}")
                print(f"分支: {result.get('branch', 'N/A')}")
                print(f"遠端: {result.get('remote_url', 'N/A')}")
                print(f"未提交更改: {'是' if result.get('has_changes') else '否'}")
                print(f"未推送提交: {result.get('commits_ahead', 0)}")
                print(f"未拉取提交: {result.get('commits_behind', 0)}")
            else:
                # 顯示同步結果
                print(f"\n[{i}] {result['name']} - {'✓ 成功' if result['success'] else '✗ 失敗'}")
                print(f"路徑: {result['path']}")

                if 'error' in result:
                    print(f"錯誤: {result['error']}")
                else:
                    for op in result.get('operations', []):
                        status = '✓' if op['success'] else '✗'
                        print(f"  {status} {op['operation'].upper()}: {op['message'].strip()[:100]}")

        print("\n" + "=" * 80)

        # 統計
        if not args.status_only:
            total = len(results)
            success = sum(1 for r in results if r.get('success', False))
            print(f"總計: {total} 個倉庫, 成功: {success}, 失敗: {total - success}")
        else:
            repos_with_changes = sum(1 for r in results if r.get('has_changes'))
            repos_ahead = sum(1 for r in results if r.get('commits_ahead', 0) > 0)
            repos_behind = sum(1 for r in results if r.get('commits_behind', 0) > 0)
            print(f"總計: {len(results)} 個倉庫")
            print(f"有未提交更改: {repos_with_changes}")
            print(f"有未推送提交: {repos_ahead}")
            print(f"有未拉取提交: {repos_behind}")

        print("=" * 80)


if __name__ == '__main__':
    main()
