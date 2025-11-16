"""
DRC Checker
PCB 設計規則檢查工具
"""

from typing import List, Optional, Dict
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass, field


@dataclass
class DRCError:
    """DRC 錯誤"""
    type: str
    severity: str  # 'error' or 'warning'
    message: str
    layer: str = ""
    x: float = 0.0
    y: float = 0.0
    required: float = 0.0
    actual: float = 0.0

    def __str__(self):
        location = f"({self.x:.2f}, {self.y:.2f})" if self.x or self.y else ""
        return f"[{self.severity.upper()}] {self.type}: {self.message} {location}"


@dataclass
class DRCResult:
    """DRC 檢查結果"""
    project: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    errors: List[DRCError] = field(default_factory=list)
    warnings: List[DRCError] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        """是否通過 (沒有錯誤)"""
        return len(self.errors) == 0

    @property
    def error_count(self) -> int:
        """錯誤數量"""
        return len(self.errors)

    @property
    def warning_count(self) -> int:
        """警告數量"""
        return len(self.warnings)

    def add_error(self, error: DRCError) -> None:
        """新增錯誤"""
        if error.severity == 'error':
            self.errors.append(error)
        else:
            self.warnings.append(error)


class DRCRules:
    """DRC 規則"""

    def __init__(self):
        # 預設規則
        self.clearance = {
            'track_to_track': 0.2,
            'track_to_pad': 0.2,
            'pad_to_pad': 0.2,
            'track_to_copper': 0.2,
            'hole_to_hole': 0.5
        }

        self.track = {
            'min_width': 0.15,
            'max_width': 5.0
        }

        self.via = {
            'min_diameter': 0.4,
            'max_diameter': 2.0,
            'min_drill': 0.3,
            'min_annular_ring': 0.15
        }

        self.board = {
            'edge_clearance': 0.3
        }

        self.drill = {
            'min_diameter': 0.3,
            'max_diameter': 6.35
        }

    def set_clearance(self, value: float) -> None:
        """設定所有間距為相同值"""
        for key in self.clearance:
            self.clearance[key] = value

    def set_track_width(self, min: float = None, max: float = None) -> None:
        """設定走線寬度"""
        if min is not None:
            self.track['min_width'] = min
        if max is not None:
            self.track['max_width'] = max

    def set_via_diameter(self, min: float = None, max: float = None) -> None:
        """設定過孔直徑"""
        if min is not None:
            self.via['min_diameter'] = min
        if max is not None:
            self.via['max_diameter'] = max

    def set_drill_diameter(self, min: float = None, max: float = None) -> None:
        """設定鑽孔直徑"""
        if min is not None:
            self.drill['min_diameter'] = min
        if max is not None:
            self.drill['max_diameter'] = max


class DRCChecker:
    """DRC 檢查器"""

    def __init__(self, rules: Optional[DRCRules] = None):
        self.rules = rules or DRCRules()
        self.board = None
        self.pcb_file = ""

    def load_board(self, pcb_file: str) -> None:
        """
        載入 PCB 板子

        Args:
            pcb_file: PCB 檔案路徑
        """
        try:
            import pcbnew
        except ImportError:
            raise ImportError("需要 pcbnew 模組,請在 KiCAD 環境中執行")

        print(f"📋 載入 PCB: {pcb_file}")
        self.board = pcbnew.LoadBoard(pcb_file)
        self.pcb_file = pcb_file

    def run_drc(self) -> DRCResult:
        """
        執行 DRC 檢查

        Returns:
            DRCResult 物件
        """
        if not self.board:
            raise ValueError("請先使用 load_board() 載入板子")

        print(f"🔍 執行 DRC 檢查...")

        result = DRCResult(project=Path(self.pcb_file).name)

        # 執行各項檢查
        self._check_track_width(result)
        self._check_clearances(result)
        self._check_vias(result)
        self._check_board_edge(result)

        print(f"✅ DRC 檢查完成")
        print(f"   錯誤: {result.error_count}")
        print(f"   警告: {result.warning_count}")

        return result

    def _check_track_width(self, result: DRCResult) -> None:
        """檢查走線寬度"""
        try:
            import pcbnew
        except ImportError:
            return

        for track in self.board.GetTracks():
            if not isinstance(track, pcbnew.PCB_TRACK):
                continue

            width_mm = pcbnew.ToMM(track.GetWidth())
            min_width = self.rules.track['min_width']
            max_width = self.rules.track['max_width']

            if width_mm < min_width:
                result.add_error(DRCError(
                    type='track_width',
                    severity='error',
                    message=f'走線寬度 {width_mm:.3f}mm 小於最小值 {min_width}mm',
                    layer=track.GetLayerName(),
                    x=pcbnew.ToMM(track.GetStart().x),
                    y=pcbnew.ToMM(track.GetStart().y),
                    required=min_width,
                    actual=width_mm
                ))
            elif width_mm > max_width:
                result.add_error(DRCError(
                    type='track_width',
                    severity='warning',
                    message=f'走線寬度 {width_mm:.3f}mm 大於最大值 {max_width}mm',
                    layer=track.GetLayerName(),
                    x=pcbnew.ToMM(track.GetStart().x),
                    y=pcbnew.ToMM(track.GetStart().y),
                    required=max_width,
                    actual=width_mm
                ))

    def _check_clearances(self, result: DRCResult) -> None:
        """檢查間距 (簡化版)"""
        # 實際的間距檢查需要更複雜的幾何計算
        # 這裡只是示範結構
        pass

    def _check_vias(self, result: DRCResult) -> None:
        """檢查過孔"""
        try:
            import pcbnew
        except ImportError:
            return

        for track in self.board.GetTracks():
            if not isinstance(track, pcbnew.PCB_VIA):
                continue

            via = track
            diameter_mm = pcbnew.ToMM(via.GetWidth())
            drill_mm = pcbnew.ToMM(via.GetDrillValue())

            min_dia = self.rules.via['min_diameter']
            max_dia = self.rules.via['max_diameter']
            min_drill = self.rules.via['min_drill']

            if diameter_mm < min_dia:
                result.add_error(DRCError(
                    type='via_diameter',
                    severity='error',
                    message=f'過孔直徑 {diameter_mm:.3f}mm 小於最小值 {min_dia}mm',
                    x=pcbnew.ToMM(via.GetPosition().x),
                    y=pcbnew.ToMM(via.GetPosition().y),
                    required=min_dia,
                    actual=diameter_mm
                ))

            if drill_mm < min_drill:
                result.add_error(DRCError(
                    type='via_drill',
                    severity='error',
                    message=f'過孔鑽孔 {drill_mm:.3f}mm 小於最小值 {min_drill}mm',
                    x=pcbnew.ToMM(via.GetPosition().x),
                    y=pcbnew.ToMM(via.GetPosition().y),
                    required=min_drill,
                    actual=drill_mm
                ))

    def _check_board_edge(self, result: DRCResult) -> None:
        """檢查到板邊的距離"""
        # 簡化版,實際需要計算每個元件到板邊的最小距離
        pass

    def generate_report(
        self,
        result: DRCResult,
        output: str,
        format: str = "html"
    ) -> None:
        """
        生成報告

        Args:
            result: DRC 結果
            output: 輸出檔案路徑
            format: 報告格式 (html, json, text)
        """
        if format == "html":
            self._generate_html_report(result, output)
        elif format == "json":
            self._generate_json_report(result, output)
        else:
            self._generate_text_report(result, output)

    def _generate_html_report(self, result: DRCResult, output: str) -> None:
        """生成 HTML 報告"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DRC 報告 - {result.project}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        .summary {{ background: #f0f0f0; padding: 15px; margin: 20px 0; }}
        .passed {{ color: green; }}
        .failed {{ color: red; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background: #4CAF50; color: white; }}
        .error {{ background: #ffebee; }}
        .warning {{ background: #fff9c4; }}
    </style>
</head>
<body>
    <h1>DRC 檢查報告</h1>
    <div class="summary">
        <p><strong>專案:</strong> {result.project}</p>
        <p><strong>時間:</strong> {result.timestamp}</p>
        <p class="{'passed' if result.passed else 'failed'}">
            <strong>狀態:</strong> {'✅ 通過' if result.passed else '❌ 失敗'}
        </p>
        <p><strong>錯誤:</strong> {result.error_count}</p>
        <p><strong>警告:</strong> {result.warning_count}</p>
    </div>

    <h2>錯誤清單</h2>
    <table>
        <tr>
            <th>類型</th>
            <th>嚴重性</th>
            <th>訊息</th>
            <th>位置</th>
        </tr>
"""

        for error in result.errors + result.warnings:
            location = f"({error.x:.2f}, {error.y:.2f})" if error.x or error.y else "-"
            css_class = error.severity
            html += f"""        <tr class="{css_class}">
            <td>{error.type}</td>
            <td>{error.severity}</td>
            <td>{error.message}</td>
            <td>{location}</td>
        </tr>
"""

        html += """    </table>
</body>
</html>"""

        with open(output, 'w', encoding='utf-8') as f:
            f.write(html)

        print(f"📄 HTML 報告已生成: {output}")

    def _generate_json_report(self, result: DRCResult, output: str) -> None:
        """生成 JSON 報告"""
        import json

        data = {
            'project': result.project,
            'timestamp': result.timestamp,
            'summary': {
                'passed': result.passed,
                'error_count': result.error_count,
                'warning_count': result.warning_count
            },
            'errors': [
                {
                    'type': e.type,
                    'severity': e.severity,
                    'message': e.message,
                    'layer': e.layer,
                    'location': {'x': e.x, 'y': e.y},
                    'required': e.required,
                    'actual': e.actual
                }
                for e in result.errors + result.warnings
            ]
        }

        with open(output, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"📄 JSON 報告已生成: {output}")

    def _generate_text_report(self, result: DRCResult, output: str) -> None:
        """生成文字報告"""
        lines = [
            "=" * 60,
            "DRC 檢查報告",
            "=" * 60,
            f"專案: {result.project}",
            f"時間: {result.timestamp}",
            f"狀態: {'✅ 通過' if result.passed else '❌ 失敗'}",
            f"錯誤: {result.error_count}",
            f"警告: {result.warning_count}",
            "",
            "錯誤清單:",
            "-" * 60
        ]

        for error in result.errors + result.warnings:
            lines.append(str(error))

        with open(output, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        print(f"📄 文字報告已生成: {output}")


class BatchDRCChecker:
    """批次 DRC 檢查器"""

    def __init__(self, rules: Optional[DRCRules] = None):
        self.rules = rules or DRCRules()

    def run_batch(
        self,
        files: List[str],
        parallel: bool = False,
        workers: int = 4
    ) -> List[DRCResult]:
        """
        批次執行 DRC 檢查

        Args:
            files: PCB 檔案列表
            parallel: 是否並行處理
            workers: 工作程序數

        Returns:
            DRC 結果列表
        """
        results = []

        print(f"🔍 批次 DRC 檢查: {len(files)} 個專案")

        for pcb_file in files:
            print(f"\n{'='*60}")
            print(f"檢查: {pcb_file}")
            print(f"{'='*60}")

            try:
                checker = DRCChecker(rules=self.rules)
                checker.load_board(pcb_file)
                result = checker.run_drc()
                results.append(result)

            except Exception as e:
                print(f"❌ 檢查失敗: {e}")
                # 建立失敗結果
                result = DRCResult(project=Path(pcb_file).name)
                result.add_error(DRCError(
                    type='system',
                    severity='error',
                    message=f'檢查失敗: {str(e)}'
                ))
                results.append(result)

        print(f"\n✅ 批次檢查完成")
        return results


if __name__ == "__main__":
    print("DRC Checker")
    print("使用範例:")
    print("""
    checker = DRCChecker()
    checker.load_board('board.kicad_pcb')
    result = checker.run_drc()
    checker.generate_report(result, 'drc_report.html')
    """)
