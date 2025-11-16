/**
 * 域名解析工具
 */
export class DomainParser {
  /**
   * 從 URL 提取根域名
   */
  static extractRootDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return this.getRootDomain(hostname);
    } catch {
      return '';
    }
  }

  /**
   * 從主機名獲取根域名
   */
  static getRootDomain(hostname: string): string {
    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }
    // 返回最後兩個部分（如 example.com）
    return parts.slice(-2).join('.');
  }

  /**
   * 檢查兩個域名是否相同
   */
  static isSameDomain(url1: string, url2: string): boolean {
    const domain1 = this.extractRootDomain(url1);
    const domain2 = this.extractRootDomain(url2);
    return domain1 === domain2;
  }

  /**
   * 檢查域名是否在列表中
   */
  static isInDomainList(url: string, domainList: string[]): boolean {
    const hostname = this.extractRootDomain(url);
    return domainList.some(domain =>
      hostname.includes(domain) || domain.includes(hostname)
    );
  }
}
