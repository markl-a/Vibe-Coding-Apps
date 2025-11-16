"""
PCB 設計規則檢查器主模組
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import yaml


class PCBChecker:
    """PCB 設計規則檢查器"""

    def __init__(self):
        """初始化檢查器"""
        self.traces = []
        self.vias = []
        self.pads = []
        self.rules = self._default_rules()

    def _default_rules(self) -> Dict:
        """預設設計規則"""
        return {
            'min_trace_width': 0.15,
            'min_trace_spacing': 0.15,
            'min_via_diameter': 0.3,
            'min_via_drill': 0.2,
            'min_annular_ring': 0.1,
            'min_copper_to_edge': 0.5,
            'max_trace_length': 500,
            'power_min_width': 0.5
        }

    def set_rules(self, rules: Dict):
        """設定檢查規則"""
        self.rules.update(rules)

    def load_rules(self, filepath: str):
        """從 YAML 檔案載入規則"""
        with open(filepath, 'r') as f:
            loaded_rules = yaml.safe_load(f)
            # 展平巢狀字典
            flat_rules = {}
            for category, rules in loaded_rules.items():
                if isinstance(rules, dict):
                    for key, value in rules.items():
                        flat_rules[f"{category}_{key}"] = value
            self.set_rules(flat_rules)

    def add_trace(self, start: Tuple[float, float], end: Tuple[float, float],
                  width: float, layer: int = 0, net_class: str = 'signal'):
        """添加走線"""
        trace = {
            'start': start,
            'end': end,
            'width': width,
            'layer': layer,
            'net_class': net_class
        }
        self.traces.append(trace)

    def add_via(self, x: float, y: float, diameter: float, drill: float,
                layer_start: int = 0, layer_end: int = 1):
        """添加過孔"""
        via = {
            'x': x,
            'y': y,
            'diameter': diameter,
            'drill': drill,
            'layer_start': layer_start,
            'layer_end': layer_end
        }
        self.vias.append(via)

    def check_all(self) -> List[Dict]:
        """執行所有檢查"""
        violations = []

        # 檢查走線
        violations.extend(self.check_traces())

        # 檢查過孔
        violations.extend(self.check_vias())

        # 檢查間距
        violations.extend(self.check_clearance())

        return violations

    def check_traces(self) -> List[Dict]:
        """檢查走線規則"""
        violations = []

        for i, trace in enumerate(self.traces):
            # 檢查最小線寬
            if trace['width'] < self.rules['min_trace_width']:
                violations.append({
                    'type': 'trace_width',
                    'severity': 'error',
                    'description': f'走線寬度 {trace["width"]:.3f}mm 小於最小值 {self.rules["min_trace_width"]:.3f}mm',
                    'x': trace['start'][0],
                    'y': trace['start'][1],
                    'object_id': i
                })

            # 檢查電源走線
            if trace['net_class'] == 'power' and trace['width'] < self.rules['power_min_width']:
                violations.append({
                    'type': 'power_trace_width',
                    'severity': 'warning',
                    'description': f'電源走線寬度 {trace["width"]:.3f}mm 小於建議值 {self.rules["power_min_width"]:.3f}mm',
                    'x': trace['start'][0],
                    'y': trace['start'][1],
                    'object_id': i
                })

        return violations

    def check_vias(self) -> List[Dict]:
        """檢查過孔規則"""
        violations = []

        for i, via in enumerate(self.vias):
            # 檢查最小直徑
            if via['diameter'] < self.rules['min_via_diameter']:
                violations.append({
                    'type': 'via_diameter',
                    'severity': 'error',
                    'description': f'過孔直徑 {via["diameter"]:.3f}mm 小於最小值 {self.rules["min_via_diameter"]:.3f}mm',
                    'x': via['x'],
                    'y': via['y'],
                    'object_id': i
                })

            # 檢查最小鑽孔
            if via['drill'] < self.rules['min_via_drill']:
                violations.append({
                    'type': 'via_drill',
                    'severity': 'error',
                    'description': f'過孔鑽孔 {via["drill"]:.3f}mm 小於最小值 {self.rules["min_via_drill"]:.3f}mm',
                    'x': via['x'],
                    'y': via['y'],
                    'object_id': i
                })

            # 檢查環狀環
            annular_ring = (via['diameter'] - via['drill']) / 2
            if annular_ring < self.rules['min_annular_ring']:
                violations.append({
                    'type': 'annular_ring',
                    'severity': 'warning',
                    'description': f'環狀環 {annular_ring:.3f}mm 小於最小值 {self.rules["min_annular_ring"]:.3f}mm',
                    'x': via['x'],
                    'y': via['y'],
                    'object_id': i
                })

        return violations

    def check_clearance(self) -> List[Dict]:
        """檢查間距"""
        violations = []

        # 檢查走線之間的間距
        for i in range(len(self.traces)):
            for j in range(i + 1, len(self.traces)):
                # 簡化：只檢查同層的走線
                if self.traces[i]['layer'] == self.traces[j]['layer']:
                    # TODO: 實現精確的間距計算
                    pass

        return violations

    def generate_report(self, violations: List[Dict], output: str = 'drc_report.txt'):
        """生成檢查報告"""
        with open(output, 'w', encoding='utf-8') as f:
            f.write("=" * 60 + "\n")
            f.write("PCB 設計規則檢查報告\n")
            f.write("=" * 60 + "\n\n")

            # 統計
            error_count = sum(1 for v in violations if v['severity'] == 'error')
            warning_count = sum(1 for v in violations if v['severity'] == 'warning')

            f.write(f"總違規數: {len(violations)}\n")
            f.write(f"  錯誤: {error_count}\n")
            f.write(f"  警告: {warning_count}\n\n")

            # 按類型分組
            by_type = {}
            for v in violations:
                if v['type'] not in by_type:
                    by_type[v['type']] = []
                by_type[v['type']].append(v)

            f.write("違規詳情:\n")
            for vtype, vlist in by_type.items():
                f.write(f"\n  {vtype} ({len(vlist)}):\n")
                for v in vlist:
                    f.write(f"    [{v['severity'].upper()}] {v['description']}\n")
                    f.write(f"      位置: ({v['x']:.2f}, {v['y']:.2f})\n")

            f.write("\n" + "=" * 60 + "\n")

        print(f"報告已生成: {output}")
