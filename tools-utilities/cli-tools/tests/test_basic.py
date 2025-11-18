#!/usr/bin/env python3
"""
Basic tests for CLI tools
Tests basic functionality of each tool
"""

import pytest
import subprocess
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestCLITools:
    """Test suite for CLI tools"""

    def test_filetree_help(self):
        """Test filetree --help"""
        result = subprocess.run(
            ['python', 'filetree.py', '--help'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert '智能目錄樹生成器' in result.stdout

    def test_sysmon_help(self):
        """Test sysmon --help"""
        result = subprocess.run(
            ['python', 'sysmon.py', '--help'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert 'System Monitor' in result.stdout

    def test_jsonql_help(self):
        """Test jsonql --help"""
        result = subprocess.run(
            ['python', 'jsonql.py', '--help'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert 'JSON Query Tool' in result.stdout

    def test_githelper_help(self):
        """Test githelper --help"""
        result = subprocess.run(
            ['python', 'githelper.py', '--help'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert 'Git Helper' in result.stdout

    def test_passgen_help(self):
        """Test passgen --help"""
        result = subprocess.run(
            ['python', 'passgen.py', '--help'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert '密碼生成器' in result.stdout

    def test_passgen_generate(self):
        """Test password generation"""
        result = subprocess.run(
            ['python', 'passgen.py', '--length', '16'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert len(result.stdout.strip()) == 16

    def test_filetree_current_dir(self):
        """Test filetree on current directory"""
        result = subprocess.run(
            ['python', 'filetree.py', '.', '--depth', '1'],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        assert result.returncode == 0
        assert 'py' in result.stdout or 'tests' in result.stdout


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
