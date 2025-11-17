/*
 * test_concurrent.c - 字元設備並發訪問測試
 *
 * 測試多個進程同時訪問字元設備
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/wait.h>
#include <time.h>

#define DEVICE_PATH "/dev/simple_char"
#define NUM_PROCESSES 3
#define ITERATIONS 5

void child_process(int proc_id)
{
    int fd;
    char buffer[256];
    int i;

    fd = open(DEVICE_PATH, O_RDWR);
    if (fd < 0) {
        perror("Child: Failed to open device");
        exit(1);
    }

    printf("[Process %d] 開始測試...\n", proc_id);

    for (i = 0; i < ITERATIONS; i++) {
        /* 寫入數據 */
        snprintf(buffer, sizeof(buffer), "Process %d, Iteration %d", proc_id, i);
        write(fd, buffer, strlen(buffer));
        printf("[Process %d] 寫入: %s\n", proc_id, buffer);

        /* 短暫延遲 */
        usleep(100000);  /* 100ms */

        /* 讀取數據 */
        lseek(fd, 0, SEEK_SET);
        memset(buffer, 0, sizeof(buffer));
        read(fd, buffer, sizeof(buffer));
        printf("[Process %d] 讀取: %s\n", proc_id, buffer);

        usleep(50000);   /* 50ms */
    }

    close(fd);
    printf("[Process %d] 完成!\n", proc_id);
}

int main(void)
{
    pid_t pids[NUM_PROCESSES];
    int i;

    printf("=== 字元設備並發訪問測試 ===\n");
    printf("創建 %d 個並發進程...\n\n", NUM_PROCESSES);

    /* 創建子進程 */
    for (i = 0; i < NUM_PROCESSES; i++) {
        pids[i] = fork();

        if (pids[i] < 0) {
            perror("Fork failed");
            exit(1);
        } else if (pids[i] == 0) {
            /* 子進程 */
            child_process(i + 1);
            exit(0);
        }
    }

    /* 等待所有子進程完成 */
    for (i = 0; i < NUM_PROCESSES; i++) {
        waitpid(pids[i], NULL, 0);
    }

    printf("\n=== 所有進程完成 ===\n");
    return 0;
}
