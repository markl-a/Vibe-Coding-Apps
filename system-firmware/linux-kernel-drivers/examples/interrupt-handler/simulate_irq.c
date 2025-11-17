/*
 * simulate_irq.c - 模擬中斷觸發（僅用於測試）
 *
 * 注意: 此程序僅用於演示目的
 * 實際的中斷由硬體觸發
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>

static volatile int running = 1;

void signal_handler(int sig)
{
    printf("\n捕獲信號 %d，退出...\n", sig);
    running = 0;
}

int main(int argc, char *argv[])
{
    int count = 0;
    int interval = 1;  /* 秒 */

    printf("=== 中斷模擬器 ===\n\n");
    printf("這是一個概念演示程序\n");
    printf("實際的中斷由硬體設備觸發\n\n");

    if (argc > 1) {
        interval = atoi(argv[1]);
        if (interval < 1) interval = 1;
    }

    printf("模擬間隔: %d 秒\n", interval);
    printf("按 Ctrl+C 停止\n\n");

    /* 設置信號處理 */
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);

    /* 模擬中斷事件 */
    printf("開始模擬中斷事件...\n");
    printf("---------------------------------------------------\n");

    while (running) {
        count++;
        printf("[%d] 模擬中斷事件 #%d\n", (int)time(NULL), count);
        printf("    - 頂半部: 快速處理\n");
        printf("    - 底半部: 延遲處理\n");

        sleep(interval);
    }

    printf("\n---------------------------------------------------\n");
    printf("總共模擬了 %d 次中斷事件\n", count);
    printf("\n=== 程序結束 ===\n");

    return 0;
}
