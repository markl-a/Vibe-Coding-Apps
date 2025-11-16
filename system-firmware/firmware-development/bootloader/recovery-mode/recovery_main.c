#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>

#define RECOVERY_VERSION "1.0.0"

void show_menu(void)
{
    printf("\n");
    printf("╔══════════════════════════════════╗\n");
    printf("║    RECOVERY MODE v%s        ║\n", RECOVERY_VERSION);
    printf("╠══════════════════════════════════╣\n");
    printf("║ 1. Flash firmware (UART)         ║\n");
    printf("║ 2. Flash firmware (USB DFU)      ║\n");
    printf("║ 3. Run diagnostics               ║\n");
    printf("║ 4. Factory reset                 ║\n");
    printf("║ 5. Reboot to main firmware       ║\n");
    printf("║ 6. Reboot to bootloader          ║\n");
    printf("║ 7. Show system info              ║\n");
    printf("║ 8. Exit recovery mode            ║\n");
    printf("╚══════════════════════════════════╝\n");
    printf("Enter selection: ");
}

void uart_flash_mode(void);
void usb_dfu_mode(void);
void run_diagnostics(void);
void factory_reset(void);
void show_system_info(void);
void reboot_to_application(void);
void reboot_to_bootloader(void);

int main(void)
{
    // 硬體初始化
    // hardware_init();
    // uart_init(115200);

    printf("\n\n");
    printf("========================================\n");
    printf("  Entering Recovery Mode\n");
    printf("========================================\n");

    while (1) {
        show_menu();

        char choice = getchar();

        switch (choice) {
            case '1':
                uart_flash_mode();
                break;
            case '2':
                usb_dfu_mode();
                break;
            case '3':
                run_diagnostics();
                break;
            case '4':
                factory_reset();
                break;
            case '5':
                reboot_to_application();
                break;
            case '6':
                reboot_to_bootloader();
                break;
            case '7':
                show_system_info();
                break;
            case '8':
                printf("Exiting recovery mode...\n");
                reboot_to_application();
                break;
            default:
                printf("Invalid selection\n");
                break;
        }
    }

    return 0;
}
