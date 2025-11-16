/*
 * Custom Board Support
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: GPL-2.0+
 */

#include <common.h>
#include <init.h>
#include <asm/arch/sys_proto.h>
#include <asm/gpio.h>
#include <asm/io.h>
#include <asm/mach-types.h>

DECLARE_GLOBAL_DATA_PTR;

/*
 * Board initialization
 */
int board_init(void)
{
    /* Address of boot parameters */
    gd->bd->bi_boot_params = CONFIG_SYS_SDRAM_BASE + 0x100;

    /* Initialize GPIOs */
    gpio_request(CONFIG_LED_GPIO, "status_led");
    gpio_direction_output(CONFIG_LED_GPIO, 0);

    return 0;
}

/*
 * DRAM initialization
 */
int dram_init(void)
{
    gd->ram_size = CONFIG_SYS_SDRAM_SIZE;
    return 0;
}

/*
 * DRAM bank initialization
 */
int dram_init_banksize(void)
{
    gd->bd->bi_dram[0].start = CONFIG_SYS_SDRAM_BASE;
    gd->bd->bi_dram[0].size = CONFIG_SYS_SDRAM_SIZE;
    return 0;
}

#ifdef CONFIG_MMC
/*
 * Board MMC initialization
 */
int board_mmc_init(struct bd_info *bis)
{
    /* Initialize MMC controller */
    return 0;
}
#endif

#ifdef CONFIG_USB_GADGET
/*
 * USB gadget initialization
 */
int board_usb_init(int index, enum usb_init_type init)
{
    /* Initialize USB gadget */
    return 0;
}

int board_usb_cleanup(int index, enum usb_init_type init)
{
    /* Cleanup USB gadget */
    return 0;
}
#endif

/*
 * Board late initialization
 */
int board_late_init(void)
{
    /* Set boot device environment variable */
    const char *boot_device = "mmc";

    switch (get_boot_device()) {
    case BOOT_DEVICE_MMC:
        boot_device = "mmc";
        break;
    case BOOT_DEVICE_NAND:
        boot_device = "nand";
        break;
    case BOOT_DEVICE_SPI:
        boot_device = "spi";
        break;
    default:
        boot_device = "unknown";
        break;
    }

    env_set("boot_device", boot_device);

    /* Blink status LED */
    gpio_set_value(CONFIG_LED_GPIO, 1);
    mdelay(100);
    gpio_set_value(CONFIG_LED_GPIO, 0);

    return 0;
}

/*
 * Miscellaneous platform dependent initialisations
 */
int misc_init_r(void)
{
    /* Set MAC address from efuse or random */
    if (!env_get("ethaddr")) {
        /* Generate or read MAC address */
        eth_env_set_enetaddr("ethaddr", "\x00\x11\x22\x33\x44\x55");
    }

    return 0;
}

#ifdef CONFIG_RESET_PHY_R
/*
 * Reset PHY
 */
void reset_phy(void)
{
    /* Toggle PHY reset pin */
    gpio_request(CONFIG_PHY_RESET_GPIO, "phy_reset");
    gpio_direction_output(CONFIG_PHY_RESET_GPIO, 0);
    mdelay(10);
    gpio_set_value(CONFIG_PHY_RESET_GPIO, 1);
    mdelay(50);
}
#endif

/*
 * Get boot device
 */
u32 get_boot_device(void)
{
    /* Read boot mode pins or register */
    u32 boot_mode = readl(BOOT_MODE_REG);

    switch (boot_mode & BOOT_MODE_MASK) {
    case BOOT_MODE_MMC:
        return BOOT_DEVICE_MMC;
    case BOOT_MODE_NAND:
        return BOOT_DEVICE_NAND;
    case BOOT_MODE_SPI:
        return BOOT_DEVICE_SPI;
    default:
        return BOOT_DEVICE_NONE;
    }
}

/*
 * Board reset
 */
void reset_cpu(ulong addr)
{
    /* Trigger watchdog reset or write to reset register */
    writel(RESET_MAGIC, RESET_REG);

    /* Wait for reset */
    while (1)
        ;
}
