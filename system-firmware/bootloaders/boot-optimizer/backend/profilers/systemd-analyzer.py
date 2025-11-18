#!/usr/bin/env python3
"""
systemd-analyzer.py - Analyze systemd boot performance

Copyright (C) 2025 AI-Assisted Development Team
SPDX-License-Identifier: MIT

This script analyzes systemd boot performance using systemd-analyze
and provides detailed reports with AI-powered optimization suggestions.
"""

import subprocess
import re
import json
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict


@dataclass
class BootStage:
    """Boot stage timing information"""
    name: str
    time_ms: float


@dataclass
class ServiceTiming:
    """Service initialization timing"""
    name: str
    time_ms: float
    active_ms: float
    startup_type: str = "unknown"


@dataclass
class BootAnalysis:
    """Complete boot analysis result"""
    timestamp: str
    total_time_ms: float
    stages: List[BootStage]
    slow_services: List[ServiceTiming]
    critical_chain: str
    recommendations: List[Dict[str, str]]


class SystemdAnalyzer:
    """Analyze systemd boot performance"""

    def __init__(self):
        self.analysis = None

    def check_systemd_available(self) -> bool:
        """Check if systemd-analyze is available"""
        try:
            subprocess.run(['systemd-analyze', '--version'],
                         capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def parse_time(self, time_str: str) -> float:
        """Parse time string to milliseconds"""
        # Handle formats like "1.234s", "123.4ms", "1min 23.456s"
        time_str = time_str.strip()
        total_ms = 0.0

        # Minutes
        min_match = re.search(r'(\d+(?:\.\d+)?)min', time_str)
        if min_match:
            total_ms += float(min_match.group(1)) * 60000

        # Seconds
        sec_match = re.search(r'(\d+(?:\.\d+)?)s', time_str)
        if sec_match:
            total_ms += float(sec_match.group(1)) * 1000

        # Milliseconds
        ms_match = re.search(r'(\d+(?:\.\d+)?)ms', time_str)
        if ms_match:
            total_ms += float(ms_match.group(1))

        return total_ms

    def get_boot_time(self) -> Dict[str, float]:
        """Get boot time breakdown"""
        try:
            result = subprocess.run(
                ['systemd-analyze', 'time'],
                capture_output=True,
                text=True,
                check=True
            )

            output = result.stdout
            stages = {}

            # Parse firmware time
            firmware_match = re.search(r'(\S+)\s+\(firmware\)', output)
            if firmware_match:
                stages['firmware'] = self.parse_time(firmware_match.group(1))

            # Parse loader time
            loader_match = re.search(r'(\S+)\s+\(loader\)', output)
            if loader_match:
                stages['loader'] = self.parse_time(loader_match.group(1))

            # Parse kernel time
            kernel_match = re.search(r'(\S+)\s+\(kernel\)', output)
            if kernel_match:
                stages['kernel'] = self.parse_time(kernel_match.group(1))

            # Parse initrd time
            initrd_match = re.search(r'(\S+)\s+\(initrd\)', output)
            if initrd_match:
                stages['initrd'] = self.parse_time(initrd_match.group(1))

            # Parse userspace time
            userspace_match = re.search(r'(\S+)\s+\(userspace\)', output)
            if userspace_match:
                stages['userspace'] = self.parse_time(userspace_match.group(1))

            # Total time
            total_match = re.search(r'=\s*(\S+)', output)
            if total_match:
                stages['total'] = self.parse_time(total_match.group(1))

            return stages

        except subprocess.CalledProcessError as e:
            print(f"Error running systemd-analyze time: {e}")
            return {}

    def get_blame_list(self) -> List[ServiceTiming]:
        """Get list of services sorted by initialization time"""
        try:
            result = subprocess.run(
                ['systemd-analyze', 'blame'],
                capture_output=True,
                text=True,
                check=True
            )

            services = []
            for line in result.stdout.split('\n'):
                match = re.match(r'\s*(\S+)\s+(.+)', line)
                if match:
                    time_str = match.group(1)
                    service_name = match.group(2).strip()

                    time_ms = self.parse_time(time_str)

                    services.append(ServiceTiming(
                        name=service_name,
                        time_ms=time_ms,
                        active_ms=time_ms
                    ))

            return sorted(services, key=lambda x: x.time_ms, reverse=True)

        except subprocess.CalledProcessError as e:
            print(f"Error running systemd-analyze blame: {e}")
            return []

    def get_critical_chain(self) -> str:
        """Get critical chain of service dependencies"""
        try:
            result = subprocess.run(
                ['systemd-analyze', 'critical-chain'],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout

        except subprocess.CalledProcessError as e:
            print(f"Error running systemd-analyze critical-chain: {e}")
            return ""

    def generate_recommendations(self,
                                stages: Dict[str, float],
                                services: List[ServiceTiming]) -> List[Dict[str, str]]:
        """Generate optimization recommendations using AI insights"""
        recommendations = []

        # Firmware stage analysis
        firmware_time = stages.get('firmware', 0)
        if firmware_time > 3000:  # > 3 seconds
            recommendations.append({
                'type': 'firmware',
                'severity': 'high',
                'issue': f'Firmware initialization takes {firmware_time/1000:.2f}s',
                'suggestion': 'Enable Fast Boot in BIOS/UEFI settings. '
                            'Disable unnecessary hardware checks.',
                'ai_insight': 'Modern UEFI firmware can skip POST checks and '
                            'reduce boot time by 50-70%.'
            })

        # Kernel stage analysis
        kernel_time = stages.get('kernel', 0)
        if kernel_time > 2000:  # > 2 seconds
            recommendations.append({
                'type': 'kernel',
                'severity': 'medium',
                'issue': f'Kernel initialization takes {kernel_time/1000:.2f}s',
                'suggestion': 'Reduce kernel modules, optimize initramfs size. '
                            'Consider using LTO (Link Time Optimization).',
                'ai_insight': 'Kernel can be optimized by disabling unused drivers '
                            'and using kernel compression (lz4/zstd).'
            })

        # Initrd analysis
        initrd_time = stages.get('initrd', 0)
        if initrd_time > 1000:  # > 1 second
            recommendations.append({
                'type': 'initrd',
                'severity': 'medium',
                'issue': f'Initrd loading takes {initrd_time/1000:.2f}s',
                'suggestion': 'Minimize initramfs contents. Use dracut with '
                            '--hostonly flag to include only necessary modules.',
                'ai_insight': 'Host-only initramfs can reduce size by 80% and '
                            'boot time by 40-60%.'
            })

        # Analyze slow services
        for service in services[:5]:  # Top 5 slowest
            if service.time_ms > 5000:  # > 5 seconds
                recommendations.append({
                    'type': 'service',
                    'severity': 'high',
                    'target': service.name,
                    'issue': f'{service.name} takes {service.time_ms/1000:.2f}s',
                    'suggestion': 'Consider lazy loading or moving to after '
                                'graphical.target. Use Type=idle for non-critical services.',
                    'ai_insight': 'Deferring non-essential services can improve '
                                'perceived boot time by 30-50%.'
                })
            elif service.time_ms > 2000:  # > 2 seconds
                recommendations.append({
                    'type': 'service',
                    'severity': 'medium',
                    'target': service.name,
                    'issue': f'{service.name} takes {service.time_ms/1000:.2f}s',
                    'suggestion': 'Profile service startup. Check for synchronous '
                                'operations that could be parallelized.',
                    'ai_insight': 'Many services can benefit from async initialization '
                                'and socket activation.'
                })

        # General optimization tips
        if not recommendations:
            recommendations.append({
                'type': 'general',
                'severity': 'info',
                'issue': 'Boot time is already optimized',
                'suggestion': 'Continue monitoring boot performance. '
                            'Consider using systemd.show_status=0 for cleaner boot.',
                'ai_insight': 'Maintain current configuration but monitor for regressions.'
            })

        return recommendations

    def analyze(self) -> Optional[BootAnalysis]:
        """Perform complete boot analysis"""
        if not self.check_systemd_available():
            print("Error: systemd-analyze is not available")
            return None

        print("Analyzing systemd boot performance...")

        # Get boot stages
        stages_dict = self.get_boot_time()
        stages = [
            BootStage(name=name, time_ms=time)
            for name, time in stages_dict.items()
            if name != 'total'
        ]

        total_time = stages_dict.get('total', 0)

        # Get service timings
        services = self.get_blame_list()

        # Get critical chain
        critical_chain = self.get_critical_chain()

        # Generate recommendations
        recommendations = self.generate_recommendations(stages_dict, services)

        self.analysis = BootAnalysis(
            timestamp=datetime.now().isoformat(),
            total_time_ms=total_time,
            stages=stages,
            slow_services=services[:20],  # Top 20
            critical_chain=critical_chain,
            recommendations=recommendations
        )

        return self.analysis

    def print_report(self):
        """Print analysis report to console"""
        if not self.analysis:
            print("No analysis data available")
            return

        print("\n" + "="*70)
        print("  SystemD Boot Performance Analysis")
        print("="*70 + "\n")

        # Boot stages
        print("📊 Boot Stages:")
        print("-" * 70)
        for stage in self.analysis.stages:
            bar_length = int(stage.time_ms / 100)  # Scale for display
            bar = "█" * min(bar_length, 50)
            print(f"{stage.name:15} {stage.time_ms/1000:>7.3f}s  {bar}")

        print(f"\n{'Total':15} {self.analysis.total_time_ms/1000:>7.3f}s")
        print("-" * 70 + "\n")

        # Slow services
        print("🐌 Top 10 Slowest Services:")
        print("-" * 70)
        for i, service in enumerate(self.analysis.slow_services[:10], 1):
            print(f"{i:2}. {service.time_ms/1000:>6.2f}s  {service.name}")
        print()

        # Critical chain
        if self.analysis.critical_chain:
            print("🔗 Critical Chain:")
            print("-" * 70)
            print(self.analysis.critical_chain)

        # Recommendations
        if self.analysis.recommendations:
            print("\n💡 Optimization Recommendations:")
            print("-" * 70)
            for i, rec in enumerate(self.analysis.recommendations, 1):
                severity_emoji = {
                    'high': '🔴',
                    'medium': '🟡',
                    'low': '🟢',
                    'info': 'ℹ️'
                }.get(rec.get('severity', 'info'), 'ℹ️')

                print(f"\n{i}. {severity_emoji} {rec.get('target', rec['type']).upper()}")
                print(f"   Issue: {rec['issue']}")
                print(f"   Suggestion: {rec['suggestion']}")
                if 'ai_insight' in rec:
                    print(f"   🤖 AI Insight: {rec['ai_insight']}")

        print("\n" + "="*70 + "\n")

    def export_json(self, filename: str = "systemd_analysis.json"):
        """Export analysis to JSON file"""
        if not self.analysis:
            print("No analysis data available")
            return

        # Convert dataclasses to dict
        data = {
            'timestamp': self.analysis.timestamp,
            'total_time_ms': self.analysis.total_time_ms,
            'stages': [asdict(stage) for stage in self.analysis.stages],
            'slow_services': [asdict(svc) for svc in self.analysis.slow_services],
            'critical_chain': self.analysis.critical_chain,
            'recommendations': self.analysis.recommendations
        }

        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Analysis exported to {filename}")


def main():
    """Main entry point"""
    analyzer = SystemdAnalyzer()

    # Perform analysis
    result = analyzer.analyze()

    if result:
        # Print report
        analyzer.print_report()

        # Export to JSON
        analyzer.export_json()


if __name__ == '__main__':
    main()
