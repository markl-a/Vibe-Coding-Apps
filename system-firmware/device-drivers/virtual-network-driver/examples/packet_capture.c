/*
 * 虛擬網卡數據包接收測試
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>

int main() {
    int sock;
    struct sockaddr_in server, client;
    char buffer[1024];
    socklen_t client_len;

    printf("虛擬網卡數據包接收測試\n");
    printf("監聽 0.0.0.0:8888\n\n");

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock < 0) {
        perror("創建 socket 失敗");
        return 1;
    }

    memset(&server, 0, sizeof(server));
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = INADDR_ANY;
    server.sin_port = htons(8888);

    if (bind(sock, (struct sockaddr*)&server, sizeof(server)) < 0) {
        perror("綁定失敗");
        close(sock);
        return 1;
    }

    printf("等待數據...\n");

    client_len = sizeof(client);
    int n = recvfrom(sock, buffer, sizeof(buffer) - 1, 0,
                     (struct sockaddr*)&client, &client_len);

    if (n > 0) {
        buffer[n] = 0;
        printf("接收到數據: %s\n", buffer);
        printf("來源: %s:%d\n",
               inet_ntoa(client.sin_addr),
               ntohs(client.sin_port));
    }

    close(sock);
    return 0;
}
