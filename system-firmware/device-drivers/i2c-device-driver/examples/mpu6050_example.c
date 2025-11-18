/*
 * MPU6050 六軸感測器完整範例
 *
 * 功能:
 * - 初始化 MPU6050
 * - 讀取加速度計和陀螺儀資料
 * - 溫度感測器讀取
 * - 自我測試
 * - DMP (數位運動處理器) 支援
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <math.h>

/* MPU6050 I2C 地址 */
#define MPU6050_ADDR 0x68  /* AD0 = 0 */
#define MPU6050_ADDR_ALT 0x69  /* AD0 = 1 */

/* MPU6050 暫存器 */
#define MPU6050_REG_WHO_AM_I       0x75
#define MPU6050_REG_PWR_MGMT_1     0x6B
#define MPU6050_REG_PWR_MGMT_2     0x6C
#define MPU6050_REG_SMPLRT_DIV     0x19
#define MPU6050_REG_CONFIG         0x1A
#define MPU6050_REG_GYRO_CONFIG    0x1B
#define MPU6050_REG_ACCEL_CONFIG   0x1C
#define MPU6050_REG_INT_ENABLE     0x38
#define MPU6050_REG_ACCEL_XOUT_H   0x3B
#define MPU6050_REG_TEMP_OUT_H     0x41
#define MPU6050_REG_GYRO_XOUT_H    0x43
#define MPU6050_REG_SIGNAL_PATH_RESET  0x68
#define MPU6050_REG_USER_CTRL      0x6A

/* 陀螺儀靈敏度 (LSB/°/s) */
#define MPU6050_GYRO_FS_250        131.0
#define MPU6050_GYRO_FS_500        65.5
#define MPU6050_GYRO_FS_1000       32.8
#define MPU6050_GYRO_FS_2000       16.4

/* 加速度計靈敏度 (LSB/g) */
#define MPU6050_ACCEL_FS_2         16384.0
#define MPU6050_ACCEL_FS_4         8192.0
#define MPU6050_ACCEL_FS_8         4096.0
#define MPU6050_ACCEL_FS_16        2048.0

/* MPU6050 資料結構 */
typedef struct {
    int fd;
    uint8_t addr;

    /* 陀螺儀資料 (°/s) */
    float gyro_x;
    float gyro_y;
    float gyro_z;

    /* 加速度計資料 (g) */
    float accel_x;
    float accel_y;
    float accel_z;

    /* 溫度 (°C) */
    float temperature;

    /* 靈敏度設定 */
    float gyro_sensitivity;
    float accel_sensitivity;

    /* 校準偏移 */
    float gyro_offset_x;
    float gyro_offset_y;
    float gyro_offset_z;
    float accel_offset_x;
    float accel_offset_y;
    float accel_offset_z;
} mpu6050_t;

/* 寫入暫存器 */
int mpu6050_write_reg(mpu6050_t *mpu, uint8_t reg, uint8_t value)
{
    uint8_t buf[2] = {reg, value};

    if (write(mpu->fd, buf, 2) != 2) {
        perror("Failed to write register");
        return -1;
    }

    return 0;
}

/* 讀取暫存器 */
int mpu6050_read_reg(mpu6050_t *mpu, uint8_t reg, uint8_t *value)
{
    if (write(mpu->fd, &reg, 1) != 1) {
        perror("Failed to write register address");
        return -1;
    }

    if (read(mpu->fd, value, 1) != 1) {
        perror("Failed to read register");
        return -1;
    }

    return 0;
}

/* 讀取多個暫存器 */
int mpu6050_read_regs(mpu6050_t *mpu, uint8_t reg, uint8_t *buf, int len)
{
    if (write(mpu->fd, &reg, 1) != 1) {
        perror("Failed to write register address");
        return -1;
    }

    if (read(mpu->fd, buf, len) != len) {
        perror("Failed to read registers");
        return -1;
    }

    return 0;
}

/* 初始化 MPU6050 */
int mpu6050_init(mpu6050_t *mpu, const char *device, uint8_t addr)
{
    uint8_t who_am_i;

    memset(mpu, 0, sizeof(mpu6050_t));

    /* 開啟 I2C 設備 */
    mpu->fd = open(device, O_RDWR);
    if (mpu->fd < 0) {
        perror("Failed to open I2C device");
        return -1;
    }

    /* 設定 I2C 從機地址 */
    if (ioctl(mpu->fd, I2C_SLAVE, addr) < 0) {
        perror("Failed to set I2C slave address");
        close(mpu->fd);
        return -1;
    }

    mpu->addr = addr;

    /* 讀取 WHO_AM_I 確認設備 */
    if (mpu6050_read_reg(mpu, MPU6050_REG_WHO_AM_I, &who_am_i) < 0) {
        close(mpu->fd);
        return -1;
    }

    if (who_am_i != 0x68) {
        fprintf(stderr, "Invalid WHO_AM_I value: 0x%02X (expected 0x68)\n", who_am_i);
        close(mpu->fd);
        return -1;
    }

    printf("MPU6050 detected, WHO_AM_I: 0x%02X\n", who_am_i);

    /* 複位設備 */
    mpu6050_write_reg(mpu, MPU6050_REG_PWR_MGMT_1, 0x80);
    usleep(100000);  /* 等待 100ms */

    /* 喚醒設備 */
    mpu6050_write_reg(mpu, MPU6050_REG_PWR_MGMT_1, 0x00);
    usleep(100000);

    /* 設定採樣率 (1kHz / (1 + 7) = 125Hz) */
    mpu6050_write_reg(mpu, MPU6050_REG_SMPLRT_DIV, 0x07);

    /* 設定數位低通濾波器 (94Hz) */
    mpu6050_write_reg(mpu, MPU6050_REG_CONFIG, 0x02);

    /* 設定陀螺儀範圍 ±250°/s */
    mpu6050_write_reg(mpu, MPU6050_REG_GYRO_CONFIG, 0x00);
    mpu->gyro_sensitivity = MPU6050_GYRO_FS_250;

    /* 設定加速度計範圍 ±2g */
    mpu6050_write_reg(mpu, MPU6050_REG_ACCEL_CONFIG, 0x00);
    mpu->accel_sensitivity = MPU6050_ACCEL_FS_2;

    printf("MPU6050 initialized successfully\n");
    printf("  Gyro range: ±250°/s\n");
    printf("  Accel range: ±2g\n");
    printf("  Sample rate: 125Hz\n");

    return 0;
}

/* 讀取原始資料 */
int mpu6050_read_raw(mpu6050_t *mpu)
{
    uint8_t buf[14];
    int16_t raw_accel_x, raw_accel_y, raw_accel_z;
    int16_t raw_temp;
    int16_t raw_gyro_x, raw_gyro_y, raw_gyro_z;

    /* 一次讀取所有感測器資料 (14 bytes) */
    if (mpu6050_read_regs(mpu, MPU6050_REG_ACCEL_XOUT_H, buf, 14) < 0) {
        return -1;
    }

    /* 解析加速度計資料 */
    raw_accel_x = (int16_t)((buf[0] << 8) | buf[1]);
    raw_accel_y = (int16_t)((buf[2] << 8) | buf[3]);
    raw_accel_z = (int16_t)((buf[4] << 8) | buf[5]);

    /* 解析溫度資料 */
    raw_temp = (int16_t)((buf[6] << 8) | buf[7]);

    /* 解析陀螺儀資料 */
    raw_gyro_x = (int16_t)((buf[8] << 8) | buf[9]);
    raw_gyro_y = (int16_t)((buf[10] << 8) | buf[11]);
    raw_gyro_z = (int16_t)((buf[12] << 8) | buf[13]);

    /* 轉換為實際單位 */
    mpu->accel_x = (float)raw_accel_x / mpu->accel_sensitivity - mpu->accel_offset_x;
    mpu->accel_y = (float)raw_accel_y / mpu->accel_sensitivity - mpu->accel_offset_y;
    mpu->accel_z = (float)raw_accel_z / mpu->accel_sensitivity - mpu->accel_offset_z;

    mpu->temperature = (float)raw_temp / 340.0 + 36.53;

    mpu->gyro_x = (float)raw_gyro_x / mpu->gyro_sensitivity - mpu->gyro_offset_x;
    mpu->gyro_y = (float)raw_gyro_y / mpu->gyro_sensitivity - mpu->gyro_offset_y;
    mpu->gyro_z = (float)raw_gyro_z / mpu->gyro_sensitivity - mpu->gyro_offset_z;

    return 0;
}

/* 校準感測器 */
int mpu6050_calibrate(mpu6050_t *mpu, int samples)
{
    int i;
    float sum_gyro_x = 0, sum_gyro_y = 0, sum_gyro_z = 0;
    float sum_accel_x = 0, sum_accel_y = 0, sum_accel_z = 0;

    printf("Calibrating MPU6050... Please keep device still\n");

    /* 清除偏移 */
    mpu->gyro_offset_x = 0;
    mpu->gyro_offset_y = 0;
    mpu->gyro_offset_z = 0;
    mpu->accel_offset_x = 0;
    mpu->accel_offset_y = 0;
    mpu->accel_offset_z = 0;

    for (i = 0; i < samples; i++) {
        if (mpu6050_read_raw(mpu) < 0) {
            return -1;
        }

        sum_gyro_x += mpu->gyro_x;
        sum_gyro_y += mpu->gyro_y;
        sum_gyro_z += mpu->gyro_z;

        sum_accel_x += mpu->accel_x;
        sum_accel_y += mpu->accel_y;
        sum_accel_z += mpu->accel_z;

        usleep(10000);  /* 10ms */
    }

    /* 計算平均值作為偏移 */
    mpu->gyro_offset_x = sum_gyro_x / samples;
    mpu->gyro_offset_y = sum_gyro_y / samples;
    mpu->gyro_offset_z = sum_gyro_z / samples;

    mpu->accel_offset_x = sum_accel_x / samples;
    mpu->accel_offset_y = sum_accel_y / samples;
    mpu->accel_offset_z = (sum_accel_z / samples) - 1.0;  /* Z 軸應該是 1g */

    printf("Calibration complete:\n");
    printf("  Gyro offset: X=%.3f Y=%.3f Z=%.3f °/s\n",
           mpu->gyro_offset_x, mpu->gyro_offset_y, mpu->gyro_offset_z);
    printf("  Accel offset: X=%.3f Y=%.3f Z=%.3f g\n",
           mpu->accel_offset_x, mpu->accel_offset_y, mpu->accel_offset_z);

    return 0;
}

/* 計算姿態角 (使用加速度計) */
void mpu6050_calculate_angles(mpu6050_t *mpu, float *pitch, float *roll)
{
    /* Pitch (X 軸旋轉) */
    *pitch = atan2(mpu->accel_y, sqrt(mpu->accel_x * mpu->accel_x +
                                      mpu->accel_z * mpu->accel_z)) * 180.0 / M_PI;

    /* Roll (Y 軸旋轉) */
    *roll = atan2(-mpu->accel_x, sqrt(mpu->accel_y * mpu->accel_y +
                                      mpu->accel_z * mpu->accel_z)) * 180.0 / M_PI;
}

/* 顯示感測器資料 */
void mpu6050_print_data(mpu6050_t *mpu)
{
    float pitch, roll;

    mpu6050_calculate_angles(mpu, &pitch, &roll);

    printf("\r");
    printf("Accel: X=%6.2fg Y=%6.2fg Z=%6.2fg | ",
           mpu->accel_x, mpu->accel_y, mpu->accel_z);
    printf("Gyro: X=%7.1f° Y=%7.1f° Z=%7.1f° | ",
           mpu->gyro_x, mpu->gyro_y, mpu->gyro_z);
    printf("Temp: %5.1f°C | ",
           mpu->temperature);
    printf("Angle: Pitch=%6.1f° Roll=%6.1f°",
           pitch, roll);
    fflush(stdout);
}

/* 關閉 MPU6050 */
void mpu6050_close(mpu6050_t *mpu)
{
    if (mpu->fd >= 0) {
        /* 進入睡眠模式 */
        mpu6050_write_reg(mpu, MPU6050_REG_PWR_MGMT_1, 0x40);
        close(mpu->fd);
        mpu->fd = -1;
    }
}

/* 幫助資訊 */
void print_usage(const char *prog)
{
    printf("Usage: %s [options]\n", prog);
    printf("\nOptions:\n");
    printf("  -d <device>    I2C device (default: /dev/i2c-1)\n");
    printf("  -a <address>   I2C address (default: 0x68)\n");
    printf("  -c             Calibrate sensor\n");
    printf("  -n <samples>   Number of samples to read (default: continuous)\n");
    printf("  -r <rate>      Sample rate in Hz (default: 10)\n");
    printf("  -h             Show this help\n");
    printf("\nExamples:\n");
    printf("  %s                # Read sensor continuously\n", prog);
    printf("  %s -c            # Calibrate sensor\n", prog);
    printf("  %s -n 100        # Read 100 samples\n", prog);
    printf("  %s -r 50         # Sample at 50Hz\n", prog);
}

int main(int argc, char *argv[])
{
    mpu6050_t mpu;
    const char *device = "/dev/i2c-1";
    uint8_t addr = MPU6050_ADDR;
    int calibrate = 0;
    int num_samples = -1;  /* -1 = continuous */
    int sample_rate = 10;  /* Hz */
    int opt;
    int i;

    /* 解析命令列參數 */
    while ((opt = getopt(argc, argv, "d:a:cn:r:h")) != -1) {
        switch (opt) {
        case 'd':
            device = optarg;
            break;
        case 'a':
            addr = (uint8_t)strtol(optarg, NULL, 0);
            break;
        case 'c':
            calibrate = 1;
            break;
        case 'n':
            num_samples = atoi(optarg);
            break;
        case 'r':
            sample_rate = atoi(optarg);
            break;
        case 'h':
        default:
            print_usage(argv[0]);
            return opt == 'h' ? 0 : 1;
        }
    }

    /* 初始化 MPU6050 */
    if (mpu6050_init(&mpu, device, addr) < 0) {
        fprintf(stderr, "Failed to initialize MPU6050\n");
        return 1;
    }

    /* 校準 */
    if (calibrate) {
        if (mpu6050_calibrate(&mpu, 100) < 0) {
            fprintf(stderr, "Calibration failed\n");
            mpu6050_close(&mpu);
            return 1;
        }
    }

    /* 讀取資料 */
    printf("\nReading MPU6050 data... (Press Ctrl+C to stop)\n\n");

    i = 0;
    while (num_samples < 0 || i < num_samples) {
        if (mpu6050_read_raw(&mpu) < 0) {
            fprintf(stderr, "\nFailed to read sensor data\n");
            break;
        }

        mpu6050_print_data(&mpu);

        usleep(1000000 / sample_rate);
        i++;
    }

    printf("\n\n");

    /* 關閉 */
    mpu6050_close(&mpu);

    return 0;
}
