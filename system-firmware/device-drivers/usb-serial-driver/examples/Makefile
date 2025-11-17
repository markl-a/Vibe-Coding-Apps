# USB Serial 範例程式 Makefile

CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS =

TARGETS = serial_echo serial_loopback

all: $(TARGETS)

serial_echo: serial_echo.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

serial_loopback: serial_loopback.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TARGETS)

.PHONY: all clean
