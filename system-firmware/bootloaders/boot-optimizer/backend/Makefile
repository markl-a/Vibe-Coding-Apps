# Makefile for Boot Optimizer Backend
#
# Copyright (C) 2025 AI-Assisted Development Team
# SPDX-License-Identifier: MIT

# Compiler and flags
CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c11
LDFLAGS =

# Python interpreter
PYTHON = python3

# Directories
PROFILERS_DIR = profilers
ANALYZERS_DIR = analyzers
BUILD_DIR = build
BIN_DIR = bin

# Source files
C_SOURCES = $(wildcard $(PROFILERS_DIR)/*.c)
PY_SOURCES = $(wildcard $(PROFILERS_DIR)/*.py) $(wildcard $(ANALYZERS_DIR)/*.py)
SH_SOURCES = $(wildcard $(PROFILERS_DIR)/*.sh)

# Binary outputs
C_BINARIES = $(patsubst $(PROFILERS_DIR)/%.c,$(BIN_DIR)/%,$(C_SOURCES))

# Targets
.PHONY: all clean test install help

all: directories $(C_BINARIES) scripts
	@echo ""
	@echo "✅ Build complete!"
	@echo ""
	@echo "Available tools:"
	@echo "  - $(BIN_DIR)/boottime-profiler      : C boot time profiler"
	@echo "  - $(PROFILERS_DIR)/systemd-analyzer.py    : SystemD analyzer"
	@echo "  - $(PROFILERS_DIR)/kernel-profiler.sh     : Kernel profiler"
	@echo "  - $(ANALYZERS_DIR)/bottleneck-detector.py : Bottleneck detector"
	@echo ""

# Create directories
directories:
	@mkdir -p $(BUILD_DIR)
	@mkdir -p $(BIN_DIR)

# Compile C programs
$(BIN_DIR)/%: $(PROFILERS_DIR)/%.c
	@echo "Compiling $<..."
	@$(CC) $(CFLAGS) -DBOOT_PROFILER_EXAMPLE $< -o $@ $(LDFLAGS)

# Make Python scripts executable
scripts: $(PY_SOURCES)
	@echo "Making Python scripts executable..."
	@chmod +x $(PROFILERS_DIR)/*.py 2>/dev/null || true
	@chmod +x $(ANALYZERS_DIR)/*.py 2>/dev/null || true
	@chmod +x $(PROFILERS_DIR)/*.sh 2>/dev/null || true
	@echo "Scripts are ready to use"

# Install system-wide (requires sudo)
install: all
	@echo "Installing boot-optimizer tools..."
	@sudo cp $(BIN_DIR)/* /usr/local/bin/
	@sudo cp $(PROFILERS_DIR)/*.py /usr/local/bin/
	@sudo cp $(PROFILERS_DIR)/*.sh /usr/local/bin/
	@sudo cp $(ANALYZERS_DIR)/*.py /usr/local/bin/
	@echo "Installation complete!"

# Test the tools
test: all
	@echo ""
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║              Testing Boot Optimizer Tools                   ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Testing C profiler..."
	@$(BIN_DIR)/boottime-profiler
	@echo ""
	@echo "Testing SystemD analyzer..."
	@$(PYTHON) $(PROFILERS_DIR)/systemd-analyzer.py || echo "Note: Requires systemd-analyze"
	@echo ""
	@echo "Testing kernel profiler..."
	@bash $(PROFILERS_DIR)/kernel-profiler.sh || echo "Note: Requires Linux kernel"
	@echo ""
	@echo "Testing bottleneck detector..."
	@if [ -f systemd_analysis.json ]; then \
		$(PYTHON) $(ANALYZERS_DIR)/bottleneck-detector.py systemd_analysis.json; \
	else \
		echo "Run systemd-analyzer.py first to generate test data"; \
	fi

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@rm -rf $(BIN_DIR)
	@rm -f *.json *.log
	@rm -rf kernel_profile_*
	@echo "Clean complete!"

# Help target
help:
	@echo "Boot Optimizer Backend - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  make all      - Build all tools (default)"
	@echo "  make test     - Build and test all tools"
	@echo "  make install  - Install tools system-wide (requires sudo)"
	@echo "  make clean    - Remove build artifacts"
	@echo "  make help     - Show this help message"
	@echo ""
	@echo "Individual tools:"
	@echo "  C Profiler:       $(BIN_DIR)/boottime-profiler"
	@echo "  SystemD Analyzer: $(PROFILERS_DIR)/systemd-analyzer.py"
	@echo "  Kernel Profiler:  $(PROFILERS_DIR)/kernel-profiler.sh"
	@echo "  Bottleneck Det.:  $(ANALYZERS_DIR)/bottleneck-detector.py"
	@echo ""
	@echo "Usage examples:"
	@echo "  # Profile embedded system boot"
	@echo "  ./$(BIN_DIR)/boottime-profiler"
	@echo ""
	@echo "  # Analyze SystemD boot"
	@echo "  python3 $(PROFILERS_DIR)/systemd-analyzer.py"
	@echo ""
	@echo "  # Profile kernel boot"
	@echo "  sudo bash $(PROFILERS_DIR)/kernel-profiler.sh"
	@echo ""
	@echo "  # Detect bottlenecks"
	@echo "  python3 $(ANALYZERS_DIR)/bottleneck-detector.py systemd_analysis.json"
	@echo ""
