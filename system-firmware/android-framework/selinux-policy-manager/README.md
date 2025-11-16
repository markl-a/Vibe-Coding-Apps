# SELinux 策略管理器 (SELinux Policy Manager)

> Android SELinux 安全策略分析、生成與管理工具

## 專案概述

本專案提供一套完整的 SELinux 策略管理工具，包含策略分析、自動生成、衝突檢測、審計日誌解析等功能，幫助開發者更有效地管理 Android 系統的 SELinux 安全策略。

## 功能特性

- ✅ AVC 拒絕日誌自動解析
- ✅ SELinux 策略自動生成
- ✅ 策略語法檢查與驗證
- ✅ 策略衝突檢測
- ✅ 安全等級評估
- ✅ 策略優化建議
- ✅ 策略文檔生成
- ✅ 交互式策略編輯器

## 工具架構

```
SELinux Policy Manager
┌────────────────────────────────────────┐
│   AVC Log Parser (日誌解析器)           │
│  ┌──────────────────────────────────┐  │
│  │  • Kernel Log Monitor            │  │
│  │  • AVC Denial Parser             │  │
│  │  • Context Extraction            │  │
│  └──────────────────────────────────┘  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│   Policy Generator (策略生成器)         │
│  ┌──────────────────────────────────┐  │
│  │  • Rule Generation               │  │
│  │  • Type/Attribute Definition     │  │
│  │  • Context Assignment            │  │
│  └──────────────────────────────────┘  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│   Policy Analyzer (策略分析器)          │
│  ┌──────────────────────────────────┐  │
│  │  • Syntax Validation             │  │
│  │  • Conflict Detection            │  │
│  │  • Security Assessment           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

## 目錄結構

```
selinux-policy-manager/
├── README.md
├── policies/                        # 策略範例
│   ├── custom_service.te
│   ├── custom_app.te
│   ├── file_contexts
│   └── service_contexts
├── analyzer/                        # 分析器
│   ├── PolicyAnalyzer.py
│   ├── SyntaxChecker.py
│   ├── ConflictDetector.py
│   └── SecurityAssessor.py
├── generator/                       # 生成器
│   ├── AVCParser.py
│   ├── PolicyGenerator.py
│   ├── RuleBuilder.py
│   └── ContextManager.py
└── docs/
    ├── selinux-guide.md
    ├── policy-writing.md
    └── troubleshooting.md
```

## 快速開始

### 1. 收集 AVC 拒絕日誌

```bash
# 清除現有日誌
adb shell dmesg -c

# 執行觸發拒絕的操作...

# 收集 AVC 拒絕日誌
adb shell dmesg | grep avc > avc_denials.log

# 或使用 logcat
adb logcat -b all -d | grep avc > avc_denials.log
```

### 2. 解析並生成策略

```bash
# 解析 AVC 日誌並生成策略
python3 generator/AVCParser.py avc_denials.log -o custom_policy.te

# 查看生成的策略
cat custom_policy.te
```

### 3. 驗證策略

```bash
# 檢查策略語法
python3 analyzer/SyntaxChecker.py custom_policy.te

# 檢測策略衝突
python3 analyzer/ConflictDetector.py custom_policy.te
```

## AVC 日誌解析器

### AVCParser.py

```python
#!/usr/bin/env python3
"""
AVC 拒絕日誌解析器
自動解析 SELinux AVC 拒絕日誌並生成對應策略
"""

import re
import sys
from collections import defaultdict

class AVCParser:
    def __init__(self, log_file):
        self.log_file = log_file
        self.denials = []
        self.policies = defaultdict(set)

    def parse(self):
        """解析 AVC 日誌"""
        # AVC 拒絕日誌格式:
        # avc: denied { permission } for scontext=u:r:source_type:s0
        # tcontext=u:object_r:target_type:s0 tclass=class

        pattern = re.compile(
            r'avc:\s+denied\s+\{\s*([^}]+)\s*\}\s+for\s+'
            r'.*scontext=u:r:(\w+):s0\s+'
            r'tcontext=u:\w+:(\w+):s0\s+'
            r'tclass=(\w+)'
        )

        with open(self.log_file, 'r') as f:
            for line in f:
                match = pattern.search(line)
                if match:
                    permissions = match.group(1).split()
                    source_type = match.group(2)
                    target_type = match.group(3)
                    tclass = match.group(4)

                    denial = {
                        'permissions': permissions,
                        'source': source_type,
                        'target': target_type,
                        'class': tclass
                    }
                    self.denials.append(denial)

                    # 生成策略規則
                    rule = f"allow {source_type} {target_type}:{tclass}"
                    self.policies[rule].update(permissions)

        print(f"Parsed {len(self.denials)} AVC denials")
        print(f"Generated {len(self.policies)} policy rules")

    def generate_policy(self, output_file):
        """生成 SELinux 策略文件"""
        with open(output_file, 'w') as f:
            f.write("# Auto-generated SELinux policy\n")
            f.write("# Generated from AVC denials\n\n")

            for rule, permissions in sorted(self.policies.items()):
                perms = ' '.join(sorted(permissions))
                f.write(f"{rule} {{ {perms} }};\n")

        print(f"Policy written to: {output_file}")

    def print_summary(self):
        """打印摘要"""
        print("\n" + "="*60)
        print("AVC Denial Summary")
        print("="*60)

        # 統計各類型的拒絕
        by_source = defaultdict(int)
        by_target = defaultdict(int)
        by_class = defaultdict(int)

        for denial in self.denials:
            by_source[denial['source']] += 1
            by_target[denial['target']] += 1
            by_class[denial['class']] += 1

        print("\nTop Source Types:")
        for src, count in sorted(by_source.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {src}: {count}")

        print("\nTop Target Types:")
        for tgt, count in sorted(by_target.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {tgt}: {count}")

        print("\nTop Classes:")
        for cls, count in sorted(by_class.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {cls}: {count}")

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <avc_log_file> [-o output_file]")
        sys.exit(1)

    log_file = sys.argv[1]
    output_file = "generated_policy.te"

    if len(sys.argv) >= 4 and sys.argv[2] == '-o':
        output_file = sys.argv[3]

    parser = AVCParser(log_file)
    parser.parse()
    parser.print_summary()
    parser.generate_policy(output_file)

if __name__ == '__main__':
    main()
```

## 策略語法檢查器

### SyntaxChecker.py

```python
#!/usr/bin/env python3
"""
SELinux 策略語法檢查器
"""

import re
import sys

class SyntaxChecker:
    def __init__(self, policy_file):
        self.policy_file = policy_file
        self.errors = []
        self.warnings = []

    def check(self):
        """檢查策略語法"""
        with open(self.policy_file, 'r') as f:
            line_num = 0
            for line in f:
                line_num += 1
                line = line.strip()

                # 跳過註釋和空行
                if not line or line.startswith('#'):
                    continue

                # 檢查各種規則類型
                if line.startswith('allow'):
                    self.check_allow_rule(line, line_num)
                elif line.startswith('type '):
                    self.check_type_declaration(line, line_num)
                elif line.startswith('attribute '):
                    self.check_attribute_declaration(line, line_num)
                else:
                    self.warnings.append(f"Line {line_num}: Unknown rule type")

    def check_allow_rule(self, line, line_num):
        """檢查 allow 規則"""
        # allow source_type target_type:class { permissions };
        pattern = r'allow\s+(\w+)\s+(\w+):(\w+)\s*\{\s*([^}]+)\s*\}\s*;'
        match = re.match(pattern, line)

        if not match:
            self.errors.append(f"Line {line_num}: Invalid allow rule syntax")
            return

        source = match.group(1)
        target = match.group(2)
        tclass = match.group(3)
        perms = match.group(4).split()

        # 檢查類型名稱格式
        if not re.match(r'^[a-z][a-z0-9_]*$', source):
            self.warnings.append(
                f"Line {line_num}: Source type '{source}' should be lowercase"
            )

        if not re.match(r'^[a-z][a-z0-9_]*$', target):
            self.warnings.append(
                f"Line {line_num}: Target type '{target}' should be lowercase"
            )

        # 檢查是否有空權限
        if not perms:
            self.errors.append(f"Line {line_num}: Empty permission set")

    def check_type_declaration(self, line, line_num):
        """檢查類型聲明"""
        # type type_name [, attribute_list];
        pattern = r'type\s+(\w+)\s*(?:,\s*([^;]+))?\s*;'
        match = re.match(pattern, line)

        if not match:
            self.errors.append(f"Line {line_num}: Invalid type declaration")
            return

        type_name = match.group(1)
        if not re.match(r'^[a-z][a-z0-9_]*$', type_name):
            self.warnings.append(
                f"Line {line_num}: Type name '{type_name}' should be lowercase"
            )

    def check_attribute_declaration(self, line, line_num):
        """檢查屬性聲明"""
        pattern = r'attribute\s+(\w+)\s*;'
        match = re.match(pattern, line)

        if not match:
            self.errors.append(f"Line {line_num}: Invalid attribute declaration")

    def print_report(self):
        """打印檢查報告"""
        print("\n" + "="*60)
        print("SELinux Policy Syntax Check Report")
        print("="*60)

        if self.errors:
            print(f"\nErrors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  ❌ {error}")

        if self.warnings:
            print(f"\nWarnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")

        if not self.errors and not self.warnings:
            print("\n✅ No issues found!")

        return len(self.errors) == 0

def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <policy_file>")
        sys.exit(1)

    checker = SyntaxChecker(sys.argv[1])
    checker.check()
    success = checker.print_report()

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
```

## 策略範例

### custom_service.te

```te
# 自定義系統服務 SELinux 策略

# 定義服務類型
type custom_service, system_api_service, system_server_service, service_manager_type;

# 允許 system_server 添加服務
allow system_server custom_service:service_manager add;

# 允許應用查找服務
allow appdomain custom_service:service_manager find;

# 允許系統應用訪問
allow system_app custom_service:service_manager find;
allow platform_app custom_service:service_manager find;

# 允許服務訪問必要的文件
allow custom_service system_data_file:dir { create_dir_perms };
allow custom_service system_data_file:file { create_file_perms };

# 允許服務使用網路
allow custom_service self:tcp_socket { create_socket_perms };
allow custom_service self:udp_socket { create_socket_perms };

# 允許服務訪問設備
allow custom_service device:chr_file { read write ioctl open };

# Binder 通訊
allow custom_service binder_device:chr_file { read write ioctl open };
allow custom_service servicemanager:binder { call transfer };
```

### file_contexts

```
# 文件上下文配置

# 系統服務可執行文件
/system/bin/custom_service    u:object_r:custom_service_exec:s0

# 服務資料目錄
/data/custom(/.*)?             u:object_r:custom_service_data_file:s0

# 配置文件
/system/etc/custom.conf        u:object_r:system_file:s0

# 設備節點
/dev/custom_device             u:object_r:custom_device:s0
```

## 使用工具集

### 完整工作流程

```bash
# 1. 清除並收集日誌
adb shell dmesg -c
adb shell setenforce 0  # 臨時設為寬容模式
# 執行操作...
adb shell dmesg | grep avc > avc.log

# 2. 生成策略
python3 generator/AVCParser.py avc.log -o my_policy.te

# 3. 檢查語法
python3 analyzer/SyntaxChecker.py my_policy.te

# 4. 整合到 AOSP
cp my_policy.te device/manufacturer/product/sepolicy/

# 5. 編譯並測試
m selinux_policy
adb reboot

# 6. 驗證
adb shell setenforce 1  # 恢復強制模式
adb shell dmesg | grep avc  # 檢查是否還有拒絕
```

## 最佳實踐

### 1. 最小權限原則
- 只授予必要的權限
- 避免使用通配符
- 定期審查策略

### 2. 類型設計
- 使用描述性的類型名稱
- 合理使用屬性分組
- 避免類型爆炸

### 3. 安全考量
- 不要隨意使用 `permissive` 模式
- 避免授予 `mlstrustedsubject` 屬性
- 謹慎處理文件上下文

### 4. 維護性
- 添加清晰的註釋
- 按功能組織策略文件
- 使用版本控制

## 除錯技巧

```bash
# 查看當前 SELinux 模式
adb shell getenforce

# 臨時切換到寬容模式
adb shell setenforce 0

# 恢復強制模式
adb shell setenforce 1

# 查看進程上下文
adb shell ps -Z

# 查看文件上下文
adb shell ls -Z /path/to/file

# 實時監控 AVC 拒絕
adb shell dmesg -w | grep avc
```

## 參考資源

- [Android SELinux](https://source.android.com/docs/security/features/selinux)
- [SELinux Project](https://selinuxproject.org/)
- [NSA SELinux Documentation](https://www.nsa.gov/What-We-Do/Research/SELinux/)

---

**版本**: 1.0.0
**最後更新**: 2025-11-16
**相容性**: Android 10+
