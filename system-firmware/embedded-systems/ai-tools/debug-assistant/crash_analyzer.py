#!/usr/bin/env python3
"""
崩潰日誌分析工具
自動分析嵌入式系統崩潰日誌，提供診斷建議

支援：
- HardFault 分析
- Stack trace 解析
- 異常向量分析
- 記憶體錯誤檢測
"""

import argparse
import re
import sys
from enum import Enum

class FaultType(Enum):
    HARDFAULT = "HardFault"
    MEMMANAGE = "MemManage"
    BUSFAULT = "BusFault"
    USAGEFAULT = "UsageFault"
    UNKNOWN = "Unknown"

class CrashAnalyzer:
    """崩潰分析器"""

    def __init__(self, log_content):
        self.log = log_content
        self.fault_type = FaultType.UNKNOWN
        self.registers = {}
        self.stack_trace = []
        self.analysis = []

    def analyze(self):
        """執行分析"""
        print("🔍 開始分析崩潰日誌...")
        print("=" * 60)

        self._detect_fault_type()
        self._parse_registers()
        self._parse_stack_trace()
        self._analyze_fault()

        self._print_report()

    def _detect_fault_type(self):
        """檢測錯誤類型"""
        if 'HardFault' in self.log or 'Hard Fault' in self.log:
            self.fault_type = FaultType.HARDFAULT
        elif 'MemManage' in self.log:
            self.fault_type = FaultType.MEMMANAGE
        elif 'BusFault' in self.log or 'Bus Fault' in self.log:
            self.fault_type = FaultType.BUSFAULT
        elif 'UsageFault' in self.log:
            self.fault_type = FaultType.USAGEFAULT

    def _parse_registers(self):
        """解析寄存器值"""
        # 解析常見的寄存器格式
        patterns = [
            r'R0[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'R1[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'R2[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'R3[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'R12[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'LR[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'PC[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'PSR[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
            r'SP[:\s=]+(?:0x)?([0-9A-Fa-f]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, self.log, re.IGNORECASE)
            if match:
                reg_name = pattern.split('[')[0]
                self.registers[reg_name] = int(match.group(1), 16)

    def _parse_stack_trace(self):
        """解析堆疊追蹤"""
        # 解析常見的堆疊格式
        stack_pattern = r'(?:0x)?([0-9A-Fa-f]{8})'
        matches = re.findall(stack_pattern, self.log)

        for addr in matches:
            addr_int = int(addr, 16)
            # Flash 地址範圍（STM32 一般從 0x08000000 開始）
            if 0x08000000 <= addr_int <= 0x08100000:
                self.stack_trace.append(addr_int)

    def _analyze_fault(self):
        """分析錯誤原因"""
        self.analysis.append(f"錯誤類型: {self.fault_type.value}")

        if self.fault_type == FaultType.HARDFAULT:
            self._analyze_hardfault()
        elif self.fault_type == FaultType.MEMMANAGE:
            self._analyze_memmanage()
        elif self.fault_type == FaultType.BUSFAULT:
            self._analyze_busfault()
        elif self.fault_type == FaultType.USAGEFAULT:
            self._analyze_usagefault()
        else:
            self.analysis.append("⚠️  無法識別的錯誤類型")

        # 分析 PC 和 LR
        if 'PC' in self.registers:
            pc = self.registers['PC']
            self.analysis.append(f"\\n📍 程式計數器 (PC): 0x{pc:08X}")

            if pc == 0 or pc == 0xFFFFFFFF:
                self.analysis.append("  ❌ PC 值異常！可能是：")
                self.analysis.append("     - 函數指標為 NULL")
                self.analysis.append("     - 堆疊溢位導致返回地址損壞")
                self.analysis.append("     - 記憶體被意外覆寫")
            elif pc < 0x08000000:
                self.analysis.append("  ❌ PC 指向非法記憶體區域！")
                self.analysis.append("     可能原因: 函數指標錯誤或堆疊損壞")

        if 'LR' in self.registers:
            lr = self.registers['LR']
            self.analysis.append(f"\\n🔗 連結寄存器 (LR): 0x{lr:08X}")
            self.analysis.append("   這是錯誤發生前的函數返回地址")

        # 分析堆疊指標
        if 'SP' in self.registers:
            sp = self.registers['SP']
            self.analysis.append(f"\\n📚 堆疊指標 (SP): 0x{sp:08X}")

            # 檢查堆疊是否溢位
            if sp < 0x20000000 or sp > 0x20020000:  # STM32F4 典型 RAM 範圍
                self.analysis.append("  ❌ 堆疊指標異常！可能堆疊溢位")

    def _analyze_hardfault(self):
        """分析 HardFault"""
        self.analysis.append("\\n🔴 HardFault 錯誤分析：")
        self.analysis.append("\\nHardFault 是最嚴重的錯誤，常見原因：")
        self.analysis.append("  1. 訪問非法記憶體地址（空指標、野指標）")
        self.analysis.append("  2. 未對齊的記憶體訪問")
        self.analysis.append("  3. 除以零")
        self.analysis.append("  4. 執行未定義的指令")
        self.analysis.append("  5. 堆疊溢位")

        self.analysis.append("\\n🔧 建議的除錯步驟：")
        self.analysis.append("  1. 在 HardFault_Handler 中設置斷點")
        self.analysis.append("  2. 檢查 PC 寄存器，確定出錯的程式碼位置")
        self.analysis.append("  3. 使用 addr2line 工具解析地址：")
        self.analysis.append(f"     arm-none-eabi-addr2line -e firmware.elf 0x{self.registers.get('PC', 0):08X}")
        self.analysis.append("  4. 檢查最近修改的代碼，特別是指標操作")
        self.analysis.append("  5. 啟用 MPU (Memory Protection Unit) 來捕獲記憶體錯誤")

    def _analyze_memmanage(self):
        """分析 MemManage 錯誤"""
        self.analysis.append("\\n🔴 MemManage 錯誤分析：")
        self.analysis.append("\\n記憶體管理錯誤，常見原因：")
        self.analysis.append("  1. 訪問受保護的記憶體區域")
        self.analysis.append("  2. MPU 配置錯誤")
        self.analysis.append("  3. 堆疊溢位到其他區域")

    def _analyze_busfault(self):
        """分析 BusFault"""
        self.analysis.append("\\n🔴 BusFault 錯誤分析：")
        self.analysis.append("\\n匯流排錯誤，常見原因：")
        self.analysis.append("  1. 訪問不存在的外設地址")
        self.analysis.append("  2. 訪問未初始化的外設")
        self.analysis.append("  3. 未對齊的記憶體訪問")
        self.analysis.append("  4. 外設時鐘未啟用")

        self.analysis.append("\\n🔧 建議檢查：")
        self.analysis.append("  1. 確認外設時鐘已啟用")
        self.analysis.append("  2. 檢查外設寄存器地址是否正確")
        self.analysis.append("  3. 驗證 DMA 配置")

    def _analyze_usagefault(self):
        """分析 UsageFault"""
        self.analysis.append("\\n🔴 UsageFault 錯誤分析：")
        self.analysis.append("\\n使用錯誤，常見原因：")
        self.analysis.append("  1. 除以零")
        self.analysis.append("  2. 未對齊的記憶體訪問")
        self.analysis.append("  3. 嘗試執行協處理器指令但協處理器不存在")
        self.analysis.append("  4. 執行未定義的指令")

    def _print_report(self):
        """輸出分析報告"""
        print("\\n📋 崩潰分析報告")
        print("=" * 60)

        # 寄存器狀態
        if self.registers:
            print("\\n📊 寄存器狀態:")
            print("-" * 60)
            for reg, value in sorted(self.registers.items()):
                print(f"  {reg:6s} = 0x{value:08X}  ({value})")

        # 堆疊追蹤
        if self.stack_trace:
            print("\\n📚 堆疊追蹤 (可能的返回地址):")
            print("-" * 60)
            for i, addr in enumerate(self.stack_trace[:10]):  # 只顯示前10個
                print(f"  #{i}: 0x{addr:08X}")

        # 分析結果
        print("\\n" + "=" * 60)
        for line in self.analysis:
            print(line)

        print("\\n" + "=" * 60)
        print("\\n💡 通用除錯技巧:")
        print("  1. 使用 OpenOCD + GDB 進行實時除錯")
        print("  2. 啟用編譯器的 -g 選項生成除錯信息")
        print("  3. 使用 SEGGER SystemView 分析 RTOS 問題")
        print("  4. 啟用 assert() 宏來提前捕獲錯誤")
        print("  5. 使用靜態分析工具 (如 Cppcheck)")
        print("=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description='嵌入式系統崩潰日誌分析工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  %(prog)s --log crash.log
  %(prog)s --text "HardFault: PC=0x08001234 LR=0x08005678"

日誌格式範例:
  HardFault Exception!
  R0: 0x20000100
  R1: 0x00000000
  R2: 0x40020000
  R3: 0x00000001
  R12: 0x00000000
  LR: 0x08001234
  PC: 0x08005678
  PSR: 0x61000000
  SP: 0x20001F00
        """
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--log', help='崩潰日誌文件')
    group.add_argument('--text', help='直接提供崩潰日誌文本')

    args = parser.parse_args()

    # 讀取日誌
    if args.log:
        try:
            with open(args.log, 'r', encoding='utf-8') as f:
                log_content = f.read()
        except FileNotFoundError:
            print(f"❌ 錯誤: 找不到文件 '{args.log}'", file=sys.stderr)
            return 1
        except Exception as e:
            print(f"❌ 錯誤: {e}", file=sys.stderr)
            return 1
    else:
        log_content = args.text

    # 執行分析
    analyzer = CrashAnalyzer(log_content)
    analyzer.analyze()

    return 0

if __name__ == '__main__':
    sys.exit(main())
