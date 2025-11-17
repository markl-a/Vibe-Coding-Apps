# 圖片資源

此目錄用於存放產品圖片和其他靜態資源。

## 圖片來源

目前專案使用 Unsplash 的圖片作為產品展示圖片。這些圖片通過 Next.js 的 Image 組件自動優化和加載。

## 如何添加自己的圖片

1. 將圖片放在此目錄中
2. 在 `lib/mockData.ts` 中更新產品的 `images` 數組
3. 使用相對路徑引用圖片，例如：`/images/your-image.jpg`

## 建議的圖片規格

- **格式**: JPG, PNG, WebP
- **尺寸**: 至少 800x800 像素（正方形）
- **大小**: 盡量控制在 500KB 以內
- **質量**: 高質量產品圖片能提升用戶體驗

## Placeholder 圖片

如果需要 placeholder 圖片，可以在此目錄添加一個 `placeholder.png` 文件作為後備圖片。
