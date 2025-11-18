#!/usr/bin/env python3
"""
SELinux 輔助工具

提供常用的 SELinux 操作和查詢功能
"""

import subprocess
import sys
import argparse
import re
from typing import List, Dict, Optional

class SELinuxHelper:
    """SELinux 輔助工具類"""

    @staticmethod
    def run_adb_command(command: str) -> str:
        """執行 adb 命令"""
        try:
            result = subprocess.run(
                ['adb', 'shell'] + command.split(),
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.stdout
        except subprocess.TimeoutExpired:
            print("[!] 命令執行超時")
            return ""
        except FileNotFoundError:
            print("[!] 錯誤: 找不到 adb 命令，請確認 Android SDK 已安裝")
            sys.exit(1)
        except Exception as e:
            print(f"[!] 執行命令錯誤: {e}")
            return ""

    @staticmethod
    def get_selinux_mode() -> str:
        """獲取 SELinux 模式"""
        output = SELinuxHelper.run_adb_command("getenforce")
        return output.strip()

    @staticmethod
    def set_selinux_mode(mode: str):
        """設置 SELinux 模式 (需要 root)"""
        if mode not in ['0', '1', 'permissive', 'enforcing']:
            print("[!] 錯誤: 無效的模式，請使用 0/permissive 或 1/enforcing")
            return

        print(f"[*] 設置 SELinux 模式為: {mode}")
        SELinuxHelper.run_adb_command(f"setenforce {mode}")

        # 驗證
        current_mode = SELinuxHelper.get_selinux_mode()
        print(f"[+] 當前模式: {current_mode}")

    @staticmethod
    def collect_avc_denials(output_file: str = "avc_denials.log"):
        """收集 AVC 拒絕日誌"""
        print("[*] 收集 AVC 拒絕日誌...")

        # 從 dmesg 和 logcat 收集
        dmesg_output = SELinuxHelper.run_adb_command("dmesg | grep avc")
        logcat_output = SELinuxHelper.run_adb_command("logcat -b all -d | grep avc")

        with open(output_file, 'w', encoding='utf-8') as f:
            if dmesg_output:
                f.write("# ===== From dmesg =====\n")
                f.write(dmesg_output)
                f.write("\n")

            if logcat_output:
                f.write("# ===== From logcat =====\n")
                f.write(logcat_output)

        print(f"[+] AVC 日誌已保存到: {output_file}")

        # 統計拒絕次數
        total_lines = (dmesg_output + logcat_output).count('avc:')
        print(f"[+] 共 {total_lines} 條 AVC 拒絕記錄")

    @staticmethod
    def get_file_context(file_path: str):
        """獲取文件的 SELinux 上下文"""
        print(f"[*] 查詢文件上下文: {file_path}")
        output = SELinuxHelper.run_adb_command(f"ls -Z {file_path}")
        print(output)

    @staticmethod
    def get_process_context(process_name: Optional[str] = None):
        """獲取進程的 SELinux 上下文"""
        if process_name:
            print(f"[*] 查詢進程上下文: {process_name}")
            output = SELinuxHelper.run_adb_command(f"ps -Z | grep {process_name}")
        else:
            print("[*] 查詢所有進程上下文")
            output = SELinuxHelper.run_adb_command("ps -Z")

        print(output)

    @staticmethod
    def check_service_context(service_name: str):
        """檢查服務的 SELinux 上下文"""
        print(f"[*] 檢查服務上下文: {service_name}")
        output = SELinuxHelper.run_adb_command(f"service check {service_name}")
        print(output)

        # 查看服務列表
        output = SELinuxHelper.run_adb_command(f"service list | grep {service_name}")
        print(output)

    @staticmethod
    def monitor_avc_realtime(filter_pattern: Optional[str] = None):
        """實時監控 AVC 拒絕"""
        print("[*] 實時監控 AVC 拒絕 (按 Ctrl+C 停止)")

        try:
            cmd = ['adb', 'shell', 'dmesg', '-w']
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )

            for line in process.stdout:
                if 'avc:' in line.lower():
                    if filter_pattern is None or filter_pattern in line:
                        print(line.strip())

        except KeyboardInterrupt:
            print("\n[*] 停止監控")
            process.terminate()

    @staticmethod
    def analyze_denials_summary(log_file: str):
        """分析拒絕日誌摘要"""
        print(f"[*] 分析拒絕日誌: {log_file}")

        try:
            with open(log_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # 統計模式
            sources = re.findall(r'scontext=u:r:(\w+):s0', content)
            targets = re.findall(r'tcontext=u:\w+:(\w+):s0', content)
            classes = re.findall(r'tclass=(\w+)', content)

            # 計數
            from collections import Counter

            source_counts = Counter(sources)
            target_counts = Counter(targets)
            class_counts = Counter(classes)

            print("\n前 10 個 Source Types:")
            for src, count in source_counts.most_common(10):
                print(f"  {src:30s}: {count:5d}")

            print("\n前 10 個 Target Types:")
            for tgt, count in target_counts.most_common(10):
                print(f"  {tgt:30s}: {count:5d}")

            print("\n前 10 個 Classes:")
            for cls, count in class_counts.most_common(10):
                print(f"  {cls:30s}: {count:5d}")

        except FileNotFoundError:
            print(f"[!] 錯誤: 找不到文件 {log_file}")
        except Exception as e:
            print(f"[!] 分析錯誤: {e}")

    @staticmethod
    def generate_policy_from_audit():
        """從 audit.log 生成策略 (使用 audit2allow)"""
        print("[*] 從 audit 日誌生成策略...")

        # 收集日誌
        SELinuxHelper.collect_avc_denials("avc_denials.log")

        # 使用 AVCParser
        print("[*] 使用 AVCParser 生成策略...")
        print("[*] 執行命令: python3 generator/AVCParser.py avc_denials.log -o generated_policy.te")


def main():
    parser = argparse.ArgumentParser(
        description='SELinux 輔助工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 獲取 SELinux 模式
  %(prog)s --get-mode

  # 設置為寬容模式 (需要 root)
  %(prog)s --set-mode permissive

  # 收集 AVC 拒絕日誌
  %(prog)s --collect-avc

  # 查詢文件上下文
  %(prog)s --file-context /system/bin/app_process

  # 查詢進程上下文
  %(prog)s --process-context system_server

  # 實時監控 AVC 拒絕
  %(prog)s --monitor

  # 分析日誌摘要
  %(prog)s --analyze avc_denials.log
        '''
    )

    parser.add_argument('--get-mode', action='store_true',
                        help='獲取當前 SELinux 模式')
    parser.add_argument('--set-mode', metavar='MODE',
                        help='設置 SELinux 模式 (0/permissive 或 1/enforcing)')
    parser.add_argument('--collect-avc', action='store_true',
                        help='收集 AVC 拒絕日誌')
    parser.add_argument('--file-context', metavar='PATH',
                        help='查詢文件的 SELinux 上下文')
    parser.add_argument('--process-context', metavar='NAME', nargs='?', const='',
                        help='查詢進程的 SELinux 上下文')
    parser.add_argument('--service-context', metavar='NAME',
                        help='查詢服務的 SELinux 上下文')
    parser.add_argument('--monitor', action='store_true',
                        help='實時監控 AVC 拒絕')
    parser.add_argument('--monitor-filter', metavar='PATTERN',
                        help='監控時的過濾模式')
    parser.add_argument('--analyze', metavar='FILE',
                        help='分析拒絕日誌摘要')
    parser.add_argument('--generate-policy', action='store_true',
                        help='從 audit 日誌生成策略')

    args = parser.parse_args()

    helper = SELinuxHelper()

    # 執行操作
    if args.get_mode:
        mode = helper.get_selinux_mode()
        print(f"當前 SELinux 模式: {mode}")

    elif args.set_mode:
        helper.set_selinux_mode(args.set_mode)

    elif args.collect_avc:
        helper.collect_avc_denials()

    elif args.file_context:
        helper.get_file_context(args.file_context)

    elif args.process_context is not None:
        if args.process_context:
            helper.get_process_context(args.process_context)
        else:
            helper.get_process_context()

    elif args.service_context:
        helper.check_service_context(args.service_context)

    elif args.monitor:
        helper.monitor_avc_realtime(args.monitor_filter)

    elif args.analyze:
        helper.analyze_denials_summary(args.analyze)

    elif args.generate_policy:
        helper.generate_policy_from_audit()

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
