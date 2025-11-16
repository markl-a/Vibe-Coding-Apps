"""
PCB Thermal Analyzer
PCB 熱分析工具
"""

from .analyzer import ThermalAnalyzer
from .materials import MaterialDatabase

__version__ = "0.1.0"
__all__ = ['ThermalAnalyzer', 'MaterialDatabase']
