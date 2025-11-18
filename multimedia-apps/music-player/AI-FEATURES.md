# 🤖 AI 增強功能 - Music Player

## 智能音樂分析

自動分析每首歌曲的特徵：

- **節奏檢測 (BPM)**: 自動檢測歌曲節奏
- **音調識別**: 識別歌曲的主音調和音階
- **曲風分類**: 自動分類音樂曲風
- **情緒分析**: 判斷歌曲情緒（快樂/悲傷/平靜等）
- **能量值**: 評估歌曲的能量和強度
- **舞蹈性**: 評估適合跳舞的程度

## 智能播放列表

AI 驅動的播放列表生成：

### 1. 相似歌曲推薦

基於當前歌曲自動生成相似播放列表：

```javascript
// 根據一首歌生成相似播放列表
const playlist = ai.generateSmartPlaylist(library, seedSong, 20);
```

**相似度算法**:
- 節奏相似度: 40%
- 情緒相似度: 30%
- 曲風相似度: 30%

### 2. 情境播放列表

根據場景自動選擇音樂：

- **運動健身**: 高能量、快節奏 (130-160 BPM)
- **專注工作**: 中等節奏、無歌詞 (90-110 BPM)
- **放鬆休息**: 低能量、慢節奏 (60-80 BPM)
- **派對聚會**: 高舞蹈性、流行曲風
- **睡眠助眠**: 極低能量、環境音樂

### 3. 學習用戶偏好

AI 會學習你的收聽習慣：

- 記錄播放歷史
- 分析收聽時間和頻率
- 識別喜愛的曲風和藝人
- 自動調整推薦算法

## 智能推薦系統

### 下一首歌曲推薦

自動推薦最合適的下一首歌：

```javascript
const nextSong = ai.recommendNext(history, library);
```

**推薦因素**:
1. 與當前歌曲的相似度
2. 用戶歷史偏好
3. 時間和情境
4. 避免重複播放

### 相似藝人推薦

基於當前藝人推薦相似藝人：

```javascript
const similar = ai.recommendSimilarArtists('Taylor Swift', library);
// 返回: ['Ariana Grande', 'Selena Gomez', ...]
```

## 自動均衡器

AI 根據音樂類型自動調整均衡器：

| 曲風 | 低音 | 中音 | 高音 |
|------|------|------|------|
| Electronic | +3dB | 0dB | +2dB |
| Rock | +2dB | +1dB | +2dB |
| Ballad | 0dB | +2dB | +1dB |
| Classical | 0dB | +1dB | 0dB |

```javascript
const eqSettings = ai.autoEqualizer(songFeatures);
applyEqualizer(eqSettings);
```

## 音樂報告

生成詳細的音樂分析報告：

```
🎵 音樂分析報告

節奏: 128 BPM
曲風: Pop
情緒: Energetic
音調: C Major
舞蹈性: 85%
情感值: 78%
響度: 45 dB
```

## 播放統計與洞察

AI 分析你的收聽習慣：

### 收聽統計

- **最愛曲風**: Top 5 曲風及比例
- **收聽時段**: 不同時間段的收聽偏好
- **節奏偏好**: 偏好的 BPM 範圍
- **情緒分布**: 收聽音樂的情緒分布

### 個性化洞察

```
📊 你的音樂品味

最常聽的曲風: Pop (35%), Rock (25%), Electronic (20%)
平均節奏偏好: 120 BPM
情緒偏好: Energetic (45%), Happy (30%)
最活躍時段: 晚上 20:00 - 22:00

💡 建議: 你可能會喜歡 Indie Pop 和 Alternative Rock
```

## 歌詞同步與分析

- **歌詞自動同步**: AI 自動匹配歌詞時間軸
- **關鍵詞提取**: 提取歌曲主題關鍵詞
- **情感分析**: 分析歌詞情感傾向
- **翻譯**: 多語言歌詞翻譯

## 音質增強

- **音頻升頻**: 提升音質到更高採樣率
- **低音增強**: 智能增強低音表現
- **空間音效**: 模擬環繞聲效果
- **虛擬音響**: 優化耳機聽音體驗

## 使用示例

### 完整工作流程

```javascript
// 1. 創建 AI 實例
const ai = new MusicPlayerAI();

// 2. 載入並分析音樂
const audioBuffer = await loadAudio('song.mp3');
const features = await ai.analyzeMusicFeatures('song.mp3', audioBuffer);

console.log('分析結果:', features);
// { tempo: 128, genre: 'pop', mood: 'energetic', ... }

// 3. 生成報告
const report = ai.generateMusicReport(features);
console.log(report);

// 4. 生成智能播放列表
const playlist = ai.generateSmartPlaylist(musicLibrary, currentSong, 20);

// 5. 推薦下一首
const next = ai.recommendNext(playHistory, musicLibrary);

// 6. 自動調整均衡器
const eqSettings = ai.autoEqualizer(features);
applyEqualizer(eqSettings);
```

## 技術實現

### 音頻分析技術

1. **Web Audio API**: 瀏覽器原生音頻處理
2. **FFT 分析**: 頻譜分析和節奏檢測
3. **機器學習**: 曲風和情緒分類
4. **統計分析**: 用戶偏好學習

### 可選集成

- **Spotify API**: 獲取官方音樂元數據
- **Last.fm API**: 獲取標籤和推薦
- **MusicBrainz**: 音樂數據庫
- **Essentia.js**: 專業音頻分析庫

## 隱私保護

- 所有分析在本地進行
- 不上傳音頻文件到服務器
- 用戶數據僅本地存儲
- 可隨時清除分析緩存

## 性能優化

- 使用緩存避免重複分析
- 後台異步處理
- 漸進式分析策略
- 低功耗模式支持

---

**讓 AI 成為你的私人 DJ！** 🎧
