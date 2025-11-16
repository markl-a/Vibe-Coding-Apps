"""
KiCAD Script Generator
使用 AI 從自然語言生成 KiCAD Python 腳本
"""

import os
from typing import Optional, Tuple, List
import openai
from anthropic import Anthropic


class GeneratedScript:
    """生成的腳本類別"""

    def __init__(self, code: str, task: str = "", model: str = ""):
        self._code = code
        self.task = task
        self.model = model

    @property
    def code(self) -> str:
        """獲取生成的程式碼"""
        return self._code

    def save(self, filepath: str) -> None:
        """儲存腳本到檔案"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(self._code)
        print(f"✅ 腳本已儲存至: {filepath}")

    def execute(self, board_file: Optional[str] = None) -> dict:
        """
        執行腳本 (需要 KiCAD 環境)

        Args:
            board_file: KiCAD 板子檔案路徑

        Returns:
            執行結果字典
        """
        try:
            import pcbnew

            # 如果指定了板子檔案,先載入
            if board_file:
                board = pcbnew.LoadBoard(board_file)

            # 執行生成的腳本
            exec(self._code)

            return {
                "success": True,
                "message": "腳本執行成功"
            }
        except ImportError:
            return {
                "success": False,
                "error": "未找到 pcbnew 模組,請在 KiCAD 環境中執行"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def validate(self) -> Tuple[bool, List[str]]:
        """
        驗證腳本

        Returns:
            (是否有效, 錯誤列表)
        """
        from .validator import ScriptValidator
        validator = ScriptValidator()
        return validator.validate(self._code)


class KiCADScriptGenerator:
    """KiCAD 腳本生成器"""

    DEFAULT_SYSTEM_PROMPT = """你是一位 KiCAD pcbnew Python 腳本專家。
根據用戶的自然語言描述,生成正確、安全、高效的 KiCAD Python 腳本。

規則:
1. 只使用 pcbnew 模組的 API
2. 包含完整的錯誤處理
3. 添加清晰的中文註解
4. 使用 pcbnew.wxPointMM() 處理公制座標
5. 完成後呼叫 pcbnew.Refresh() 更新顯示
6. 遵循 PEP 8 程式碼風格
7. 確保腳本可以獨立執行

輸出:
- 只輸出純 Python 程式碼
- 不要包含 markdown 標記或說明文字
- 程式碼應該可以直接儲存為 .py 檔案執行
"""

    def __init__(
        self,
        model: str = "gpt-4",
        api_key: Optional[str] = None,
        system_prompt: Optional[str] = None
    ):
        """
        初始化生成器

        Args:
            model: AI 模型名稱 (gpt-4, gpt-3.5-turbo, claude-3-opus 等)
            api_key: API 金鑰 (如果不提供,從環境變數讀取)
            system_prompt: 自訂系統提示詞
        """
        self.model = model
        self.system_prompt = system_prompt or self.DEFAULT_SYSTEM_PROMPT

        # 判斷是 OpenAI 還是 Anthropic
        if model.startswith('gpt'):
            self.provider = 'openai'
            openai.api_key = api_key or os.getenv('OPENAI_API_KEY')
            if not openai.api_key:
                raise ValueError("請設定 OPENAI_API_KEY 環境變數或提供 api_key 參數")
        elif model.startswith('claude'):
            self.provider = 'anthropic'
            self.client = Anthropic(api_key=api_key or os.getenv('ANTHROPIC_API_KEY'))
            if not self.client.api_key:
                raise ValueError("請設定 ANTHROPIC_API_KEY 環境變數或提供 api_key 參數")
        else:
            raise ValueError(f"不支援的模型: {model}")

    def generate(
        self,
        task: str,
        language: str = "zh-TW",
        temperature: float = 0.3
    ) -> GeneratedScript:
        """
        從自然語言描述生成 KiCAD 腳本

        Args:
            task: 任務描述
            language: 語言 (zh-TW, en-US)
            temperature: AI 溫度參數 (0-1,越低越確定性)

        Returns:
            GeneratedScript 物件
        """
        print(f"🤖 使用 {self.model} 生成腳本...")
        print(f"📝 任務: {task}")

        # 根據語言調整提示
        lang_note = ""
        if language == "zh-TW":
            lang_note = "\n請在程式碼註解中使用繁體中文。"

        user_prompt = f"任務: {task}{lang_note}"

        # 呼叫 AI API
        if self.provider == 'openai':
            code = self._generate_openai(user_prompt, temperature)
        else:
            code = self._generate_anthropic(user_prompt, temperature)

        # 清理程式碼 (移除可能的 markdown 標記)
        code = self._clean_code(code)

        print("✅ 腳本生成完成!")
        return GeneratedScript(code, task, self.model)

    def _generate_openai(self, prompt: str, temperature: float) -> str:
        """使用 OpenAI API 生成"""
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=temperature
        )
        return response.choices[0].message.content

    def _generate_anthropic(self, prompt: str, temperature: float) -> str:
        """使用 Anthropic API 生成"""
        message = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=self.system_prompt,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=temperature
        )
        return message.content[0].text

    def _clean_code(self, code: str) -> str:
        """清理生成的程式碼,移除 markdown 標記"""
        # 移除 ```python 和 ``` 標記
        code = code.strip()
        if code.startswith('```python'):
            code = code[len('```python'):].strip()
        elif code.startswith('```'):
            code = code[3:].strip()
        if code.endswith('```'):
            code = code[:-3].strip()

        return code

    def generate_from_template(self, template_name: str, **params) -> GeneratedScript:
        """
        從範本生成腳本

        Args:
            template_name: 範本名稱
            **params: 範本參數

        Returns:
            GeneratedScript 物件
        """
        from .templates import TemplateManager

        tm = TemplateManager()
        return tm.use_template(template_name, params)


if __name__ == "__main__":
    # 簡單測試
    gen = KiCADScriptGenerator(model="gpt-4")

    task = "將所有電阻排列成 5x5 的網格,起始位置 (50, 50) mm,間距 4mm"
    script = gen.generate(task)

    print("\n生成的腳本:")
    print("=" * 60)
    print(script.code)
    print("=" * 60)

    script.save("test_output.py")
