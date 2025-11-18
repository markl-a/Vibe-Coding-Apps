/**
 * @file example_secure_storage.c
 * @brief Secure Storage Example
 */

#include "../secure_storage.h"
#include <stdio.h>
#include <string.h>

int main(void)
{
    printf("========================================\n");
    printf("Secure Storage Example\n");
    printf("========================================\n\n");
    
    // Initialize secure storage
    secure_storage_context_t ctx;
    int ret = secure_storage_init(&ctx);
    if (ret != STORAGE_OK) {
        printf("Error: %s\n", secure_storage_get_error_string(ret));
        return 1;
    }
    
    printf("Storage initialized\n\n");
    
    // Store WiFi password
    const char *wifi_pass = "MySecretPassword123";
    printf("Storing WiFi password...\n");
    ret = secure_storage_write(&ctx, SLOT_WIFI_PASSWORD,
                               (const uint8_t *)wifi_pass,
                               strlen(wifi_pass));
    printf("Status: %s\n\n", secure_storage_get_error_string(ret));
    
    // Store API key
    const char *api_key = "sk-abc123xyz789";
    printf("Storing API key...\n");
    ret = secure_storage_write(&ctx, SLOT_API_KEY,
                               (const uint8_t *)api_key,
                               strlen(api_key));
    printf("Status: %s\n\n", secure_storage_get_error_string(ret));
    
    // Read WiFi password
    uint8_t buffer[256];
    size_t data_len;
    printf("Reading WiFi password...\n");
    ret = secure_storage_read(&ctx, SLOT_WIFI_PASSWORD,
                             buffer, sizeof(buffer), &data_len);
    if (ret == STORAGE_OK) {
        buffer[data_len] = '\0';
        printf("Retrieved: %s\n\n", buffer);
    }
    
    // Cleanup
    secure_storage_deinit(&ctx);
    
    printf("Example completed\n");
    printf("========================================\n\n");
    return 0;
}
