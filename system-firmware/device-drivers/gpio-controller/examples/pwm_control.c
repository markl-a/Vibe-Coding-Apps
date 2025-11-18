/*
 * GPIO PWM Control Example
 *
 * 演示如何使用 GPIO PWM 功能控制 LED 亮度或馬達速度
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <stdint.h>

#define PWM_CHIP_PATH "/sys/class/pwm/pwmchip0"
#define PWM_EXPORT (PWM_CHIP_PATH "/export")
#define PWM_UNEXPORT (PWM_CHIP_PATH "/unexport")

/* PWM 通道結構 */
typedef struct {
    int channel;
    int period_ns;
    int duty_cycle_ns;
    int enabled;
} pwm_channel_t;

/* 匯出 PWM 通道 */
int pwm_export(int channel)
{
    int fd;
    char buf[16];

    fd = open(PWM_EXPORT, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open export");
        return -1;
    }

    snprintf(buf, sizeof(buf), "%d", channel);
    if (write(fd, buf, strlen(buf)) < 0) {
        if (errno != EBUSY) {  /* 已經匯出則忽略錯誤 */
            perror("Failed to export PWM");
            close(fd);
            return -1;
        }
    }

    close(fd);
    return 0;
}

/* 取消匯出 PWM 通道 */
int pwm_unexport(int channel)
{
    int fd;
    char buf[16];

    fd = open(PWM_UNEXPORT, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open unexport");
        return -1;
    }

    snprintf(buf, sizeof(buf), "%d", channel);
    write(fd, buf, strlen(buf));
    close(fd);

    return 0;
}

/* 設定 PWM 週期 (奈秒) */
int pwm_set_period(int channel, int period_ns)
{
    int fd;
    char path[256];
    char buf[32];

    snprintf(path, sizeof(path), "%s/pwm%d/period", PWM_CHIP_PATH, channel);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open period file");
        return -1;
    }

    snprintf(buf, sizeof(buf), "%d", period_ns);
    if (write(fd, buf, strlen(buf)) < 0) {
        perror("Failed to write period");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 設定 PWM 占空比 (奈秒) */
int pwm_set_duty_cycle(int channel, int duty_cycle_ns)
{
    int fd;
    char path[256];
    char buf[32];

    snprintf(path, sizeof(path), "%s/pwm%d/duty_cycle", PWM_CHIP_PATH, channel);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open duty_cycle file");
        return -1;
    }

    snprintf(buf, sizeof(buf), "%d", duty_cycle_ns);
    if (write(fd, buf, strlen(buf)) < 0) {
        perror("Failed to write duty_cycle");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 設定 PWM 極性 */
int pwm_set_polarity(int channel, const char *polarity)
{
    int fd;
    char path[256];

    snprintf(path, sizeof(path), "%s/pwm%d/polarity", PWM_CHIP_PATH, channel);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open polarity file");
        return -1;
    }

    if (write(fd, polarity, strlen(polarity)) < 0) {
        perror("Failed to write polarity");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 啟用 PWM */
int pwm_enable(int channel)
{
    int fd;
    char path[256];

    snprintf(path, sizeof(path), "%s/pwm%d/enable", PWM_CHIP_PATH, channel);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open enable file");
        return -1;
    }

    if (write(fd, "1", 1) < 0) {
        perror("Failed to enable PWM");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 禁用 PWM */
int pwm_disable(int channel)
{
    int fd;
    char path[256];

    snprintf(path, sizeof(path), "%s/pwm%d/enable", PWM_CHIP_PATH, channel);

    fd = open(path, O_WRONLY);
    if (fd < 0) {
        perror("Failed to open enable file");
        return -1;
    }

    if (write(fd, "0", 1) < 0) {
        perror("Failed to disable PWM");
        close(fd);
        return -1;
    }

    close(fd);
    return 0;
}

/* 初始化 PWM 通道 */
int pwm_init(pwm_channel_t *pwm, int channel, int freq_hz)
{
    pwm->channel = channel;
    pwm->period_ns = 1000000000 / freq_hz;  /* 頻率轉週期 */
    pwm->duty_cycle_ns = 0;
    pwm->enabled = 0;

    /* 匯出通道 */
    if (pwm_export(channel) < 0) {
        return -1;
    }

    /* 設定週期 */
    if (pwm_set_period(channel, pwm->period_ns) < 0) {
        return -1;
    }

    printf("PWM%d initialized: frequency=%dHz, period=%dns\n",
           channel, freq_hz, pwm->period_ns);

    return 0;
}

/* 設定占空比百分比 (0-100) */
int pwm_set_duty_percent(pwm_channel_t *pwm, int percent)
{
    if (percent < 0 || percent > 100) {
        fprintf(stderr, "Duty cycle must be 0-100%%\n");
        return -1;
    }

    pwm->duty_cycle_ns = (pwm->period_ns * percent) / 100;

    return pwm_set_duty_cycle(pwm->channel, pwm->duty_cycle_ns);
}

/* LED 呼吸燈效果 */
void pwm_breathing_effect(pwm_channel_t *pwm, int cycles)
{
    int i, j;

    printf("Starting breathing effect (%d cycles)...\n", cycles);

    pwm_enable(pwm->channel);

    for (i = 0; i < cycles; i++) {
        /* 淡入 */
        for (j = 0; j <= 100; j += 2) {
            pwm_set_duty_percent(pwm, j);
            usleep(20000);  /* 20ms */
        }

        /* 淡出 */
        for (j = 100; j >= 0; j -= 2) {
            pwm_set_duty_percent(pwm, j);
            usleep(20000);
        }
    }

    pwm_disable(pwm->channel);
}

/* 馬達速度控制示範 */
void pwm_motor_control(pwm_channel_t *pwm)
{
    int speeds[] = {0, 25, 50, 75, 100};
    int i;

    printf("Motor speed control demo...\n");

    pwm_enable(pwm->channel);

    for (i = 0; i < sizeof(speeds) / sizeof(speeds[0]); i++) {
        printf("Setting motor speed to %d%%\n", speeds[i]);
        pwm_set_duty_percent(pwm, speeds[i]);
        sleep(2);
    }

    /* 緩慢停止 */
    printf("Slowing down...\n");
    for (i = 100; i >= 0; i -= 5) {
        pwm_set_duty_percent(pwm, i);
        usleep(100000);  /* 100ms */
    }

    pwm_disable(pwm->channel);
}

/* 伺服馬達控制示範 (50Hz, 1-2ms 脈衝) */
void pwm_servo_control(pwm_channel_t *pwm)
{
    /* 伺服馬達通常使用 50Hz (20ms 週期) */
    int period_ns = 20000000;  /* 20ms */
    int positions[] = {
        1000000,   /* 1.0ms = 0°   */
        1500000,   /* 1.5ms = 90°  */
        2000000    /* 2.0ms = 180° */
    };
    int i;

    printf("Servo control demo (50Hz)...\n");

    /* 設定週期為 20ms */
    pwm_set_period(pwm->channel, period_ns);
    pwm->period_ns = period_ns;

    pwm_enable(pwm->channel);

    for (i = 0; i < 3; i++) {
        printf("Moving to position %d: %dns pulse\n", i, positions[i]);
        pwm_set_duty_cycle(pwm->channel, positions[i]);
        sleep(1);
    }

    /* 回到中心位置 */
    printf("Returning to center (90°)\n");
    pwm_set_duty_cycle(pwm->channel, 1500000);
    sleep(1);

    pwm_disable(pwm->channel);
}

/* 顯示幫助資訊 */
void print_usage(const char *prog)
{
    printf("Usage: %s <channel> <mode> [options]\n", prog);
    printf("\nModes:\n");
    printf("  led <duty%%>         - Set LED brightness (0-100%%)\n");
    printf("  breathing <cycles>  - LED breathing effect\n");
    printf("  motor <speed%%>      - Set motor speed (0-100%%)\n");
    printf("  motor-demo          - Motor speed control demo\n");
    printf("  servo <angle>       - Set servo angle (0-180°)\n");
    printf("  servo-demo          - Servo control demo\n");
    printf("  custom <freq> <duty%%> - Custom frequency and duty cycle\n");
    printf("\nExamples:\n");
    printf("  %s 0 led 50              # LED at 50%% brightness\n", prog);
    printf("  %s 0 breathing 5         # 5 breathing cycles\n", prog);
    printf("  %s 0 motor 75            # Motor at 75%% speed\n", prog);
    printf("  %s 0 servo 90            # Servo to 90°\n", prog);
    printf("  %s 0 custom 1000 50      # 1kHz, 50%% duty\n", prog);
}

int main(int argc, char *argv[])
{
    pwm_channel_t pwm;
    int channel;
    char *mode;

    if (argc < 3) {
        print_usage(argv[0]);
        return 1;
    }

    channel = atoi(argv[1]);
    mode = argv[2];

    /* LED 控制 */
    if (strcmp(mode, "led") == 0) {
        int duty_percent;

        if (argc < 4) {
            fprintf(stderr, "Missing duty cycle percentage\n");
            return 1;
        }

        duty_percent = atoi(argv[3]);

        /* 初始化 PWM (1kHz) */
        if (pwm_init(&pwm, channel, 1000) < 0) {
            return 1;
        }

        printf("Setting LED brightness to %d%%\n", duty_percent);
        pwm_set_duty_percent(&pwm, duty_percent);
        pwm_enable(channel);

        printf("Press Enter to stop...\n");
        getchar();

        pwm_disable(channel);
    }
    /* 呼吸燈效果 */
    else if (strcmp(mode, "breathing") == 0) {
        int cycles = argc >= 4 ? atoi(argv[3]) : 3;

        if (pwm_init(&pwm, channel, 1000) < 0) {
            return 1;
        }

        pwm_breathing_effect(&pwm, cycles);
    }
    /* 馬達控制 */
    else if (strcmp(mode, "motor") == 0) {
        int speed_percent;

        if (argc < 4) {
            fprintf(stderr, "Missing speed percentage\n");
            return 1;
        }

        speed_percent = atoi(argv[3]);

        /* 初始化 PWM (20kHz，適合馬達控制) */
        if (pwm_init(&pwm, channel, 20000) < 0) {
            return 1;
        }

        printf("Setting motor speed to %d%%\n", speed_percent);
        pwm_set_duty_percent(&pwm, speed_percent);
        pwm_enable(channel);

        printf("Press Enter to stop...\n");
        getchar();

        pwm_disable(channel);
    }
    /* 馬達控制示範 */
    else if (strcmp(mode, "motor-demo") == 0) {
        if (pwm_init(&pwm, channel, 20000) < 0) {
            return 1;
        }

        pwm_motor_control(&pwm);
    }
    /* 伺服馬達控制 */
    else if (strcmp(mode, "servo") == 0 || strcmp(mode, "servo-demo") == 0) {
        if (pwm_init(&pwm, channel, 50) < 0) {  /* 50Hz */
            return 1;
        }

        if (strcmp(mode, "servo-demo") == 0) {
            pwm_servo_control(&pwm);
        } else {
            int angle;
            int pulse_ns;

            if (argc < 4) {
                fprintf(stderr, "Missing angle (0-180)\n");
                return 1;
            }

            angle = atoi(argv[3]);
            if (angle < 0 || angle > 180) {
                fprintf(stderr, "Angle must be 0-180°\n");
                return 1;
            }

            /* 將角度轉換為脈衝寬度 (1-2ms) */
            pulse_ns = 1000000 + (angle * 1000000 / 180);

            printf("Setting servo to %d° (%dns pulse)\n", angle, pulse_ns);
            pwm_set_duty_cycle(channel, pulse_ns);
            pwm_enable(channel);

            printf("Press Enter to stop...\n");
            getchar();

            pwm_disable(channel);
        }
    }
    /* 自訂頻率和占空比 */
    else if (strcmp(mode, "custom") == 0) {
        int freq_hz, duty_percent;

        if (argc < 5) {
            fprintf(stderr, "Missing frequency or duty cycle\n");
            return 1;
        }

        freq_hz = atoi(argv[3]);
        duty_percent = atoi(argv[4]);

        if (pwm_init(&pwm, channel, freq_hz) < 0) {
            return 1;
        }

        printf("Custom PWM: %dHz, %d%% duty\n", freq_hz, duty_percent);
        pwm_set_duty_percent(&pwm, duty_percent);
        pwm_enable(channel);

        printf("Press Enter to stop...\n");
        getchar();

        pwm_disable(channel);
    }
    else {
        fprintf(stderr, "Unknown mode: %s\n", mode);
        print_usage(argv[0]);
        return 1;
    }

    /* 清理 */
    pwm_unexport(channel);

    return 0;
}
