/*
 * ESP32 OTA Bootloader Implementation
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: MIT
 *
 * This bootloader implements Over-The-Air (OTA) firmware updates
 * for ESP32 with dual partition support and rollback mechanism.
 */

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_event.h"
#include "esp_log.h"
#include "esp_ota_ops.h"
#include "esp_http_client.h"
#include "esp_https_ota.h"
#include "esp_wifi.h"
#include "nvs_flash.h"
#include "esp_partition.h"

static const char *TAG = "ESP32_OTA_BOOTLOADER";

// Configuration
#define FIRMWARE_URL "https://example.com/firmware.bin"
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define MAX_RETRY 5
#define OTA_BUFFER_SIZE 1024

typedef struct {
    const esp_partition_t *update_partition;
    const esp_partition_t *running_partition;
    esp_ota_handle_t update_handle;
    uint32_t downloaded_size;
    uint32_t total_size;
    bool update_in_progress;
} ota_context_t;

static ota_context_t g_ota_ctx = {0};

/**
 * WiFi event handler
 */
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                               int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        ESP_LOGI(TAG, "Disconnected, retrying...");
        esp_wifi_connect();
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
    }
}

/**
 * Initialize WiFi connection
 */
esp_err_t wifi_init(void)
{
    ESP_LOGI(TAG, "Initializing WiFi...");

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    ESP_ERROR_CHECK(esp_event_handler_register(WIFI_EVENT,
                                               ESP_EVENT_ANY_ID,
                                               &wifi_event_handler,
                                               NULL));
    ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT,
                                               IP_EVENT_STA_GOT_IP,
                                               &wifi_event_handler,
                                               NULL));

    wifi_config_t wifi_config = {
        .sta = {
            .ssid = WIFI_SSID,
            .password = WIFI_PASSWORD,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    ESP_LOGI(TAG, "WiFi initialized successfully");
    return ESP_OK;
}

/**
 * Validate firmware header
 */
esp_err_t validate_firmware_header(esp_app_desc_t *new_app_info)
{
    if (new_app_info == NULL) {
        return ESP_ERR_INVALID_ARG;
    }

    const esp_partition_t *running = esp_ota_get_running_partition();
    esp_app_desc_t running_app_info;

    if (esp_ota_get_partition_description(running, &running_app_info) == ESP_OK) {
        ESP_LOGI(TAG, "Running firmware version: %s", running_app_info.version);
    }

    ESP_LOGI(TAG, "New firmware version: %s", new_app_info->version);

    // Version comparison
    if (strcmp(new_app_info->version, running_app_info.version) <= 0) {
        ESP_LOGW(TAG, "New version is not newer than running version");
        // In production, you might want to return ESP_FAIL here
    }

    // Project name validation
    if (strcmp(new_app_info->project_name, running_app_info.project_name) != 0) {
        ESP_LOGE(TAG, "Project name mismatch!");
        return ESP_FAIL;
    }

    return ESP_OK;
}

/**
 * Initialize OTA update
 */
esp_err_t ota_init(void)
{
    ESP_LOGI(TAG, "Initializing OTA update...");

    // Get running partition
    g_ota_ctx.running_partition = esp_ota_get_running_partition();
    if (g_ota_ctx.running_partition == NULL) {
        ESP_LOGE(TAG, "Failed to get running partition");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Running partition: %s", g_ota_ctx.running_partition->label);

    // Get next update partition
    g_ota_ctx.update_partition = esp_ota_get_next_update_partition(NULL);
    if (g_ota_ctx.update_partition == NULL) {
        ESP_LOGE(TAG, "Failed to get update partition");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Update partition: %s", g_ota_ctx.update_partition->label);

    // Begin OTA
    esp_err_t err = esp_ota_begin(g_ota_ctx.update_partition, OTA_SIZE_UNKNOWN,
                                  &g_ota_ctx.update_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "OTA begin failed: %s", esp_err_to_name(err));
        return err;
    }

    g_ota_ctx.update_in_progress = true;
    g_ota_ctx.downloaded_size = 0;

    ESP_LOGI(TAG, "OTA initialization successful");
    return ESP_OK;
}

/**
 * Write firmware data to OTA partition
 */
esp_err_t ota_write(const uint8_t *data, size_t len)
{
    if (!g_ota_ctx.update_in_progress) {
        return ESP_ERR_INVALID_STATE;
    }

    esp_err_t err = esp_ota_write(g_ota_ctx.update_handle, data, len);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "OTA write failed: %s", esp_err_to_name(err));
        return err;
    }

    g_ota_ctx.downloaded_size += len;

    // Progress logging (every 100KB)
    if (g_ota_ctx.downloaded_size % (100 * 1024) == 0) {
        ESP_LOGI(TAG, "Downloaded: %d KB", g_ota_ctx.downloaded_size / 1024);
    }

    return ESP_OK;
}

/**
 * Finalize OTA update and set boot partition
 */
esp_err_t ota_finish(void)
{
    if (!g_ota_ctx.update_in_progress) {
        return ESP_ERR_INVALID_STATE;
    }

    ESP_LOGI(TAG, "Finalizing OTA update...");

    esp_err_t err = esp_ota_end(g_ota_ctx.update_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "OTA end failed: %s", esp_err_to_name(err));
        return err;
    }

    // Set boot partition
    err = esp_ota_set_boot_partition(g_ota_ctx.update_partition);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Set boot partition failed: %s", esp_err_to_name(err));
        return err;
    }

    g_ota_ctx.update_in_progress = false;

    ESP_LOGI(TAG, "OTA update completed successfully!");
    ESP_LOGI(TAG, "Total downloaded: %d KB", g_ota_ctx.downloaded_size / 1024);

    return ESP_OK;
}

/**
 * Rollback to previous firmware
 */
esp_err_t ota_rollback(void)
{
    ESP_LOGI(TAG, "Performing OTA rollback...");

    const esp_partition_t *last_invalid_app = esp_ota_get_last_invalid_partition();
    if (last_invalid_app != NULL) {
        ESP_LOGI(TAG, "Last invalid partition: %s", last_invalid_app->label);

        esp_err_t err = esp_ota_set_boot_partition(last_invalid_app);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Rollback failed: %s", esp_err_to_name(err));
            return err;
        }

        ESP_LOGI(TAG, "Rollback successful. Rebooting...");
        esp_restart();
    } else {
        ESP_LOGE(TAG, "No previous valid partition found");
        return ESP_FAIL;
    }

    return ESP_OK;
}

/**
 * Mark current firmware as valid
 * Should be called after successful boot and validation
 */
void ota_mark_valid(void)
{
    ESP_LOGI(TAG, "Marking firmware as valid...");

    // Check if running from OTA partition
    const esp_partition_t *partition = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;

    if (esp_ota_get_state_partition(partition, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
            // Firmware is pending verification, mark it as valid
            ESP_LOGI(TAG, "First boot after OTA update");
            esp_ota_mark_app_valid_cancel_rollback();
            ESP_LOGI(TAG, "Firmware marked as valid");
        }
    }
}

/**
 * Check firmware and trigger rollback if invalid
 */
void ota_check_and_rollback(void)
{
    const esp_partition_t *partition = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;

    if (esp_ota_get_state_partition(partition, &ota_state) == ESP_OK) {
        if (ota_state == ESP_OTA_IMG_INVALID) {
            ESP_LOGE(TAG, "Current firmware is invalid!");
            ota_rollback();
        }
    }
}

/**
 * Perform HTTPS OTA update
 */
esp_err_t perform_https_ota(const char *url)
{
    ESP_LOGI(TAG, "Starting HTTPS OTA update from: %s", url);

    esp_http_client_config_t config = {
        .url = url,
        .timeout_ms = 5000,
        .keep_alive_enable = true,
    };

    esp_https_ota_config_t ota_config = {
        .http_config = &config,
    };

    esp_https_ota_handle_t https_ota_handle = NULL;
    esp_err_t err = esp_https_ota_begin(&ota_config, &https_ota_handle);

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "HTTPS OTA begin failed");
        return err;
    }

    // Validate firmware header
    esp_app_desc_t app_desc;
    err = esp_https_ota_get_img_desc(https_ota_handle, &app_desc);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to get image description");
        goto ota_end;
    }

    err = validate_firmware_header(&app_desc);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Firmware header validation failed");
        goto ota_end;
    }

    // Download and write firmware
    while (1) {
        err = esp_https_ota_perform(https_ota_handle);
        if (err != ESP_ERR_HTTPS_OTA_IN_PROGRESS) {
            break;
        }

        // Progress reporting
        int progress = esp_https_ota_get_image_len_read(https_ota_handle);
        ESP_LOGI(TAG, "Image bytes read: %d", progress);
    }

    if (esp_https_ota_is_complete_data_received(https_ota_handle) != true) {
        ESP_LOGE(TAG, "Complete data was not received");
        err = ESP_FAIL;
    } else {
        err = esp_https_ota_finish(https_ota_handle);
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "OTA update successful. Rebooting...");
            vTaskDelay(1000 / portTICK_PERIOD_MS);
            esp_restart();
        } else {
            ESP_LOGE(TAG, "OTA finish failed: %s", esp_err_to_name(err));
        }
    }

ota_end:
    esp_https_ota_abort(https_ota_handle);
    return err;
}

/**
 * Main application entry point
 */
void app_main(void)
{
    ESP_LOGI(TAG, "ESP32 OTA Bootloader started");

    // Print partition table
    const esp_partition_t *partition = esp_ota_get_running_partition();
    ESP_LOGI(TAG, "Running from partition: %s", partition->label);

    // Check and handle rollback
    ota_check_and_rollback();

    // Mark firmware as valid after successful boot
    ota_mark_valid();

    // Initialize NVS
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    ESP_ERROR_CHECK(err);

    // Initialize WiFi
    ESP_ERROR_CHECK(wifi_init());

    // Wait for WiFi connection
    ESP_LOGI(TAG, "Waiting for WiFi connection...");
    vTaskDelay(5000 / portTICK_PERIOD_MS);

    // Check for updates (this is where you'd implement your update check logic)
    // For now, we'll just demonstrate the OTA process

    ESP_LOGI(TAG, "Bootloader ready. Application will start normally.");

    // Your application code starts here...
}

/**
 * OTA update task (can be triggered by button press, timer, or remote command)
 */
void ota_update_task(void *pvParameter)
{
    while (1) {
        // Wait for update trigger
        vTaskDelay(60000 / portTICK_PERIOD_MS); // Check every minute

        ESP_LOGI(TAG, "Checking for firmware updates...");

        // Perform OTA update
        esp_err_t err = perform_https_ota(FIRMWARE_URL);

        if (err != ESP_OK) {
            ESP_LOGE(TAG, "OTA update failed");
        }

        // Wait before next check
        vTaskDelay(3600000 / portTICK_PERIOD_MS); // Wait 1 hour
    }
}
