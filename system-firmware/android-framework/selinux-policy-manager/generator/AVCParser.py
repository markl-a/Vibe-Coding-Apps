#!/usr/bin/env python3
"""
AVC 拒絕日誌解析器

自動解析 Android SELinux AVC 拒絕日誌並生成對應策略
支持 AI 輔助分析和優化建議
"""

import re
import sys
import argparse
from collections import defaultdict
from datetime import datetime
import json

class AVCParser:
    """AVC 日誌解析器"""

    def __init__(self, log_file, verbose=False):
        self.log_file = log_file
        self.verbose = verbose
        self.denials = []
        self.policies = defaultdict(set)
        self.statistics = defaultdict(int)

        # AVC 拒絕日誌正則表達式
        self.patterns = {
            'standard': re.compile(
                r'avc:\s+denied\s+\{\s*([^}]+)\s*\}\s+for\s+'
                r'.*scontext=u:r:(\w+):s0\s+'
                r'tcontext=u:\w+:(\w+):s0\s+'
                r'tclass=(\w+)'
            ),
            'detailed': re.compile(
                r'avc:\s+denied\s+\{\s*([^}]+)\s*\}\s+for\s+'
                r'pid=(\d+)\s+comm="([^"]+)"\s+'
                r'.*scontext=u:r:(\w+):s0\s+'
                r'tcontext=u:\w+:(\w+):s0\s+'
                r'tclass=(\w+)'
            ),
            'path': re.compile(
                r'path="([^"]+)"'
            ),
            'name': re.compile(
                r'name="([^"]+)"'
            )
        }

    def parse(self):
        """解析 AVC 日誌"""
        print(f"[*] 解析 AVC 日誌: {self.log_file}")

        try:
            with open(self.log_file, 'r', encoding='utf-8', errors='ignore') as f:
                for line_num, line in enumerate(f, 1):
                    self._parse_line(line, line_num)

            print(f"[+] 解析完成: {len(self.denials)} 條拒絕記錄")
            print(f"[+] 生成 {len(self.policies)} 條策略規則")

        except FileNotFoundError:
            print(f"[!] 錯誤: 找不到文件 {self.log_file}")
            sys.exit(1)
        except Exception as e:
            print(f"[!] 解析錯誤: {e}")
            sys.exit(1)

    def _parse_line(self, line, line_num):
        """解析單行日誌"""
        # 嘗試詳細模式匹配
        match = self.patterns['detailed'].search(line)
        if match:
            permissions = match.group(1).split()
            pid = match.group(2)
            comm = match.group(3)
            source_type = match.group(4)
            target_type = match.group(5)
            tclass = match.group(6)

            denial = {
                'permissions': permissions,
                'source': source_type,
                'target': target_type,
                'class': tclass,
                'pid': pid,
                'comm': comm,
                'line': line_num
            }

            # 提取路徑資訊
            path_match = self.patterns['path'].search(line)
            if path_match:
                denial['path'] = path_match.group(1)

            # 提取名稱資訊
            name_match = self.patterns['name'].search(line)
            if name_match:
                denial['name'] = name_match.group(1)

            self.denials.append(denial)
            self._generate_policy_rule(denial)
            self._update_statistics(denial)

            if self.verbose:
                print(f"[DEBUG] Line {line_num}: {source_type} -> {target_type}:{tclass}")

            return

        # 嘗試標準模式匹配
        match = self.patterns['standard'].search(line)
        if match:
            permissions = match.group(1).split()
            source_type = match.group(2)
            target_type = match.group(3)
            tclass = match.group(4)

            denial = {
                'permissions': permissions,
                'source': source_type,
                'target': target_type,
                'class': tclass,
                'line': line_num
            }

            self.denials.append(denial)
            self._generate_policy_rule(denial)
            self._update_statistics(denial)

    def _generate_policy_rule(self, denial):
        """生成策略規則"""
        source = denial['source']
        target = denial['target']
        tclass = denial['class']

        rule_key = f"allow {source} {target}:{tclass}"
        self.policies[rule_key].update(denial['permissions'])

    def _update_statistics(self, denial):
        """更新統計資訊"""
        self.statistics[f"source:{denial['source']}"] += 1
        self.statistics[f"target:{denial['target']}"] += 1
        self.statistics[f"class:{denial['class']}"] += 1

        for perm in denial['permissions']:
            self.statistics[f"permission:{perm}"] += 1

    def generate_policy(self, output_file, with_comments=True, optimize=True):
        """生成 SELinux 策略文件"""
        print(f"\n[*] 生成策略文件: {output_file}")

        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                # 寫入文件頭
                f.write("# Auto-generated SELinux Policy\n")
                f.write(f"# Generated from: {self.log_file}\n")
                f.write(f"# Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"# Total denials: {len(self.denials)}\n")
                f.write(f"# Policy rules: {len(self.policies)}\n")
                f.write("\n")

                # AI 分析建議
                if with_comments:
                    suggestions = self._get_ai_suggestions()
                    if suggestions:
                        f.write("# ======== AI 分析建議 ========\n")
                        for suggestion in suggestions:
                            f.write(f"# {suggestion}\n")
                        f.write("\n")

                # 按 source type 分組排序
                grouped_policies = self._group_policies()

                for source, rules in sorted(grouped_policies.items()):
                    if with_comments:
                        f.write(f"# Rules for {source}\n")

                    for rule, permissions in sorted(rules.items()):
                        perms = ' '.join(sorted(permissions))

                        # 檢查是否可以使用宏
                        if optimize:
                            macro = self._check_macro(permissions)
                            if macro:
                                perms = macro

                        f.write(f"{rule} {{ {perms} }};\n")

                    f.write("\n")

            print(f"[+] 策略已寫入: {output_file}")

        except Exception as e:
            print(f"[!] 寫入文件錯誤: {e}")
            sys.exit(1)

    def _group_policies(self):
        """按 source type 分組策略"""
        grouped = defaultdict(dict)

        for rule_key, permissions in self.policies.items():
            # 解析規則：allow source target:class
            parts = rule_key.split()
            if len(parts) >= 3:
                source = parts[1]
                target_class = ' '.join(parts[2:])
                grouped[source][f"allow {source} {target_class}"] = permissions

        return grouped

    def _check_macro(self, permissions):
        """檢查是否可以使用宏簡化權限列表"""
        perms_set = set(permissions)

        # 常見權限宏
        macros = {
            frozenset(['read', 'write', 'open', 'getattr', 'lock']): 'rw_file_perms',
            frozenset(['read', 'open', 'getattr']): 'r_file_perms',
            frozenset(['write', 'open', 'getattr', 'append']): 'w_file_perms',
            frozenset(['create', 'read', 'write', 'open', 'getattr', 'setattr', 'lock', 'append', 'unlink']): 'create_file_perms',
            frozenset(['open', 'read', 'write', 'search', 'getattr', 'setattr']): 'rw_dir_perms',
            frozenset(['open', 'read', 'search', 'getattr']): 'r_dir_perms',
            frozenset(['call', 'transfer']): 'binder_call',
            frozenset(['read', 'write', 'ioctl', 'open']): 'rw_socket_perms',
        }

        for macro_perms, macro_name in macros.items():
            if perms_set == macro_perms:
                return macro_name

        return None

    def _get_ai_suggestions(self):
        """獲取 AI 分析建議"""
        suggestions = []

        # 分析高頻拒絕
        source_counts = [(k.split(':')[1], v) for k, v in self.statistics.items()
                         if k.startswith('source:')]
        source_counts.sort(key=lambda x: x[1], reverse=True)

        if source_counts:
            top_source = source_counts[0]
            if top_source[1] > len(self.denials) * 0.5:
                suggestions.append(
                    f"注意: {top_source[0]} 占了 {top_source[1]} 次拒絕 "
                    f"({top_source[1]*100//len(self.denials)}%)，建議優先處理"
                )

        # 分析安全風險
        dangerous_permissions = ['execmod', 'ptrace', 'module_load', 'setuid', 'setgid']
        for rule_key, permissions in self.policies.items():
            dangerous_found = [p for p in permissions if p in dangerous_permissions]
            if dangerous_found:
                suggestions.append(
                    f"安全警告: {rule_key} 包含敏感權限 {dangerous_found}，請謹慎授予"
                )

        # 分析重複模式
        if len(self.policies) > 50:
            suggestions.append(
                f"策略規則數量較多 ({len(self.policies)})，建議使用屬性 (attribute) 簡化"
            )

        return suggestions

    def print_summary(self):
        """打印統計摘要"""
        print("\n" + "="*70)
        print("AVC 拒絕統計摘要")
        print("="*70)

        # 統計各類型的拒絕
        by_source = [(k.split(':')[1], v) for k, v in self.statistics.items()
                     if k.startswith('source:')]
        by_target = [(k.split(':')[1], v) for k, v in self.statistics.items()
                     if k.startswith('target:')]
        by_class = [(k.split(':')[1], v) for k, v in self.statistics.items()
                    if k.startswith('class:')]

        print(f"\n總拒絕次數: {len(self.denials)}")
        print(f"生成規則數: {len(self.policies)}")

        print("\n前 10 個 Source Types:")
        for src, count in sorted(by_source, key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {src:30s}: {count:5d} ({count*100//len(self.denials):3d}%)")

        print("\n前 10 個 Target Types:")
        for tgt, count in sorted(by_target, key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {tgt:30s}: {count:5d} ({count*100//len(self.denials):3d}%)")

        print("\n前 10 個 Classes:")
        for cls, count in sorted(by_class, key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {cls:30s}: {count:5d} ({count*100//len(self.denials):3d}%)")

        print("\n" + "="*70)

    def export_json(self, output_file):
        """導出為 JSON 格式"""
        data = {
            'metadata': {
                'source_file': self.log_file,
                'generated_at': datetime.now().isoformat(),
                'total_denials': len(self.denials),
                'total_policies': len(self.policies)
            },
            'denials': self.denials,
            'policies': {k: list(v) for k, v in self.policies.items()},
            'statistics': dict(self.statistics)
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"[+] JSON 已導出: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Android SELinux AVC 拒絕日誌解析器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 基本用法
  %(prog)s avc_denials.log -o policy.te

  # 詳細模式
  %(prog)s avc_denials.log -o policy.te -v

  # 不優化策略
  %(prog)s avc_denials.log -o policy.te --no-optimize

  # 導出為 JSON
  %(prog)s avc_denials.log -o policy.te --json report.json
        '''
    )

    parser.add_argument('log_file', help='AVC 日誌文件')
    parser.add_argument('-o', '--output', required=True,
                        help='輸出策略文件')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='詳細輸出')
    parser.add_argument('--no-comments', action='store_true',
                        help='不生成註釋')
    parser.add_argument('--no-optimize', action='store_true',
                        help='不優化策略 (不使用宏)')
    parser.add_argument('--json', metavar='FILE',
                        help='導出為 JSON 格式')

    args = parser.parse_args()

    # 創建解析器並解析
    avc_parser = AVCParser(args.log_file, args.verbose)
    avc_parser.parse()

    # 打印統計摘要
    avc_parser.print_summary()

    # 生成策略文件
    avc_parser.generate_policy(
        args.output,
        with_comments=not args.no_comments,
        optimize=not args.no_optimize
    )

    # 導出 JSON (如果需要)
    if args.json:
        avc_parser.export_json(args.json)

    print("\n[+] 完成!")


if __name__ == '__main__':
    main()
