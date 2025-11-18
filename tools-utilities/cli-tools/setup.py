#!/usr/bin/env python3
"""
Setup script for CLI Tools
AI-assisted command-line utilities installation
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README
readme_file = Path(__file__).parent / "README.md"
long_description = readme_file.read_text(encoding='utf-8') if readme_file.exists() else ""

# Read requirements
requirements_file = Path(__file__).parent / "requirements.txt"
requirements = []
if requirements_file.exists():
    with open(requirements_file, 'r', encoding='utf-8') as f:
        requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]

setup(
    name="vibe-cli-tools",
    version="1.0.0",
    description="AI-assisted command-line utilities for developers",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Vibe Coding Apps",
    author_email="contact@vibe-coding.com",
    url="https://github.com/markl-a/Vibe-Coding-Apps",
    license="MIT",

    # Python version requirement
    python_requires=">=3.8",

    # Dependencies
    install_requires=requirements,

    # Entry points for command-line scripts
    entry_points={
        'console_scripts': [
            'vibe-filetree=filetree:main',
            'vibe-sysmon=sysmon:main',
            'vibe-githelper=githelper:main',
            'vibe-jsonql=jsonql:main',
            'vibe-passgen=passgen:main',
            'vibe-todo=todo_cli.todo:main',
            'vibe-fileorg=file_organizer.file_organizer:main',
            'vibe-mdpreview=markdown_preview.markdown_preview:main',
        ],
    },

    # Package data
    py_modules=[
        'filetree',
        'sysmon',
        'githelper',
        'jsonql',
        'passgen',
    ],

    packages=find_packages(),

    # Classifiers
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Utilities",
        "Operating System :: OS Independent",
    ],

    # Keywords
    keywords="cli tools utilities ai-assisted developer-tools",

    # Project URLs
    project_urls={
        "Bug Reports": "https://github.com/markl-a/Vibe-Coding-Apps/issues",
        "Source": "https://github.com/markl-a/Vibe-Coding-Apps",
        "Documentation": "https://github.com/markl-a/Vibe-Coding-Apps/tree/main/tools-utilities/cli-tools",
    },
)
