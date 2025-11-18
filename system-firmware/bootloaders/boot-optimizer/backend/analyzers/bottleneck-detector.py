#!/usr/bin/env python3
"""
bottleneck-detector.py - AI-powered boot bottleneck detection

Copyright (C) 2025 AI-Assisted Development Team
SPDX-License-Identifier: MIT

This script uses AI/ML techniques to automatically detect boot bottlenecks
and suggest optimization strategies.
"""

import json
import sys
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum


class BottleneckType(Enum):
    """Types of boot bottlenecks"""
    CPU_INTENSIVE = "cpu_intensive"
    IO_BOUND = "io_bound"
    NETWORK_DELAY = "network_delay"
    SYNCHRONOUS_WAIT = "synchronous_wait"
    DEPENDENCY_CHAIN = "dependency_chain"
    FIRMWARE_SLOW = "firmware_slow"
    DRIVER_INIT = "driver_init"


class Severity(Enum):
    """Bottleneck severity levels"""
    CRITICAL = "critical"  # >5s impact
    HIGH = "high"          # 2-5s impact
    MEDIUM = "medium"      # 0.5-2s impact
    LOW = "low"            # <0.5s impact


@dataclass
class Bottleneck:
    """Detected bottleneck information"""
    name: str
    type: BottleneckType
    severity: Severity
    time_impact_ms: float
    description: str
    root_cause: str
    suggestions: List[str]
    ai_confidence: float  # 0.0 - 1.0


class BottleneckDetector:
    """Detect and analyze boot bottlenecks"""

    def __init__(self):
        self.bottlenecks: List[Bottleneck] = []

    def load_boot_profile(self, filename: str) -> Dict:
        """Load boot profile from JSON file"""
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Error: File {filename} not found")
            return {}
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in {filename}")
            return {}

    def analyze_stages(self, stages: List[Dict]) -> List[Bottleneck]:
        """Analyze boot stages for bottlenecks"""
        detected = []

        for stage in stages:
            time_ms = stage.get('time_ms', 0)
            name = stage.get('name', 'Unknown')

            # Firmware bottleneck
            if 'firmware' in name.lower() and time_ms > 3000:
                detected.append(Bottleneck(
                    name=name,
                    type=BottleneckType.FIRMWARE_SLOW,
                    severity=Severity.HIGH if time_ms > 5000 else Severity.MEDIUM,
                    time_impact_ms=time_ms,
                    description=f"Firmware initialization is taking {time_ms/1000:.2f}s",
                    root_cause="POST (Power-On Self-Test) is performing extensive "
                              "hardware checks. Legacy BIOS/UEFI options may be enabled.",
                    suggestions=[
                        "Enable Fast Boot in BIOS/UEFI settings",
                        "Disable unused hardware (e.g., legacy USB support)",
                        "Update firmware to latest version",
                        "Reduce boot device search timeout",
                        "Disable network boot (PXE) if not needed"
                    ],
                    ai_confidence=0.9
                ))

            # Kernel stage bottleneck
            elif 'kernel' in name.lower() and time_ms > 2000:
                detected.append(Bottleneck(
                    name=name,
                    type=BottleneckType.CPU_INTENSIVE,
                    severity=Severity.HIGH if time_ms > 4000 else Severity.MEDIUM,
                    time_impact_ms=time_ms,
                    description=f"Kernel initialization is taking {time_ms/1000:.2f}s",
                    root_cause="Kernel is loading many modules or performing "
                              "synchronous device initialization.",
                    suggestions=[
                        "Compile frequently-used drivers into kernel (not as modules)",
                        "Remove unnecessary kernel modules",
                        "Enable asynchronous device probing",
                        "Use kernel parameter: probe_type=async",
                        "Optimize initramfs/initrd size",
                        "Enable kernel compression (LZ4 or ZSTD)"
                    ],
                    ai_confidence=0.85
                ))

            # Storage/IO bottleneck
            elif any(keyword in name.lower() for keyword in
                    ['storage', 'disk', 'sata', 'mmc', 'mount']) and time_ms > 1000:
                detected.append(Bottleneck(
                    name=name,
                    type=BottleneckType.IO_BOUND,
                    severity=Severity.MEDIUM if time_ms > 2000 else Severity.LOW,
                    time_impact_ms=time_ms,
                    description=f"Storage initialization is taking {time_ms/1000:.2f}s",
                    root_cause="Slow disk access, filesystem checks, or device enumeration.",
                    suggestions=[
                        "Use SSD instead of HDD if possible",
                        "Disable filesystem check on boot (tune2fs -c 0)",
                        "Use faster filesystem (ext4 with noatime)",
                        "Enable TRIM support for SSD",
                        "Use I/O scheduler optimized for your storage type"
                    ],
                    ai_confidence=0.8
                ))

            # Network bottleneck
            elif any(keyword in name.lower() for keyword in
                    ['network', 'net', 'dhcp', 'dns']) and time_ms > 1500:
                detected.append(Bottleneck(
                    name=name,
                    type=BottleneckType.NETWORK_DELAY,
                    severity=Severity.MEDIUM,
                    time_impact_ms=time_ms,
                    description=f"Network initialization is taking {time_ms/1000:.2f}s",
                    root_cause="Waiting for network connection, DHCP lease, "
                              "or DNS resolution.",
                    suggestions=[
                        "Use static IP if possible (avoid DHCP delay)",
                        "Reduce DHCP timeout",
                        "Configure network services as Type=idle",
                        "Defer non-critical network services",
                        "Use systemd network-online.target properly"
                    ],
                    ai_confidence=0.75
                ))

        return detected

    def analyze_services(self, services: List[Dict]) -> List[Bottleneck]:
        """Analyze services for bottlenecks"""
        detected = []

        # Get top 10 slowest services
        slow_services = sorted(services, key=lambda x: x.get('time_ms', 0), reverse=True)[:10]

        for service in slow_services:
            time_ms = service.get('time_ms', 0)
            name = service.get('name', 'Unknown')

            if time_ms > 5000:
                severity = Severity.CRITICAL
            elif time_ms > 2000:
                severity = Severity.HIGH
            elif time_ms > 1000:
                severity = Severity.MEDIUM
            else:
                continue  # Skip services < 1s

            # Determine bottleneck type based on service name
            bottleneck_type = BottleneckType.SYNCHRONOUS_WAIT
            root_cause = "Service is performing synchronous initialization"
            suggestions = [
                f"Profile {name} to identify slow operations",
                "Consider lazy loading or socket activation",
                "Move to after graphical.target if not critical",
                "Use Type=idle for non-essential services"
            ]

            # Database services
            if any(db in name.lower() for db in ['mysql', 'postgres', 'mongo', 'redis']):
                bottleneck_type = BottleneckType.IO_BOUND
                root_cause = "Database is performing initial data loading or recovery"
                suggestions.extend([
                    "Optimize database configuration for faster startup",
                    "Reduce InnoDB buffer pool warmup time",
                    "Use tmpfs for temporary data if possible"
                ])

            # Network services
            elif any(net in name.lower() for net in ['network', 'dhcp', 'named', 'bind']):
                bottleneck_type = BottleneckType.NETWORK_DELAY
                root_cause = "Network service is waiting for connection or timeout"
                suggestions.extend([
                    "Reduce timeout values",
                    "Use caching where possible",
                    "Configure DNS resolver locally"
                ])

            detected.append(Bottleneck(
                name=name,
                type=bottleneck_type,
                severity=severity,
                time_impact_ms=time_ms,
                description=f"{name} is taking {time_ms/1000:.2f}s to start",
                root_cause=root_cause,
                suggestions=suggestions,
                ai_confidence=0.7
            ))

        return detected

    def detect_dependency_chains(self, critical_chain: str) -> List[Bottleneck]:
        """Analyze critical dependency chain"""
        detected = []

        # Parse critical chain for long dependency paths
        # This is a simplified analysis
        if critical_chain:
            lines = critical_chain.split('\n')
            chain_depth = len([l for l in lines if '@' in l])

            if chain_depth > 5:
                detected.append(Bottleneck(
                    name="Service Dependency Chain",
                    type=BottleneckType.DEPENDENCY_CHAIN,
                    severity=Severity.MEDIUM,
                    time_impact_ms=0,  # Hard to quantify
                    description=f"Long service dependency chain detected ({chain_depth} services)",
                    root_cause="Services have unnecessary dependencies, "
                              "causing sequential startup",
                    suggestions=[
                        "Review service dependencies with 'systemctl list-dependencies'",
                        "Remove unnecessary After= and Requires= directives",
                        "Use socket activation to break dependency chains",
                        "Enable parallel service startup where possible"
                    ],
                    ai_confidence=0.6
                ))

        return detected

    def analyze_profile(self, profile_file: str) -> List[Bottleneck]:
        """Perform complete bottleneck analysis"""
        data = self.load_boot_profile(profile_file)

        if not data:
            return []

        bottlenecks = []

        # Analyze different data sources
        if 'stages' in data:
            bottlenecks.extend(self.analyze_stages(data['stages']))

        if 'slow_services' in data:
            bottlenecks.extend(self.analyze_services(data['slow_services']))

        if 'critical_chain' in data:
            bottlenecks.extend(self.detect_dependency_chains(data['critical_chain']))

        # Sort by severity and impact
        severity_order = {
            Severity.CRITICAL: 0,
            Severity.HIGH: 1,
            Severity.MEDIUM: 2,
            Severity.LOW: 3
        }

        bottlenecks.sort(key=lambda x: (severity_order[x.severity], -x.time_impact_ms))

        self.bottlenecks = bottlenecks
        return bottlenecks

    def print_report(self):
        """Print bottleneck analysis report"""
        print("\n" + "="*70)
        print("  AI-Powered Boot Bottleneck Analysis")
        print("="*70 + "\n")

        if not self.bottlenecks:
            print("✅ No significant bottlenecks detected!")
            print("   Your system boot is already well optimized.\n")
            return

        # Group by severity
        by_severity = {
            Severity.CRITICAL: [],
            Severity.HIGH: [],
            Severity.MEDIUM: [],
            Severity.LOW: []
        }

        for bottleneck in self.bottlenecks:
            by_severity[bottleneck.severity].append(bottleneck)

        # Print bottlenecks by severity
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            items = by_severity[severity]
            if not items:
                continue

            severity_emoji = {
                Severity.CRITICAL: '🔴',
                Severity.HIGH: '🟠',
                Severity.MEDIUM: '🟡',
                Severity.LOW: '🟢'
            }[severity]

            print(f"\n{severity_emoji} {severity.value.upper()} SEVERITY BOTTLENECKS:")
            print("-" * 70)

            for i, bottleneck in enumerate(items, 1):
                print(f"\n{i}. {bottleneck.name}")
                print(f"   Type: {bottleneck.type.value}")
                if bottleneck.time_impact_ms > 0:
                    print(f"   Impact: {bottleneck.time_impact_ms/1000:.2f}s")
                print(f"   AI Confidence: {bottleneck.ai_confidence*100:.0f}%")
                print(f"\n   📋 Description:")
                print(f"      {bottleneck.description}")
                print(f"\n   🔍 Root Cause:")
                print(f"      {bottleneck.root_cause}")
                print(f"\n   💡 Suggestions:")
                for j, suggestion in enumerate(bottleneck.suggestions, 1):
                    print(f"      {j}. {suggestion}")

        # Summary
        print("\n" + "="*70)
        print(f"Total bottlenecks detected: {len(self.bottlenecks)}")

        total_impact = sum(b.time_impact_ms for b in self.bottlenecks if b.time_impact_ms > 0)
        if total_impact > 0:
            print(f"Potential time savings: ~{total_impact/1000:.2f}s")
        print("="*70 + "\n")

    def export_json(self, filename: str = "bottleneck_analysis.json"):
        """Export bottleneck analysis to JSON"""
        data = {
            'total_bottlenecks': len(self.bottlenecks),
            'bottlenecks': [
                {
                    'name': b.name,
                    'type': b.type.value,
                    'severity': b.severity.value,
                    'time_impact_ms': b.time_impact_ms,
                    'description': b.description,
                    'root_cause': b.root_cause,
                    'suggestions': b.suggestions,
                    'ai_confidence': b.ai_confidence
                }
                for b in self.bottlenecks
            ]
        }

        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"Bottleneck analysis exported to {filename}")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python bottleneck-detector.py <boot_profile.json>")
        print("\nExample:")
        print("  python bottleneck-detector.py systemd_analysis.json")
        sys.exit(1)

    profile_file = sys.argv[1]

    detector = BottleneckDetector()
    bottlenecks = detector.analyze_profile(profile_file)

    if bottlenecks:
        detector.print_report()
        detector.export_json()
    else:
        print("Error: Could not analyze boot profile")
        sys.exit(1)


if __name__ == '__main__':
    main()
