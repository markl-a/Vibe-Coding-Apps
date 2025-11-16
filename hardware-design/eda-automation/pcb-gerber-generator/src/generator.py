"""
PCB Gerber Generator
自動生成 PCB 製造文件
"""

import os
import zipfile
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime


class GerberGenerator:
    """PCB Gerber 檔案生成器"""

    # KiCAD 層對應
    KICAD_LAYERS = {
        'F.Cu': ('gtl', 'Top Copper'),
        'B.Cu': ('gbl', 'Bottom Copper'),
        'F.SilkS': ('gto', 'Top Silkscreen'),
        'B.SilkS': ('gbo', 'Bottom Silkscreen'),
        'F.Mask': ('gts', 'Top Solder Mask'),
        'B.Mask': ('gbs', 'Bottom Solder Mask'),
        'F.Paste': ('gtp', 'Top Paste'),
        'B.Paste': ('gbp', 'Bottom Paste'),
        'Edge.Cuts': ('gm1', 'Board Outline'),
        'In1.Cu': ('g2', 'Inner Layer 1'),
        'In2.Cu': ('g3', 'Inner Layer 2'),
    }

    STANDARD_LAYERS = [
        'F.Cu', 'B.Cu',
        'F.SilkS', 'B.SilkS',
        'F.Mask', 'B.Mask',
        'Edge.Cuts'
    ]

    def __init__(self, tool: str = 'kicad', config: Optional[dict] = None):
        """
        初始化生成器

        Args:
            tool: EDA 工具 ('kicad', 'altium', 'eagle')
            config: 自訂配置
        """
        self.tool = tool.lower()
        self.config = config or {}

        if self.tool == 'kicad':
            try:
                import pcbnew
                self.pcbnew = pcbnew
            except ImportError:
                raise ImportError("未找到 pcbnew 模組,請確認已安裝 KiCAD")
        else:
            raise NotImplementedError(f"尚未支援 {tool}")

    def generate(
        self,
        input_file: str,
        output_dir: str,
        manufacturer: Optional[str] = None,
        layers: Optional[List[str]] = None,
        zip_output: bool = False
    ) -> Dict:
        """
        生成 Gerber 檔案

        Args:
            input_file: 輸入 PCB 檔案路徑
            output_dir: 輸出目錄
            manufacturer: 廠商名稱 (jlcpcb, pcbway, 等)
            layers: 要輸出的層列表,None 表示全部標準層
            zip_output: 是否壓縮輸出

        Returns:
            生成結果字典
        """
        if self.tool == 'kicad':
            return self._generate_kicad(
                input_file, output_dir,
                manufacturer, layers, zip_output
            )
        else:
            raise NotImplementedError(f"尚未支援 {self.tool}")

    def _generate_kicad(
        self,
        input_file: str,
        output_dir: str,
        manufacturer: Optional[str],
        layers: Optional[List[str]],
        zip_output: bool
    ) -> Dict:
        """KiCAD Gerber 生成"""

        print(f"📋 載入 PCB: {input_file}")

        # 載入板子
        board = self.pcbnew.LoadBoard(input_file)
        project_name = Path(input_file).stem

        # 建立輸出目錄
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 設定繪圖控制器
        plot_controller = self.pcbnew.PLOT_CONTROLLER(board)
        plot_options = plot_controller.GetPlotOptions()

        # 設定基本選項
        plot_options.SetOutputDirectory(str(output_path))
        plot_options.SetPlotFrameRef(False)
        plot_options.SetSketchPadLineWidth(self.pcbnew.FromMM(0.1))
        plot_options.SetAutoScale(False)
        plot_options.SetScale(1)
        plot_options.SetMirror(False)
        plot_options.SetUseGerberAttributes(True)
        plot_options.SetUseGerberProtelExtensions(False)
        plot_options.SetCreateGerberJobFile(True)
        plot_options.SetSubtractMaskFromSilk(False)

        # 根據廠商調整設定
        if manufacturer == 'jlcpcb':
            plot_options.SetUseGerberProtelExtensions(True)

        # 決定要輸出的層
        layers_to_plot = layers or self.STANDARD_LAYERS

        print(f"🎨 繪製 Gerber 層...")

        plotted_files = []

        # 繪製各層
        for layer_name in layers_to_plot:
            if layer_name not in self.KICAD_LAYERS:
                print(f"⚠️  警告: 未知的層 {layer_name}")
                continue

            layer_id = getattr(self.pcbnew, layer_name.replace('.', '_'), None)
            if layer_id is None:
                print(f"⚠️  警告: 找不到層 ID: {layer_name}")
                continue

            ext, description = self.KICAD_LAYERS[layer_name]

            plot_controller.SetLayer(layer_id)
            plot_controller.OpenPlotfile(
                layer_name,
                self.pcbnew.PLOT_FORMAT_GERBER,
                description
            )
            plot_controller.PlotLayer()

            # 記錄生成的檔案
            gerber_file = output_path / f"{project_name}-{layer_name}.{ext}"
            plotted_files.append(str(gerber_file))

            print(f"  ✅ {description} ({layer_name})")

        plot_controller.ClosePlot()

        # 生成鑽孔檔
        print(f"🔨 生成鑽孔檔...")
        drill_file = self._generate_drill_file(board, output_path, project_name)
        if drill_file:
            plotted_files.append(drill_file)

        # 壓縮檔案
        zip_file = None
        if zip_output:
            print(f"📦 壓縮輸出檔案...")
            zip_file = self._zip_files(plotted_files, output_path, project_name)

        result = {
            'success': True,
            'output_dir': str(output_path),
            'files': plotted_files,
            'file_count': len(plotted_files),
            'project_name': project_name,
            'zip_file': zip_file,
            'timestamp': datetime.now().isoformat()
        }

        print(f"\n✅ Gerber 生成完成!")
        print(f"📁 輸出目錄: {output_path}")
        print(f"📄 檔案數量: {len(plotted_files)}")

        return result

    def _generate_drill_file(
        self,
        board,
        output_path: Path,
        project_name: str
    ) -> Optional[str]:
        """生成鑽孔檔"""
        try:
            drill_writer = self.pcbnew.EXCELLON_WRITER(board)
            drill_writer.SetFormat(False)  # 不使用公制格式標記

            mirror = False
            minimal_header = False
            offset = self.pcbnew.wxPoint(0, 0)
            merge_npth = False

            drill_writer.SetOptions(mirror, minimal_header, offset, merge_npth)
            drill_writer.SetMapFileFormat(self.pcbnew.PLOT_FORMAT_PDF)

            drill_writer.CreateDrillandMapFilesSet(
                str(output_path),
                True,   # 生成鑽孔檔
                False   # 不生成地圖檔
            )

            drill_file = output_path / f"{project_name}.drl"
            print(f"  ✅ 鑽孔檔 (.drl)")

            return str(drill_file) if drill_file.exists() else None

        except Exception as e:
            print(f"  ⚠️  鑽孔檔生成失敗: {e}")
            return None

    def _zip_files(
        self,
        files: List[str],
        output_path: Path,
        project_name: str
    ) -> str:
        """壓縮檔案"""
        zip_filename = output_path / f"{project_name}_gerbers.zip"

        with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file in files:
                if os.path.exists(file):
                    zipf.write(file, os.path.basename(file))

        print(f"  ✅ 壓縮檔: {zip_filename.name}")
        return str(zip_filename)

    def generate_all(
        self,
        input_file: str,
        output_dir: str,
        options: Optional[Dict] = None
    ) -> Dict:
        """
        生成所有製造文件

        Args:
            input_file: 輸入 PCB 檔案
            output_dir: 輸出目錄
            options: 選項字典

        Returns:
            生成結果
        """
        options = options or {}

        results = {
            'gerber': None,
            'drill': None,
            'bom': None,
            'position': None
        }

        # 生成 Gerber
        if options.get('gerber', True):
            results['gerber'] = self.generate(
                input_file,
                output_dir,
                zip_output=options.get('zip', False)
            )

        return results


class BatchGerberGenerator:
    """批次 Gerber 生成器"""

    def __init__(self, tool: str = 'kicad', config: Optional[dict] = None):
        self.generator = GerberGenerator(tool, config)

    def process(
        self,
        files: List[str],
        output_base_dir: str,
        manufacturer: Optional[str] = None,
        parallel: bool = False
    ) -> List[Dict]:
        """
        批次處理 PCB 檔案

        Args:
            files: PCB 檔案列表
            output_base_dir: 輸出基礎目錄
            manufacturer: 廠商名稱
            parallel: 是否平行處理

        Returns:
            結果列表
        """
        results = []

        for pcb_file in files:
            print(f"\n{'='*60}")
            print(f"處理: {pcb_file}")
            print(f"{'='*60}")

            try:
                # 為每個專案建立子目錄
                project_name = Path(pcb_file).stem
                output_dir = Path(output_base_dir) / project_name

                result = self.generator.generate(
                    pcb_file,
                    str(output_dir),
                    manufacturer=manufacturer,
                    zip_output=True
                )

                results.append({
                    'file': pcb_file,
                    'success': True,
                    'result': result
                })

            except Exception as e:
                print(f"❌ 處理失敗: {e}")
                results.append({
                    'file': pcb_file,
                    'success': False,
                    'error': str(e)
                })

        return results


if __name__ == "__main__":
    # 簡單測試
    print("PCB Gerber Generator")
    print("使用範例:")
    print("""
    gen = GerberGenerator(tool='kicad')
    gen.generate(
        input_file='board.kicad_pcb',
        output_dir='gerbers/',
        manufacturer='jlcpcb',
        zip_output=True
    )
    """)
