"""
範例 setup.py - 展示專案依賴配置
"""

from setuptools import find_packages, setup

# 讀取 README
with open("README.md", "r", encoding="utf-8") as f:
    long_description = f.read()

# 讀取依賴
with open("requirements.txt", "r", encoding="utf-8") as f:
    requirements = [
        line.strip() for line in f if line.strip() and not line.startswith("#")
    ]

setup(
    name="example-project",
    version="1.0.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="範例專案 - 展示依賴管理",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/example-project",
    packages=find_packages(exclude=["tests", "docs"]),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
        "docs": [
            "sphinx>=7.0.0",
            "sphinx-rtd-theme>=2.0.0",
        ],
        "deploy": [
            "gunicorn>=21.0.0",
            "uvicorn[standard]>=0.24.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "example-cli=example_project.cli:main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)
