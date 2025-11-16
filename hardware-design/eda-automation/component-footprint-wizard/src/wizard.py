"""
Footprint Wizard
元件封裝自動生成工具
"""

from typing import Dict, Optional, List
from dataclasses import dataclass


@dataclass
class Pad:
    """焊盤"""
    number: str
    type: str  # 'smd', 'thru_hole'
    shape: str  # 'rect', 'circle', 'oval'
    x: float
    y: float
    width: float
    height: float
    drill: float = 0.0  # 鑽孔直徑 (僅 thru_hole)


class Footprint:
    """封裝類別"""

    def __init__(self, name: str):
        self.name = name
        self.description = ""
        self.tags = []
        self.reference = "REF"
        self.value = "VAL"
        self.pads: List[Pad] = []
        self.model_3d = None

    def add_pad(self, pad: Pad) -> None:
        """新增焊盤"""
        self.pads.append(pad)

    def add_3d_model(self, model_path: str) -> None:
        """新增 3D 模型"""
        self.model_3d = model_path

    def to_kicad(self) -> str:
        """
        轉換為 KiCAD 格式

        Returns:
            KiCAD footprint 字串
        """
        lines = [
            f'(footprint "{self.name}" (version 20221018) (generator pcbnew)',
            f'  (layer "F.Cu")',
            f'  (descr "{self.description}")',
            f'  (tags "{" ".join(self.tags)}")',
            f'  (fp_text reference "{self.reference}" (at 0 -2.5) (layer "F.SilkS")',
            f'    (effects (font (size 1 1) (thickness 0.15)))',
            f'  )',
            f'  (fp_text value "{self.value}" (at 0 2.5) (layer "F.Fab")',
            f'    (effects (font (size 1 1) (thickness 0.15)))',
            f'  )',
        ]

        # 焊盤
        for pad in self.pads:
            if pad.type == 'smd':
                lines.append(
                    f'  (pad "{pad.number}" smd {pad.shape} (at {pad.x} {pad.y}) '
                    f'(size {pad.width} {pad.height}) (layers "F.Cu" "F.Paste" "F.Mask"))'
                )
            elif pad.type == 'thru_hole':
                lines.append(
                    f'  (pad "{pad.number}" thru_hole {pad.shape} (at {pad.x} {pad.y}) '
                    f'(size {pad.width} {pad.height}) (drill {pad.drill}) '
                    f'(layers "*.Cu" "*.Mask"))'
                )

        # 3D 模型
        if self.model_3d:
            lines.append(f'  (model "{self.model_3d}"')
            lines.append(f'    (offset (xyz 0 0 0))')
            lines.append(f'    (scale (xyz 1 1 1))')
            lines.append(f'    (rotate (xyz 0 0 0))')
            lines.append(f'  )')

        lines.append(')')

        return '\n'.join(lines)

    def save(self, filepath: str, format: str = 'kicad') -> None:
        """
        儲存封裝

        Args:
            filepath: 輸出檔案路徑
            format: 格式 ('kicad', 'altium')
        """
        if format == 'kicad':
            content = self.to_kicad()
        else:
            raise NotImplementedError(f"尚未支援 {format} 格式")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✅ 封裝已儲存: {filepath}")

    def info(self) -> str:
        """獲取封裝資訊"""
        return f"""
封裝資訊:
  名稱: {self.name}
  描述: {self.description}
  標籤: {', '.join(self.tags)}
  焊盤數: {len(self.pads)}
  3D 模型: {self.model_3d or '無'}
"""


class FootprintWizard:
    """封裝生成精靈"""

    # SMD 元件標準尺寸 (mm)
    SMD_SIZES = {
        '0201': {'length': 0.6, 'width': 0.3, 'pad_length': 0.3, 'pad_width': 0.3, 'spacing': 0.6},
        '0402': {'length': 1.0, 'width': 0.5, 'pad_length': 0.6, 'pad_width': 0.6, 'spacing': 1.0},
        '0603': {'length': 1.6, 'width': 0.8, 'pad_length': 0.9, 'pad_width': 0.9, 'spacing': 1.5},
        '0805': {'length': 2.0, 'width': 1.25, 'pad_length': 1.2, 'pad_width': 1.4, 'spacing': 2.2},
        '1206': {'length': 3.2, 'width': 1.6, 'pad_length': 1.8, 'pad_width': 1.8, 'spacing': 3.2},
        '1210': {'length': 3.2, 'width': 2.5, 'pad_length': 1.8, 'pad_width': 2.7, 'spacing': 3.2},
    }

    def __init__(self, ai_model: Optional[str] = None, ipc_level: str = 'N'):
        """
        初始化生成器

        Args:
            ai_model: AI 模型名稱
            ipc_level: IPC 標準等級 (N/M/L)
        """
        self.ai_model = ai_model
        self.ipc_level = ipc_level

    def generate_resistor(self, size: str, **params) -> Footprint:
        """
        生成電阻封裝

        Args:
            size: 尺寸代碼 (0402, 0603, 0805, 等)
            **params: 額外參數

        Returns:
            Footprint 物件
        """
        if size not in self.SMD_SIZES:
            raise ValueError(f"不支援的尺寸: {size}")

        dims = self.SMD_SIZES[size]
        name = f"R_{size}"

        footprint = Footprint(name)
        footprint.description = f"{size} Resistor"
        footprint.tags = ['resistor', size, 'smd']
        footprint.reference = "R"
        footprint.value = "R"

        # 左側焊盤
        footprint.add_pad(Pad(
            number="1",
            type="smd",
            shape="rect",
            x=-dims['spacing'] / 2,
            y=0,
            width=dims['pad_length'],
            height=dims['pad_width']
        ))

        # 右側焊盤
        footprint.add_pad(Pad(
            number="2",
            type="smd",
            shape="rect",
            x=dims['spacing'] / 2,
            y=0,
            width=dims['pad_length'],
            height=dims['pad_width']
        ))

        return footprint

    def generate_capacitor(self, size: str, **params) -> Footprint:
        """
        生成電容封裝

        Args:
            size: 尺寸代碼
            **params: 額外參數

        Returns:
            Footprint 物件
        """
        footprint = self.generate_resistor(size, **params)
        footprint.name = f"C_{size}"
        footprint.description = f"{size} Capacitor"
        footprint.tags = ['capacitor', size, 'smd']
        footprint.reference = "C"
        footprint.value = "C"

        return footprint

    def generate_qfp(
        self,
        pins: int,
        pitch: float,
        body_size: float = None,
        pad_width: float = None,
        pad_length: float = None,
        **params
    ) -> Footprint:
        """
        生成 QFP 封裝

        Args:
            pins: 腳數 (必須是 4 的倍數)
            pitch: 腳間距 (mm)
            body_size: 本體尺寸 (mm)
            pad_width: 焊盤寬度 (mm)
            pad_length: 焊盤長度 (mm)
            **params: 額外參數

        Returns:
            Footprint 物件
        """
        if pins % 4 != 0:
            raise ValueError("QFP 腳數必須是 4 的倍數")

        # 預設值
        body_size = body_size or (pins / 4 * pitch + 2)
        pad_width = pad_width or (pitch * 0.6)
        pad_length = pad_length or 1.5

        name = f"QFP-{pins}_P{pitch}mm"
        if params.get('thermal_pad'):
            name += "_EP"

        footprint = Footprint(name)
        footprint.description = f"QFP {pins} pins, pitch {pitch}mm"
        footprint.tags = ['qfp', f'{pins}pin', f'pitch{pitch}']
        footprint.reference = "U"
        footprint.value = "QFP-" + str(pins)

        pins_per_side = pins // 4
        offset = body_size / 2 + pad_length / 2

        # 生成四個邊的焊盤
        pad_num = 1

        # 底邊 (從左到右)
        for i in range(pins_per_side):
            x = -(pins_per_side - 1) * pitch / 2 + i * pitch
            footprint.add_pad(Pad(
                number=str(pad_num),
                type="smd",
                shape="rect",
                x=x,
                y=offset,
                width=pad_width,
                height=pad_length
            ))
            pad_num += 1

        # 右邊 (從下到上)
        for i in range(pins_per_side):
            y = (pins_per_side - 1) * pitch / 2 - i * pitch
            footprint.add_pad(Pad(
                number=str(pad_num),
                type="smd",
                shape="rect",
                x=offset,
                y=y,
                width=pad_length,
                height=pad_width
            ))
            pad_num += 1

        # 頂邊 (從右到左)
        for i in range(pins_per_side):
            x = (pins_per_side - 1) * pitch / 2 - i * pitch
            footprint.add_pad(Pad(
                number=str(pad_num),
                type="smd",
                shape="rect",
                x=x,
                y=-offset,
                width=pad_width,
                height=pad_length
            ))
            pad_num += 1

        # 左邊 (從上到下)
        for i in range(pins_per_side):
            y = -(pins_per_side - 1) * pitch / 2 + i * pitch
            footprint.add_pad(Pad(
                number=str(pad_num),
                type="smd",
                shape="rect",
                x=-offset,
                y=y,
                width=pad_length,
                height=pad_width
            ))
            pad_num += 1

        # 熱焊盤 (如果需要)
        if params.get('thermal_pad'):
            thermal_size = params.get('thermal_pad_size', body_size * 0.6)
            footprint.add_pad(Pad(
                number=str(pins + 1),
                type="smd",
                shape="rect",
                x=0,
                y=0,
                width=thermal_size,
                height=thermal_size
            ))

        return footprint

    def generate_qfn(
        self,
        pins: int,
        pitch: float,
        body_size: float = None,
        **params
    ) -> Footprint:
        """
        生成 QFN 封裝

        Args:
            pins: 腳數
            pitch: 腳間距
            body_size: 本體尺寸
            **params: 額外參數

        Returns:
            Footprint 物件
        """
        # QFN 的生成邏輯類似 QFP,但焊盤在底部
        return self.generate_qfp(pins, pitch, body_size, **params)

    def ai_generate(self, description: str) -> Footprint:
        """
        使用 AI 從描述生成封裝

        Args:
            description: 自然語言描述

        Returns:
            Footprint 物件
        """
        if not self.ai_model:
            raise ValueError("未設定 AI 模型")

        # 這裡應該呼叫 AI API
        # 簡化實現
        print(f"🤖 使用 AI 生成封裝...")
        print(f"📝 描述: {description}")

        # 回傳示例封裝
        return self.generate_resistor('0603')


if __name__ == "__main__":
    print("Footprint Wizard")
    print("使用範例:")
    print("""
    wizard = FootprintWizard()

    # 生成 0603 電阻
    footprint = wizard.generate_resistor('0603')
    footprint.save('R_0603.kicad_mod')

    # 生成 QFP-64
    footprint = wizard.generate_qfp(pins=64, pitch=0.5)
    footprint.save('QFP64_0.5mm.kicad_mod')
    """)
