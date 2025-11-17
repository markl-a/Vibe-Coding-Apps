/*
 * 虛擬網卡連通性測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <errno.h>

int main() {
    int sock;
    struct sockaddr_in dest;
    char message[] = "ping";
    char buffer[1024];
    struct timeval tv = {1, 0};  // 1 second timeout

    printf("虛擬網卡連通性測試\n\n");

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        perror("創建 socket 失敗");
        return 1;
    }

    setsockopt(sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    memset(&dest, 0, sizeof(dest));
    dest.sin_family = AF_INET;
    dest.sin_port = htons(7);  // Echo port
    inet_pton(AF_INET, "192.168.100.2", &dest.sin_addr);

    printf("Ping 192.168.100.2...\n");

    if (sendto(sock, message, strlen(message), 0,
               (struct sockaddr*)&dest, sizeof(dest)) < 0) {
        perror("發送失敗");
        close(sock);
        return 1;
    }

    int n = recvfrom(sock, buffer, sizeof(buffer) - 1, 0, NULL, NULL);
    if (n > 0) {
        printf("連通性測試成功！\n");
    } else {
        printf("連通性測試失敗（超時或錯誤）\n");
    }

    close(sock);
    return 0;
}
