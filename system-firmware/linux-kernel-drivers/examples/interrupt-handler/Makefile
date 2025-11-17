# Makefile for interrupt handler examples

CC = gcc
CFLAGS = -Wall -O2

TARGETS = simulate_irq

.PHONY: all clean test

all: $(TARGETS)

simulate_irq: simulate_irq.c
	$(CC) $(CFLAGS) -o $@ $<

test: all
	@echo "測試腳本:"
	@echo "  sudo ./test_interrupt.sh"
	@echo ""
	@echo "監控工具:"
	@echo "  sudo ./monitor_irq.sh"
	@echo "  sudo ./monitor_irq.sh -w      # 持續監控"
	@echo "  sudo ./monitor_irq.sh -i 1    # 監控特定 IRQ"
	@echo ""
	@echo "中斷模擬器（演示）:"
	@echo "  ./simulate_irq [interval_seconds]"

clean:
	rm -f $(TARGETS) *.o
