#!/usr/bin/env python3
"""
Test Report Generator
Generates comprehensive test reports in multiple formats
"""

import sys
import json
import datetime
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

class TestReport:
    """Test report generator"""

    def __init__(self):
        self.results = {
            'timestamp': datetime.datetime.now().isoformat(),
            'platform': self._get_platform_info(),
            'suites': {},
            'summary': {
                'total_tests': 0,
                'passed_tests': 0,
                'failed_tests': 0,
                'skipped_tests': 0
            }
        }

    def _get_platform_info(self) -> Dict:
        """Get platform information"""
        try:
            import platform
            return {
                'system': platform.system(),
                'machine': platform.machine(),
                'processor': platform.processor(),
                'python_version': platform.python_version()
            }
        except:
            return {
                'system': 'Unknown',
                'machine': 'Unknown',
                'processor': 'Unknown',
                'python_version': sys.version
            }

    def add_suite_result(self, suite_name: str, result: Dict):
        """Add test suite result"""
        self.results['suites'][suite_name] = result

        # Update summary
        self.results['summary']['total_tests'] += result.get('total', 0)
        self.results['summary']['passed_tests'] += result.get('passed', 0)
        self.results['summary']['failed_tests'] += result.get('failed', 0)
        self.results['summary']['skipped_tests'] += result.get('skipped', 0)

    def generate_json(self, output_file: str):
        """Generate JSON report"""
        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"JSON report generated: {output_file}")

    def generate_html(self, output_file: str):
        """Generate HTML report"""
        html = self._create_html_report()
        with open(output_file, 'w') as f:
            f.write(html)
        print(f"HTML report generated: {output_file}")

    def _create_html_report(self) -> str:
        """Create HTML report content"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firmware Test Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        h1 {{
            color: #2c3e50;
            text-align: center;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }}
        .metadata {{
            background: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .summary {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }}
        .metric {{
            display: inline-block;
            margin: 10px;
            padding: 15px 25px;
            background: rgba(255,255,255,0.2);
            border-radius: 5px;
        }}
        .metric-value {{
            font-size: 2em;
            font-weight: bold;
            display: block;
        }}
        .metric-label {{
            font-size: 0.9em;
            opacity: 0.9;
        }}
        .suite {{
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .suite h2 {{
            color: #34495e;
            margin-top: 0;
            border-left: 4px solid #3498db;
            padding-left: 10px;
        }}
        .status {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 3px;
            font-weight: bold;
            margin-left: 10px;
        }}
        .status.passed {{
            background-color: #2ecc71;
            color: white;
        }}
        .status.failed {{
            background-color: #e74c3c;
            color: white;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <h1>Firmware Development Test Report</h1>

    <div class="metadata">
        <strong>Generated:</strong> {self.results['timestamp']}<br>
        <strong>Platform:</strong> {self.results['platform']['system']} {self.results['platform']['machine']}<br>
        <strong>Processor:</strong> {self.results['platform']['processor']}
    </div>

    <div class="summary">
        <h2 style="color: white; margin-top: 0;">Test Summary</h2>
        <div class="metric">
            <span class="metric-value">{self.results['summary']['total_tests']}</span>
            <span class="metric-label">Total Tests</span>
        </div>
        <div class="metric">
            <span class="metric-value">{self.results['summary']['passed_tests']}</span>
            <span class="metric-label">Passed</span>
        </div>
        <div class="metric">
            <span class="metric-value">{self.results['summary']['failed_tests']}</span>
            <span class="metric-label">Failed</span>
        </div>
        <div class="metric">
            <span class="metric-value">{self.results['summary']['skipped_tests']}</span>
            <span class="metric-label">Skipped</span>
        </div>
    </div>

    {self._generate_suite_sections()}

    <div class="metadata" style="margin-top: 30px;">
        <strong>Report Format:</strong> HTML<br>
        <strong>Generator:</strong> test_report.py<br>
        <strong>Version:</strong> 1.0
    </div>
</body>
</html>"""

    def _generate_suite_sections(self) -> str:
        """Generate HTML sections for each test suite"""
        sections = []

        for suite_name, suite_data in self.results['suites'].items():
            status_class = "passed" if suite_data.get('failed', 0) == 0 else "failed"
            status_text = "PASSED" if suite_data.get('failed', 0) == 0 else "FAILED"

            section = f"""
    <div class="suite">
        <h2>{suite_name} <span class="status {status_class}">{status_text}</span></h2>
        <p>
            Total: {suite_data.get('total', 0)} |
            Passed: {suite_data.get('passed', 0)} |
            Failed: {suite_data.get('failed', 0)} |
            Skipped: {suite_data.get('skipped', 0)}
        </p>
    </div>"""

            sections.append(section)

        return '\n'.join(sections)

    def generate_markdown(self, output_file: str):
        """Generate Markdown report"""
        md = self._create_markdown_report()
        with open(output_file, 'w') as f:
            f.write(md)
        print(f"Markdown report generated: {output_file}")

    def _create_markdown_report(self) -> str:
        """Create Markdown report content"""
        return f"""# Firmware Development Test Report

**Generated:** {self.results['timestamp']}
**Platform:** {self.results['platform']['system']} {self.results['platform']['machine']}

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | {self.results['summary']['total_tests']} |
| Passed | {self.results['summary']['passed_tests']} |
| Failed | {self.results['summary']['failed_tests']} |
| Skipped | {self.results['summary']['skipped_tests']} |

## Test Suites

{self._generate_suite_markdown()}

---

**Report Generator:** test_report.py v1.0
"""

    def _generate_suite_markdown(self) -> str:
        """Generate Markdown sections for test suites"""
        sections = []

        for suite_name, suite_data in self.results['suites'].items():
            status = "✅ PASSED" if suite_data.get('failed', 0) == 0 else "❌ FAILED"

            section = f"""### {suite_name} {status}

- Total: {suite_data.get('total', 0)}
- Passed: {suite_data.get('passed', 0)}
- Failed: {suite_data.get('failed', 0)}
- Skipped: {suite_data.get('skipped', 0)}
"""
            sections.append(section)

        return '\n'.join(sections)


def main():
    """Main entry point"""
    print("Firmware Development Test Report Generator")
    print("==========================================\n")

    # Create report
    report = TestReport()

    # Add sample results (in production, parse actual test output)
    report.add_suite_result('Unit Tests', {
        'total': 24,
        'passed': 24,
        'failed': 0,
        'skipped': 0
    })

    report.add_suite_result('Integration Tests', {
        'total': 15,
        'passed': 15,
        'failed': 0,
        'skipped': 0
    })

    report.add_suite_result('Performance Tests', {
        'total': 18,
        'passed': 18,
        'failed': 0,
        'skipped': 0
    })

    report.add_suite_result('Hardware Tests', {
        'total': 21,
        'passed': 21,
        'failed': 0,
        'skipped': 0
    })

    # Generate reports
    report.generate_json('test_report.json')
    report.generate_html('test_report.html')
    report.generate_markdown('test_report.md')

    print("\n✅ All reports generated successfully!")
    print("\nGenerated files:")
    print("  - test_report.json (machine-readable)")
    print("  - test_report.html (detailed HTML report)")
    print("  - test_report.md (Markdown summary)")


if __name__ == '__main__':
    main()
