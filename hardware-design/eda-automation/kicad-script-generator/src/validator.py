"""
腳本驗證器
檢查生成的 KiCAD 腳本是否符合規範
"""

import ast
from typing import List, Tuple


class ScriptValidator:
    """KiCAD 腳本驗證器"""

    REQUIRED_IMPORTS = ['pcbnew']
    SAFE_MODULES = [
        'pcbnew', 'os', 'sys', 'math', 're',
        'datetime', 'json', 'csv', 'collections'
    ]
    DANGEROUS_FUNCTIONS = [
        'exec', 'eval', '__import__',
        'compile', 'open'  # open 需要特別檢查
    ]

    def __init__(self):
        self.errors = []
        self.warnings = []

    def validate(self, code: str) -> Tuple[bool, List[str]]:
        """
        驗證腳本

        Args:
            code: 要驗證的 Python 程式碼

        Returns:
            (是否有效, 錯誤/警告列表)
        """
        self.errors = []
        self.warnings = []

        # 1. 檢查語法
        if not self._check_syntax(code):
            return False, self.errors

        # 2. 檢查導入
        self._check_imports(code)

        # 3. 檢查危險函數
        self._check_dangerous_functions(code)

        # 4. 檢查 KiCAD API 使用
        self._check_kicad_api(code)

        # 合併錯誤和警告
        all_issues = []
        if self.errors:
            all_issues.extend([f"❌ 錯誤: {e}" for e in self.errors])
        if self.warnings:
            all_issues.extend([f"⚠️  警告: {w}" for w in self.warnings])

        return len(self.errors) == 0, all_issues

    def _check_syntax(self, code: str) -> bool:
        """檢查 Python 語法"""
        try:
            ast.parse(code)
            return True
        except SyntaxError as e:
            self.errors.append(f"語法錯誤 (行 {e.lineno}): {e.msg}")
            return False

    def _check_imports(self, code: str) -> None:
        """檢查導入的模組"""
        try:
            tree = ast.parse(code)
            imported_modules = set()

            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imported_modules.add(alias.name.split('.')[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imported_modules.add(node.module.split('.')[0])

            # 檢查是否導入 pcbnew
            if 'pcbnew' not in imported_modules:
                self.warnings.append("未導入 pcbnew 模組")

            # 檢查是否有不安全的模組
            unsafe_modules = imported_modules - set(self.SAFE_MODULES)
            if unsafe_modules:
                self.warnings.append(
                    f"導入了非標準模組: {', '.join(unsafe_modules)}"
                )

        except Exception as e:
            self.errors.append(f"導入檢查失敗: {e}")

    def _check_dangerous_functions(self, code: str) -> None:
        """檢查危險函數的使用"""
        try:
            tree = ast.parse(code)

            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    func_name = None

                    if isinstance(node.func, ast.Name):
                        func_name = node.func.id
                    elif isinstance(node.func, ast.Attribute):
                        func_name = node.func.attr

                    if func_name in self.DANGEROUS_FUNCTIONS:
                        # open 函數在某些情況下是必要的
                        if func_name == 'open':
                            self.warnings.append(
                                "使用了 open() 函數,請確保檔案操作是安全的"
                            )
                        else:
                            self.errors.append(
                                f"使用了危險函數: {func_name}"
                            )

        except Exception as e:
            self.errors.append(f"危險函數檢查失敗: {e}")

    def _check_kicad_api(self, code: str) -> None:
        """檢查 KiCAD API 使用"""
        try:
            tree = ast.parse(code)

            has_refresh = False
            has_board_access = False

            for node in ast.walk(tree):
                # 檢查是否有 pcbnew.Refresh() 呼叫
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if (hasattr(node.func, 'value') and
                            isinstance(node.func.value, ast.Name) and
                            node.func.value.id == 'pcbnew' and
                            node.func.attr == 'Refresh'):
                            has_refresh = True

                        # 檢查是否有板子訪問
                        if node.func.attr in ['GetBoard', 'LoadBoard']:
                            has_board_access = True

            if not has_refresh:
                self.warnings.append(
                    "腳本沒有呼叫 pcbnew.Refresh(),畫面可能不會更新"
                )

            if not has_board_access:
                self.warnings.append(
                    "腳本似乎沒有訪問板子,請確認這是否正確"
                )

        except Exception as e:
            self.errors.append(f"KiCAD API 檢查失敗: {e}")


if __name__ == "__main__":
    # 測試
    validator = ScriptValidator()

    # 測試程式碼 1: 正常
    test_code_1 = """
import pcbnew

board = pcbnew.GetBoard()

for fp in board.GetFootprints():
    if fp.GetReference().startswith('R'):
        fp.SetPosition(pcbnew.wxPointMM(50, 50))

pcbnew.Refresh()
"""

    valid, issues = validator.validate(test_code_1)
    print("測試 1 (正常腳本):")
    print(f"  有效: {valid}")
    if issues:
        for issue in issues:
            print(f"  {issue}")
    print()

    # 測試程式碼 2: 有問題
    test_code_2 = """
board = pcbnew.GetBoard()

for fp in board.GetFootprints():
    exec(fp.GetReference())
"""

    valid, issues = validator.validate(test_code_2)
    print("測試 2 (有問題的腳本):")
    print(f"  有效: {valid}")
    if issues:
        for issue in issues:
            print(f"  {issue}")
