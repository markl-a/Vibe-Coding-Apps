/*
 * Boot Time Profiler - Embedded Boot Time Measurement
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: MIT
 *
 * This module provides boot time profiling for embedded systems.
 * It records timestamps for different boot stages and generates
 * performance reports.
 */

#define _POSIX_C_SOURCE 200809L

#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <time.h>

#ifdef __linux__
#include <sys/time.h>
#include <unistd.h>
#endif

#define MAX_EVENTS 128
#define EVENT_NAME_LEN 64

typedef struct {
    char name[EVENT_NAME_LEN];
    uint64_t timestamp_us;  // Microseconds since boot
    uint32_t duration_us;   // Duration in microseconds
} boot_event_t;

typedef struct {
    boot_event_t events[MAX_EVENTS];
    uint32_t event_count;
    uint64_t boot_start_us;
} boot_profile_t;

static boot_profile_t g_profile = {0};

/**
 * Get current timestamp in microseconds
 */
static uint64_t get_timestamp_us(void)
{
#ifdef __linux__
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return (uint64_t)tv.tv_sec * 1000000 + tv.tv_usec;
#else
    // For embedded systems, use HAL_GetTick() or similar
    return (uint64_t)clock() * 1000000 / CLOCKS_PER_SEC;
#endif
}

/**
 * Initialize boot profiler
 * Call this at the very beginning of boot sequence
 */
void boot_profiler_init(void)
{
    memset(&g_profile, 0, sizeof(boot_profile_t));
    g_profile.boot_start_us = get_timestamp_us();
}

/**
 * Record a boot event
 *
 * @param name: Event name (e.g., "Hardware Init", "Load Kernel")
 */
void boot_profiler_log_event(const char *name)
{
    if (g_profile.event_count >= MAX_EVENTS) {
        return;
    }

    boot_event_t *event = &g_profile.events[g_profile.event_count];

    strncpy(event->name, name, EVENT_NAME_LEN - 1);
    event->name[EVENT_NAME_LEN - 1] = '\0';

    event->timestamp_us = get_timestamp_us() - g_profile.boot_start_us;

    // Calculate duration from previous event
    if (g_profile.event_count > 0) {
        boot_event_t *prev_event = &g_profile.events[g_profile.event_count - 1];
        event->duration_us = event->timestamp_us - prev_event->timestamp_us;
    } else {
        event->duration_us = event->timestamp_us;
    }

    g_profile.event_count++;
}

/**
 * Start a timed section
 * Returns an event index for later use with boot_profiler_end_section
 */
uint32_t boot_profiler_start_section(const char *name)
{
    boot_profiler_log_event(name);
    return g_profile.event_count - 1;
}

/**
 * End a timed section
 * Updates the duration of the event
 */
void boot_profiler_end_section(uint32_t event_index)
{
    if (event_index >= g_profile.event_count) {
        return;
    }

    boot_event_t *event = &g_profile.events[event_index];
    uint64_t current_time = get_timestamp_us() - g_profile.boot_start_us;
    event->duration_us = current_time - event->timestamp_us;
}

/**
 * Print boot profile report to console
 */
void boot_profiler_print_report(void)
{
    printf("\n");
    printf("╔══════════════════════════════════════════════════════════════╗\n");
    printf("║              Boot Time Profile Report                       ║\n");
    printf("╚══════════════════════════════════════════════════════════════╝\n");
    printf("\n");

    printf("%-40s %12s %12s\n", "Event", "Time (ms)", "Duration (ms)");
    printf("────────────────────────────────────────────────────────────────\n");

    for (uint32_t i = 0; i < g_profile.event_count; i++) {
        boot_event_t *event = &g_profile.events[i];
        double time_ms = event->timestamp_us / 1000.0;
        double duration_ms = event->duration_us / 1000.0;

        printf("%-40s %12.3f %12.3f\n", event->name, time_ms, duration_ms);
    }

    printf("────────────────────────────────────────────────────────────────\n");

    if (g_profile.event_count > 0) {
        boot_event_t *last_event = &g_profile.events[g_profile.event_count - 1];
        double total_time_ms = last_event->timestamp_us / 1000.0;
        printf("%-40s %12.3f ms\n", "Total Boot Time", total_time_ms);
    }

    printf("\n");
}

/**
 * Export boot profile to JSON format
 */
void boot_profiler_export_json(const char *filename)
{
    FILE *fp = fopen(filename, "w");
    if (!fp) {
        printf("Error: Cannot create file %s\n", filename);
        return;
    }

    fprintf(fp, "{\n");
    fprintf(fp, "  \"boot_profile\": {\n");
    fprintf(fp, "    \"event_count\": %u,\n", g_profile.event_count);
    fprintf(fp, "    \"events\": [\n");

    for (uint32_t i = 0; i < g_profile.event_count; i++) {
        boot_event_t *event = &g_profile.events[i];

        fprintf(fp, "      {\n");
        fprintf(fp, "        \"name\": \"%s\",\n", event->name);
        fprintf(fp, "        \"timestamp_us\": %llu,\n",
                (unsigned long long)event->timestamp_us);
        fprintf(fp, "        \"duration_us\": %u\n", event->duration_us);
        fprintf(fp, "      }%s\n", (i < g_profile.event_count - 1) ? "," : "");
    }

    fprintf(fp, "    ],\n");

    if (g_profile.event_count > 0) {
        boot_event_t *last_event = &g_profile.events[g_profile.event_count - 1];
        fprintf(fp, "    \"total_boot_time_us\": %llu\n",
                (unsigned long long)last_event->timestamp_us);
    } else {
        fprintf(fp, "    \"total_boot_time_us\": 0\n");
    }

    fprintf(fp, "  }\n");
    fprintf(fp, "}\n");

    fclose(fp);
    printf("Boot profile exported to %s\n", filename);
}

/**
 * Get optimization suggestions based on profile
 */
void boot_profiler_suggest_optimizations(void)
{
    printf("\n");
    printf("╔══════════════════════════════════════════════════════════════╗\n");
    printf("║              Optimization Suggestions                       ║\n");
    printf("╚══════════════════════════════════════════════════════════════╝\n");
    printf("\n");

    // Find slowest events
    uint32_t slowest_idx = 0;
    uint32_t second_slowest_idx = 0;

    for (uint32_t i = 0; i < g_profile.event_count; i++) {
        if (g_profile.events[i].duration_us > g_profile.events[slowest_idx].duration_us) {
            second_slowest_idx = slowest_idx;
            slowest_idx = i;
        } else if (g_profile.events[i].duration_us > g_profile.events[second_slowest_idx].duration_us) {
            second_slowest_idx = i;
        }
    }

    if (g_profile.event_count > 0) {
        boot_event_t *slowest = &g_profile.events[slowest_idx];
        printf("🔴 Slowest Stage: %s (%.2f ms)\n",
               slowest->name, slowest->duration_us / 1000.0);
        printf("   Suggestions:\n");
        printf("   - Profile this stage in detail\n");
        printf("   - Consider parallel initialization\n");
        printf("   - Check for I/O bottlenecks\n");
        printf("\n");
    }

    if (g_profile.event_count > 1) {
        boot_event_t *second = &g_profile.events[second_slowest_idx];
        printf("🟡 Second Slowest: %s (%.2f ms)\n",
               second->name, second->duration_us / 1000.0);
        printf("   Suggestions:\n");
        printf("   - Defer non-critical initialization\n");
        printf("   - Use lazy loading techniques\n");
        printf("\n");
    }

    // General suggestions
    printf("💡 General Optimization Tips:\n");
    printf("   1. Enable compiler optimizations (-O2 or -O3)\n");
    printf("   2. Reduce debug logging in production builds\n");
    printf("   3. Optimize Flash read speed (adjust wait states)\n");
    printf("   4. Use DMA for data transfers\n");
    printf("   5. Initialize peripherals in parallel when possible\n");
    printf("\n");
}

/* Example usage */
#ifdef BOOT_PROFILER_EXAMPLE

int main(void)
{
    // Initialize profiler
    boot_profiler_init();

    // Simulate boot sequence
    boot_profiler_log_event("Power-On Reset");

    // Simulate hardware initialization
    uint32_t hw_init = boot_profiler_start_section("Hardware Init");
    // ... do hardware initialization ...
    usleep(50000);  // Simulate 50ms
    boot_profiler_end_section(hw_init);

    boot_profiler_log_event("Clock Configuration");
    usleep(10000);

    boot_profiler_log_event("Memory Init");
    usleep(30000);

    uint32_t storage = boot_profiler_start_section("Storage Init");
    usleep(100000);  // Simulate 100ms
    boot_profiler_end_section(storage);

    boot_profiler_log_event("Network Init");
    usleep(80000);

    boot_profiler_log_event("Load Application");
    usleep(60000);

    boot_profiler_log_event("Application Start");

    // Print report
    boot_profiler_print_report();

    // Export to JSON
    boot_profiler_export_json("boot_profile.json");

    // Get optimization suggestions
    boot_profiler_suggest_optimizations();

    return 0;
}

#endif /* BOOT_PROFILER_EXAMPLE */
