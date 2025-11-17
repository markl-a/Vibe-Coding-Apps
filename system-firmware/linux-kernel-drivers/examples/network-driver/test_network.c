/*
 * test_network.c - 虛擬網路設備測試程序
 *
 * 使用原始 socket 測試虛擬網路設備
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/ioctl.h>
#include <net/if.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <linux/if_packet.h>
#include <linux/if_ether.h>
#include <errno.h>

#define INTERFACE_NAME "vnet0"
#define BUFFER_SIZE 2048

void print_packet_hex(unsigned char *packet, int len)
{
    int i;
    printf("   數據包內容 (%d 字節):\n   ", len);
    for (i = 0; i < len && i < 64; i++) {
        printf("%02x ", packet[i]);
        if ((i + 1) % 16 == 0)
            printf("\n   ");
    }
    if (len > 64)
        printf("...");
    printf("\n");
}

int main(void)
{
    int sockfd;
    struct ifreq ifr;
    struct sockaddr_ll sa;
    unsigned char buffer[BUFFER_SIZE];
    unsigned char packet[BUFFER_SIZE];
    int packet_len;
    ssize_t ret;
    int i;

    printf("=== 虛擬網路設備測試程序 ===\n\n");

    /* 創建原始 socket */
    printf("1. 創建原始 socket...\n");
    sockfd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
    if (sockfd < 0) {
        perror("Failed to create socket");
        printf("   提示: 請使用 sudo 執行此程序\n");
        return 1;
    }
    printf("   成功!\n\n");

    /* 獲取接口索引 */
    printf("2. 獲取接口信息 (%s)...\n", INTERFACE_NAME);
    memset(&ifr, 0, sizeof(ifr));
    strncpy(ifr.ifr_name, INTERFACE_NAME, IFNAMSIZ - 1);

    if (ioctl(sockfd, SIOCGIFINDEX, &ifr) < 0) {
        perror("Failed to get interface index");
        printf("   提示: 請先載入驅動並啟動接口:\n");
        printf("   sudo insmod ../../network-driver/virtual_netdev.ko\n");
        printf("   sudo ip link set %s up\n", INTERFACE_NAME);
        close(sockfd);
        return 1;
    }
    printf("   接口索引: %d\n", ifr.ifr_ifindex);

    /* 獲取 MAC 地址 */
    if (ioctl(sockfd, SIOCGIFHWADDR, &ifr) >= 0) {
        printf("   MAC 地址: %02x:%02x:%02x:%02x:%02x:%02x\n",
               (unsigned char)ifr.ifr_hwaddr.sa_data[0],
               (unsigned char)ifr.ifr_hwaddr.sa_data[1],
               (unsigned char)ifr.ifr_hwaddr.sa_data[2],
               (unsigned char)ifr.ifr_hwaddr.sa_data[3],
               (unsigned char)ifr.ifr_hwaddr.sa_data[4],
               (unsigned char)ifr.ifr_hwaddr.sa_data[5]);
    }
    printf("\n");

    /* 綁定到接口 */
    printf("3. 綁定 socket 到接口...\n");
    memset(&sa, 0, sizeof(sa));
    sa.sll_family = AF_PACKET;
    sa.sll_protocol = htons(ETH_P_ALL);
    sa.sll_ifindex = ifr.ifr_ifindex;

    if (bind(sockfd, (struct sockaddr *)&sa, sizeof(sa)) < 0) {
        perror("Failed to bind socket");
        close(sockfd);
        return 1;
    }
    printf("   綁定成功!\n\n");

    /* 構造測試數據包 */
    printf("4. 構造以太網數據包...\n");
    memset(packet, 0, sizeof(packet));

    /* 目標 MAC (廣播) */
    memset(packet, 0xff, 6);
    /* 源 MAC (示例) */
    packet[6] = 0x00;
    packet[7] = 0x11;
    packet[8] = 0x22;
    packet[9] = 0x33;
    packet[10] = 0x44;
    packet[11] = 0x55;
    /* EtherType (0x0800 = IPv4) */
    packet[12] = 0x08;
    packet[13] = 0x00;
    /* 數據負載 */
    strcpy((char *)&packet[14], "Hello from test program!");
    packet_len = 14 + strlen("Hello from test program!");

    printf("   數據包長度: %d 字節\n", packet_len);
    print_packet_hex(packet, packet_len);
    printf("\n");

    /* 發送數據包 */
    printf("5. 發送數據包...\n");
    for (i = 0; i < 3; i++) {
        ret = send(sockfd, packet, packet_len, 0);
        if (ret < 0) {
            perror("Failed to send packet");
        } else {
            printf("   發送 #%d: %zd 字節\n", i + 1, ret);
        }
        usleep(100000);  /* 100ms */
    }
    printf("\n");

    /* 接收數據包（非阻塞，短暫超時）*/
    printf("6. 嘗試接收數據包 (2秒超時)...\n");
    struct timeval tv;
    tv.tv_sec = 2;
    tv.tv_usec = 0;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    int count = 0;
    while (count < 5) {
        ret = recv(sockfd, buffer, sizeof(buffer), 0);
        if (ret < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                printf("   超時，未接收到數據包\n");
                break;
            }
            perror("Failed to receive packet");
            break;
        }

        count++;
        printf("   接收 #%d: %zd 字節\n", count, ret);
        print_packet_hex(buffer, ret);
    }
    printf("\n");

    /* 關閉 socket */
    printf("7. 關閉 socket\n");
    close(sockfd);
    printf("   完成!\n\n");

    printf("=== 測試完成 ===\n");
    printf("提示: 查看內核日誌以了解詳細信息: dmesg | grep vnetdev\n");

    return 0;
}
