#!/usr/bin/env python3
"""
RTOS 配置優化器
使用 AI 分析並優化 RTOS 配置

作者: AI-Assisted Development Team
日期: 2025-11-18
版本: 1.0.0
"""

import argparse
import re
import sys
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class ConfigIssue:
    """配置問題"""
    severity: str  # 'error', 'warning', 'info'
    category: str
    message: str
    line: int
    suggestion: str


class RTOSConfigAnalyzer:
    """RTOS 配置分析器"""

    def __init__(self):
        self.issues: List[ConfigIssue] = []
        self.config_values: Dict[str, any] = {}

    def parse_config(self, config_file: str):
        """解析配置文件"""
        with open(config_file, 'r') as f:
            content = f.readlines()

        for line_num, line in enumerate(content, 1):
            # 匹配 #define CONFIG_NAME value
            match = re.match(r'#define\s+(\w+)\s+(.+)', line.strip())
            if match:
                name = match.group(1)
                value = match.group(2).strip()

                # 移除註釋
                value = re.sub(r'/\*.*?\*/', '', value).strip()
                value = re.sub(r'//.*', '', value).strip()

                # 移除括號
                value = value.strip('()')

                # 嘗試轉換為數字
                try:
                    if value.startswith('0x'):
                        value = int(value, 16)
                    else:
                        value = int(value)
                except ValueError:
                    pass

                self.config_values[name] = (value, line_num)

    def check_heap_size(self):
        """檢查堆大小配置"""
        if 'configTOTAL_HEAP_SIZE' in self.config_values:
            heap_size, line = self.config_values['configTOTAL_HEAP_SIZE']

            if isinstance(heap_size, int):
                # 檢查是否太小
                if heap_size < 1024:
                    self.issues.append(ConfigIssue(
                        severity='error',
                        category='Memory',
                        message=f'Heap size too small: {heap_size} bytes',
                        line=line,
                        suggestion='Increase configTOTAL_HEAP_SIZE to at least 1024 bytes'
                    ))

                # 檢查是否太大
                elif heap_size > 64 * 1024:
                    self.issues.append(ConfigIssue(
                        severity='warning',
                        category='Memory',
                        message=f'Heap size very large: {heap_size} bytes',
                        line=line,
                        suggestion='Consider if such large heap is necessary'
                    ))

                # 建議的堆大小
                task_count = self.estimate_task_count()
                recommended_heap = task_count * 1024 + 2048  # 每個任務 1KB + 2KB 緩衝

                if heap_size < recommended_heap:
                    self.issues.append(ConfigIssue(
                        severity='warning',
                        category='Memory',
                        message=f'Heap may be insufficient for {task_count} tasks',
                        line=line,
                        suggestion=f'Consider increasing to {recommended_heap} bytes'
                    ))

    def check_tick_rate(self):
        """檢查滴答率配置"""
        if 'configTICK_RATE_HZ' in self.config_values:
            tick_rate, line = self.config_values['configTICK_RATE_HZ']

            if isinstance(tick_rate, int):
                # 檢查是否太低
                if tick_rate < 100:
                    self.issues.append(ConfigIssue(
                        severity='warning',
                        category='Performance',
                        message=f'Tick rate very low: {tick_rate} Hz',
                        line=line,
                        suggestion='Low tick rate reduces time resolution. Consider 1000 Hz'
                    ))

                # 檢查是否太高
                elif tick_rate > 10000:
                    self.issues.append(ConfigIssue(
                        severity='warning',
                        category='Performance',
                        message=f'Tick rate very high: {tick_rate} Hz',
                        line=line,
                        suggestion='High tick rate increases overhead. Consider 1000 Hz'
                    ))

                # 最佳實踐
                if tick_rate != 1000:
                    self.issues.append(ConfigIssue(
                        severity='info',
                        category='Best Practice',
                        message=f'Tick rate is {tick_rate} Hz',
                        line=line,
                        suggestion='1000 Hz (1ms tick) is recommended for most applications'
                    ))

    def check_stack_overflow_detection(self):
        """檢查堆疊溢位檢測"""
        if 'configCHECK_FOR_STACK_OVERFLOW' not in self.config_values:
            self.issues.append(ConfigIssue(
                severity='error',
                category='Safety',
                message='Stack overflow detection not configured',
                line=0,
                suggestion='Add: #define configCHECK_FOR_STACK_OVERFLOW 2'
            ))
        else:
            value, line = self.config_values['configCHECK_FOR_STACK_OVERFLOW']
            if value == 0:
                self.issues.append(ConfigIssue(
                    severity='warning',
                    category='Safety',
                    message='Stack overflow detection disabled',
                    line=line,
                    suggestion='Enable with value 1 or 2 for better debugging'
                ))

    def check_malloc_failed_hook(self):
        """檢查記憶體分配失敗鉤子"""
        if 'configUSE_MALLOC_FAILED_HOOK' not in self.config_values:
            self.issues.append(ConfigIssue(
                severity='warning',
                category='Safety',
                message='Malloc failed hook not configured',
                line=0,
                suggestion='Add: #define configUSE_MALLOC_FAILED_HOOK 1'
            ))
        else:
            value, line = self.config_values['configUSE_MALLOC_FAILED_HOOK']
            if value == 0:
                self.issues.append(ConfigIssue(
                    severity='info',
                    category='Safety',
                    message='Malloc failed hook disabled',
                    line=line,
                    suggestion='Enable for better error handling'
                ))

    def check_interrupt_priorities(self):
        """檢查中斷優先級配置"""
        if 'configMAX_SYSCALL_INTERRUPT_PRIORITY' in self.config_values:
            max_syscall, line = self.config_values['configMAX_SYSCALL_INTERRUPT_PRIORITY']

            if 'configKERNEL_INTERRUPT_PRIORITY' in self.config_values:
                kernel_prio, _ = self.config_values['configKERNEL_INTERRUPT_PRIORITY']

                # 檢查優先級設置
                if isinstance(max_syscall, int) and isinstance(kernel_prio, int):
                    if max_syscall >= kernel_prio:
                        self.issues.append(ConfigIssue(
                            severity='error',
                            category='Configuration',
                            message='Interrupt priority configuration error',
                            line=line,
                            suggestion='configMAX_SYSCALL_INTERRUPT_PRIORITY must be < configKERNEL_INTERRUPT_PRIORITY'
                        ))

    def check_optional_features(self):
        """檢查可選功能"""
        optional_features = {
            'configUSE_MUTEXES': ('Mutexes', 'Enable for resource protection'),
            'configUSE_COUNTING_SEMAPHORES': ('Counting Semaphores', 'Enable for resource counting'),
            'configUSE_TIMERS': ('Software Timers', 'Enable for timer functionality'),
            'configUSE_TASK_NOTIFICATIONS': ('Task Notifications', 'Enable for fast IPC'),
            'configGENERATE_RUN_TIME_STATS': ('Runtime Statistics', 'Enable for performance analysis'),
        }

        for config, (feature, reason) in optional_features.items():
            if config not in self.config_values:
                self.issues.append(ConfigIssue(
                    severity='info',
                    category='Feature',
                    message=f'{feature} not configured',
                    line=0,
                    suggestion=f'Consider enabling: {reason}'
                ))

    def estimate_task_count(self) -> int:
        """估算任務數量"""
        # 這是一個簡單的估算，實際應該分析代碼
        if 'configMAX_PRIORITIES' in self.config_values:
            max_prio, _ = self.config_values['configMAX_PRIORITIES']
            if isinstance(max_prio, int):
                return min(max_prio, 10)  # 假設最多 10 個任務
        return 5  # 默認估算

    def analyze(self, config_file: str):
        """執行完整分析"""
        print(f"Analyzing configuration file: {config_file}\n")

        self.parse_config(config_file)

        # 執行所有檢查
        self.check_heap_size()
        self.check_tick_rate()
        self.check_stack_overflow_detection()
        self.check_malloc_failed_hook()
        self.check_interrupt_priorities()
        self.check_optional_features()

    def generate_report(self):
        """生成報告"""
        if not self.issues:
            print("✓ No issues found! Configuration looks good.\n")
            return

        # 按嚴重程度分類
        errors = [i for i in self.issues if i.severity == 'error']
        warnings = [i for i in self.issues if i.severity == 'warning']
        infos = [i for i in self.issues if i.severity == 'info']

        print("╔═══════════════════════════════════════════╗")
        print("║      Configuration Analysis Report       ║")
        print("╚═══════════════════════════════════════════╝\n")

        print(f"Summary: {len(errors)} errors, {len(warnings)} warnings, {len(infos)} info\n")

        # 顯示錯誤
        if errors:
            print("❌ ERRORS:")
            print("─" * 60)
            for issue in errors:
                self._print_issue(issue)
            print()

        # 顯示警告
        if warnings:
            print("⚠️  WARNINGS:")
            print("─" * 60)
            for issue in warnings:
                self._print_issue(issue)
            print()

        # 顯示信息
        if infos:
            print("ℹ️  INFORMATION:")
            print("─" * 60)
            for issue in infos:
                self._print_issue(issue)
            print()

    def _print_issue(self, issue: ConfigIssue):
        """打印單個問題"""
        line_info = f"Line {issue.line}: " if issue.line > 0 else ""
        print(f"  [{issue.category}] {line_info}{issue.message}")
        print(f"    💡 {issue.suggestion}")
        print()

    def generate_optimized_config(self, output_file: str):
        """生成優化後的配置"""
        recommendations = {
            'configTOTAL_HEAP_SIZE': (20 * 1024, "20KB heap for typical applications"),
            'configTICK_RATE_HZ': (1000, "1ms tick period"),
            'configCHECK_FOR_STACK_OVERFLOW': (2, "Maximum stack overflow detection"),
            'configUSE_MALLOC_FAILED_HOOK': (1, "Catch memory allocation failures"),
            'configUSE_MUTEXES': (1, "Enable mutex support"),
            'configUSE_TASK_NOTIFICATIONS': (1, "Enable fast task notifications"),
            'configGENERATE_RUN_TIME_STATS': (1, "Enable runtime statistics"),
        }

        print(f"\nGenerating optimized configuration: {output_file}")

        with open(output_file, 'w') as f:
            f.write("/**\n")
            f.write(" * Optimized FreeRTOS Configuration\n")
            f.write(" * Generated by RTOS Config Optimizer\n")
            f.write(" */\n\n")
            f.write("#ifndef FREERTOS_CONFIG_OPTIMIZED_H\n")
            f.write("#define FREERTOS_CONFIG_OPTIMIZED_H\n\n")

            f.write("/* ========== Optimized Settings ========== */\n\n")

            for config, (value, comment) in recommendations.items():
                f.write(f"/* {comment} */\n")
                f.write(f"#define {config:40} {value}\n\n")

            f.write("#endif /* FREERTOS_CONFIG_OPTIMIZED_H */\n")

        print(f"✓ Optimized configuration written to: {output_file}")


class PowerOptimizer:
    """電源優化建議"""

    @staticmethod
    def analyze_power_config(config: Dict[str, any]) -> List[str]:
        """分析電源配置"""
        suggestions = []

        if 'configUSE_TICKLESS_IDLE' not in config or config.get('configUSE_TICKLESS_IDLE')[0] == 0:
            suggestions.append("Enable Tickless Idle for low power applications")

        if 'configIDLE_SHOULD_YIELD' in config and config.get('configIDLE_SHOULD_YIELD')[0] == 1:
            suggestions.append("Consider disabling IDLE_SHOULD_YIELD for power savings")

        return suggestions


def main():
    parser = argparse.ArgumentParser(
        description='RTOS Configuration Optimizer - Analyze and optimize RTOS configurations'
    )

    parser.add_argument(
        'config_file',
        help='FreeRTOS configuration file (FreeRTOSConfig.h)',
        type=str
    )

    parser.add_argument(
        '-o', '--output',
        help='Output optimized configuration file',
        type=str
    )

    parser.add_argument(
        '--power',
        help='Include power optimization suggestions',
        action='store_true'
    )

    args = parser.parse_args()

    try:
        analyzer = RTOSConfigAnalyzer()
        analyzer.analyze(args.config_file)
        analyzer.generate_report()

        if args.output:
            analyzer.generate_optimized_config(args.output)

        if args.power:
            print("\n⚡ Power Optimization Suggestions:")
            print("─" * 60)
            power_suggestions = PowerOptimizer.analyze_power_config(analyzer.config_values)
            for suggestion in power_suggestions:
                print(f"  • {suggestion}")
            print()

        # 返回錯誤碼
        errors = [i for i in analyzer.issues if i.severity == 'error']
        sys.exit(len(errors))

    except FileNotFoundError:
        print(f"Error: Configuration file not found: {args.config_file}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
