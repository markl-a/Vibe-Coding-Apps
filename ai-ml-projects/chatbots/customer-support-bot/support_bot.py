"""
Customer Support Bot - 客戶服務聊天機器人
提供自動化客戶服務，包含 FAQ、問題分類、情緒分析和升級處理
增強版：支援向量搜索、AI工具調用、多語言和進階對話管理
"""

import os
import json
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
import openai
from dotenv import load_dotenv
import numpy as np

# 可選的向量搜索支持
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("提示：安裝 faiss-cpu 以獲得更好的FAQ搜索性能")

load_dotenv()


class CustomerSupportBot:
    """客戶服務聊天機器人"""

    def __init__(
        self,
        knowledge_base_path: str = "data/faq.json",
        escalation_threshold: float = 0.3,
        api_key: Optional[str] = None,
        use_vector_search: bool = True,
        enable_function_calling: bool = True
    ):
        """
        初始化客服機器人

        Args:
            knowledge_base_path: FAQ 知識庫路徑
            escalation_threshold: 升級門檻（0-1，越低越容易升級）
            api_key: OpenAI API 金鑰
            use_vector_search: 是否使用向量搜索
            enable_function_calling: 是否啟用AI工具調用
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = openai.OpenAI(api_key=self.api_key)

        self.escalation_threshold = escalation_threshold
        self.knowledge_base = self._load_knowledge_base(knowledge_base_path)
        self.conversation_history = {}  # 改為字典，按user_id存儲
        self.use_vector_search = use_vector_search and FAISS_AVAILABLE
        self.enable_function_calling = enable_function_calling

        # 問題分類
        self.categories = [
            "訂單查詢",
            "產品問題",
            "退款退貨",
            "技術支援",
            "帳戶問題",
            "其他"
        ]

        # 向量搜索初始化
        self.faq_embeddings = None
        self.faq_index = None
        if self.use_vector_search and self.knowledge_base.get("faqs"):
            self._build_vector_index()

        # AI工具定義
        self.tools = self._define_tools() if enable_function_calling else None

    def _load_knowledge_base(self, path: str) -> Dict:
        """載入知識庫"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"警告: 找不到知識庫 {path}，使用空知識庫")
            return {"faqs": []}

    def _build_vector_index(self):
        """建立FAQ向量索引"""
        if not FAISS_AVAILABLE or not self.knowledge_base.get("faqs"):
            return

        print("建立向量索引...")
        faqs = self.knowledge_base["faqs"]
        embeddings = []

        for faq in faqs:
            # 組合問題和關鍵字進行嵌入
            text = f"{faq.get('question', '')} {' '.join(faq.get('keywords', []))}"
            embedding = self._get_embedding(text)
            embeddings.append(embedding)

        self.faq_embeddings = np.array(embeddings).astype('float32')

        # 建立FAISS索引
        dimension = self.faq_embeddings.shape[1]
        self.faq_index = faiss.IndexFlatL2(dimension)
        self.faq_index.add(self.faq_embeddings)
        print(f"向量索引建立完成：{len(faqs)} 個FAQ")

    def _get_embedding(self, text: str) -> np.ndarray:
        """取得文本嵌入向量"""
        try:
            response = self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            return np.array(response.data[0].embedding, dtype='float32')
        except Exception as e:
            print(f"嵌入生成錯誤: {e}")
            return np.zeros(1536, dtype='float32')

    def _define_tools(self) -> List[Dict]:
        """定義AI可調用的工具"""
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_order_status",
                    "description": "查詢訂單狀態和物流資訊",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "訂單編號"
                            }
                        },
                        "required": ["order_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "check_product_availability",
                    "description": "檢查產品庫存和可用性",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "product_id": {
                                "type": "string",
                                "description": "產品ID或名稱"
                            }
                        },
                        "required": ["product_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "initiate_refund",
                    "description": "發起退款流程",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "order_id": {
                                "type": "string",
                                "description": "訂單編號"
                            },
                            "reason": {
                                "type": "string",
                                "description": "退款原因"
                            }
                        },
                        "required": ["order_id", "reason"]
                    }
                }
            }
        ]

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
            answer = self._generate_ai_response(message, category, language, user_id)
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
        """搜尋 FAQ 知識庫（支援向量搜索）"""
        if not self.knowledge_base.get("faqs"):
            return None, 0.0

        # 使用向量搜索
        if self.use_vector_search and self.faq_index is not None:
            return self._vector_search_faq(query)

        # 降級到關鍵字匹配
        return self._keyword_search_faq(query)

    def _vector_search_faq(self, query: str) -> Tuple[Optional[str], float]:
        """使用向量搜索FAQ"""
        try:
            # 生成查詢嵌入
            query_embedding = self._get_embedding(query)
            query_vec = query_embedding.reshape(1, -1)

            # 搜索最相似的FAQ
            distances, indices = self.faq_index.search(query_vec, k=1)

            if len(indices[0]) > 0:
                idx = indices[0][0]
                distance = distances[0][0]

                # 轉換距離為相似度分數（0-1）
                # L2距離越小越相似
                confidence = 1 / (1 + distance)

                faq = self.knowledge_base["faqs"][idx]
                return faq.get("answer"), confidence

        except Exception as e:
            print(f"向量搜索錯誤: {e}")
            # 降級到關鍵字搜索
            return self._keyword_search_faq(query)

        return None, 0.0

    def _keyword_search_faq(self, query: str) -> Tuple[Optional[str], float]:
        """使用關鍵字匹配搜索FAQ"""
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
        language: str,
        user_id: str = None
    ) -> str:
        """使用 AI 生成回應（支援工具調用）"""
        try:
            system_prompt = f"""你是一個專業且友善的客戶服務助手。
問題類別：{category}
請用{language}語言回答，保持禮貌、專業且有幫助。
如果不確定答案，建議客戶聯繫人工客服。
你可以使用提供的工具來查詢訂單狀態、檢查庫存或處理退款。"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]

            # 添加對話歷史
            if user_id and user_id in self.conversation_history:
                history = self.conversation_history[user_id][-6:]  # 最近3輪對話
                messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": query}]

            # 決定是否使用工具調用
            if self.enable_function_calling and self.tools:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    tools=self.tools,
                    tool_choice="auto",
                    max_tokens=300,
                    temperature=0.7
                )
            else:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=200,
                    temperature=0.7
                )

            # 檢查是否有工具調用
            message = response.choices[0].message

            if message.tool_calls:
                # 執行工具並獲取結果
                tool_results = []
                for tool_call in message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    # 執行工具
                    result = self._execute_tool(function_name, function_args)
                    tool_results.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": json.dumps(result, ensure_ascii=False)
                    })

                # 將工具結果加入對話
                messages.append(message.model_dump())
                messages.extend(tool_results)

                # 獲取最終回應
                final_response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=300,
                    temperature=0.7
                )

                return final_response.choices[0].message.content.strip()

            return message.content.strip()

        except Exception as e:
            print(f"AI 回應生成錯誤: {e}")
            return "抱歉，系統暫時無法處理您的請求。請稍後再試或聯繫人工客服。"

    def _execute_tool(self, function_name: str, arguments: Dict) -> Dict:
        """執行AI工具"""
        if function_name == "search_order_status":
            return self._search_order_status(arguments.get("order_id"))
        elif function_name == "check_product_availability":
            return self._check_product_availability(arguments.get("product_id"))
        elif function_name == "initiate_refund":
            return self._initiate_refund(
                arguments.get("order_id"),
                arguments.get("reason")
            )
        else:
            return {"error": "未知的工具"}

    def _search_order_status(self, order_id: str) -> Dict:
        """查詢訂單狀態（模擬實現）"""
        # 實際應用中應連接到真實的訂單系統
        return {
            "order_id": order_id,
            "status": "已發貨",
            "tracking_number": "1234567890",
            "estimated_delivery": "2024-01-15",
            "current_location": "運送中"
        }

    def _check_product_availability(self, product_id: str) -> Dict:
        """檢查產品庫存（模擬實現）"""
        # 實際應用中應連接到庫存系統
        return {
            "product_id": product_id,
            "available": True,
            "stock_quantity": 15,
            "price": "NT$1,299",
            "delivery_time": "1-3工作天"
        }

    def _initiate_refund(self, order_id: str, reason: str) -> Dict:
        """發起退款（模擬實現）"""
        # 實際應用中應連接到退款系統
        return {
            "order_id": order_id,
            "refund_id": f"REF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "已發起",
            "estimated_refund_date": "7-14工作天",
            "message": "退款申請已提交，我們會盡快處理"
        }

    def _log_conversation(
        self,
        user_id: str,
        query: str,
        response: str,
        category: str
    ):
        """記錄對話（支援對話歷史）"""
        # 初始化用戶對話歷史
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []

        # 添加用戶訊息和助手回應
        self.conversation_history[user_id].append({
            "role": "user",
            "content": query
        })
        self.conversation_history[user_id].append({
            "role": "assistant",
            "content": response
        })

        # 限制歷史長度（保留最近20條訊息）
        if len(self.conversation_history[user_id]) > 20:
            self.conversation_history[user_id] = self.conversation_history[user_id][-20:]

    def get_conversation_history(self, user_id: Optional[str] = None) -> List[Dict]:
        """獲取對話歷史"""
        if user_id:
            return self.conversation_history.get(user_id, [])
        return self.conversation_history

    def clear_conversation_history(self, user_id: str):
        """清除特定用戶的對話歷史"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

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
