/*
 * BH1750 數位光強度感測器範例
 *
 * 功能:
 * - 讀取環境光照強度 (lux)
 * - 支援多種解析度模式
 * - 連續和單次測量模式
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>

/* BH1750 I2C 地址 */
#define BH1750_ADDR_LOW  0x23  /* ADDR pin = LOW */
#define BH1750_ADDR_HIGH 0x5C  /* ADDR pin = HIGH */

/* BH1750 命令 */
#define BH1750_POWER_DOWN           0x00
#define BH1750_POWER_ON             0x01
#define BH1750_RESET                0x07

/* 連續測量模式 */
#define BH1750_CONT_HIGH_RES_MODE   0x10  /* 1lx解析度, 120ms */
#define BH1750_CONT_HIGH_RES_MODE2  0x11  /* 0.5lx解析度, 120ms */
#define BH1750_CONT_LOW_RES_MODE    0x13  /* 4lx解析度, 16ms */

/* 單次測量模式 */
#define BH1750_ONE_TIME_HIGH_RES    0x20
#define BH1750_ONE_TIME_HIGH_RES2   0x21
#define BH1750_ONE_TIME_LOW_RES     0x23

/* BH1750 資料結構 */
typedef struct {
    int fd;
    uint8_t addr;
    uint8_t mode;
    float measurement_time_factor;
} bh1750_t;

/* 寫入命令 */
int bh1750_write_cmd(bh1750_t *bh, uint8_t cmd)
{
    if (write(bh->fd, &cmd, 1) != 1) {
        perror("Failed to write command");
        return -1;
    }
    return 0;
}

/* 讀取資料 */
int bh1750_read_data(bh1750_t *bh, uint16_t *raw_data)
{
    uint8_t buf[2];

    if (read(bh->fd, buf, 2) != 2) {
        perror("Failed to read data");
        return -1;
    }

    *raw_data = (buf[0] << 8) | buf[1];
    return 0;
}

/* 初始化 BH1750 */
int bh1750_init(bh1750_t *bh, const char *device, uint8_t addr)
{
    memset(bh, 0, sizeof(bh1750_t));

    /* 開啟 I2C 設備 */
    bh->fd = open(device, O_RDWR);
    if (bh->fd < 0) {
        perror("Failed to open I2C device");
        return -1;
    }

    /* 設定 I2C 從機地址 */
    if (ioctl(bh->fd, I2C_SLAVE, addr) < 0) {
        perror("Failed to set I2C slave address");
        close(bh->fd);
        return -1;
    }

    bh->addr = addr;
    bh->measurement_time_factor = 1.0;

    /* 開機 */
    if (bh1750_write_cmd(bh, BH1750_POWER_ON) < 0) {
        close(bh->fd);
        return -1;
    }

    printf("BH1750 initialized at address 0x%02X\n", addr);

    return 0;
}

/* 設定測量模式 */
int bh1750_set_mode(bh1750_t *bh, uint8_t mode)
{
    bh->mode = mode;

    if (bh1750_write_cmd(bh, mode) < 0) {
        return -1;
    }

    /* 等待測量完成 */
    switch (mode) {
    case BH1750_CONT_LOW_RES_MODE:
    case BH1750_ONE_TIME_LOW_RES:
        usleep(16000 * bh->measurement_time_factor);  /* 16ms */
        break;
    default:
        usleep(120000 * bh->measurement_time_factor);  /* 120ms */
        break;
    }

    return 0;
}

/* 讀取光照強度 (lux) */
float bh1750_read_light(bh1750_t *bh)
{
    uint16_t raw_data;
    float lux;

    /* 單次模式需要重新觸發測量 */
    if (bh->mode >= 0x20) {
        bh1750_write_cmd(bh, bh->mode);

        /* 等待測量完成 */
        switch (bh->mode) {
        case BH1750_ONE_TIME_LOW_RES:
            usleep(16000 * bh->measurement_time_factor);
            break;
        default:
            usleep(120000 * bh->measurement_time_factor);
            break;
        }
    }

    /* 讀取原始資料 */
    if (bh1750_read_data(bh, &raw_data) < 0) {
        return -1.0;
    }

    /* 轉換為 lux */
    lux = (float)raw_data / 1.2;

    /* 高解析度模式 2 需要除以 2 */
    if (bh->mode == BH1750_CONT_HIGH_RES_MODE2 ||
        bh->mode == BH1750_ONE_TIME_HIGH_RES2) {
        lux /= 2.0;
    }

    /* 調整測量時間因子 */
    lux *= bh->measurement_time_factor;

    return lux;
}

/* 調整靈敏度 */
int bh1750_set_measurement_time(bh1750_t *bh, uint8_t time)
{
    uint8_t cmd_high, cmd_low;

    if (time < 31 || time > 254) {
        fprintf(stderr, "Measurement time must be 31-254\n");
        return -1;
    }

    /* 計算因子 */
    bh->measurement_time_factor = (float)time / 69.0;

    /* 發送高位 */
    cmd_high = 0x40 | (time >> 5);
    if (bh1750_write_cmd(bh, cmd_high) < 0) {
        return -1;
    }

    /* 發送低位 */
    cmd_low = 0x60 | (time & 0x1F);
    if (bh1750_write_cmd(bh, cmd_low) < 0) {
        return -1;
    }

    printf("Measurement time set to %d (factor: %.2f)\n",
           time, bh->measurement_time_factor);

    return 0;
}

/* 關閉 BH1750 */
void bh1750_close(bh1750_t *bh)
{
    if (bh->fd >= 0) {
        bh1750_write_cmd(bh, BH1750_POWER_DOWN);
        close(bh->fd);
        bh->fd = -1;
    }
}

/* 解釋光照等級 */
const char* get_light_level_description(float lux)
{
    if (lux < 1) return "非常暗 (黑夜)";
    else if (lux < 3) return "很暗 (深夜)";
    else if (lux < 10) return "暗 (夜晚)";
    else if (lux < 50) return "昏暗 (房間燈光)";
    else if (lux < 100) return "正常室內照明";
    else if (lux < 300) return "明亮室內";
    else if (lux < 500) return "辦公室照明";
    else if (lux < 1000) return "陰天戶外";
    else if (lux < 10000) return "多雲戶外";
    else if (lux < 32000) return "陽光充足";
    else if (lux < 100000) return "直射陽光";
    else return "極度明亮";
}

/* 幫助資訊 */
void print_usage(const char *prog)
{
    printf("Usage: %s [options]\n", prog);
    printf("\nOptions:\n");
    printf("  -d <device>    I2C device (default: /dev/i2c-1)\n");
    printf("  -a <address>   I2C address: 0x23 or 0x5C (default: 0x23)\n");
    printf("  -m <mode>      Measurement mode:\n");
    printf("                   0 = Continuous high res (1lx)\n");
    printf("                   1 = Continuous high res 2 (0.5lx)\n");
    printf("                   2 = Continuous low res (4lx)\n");
    printf("                   3 = One-time high res\n");
    printf("                   4 = One-time high res 2\n");
    printf("                   5 = One-time low res\n");
    printf("  -n <samples>   Number of samples (default: continuous)\n");
    printf("  -r <rate>      Sample rate in Hz (default: 1)\n");
    printf("  -t <time>      Measurement time 31-254 (default: 69)\n");
    printf("  -h             Show this help\n");
    printf("\nExamples:\n");
    printf("  %s                  # Read light level continuously\n", prog);
    printf("  %s -m 1 -n 10      # High res mode 2, 10 samples\n", prog);
    printf("  %s -r 5            # Sample at 5Hz\n", prog);
    printf("  %s -t 200          # Increase sensitivity\n", prog);
}

int main(int argc, char *argv[])
{
    bh1750_t bh;
    const char *device = "/dev/i2c-1";
    uint8_t addr = BH1750_ADDR_LOW;
    uint8_t mode_select = 0;
    int num_samples = -1;
    int sample_rate = 1;
    uint8_t meas_time = 69;  /* 默認值 */
    int opt;
    int i;

    /* 測量模式對應表 */
    uint8_t modes[] = {
        BH1750_CONT_HIGH_RES_MODE,
        BH1750_CONT_HIGH_RES_MODE2,
        BH1750_CONT_LOW_RES_MODE,
        BH1750_ONE_TIME_HIGH_RES,
        BH1750_ONE_TIME_HIGH_RES2,
        BH1750_ONE_TIME_LOW_RES
    };

    const char *mode_names[] = {
        "Continuous High Res (1lx)",
        "Continuous High Res 2 (0.5lx)",
        "Continuous Low Res (4lx)",
        "One-time High Res (1lx)",
        "One-time High Res 2 (0.5lx)",
        "One-time Low Res (4lx)"
    };

    /* 解析命令列參數 */
    while ((opt = getopt(argc, argv, "d:a:m:n:r:t:h")) != -1) {
        switch (opt) {
        case 'd':
            device = optarg;
            break;
        case 'a':
            addr = (uint8_t)strtol(optarg, NULL, 0);
            break;
        case 'm':
            mode_select = atoi(optarg);
            if (mode_select >= 6) {
                fprintf(stderr, "Invalid mode: %d\n", mode_select);
                return 1;
            }
            break;
        case 'n':
            num_samples = atoi(optarg);
            break;
        case 'r':
            sample_rate = atoi(optarg);
            break;
        case 't':
            meas_time = atoi(optarg);
            break;
        case 'h':
        default:
            print_usage(argv[0]);
            return opt == 'h' ? 0 : 1;
        }
    }

    /* 初始化 BH1750 */
    if (bh1750_init(&bh, device, addr) < 0) {
        fprintf(stderr, "Failed to initialize BH1750\n");
        return 1;
    }

    /* 設定測量時間 */
    if (meas_time != 69) {
        if (bh1750_set_measurement_time(&bh, meas_time) < 0) {
            bh1750_close(&bh);
            return 1;
        }
    }

    /* 設定測量模式 */
    printf("Mode: %s\n", mode_names[mode_select]);
    if (bh1750_set_mode(&bh, modes[mode_select]) < 0) {
        fprintf(stderr, "Failed to set mode\n");
        bh1750_close(&bh);
        return 1;
    }

    /* 讀取資料 */
    printf("\nReading light intensity... (Press Ctrl+C to stop)\n\n");
    printf("%-15s  %-20s  %s\n", "Time", "Lux", "Description");
    printf("%s\n", "------------------------------------------------------------");

    i = 0;
    while (num_samples < 0 || i < num_samples) {
        float lux;
        time_t now;
        char time_str[32];

        lux = bh1750_read_light(&bh);
        if (lux < 0) {
            fprintf(stderr, "\nFailed to read light level\n");
            break;
        }

        /* 獲取當前時間 */
        now = time(NULL);
        strftime(time_str, sizeof(time_str), "%H:%M:%S", localtime(&now));

        printf("\r%-15s  %-10.2f lux      %-30s",
               time_str, lux, get_light_level_description(lux));
        fflush(stdout);

        usleep(1000000 / sample_rate);
        i++;
    }

    printf("\n\n");

    /* 關閉 */
    bh1750_close(&bh);

    return 0;
}
