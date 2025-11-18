#!/usr/bin/env python3
"""
SELinux 策略語法檢查器

檢查 SELinux 策略文件的語法錯誤和潛在問題
提供 AI 輔助的優化建議
"""

import re
import sys
import argparse
from collections import defaultdict

class SyntaxChecker:
    """SELinux 策略語法檢查器"""

    def __init__(self, policy_file, strict=False):
        self.policy_file = policy_file
        self.strict = strict
        self.errors = []
        self.warnings = []
        self.info = []

        # 語法規則
        self.patterns = {
            'allow': re.compile(r'^allow\s+(\w+)\s+(\w+):(\w+)\s*\{([^}]+)\}\s*;'),
            'type': re.compile(r'^type\s+(\w+)\s*(?:,\s*([^;]+))?\s*;'),
            'attribute': re.compile(r'^attribute\s+(\w+)\s*;'),
            'typeattribute': re.compile(r'^typeattribute\s+(\w+)\s+([^;]+);'),
            'neverallow': re.compile(r'^neverallow\s+(\w+)\s+(\w+):(\w+)\s*\{([^}]+)\}\s*;'),
            'auditallow': re.compile(r'^auditallow\s+(\w+)\s+(\w+):(\w+)\s*\{([^}]+)\}\s*;'),
            'dontaudit': re.compile(r'^dontaudit\s+(\w+)\s+(\w+):(\w+)\s*\{([^}]+)\}\s*;'),
        }

        # 有效的對象類別
        self.valid_classes = {
            'file', 'dir', 'lnk_file', 'chr_file', 'blk_file', 'sock_file', 'fifo_file',
            'service_manager', 'binder', 'socket', 'tcp_socket', 'udp_socket',
            'unix_stream_socket', 'unix_dgram_socket', 'netlink_socket',
            'property_service', 'system_server', 'process', 'capability',
            'capability2', 'security', 'system', 'rawip_socket', 'netlink_route_socket',
        }

        # 常見權限
        self.common_permissions = {
            'file': ['read', 'write', 'open', 'getattr', 'setattr', 'lock', 'append',
                    'create', 'unlink', 'rename', 'execute', 'ioctl'],
            'dir': ['read', 'write', 'open', 'getattr', 'setattr', 'search', 'add_name',
                   'remove_name', 'create', 'rmdir', 'reparent'],
            'service_manager': ['add', 'find', 'list'],
            'binder': ['call', 'transfer', 'set_context_mgr'],
            'process': ['fork', 'transition', 'sigchld', 'sigkill', 'signal', 'getattr',
                       'setcurrent', 'setsched', 'setrlimit'],
            'capability': ['chown', 'dac_override', 'dac_read_search', 'fowner', 'fsetid',
                          'kill', 'setgid', 'setuid', 'net_admin', 'net_raw'],
        }

        # 危險權限
        self.dangerous_permissions = {
            'execmod', 'ptrace', 'module_load', 'module_request',
            'setuid', 'setgid', 'sys_admin', 'sys_module', 'dac_override',
        }

        # 統計資訊
        self.stats = defaultdict(int)

    def check(self):
        """執行語法檢查"""
        print(f"[*] 檢查策略文件: {self.policy_file}")

        try:
            with open(self.policy_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_num, line in enumerate(lines, 1):
                self._check_line(line, line_num)

            print(f"[+] 檢查完成: {len(lines)} 行")
            print(f"[+] 錯誤: {len(self.errors)}, 警告: {len(self.warnings)}, 信息: {len(self.info)}")

        except FileNotFoundError:
            print(f"[!] 錯誤: 找不到文件 {self.policy_file}")
            sys.exit(1)
        except Exception as e:
            print(f"[!] 檢查錯誤: {e}")
            sys.exit(1)

    def _check_line(self, line, line_num):
        """檢查單行語法"""
        line = line.strip()

        # 跳過註釋和空行
        if not line or line.startswith('#'):
            return

        # 檢查各種規則類型
        if line.startswith('allow'):
            self._check_allow_rule(line, line_num)
        elif line.startswith('type '):
            self._check_type_declaration(line, line_num)
        elif line.startswith('attribute '):
            self._check_attribute_declaration(line, line_num)
        elif line.startswith('typeattribute '):
            self._check_typeattribute(line, line_num)
        elif line.startswith('neverallow'):
            self._check_allow_rule(line, line_num, rule_type='neverallow')
        elif line.startswith('auditallow'):
            self._check_allow_rule(line, line_num, rule_type='auditallow')
        elif line.startswith('dontaudit'):
            self._check_allow_rule(line, line_num, rule_type='dontaudit')
        else:
            if self.strict:
                self.warnings.append(f"行 {line_num}: 未知規則類型: {line[:50]}...")

    def _check_allow_rule(self, line, line_num, rule_type='allow'):
        """檢查 allow 規則"""
        pattern_key = rule_type if rule_type in self.patterns else 'allow'
        match = self.patterns[pattern_key].match(line)

        if not match:
            self.errors.append(f"行 {line_num}: 無效的 {rule_type} 規則語法")
            return

        source = match.group(1)
        target = match.group(2)
        tclass = match.group(3)
        perms_str = match.group(4)
        perms = [p.strip() for p in perms_str.split() if p.strip()]

        # 統計
        self.stats['total_rules'] += 1
        self.stats[f'{rule_type}_rules'] += 1

        # 檢查類型名稱格式
        if not re.match(r'^[a-z][a-z0-9_]*$', source) and source not in ['self', 'domain']:
            self.warnings.append(
                f"行 {line_num}: Source type '{source}' 應該使用小寫字母和下劃線"
            )

        if not re.match(r'^[a-z][a-z0-9_]*$', target) and target not in ['self', 'domain']:
            self.warnings.append(
                f"行 {line_num}: Target type '{target}' 應該使用小寫字母和下劃線"
            )

        # 檢查對象類別
        if tclass not in self.valid_classes:
            self.warnings.append(
                f"行 {line_num}: 未知的對象類別 '{tclass}'"
            )

        # 檢查權限
        if not perms:
            self.errors.append(f"行 {line_num}: 空權限集")
        else:
            self._check_permissions(perms, tclass, line_num, source, target)

        # 檢查危險組合
        if source == target and source != 'self':
            self.info.append(
                f"行 {line_num}: Self-referencing rule: {source} -> {target}"
            )

    def _check_permissions(self, perms, tclass, line_num, source, target):
        """檢查權限有效性"""
        # 檢查危險權限
        dangerous_found = [p for p in perms if p in self.dangerous_permissions]
        if dangerous_found:
            self.warnings.append(
                f"行 {line_num}: 包含危險權限 {dangerous_found} "
                f"({source} -> {target}:{tclass}), 請確認是否必要"
            )

        # 檢查權限是否適用於該類別
        if tclass in self.common_permissions:
            valid_perms = self.common_permissions[tclass]
            invalid_perms = [p for p in perms if p not in valid_perms]
            if invalid_perms:
                self.warnings.append(
                    f"行 {line_num}: 類別 '{tclass}' 可能不支持權限 {invalid_perms}"
                )

    def _check_type_declaration(self, line, line_num):
        """檢查類型聲明"""
        match = self.patterns['type'].match(line)

        if not match:
            self.errors.append(f"行 {line_num}: 無效的 type 聲明語法")
            return

        type_name = match.group(1)
        attributes = match.group(2)

        self.stats['type_declarations'] += 1

        # 檢查類型名稱格式
        if not re.match(r'^[a-z][a-z0-9_]*$', type_name):
            self.warnings.append(
                f"行 {line_num}: Type name '{type_name}' 應該使用小寫字母和下劃線"
            )

        # 檢查屬性
        if attributes:
            attr_list = [a.strip() for a in attributes.split(',')]
            for attr in attr_list:
                if not re.match(r'^[a-z][a-z0-9_]*$', attr):
                    self.warnings.append(
                        f"行 {line_num}: Attribute '{attr}' 應該使用小寫字母和下劃線"
                    )

    def _check_attribute_declaration(self, line, line_num):
        """檢查屬性聲明"""
        match = self.patterns['attribute'].match(line)

        if not match:
            self.errors.append(f"行 {line_num}: 無效的 attribute 聲明語法")
            return

        attr_name = match.group(1)
        self.stats['attribute_declarations'] += 1

        if not re.match(r'^[a-z][a-z0-9_]*$', attr_name):
            self.warnings.append(
                f"行 {line_num}: Attribute name '{attr_name}' 應該使用小寫字母和下劃線"
            )

    def _check_typeattribute(self, line, line_num):
        """檢查 typeattribute 聲明"""
        match = self.patterns['typeattribute'].match(line)

        if not match:
            self.errors.append(f"行 {line_num}: 無效的 typeattribute 語法")
            return

        type_name = match.group(1)
        attributes = match.group(2)

        self.stats['typeattribute_declarations'] += 1

    def print_report(self):
        """打印檢查報告"""
        print("\n" + "="*70)
        print("SELinux 策略語法檢查報告")
        print("="*70)

        # 統計資訊
        print("\n統計資訊:")
        for key, value in sorted(self.stats.items()):
            print(f"  {key:30s}: {value}")

        # 錯誤
        if self.errors:
            print(f"\n錯誤 ({len(self.errors)}):")
            for error in self.errors:
                print(f"  ❌ {error}")

        # 警告
        if self.warnings:
            print(f"\n警告 ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")

        # 信息
        if self.info and self.strict:
            print(f"\n信息 ({len(self.info)}):")
            for info in self.info:
                print(f"  ℹ️  {info}")

        # AI 優化建議
        suggestions = self._get_ai_suggestions()
        if suggestions:
            print(f"\nAI 優化建議:")
            for i, suggestion in enumerate(suggestions, 1):
                print(f"  {i}. {suggestion}")

        # 結論
        print("\n" + "="*70)
        if not self.errors and not self.warnings:
            print("✅ 沒有發現問題!")
        elif not self.errors:
            print("⚠️  發現一些警告，但沒有嚴重錯誤")
        else:
            print("❌ 發現嚴重錯誤，請修正後再使用")
        print("="*70)

        return len(self.errors) == 0

    def _get_ai_suggestions(self):
        """獲取 AI 優化建議"""
        suggestions = []

        # 規則數量建議
        total_rules = self.stats.get('total_rules', 0)
        if total_rules > 100:
            suggestions.append(
                f"策略規則數量較多 ({total_rules})，建議使用 attribute 來簡化和組織規則"
            )

        # 類型聲明建議
        type_decls = self.stats.get('type_declarations', 0)
        if type_decls > 50:
            suggestions.append(
                f"類型聲明數量較多 ({type_decls})，建議檢查是否有重複或可以合併的類型"
            )

        # allow vs dontaudit 比例
        allow_rules = self.stats.get('allow_rules', 0)
        dontaudit_rules = self.stats.get('dontaudit_rules', 0)
        if dontaudit_rules > allow_rules * 0.5:
            suggestions.append(
                f"dontaudit 規則比例較高，可能隱藏了一些問題，建議審查"
            )

        # neverallow 建議
        neverallow_rules = self.stats.get('neverallow_rules', 0)
        if total_rules > 50 and neverallow_rules == 0:
            suggestions.append(
                "建議添加 neverallow 規則來強制執行安全策略"
            )

        return suggestions


def main():
    parser = argparse.ArgumentParser(
        description='SELinux 策略語法檢查器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  # 基本檢查
  %(prog)s policy.te

  # 嚴格模式 (顯示更多信息)
  %(prog)s policy.te --strict

  # 只顯示錯誤
  %(prog)s policy.te --errors-only
        '''
    )

    parser.add_argument('policy_file', help='SELinux 策略文件')
    parser.add_argument('--strict', action='store_true',
                        help='嚴格模式 (顯示更多檢查資訊)')
    parser.add_argument('--errors-only', action='store_true',
                        help='只顯示錯誤')

    args = parser.parse_args()

    # 創建檢查器並執行檢查
    checker = SyntaxChecker(args.policy_file, args.strict)
    checker.check()

    # 打印報告
    if not args.errors_only:
        success = checker.print_report()
    else:
        if checker.errors:
            print("\n錯誤:")
            for error in checker.errors:
                print(f"  ❌ {error}")
        success = len(checker.errors) == 0

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
