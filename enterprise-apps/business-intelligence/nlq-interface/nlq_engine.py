"""
NLQ 引擎核心模块
将自然语言问题转换为 SQL 查询并执行
"""

import re
import sqlite3
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import hashlib
import json


@dataclass
class QueryResult:
    """查询结果"""
    question: str
    sql: str
    data: pd.DataFrame
    answer: str
    visualization: Dict[str, Any]
    insights: List[str]
    execution_time: float
    metadata: Dict[str, Any]


class SchemaManager:
    """数据库 Schema 管理器"""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.schema = self._load_schema()
        self.term_mappings = self._default_term_mappings()

    def _load_schema(self) -> Dict[str, Any]:
        """加载数据库 Schema"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        schema = {}

        # 获取所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        for (table_name,) in tables:
            # 获取表的列信息
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()

            schema[table_name] = {
                'columns': {},
                'primary_key': None,
                'sample_data': None
            }

            for col in columns:
                col_name = col[1]
                col_type = col[2]
                is_pk = col[5]

                schema[table_name]['columns'][col_name] = {
                    'type': col_type,
                    'nullable': not col[3]
                }

                if is_pk:
                    schema[table_name]['primary_key'] = col_name

            # 获取样本数据（用于理解数据内容）
            try:
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                schema[table_name]['sample_data'] = cursor.fetchall()
            except:
                pass

        conn.close()
        return schema

    def _default_term_mappings(self) -> Dict[str, str]:
        """默认的术语映射"""
        return {
            # 聚合函数
            '总': 'SUM',
            '平均': 'AVG',
            '最大': 'MAX',
            '最小': 'MIN',
            '数量': 'COUNT',
            '计数': 'COUNT',

            # 时间词
            '今天': 'CURRENT_DATE',
            '昨天': "DATE('now', '-1 day')",
            '本周': "DATE('now', '-7 days')",
            '上周': "DATE('now', '-14 days')",
            '本月': "DATE('now', 'start of month')",
            '上月': "DATE('now', '-1 month')",
            '今年': "DATE('now', 'start of year')",
            '去年': "DATE('now', '-1 year')",

            # 排序
            '最高': 'DESC',
            '最低': 'ASC',
            '最多': 'DESC',
            '最少': 'ASC',

            # 业务指标
            '销售额': 'amount',
            '收入': 'revenue',
            '订单': 'orders',
            '客户': 'customers',
            '用户': 'users',
        }

    def get_table_info(self, table_name: str) -> Optional[Dict]:
        """获取表信息"""
        return self.schema.get(table_name)

    def find_table(self, keyword: str) -> Optional[str]:
        """根据关键词查找表名"""
        keyword = keyword.lower()

        # 精确匹配
        if keyword in self.schema:
            return keyword

        # 模糊匹配
        for table in self.schema:
            if keyword in table.lower() or table.lower() in keyword:
                return table

        # 通过术语映射
        if keyword in self.term_mappings:
            mapped = self.term_mappings[keyword]
            for table in self.schema:
                if mapped.lower() in table.lower():
                    return table

        return None

    def find_column(self, table: str, keyword: str) -> Optional[str]:
        """在表中查找列"""
        if table not in self.schema:
            return None

        keyword = keyword.lower()
        columns = self.schema[table]['columns']

        # 精确匹配
        if keyword in columns:
            return keyword

        # 模糊匹配
        for col in columns:
            if keyword in col.lower() or col.lower() in keyword:
                return col

        # 术语映射
        if keyword in self.term_mappings:
            mapped = self.term_mappings[keyword]
            for col in columns:
                if mapped.lower() == col.lower():
                    return col

        return None


class QueryParser:
    """查询解析器 - 将自然语言转换为 SQL"""

    def __init__(self, schema_manager: SchemaManager):
        self.schema = schema_manager
        self.patterns = self._build_patterns()

    def _build_patterns(self) -> List[Dict]:
        """构建查询模式"""
        return [
            # 模式 1: 总计/求和
            {
                'pattern': r'(总|全部|所有)(.+?)(?:是多少|有多少)',
                'handler': self._handle_sum
            },
            # 模式 2: 平均值
            {
                'pattern': r'(平均|平均值)(.+?)(?:是多少)?',
                'handler': self._handle_average
            },
            # 模式 3: 计数
            {
                'pattern': r'(有多少|数量|总共)(.+)',
                'handler': self._handle_count
            },
            # 模式 4: 排名/Top N
            {
                'pattern': r'(前|后|top|最.*)(\d+)(.+)',
                'handler': self._handle_topn
            },
            # 模式 5: 分组聚合
            {
                'pattern': r'(每个|各|按)(.+?)(的)(.+)',
                'handler': self._handle_group_by
            },
            # 模式 6: 过滤查询
            {
                'pattern': r'(.+?)(大于|小于|等于|超过|低于)(.+)',
                'handler': self._handle_filter
            },
            # 模式 7: 时间范围
            {
                'pattern': r'(今天|昨天|本周|上周|本月|上月|今年|去年)(.+)',
                'handler': self._handle_time_range
            },
            # 模式 8: 显示所有
            {
                'pattern': r'(显示|查看|列出)(所有|全部)?(.+)',
                'handler': self._handle_select_all
            },
        ]

    def parse(self, question: str) -> Optional[str]:
        """解析问题并生成 SQL"""
        question = question.strip()

        # 尝试每个模式
        for pattern_dict in self.patterns:
            pattern = pattern_dict['pattern']
            handler = pattern_dict['handler']

            match = re.search(pattern, question)
            if match:
                try:
                    sql = handler(question, match)
                    if sql:
                        return sql
                except:
                    continue

        # 如果没有匹配的模式，使用通用处理
        return self._handle_generic(question)

    def _handle_sum(self, question: str, match: re.Match) -> Optional[str]:
        """处理求和查询"""
        metric = match.group(2).strip()

        # 查找表和列
        table = self._find_relevant_table(question)
        if not table:
            return None

        column = self.schema.find_column(table, metric)
        if not column:
            # 尝试使用第一个数值列
            column = self._find_numeric_column(table)

        if not column:
            return None

        return f"SELECT SUM({column}) as total FROM {table}"

    def _handle_average(self, question: str, match: re.Match) -> Optional[str]:
        """处理平均值查询"""
        metric = match.group(2).strip()

        table = self._find_relevant_table(question)
        if not table:
            return None

        column = self.schema.find_column(table, metric)
        if not column:
            column = self._find_numeric_column(table)

        if not column:
            return None

        return f"SELECT AVG({column}) as average FROM {table}"

    def _handle_count(self, question: str, match: re.Match) -> Optional[str]:
        """处理计数查询"""
        entity = match.group(2).strip()

        table = self.schema.find_table(entity)
        if not table:
            table = self._find_relevant_table(question)

        if not table:
            return None

        return f"SELECT COUNT(*) as count FROM {table}"

    def _handle_topn(self, question: str, match: re.Match) -> Optional[str]:
        """处理 Top N 查询"""
        direction = match.group(1).strip()
        n = match.group(2).strip()
        metric = match.group(3).strip()

        table = self._find_relevant_table(question)
        if not table:
            return None

        # 确定排序方向
        order = 'DESC' if '前' in direction or 'top' in direction.lower() or '最高' in direction else 'ASC'

        # 查找分组列和聚合列
        group_col = self._find_dimension_column(table)
        agg_col = self._find_numeric_column(table)

        if not group_col or not agg_col:
            return None

        sql = f"""
        SELECT {group_col}, SUM({agg_col}) as total
        FROM {table}
        GROUP BY {group_col}
        ORDER BY total {order}
        LIMIT {n}
        """

        return sql.strip()

    def _handle_group_by(self, question: str, match: re.Match) -> Optional[str]:
        """处理分组查询"""
        dimension = match.group(2).strip()
        metric = match.group(4).strip()

        table = self._find_relevant_table(question)
        if not table:
            return None

        group_col = self.schema.find_column(table, dimension)
        if not group_col:
            group_col = self._find_dimension_column(table)

        agg_col = self.schema.find_column(table, metric)
        if not agg_col:
            agg_col = self._find_numeric_column(table)

        if not group_col or not agg_col:
            return None

        # 确定聚合函数
        agg_func = 'SUM'
        if '平均' in question or 'average' in question.lower():
            agg_func = 'AVG'
        elif '数量' in question or 'count' in question.lower():
            agg_func = 'COUNT'

        sql = f"""
        SELECT {group_col}, {agg_func}({agg_col}) as value
        FROM {table}
        GROUP BY {group_col}
        ORDER BY value DESC
        """

        return sql.strip()

    def _handle_filter(self, question: str, match: re.Match) -> Optional[str]:
        """处理过滤查询"""
        # 简化实现
        table = self._find_relevant_table(question)
        if not table:
            return None

        return f"SELECT * FROM {table} LIMIT 100"

    def _handle_time_range(self, question: str, match: re.Match) -> Optional[str]:
        """处理时间范围查询"""
        time_word = match.group(1).strip()
        rest = match.group(2).strip()

        table = self._find_relevant_table(question)
        if not table:
            return None

        date_col = self._find_date_column(table)
        if not date_col:
            return None

        # 获取时间条件
        time_cond = self.schema.term_mappings.get(time_word, 'CURRENT_DATE')

        # 确定聚合
        agg_col = self._find_numeric_column(table)
        if agg_col:
            sql = f"""
            SELECT SUM({agg_col}) as total
            FROM {table}
            WHERE {date_col} >= {time_cond}
            """
        else:
            sql = f"""
            SELECT COUNT(*) as count
            FROM {table}
            WHERE {date_col} >= {time_cond}
            """

        return sql.strip()

    def _handle_select_all(self, question: str, match: re.Match) -> Optional[str]:
        """处理显示所有"""
        entity = match.group(3).strip()

        table = self.schema.find_table(entity)
        if not table:
            table = self._find_relevant_table(question)

        if not table:
            return None

        return f"SELECT * FROM {table} LIMIT 100"

    def _handle_generic(self, question: str) -> Optional[str]:
        """通用处理"""
        table = self._find_relevant_table(question)
        if not table:
            return None

        # 查找数值列
        numeric_col = self._find_numeric_column(table)

        if numeric_col:
            return f"SELECT SUM({numeric_col}) as total FROM {table}"
        else:
            return f"SELECT COUNT(*) as count FROM {table}"

    def _find_relevant_table(self, question: str) -> Optional[str]:
        """查找相关的表"""
        question_lower = question.lower()

        # 遍历所有表名
        for table in self.schema.schema.keys():
            if table.lower() in question_lower:
                return table

        # 通过关键词查找
        keywords = ['销售', 'sales', '订单', 'orders', '客户', 'customers', '产品', 'products']
        for keyword in keywords:
            if keyword in question_lower:
                table = self.schema.find_table(keyword)
                if table:
                    return table

        # 返回第一个表作为默认
        if self.schema.schema:
            return list(self.schema.schema.keys())[0]

        return None

    def _find_numeric_column(self, table: str) -> Optional[str]:
        """查找数值列"""
        if table not in self.schema.schema:
            return None

        for col, info in self.schema.schema[table]['columns'].items():
            if info['type'] in ['INTEGER', 'REAL', 'NUMERIC']:
                # 优先选择 amount, revenue, price 等
                if any(keyword in col.lower() for keyword in ['amount', 'revenue', 'price', 'value', 'total', 'sales']):
                    return col

        # 返回第一个数值列
        for col, info in self.schema.schema[table]['columns'].items():
            if info['type'] in ['INTEGER', 'REAL', 'NUMERIC']:
                return col

        return None

    def _find_dimension_column(self, table: str) -> Optional[str]:
        """查找维度列（用于分组）"""
        if table not in self.schema.schema:
            return None

        # 查找文本类型的列
        for col, info in self.schema.schema[table]['columns'].items():
            if info['type'] in ['TEXT', 'VARCHAR']:
                # 优先选择 name, category, region 等
                if any(keyword in col.lower() for keyword in ['name', 'category', 'type', 'region', 'city']):
                    return col

        # 返回第一个文本列
        for col, info in self.schema.schema[table]['columns'].items():
            if info['type'] in ['TEXT', 'VARCHAR']:
                return col

        return None

    def _find_date_column(self, table: str) -> Optional[str]:
        """查找日期列"""
        if table not in self.schema.schema:
            return None

        for col in self.schema.schema[table]['columns'].keys():
            if any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated']):
                return col

        return None


class NLQEngine:
    """自然语言查询引擎"""

    def __init__(
        self,
        db_path: str = 'data/database.db',
        cache_enabled: bool = True
    ):
        self.db_path = db_path
        self.schema_manager = SchemaManager(db_path)
        self.parser = QueryParser(self.schema_manager)
        self.cache_enabled = cache_enabled
        self.cache = {}

    def query(
        self,
        question: str,
        context: Optional[QueryResult] = None,
        visualize: bool = True
    ) -> QueryResult:
        """
        执行自然语言查询

        Args:
            question: 用户问题
            context: 上下文（用于追问）
            visualize: 是否推荐可视化

        Returns:
            QueryResult 对象
        """
        import time
        start_time = time.time()

        # 检查缓存
        cache_key = self._get_cache_key(question)
        if self.cache_enabled and cache_key in self.cache:
            result = self.cache[cache_key]
            result.metadata['from_cache'] = True
            return result

        # 解析问题生成 SQL
        sql = self.parser.parse(question)

        if not sql:
            return QueryResult(
                question=question,
                sql='',
                data=pd.DataFrame(),
                answer='抱歉，我无法理解您的问题。请尝试换一种方式提问。',
                visualization={},
                insights=[],
                execution_time=time.time() - start_time,
                metadata={'error': 'Failed to parse question'}
            )

        # 执行查询
        try:
            conn = sqlite3.connect(self.db_path)
            data = pd.read_sql_query(sql, conn)
            conn.close()
        except Exception as e:
            return QueryResult(
                question=question,
                sql=sql,
                data=pd.DataFrame(),
                answer=f'查询执行失败: {str(e)}',
                visualization={},
                insights=[],
                execution_time=time.time() - start_time,
                metadata={'error': str(e)}
            )

        # 生成自然语言答案
        answer = self._generate_answer(question, data)

        # 推荐可视化
        visualization = self._recommend_visualization(data) if visualize else {}

        # 生成洞察
        insights = self._generate_insights(data)

        execution_time = time.time() - start_time

        result = QueryResult(
            question=question,
            sql=sql,
            data=data,
            answer=answer,
            visualization=visualization,
            insights=insights,
            execution_time=execution_time,
            metadata={'rows': len(data), 'columns': len(data.columns)}
        )

        # 缓存结果
        if self.cache_enabled:
            self.cache[cache_key] = result

        return result

    def _get_cache_key(self, question: str) -> str:
        """生成缓存键"""
        return hashlib.md5(question.encode()).hexdigest()

    def _generate_answer(self, question: str, data: pd.DataFrame) -> str:
        """生成自然语言答案"""
        if data.empty:
            return "查询没有返回任何结果。"

        # 单值结果
        if len(data) == 1 and len(data.columns) == 1:
            value = data.iloc[0, 0]
            if isinstance(value, (int, float)):
                return f"结果是 {value:,.2f}"
            else:
                return f"结果是 {value}"

        # 多行结果
        if len(data) > 1:
            return f"找到 {len(data)} 条结果"

        return "查询完成"

    def _recommend_visualization(self, data: pd.DataFrame) -> Dict[str, Any]:
        """推荐可视化类型"""
        if data.empty:
            return {'type': 'none'}

        rows, cols = data.shape

        # 单值 -> 卡片
        if rows == 1 and cols == 1:
            return {'type': 'card'}

        # 两列数据（一个维度 + 一个度量）-> 柱状图或饼图
        if cols == 2:
            if rows <= 10:
                return {'type': 'bar', 'x': data.columns[0], 'y': data.columns[1]}
            else:
                return {'type': 'bar', 'x': data.columns[0], 'y': data.columns[1]}

        # 时间序列 -> 折线图
        if any('date' in col.lower() or 'time' in col.lower() for col in data.columns):
            date_col = [col for col in data.columns if 'date' in col.lower() or 'time' in col.lower()][0]
            value_col = [col for col in data.columns if col != date_col][0] if cols > 1 else None
            if value_col:
                return {'type': 'line', 'x': date_col, 'y': value_col}

        # 默认表格
        return {'type': 'table'}

    def _generate_insights(self, data: pd.DataFrame) -> List[str]:
        """生成数据洞察"""
        insights = []

        if data.empty:
            return insights

        # 数值列统计
        numeric_cols = data.select_dtypes(include=['number']).columns
        for col in numeric_cols:
            mean_val = data[col].mean()
            max_val = data[col].max()
            min_val = data[col].min()

            insights.append(f"{col} 的平均值为 {mean_val:.2f}")

            if len(data) > 1:
                # 找出最大值对应的行
                max_idx = data[col].idxmax()
                if len(data.columns) > 1:
                    other_col = [c for c in data.columns if c != col][0]
                    max_entity = data.loc[max_idx, other_col]
                    insights.append(f"{other_col} 中 {max_entity} 的 {col} 最高")

        return insights[:3]  # 只返回前3个洞察

    def explain_query(self, question: str) -> Dict[str, Any]:
        """解释查询（调试用）"""
        sql = self.parser.parse(question)
        return {
            'question': question,
            'sql': sql,
            'tables': list(self.schema_manager.schema.keys())
        }
