# 🤖 AI 音樂生成增強 - Music Generator

## 新增 AI 功能

### 1. 智能和弦進行生成

AI 根據音樂理論生成和諧的和弦進行：

```javascript
const ai = new MusicGeneratorAI();

// 生成和弦進行
const chordProgression = ai.generateChordProgression({
  key: 'C',
  scale: 'major',
  style: 'pop',
  complexity: 'medium',
  length: 8
});

// 返回: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G']
```

### 2. 旋律智能生成

基於音樂理論和機器學習的旋律生成：

```javascript
// 生成符合和弦的旋律
const melody = ai.generateMelody({
  chords: ['C', 'G', 'Am', 'F'],
  style: 'smooth',
  range: 'soprano',
  density: 'medium'
});
```

### 3. 節奏模式推薦

AI 推薦適合當前風格的節奏模式：

```javascript
// 根據風格推薦節奏
const rhythm = ai.recommendRhythmPattern({
  genre: 'pop',
  tempo: 120,
  energy: 'medium'
});

// 返回節奏模式和概率
[
  { pattern: 'kick-snare-kick-snare', probability: 0.85 },
  { pattern: 'complex-syncopation', probability: 0.65 }
]
```

### 4. 風格遷移

將一段旋律轉換為不同的音樂風格：

```javascript
// 風格遷移
const jazzVersion = ai.styleTransfer(originalMelody, {
  from: 'classical',
  to: 'jazz',
  preserveMelody: 0.8
});
```

### 5. 智能配器

AI 自動為旋律添加和聲和伴奏：

```javascript
// 自動配器
const arrangement = ai.autoArrange(melody, {
  instruments: ['piano', 'strings', 'bass'],
  complexity: 'medium',
  texture: 'lush'
});
```

### 6. 情緒驅動生成

根據目標情緒生成音樂：

```javascript
// 情緒驅動生成
const music = ai.generateByMood({
  mood: 'melancholic',
  energy: 30,
  tempo: 72,
  duration: 120
});
```

## 高級 AI 功能

### 音樂補全

AI 補全未完成的樂句：

```javascript
// 給定前半段，AI 生成後半段
const completion = ai.completePhrase({
  start: ['C4', 'E4', 'G4'],
  style: 'classical',
  coherence: 0.8
});
```

### 對位法生成

生成符合對位法規則的多聲部音樂：

```javascript
// 生成對位
const counterpoint = ai.generateCounterpoint({
  cantus: mainMelody,
  species: 'first',
  voices: 2
});
```

### 動機發展

基於短小動機發展完整樂句：

```javascript
// 動機發展
const developed = ai.developMotif({
  motif: ['C4', 'D4', 'E4'],
  techniques: ['sequence', 'inversion', 'retrograde'],
  length: 16
});
```

## 理論分析功能

### 和聲分析

分析生成音樂的和聲結構：

```javascript
const analysis = ai.analyzeHarmony(generatedMusic);
// {
//   key: 'C major',
//   modulations: [{ bar: 8, to: 'G major' }],
//   tension: [0.2, 0.4, 0.6, 0.3],
//   cadences: ['perfect', 'deceptive']
// }
```

### 複雜度評估

評估音樂的複雜程度：

```javascript
const complexity = ai.assessComplexity(music);
// {
//   harmonic: 0.7,
//   rhythmic: 0.6,
//   melodic: 0.5,
//   overall: 0.6
// }
```

## 交互式生成

### 實時調整

用戶輸入 → AI 實時調整：

```javascript
// 實時調整參數
ai.on('parameterChange', (param, value) => {
  const adjusted = ai.adjustRealtime(currentMusic, param, value);
  playMusic(adjusted);
});
```

### 協作創作

AI 與用戶協作創作：

```javascript
// 用戶寫主旋律，AI 生成伴奏
const collaboration = ai.collaborate({
  userInput: userMelody,
  aiRole: 'accompaniment',
  style: 'jazz'
});
```

## 學習與優化

### 風格學習

AI 學習用戶喜歡的風格：

```javascript
// 學習用戶偏好
ai.learnFromFeedback({
  music: generatedMusic,
  rating: 5,
  comments: ['太快了', '和弦進行很好']
});

// 下次生成會考慮這些偏好
```

### 進化算法

使用遺傳算法優化音樂：

```javascript
// 進化生成
const evolved = await ai.evolveMusic({
  generations: 50,
  population: 20,
  fitness: (music) => userRating(music),
  elitism: 0.1
});
```

## 導出與集成

### MIDI 導出

```javascript
// 導出為 MIDI
const midiData = ai.exportMIDI(generatedMusic, {
  tempo: 120,
  timeSignature: '4/4',
  instruments: instrumentMap
});
```

### 音樂 XML

```javascript
// 導出為 MusicXML (可在樂譜軟件中打開)
const musicXML = ai.exportMusicXML(generatedMusic);
```

### 音頻渲染

```javascript
// 直接渲染為音頻
const audio = await ai.renderToAudio(generatedMusic, {
  format: 'wav',
  sampleRate: 44100,
  instruments: virtualInstruments
});
```

## AI 模型建議

### 可接入的模型

1. **Magenta (Google)**: 音樂生成和風格遷移
   - MusicVAE
   - PerformanceRNN
   - Coconet

2. **OpenAI MuseNet**: 多風格音樂生成

3. **AIVA**: AI 作曲系統

4. **Jukebox**: 原始音頻生成

5. **Music Transformer**: 長序列音樂生成

### 自定義模型

```javascript
// 訓練自定義模型
ai.trainModel({
  dataset: midiFiles,
  architecture: 'transformer',
  epochs: 100,
  styleTag: 'my-style'
});
```

## 實際應用場景

### 遊戲配樂

```javascript
// 生成循環背景音樂
const bgm = ai.generateGameMusic({
  scene: 'battle',
  duration: 120,
  loopable: true,
  intensity: 0.8
});
```

### 廣告配樂

```javascript
// 生成商業音樂
const ad = ai.generateCommercial({
  duration: 30,
  mood: 'uplifting',
  brand: 'energetic',
  callToAction: true
});
```

### 冥想音樂

```javascript
// 生成放鬆音樂
const meditation = ai.generateAmbient({
  duration: 600,
  binaural: true,
  frequency: 432, // Hz
  evolving: true
});
```

### 學習輔助

```javascript
// 生成專注音樂
const focus = ai.generateFocusMusic({
  duration: 3600,
  tempo: 60,
  genre: 'minimal',
  noLyrics: true
});
```

## 音樂理論集成

### 調式音階

支持所有常見調式：

- Ionian (大調)
- Dorian (多利亞)
- Phrygian (弗里幾亞)
- Lydian (利底亞)
- Mixolydian (混合利底亞)
- Aeolian (小調)
- Locrian (洛克里亞)
- 五聲音階
- 布魯斯音階
- 全音階
- 半音階

### 和弦類型

支持複雜和弦：

```javascript
const chordTypes = [
  'major', 'minor', 'dim', 'aug',
  'maj7', 'min7', 'dom7', 'dim7',
  'maj9', 'min9', 'add9',
  'sus2', 'sus4',
  'slash chords' // 如 C/G
];
```

---

**用 AI 釋放你的音樂創造力！** 🎼
