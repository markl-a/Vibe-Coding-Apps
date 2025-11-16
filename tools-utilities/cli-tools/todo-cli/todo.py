#!/usr/bin/env python3
"""
Todo CLI - 命令列待辦事項管理器
簡單而強大的任務管理工具
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional


class TodoManager:
    """待辦事項管理器"""

    def __init__(self, data_file: str = None):
        if data_file:
            self.data_file = Path(data_file)
        else:
            # 默認存儲在用戶主目錄
            self.data_file = Path.home() / '.todo.json'

        self.todos: List[Dict] = []
        self.load()

    def load(self) -> None:
        """從文件載入待辦事項"""
        if self.data_file.exists():
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    self.todos = json.load(f)
            except json.JSONDecodeError:
                print("⚠️  警告: 數據文件損壞，將創建新文件")
                self.todos = []
        else:
            self.todos = []

    def save(self) -> None:
        """保存待辦事項到文件"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.todos, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"❌ 錯誤保存數據: {e}")

    def add(self, task: str, priority: str = 'medium', tags: List[str] = None) -> None:
        """添加新任務"""
        todo = {
            'id': self._get_next_id(),
            'task': task,
            'priority': priority,
            'tags': tags or [],
            'completed': False,
            'created_at': datetime.now().isoformat(),
            'completed_at': None
        }
        self.todos.append(todo)
        self.save()
        print(f"✅ 已添加任務 #{todo['id']}: {task}")

    def list(self, show_completed: bool = False, filter_tag: str = None,
             filter_priority: str = None) -> None:
        """列出所有任務"""
        if not self.todos:
            print("📝 沒有待辦事項")
            return

        # 過濾任務
        filtered_todos = self.todos

        if not show_completed:
            filtered_todos = [t for t in filtered_todos if not t['completed']]

        if filter_tag:
            filtered_todos = [t for t in filtered_todos if filter_tag in t.get('tags', [])]

        if filter_priority:
            filtered_todos = [t for t in filtered_todos if t.get('priority') == filter_priority]

        if not filtered_todos:
            print("📝 沒有符合條件的待辦事項")
            return

        # 顯示任務
        print("\n" + "=" * 70)
        print("📋 待辦事項列表")
        print("=" * 70 + "\n")

        # 按優先級分組
        priority_order = {'high': 1, 'medium': 2, 'low': 3}
        sorted_todos = sorted(filtered_todos,
                            key=lambda x: (x['completed'], priority_order.get(x.get('priority', 'medium'), 2)))

        for todo in sorted_todos:
            self._print_todo(todo)

        # 統計信息
        total = len(self.todos)
        completed = len([t for t in self.todos if t['completed']])
        pending = total - completed

        print("\n" + "=" * 70)
        print(f"📊 總計: {total} | ✅ 已完成: {completed} | ⏳ 待處理: {pending}")
        print("=" * 70 + "\n")

    def _print_todo(self, todo: Dict) -> None:
        """打印單個待辦事項"""
        status = "✅" if todo['completed'] else "⏳"
        priority_emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}.get(todo.get('priority', 'medium'), '⚪')

        # 任務ID和狀態
        task_info = f"{status} #{todo['id']} {priority_emoji}"

        # 任務內容
        task_text = todo['task']
        if todo['completed']:
            task_text = f"\033[9m{task_text}\033[0m"  # 刪除線效果

        # 標籤
        tags = ""
        if todo.get('tags'):
            tags = " [" + ", ".join(f"#{tag}" for tag in todo['tags']) + "]"

        # 日期信息
        created = datetime.fromisoformat(todo['created_at']).strftime('%Y-%m-%d')
        date_info = f"(創建: {created}"

        if todo['completed'] and todo.get('completed_at'):
            completed_date = datetime.fromisoformat(todo['completed_at']).strftime('%Y-%m-%d')
            date_info += f", 完成: {completed_date}"

        date_info += ")"

        # 輸出
        print(f"{task_info} {task_text}{tags}")
        print(f"    {date_info}\n")

    def complete(self, task_id: int) -> None:
        """標記任務為完成"""
        todo = self._get_todo_by_id(task_id)
        if not todo:
            print(f"❌ 找不到任務 #{task_id}")
            return

        if todo['completed']:
            print(f"ℹ️  任務 #{task_id} 已經是完成狀態")
            return

        todo['completed'] = True
        todo['completed_at'] = datetime.now().isoformat()
        self.save()
        print(f"✅ 任務 #{task_id} 已完成: {todo['task']}")

    def uncomplete(self, task_id: int) -> None:
        """取消完成狀態"""
        todo = self._get_todo_by_id(task_id)
        if not todo:
            print(f"❌ 找不到任務 #{task_id}")
            return

        if not todo['completed']:
            print(f"ℹ️  任務 #{task_id} 還未完成")
            return

        todo['completed'] = False
        todo['completed_at'] = None
        self.save()
        print(f"⏳ 任務 #{task_id} 已重新標記為待處理: {todo['task']}")

    def delete(self, task_id: int) -> None:
        """刪除任務"""
        todo = self._get_todo_by_id(task_id)
        if not todo:
            print(f"❌ 找不到任務 #{task_id}")
            return

        task_text = todo['task']
        self.todos = [t for t in self.todos if t['id'] != task_id]
        self.save()
        print(f"🗑️  已刪除任務 #{task_id}: {task_text}")

    def clear_completed(self) -> None:
        """清除所有已完成的任務"""
        completed_count = len([t for t in self.todos if t['completed']])

        if completed_count == 0:
            print("ℹ️  沒有已完成的任務需要清除")
            return

        self.todos = [t for t in self.todos if not t['completed']]
        self.save()
        print(f"🗑️  已清除 {completed_count} 個已完成的任務")

    def edit(self, task_id: int, new_task: str = None, new_priority: str = None,
             new_tags: List[str] = None) -> None:
        """編輯任務"""
        todo = self._get_todo_by_id(task_id)
        if not todo:
            print(f"❌ 找不到任務 #{task_id}")
            return

        if new_task:
            todo['task'] = new_task
        if new_priority:
            todo['priority'] = new_priority
        if new_tags is not None:
            todo['tags'] = new_tags

        self.save()
        print(f"✏️  已更新任務 #{task_id}")

    def _get_todo_by_id(self, task_id: int) -> Optional[Dict]:
        """根據ID獲取任務"""
        for todo in self.todos:
            if todo['id'] == task_id:
                return todo
        return None

    def _get_next_id(self) -> int:
        """獲取下一個可用的ID"""
        if not self.todos:
            return 1
        return max(todo['id'] for todo in self.todos) + 1


def main():
    """主程式入口"""
    parser = argparse.ArgumentParser(
        description='📝 Todo CLI - 命令列待辦事項管理器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
範例:
  # 添加任務
  python todo.py add "完成專案報告"
  python todo.py add "修復bug" --priority high --tags work,urgent

  # 列出任務
  python todo.py list
  python todo.py list --all              # 包含已完成
  python todo.py list --tag work         # 只顯示work標籤
  python todo.py list --priority high    # 只顯示高優先級

  # 完成任務
  python todo.py done 1

  # 刪除任務
  python todo.py delete 1

  # 清除已完成
  python todo.py clear
        '''
    )

    parser.add_argument(
        '--file',
        help='自定義數據文件路徑（默認：~/.todo.json）'
    )

    subparsers = parser.add_subparsers(dest='command', help='可用命令')

    # add 命令
    add_parser = subparsers.add_parser('add', help='添加新任務')
    add_parser.add_argument('task', help='任務描述')
    add_parser.add_argument('-p', '--priority', choices=['low', 'medium', 'high'],
                           default='medium', help='優先級（默認：medium）')
    add_parser.add_argument('-t', '--tags', help='標籤（用逗號分隔）')

    # list 命令
    list_parser = subparsers.add_parser('list', help='列出任務')
    list_parser.add_argument('-a', '--all', action='store_true', help='包含已完成的任務')
    list_parser.add_argument('--tag', help='按標籤過濾')
    list_parser.add_argument('--priority', choices=['low', 'medium', 'high'], help='按優先級過濾')

    # done 命令
    done_parser = subparsers.add_parser('done', help='標記任務為完成')
    done_parser.add_argument('id', type=int, help='任務ID')

    # undone 命令
    undone_parser = subparsers.add_parser('undone', help='取消完成狀態')
    undone_parser.add_argument('id', type=int, help='任務ID')

    # delete 命令
    delete_parser = subparsers.add_parser('delete', help='刪除任務')
    delete_parser.add_argument('id', type=int, help='任務ID')

    # edit 命令
    edit_parser = subparsers.add_parser('edit', help='編輯任務')
    edit_parser.add_argument('id', type=int, help='任務ID')
    edit_parser.add_argument('-t', '--task', help='新的任務描述')
    edit_parser.add_argument('-p', '--priority', choices=['low', 'medium', 'high'], help='新的優先級')
    edit_parser.add_argument('--tags', help='新的標籤（用逗號分隔）')

    # clear 命令
    clear_parser = subparsers.add_parser('clear', help='清除所有已完成的任務')

    parser.add_argument('--version', action='version', version='Todo CLI v1.0.0')

    args = parser.parse_args()

    # 如果沒有提供命令，默認列出任務
    if not args.command:
        args.command = 'list'

    # 創建管理器
    manager = TodoManager(args.file)

    # 執行命令
    if args.command == 'add':
        tags = args.tags.split(',') if args.tags else []
        manager.add(args.task, args.priority, tags)

    elif args.command == 'list':
        manager.list(show_completed=args.all, filter_tag=args.tag,
                    filter_priority=args.priority)

    elif args.command == 'done':
        manager.complete(args.id)

    elif args.command == 'undone':
        manager.uncomplete(args.id)

    elif args.command == 'delete':
        manager.delete(args.id)

    elif args.command == 'edit':
        tags = args.tags.split(',') if args.tags else None
        manager.edit(args.id, args.task, args.priority, tags)

    elif args.command == 'clear':
        manager.clear_completed()


if __name__ == '__main__':
    main()
