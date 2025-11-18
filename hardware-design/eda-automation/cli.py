#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EDA 自動化工具 CLI
命令行介面
"""

import click
import os
import sys
from pathlib import Path

# 添加 src 到路徑
sys.path.insert(0, str(Path(__file__).parent))


@click.group()
@click.version_option(version='0.2.0')
def cli():
    """🤖 EDA 自動化工具命令行介面"""
    pass


@cli.group()
def script():
    """腳本生成相關命令"""
    pass


@script.command('generate')
@click.argument('task', type=str)
@click.option('--tool', '-t', default='kicad', type=click.Choice(['kicad', 'altium', 'eagle']), help='EDA 工具')
@click.option('--model', '-m', default='gpt-4', help='AI 模型')
@click.option('--output', '-o', type=click.Path(), help='輸出檔案路徑')
@click.option('--execute', '-e', is_flag=True, help='立即執行腳本')
def generate_script(task, tool, model, output, execute):
    """生成 EDA 腳本"""
    from src.script_generator import ScriptGenerator

    click.echo(f"🤖 使用 {model} 生成 {tool} 腳本...")

    try:
        gen = ScriptGenerator(tool=tool, model=model)
        script = gen.generate(task)

        # 保存腳本
        if output:
            script.save(output)
            click.echo(f"✅ 腳本已保存: {output}")
        else:
            click.echo("\n生成的腳本:")
            click.echo("-" * 60)
            click.echo(script.code)
            click.echo("-" * 60)

        # 執行腳本
        if execute:
            click.echo("\n執行腳本...")
            result = script.execute()
            if result['success']:
                click.echo("✅ 執行成功")
            else:
                click.echo(f"❌ 執行失敗: {result['error']}", err=True)

    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@cli.group()
def optimize():
    """設計優化相關命令"""
    pass


@optimize.command('analyze')
@click.argument('pcb_file', type=click.Path(exists=True))
@click.option('--model', '-m', default='gpt-4', help='AI 模型')
@click.option('--focus', '-f', multiple=True, type=click.Choice(['power', 'signal_integrity', 'layout', 'routing']), help='關注領域')
@click.option('--output', '-o', type=click.Path(), help='報告輸出路徑')
@click.option('--format', type=click.Choice(['html', 'md', 'txt']), default='html', help='報告格式')
def analyze_design(pcb_file, model, focus, output, format):
    """分析 PCB 設計"""
    from src.ai_optimizer import AIDesignOptimizer

    click.echo(f"🔍 分析設計: {pcb_file}")

    try:
        optimizer = AIDesignOptimizer(model=model)
        suggestions = optimizer.analyze_board(pcb_file, focus_areas=list(focus) if focus else None)

        click.echo(f"\n找到 {len(suggestions)} 個建議:")
        for i, sug in enumerate(suggestions, 1):
            click.echo(f"{i}. {sug}")

        # 生成報告
        if output:
            optimizer.generate_optimization_report(suggestions, output, format=format)
            click.echo(f"\n✅ 報告已生成: {output}")

    except ImportError:
        click.echo("❌ 需要 KiCAD 環境（pcbnew 模組）", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@cli.group()
def bom():
    """BOM 相關命令"""
    pass


@bom.command('extract')
@click.argument('pcb_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), required=True, help='輸出檔案路徑')
@click.option('--format', type=click.Choice(['csv', 'xlsx']), default='csv', help='輸出格式')
def extract_bom(pcb_file, output, format):
    """從 PCB 提取 BOM"""
    sys.path.insert(0, str(Path(__file__).parent / 'bom-manager/src'))

    from bom_manager import BOMManager

    click.echo(f"📋 從 {pcb_file} 提取 BOM...")

    try:
        bom_mgr = BOMManager()
        bom_mgr.extract_from_kicad(pcb_file)

        if format == 'csv':
            bom_mgr.export_csv(output)
        else:
            bom_mgr.export_excel(output)

        click.echo(f"✅ BOM 已導出: {output}")
        click.echo(f"  總元件: {bom_mgr.total_components}")
        click.echo(f"  種類: {bom_mgr.unique_components}")

    except ImportError:
        click.echo("❌ 需要 KiCAD 環境（pcbnew 模組）", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@bom.command('cost')
@click.argument('bom_file', type=click.Path(exists=True))
@click.option('--quantity', '-q', type=int, default=1, help='板子數量')
@click.option('--suppliers', '-s', multiple=True, type=click.Choice(['digikey', 'mouser', 'lcsc']), help='供應商')
@click.option('--output', '-o', type=click.Path(), help='報告輸出路徑')
@click.option('--format', type=click.Choice(['html', 'csv', 'json']), default='html', help='報告格式')
def estimate_cost(bom_file, quantity, suppliers, output, format):
    """估算 BOM 成本"""
    from src.supplier_integration import SupplierIntegration
    import json

    click.echo(f"💰 估算成本: {bom_file} (數量: {quantity})")

    try:
        # 讀取 BOM
        with open(bom_file, 'r', encoding='utf-8') as f:
            if bom_file.endswith('.json'):
                bom = json.load(f)
            else:
                # 假設是簡單格式
                click.echo("❌ 目前只支援 JSON 格式的 BOM 文件", err=True)
                sys.exit(1)

        # 估算成本
        supplier_list = list(suppliers) if suppliers else ['digikey', 'mouser', 'lcsc']
        integration = SupplierIntegration(suppliers=supplier_list)

        estimate = integration.estimate_bom_cost(bom, quantity=quantity)

        click.echo(f"\n✅ 成本估算完成:")
        click.echo(f"  總成本: ${estimate['total_cost']:.2f}")
        click.echo(f"  單板成本: ${estimate['cost_per_board']:.2f}")
        click.echo(f"  可用元件: {estimate['available_components']}/{estimate['component_count']}")
        click.echo(f"  最長交期: {estimate['max_lead_time_days']} 天")

        # 生成報告
        if output:
            integration.generate_cost_report(estimate, output, format=format)
            click.echo(f"\n✅ 報告已生成: {output}")

    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@cli.group()
def gerber():
    """Gerber 生成相關命令"""
    pass


@gerber.command('generate')
@click.argument('pcb_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), required=True, help='輸出目錄')
@click.option('--manufacturer', '-m', type=click.Choice(['jlcpcb', 'pcbway', 'oshpark']), help='製造商')
@click.option('--zip', '-z', is_flag=True, help='壓縮輸出')
def generate_gerber(pcb_file, output, manufacturer, zip):
    """生成 Gerber 檔案"""
    sys.path.insert(0, str(Path(__file__).parent / 'pcb-gerber-generator/src'))

    from generator import GerberGenerator

    click.echo(f"📦 生成 Gerber: {pcb_file}")

    try:
        gen = GerberGenerator(tool='kicad')
        result = gen.generate(
            pcb_file,
            output,
            manufacturer=manufacturer,
            zip_output=zip
        )

        click.echo(f"\n✅ Gerber 生成完成:")
        click.echo(f"  輸出目錄: {result['output_dir']}")
        click.echo(f"  檔案數量: {result['file_count']}")
        if result.get('zip_file'):
            click.echo(f"  壓縮檔: {result['zip_file']}")

    except ImportError:
        click.echo("❌ 需要 KiCAD 環境（pcbnew 模組）", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@cli.group()
def drc():
    """DRC 檢查相關命令"""
    pass


@drc.command('check')
@click.argument('pcb_file', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), help='報告輸出路徑')
@click.option('--format', type=click.Choice(['html', 'json', 'text']), default='html', help='報告格式')
def check_drc(pcb_file, output, format):
    """執行 DRC 檢查"""
    sys.path.insert(0, str(Path(__file__).parent / 'batch-drc-checker/src'))

    from drc_checker import DRCChecker

    click.echo(f"🔍 DRC 檢查: {pcb_file}")

    try:
        checker = DRCChecker()
        checker.load_board(pcb_file)
        result = checker.run_drc()

        click.echo(f"\n檢查結果:")
        click.echo(f"  狀態: {'✅ 通過' if result.passed else '❌ 失敗'}")
        click.echo(f"  錯誤: {result.error_count}")
        click.echo(f"  警告: {result.warning_count}")

        # 顯示錯誤
        if result.errors:
            click.echo("\n錯誤:")
            for error in result.errors[:5]:  # 只顯示前 5 個
                click.echo(f"  - {error}")

        # 生成報告
        if output:
            checker.generate_report(result, output, format=format)
            click.echo(f"\n✅ 報告已生成: {output}")

    except ImportError:
        click.echo("❌ 需要 KiCAD 環境（pcbnew 模組）", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"❌ 錯誤: {e}", err=True)
        sys.exit(1)


@cli.command()
def demo():
    """運行完整示例"""
    click.echo("🤖 運行完整工作流程示例...\n")

    demo_file = Path(__file__).parent / 'examples' / 'complete_workflow_demo.py'

    if not demo_file.exists():
        click.echo("❌ 找不到示例文件", err=True)
        sys.exit(1)

    import subprocess
    result = subprocess.run([sys.executable, str(demo_file)])
    sys.exit(result.returncode)


@cli.command()
def info():
    """顯示工具資訊"""
    click.echo("🤖 EDA 自動化工具")
    click.echo("\n版本: 0.2.0")
    click.echo("作者: Vibe Coding Apps")
    click.echo("\n功能模組:")
    click.echo("  ✓ AI 腳本生成器")
    click.echo("  ✓ 設計優化分析")
    click.echo("  ✓ BOM 管理器")
    click.echo("  ✓ 成本估算")
    click.echo("  ✓ Gerber 生成器")
    click.echo("  ✓ DRC 檢查器")
    click.echo("\n支援的 EDA 工具:")
    click.echo("  - KiCAD (完全支援)")
    click.echo("  - Altium Designer (部分支援)")
    click.echo("  - Eagle (部分支援)")
    click.echo("\n使用說明: eda-cli --help")


if __name__ == '__main__':
    cli()
