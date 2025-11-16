"""
KiCAD Script Generator
AI 驅動的 KiCAD Python 腳本生成工具
"""

from .generator import KiCADScriptGenerator, GeneratedScript
from .validator import ScriptValidator

__version__ = "0.1.0"
__all__ = ['KiCADScriptGenerator', 'GeneratedScript', 'ScriptValidator']
