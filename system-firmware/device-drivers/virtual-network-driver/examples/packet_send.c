/*
 * 虛擬網卡數據包發送測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

int main() {
    int sock;
    struct sockaddr_in dest;
    char message[] = "Hello Virtual Network!";

    printf("虛擬網卡數據包發送測試\n\n");

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        perror("創建 socket 失敗");
        return 1;
    }

    memset(&dest, 0, sizeof(dest));
    dest.sin_family = AF_INET;
    dest.sin_port = htons(8888);
    inet_pton(AF_INET, "192.168.100.2", &dest.sin_addr);

    printf("發送數據: %s\n", message);
    printf("目標: 192.168.100.2:8888\n\n");

    if (sendto(sock, message, strlen(message), 0,
               (struct sockaddr*)&dest, sizeof(dest)) < 0) {
        perror("發送失敗");
        close(sock);
        return 1;
    }

    printf("發送成功\n");

    close(sock);
    return 0;
}
