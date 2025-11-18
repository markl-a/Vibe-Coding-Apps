"""
配置文件管理器

支持YAML和JSON格式的配置文件加载、验证和管理
"""

import os
import yaml
import json
from typing import Dict, Any, Optional
from pathlib import Path


class ConfigManager:
    """配置管理器"""

    def __init__(self, config_file: Optional[str] = None):
        """
        初始化配置管理器

        Args:
            config_file: 配置文件路径（支持.yaml, .yml, .json）
        """
        self.config = {}
        self.config_file = config_file

        if config_file and os.path.exists(config_file):
            self.load(config_file)
        else:
            self._load_defaults()

    def _load_defaults(self):
        """加载默认配置"""
        self.config = {
            'general': {
                'project_name': 'AI PCB Layout',
                'version': '1.0.0',
                'debug': False
            },
            'routing': {
                'algorithm': 'astar',
                'heuristic': 'manhattan',
                'diagonal_movement': False,
                'grid_resolution': 0.1,
                'via_cost': 10,
                'bend_cost': 1,
                'layer_change_cost': 5
            },
            'thermal': {
                'solver': 'fdm',
                'max_iterations': 1000,
                'convergence': 0.01,
                'ambient_temp': 25.0,
                'convection_coeff': 10.0,
                'emissivity': 0.9
            },
            'ml': {
                'model_type': 'simple',
                'learning_rate': 0.001,
                'batch_size': 8,
                'epochs': 100,
                'device': 'auto'  # 'cpu', 'cuda', or 'auto'
            },
            'visualization': {
                'colormap': 'hot',
                'dpi': 150,
                'show_grid': True,
                'figure_size': [12, 10]
            },
            'logging': {
                'level': 'INFO',
                'file': 'pcb_layout.log',
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'console_output': True
            }
        }

    def load(self, config_file: str):
        """
        从文件加载配置

        Args:
            config_file: 配置文件路径
        """
        self.config_file = config_file
        file_ext = Path(config_file).suffix.lower()

        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                if file_ext in ['.yaml', '.yml']:
                    loaded_config = yaml.safe_load(f)
                elif file_ext == '.json':
                    loaded_config = json.load(f)
                else:
                    raise ValueError(f"不支持的配置文件格式: {file_ext}")

            # 合并配置（保留默认值）
            self._load_defaults()
            self._merge_config(self.config, loaded_config)

            print(f"✓ 配置已从 {config_file} 加载")

        except Exception as e:
            print(f"✗ 加载配置文件失败: {e}")
            self._load_defaults()

    def _merge_config(self, base: Dict, update: Dict):
        """
        递归合并配置字典

        Args:
            base: 基础配置
            update: 更新配置
        """
        for key, value in update.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_config(base[key], value)
            else:
                base[key] = value

    def save(self, config_file: Optional[str] = None):
        """
        保存配置到文件

        Args:
            config_file: 配置文件路径（可选，默认使用初始化时的文件）
        """
        save_file = config_file or self.config_file

        if not save_file:
            raise ValueError("未指定配置文件路径")

        file_ext = Path(save_file).suffix.lower()

        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(os.path.abspath(save_file)), exist_ok=True)

            with open(save_file, 'w', encoding='utf-8') as f:
                if file_ext in ['.yaml', '.yml']:
                    yaml.safe_dump(self.config, f, default_flow_style=False,
                                  allow_unicode=True, sort_keys=False)
                elif file_ext == '.json':
                    json.dump(self.config, f, indent=2, ensure_ascii=False)
                else:
                    raise ValueError(f"不支持的配置文件格式: {file_ext}")

            print(f"✓ 配置已保存到 {save_file}")

        except Exception as e:
            print(f"✗ 保存配置文件失败: {e}")

    def get(self, key: str, default: Any = None) -> Any:
        """
        获取配置值（支持点号分隔的路径）

        Args:
            key: 配置键（例如 'routing.algorithm' 或 'thermal.solver'）
            default: 默认值

        Returns:
            配置值
        """
        keys = key.split('.')
        value = self.config

        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default

        return value

    def set(self, key: str, value: Any):
        """
        设置配置值（支持点号分隔的路径）

        Args:
            key: 配置键
            value: 配置值
        """
        keys = key.split('.')
        config = self.config

        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]

        config[keys[-1]] = value

    def get_section(self, section: str) -> Dict:
        """
        获取配置节

        Args:
            section: 节名称

        Returns:
            配置节字典
        """
        return self.config.get(section, {})

    def validate(self) -> bool:
        """
        验证配置完整性

        Returns:
            配置是否有效
        """
        required_sections = ['general', 'routing', 'thermal', 'ml', 'visualization', 'logging']

        for section in required_sections:
            if section not in self.config:
                print(f"✗ 缺少必需的配置节: {section}")
                return False

        # 验证关键参数
        validations = [
            ('routing.grid_resolution', lambda x: x > 0, "网格分辨率必须大于0"),
            ('thermal.max_iterations', lambda x: x > 0, "最大迭代次数必须大于0"),
            ('thermal.convergence', lambda x: x > 0, "收敛标准必须大于0"),
            ('ml.learning_rate', lambda x: 0 < x < 1, "学习率必须在0-1之间"),
            ('ml.batch_size', lambda x: x > 0, "批次大小必须大于0"),
        ]

        for key, validator, error_msg in validations:
            value = self.get(key)
            if value is None or not validator(value):
                print(f"✗ 配置验证失败 - {key}: {error_msg}")
                return False

        print("✓ 配置验证通过")
        return True

    def create_template(self, output_file: str = 'config_template.yaml'):
        """
        创建配置模板文件

        Args:
            output_file: 输出文件路径
        """
        self._load_defaults()
        self.save(output_file)
        print(f"✓ 配置模板已创建: {output_file}")

    def print_config(self):
        """打印当前配置"""
        print("\n" + "=" * 60)
        print("当前配置")
        print("=" * 60)
        print(yaml.dump(self.config, default_flow_style=False,
                       allow_unicode=True, sort_keys=False))
        print("=" * 60 + "\n")


# 全局配置实例
_global_config = None


def get_config(config_file: Optional[str] = None) -> ConfigManager:
    """
    获取全局配置实例

    Args:
        config_file: 配置文件路径（首次调用时指定）

    Returns:
        ConfigManager实例
    """
    global _global_config

    if _global_config is None:
        _global_config = ConfigManager(config_file)

    return _global_config


def load_config(config_file: str):
    """
    加载配置文件

    Args:
        config_file: 配置文件路径
    """
    global _global_config
    _global_config = ConfigManager(config_file)


def save_config(config_file: Optional[str] = None):
    """
    保存配置

    Args:
        config_file: 配置文件路径
    """
    config = get_config()
    config.save(config_file)


# 便捷函数
def get_value(key: str, default: Any = None) -> Any:
    """获取配置值"""
    return get_config().get(key, default)


def set_value(key: str, value: Any):
    """设置配置值"""
    get_config().set(key, value)
