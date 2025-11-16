"""
PCB 材料屬性數據庫
"""


class MaterialDatabase:
    """材料數據庫"""

    def __init__(self):
        """初始化材料數據庫"""
        self.materials = {
            'copper': {
                'name': 'Copper',
                'thermal_conductivity': 385.0,  # W/(m·K)
                'specific_heat': 385.0,          # J/(kg·K)
                'density': 8960.0,               # kg/m³
                'emissivity': 0.03
            },
            'fr4': {
                'name': 'FR4',
                'thermal_conductivity': 0.3,
                'specific_heat': 1150.0,
                'density': 1850.0,
                'emissivity': 0.9
            },
            'aluminum': {
                'name': 'Aluminum',
                'thermal_conductivity': 205.0,
                'specific_heat': 900.0,
                'density': 2700.0,
                'emissivity': 0.09
            },
            'thermal_pad': {
                'name': 'Thermal Pad',
                'thermal_conductivity': 3.0,
                'specific_heat': 1000.0,
                'density': 2000.0,
                'emissivity': 0.85
            }
        }

    def get_material(self, name: str) -> dict:
        """獲取材料屬性"""
        if name.lower() not in self.materials:
            return self.materials['fr4']  # 預設
        return self.materials[name.lower()]

    def add_material(self, name: str, properties: dict):
        """添加自訂材料"""
        self.materials[name.lower()] = properties
