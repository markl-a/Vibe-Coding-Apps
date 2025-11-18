/*
 * Nordic nRF52 BLE DFU Bootloader Implementation
 *
 * Copyright (C) 2025 AI-Assisted Development Team
 * SPDX-License-Identifier: MIT
 *
 * This bootloader implements Bluetooth Low Energy Device Firmware Update (DFU)
 * for Nordic nRF52 series microcontrollers using the Nordic DFU protocol.
 */

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include "nordic_common.h"
#include "nrf.h"
#include "nrf_dfu.h"
#include "nrf_dfu_types.h"
#include "nrf_dfu_settings.h"
#include "nrf_dfu_utils.h"
#include "nrf_bootloader.h"
#include "nrf_bootloader_app_start.h"
#include "nrf_bootloader_dfu_timers.h"
#include "nrf_bootloader_info.h"
#include "nrf_delay.h"
#include "nrf_log.h"
#include "nrf_log_ctrl.h"
#include "nrf_log_default_backends.h"
#include "app_error.h"
#include "app_error_weak.h"
#include "nrf_pwr_mgmt.h"
#include "nrf_mbr.h"
#include "nrf_sdm.h"
#include "ble_dfu.h"
#include "nrf_ble_gatt.h"
#include "nrf_ble_qwr.h"
#include "nrf_sdh.h"
#include "nrf_sdh_ble.h"

#define APP_BLE_CONN_CFG_TAG    1
#define APP_BLE_OBSERVER_PRIO   3

#define DEVICE_NAME             "DFU_Bootloader"
#define MANUFACTURER_NAME       "AIDevTeam"

#define MIN_CONN_INTERVAL       MSEC_TO_UNITS(100, UNIT_1_25_MS)
#define MAX_CONN_INTERVAL       MSEC_TO_UNITS(200, UNIT_1_25_MS)
#define SLAVE_LATENCY           0
#define CONN_SUP_TIMEOUT        MSEC_TO_UNITS(4000, UNIT_10_MS)

// DFU Service UUID (Nordic DFU Service)
#define BLE_UUID_DFU_SERVICE    0xFE59

static uint16_t m_conn_handle = BLE_CONN_HANDLE_INVALID;
static nrf_ble_gatt_t m_gatt;
static nrf_ble_qwr_t m_qwr;
static ble_dfu_t m_dfu;

/**
 * @brief Function for handling BLE events.
 */
static void ble_evt_handler(ble_evt_t const * p_ble_evt, void * p_context)
{
    uint32_t err_code;

    switch (p_ble_evt->header.evt_id)
    {
        case BLE_GAP_EVT_CONNECTED:
            NRF_LOG_INFO("Connected");
            m_conn_handle = p_ble_evt->evt.gap_evt.conn_handle;
            err_code = nrf_ble_qwr_conn_handle_assign(&m_qwr, m_conn_handle);
            APP_ERROR_CHECK(err_code);
            break;

        case BLE_GAP_EVT_DISCONNECTED:
            NRF_LOG_INFO("Disconnected");
            m_conn_handle = BLE_CONN_HANDLE_INVALID;
            break;

        case BLE_GAP_EVT_SEC_PARAMS_REQUEST:
            // Pairing not supported in bootloader
            err_code = sd_ble_gap_sec_params_reply(m_conn_handle,
                                                   BLE_GAP_SEC_STATUS_PAIRING_NOT_SUPP,
                                                   NULL,
                                                   NULL);
            APP_ERROR_CHECK(err_code);
            break;

        case BLE_GATTS_EVT_SYS_ATTR_MISSING:
            // No system attributes in bootloader
            err_code = sd_ble_gatts_sys_attr_set(m_conn_handle, NULL, 0, 0);
            APP_ERROR_CHECK(err_code);
            break;

        case BLE_GATTC_EVT_TIMEOUT:
            // Disconnect on GATT Client timeout
            NRF_LOG_DEBUG("GATT Client Timeout");
            err_code = sd_ble_gap_disconnect(p_ble_evt->evt.gattc_evt.conn_handle,
                                             BLE_HCI_REMOTE_USER_TERMINATED_CONNECTION);
            APP_ERROR_CHECK(err_code);
            break;

        case BLE_GATTS_EVT_TIMEOUT:
            // Disconnect on GATT Server timeout
            NRF_LOG_DEBUG("GATT Server Timeout");
            err_code = sd_ble_gap_disconnect(p_ble_evt->evt.gatts_evt.conn_handle,
                                             BLE_HCI_REMOTE_USER_TERMINATED_CONNECTION);
            APP_ERROR_CHECK(err_code);
            break;

        default:
            // No implementation needed
            break;
    }
}

/**
 * @brief Function for initializing the BLE stack.
 */
static void ble_stack_init(void)
{
    ret_code_t err_code;

    // Configure BLE stack
    err_code = nrf_sdh_enable_request();
    APP_ERROR_CHECK(err_code);

    // Configure the BLE stack using the default settings
    uint32_t ram_start = 0;
    err_code = nrf_sdh_ble_default_cfg_set(APP_BLE_CONN_CFG_TAG, &ram_start);
    APP_ERROR_CHECK(err_code);

    // Enable BLE stack
    err_code = nrf_sdh_ble_enable(&ram_start);
    APP_ERROR_CHECK(err_code);

    // Register a handler for BLE events
    NRF_SDH_BLE_OBSERVER(m_ble_observer, APP_BLE_OBSERVER_PRIO, ble_evt_handler, NULL);
}

/**
 * @brief Function for initializing GAP parameters.
 */
static void gap_params_init(void)
{
    ret_code_t err_code;
    ble_gap_conn_params_t gap_conn_params;
    ble_gap_conn_sec_mode_t sec_mode;

    BLE_GAP_CONN_SEC_MODE_SET_OPEN(&sec_mode);

    err_code = sd_ble_gap_device_name_set(&sec_mode,
                                         (const uint8_t *)DEVICE_NAME,
                                         strlen(DEVICE_NAME));
    APP_ERROR_CHECK(err_code);

    memset(&gap_conn_params, 0, sizeof(gap_conn_params));

    gap_conn_params.min_conn_interval = MIN_CONN_INTERVAL;
    gap_conn_params.max_conn_interval = MAX_CONN_INTERVAL;
    gap_conn_params.slave_latency     = SLAVE_LATENCY;
    gap_conn_params.conn_sup_timeout  = CONN_SUP_TIMEOUT;

    err_code = sd_ble_gap_ppcp_set(&gap_conn_params);
    APP_ERROR_CHECK(err_code);
}

/**
 * @brief Function for initializing GATT module.
 */
static void gatt_init(void)
{
    ret_code_t err_code = nrf_ble_gatt_init(&m_gatt, NULL);
    APP_ERROR_CHECK(err_code);
}

/**
 * @brief Function for initializing Queued Write module.
 */
static void qwr_init(void)
{
    ret_code_t err_code;
    nrf_ble_qwr_init_t qwr_init_obj = {0};

    err_code = nrf_ble_qwr_init(&m_qwr, &qwr_init_obj);
    APP_ERROR_CHECK(err_code);
}

/**
 * @brief Function for handling DFU events.
 */
static void dfu_observer(nrf_dfu_evt_type_t evt_type)
{
    switch (evt_type)
    {
        case NRF_DFU_EVT_DFU_INITIALIZED:
            NRF_LOG_INFO("DFU initialized");
            break;

        case NRF_DFU_EVT_TRANSPORT_ACTIVATED:
            NRF_LOG_INFO("DFU transport activated");
            break;

        case NRF_DFU_EVT_DFU_STARTED:
            NRF_LOG_INFO("DFU started");
            break;

        case NRF_DFU_EVT_OBJECT_RECEIVED:
            NRF_LOG_INFO("DFU object received");
            break;

        case NRF_DFU_EVT_DFU_COMPLETED:
            NRF_LOG_INFO("DFU completed");
            break;

        case NRF_DFU_EVT_DFU_ABORTED:
            NRF_LOG_INFO("DFU aborted");
            break;

        case NRF_DFU_EVT_TRANSPORT_DEACTIVATED:
            NRF_LOG_INFO("DFU transport deactivated");
            break;

        default:
            break;
    }
}

/**
 * @brief Function for initializing DFU service.
 */
static void dfu_init(void)
{
    ret_code_t err_code;
    ble_dfu_init_t dfu_init_obj;

    memset(&dfu_init_obj, 0, sizeof(dfu_init_obj));

    dfu_init_obj.evt_handler = NULL; // Use default handler

    err_code = ble_dfu_init(&m_dfu, &dfu_init_obj);
    APP_ERROR_CHECK(err_code);

    // Register DFU observer
    nrf_dfu_observer_register(dfu_observer);
}

/**
 * @brief Function for starting advertising.
 */
static void advertising_start(void)
{
    ret_code_t err_code;

    ble_gap_adv_params_t const adv_params =
    {
        .properties =
        {
            .type = BLE_GAP_ADV_TYPE_CONNECTABLE_SCANNABLE_UNDIRECTED,
        },
        .p_peer_addr = NULL,
        .filter_policy = BLE_GAP_ADV_FP_ANY,
        .interval = 300,
        .duration = 0,
        .primary_phy = BLE_GAP_PHY_1MBPS,
    };

    // Build advertising data
    uint8_t adv_data[BLE_GAP_ADV_SET_DATA_SIZE_MAX];
    uint8_t adv_data_len = 0;

    // Flags
    adv_data[adv_data_len++] = 0x02;  // Length
    adv_data[adv_data_len++] = BLE_GAP_AD_TYPE_FLAGS;
    adv_data[adv_data_len++] = BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE;

    // Complete name
    uint8_t name_len = strlen(DEVICE_NAME);
    adv_data[adv_data_len++] = name_len + 1;
    adv_data[adv_data_len++] = BLE_GAP_AD_TYPE_COMPLETE_LOCAL_NAME;
    memcpy(&adv_data[adv_data_len], DEVICE_NAME, name_len);
    adv_data_len += name_len;

    // DFU Service UUID
    adv_data[adv_data_len++] = 3;  // Length
    adv_data[adv_data_len++] = BLE_GAP_AD_TYPE_16BIT_SERVICE_UUID_COMPLETE;
    adv_data[adv_data_len++] = LSB_16(BLE_UUID_DFU_SERVICE);
    adv_data[adv_data_len++] = MSB_16(BLE_UUID_DFU_SERVICE);

    ble_gap_adv_data_t gap_adv_data =
    {
        .adv_data =
        {
            .p_data = adv_data,
            .len = adv_data_len,
        },
    };

    err_code = sd_ble_gap_adv_set_configure(&m_adv_handle, &gap_adv_data, &adv_params);
    APP_ERROR_CHECK(err_code);

    err_code = sd_ble_gap_adv_start(m_adv_handle, APP_BLE_CONN_CFG_TAG);
    APP_ERROR_CHECK(err_code);

    NRF_LOG_INFO("Advertising started");
}

/**
 * @brief Function for checking if we should enter DFU mode.
 */
static bool dfu_enter_check(void)
{
    // Check for button press (implementation depends on your hardware)
    // For example, checking if a GPIO pin is low
    // nrf_gpio_cfg_input(BUTTON_PIN, NRF_GPIO_PIN_PULLUP);
    // if (nrf_gpio_pin_read(BUTTON_PIN) == 0)
    // {
    //     return true;
    // }

    // Check if application is valid
    if (!nrf_dfu_app_is_valid())
    {
        NRF_LOG_INFO("No valid application found, entering DFU mode");
        return true;
    }

    // Check DFU settings for forced DFU mode
    if (s_dfu_settings.enter_buttonless_dfu)
    {
        NRF_LOG_INFO("Buttonless DFU requested");
        s_dfu_settings.enter_buttonless_dfu = false;
        nrf_dfu_settings_write(NULL);
        return true;
    }

    return false;
}

/**
 * @brief Function for jumping to application.
 */
static void jump_to_app(void)
{
    NRF_LOG_INFO("Jumping to application...");
    NRF_LOG_FINAL_FLUSH();

    // Disable all interrupts
    NVIC->ICER[0] = 0xFFFFFFFF;
    NVIC->ICPR[0] = 0xFFFFFFFF;
    #if defined(__NRF_NVIC_ISER_COUNT) && __NRF_NVIC_ISER_COUNT == 2
    NVIC->ICER[1] = 0xFFFFFFFF;
    NVIC->ICPR[1] = 0xFFFFFFFF;
    #endif

    // Jump to application
    nrf_bootloader_app_start();
}

/**
 * @brief Main function.
 */
int main(void)
{
    ret_code_t err_code;

    // Initialize logging
    err_code = NRF_LOG_INIT(NULL);
    APP_ERROR_CHECK(err_code);
    NRF_LOG_DEFAULT_BACKENDS_INIT();

    NRF_LOG_INFO("Nordic nRF52 BLE DFU Bootloader");
    NRF_LOG_INFO("Version: 1.0.0");

    // Initialize power management
    err_code = nrf_pwr_mgmt_init();
    APP_ERROR_CHECK(err_code);

    // Initialize DFU settings
    err_code = nrf_dfu_settings_init(true);
    APP_ERROR_CHECK(err_code);

    // Check if we should enter DFU mode
    if (!dfu_enter_check())
    {
        NRF_LOG_INFO("Valid application found, starting...");
        jump_to_app();
        // Should not return
    }

    NRF_LOG_INFO("Entering DFU mode");

    // Initialize BLE stack
    ble_stack_init();

    // Initialize GAP parameters
    gap_params_init();

    // Initialize GATT
    gatt_init();

    // Initialize Queued Write module
    qwr_init();

    // Initialize DFU
    dfu_init();

    // Initialize DFU module
    err_code = nrf_dfu_init(dfu_observer);
    APP_ERROR_CHECK(err_code);

    // Start advertising
    advertising_start();

    NRF_LOG_INFO("DFU Bootloader started. Waiting for connection...");

    // Main loop
    for (;;)
    {
        // Process logs
        NRF_LOG_FLUSH();

        // Wait for events
        nrf_pwr_mgmt_run();
    }
}

/**
 * @brief Function for application main entry when in application mode.
 */
void app_error_fault_handler(uint32_t id, uint32_t pc, uint32_t info)
{
    NRF_LOG_ERROR("Fatal error");
    NRF_LOG_FINAL_FLUSH();

    // Reset on error
    NVIC_SystemReset();
}

/**
 * @brief Callback function for asserts in the SoftDevice.
 */
void assert_nrf_callback(uint16_t line_num, const uint8_t * p_file_name)
{
    app_error_handler(0xDEADBEEF, line_num, p_file_name);
}
