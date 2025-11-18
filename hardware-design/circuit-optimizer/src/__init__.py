"""
電路優化工具
AI 驅動的電路性能優化和成本分析
提供 BOM 成本優化、元件選擇、多目標優化和功耗分析功能
"""

from .optimizer import CircuitOptimizer, OptimizationResult
from .bom_optimizer import BOMOptimizer, Component, create_sample_bom
from .component_selector import ComponentSelector, ComponentSpec, ComponentCategory, ComponentCandidate
from .multi_objective import MultiObjectiveOptimizer, OptimizationObjective, Individual
from .power_analyzer import PowerAnalyzer, ComponentPower, PowerProfile, PowerMode
from .ai_recommender import AIComponentRecommender, SmartDesignValidator, DesignAnomaly, DesignPattern

__all__ = [
    # 主優化器
    'CircuitOptimizer',
    'OptimizationResult',

    # BOM 優化
    'BOMOptimizer',
    'Component',
    'create_sample_bom',

    # 元件選擇
    'ComponentSelector',
    'ComponentSpec',
    'ComponentCategory',
    'ComponentCandidate',

    # 多目標優化
    'MultiObjectiveOptimizer',
    'OptimizationObjective',
    'Individual',

    # 功耗分析
    'PowerAnalyzer',
    'ComponentPower',
    'PowerProfile',
    'PowerMode',

    # AI 推薦系統
    'AIComponentRecommender',
    'SmartDesignValidator',
    'DesignAnomaly',
    'DesignPattern',
]

__version__ = "0.1.0"
__author__ = "Vibe Coding Apps"
