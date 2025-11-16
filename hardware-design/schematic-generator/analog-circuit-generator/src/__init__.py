"""
類比電路生成器模組
"""

from .amplifier_designer import OpAmpAmplifier
from .oscillator_designer import RC_Oscillator
from .regulator_designer import LinearRegulator
from .component_library import E_Series

__all__ = [
    'OpAmpAmplifier',
    'RC_Oscillator',
    'LinearRegulator',
    'E_Series'
]

__version__ = '1.0.0'
