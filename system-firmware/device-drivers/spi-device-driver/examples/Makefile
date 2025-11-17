# SPI 範例程式 Makefile

CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -lm

TARGETS = spi_loopback spi_flash_test

all: $(TARGETS)

spi_loopback: spi_loopback.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

spi_flash_test: spi_flash_test.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TARGETS)

.PHONY: all clean
