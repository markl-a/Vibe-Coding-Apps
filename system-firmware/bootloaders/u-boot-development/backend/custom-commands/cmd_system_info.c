/*
 * System Information Command
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: GPL-2.0+
 */

#include <common.h>
#include <command.h>
#include <cpu.h>
#include <dm.h>
#include <version.h>
#include <asm/io.h>
#include <linux/compiler.h>

static void print_header(const char *title)
{
    printf("\n");
    printf("========================================\n");
    printf("  %s\n", title);
    printf("========================================\n");
}

static void print_cpu_info(void)
{
    print_header("CPU Information");

#ifdef CONFIG_CPU
    struct udevice *dev;
    char desc[100];

    if (!uclass_first_device_err(UCLASS_CPU, &dev)) {
        if (!cpu_get_desc(dev, desc, sizeof(desc))) {
            printf("Model:           %s\n", desc);
        }

        u32 freq;
        if (!cpu_get_rate(dev, &freq)) {
            printf("Frequency:       %u MHz\n", freq / 1000000);
        }

        int count = cpu_get_count(dev);
        if (count > 0) {
            printf("CPU Count:       %d\n", count);
        }
    }
#else
    printf("Model:           %s\n", CONFIG_SYS_CPU);
    printf("Architecture:    %s\n", CONFIG_SYS_ARCH);
#endif

#ifdef CONFIG_ARM
    printf("ARM Version:     ARMv%d\n", 7);
#endif

    printf("\n");
}

static void print_memory_info(void)
{
    print_header("Memory Information");

    printf("DRAM Base:       0x%08lx\n", (unsigned long)CONFIG_SYS_SDRAM_BASE);
    printf("DRAM Size:       %lu MB\n",
           (unsigned long)(gd->ram_size / (1024 * 1024)));

#ifdef CONFIG_SYS_MALLOC_LEN
    printf("Malloc Size:     %lu KB\n",
           (unsigned long)(CONFIG_SYS_MALLOC_LEN / 1024));
#endif

    printf("Stack Pointer:   0x%08lx\n", (unsigned long)&dev);

    printf("\n");
}

static void print_boot_info(void)
{
    print_header("Boot Information");

    printf("U-Boot Version:  %s\n", U_BOOT_VERSION);
    printf("Build Date:      %s %s\n", U_BOOT_DATE, U_BOOT_TIME);

    const char *boot_device = env_get("boot_device");
    if (boot_device) {
        printf("Boot Device:     %s\n", boot_device);
    }

#ifdef CONFIG_BOOTCOUNT_LIMIT
    printf("Boot Count:      %lu\n", bootcount_load());
#endif

    printf("Boot Delay:      %s seconds\n", env_get("bootdelay"));

    printf("\n");
}

static void print_storage_info(void)
{
    print_header("Storage Information");

#ifdef CONFIG_MMC
    struct mmc *mmc;
    int i;

    for (i = 0; i < 2; i++) {
        mmc = find_mmc_device(i);
        if (mmc) {
            mmc_init(mmc);
            printf("MMC%d:            ", i);
            if (mmc->has_init) {
                printf("%llu MB ", mmc->capacity / (1024 * 1024));
                printf("(%s)\n", mmc->is_removable ? "removable" : "fixed");
            } else {
                printf("Not initialized\n");
            }
        }
    }
#endif

    printf("\n");
}

static void print_network_info(void)
{
    print_header("Network Information");

    const char *ethaddr = env_get("ethaddr");
    if (ethaddr) {
        printf("MAC Address:     %s\n", ethaddr);
    }

    const char *ipaddr = env_get("ipaddr");
    if (ipaddr) {
        printf("IP Address:      %s\n", ipaddr);
    }

    const char *netmask = env_get("netmask");
    if (netmask) {
        printf("Netmask:         %s\n", netmask);
    }

    const char *serverip = env_get("serverip");
    if (serverip) {
        printf("Server IP:       %s\n", serverip);
    }

    printf("\n");
}

static void print_board_info(void)
{
    print_header("Board Information");

#ifdef CONFIG_SYS_BOARD
    printf("Board:           %s\n", CONFIG_SYS_BOARD);
#endif

#ifdef CONFIG_SYS_VENDOR
    printf("Vendor:          %s\n", CONFIG_SYS_VENDOR);
#endif

#ifdef CONFIG_SYS_SOC
    printf("SoC:             %s\n", CONFIG_SYS_SOC);
#endif

    printf("\n");
}

static int do_system_info(struct cmd_tbl *cmdtp, int flag,
                         int argc, char *const argv[])
{
    if (argc > 1) {
        if (strcmp(argv[1], "cpu") == 0) {
            print_cpu_info();
        } else if (strcmp(argv[1], "mem") == 0) {
            print_memory_info();
        } else if (strcmp(argv[1], "boot") == 0) {
            print_boot_info();
        } else if (strcmp(argv[1], "storage") == 0) {
            print_storage_info();
        } else if (strcmp(argv[1], "net") == 0) {
            print_network_info();
        } else if (strcmp(argv[1], "board") == 0) {
            print_board_info();
        } else {
            return CMD_RET_USAGE;
        }
    } else {
        /* Print all information */
        print_board_info();
        print_cpu_info();
        print_memory_info();
        print_boot_info();
        print_storage_info();
        print_network_info();
    }

    return CMD_RET_SUCCESS;
}

U_BOOT_CMD(
    sysinfo, 2, 1, do_system_info,
    "display system information",
    "[category]\n"
    "    - Display system information\n"
    "    Categories:\n"
    "      cpu     - CPU information\n"
    "      mem     - Memory information\n"
    "      boot    - Boot information\n"
    "      storage - Storage information\n"
    "      net     - Network information\n"
    "      board   - Board information\n"
    "    (no argument displays all information)"
);
