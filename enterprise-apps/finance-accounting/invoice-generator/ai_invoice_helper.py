"""
AI 發票助手 - 使用 AI 增強發票功能
"""

import re
from datetime import datetime, timedelta
from typing import List, Dict, Any


class AIInvoiceHelper:
    """AI 發票助手類 - 提供智能發票功能"""

    def __init__(self):
        self.common_items = self._load_common_items()
        self.pricing_history = {}

    def _load_common_items(self) -> Dict[str, float]:
        """載入常見項目和建議價格"""
        return {
            "網站開發": 50000,
            "APP開發": 80000,
            "系統維護（月）": 15000,
            "UI/UX設計": 30000,
            "資料庫設計": 25000,
            "技術諮詢（小時）": 2000,
            "軟體授權（年）": 10000,
            "雲端服務（月）": 5000,
            "廣告投放": 20000,
            "社群媒體管理（月）": 12000,
        }

    def suggest_item_price(self, description: str) -> float:
        """
        根據項目描述建議價格

        Args:
            description: 項目描述

        Returns:
            float: 建議價格
        """
        # 精確匹配
        if description in self.common_items:
            return self.common_items[description]

        # 模糊匹配
        description_lower = description.lower()
        for item, price in self.common_items.items():
            if item.lower() in description_lower or description_lower in item.lower():
                return price

        # 關鍵字匹配
        keywords_pricing = {
            "開發": 50000,
            "設計": 30000,
            "諮詢": 2000,
            "維護": 15000,
            "授權": 10000,
            "服務": 8000,
        }

        for keyword, price in keywords_pricing.items():
            if keyword in description:
                return price

        # 默認價格
        return 10000

    def smart_item_categorization(self, description: str) -> Dict[str, Any]:
        """
        智能項目分類和建議

        Args:
            description: 項目描述

        Returns:
            dict: 分類信息和建議
        """
        categories = {
            "軟體開發": ["開發", "程式", "coding", "programming", "app", "網站"],
            "設計服務": ["設計", "ui", "ux", "平面", "graphic"],
            "諮詢服務": ["諮詢", "顧問", "consulting"],
            "維護服務": ["維護", "保養", "maintenance"],
            "產品銷售": ["產品", "商品", "product"],
            "訂閱服務": ["訂閱", "subscription", "月費", "年費"],
        }

        description_lower = description.lower()
        matched_category = "其他服務"

        for category, keywords in categories.items():
            if any(keyword in description_lower for keyword in keywords):
                matched_category = category
                break

        suggested_price = self.suggest_item_price(description)

        # 建議稅率
        tax_rate = 5.0  # 默認 5%
        if matched_category == "產品銷售":
            tax_rate = 5.0
        elif matched_category == "訂閱服務":
            tax_rate = 0.0  # 某些訂閱服務可能免稅

        return {
            "category": matched_category,
            "suggested_price": suggested_price,
            "suggested_tax_rate": tax_rate,
            "description_enhancement": self._enhance_description(description, matched_category)
        }

    def _enhance_description(self, description: str, category: str) -> str:
        """增強描述文字"""
        enhancements = {
            "軟體開發": f"{description}（包含需求分析、開發、測試、部署）",
            "設計服務": f"{description}（包含初稿設計、修改、最終交付）",
            "諮詢服務": f"{description}（專業技術諮詢服務）",
            "維護服務": f"{description}（定期維護與技術支援）",
        }

        return enhancements.get(category, description)

    def detect_duplicate_items(self, items: List[Dict]) -> List[Dict]:
        """
        檢測重複項目

        Args:
            items: 項目列表

        Returns:
            list: 可能重複的項目
        """
        duplicates = []
        seen = {}

        for idx, item in enumerate(items):
            key = (item.get('description', '').lower(), item.get('unit_price', 0))

            if key in seen:
                duplicates.append({
                    "index": idx,
                    "item": item,
                    "duplicate_of": seen[key],
                    "warning": "此項目可能與其他項目重複"
                })
            else:
                seen[key] = idx

        return duplicates

    def suggest_payment_terms(self, total_amount: float, customer_history: Dict = None) -> str:
        """
        建議付款條件

        Args:
            total_amount: 總金額
            customer_history: 客戶歷史記錄（選填）

        Returns:
            str: 建議的付款條件
        """
        # 根據金額建議
        if total_amount < 10000:
            return "Net 15"
        elif total_amount < 50000:
            return "Net 30"
        else:
            return "Net 45 或 分期付款"

        # 如果有客戶歷史，可以根據信用評分調整
        if customer_history:
            credit_score = customer_history.get('credit_score', 50)
            if credit_score > 80:
                return "Net 45"
            elif credit_score < 30:
                return "即期 或 貨到付款"

    def generate_invoice_notes(self, invoice_data: Dict) -> str:
        """
        自動生成發票備註

        Args:
            invoice_data: 發票數據

        Returns:
            str: 生成的備註
        """
        notes_parts = []

        # 付款說明
        payment_terms = invoice_data.get('payment_terms', 'Net 30')
        notes_parts.append(f"付款條件：{payment_terms}")

        # 付款方式
        notes_parts.append("付款方式：銀行轉帳、信用卡、支票")

        # 到期日提醒
        due_date = invoice_data.get('due_date')
        if due_date:
            notes_parts.append(f"請於 {due_date} 前完成付款")

        # 聯絡資訊
        notes_parts.append("如有任何問題，請隨時與我們聯繫")

        return "\n".join(notes_parts)

    def validate_customer_email(self, email: str) -> tuple[bool, str]:
        """
        驗證客戶電子郵件格式

        Args:
            email: 電子郵件地址

        Returns:
            tuple: (是否有效, 錯誤訊息)
        """
        if not email:
            return False, "電子郵件不能為空"

        # 基本格式檢查
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "電子郵件格式不正確"

        # 檢查常見錯誤
        common_mistakes = ['@gamil.com', '@yahooo.com', '@hotmial.com']
        for mistake in common_mistakes:
            if mistake in email.lower():
                return False, f"電子郵件可能有拼寫錯誤：{mistake}"

        return True, ""

    def suggest_discount(self, items: List[Dict], customer_history: Dict = None) -> Dict:
        """
        建議折扣

        Args:
            items: 項目列表
            customer_history: 客戶歷史記錄

        Returns:
            dict: 折扣建議
        """
        total = sum(item['quantity'] * item['unit_price'] for item in items)

        discount_suggestions = []

        # 大額折扣
        if total > 100000:
            discount_suggestions.append({
                "type": "大額訂單折扣",
                "percentage": 10,
                "reason": "訂單金額超過 $100,000"
            })
        elif total > 50000:
            discount_suggestions.append({
                "type": "大額訂單折扣",
                "percentage": 5,
                "reason": "訂單金額超過 $50,000"
            })

        # 老客戶折扣
        if customer_history:
            order_count = customer_history.get('order_count', 0)
            if order_count > 10:
                discount_suggestions.append({
                    "type": "忠誠客戶折扣",
                    "percentage": 5,
                    "reason": f"第 {order_count} 次訂單"
                })

        # 數量折扣
        for item in items:
            if item['quantity'] >= 10:
                discount_suggestions.append({
                    "type": "數量折扣",
                    "percentage": 3,
                    "reason": f"{item['description']} 數量達 {item['quantity']}"
                })
                break

        return {
            "has_discount": len(discount_suggestions) > 0,
            "suggestions": discount_suggestions,
            "max_discount": max([s['percentage'] for s in discount_suggestions]) if discount_suggestions else 0
        }

    def predict_payment_date(self, invoice_date: str, payment_terms: str, customer_history: Dict = None) -> Dict:
        """
        預測付款日期

        Args:
            invoice_date: 發票日期
            payment_terms: 付款條件
            customer_history: 客戶歷史記錄

        Returns:
            dict: 預測資訊
        """
        inv_date = datetime.fromisoformat(invoice_date)

        # 解析付款條件
        days_map = {
            "即期": 0,
            "Net 7": 7,
            "Net 15": 15,
            "Net 30": 30,
            "Net 45": 45,
            "Net 60": 60,
        }

        days = days_map.get(payment_terms, 30)
        expected_date = inv_date + timedelta(days=days)

        # 根據客戶歷史調整
        if customer_history:
            avg_delay = customer_history.get('avg_payment_delay_days', 0)
            predicted_date = expected_date + timedelta(days=avg_delay)

            return {
                "expected_date": expected_date.isoformat()[:10],
                "predicted_date": predicted_date.isoformat()[:10],
                "confidence": "high" if avg_delay < 5 else "medium",
                "note": f"客戶平均延遲 {avg_delay} 天付款" if avg_delay > 0 else "客戶付款記錄良好"
            }

        return {
            "expected_date": expected_date.isoformat()[:10],
            "predicted_date": expected_date.isoformat()[:10],
            "confidence": "medium",
            "note": "無客戶歷史記錄，使用標準預測"
        }

    def smart_currency_suggestion(self, customer_address: str) -> str:
        """
        根據客戶地址建議幣別

        Args:
            customer_address: 客戶地址

        Returns:
            str: 建議的幣別
        """
        currency_map = {
            "台灣": "TWD",
            "台北": "TWD",
            "taiwan": "TWD",
            "美國": "USD",
            "usa": "USD",
            "america": "USD",
            "日本": "JPY",
            "japan": "JPY",
            "中國": "CNY",
            "china": "CNY",
            "歐洲": "EUR",
            "europe": "EUR",
        }

        address_lower = customer_address.lower()

        for location, currency in currency_map.items():
            if location in address_lower:
                return currency

        # 默認
        return "TWD"

    def analyze_invoice_health(self, invoice_data: Dict) -> Dict:
        """
        分析發票健康度

        Args:
            invoice_data: 發票數據

        Returns:
            dict: 健康度分析報告
        """
        issues = []
        warnings = []
        suggestions = []

        # 檢查必填欄位
        if not invoice_data.get('customer', {}).get('email'):
            issues.append("缺少客戶電子郵件")

        if not invoice_data.get('customer', {}).get('address'):
            warnings.append("缺少客戶地址")

        # 檢查項目
        items = invoice_data.get('items', [])
        if len(items) == 0:
            issues.append("沒有發票項目")

        # 檢查金額合理性
        total = sum(item['quantity'] * item['unit_price'] for item in items)
        if total == 0:
            issues.append("發票總額為 0")
        elif total > 1000000:
            warnings.append("發票金額超過 $1,000,000，請確認")

        # 檢查重複項目
        duplicates = self.detect_duplicate_items(items)
        if duplicates:
            warnings.append(f"發現 {len(duplicates)} 個可能重複的項目")

        # 建議
        if not invoice_data.get('notes'):
            suggestions.append("建議添加備註說明付款條件和方式")

        # 計算健康分數
        health_score = 100
        health_score -= len(issues) * 20
        health_score -= len(warnings) * 10
        health_score = max(0, health_score)

        return {
            "health_score": health_score,
            "status": "healthy" if health_score >= 80 else "warning" if health_score >= 60 else "critical",
            "issues": issues,
            "warnings": warnings,
            "suggestions": suggestions
        }
