"""
AI 腳本生成器
使用 LLM 生成 EDA 工具腳本
"""

import os
from typing import Optional, Dict, List, Tuple
from datetime import datetime
import logging

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScriptGenerator:
    """EDA 腳本生成器"""

    # 系統提示詞模板
    SYSTEM_PROMPTS = {
        "kicad": """你是 KiCAD pcbnew Python 腳本專家。
根據用戶的自然語言描述，生成正確、安全、高效的 KiCAD Python 腳本。

規則:
1. 只使用 pcbnew 模組的 API
2. 包含完整的錯誤處理和參數驗證
3. 添加清晰的中文註解
4. 使用 pcbnew.wxPointMM() 或 pcbnew.VECTOR2I_MM() 處理公制座標
5. 完成後呼叫 pcbnew.Refresh() 更新顯示
6. 遵循 PEP 8 程式碼風格
7. 確保腳本可以獨立執行
8. 對於可能失敗的操作添加 try-except 保護

輸出:
- 只輸出純 Python 程式碼
- 不要包含 markdown 標記或說明文字
- 程式碼應該可以直接儲存為 .py 檔案執行
""",
        "altium": """你是 Altium Designer 腳本專家。
根據用戶描述生成 DelphiScript 或 JavaScript 腳本。

規則:
1. 使用 Altium Scripting API
2. 包含錯誤處理
3. 添加清晰註解
4. 確保腳本安全可靠
""",
        "eagle": """你是 Eagle EDA ULP 腳本專家。
根據用戶描述生成 User Language Program 腳本。

規則:
1. 使用 Eagle ULP 語法
2. 包含錯誤處理
3. 添加清晰註解
"""
    }

    def __init__(
        self,
        tool: str = "kicad",
        model: str = "gpt-4",
        api_key: Optional[str] = None,
        temperature: float = 0.3
    ):
        """
        初始化腳本生成器

        Args:
            tool: EDA 工具名稱 (kicad, altium, eagle)
            model: LLM 模型名稱 (gpt-4, claude-3-opus-20240229, etc.)
            api_key: API 金鑰
            temperature: AI 溫度參數 (0-1)
        """
        self.tool = tool.lower()
        self.model = model
        self.temperature = temperature

        if self.tool not in self.SYSTEM_PROMPTS:
            raise ValueError(f"不支援的工具: {tool}. 支援的工具: {list(self.SYSTEM_PROMPTS.keys())}")

        # 初始化 AI 客戶端
        self._init_ai_client(api_key)

        logger.info(f"初始化腳本生成器: {tool} + {model}")

    def _init_ai_client(self, api_key: Optional[str]) -> None:
        """初始化 AI 客戶端"""
        if self.model.startswith('gpt'):
            self.provider = 'openai'
            try:
                import openai
                openai.api_key = api_key or os.getenv('OPENAI_API_KEY')
                if not openai.api_key:
                    logger.warning("未設定 OPENAI_API_KEY，AI 生成功能將不可用")
                self.client = openai
            except ImportError:
                logger.error("需要安裝 openai 套件: pip install openai")
                self.client = None

        elif self.model.startswith('claude'):
            self.provider = 'anthropic'
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=api_key or os.getenv('ANTHROPIC_API_KEY'))
            except ImportError:
                logger.error("需要安裝 anthropic 套件: pip install anthropic")
                self.client = None
        else:
            logger.warning(f"未知的模型: {self.model}，將使用模擬模式")
            self.provider = 'mock'
            self.client = None

    def generate(
        self,
        task_description: str,
        context: Optional[Dict] = None,
        validate: bool = True
    ) -> 'GeneratedScript':
        """
        從任務描述生成腳本

        Args:
            task_description: 任務描述
            context: 額外上下文資訊（如板子資訊、元件清單等）
            validate: 是否驗證生成的腳本

        Returns:
            生成的腳本物件
        """
        logger.info(f"生成 {self.tool} 腳本...")
        logger.info(f"任務: {task_description[:100]}...")

        # 建構完整提示
        full_prompt = self._build_prompt(task_description, context)

        # 呼叫 AI API 生成腳本
        code = self._call_ai_api(full_prompt)

        # 清理程式碼
        code = self._clean_code(code)

        # 建立腳本物件
        script = GeneratedScript(
            code=code,
            tool=self.tool,
            task=task_description,
            model=self.model
        )

        # 驗證腳本
        if validate:
            is_valid, errors = script.validate()
            if not is_valid:
                logger.warning(f"腳本驗證發現問題: {errors}")
                # 嘗試修復
                logger.info("嘗試使用 AI 修復腳本...")
                script = self._fix_script(script, errors)

        logger.info("✅ 腳本生成完成!")
        return script

    def _build_prompt(self, task: str, context: Optional[Dict]) -> str:
        """建構完整提示"""
        prompt = f"任務: {task}"

        if context:
            prompt += "\n\n上下文資訊:"
            if 'board_info' in context:
                prompt += f"\n- 板子資訊: {context['board_info']}"
            if 'components' in context:
                prompt += f"\n- 元件清單: {context['components']}"
            if 'constraints' in context:
                prompt += f"\n- 約束條件: {context['constraints']}"

        return prompt

    def _call_ai_api(self, prompt: str) -> str:
        """呼叫 AI API"""
        if not self.client:
            logger.warning("AI 客戶端未初始化，使用模擬模式")
            return self._generate_mock_script(prompt)

        try:
            if self.provider == 'openai':
                return self._call_openai(prompt)
            elif self.provider == 'anthropic':
                return self._call_anthropic(prompt)
            else:
                return self._generate_mock_script(prompt)
        except Exception as e:
            logger.error(f"AI API 呼叫失敗: {e}")
            logger.info("回退到模擬模式")
            return self._generate_mock_script(prompt)

    def _call_openai(self, prompt: str) -> str:
        """呼叫 OpenAI API"""
        response = self.client.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.SYSTEM_PROMPTS[self.tool]},
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature
        )
        return response.choices[0].message.content

    def _call_anthropic(self, prompt: str) -> str:
        """呼叫 Anthropic API"""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=self.SYSTEM_PROMPTS[self.tool],
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=self.temperature
        )
        return message.content[0].text

    def _generate_mock_script(self, prompt: str) -> str:
        """生成模擬腳本（當 AI 不可用時）"""
        # 清理提示文本，移除可能導致語法錯誤的字符
        safe_prompt = prompt.replace('"', "'").replace('\n', ' ')

        return f"""#!/usr/bin/env python3
# -*- coding: utf-8 -*-
\"\"\"
Auto-generated {self.tool} script
Task: {safe_prompt[:80]}...
Generated: {datetime.now().isoformat()}
Mode: Mock (AI unavailable)
\"\"\"

import pcbnew


def main():
    '''Main function'''
    try:
        board = pcbnew.GetBoard()
        if not board:
            print("Error: Cannot get current board")
            return False

        print(f"Board: {{board.GetFileName()}}")

        # TODO: Implement actual functionality
        # Task: {safe_prompt[:60]}...

        pcbnew.Refresh()
        print("Script executed successfully")
        return True

    except Exception as e:
        print(f"Error: {{e}}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    main()
"""

    def _clean_code(self, code: str) -> str:
        """清理生成的程式碼"""
        code = code.strip()

        # 移除 markdown 標記
        if code.startswith('```python'):
            code = code[len('```python'):].strip()
        elif code.startswith('```'):
            code = code[3:].strip()
        if code.endswith('```'):
            code = code[:-3].strip()

        return code

    def _fix_script(self, script: 'GeneratedScript', errors: List[str]) -> 'GeneratedScript':
        """嘗試修復腳本"""
        if not self.client:
            logger.warning("無法修復腳本: AI 客戶端未初始化")
            return script

        fix_prompt = f"""以下腳本存在問題，請修復:

錯誤:
{chr(10).join(errors)}

原始腳本:
```python
{script.code}
```

請輸出修復後的完整腳本。
"""

        try:
            fixed_code = self._call_ai_api(fix_prompt)
            fixed_code = self._clean_code(fixed_code)
            return GeneratedScript(
                code=fixed_code,
                tool=self.tool,
                task=script.task,
                model=self.model
            )
        except Exception as e:
            logger.error(f"腳本修復失敗: {e}")
            return script


class GeneratedScript:
    """生成的腳本類別"""

    def __init__(
        self,
        code: str,
        tool: str,
        task: str = "",
        model: str = ""
    ):
        self.code = code
        self.tool = tool
        self.task = task
        self.model = model
        self.created_at = datetime.now()

    def save(self, filepath: str) -> None:
        """儲存腳本到檔案"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(self.code)
            logger.info(f"腳本已儲存到: {filepath}")
        except Exception as e:
            logger.error(f"儲存腳本失敗: {e}")
            raise

    def execute(self, board_file: Optional[str] = None) -> Dict:
        """
        執行腳本（需要 EDA 工具環境）

        Args:
            board_file: 板子檔案路徑

        Returns:
            執行結果字典
        """
        logger.info(f"執行 {self.tool} 腳本...")

        try:
            if self.tool == 'kicad':
                import pcbnew

                # 載入板子
                if board_file:
                    board = pcbnew.LoadBoard(board_file)
                    logger.info(f"已載入板子: {board_file}")

                # 執行腳本
                exec_globals = {'pcbnew': pcbnew}
                exec(self.code, exec_globals)

                return {
                    "success": True,
                    "message": "腳本執行成功",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": f"尚未支援 {self.tool} 的腳本執行"
                }

        except ImportError as e:
            return {
                "success": False,
                "error": f"缺少必要模組: {e}",
                "hint": "請在 EDA 工具環境中執行"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": __import__('traceback').format_exc()
            }

    def validate(self) -> Tuple[bool, List[str]]:
        """
        驗證腳本

        Returns:
            (是否有效, 錯誤列表)
        """
        errors = []

        # 基本語法檢查
        try:
            compile(self.code, '<string>', 'exec')
        except SyntaxError as e:
            errors.append(f"語法錯誤: {e}")

        # 檢查必要的 import
        if self.tool == 'kicad':
            if 'import pcbnew' not in self.code:
                errors.append("缺少 'import pcbnew'")

        # 檢查是否有 main 函數或執行邏輯
        if 'def ' not in self.code and 'class ' not in self.code:
            if len(self.code.split('\n')) < 5:
                errors.append("腳本內容太少，可能不完整")

        return (len(errors) == 0, errors)

    def get_info(self) -> Dict:
        """獲取腳本資訊"""
        return {
            "tool": self.tool,
            "task": self.task,
            "model": self.model,
            "created_at": self.created_at.isoformat(),
            "lines": len(self.code.split('\n')),
            "size": len(self.code)
        }
