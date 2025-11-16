/*
 * Factory Reset Command
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: GPL-2.0+
 */

#include <common.h>
#include <command.h>
#include <env.h>
#include <flash.h>
#include <mmc.h>

static int do_factory_reset(struct cmd_tbl *cmdtp, int flag,
                           int argc, char *const argv[])
{
    int confirm = 0;

    /* Check for confirmation flag */
    if (argc > 1 && strcmp(argv[1], "-y") == 0) {
        confirm = 1;
    }

    if (!confirm) {
        printf("WARNING: This will erase all user data and settings!\n");
        printf("Run 'factory_reset -y' to confirm.\n");
        return CMD_RET_USAGE;
    }

    printf("==================================\n");
    printf("  Factory Reset Initiated\n");
    printf("==================================\n\n");

    /* Step 1: Erase configuration partition */
    printf("[1/4] Erasing configuration partition...\n");
#ifdef CONFIG_ENV_IS_IN_MMC
    if (mmc_erase_env()) {
        printf("ERROR: Failed to erase environment!\n");
        return CMD_RET_FAILURE;
    }
#endif
    printf("      Done.\n\n");

    /* Step 2: Reset environment variables to defaults */
    printf("[2/4] Resetting environment variables...\n");
    env_set("bootdelay", "3");
    env_set("baudrate", "115200");
    env_set("bootcmd", "run distro_bootcmd");
    env_set("console", "ttyS0,115200");

    /* Remove custom user variables */
    env_set("user_config", NULL);
    env_set("custom_boot", NULL);

    printf("      Done.\n\n");

    /* Step 3: Save default environment */
    printf("[3/4] Saving default environment...\n");
    if (env_save()) {
        printf("ERROR: Failed to save environment!\n");
        return CMD_RET_FAILURE;
    }
    printf("      Done.\n\n");

    /* Step 4: Erase user data partition (optional) */
    printf("[4/4] Erasing user data...\n");
#ifdef CONFIG_MMC
    struct mmc *mmc = find_mmc_device(0);
    if (mmc) {
        mmc_init(mmc);
        /* Erase user data partition */
        unsigned long start = CONFIG_USER_DATA_OFFSET;
        unsigned long size = CONFIG_USER_DATA_SIZE;

        printf("      Erasing %ld blocks starting at %ld...\n", size, start);
        if (blk_derase(mmc_get_blk_desc(mmc), start, size) != size) {
            printf("ERROR: Failed to erase user data!\n");
            return CMD_RET_FAILURE;
        }
    }
#endif
    printf("      Done.\n\n");

    printf("==================================\n");
    printf("  Factory Reset Complete!\n");
    printf("==================================\n");
    printf("\nRebooting in 3 seconds...\n");

    mdelay(3000);
    do_reset(NULL, 0, 0, NULL);

    return CMD_RET_SUCCESS;
}

U_BOOT_CMD(
    factory_reset, 2, 0, do_factory_reset,
    "perform factory reset",
    "[-y]\n"
    "    - Reset device to factory defaults\n"
    "    -y: skip confirmation prompt"
);
