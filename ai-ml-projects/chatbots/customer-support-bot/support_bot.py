"""
Customer Support Bot - 客戶服務聊天機器人
提供自動化客戶服務，包含 FAQ、問題分類、情緒分析和升級處理
"""

import os
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import openai
from dotenv import load_dotenv

load_dotenv()


class CustomerSupportBot:
    """客戶服務聊天機器人"""

    def __init__(
        self,
        knowledge_base_path: str = "data/faq.json",
        escalation_threshold: float = 0.3,
        api_key: Optional[str] = None
    ):
        """
        初始化客服機器人

        Args:
            knowledge_base_path: FAQ 知識庫路徑
            escalation_threshold: 升級門檻（0-1，越低越容易升級）
            api_key: OpenAI API 金鑰
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key

        self.escalation_threshold = escalation_threshold
        self.knowledge_base = self._load_knowledge_base(knowledge_base_path)
        self.conversation_history = []

        # 問題分類
        self.categories = [
            "訂單查詢",
            "產品問題",
            "退款退貨",
            "技術支援",
            "帳戶問題",
            "其他"
        ]

    def _load_knowledge_base(self, path: str) -> Dict:
        """載入知識庫"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"警告: 找不到知識庫 {path}，使用空知識庫")
            return {"faqs": []}

    def handle_query(
        self,
        message: str,
        user_id: str,
        language: str = "zh-TW"
    ) -> Dict:
        """
        處理客戶查詢

        Args:
            message: 客戶訊息
            user_id: 使用者 ID
            language: 語言代碼

        Returns:
            包含回應、分類、信心度等資訊的字典
        """
        # 1. 分析情緒
        sentiment = self._analyze_sentiment(message)

        # 2. 分類問題
        category, category_confidence = self._classify_query(message)

        # 3. 搜尋 FAQ
        faq_answer, faq_confidence = self._search_faq(message)

        # 4. 決定是否需要升級
        needs_escalation = self._should_escalate(
            sentiment,
            category_confidence,
            faq_confidence
        )

        # 5. 生成回應
        if needs_escalation:
            answer = self._generate_escalation_message(sentiment, language)
            confidence = 0.0
        elif faq_answer and faq_confidence > 0.7:
            answer = faq_answer
            confidence = faq_confidence
        else:
            answer = self._generate_ai_response(message, category, language)
            confidence = 0.6

        # 6. 記錄對話
        self._log_conversation(user_id, message, answer, category)

        return {
            "answer": answer,
            "category": category,
            "confidence": confidence,
            "sentiment": sentiment,
            "needs_escalation": needs_escalation,
            "timestamp": datetime.now().isoformat()
        }

    def _analyze_sentiment(self, text: str) -> str:
        """分析情緒（正面/負面/中性）"""
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "分析以下客戶訊息的情緒，只回答：正面、負面或中性"},
                    {"role": "user", "content": text}
                ],
                max_tokens=10,
                temperature=0
            )
            sentiment = response.choices[0].message.content.strip()
            return sentiment if sentiment in ["正面", "負面", "中性"] else "中性"
        except Exception as e:
            print(f"情緒分析錯誤: {e}")
            return "中性"

    def _classify_query(self, text: str) -> Tuple[str, float]:
        """分類客戶問題"""
        try:
            categories_str = ", ".join(self.categories)
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"將客戶問題分類到以下類別之一：{categories_str}。"
                                   f"只回答類別名稱和信心度（0-1），格式：類別|信心度"
                    },
                    {"role": "user", "content": text}
                ],
                max_tokens=20,
                temperature=0
            )

            result = response.choices[0].message.content.strip()
            parts = result.split("|")
            category = parts[0] if parts[0] in self.categories else "其他"
            confidence = float(parts[1]) if len(parts) > 1 else 0.5

            return category, confidence
        except Exception as e:
            print(f"分類錯誤: {e}")
            return "其他", 0.3

    def _search_faq(self, query: str) -> Tuple[Optional[str], float]:
        """搜尋 FAQ 知識庫"""
        if not self.knowledge_base.get("faqs"):
            return None, 0.0

        # 簡單的關鍵字匹配（實際應用可使用向量搜尋）
        best_match = None
        best_score = 0.0

        query_lower = query.lower()

        for faq in self.knowledge_base["faqs"]:
            score = 0.0
            keywords = faq.get("keywords", [])

            # 計算關鍵字匹配分數
            for keyword in keywords:
                if keyword.lower() in query_lower:
                    score += 1

            # 問題相似度（簡化版）
            question = faq.get("question", "").lower()
            common_words = set(query_lower.split()) & set(question.split())
            score += len(common_words) * 0.5

            if score > best_score:
                best_score = score
                best_match = faq.get("answer")

        # 正規化分數
        confidence = min(best_score / 5.0, 1.0)

        return best_match, confidence

    def _should_escalate(
        self,
        sentiment: str,
        category_confidence: float,
        faq_confidence: float
    ) -> bool:
        """判斷是否需要升級到人工客服"""
        # 負面情緒 -> 升級
        if sentiment == "負面":
            return True

        # 低信心度 -> 升級
        if category_confidence < self.escalation_threshold:
            return True

        # FAQ 找不到答案 -> 升級
        if faq_confidence < self.escalation_threshold:
            return True

        return False

    def _generate_escalation_message(self, sentiment: str, language: str) -> str:
        """生成升級訊息"""
        if sentiment == "負面":
            return ("非常抱歉造成您的困擾。我已經為您轉接到人工客服，"
                   "我們的專員將立即為您服務。請稍候片刻。")
        else:
            return ("關於您的問題，我想為您提供最準確的協助。"
                   "讓我為您轉接到專業客服人員，他們將更好地協助您。")

    def _generate_ai_response(
        self,
        query: str,
        category: str,
        language: str
    ) -> str:
        """使用 AI 生成回應"""
        try:
            system_prompt = f"""你是一個專業且友善的客戶服務助手。
問題類別：{category}
請用{language}語言回答，保持禮貌、專業且有幫助。
如果不確定答案，建議客戶聯繫人工客服。"""

            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                max_tokens=200,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"AI 回應生成錯誤: {e}")
            return "抱歉，系統暫時無法處理您的請求。請稍後再試或聯繫人工客服。"

    def _log_conversation(
        self,
        user_id: str,
        query: str,
        response: str,
        category: str
    ):
        """記錄對話"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "query": query,
            "response": response,
            "category": category
        }
        self.conversation_history.append(log_entry)

    def get_conversation_history(self, user_id: Optional[str] = None) -> List[Dict]:
        """獲取對話歷史"""
        if user_id:
            return [
                entry for entry in self.conversation_history
                if entry["user_id"] == user_id
            ]
        return self.conversation_history

    def create_ticket(
        self,
        user_id: str,
        subject: str,
        description: str,
        priority: str = "medium"
    ) -> str:
        """創建客服工單"""
        ticket_id = f"TKT-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        ticket = {
            "ticket_id": ticket_id,
            "user_id": user_id,
            "subject": subject,
            "description": description,
            "priority": priority,
            "status": "open",
            "created_at": datetime.now().isoformat()
        }

        # 實際應用中應儲存到資料庫
        print(f"工單已創建: {ticket_id}")

        return ticket_id


def main():
    """命令列測試"""
    print("=== 客戶服務聊天機器人 ===")
    print("輸入 'quit' 結束對話\n")

    bot = CustomerSupportBot()
    user_id = "test_user"

    while True:
        try:
            query = input("客戶: ").strip()

            if query.lower() == 'quit':
                print("感謝使用，再見！")
                break

            if not query:
                continue

            # 處理查詢
            result = bot.handle_query(query, user_id)

            print(f"\n客服機器人: {result['answer']}")
            print(f"[類別: {result['category']} | "
                  f"信心度: {result['confidence']:.2f} | "
                  f"情緒: {result['sentiment']}]")

            if result['needs_escalation']:
                print("[已轉接人工客服]")

            print()

        except KeyboardInterrupt:
            print("\n\n感謝使用，再見！")
            break
        except Exception as e:
            print(f"錯誤: {e}\n")


if __name__ == "__main__":
    main()
