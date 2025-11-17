/*
 * I2C BME280 溫濕度氣壓感測器範例
 *
 * 此範例展示如何使用 I2C 介面讀取 BME280 感測器數據
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <fcntl.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <errno.h>
#include <string.h>

#define I2C_DEVICE "/dev/i2c-1"
#define BME280_ADDR 0x76

/* BME280 寄存器 */
#define BME280_REG_ID        0xD0
#define BME280_REG_RESET     0xE0
#define BME280_REG_CTRL_HUM  0xF2
#define BME280_REG_STATUS    0xF3
#define BME280_REG_CTRL_MEAS 0xF4
#define BME280_REG_CONFIG    0xF5
#define BME280_REG_PRESS_MSB 0xF7
#define BME280_REG_TEMP_MSB  0xFA
#define BME280_REG_HUM_MSB   0xFD

/* 校準參數起始地址 */
#define BME280_REG_CALIB00   0x88
#define BME280_REG_CALIB26   0xE1

/* 校準參數結構 */
typedef struct {
    uint16_t dig_T1;
    int16_t  dig_T2;
    int16_t  dig_T3;
    uint16_t dig_P1;
    int16_t  dig_P2;
    int16_t  dig_P3;
    int16_t  dig_P4;
    int16_t  dig_P5;
    int16_t  dig_P6;
    int16_t  dig_P7;
    int16_t  dig_P8;
    int16_t  dig_P9;
    uint8_t  dig_H1;
    int16_t  dig_H2;
    uint8_t  dig_H3;
    int16_t  dig_H4;
    int16_t  dig_H5;
    int8_t   dig_H6;
} bme280_calib_t;

/* I2C 讀寫函數 */
int i2c_read_byte(int fd, uint8_t reg, uint8_t *value) {
    if (write(fd, &reg, 1) != 1) {
        return -1;
    }
    if (read(fd, value, 1) != 1) {
        return -1;
    }
    return 0;
}

int i2c_write_byte(int fd, uint8_t reg, uint8_t value) {
    uint8_t buf[2] = {reg, value};
    if (write(fd, buf, 2) != 2) {
        return -1;
    }
    return 0;
}

int i2c_read_block(int fd, uint8_t reg, uint8_t *data, int len) {
    if (write(fd, &reg, 1) != 1) {
        return -1;
    }
    if (read(fd, data, len) != len) {
        return -1;
    }
    return 0;
}

/* 讀取 BME280 ID */
int bme280_read_id(int fd, uint8_t *chip_id) {
    return i2c_read_byte(fd, BME280_REG_ID, chip_id);
}

/* 讀取校準參數 */
int bme280_read_calibration(int fd, bme280_calib_t *calib) {
    uint8_t buf[26];

    /* 讀取溫度和壓力校準參數 (0x88-0xA1) */
    if (i2c_read_block(fd, BME280_REG_CALIB00, buf, 26) < 0) {
        return -1;
    }

    calib->dig_T1 = (buf[1] << 8) | buf[0];
    calib->dig_T2 = (int16_t)((buf[3] << 8) | buf[2]);
    calib->dig_T3 = (int16_t)((buf[5] << 8) | buf[4]);
    calib->dig_P1 = (buf[7] << 8) | buf[6];
    calib->dig_P2 = (int16_t)((buf[9] << 8) | buf[8]);
    calib->dig_P3 = (int16_t)((buf[11] << 8) | buf[10]);
    calib->dig_P4 = (int16_t)((buf[13] << 8) | buf[12]);
    calib->dig_P5 = (int16_t)((buf[15] << 8) | buf[14]);
    calib->dig_P6 = (int16_t)((buf[17] << 8) | buf[16]);
    calib->dig_P7 = (int16_t)((buf[19] << 8) | buf[18]);
    calib->dig_P8 = (int16_t)((buf[21] << 8) | buf[20]);
    calib->dig_P9 = (int16_t)((buf[23] << 8) | buf[22]);
    calib->dig_H1 = buf[25];

    /* 讀取濕度校準參數 (0xE1-0xE7) */
    uint8_t hum_calib[7];
    if (i2c_read_block(fd, BME280_REG_CALIB26, hum_calib, 7) < 0) {
        return -1;
    }

    calib->dig_H2 = (int16_t)((hum_calib[1] << 8) | hum_calib[0]);
    calib->dig_H3 = hum_calib[2];
    calib->dig_H4 = (int16_t)((hum_calib[3] << 4) | (hum_calib[4] & 0x0F));
    calib->dig_H5 = (int16_t)((hum_calib[5] << 4) | ((hum_calib[4] >> 4) & 0x0F));
    calib->dig_H6 = (int8_t)hum_calib[6];

    return 0;
}

/* 初始化 BME280 */
int bme280_init(int fd) {
    /* 配置採樣率和模式 */
    /* osrs_h = 1 (濕度過採樣 x1) */
    if (i2c_write_byte(fd, BME280_REG_CTRL_HUM, 0x01) < 0) {
        return -1;
    }

    /* osrs_t = 1, osrs_p = 1, mode = normal */
    if (i2c_write_byte(fd, BME280_REG_CTRL_MEAS, 0x27) < 0) {
        return -1;
    }

    /* t_sb = 1000ms, filter = off */
    if (i2c_write_byte(fd, BME280_REG_CONFIG, 0xA0) < 0) {
        return -1;
    }

    return 0;
}

/* 讀取原始數據 */
int bme280_read_raw(int fd, int32_t *adc_P, int32_t *adc_T, int32_t *adc_H) {
    uint8_t data[8];

    /* 讀取壓力、溫度、濕度 (0xF7-0xFE) */
    if (i2c_read_block(fd, BME280_REG_PRESS_MSB, data, 8) < 0) {
        return -1;
    }

    *adc_P = (data[0] << 12) | (data[1] << 4) | (data[2] >> 4);
    *adc_T = (data[3] << 12) | (data[4] << 4) | (data[5] >> 4);
    *adc_H = (data[6] << 8) | data[7];

    return 0;
}

/* 補償計算溫度 */
int32_t bme280_compensate_temperature(int32_t adc_T, bme280_calib_t *calib, int32_t *t_fine) {
    int32_t var1, var2, T;

    var1 = ((((adc_T >> 3) - ((int32_t)calib->dig_T1 << 1))) * ((int32_t)calib->dig_T2)) >> 11;
    var2 = (((((adc_T >> 4) - ((int32_t)calib->dig_T1)) * ((adc_T >> 4) - ((int32_t)calib->dig_T1))) >> 12) *
            ((int32_t)calib->dig_T3)) >> 14;
    *t_fine = var1 + var2;
    T = (*t_fine * 5 + 128) >> 8;

    return T;
}

/* 補償計算壓力 */
uint32_t bme280_compensate_pressure(int32_t adc_P, int32_t t_fine, bme280_calib_t *calib) {
    int64_t var1, var2, p;

    var1 = ((int64_t)t_fine) - 128000;
    var2 = var1 * var1 * (int64_t)calib->dig_P6;
    var2 = var2 + ((var1 * (int64_t)calib->dig_P5) << 17);
    var2 = var2 + (((int64_t)calib->dig_P4) << 35);
    var1 = ((var1 * var1 * (int64_t)calib->dig_P3) >> 8) + ((var1 * (int64_t)calib->dig_P2) << 12);
    var1 = (((((int64_t)1) << 47) + var1)) * ((int64_t)calib->dig_P1) >> 33;

    if (var1 == 0) {
        return 0;
    }

    p = 1048576 - adc_P;
    p = (((p << 31) - var2) * 3125) / var1;
    var1 = (((int64_t)calib->dig_P9) * (p >> 13) * (p >> 13)) >> 25;
    var2 = (((int64_t)calib->dig_P8) * p) >> 19;
    p = ((p + var1 + var2) >> 8) + (((int64_t)calib->dig_P7) << 4);

    return (uint32_t)p;
}

/* 補償計算濕度 */
uint32_t bme280_compensate_humidity(int32_t adc_H, int32_t t_fine, bme280_calib_t *calib) {
    int32_t v_x1_u32r;

    v_x1_u32r = (t_fine - ((int32_t)76800));
    v_x1_u32r = (((((adc_H << 14) - (((int32_t)calib->dig_H4) << 20) -
                    (((int32_t)calib->dig_H5) * v_x1_u32r)) + ((int32_t)16384)) >> 15) *
                 (((((((v_x1_u32r * ((int32_t)calib->dig_H6)) >> 10) *
                      (((v_x1_u32r * ((int32_t)calib->dig_H3)) >> 11) + ((int32_t)32768))) >> 10) +
                    ((int32_t)2097152)) * ((int32_t)calib->dig_H2) + 8192) >> 14));

    v_x1_u32r = (v_x1_u32r - (((((v_x1_u32r >> 15) * (v_x1_u32r >> 15)) >> 7) *
                                ((int32_t)calib->dig_H1)) >> 4));
    v_x1_u32r = (v_x1_u32r < 0) ? 0 : v_x1_u32r;
    v_x1_u32r = (v_x1_u32r > 419430400) ? 419430400 : v_x1_u32r;

    return (uint32_t)(v_x1_u32r >> 12);
}

int main(int argc, char *argv[]) {
    int fd;
    uint8_t chip_id;
    bme280_calib_t calib;
    int32_t adc_P, adc_T, adc_H;
    int32_t t_fine;
    int32_t temperature;
    uint32_t pressure, humidity;

    printf("BME280 溫濕度氣壓感測器範例\n");
    printf("=============================\n\n");

    /* 打開 I2C 設備 */
    fd = open(I2C_DEVICE, O_RDWR);
    if (fd < 0) {
        fprintf(stderr, "無法打開 I2C 設備: %s\n", strerror(errno));
        return 1;
    }

    /* 設置 I2C 從機地址 */
    if (ioctl(fd, I2C_SLAVE, BME280_ADDR) < 0) {
        fprintf(stderr, "無法設置 I2C 從機地址: %s\n", strerror(errno));
        close(fd);
        return 1;
    }

    /* 讀取晶片 ID */
    if (bme280_read_id(fd, &chip_id) < 0) {
        fprintf(stderr, "無法讀取晶片 ID\n");
        close(fd);
        return 1;
    }

    printf("晶片 ID: 0x%02X ", chip_id);
    if (chip_id == 0x60) {
        printf("(BME280) ✓\n\n");
    } else {
        printf("(未知)\n");
        fprintf(stderr, "警告: 晶片 ID 不匹配，期望 0x60\n\n");
    }

    /* 讀取校準參數 */
    printf("讀取校準參數...\n");
    if (bme280_read_calibration(fd, &calib) < 0) {
        fprintf(stderr, "無法讀取校準參數\n");
        close(fd);
        return 1;
    }
    printf("校準參數讀取完成\n\n");

    /* 初始化感測器 */
    printf("初始化感測器...\n");
    if (bme280_init(fd) < 0) {
        fprintf(stderr, "無法初始化感測器\n");
        close(fd);
        return 1;
    }
    printf("感測器初始化完成\n\n");

    /* 等待第一次測量完成 */
    sleep(1);

    /* 連續讀取 10 次 */
    printf("開始讀取數據...\n");
    printf("--------------------------------------------------\n");

    for (int i = 0; i < 10; i++) {
        /* 讀取原始數據 */
        if (bme280_read_raw(fd, &adc_P, &adc_T, &adc_H) < 0) {
            fprintf(stderr, "無法讀取數據\n");
            break;
        }

        /* 補償計算 */
        temperature = bme280_compensate_temperature(adc_T, &calib, &t_fine);
        pressure = bme280_compensate_pressure(adc_P, t_fine, &calib);
        humidity = bme280_compensate_humidity(adc_H, t_fine, &calib);

        /* 顯示結果 */
        printf("測量 %2d: ", i + 1);
        printf("溫度: %6.2f °C  ", temperature / 100.0);
        printf("濕度: %5.2f %%  ", humidity / 1024.0);
        printf("氣壓: %7.2f hPa\n", pressure / 25600.0);

        sleep(1);
    }

    printf("--------------------------------------------------\n");

    close(fd);
    printf("\n測量完成\n");

    return 0;
}
