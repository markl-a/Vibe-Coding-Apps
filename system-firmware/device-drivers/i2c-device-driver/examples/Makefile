# I2C 範例程式 Makefile

CC = gcc
CFLAGS = -Wall -Wextra -O2
LDFLAGS = -lm

TARGETS = bme280_example i2c_scan i2c_test

all: $(TARGETS)

bme280_example: bme280_example.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

i2c_scan: i2c_scan.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

i2c_test: i2c_test.c
	$(CC) $(CFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(TARGETS)

.PHONY: all clean
