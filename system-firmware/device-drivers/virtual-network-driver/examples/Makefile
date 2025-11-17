# Virtual Network 範例程式 Makefile

CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS =

TARGETS = packet_send packet_capture network_test

all: $(TARGETS)

packet_send: packet_send.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

packet_capture: packet_capture.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

network_test: network_test.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TARGETS)

.PHONY: all clean
