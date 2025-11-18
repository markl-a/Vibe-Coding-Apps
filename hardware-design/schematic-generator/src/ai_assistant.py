"""
AI 輔助設計模組
使用 LLM 提供智能設計建議和參數優化
"""

import os
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class DesignSuggestion:
    """設計建議"""
    category: str
    suggestion: str
    reasoning: str
    priority: str  # 'high', 'medium', 'low'


class AICircuitAssistant:
    """AI 電路設計助手"""

    def __init__(self, model: str = "gpt-4"):
        """
        初始化 AI 助手

        Args:
            model: 使用的模型 (gpt-4, claude-3-5-sonnet-20241022, etc.)
        """
        self.model = model
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """初始化 LLM 客戶端"""
        try:
            if self.model.startswith("gpt"):
                from openai import OpenAI
                api_key = os.getenv("OPENAI_API_KEY")
                if api_key:
                    self.client = OpenAI(api_key=api_key)
                    print(f"✓ OpenAI 客戶端初始化成功 (模型: {self.model})")
                else:
                    print("⚠ OPENAI_API_KEY 未設置，AI 功能將受限")

            elif self.model.startswith("claude"):
                from anthropic import Anthropic
                api_key = os.getenv("ANTHROPIC_API_KEY")
                if api_key:
                    self.client = Anthropic(api_key=api_key)
                    print(f"✓ Anthropic 客戶端初始化成功 (模型: {self.model})")
                else:
                    print("⚠ ANTHROPIC_API_KEY 未設置，AI 功能將受限")

        except ImportError as e:
            print(f"⚠ 無法導入 LLM 庫: {e}")
            print("提示: pip install openai anthropic")

    def analyze_design(self, circuit_type: str, parameters: Dict) -> List[DesignSuggestion]:
        """
        分析電路設計並提供建議

        Args:
            circuit_type: 電路類型
            parameters: 電路參數

        Returns:
            設計建議列表
        """
        if not self.client:
            return [DesignSuggestion(
                category="system",
                suggestion="AI 功能未啟用",
                reasoning="請設置 API 金鑰以啟用 AI 輔助功能",
                priority="low"
            )]

        prompt = self._build_analysis_prompt(circuit_type, parameters)

        try:
            response = self._call_llm(prompt)
            suggestions = self._parse_suggestions(response)
            return suggestions

        except Exception as e:
            print(f"AI 分析錯誤: {e}")
            return []

    def optimize_parameters(self, circuit_type: str,
                          current_params: Dict,
                          constraints: Optional[Dict] = None) -> Dict:
        """
        優化電路參數

        Args:
            circuit_type: 電路類型
            current_params: 當前參數
            constraints: 約束條件

        Returns:
            優化後的參數
        """
        if not self.client:
            return current_params

        prompt = self._build_optimization_prompt(circuit_type, current_params, constraints)

        try:
            response = self._call_llm(prompt)
            optimized = self._parse_parameters(response)
            return optimized if optimized else current_params

        except Exception as e:
            print(f"參數優化錯誤: {e}")
            return current_params

    def suggest_components(self, circuit_type: str, specifications: Dict) -> List[Dict]:
        """
        建議合適的元件

        Args:
            circuit_type: 電路類型
            specifications: 規格要求

        Returns:
            元件建議列表
        """
        if not self.client:
            return []

        prompt = f"""
作為電子電路設計專家，請根據以下規格建議合適的元件：

電路類型: {circuit_type}
規格要求:
{json.dumps(specifications, indent=2, ensure_ascii=False)}

請以 JSON 格式返回元件建議，格式如下：
{{
    "components": [
        {{
            "type": "元件類型",
            "part_number": "料號",
            "manufacturer": "製造商",
            "key_specs": {{}},
            "reason": "選擇理由",
            "alternatives": ["替代料號1", "替代料號2"]
        }}
    ]
}}
"""

        try:
            response = self._call_llm(prompt)
            components = self._parse_components(response)
            return components

        except Exception as e:
            print(f"元件建議錯誤: {e}")
            return []

    def explain_design(self, circuit_type: str, parameters: Dict) -> str:
        """
        解釋電路設計原理

        Args:
            circuit_type: 電路類型
            parameters: 電路參數

        Returns:
            設計說明
        """
        if not self.client:
            return "AI 功能未啟用"

        prompt = f"""
請用淺顯易懂的方式解釋以下電路的工作原理：

電路類型: {circuit_type}
參數:
{json.dumps(parameters, indent=2, ensure_ascii=False)}

請包含：
1. 電路基本原理
2. 關鍵元件的作用
3. 設計要點
4. 注意事項
"""

        try:
            response = self._call_llm(prompt)
            return response

        except Exception as e:
            return f"解釋生成失敗: {e}"

    def troubleshoot(self, circuit_type: str,
                    parameters: Dict,
                    issue_description: str) -> List[Dict]:
        """
        故障診斷和解決建議

        Args:
            circuit_type: 電路類型
            parameters: 電路參數
            issue_description: 問題描述

        Returns:
            診斷結果和解決方案
        """
        if not self.client:
            return []

        prompt = f"""
作為電路故障診斷專家，請分析以下問題：

電路類型: {circuit_type}
電路參數:
{json.dumps(parameters, indent=2, ensure_ascii=False)}

問題描述: {issue_description}

請提供：
1. 可能的原因分析
2. 診斷步驟
3. 解決方案
4. 預防措施

以 JSON 格式返回：
{{
    "possible_causes": ["原因1", "原因2"],
    "diagnostic_steps": ["步驟1", "步驟2"],
    "solutions": [
        {{
            "solution": "解決方案",
            "difficulty": "easy/medium/hard",
            "effectiveness": "high/medium/low"
        }}
    ],
    "prevention": ["預防措施1", "預防措施2"]
}}
"""

        try:
            response = self._call_llm(prompt)
            return self._parse_troubleshooting(response)

        except Exception as e:
            print(f"故障診斷錯誤: {e}")
            return []

    def _build_analysis_prompt(self, circuit_type: str, parameters: Dict) -> str:
        """構建分析提示"""
        return f"""
作為專業的電子電路設計師，請分析以下電路設計：

電路類型: {circuit_type}
設計參數:
{json.dumps(parameters, indent=2, ensure_ascii=False)}

請提供設計建議，包含：
1. 性能評估
2. 改進建議
3. 潛在問題
4. 最佳實踐

以 JSON 格式返回：
{{
    "suggestions": [
        {{
            "category": "performance/reliability/cost/safety",
            "suggestion": "建議內容",
            "reasoning": "理由",
            "priority": "high/medium/low"
        }}
    ]
}}
"""

    def _build_optimization_prompt(self, circuit_type: str,
                                  params: Dict,
                                  constraints: Optional[Dict]) -> str:
        """構建優化提示"""
        constraints_str = json.dumps(constraints, indent=2, ensure_ascii=False) if constraints else "無特殊約束"

        return f"""
請優化以下電路設計參數：

電路類型: {circuit_type}
當前參數:
{json.dumps(params, indent=2, ensure_ascii=False)}

約束條件:
{constraints_str}

請返回優化後的參數（JSON 格式），並說明優化理由。
"""

    def _call_llm(self, prompt: str) -> str:
        """調用 LLM"""
        if not self.client:
            return ""

        try:
            if self.model.startswith("gpt"):
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "你是一位專業的電子電路設計專家，精通模擬和數位電路設計。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                return response.choices[0].message.content

            elif self.model.startswith("claude"):
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=2048,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    system="你是一位專業的電子電路設計專家，精通模擬和數位電路設計。"
                )
                return response.content[0].text

        except Exception as e:
            raise Exception(f"LLM 調用失敗: {e}")

    def _parse_suggestions(self, response: str) -> List[DesignSuggestion]:
        """解析建議"""
        try:
            # 提取 JSON
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                data = json.loads(json_str)

                suggestions = []
                for item in data.get('suggestions', []):
                    suggestions.append(DesignSuggestion(
                        category=item.get('category', 'general'),
                        suggestion=item.get('suggestion', ''),
                        reasoning=item.get('reasoning', ''),
                        priority=item.get('priority', 'medium')
                    ))
                return suggestions

        except Exception as e:
            print(f"建議解析錯誤: {e}")

        return []

    def _parse_parameters(self, response: str) -> Optional[Dict]:
        """解析參數"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return json.loads(json_str)

        except Exception as e:
            print(f"參數解析錯誤: {e}")

        return None

    def _parse_components(self, response: str) -> List[Dict]:
        """解析元件建議"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                data = json.loads(json_str)
                return data.get('components', [])

        except Exception as e:
            print(f"元件解析錯誤: {e}")

        return []

    def _parse_troubleshooting(self, response: str) -> List[Dict]:
        """解析故障診斷"""
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response[start:end]
                return [json.loads(json_str)]

        except Exception as e:
            print(f"診斷解析錯誤: {e}")

        return []


class ParameterOptimizer:
    """參數優化器 - 使用 AI 優化電路參數"""

    def __init__(self, ai_assistant: Optional[AICircuitAssistant] = None):
        """
        初始化優化器

        Args:
            ai_assistant: AI 助手實例
        """
        self.ai = ai_assistant or AICircuitAssistant()

    def optimize_for_efficiency(self, circuit_type: str, parameters: Dict) -> Dict:
        """優化效率"""
        constraints = {"optimization_goal": "efficiency", "priority": "power_consumption"}
        return self.ai.optimize_parameters(circuit_type, parameters, constraints)

    def optimize_for_cost(self, circuit_type: str, parameters: Dict) -> Dict:
        """優化成本"""
        constraints = {"optimization_goal": "cost", "priority": "component_cost"}
        return self.ai.optimize_parameters(circuit_type, parameters, constraints)

    def optimize_for_performance(self, circuit_type: str, parameters: Dict) -> Dict:
        """優化性能"""
        constraints = {"optimization_goal": "performance", "priority": "speed_accuracy"}
        return self.ai.optimize_parameters(circuit_type, parameters, constraints)
