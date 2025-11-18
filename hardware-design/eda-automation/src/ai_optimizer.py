"""
AI 設計優化器
提供 PCB 設計建議和優化
"""

import os
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DesignSuggestion:
    """設計建議"""

    def __init__(
        self,
        category: str,
        severity: str,
        title: str,
        description: str,
        location: Optional[Tuple[float, float]] = None,
        component: Optional[str] = None,
        auto_fix: bool = False
    ):
        self.category = category  # 'layout', 'routing', 'power', 'signal_integrity', etc.
        self.severity = severity  # 'critical', 'warning', 'suggestion'
        self.title = title
        self.description = description
        self.location = location
        self.component = component
        self.auto_fix = auto_fix
        self.fix_script = None

    def __str__(self):
        loc_str = f" @ ({self.location[0]:.2f}, {self.location[1]:.2f})" if self.location else ""
        comp_str = f" [{self.component}]" if self.component else ""
        return f"[{self.severity.upper()}] {self.title}{comp_str}{loc_str}"


class AIDesignOptimizer:
    """AI 設計優化器"""

    def __init__(
        self,
        model: str = "gpt-4",
        api_key: Optional[str] = None
    ):
        """
        初始化優化器

        Args:
            model: AI 模型名稱
            api_key: API 金鑰
        """
        self.model = model
        self._init_ai_client(api_key)

    def _init_ai_client(self, api_key: Optional[str]) -> None:
        """初始化 AI 客戶端"""
        if self.model.startswith('gpt'):
            self.provider = 'openai'
            try:
                import openai
                openai.api_key = api_key or os.getenv('OPENAI_API_KEY')
                if not openai.api_key:
                    logger.warning("未設定 OPENAI_API_KEY")
                self.client = openai
            except ImportError:
                logger.error("需要安裝 openai 套件")
                self.client = None

        elif self.model.startswith('claude'):
            self.provider = 'anthropic'
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=api_key or os.getenv('ANTHROPIC_API_KEY'))
            except ImportError:
                logger.error("需要安裝 anthropic 套件")
                self.client = None
        else:
            self.provider = 'mock'
            self.client = None

    def analyze_board(
        self,
        pcb_file: str,
        focus_areas: Optional[List[str]] = None
    ) -> List[DesignSuggestion]:
        """
        分析 PCB 設計並提供建議

        Args:
            pcb_file: PCB 檔案路徑
            focus_areas: 關注領域列表 ['power', 'signal_integrity', 'layout', 'routing']

        Returns:
            建議列表
        """
        logger.info(f"分析 PCB 設計: {pcb_file}")

        suggestions = []

        try:
            import pcbnew
            board = pcbnew.LoadBoard(pcb_file)

            # 提取板子資訊
            board_info = self._extract_board_info(board)

            # 執行各項檢查
            if not focus_areas or 'power' in focus_areas:
                suggestions.extend(self._check_power_distribution(board, board_info))

            if not focus_areas or 'signal_integrity' in focus_areas:
                suggestions.extend(self._check_signal_integrity(board, board_info))

            if not focus_areas or 'layout' in focus_areas:
                suggestions.extend(self._check_layout(board, board_info))

            if not focus_areas or 'routing' in focus_areas:
                suggestions.extend(self._check_routing(board, board_info))

            # 使用 AI 提供額外建議
            if self.client:
                ai_suggestions = self._get_ai_suggestions(board_info)
                suggestions.extend(ai_suggestions)

        except ImportError:
            logger.error("需要 pcbnew 模組")
        except Exception as e:
            logger.error(f"分析失敗: {e}")

        logger.info(f"分析完成: 找到 {len(suggestions)} 個建議")
        return suggestions

    def _extract_board_info(self, board) -> Dict:
        """提取板子資訊"""
        import pcbnew

        info = {
            'name': board.GetFileName(),
            'layers': board.GetCopperLayerCount(),
            'size': (
                pcbnew.ToMM(board.GetBoardEdgesBoundingBox().GetWidth()),
                pcbnew.ToMM(board.GetBoardEdgesBoundingBox().GetHeight())
            ),
            'component_count': len(list(board.GetFootprints())),
            'track_count': 0,
            'via_count': 0,
            'net_count': board.GetNetCount(),
            'nets': {}
        }

        # 統計走線和過孔
        for track in board.GetTracks():
            if isinstance(track, pcbnew.PCB_VIA):
                info['via_count'] += 1
            elif isinstance(track, pcbnew.PCB_TRACK):
                info['track_count'] += 1

        # 收集重要網路資訊
        for fp in board.GetFootprints():
            for pad in fp.Pads():
                net_name = pad.GetNetname()
                if net_name and (
                    'VCC' in net_name.upper() or
                    'GND' in net_name.upper() or
                    'PWR' in net_name.upper() or
                    net_name.startswith('+') or
                    net_name.startswith('-')
                ):
                    if net_name not in info['nets']:
                        info['nets'][net_name] = {
                            'pads': [],
                            'tracks': []
                        }
                    info['nets'][net_name]['pads'].append(pad)

        return info

    def _check_power_distribution(self, board, board_info: Dict) -> List[DesignSuggestion]:
        """檢查電源分佈"""
        suggestions = []
        import pcbnew

        # 檢查去耦電容
        caps = [fp for fp in board.GetFootprints()
                if fp.GetReference().startswith('C')]

        ics = [fp for fp in board.GetFootprints()
               if fp.GetReference().startswith('U')]

        for ic in ics:
            # 檢查附近是否有去耦電容
            ic_pos = ic.GetPosition()
            nearby_caps = []

            for cap in caps:
                cap_pos = cap.GetPosition()
                distance = pcbnew.ToMM(
                    ((ic_pos.x - cap_pos.x)**2 + (ic_pos.y - cap_pos.y)**2)**0.5
                )
                if distance < 10:  # 10mm 範圍內
                    nearby_caps.append((cap, distance))

            if len(nearby_caps) == 0:
                suggestions.append(DesignSuggestion(
                    category='power',
                    severity='warning',
                    title='缺少去耦電容',
                    description=f'IC {ic.GetReference()} 附近沒有去耦電容',
                    location=(pcbnew.ToMM(ic_pos.x), pcbnew.ToMM(ic_pos.y)),
                    component=ic.GetReference()
                ))
            elif len(nearby_caps) < 2:
                suggestions.append(DesignSuggestion(
                    category='power',
                    severity='suggestion',
                    title='去耦電容可能不足',
                    description=f'IC {ic.GetReference()} 附近只有 {len(nearby_caps)} 個去耦電容',
                    location=(pcbnew.ToMM(ic_pos.x), pcbnew.ToMM(ic_pos.y)),
                    component=ic.GetReference()
                ))

        # 檢查電源走線寬度
        for net_name, net_info in board_info['nets'].items():
            if 'VCC' in net_name or 'PWR' in net_name or net_name.startswith('+'):
                # 這裡應該檢查走線寬度
                # 簡化實現
                suggestions.append(DesignSuggestion(
                    category='power',
                    severity='suggestion',
                    title='檢查電源走線寬度',
                    description=f'建議檢查 {net_name} 的走線寬度是否足夠承載電流',
                    component=net_name
                ))

        return suggestions

    def _check_signal_integrity(self, board, board_info: Dict) -> List[DesignSuggestion]:
        """檢查訊號完整性"""
        suggestions = []
        import pcbnew

        # 檢查差分對
        for track in board.GetTracks():
            if isinstance(track, pcbnew.PCB_TRACK):
                net_name = track.GetNetname()
                if any(suffix in net_name for suffix in ['_P', '_N', '+', '-']):
                    # 可能是差分對
                    width_mm = pcbnew.ToMM(track.GetWidth())
                    if width_mm < 0.15:
                        suggestions.append(DesignSuggestion(
                            category='signal_integrity',
                            severity='warning',
                            title='差分對走線過窄',
                            description=f'網路 {net_name} 的走線寬度 {width_mm:.3f}mm 可能太窄',
                            component=net_name
                        ))

        return suggestions

    def _check_layout(self, board, board_info: Dict) -> List[DesignSuggestion]:
        """檢查佈局"""
        suggestions = []

        # 檢查元件密度
        board_area = board_info['size'][0] * board_info['size'][1]
        component_density = board_info['component_count'] / board_area

        if component_density > 2.0:  # 每平方公分超過 2 個元件
            suggestions.append(DesignSuggestion(
                category='layout',
                severity='warning',
                title='元件密度過高',
                description=f'板子上元件密度 {component_density:.2f} 個/cm²，可能造成散熱和維修困難'
            ))

        return suggestions

    def _check_routing(self, board, board_info: Dict) -> List[DesignSuggestion]:
        """檢查走線"""
        suggestions = []

        # 檢查過孔數量
        via_density = board_info['via_count'] / (board_info['size'][0] * board_info['size'][1])

        if via_density > 5.0:
            suggestions.append(DesignSuggestion(
                category='routing',
                severity='suggestion',
                title='過孔數量較多',
                description=f'板子上過孔密度 {via_density:.2f} 個/cm²，考慮是否可以減少'
            ))

        return suggestions

    def _get_ai_suggestions(self, board_info: Dict) -> List[DesignSuggestion]:
        """使用 AI 獲取額外建議"""
        if not self.client:
            return []

        suggestions = []

        prompt = f"""分析以下 PCB 設計資訊，提供設計建議:

板子資訊:
- 尺寸: {board_info['size'][0]:.1f}mm x {board_info['size'][1]:.1f}mm
- 層數: {board_info['layers']}
- 元件數: {board_info['component_count']}
- 網路數: {board_info['net_count']}
- 走線數: {board_info['track_count']}
- 過孔數: {board_info['via_count']}

請提供 3-5 個設計建議，格式如下:
[類別] 標題: 描述

類別可以是: power, signal_integrity, layout, routing, manufacturing
"""

        try:
            if self.provider == 'openai':
                response = self.client.ChatCompletion.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "你是 PCB 設計專家。"},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                ai_response = response.choices[0].message.content

            elif self.provider == 'anthropic':
                message = self.client.messages.create(
                    model=self.model,
                    max_tokens=1024,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3
                )
                ai_response = message.content[0].text
            else:
                return []

            # 解析 AI 回應
            suggestions.extend(self._parse_ai_suggestions(ai_response))

        except Exception as e:
            logger.error(f"AI 建議獲取失敗: {e}")

        return suggestions

    def _parse_ai_suggestions(self, ai_response: str) -> List[DesignSuggestion]:
        """解析 AI 建議"""
        suggestions = []

        for line in ai_response.split('\n'):
            line = line.strip()
            if not line or not line.startswith('['):
                continue

            try:
                # 解析格式: [category] title: description
                parts = line.split(']', 1)
                if len(parts) != 2:
                    continue

                category = parts[0][1:].strip().lower()
                rest = parts[1].strip()

                if ':' in rest:
                    title, description = rest.split(':', 1)
                    title = title.strip()
                    description = description.strip()
                else:
                    title = rest
                    description = ""

                suggestions.append(DesignSuggestion(
                    category=category,
                    severity='suggestion',
                    title=title,
                    description=description
                ))

            except Exception as e:
                logger.warning(f"解析建議失敗: {line} - {e}")

        return suggestions

    def generate_optimization_report(
        self,
        suggestions: List[DesignSuggestion],
        output_file: str,
        format: str = 'html'
    ) -> None:
        """
        生成優化報告

        Args:
            suggestions: 建議列表
            output_file: 輸出檔案
            format: 格式 (html, md, txt)
        """
        if format == 'html':
            self._generate_html_report(suggestions, output_file)
        elif format == 'md':
            self._generate_md_report(suggestions, output_file)
        else:
            self._generate_txt_report(suggestions, output_file)

    def _generate_html_report(
        self,
        suggestions: List[DesignSuggestion],
        output_file: str
    ) -> None:
        """生成 HTML 報告"""
        # 按嚴重性分組
        critical = [s for s in suggestions if s.severity == 'critical']
        warnings = [s for s in suggestions if s.severity == 'warning']
        sug = [s for s in suggestions if s.severity == 'suggestion']

        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PCB 設計優化報告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1 {{ color: #333; }}
        .summary {{ background: #f5f5f5; padding: 15px; margin: 20px 0; }}
        .suggestion {{ margin: 15px 0; padding: 15px; border-left: 4px solid #ccc; }}
        .critical {{ border-left-color: #d32f2f; background: #ffebee; }}
        .warning {{ border-left-color: #f57c00; background: #fff3e0; }}
        .suggestion-item {{ border-left-color: #1976d2; background: #e3f2fd; }}
        .category {{ display: inline-block; padding: 2px 8px; background: #e0e0e0;
                    border-radius: 3px; font-size: 0.9em; margin-right: 8px; }}
        .title {{ font-weight: bold; margin: 5px 0; }}
        .description {{ color: #666; }}
        .location {{ color: #999; font-size: 0.9em; }}
    </style>
</head>
<body>
    <h1>PCB 設計優化報告</h1>

    <div class="summary">
        <h2>總結</h2>
        <p>生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <p>總建議數: {len(suggestions)}</p>
        <p>
            嚴重: {len(critical)} |
            警告: {len(warnings)} |
            建議: {len(sug)}
        </p>
    </div>
"""

        if critical:
            html += "<h2>🔴 嚴重問題</h2>\n"
            for s in critical:
                html += self._suggestion_to_html(s, 'critical')

        if warnings:
            html += "<h2>⚠️ 警告</h2>\n"
            for s in warnings:
                html += self._suggestion_to_html(s, 'warning')

        if sug:
            html += "<h2>💡 建議</h2>\n"
            for s in sug:
                html += self._suggestion_to_html(s, 'suggestion-item')

        html += "</body>\n</html>"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)

        logger.info(f"報告已生成: {output_file}")

    def _suggestion_to_html(self, s: DesignSuggestion, css_class: str) -> str:
        """將建議轉換為 HTML"""
        loc_str = f'<span class="location">位置: ({s.location[0]:.2f}, {s.location[1]:.2f})</span>' if s.location else ''
        comp_str = f'<span class="location">元件: {s.component}</span>' if s.component else ''

        return f"""<div class="suggestion {css_class}">
    <span class="category">{s.category}</span>
    <div class="title">{s.title}</div>
    <div class="description">{s.description}</div>
    {comp_str} {loc_str}
</div>
"""

    def _generate_md_report(
        self,
        suggestions: List[DesignSuggestion],
        output_file: str
    ) -> None:
        """生成 Markdown 報告"""
        critical = [s for s in suggestions if s.severity == 'critical']
        warnings = [s for s in suggestions if s.severity == 'warning']
        sug = [s for s in suggestions if s.severity == 'suggestion']

        md = f"""# PCB 設計優化報告

生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 總結

- 總建議數: {len(suggestions)}
- 嚴重: {len(critical)}
- 警告: {len(warnings)}
- 建議: {len(sug)}

"""

        if critical:
            md += "## 🔴 嚴重問題\n\n"
            for s in critical:
                md += f"### [{s.category}] {s.title}\n\n{s.description}\n\n"

        if warnings:
            md += "## ⚠️ 警告\n\n"
            for s in warnings:
                md += f"### [{s.category}] {s.title}\n\n{s.description}\n\n"

        if sug:
            md += "## 💡 建議\n\n"
            for s in sug:
                md += f"### [{s.category}] {s.title}\n\n{s.description}\n\n"

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(md)

        logger.info(f"報告已生成: {output_file}")

    def _generate_txt_report(
        self,
        suggestions: List[DesignSuggestion],
        output_file: str
    ) -> None:
        """生成文字報告"""
        lines = [
            "=" * 60,
            "PCB 設計優化報告",
            "=" * 60,
            f"生成時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"總建議數: {len(suggestions)}",
            "",
            "建議列表:",
            "-" * 60
        ]

        for s in suggestions:
            lines.append(str(s))
            if s.description:
                lines.append(f"  {s.description}")
            lines.append("")

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        logger.info(f"報告已生成: {output_file}")


if __name__ == "__main__":
    # 測試範例
    print("AI 設計優化器")
    print("使用範例:")
    print("""
    optimizer = AIDesignOptimizer(model='gpt-4')
    suggestions = optimizer.analyze_board('board.kicad_pcb')
    optimizer.generate_optimization_report(suggestions, 'optimization_report.html')
    """)
