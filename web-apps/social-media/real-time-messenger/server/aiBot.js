/**
 * AI 聊天機器人模組
 * 提供智能回覆、問題回答、內容審核等功能
 */

class AIBot {
  constructor() {
    this.botUser = {
      id: 'ai-bot',
      nickname: 'AI 助手',
      isBot: true,
    }

    // AI 回覆模板
    this.responses = {
      greeting: [
        '你好!我是 AI 助手,很高興為你服務!👋',
        '嗨!有什麼我可以幫助你的嗎?😊',
        '你好呀!需要什麼協助嗎?',
      ],
      help: [
        '我可以幫助你:\n' +
        '• 回答問題\n' +
        '• 提供建議\n' +
        '• 翻譯文字\n' +
        '• 解釋概念\n' +
        '• 聊天陪伴\n\n' +
        '直接 @AI助手 加上你的問題即可!',
      ],
      farewell: [
        '再見!祝你有美好的一天!👋',
        '掰掰!隨時找我聊天喔!',
        '再會!保持開心!😊',
      ],
      thanks: [
        '不客氣!很高興能幫到你!😊',
        '樂意效勞!有其他問題隨時問我!',
        '別客氣!這是我的榮幸!',
      ],
      unknown: [
        '抱歉,我不太理解你的問題。可以換個方式問我嗎?🤔',
        '我還在學習中...能請你用其他方式表達嗎?',
        '嗯...這個問題有點難倒我了。可以說得更詳細一點嗎?',
      ],
    }

    // 知識庫
    this.knowledge = {
      'javascript': '◆ JavaScript 是一種高階、直譯式的程式語言,主要用於網頁開發。它支援物件導向、函數式和事件驅動的編程範式。',
      'typescript': '◆ TypeScript 是 JavaScript 的超集,加入了靜態型別檢查。它能在開發階段捕獲錯誤,提升代碼品質和開發效率。',
      'react': '◆ React 是 Facebook 開發的 JavaScript 函式庫,用於構建用戶界面。它採用組件化開發,使用虛擬 DOM 提升效能。',
      'next.js': '◆ Next.js 是基於 React 的全端框架,提供 SSR、SSG、檔案路由等功能,是現代化 Web 開發的最佳選擇之一。',
      'socket.io': '◆ Socket.IO 是一個實時雙向通訊庫,基於 WebSocket,並提供降級方案。非常適合聊天應用、即時協作等場景。',
      'node.js': '◆ Node.js 是基於 Chrome V8 引擎的 JavaScript 運行環境,讓 JavaScript 可以在伺服器端運行,廣泛用於後端開發。',
      'prisma': '◆ Prisma 是新一代 ORM,提供型別安全的資料庫操作。它支援多種資料庫,提供直觀的 Schema 定義和強大的查詢能力。',
      'tailwind': '◆ Tailwind CSS 是一個功能類優先的 CSS 框架,提供大量實用類別,讓你快速構建自定義設計。',
    }

    // 常見問題
    this.faq = {
      '如何使用': '使用很簡單!選擇或建立聊天室,然後就可以開始聊天了。支援表情符號、多行訊息等功能。',
      '功能': '這個聊天室支援:\n• 即時訊息\n• 多個聊天室\n• 在線用戶列表\n• 打字指示器\n• 表情符號\n• AI 助手',
      '技術': '技術棧:\n• Frontend: Next.js 14 + TypeScript + Tailwind CSS\n• Backend: Node.js + Socket.io\n• State: Zustand\n• Validation: Zod',
    }

    // 情緒識別關鍵字
    this.sentiments = {
      positive: ['開心', '高興', '快樂', '棒', '讚', '好', '愛', '喜歡', '感謝', '謝謝'],
      negative: ['難過', '傷心', '生氣', '憤怒', '討厭', '糟糕', '失望', '沮喪'],
      question: ['什麼', '為什麼', '怎麼', '如何', '哪裡', '誰', '嗎', '?', '?'],
    }
  }

  /**
   * 處理訊息並產生回覆
   */
  async processMessage(message, room) {
    const content = message.content.toLowerCase().trim()

    // 檢查是否 @提及 AI 助手
    if (!this.isMentioned(message.content)) {
      return null
    }

    // 移除 @提及 部分,取得實際問題
    const question = this.extractQuestion(message.content)

    // 生成回覆
    const response = await this.generateResponse(question, message)

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.botUser.id,
      username: this.botUser.nickname,
      content: response,
      timestamp: new Date().toISOString(),
      roomId: message.roomId,
      isBot: true,
      replyTo: message.id,
    }
  }

  /**
   * 檢查訊息是否提及 AI 助手
   */
  isMentioned(content) {
    const mentions = ['@ai助手', '@ai', '@助手', '@bot']
    return mentions.some(mention =>
      content.toLowerCase().includes(mention)
    )
  }

  /**
   * 提取問題內容
   */
  extractQuestion(content) {
    const mentions = ['@ai助手', '@ai', '@助手', '@bot']
    let question = content

    mentions.forEach(mention => {
      question = question.toLowerCase().replace(mention, '').trim()
    })

    return question
  }

  /**
   * 生成智能回覆
   */
  async generateResponse(question, originalMessage) {
    const q = question.toLowerCase()

    // 1. 問候檢測
    if (this.isGreeting(q)) {
      return this.randomResponse(this.responses.greeting)
    }

    // 2. 告別檢測
    if (this.isFarewell(q)) {
      return this.randomResponse(this.responses.farewell)
    }

    // 3. 感謝檢測
    if (this.isThanks(q)) {
      return this.randomResponse(this.responses.thanks)
    }

    // 4. 幫助請求
    if (this.isHelpRequest(q)) {
      return this.responses.help[0]
    }

    // 5. 知識庫查詢
    const knowledgeResponse = this.searchKnowledge(q)
    if (knowledgeResponse) {
      return knowledgeResponse
    }

    // 6. FAQ 查詢
    const faqResponse = this.searchFAQ(q)
    if (faqResponse) {
      return faqResponse
    }

    // 7. 技術問題回答
    const techResponse = this.answerTechQuestion(q)
    if (techResponse) {
      return techResponse
    }

    // 8. 翻譯請求
    if (this.isTranslationRequest(q)) {
      return this.handleTranslation(question)
    }

    // 9. 計算請求
    if (this.isCalculationRequest(q)) {
      return this.handleCalculation(question)
    }

    // 10. 時間查詢
    if (this.isTimeQuery(q)) {
      return this.handleTimeQuery()
    }

    // 11. 情緒回應
    const emotionResponse = this.handleEmotion(q)
    if (emotionResponse) {
      return emotionResponse
    }

    // 12. 聊天對話
    return this.casualChat(q)
  }

  /**
   * 檢測問候
   */
  isGreeting(text) {
    const greetings = ['你好', '嗨', 'hi', 'hello', '哈囉', '早安', '午安', '晚安']
    return greetings.some(g => text.includes(g))
  }

  /**
   * 檢測告別
   */
  isFarewell(text) {
    const farewells = ['再見', '掰掰', 'bye', '88', '拜拜']
    return farewells.some(f => text.includes(f))
  }

  /**
   * 檢測感謝
   */
  isThanks(text) {
    const thanks = ['謝謝', '感謝', 'thanks', 'thank you', 'thx']
    return thanks.some(t => text.includes(t))
  }

  /**
   * 檢測幫助請求
   */
  isHelpRequest(text) {
    const helpKeywords = ['幫助', '幫我', 'help', '功能', '怎麼用', '如何使用']
    return helpKeywords.some(k => text.includes(k))
  }

  /**
   * 搜尋知識庫
   */
  searchKnowledge(question) {
    for (const [key, value] of Object.entries(this.knowledge)) {
      if (question.includes(key)) {
        return value
      }
    }
    return null
  }

  /**
   * 搜尋 FAQ
   */
  searchFAQ(question) {
    for (const [key, value] of Object.entries(this.faq)) {
      if (question.includes(key)) {
        return `💡 ${value}`
      }
    }
    return null
  }

  /**
   * 回答技術問題
   */
  answerTechQuestion(question) {
    if (question.includes('什麼是') || question.includes('介紹')) {
      return '請告訴我你想了解哪個技術?例如: JavaScript, React, Node.js, Socket.io 等。'
    }

    if (question.includes('推薦')) {
      return '💡 推薦學習路線:\n1. HTML/CSS 基礎\n2. JavaScript 核心\n3. React 框架\n4. Next.js 全端開發\n5. TypeScript 型別系統\n\n每天進步一點點,持續學習最重要!💪'
    }

    if (question.includes('學習')) {
      return '📚 學習建議:\n• 動手實作很重要\n• 多看官方文檔\n• 參與開源專案\n• 寫技術筆記\n• 保持好奇心!\n\n加油!你可以的!🚀'
    }

    return null
  }

  /**
   * 處理翻譯請求
   */
  isTranslationRequest(text) {
    return text.includes('翻譯') || text.includes('translate')
  }

  handleTranslation(text) {
    return '抱歉,我目前不支援翻譯功能。你可以使用 Google 翻譯或 DeepL 等專業工具。'
  }

  /**
   * 處理計算請求
   */
  isCalculationRequest(text) {
    return text.match(/\d+[\+\-\*\/]\d+/) !== null
  }

  handleCalculation(text) {
    try {
      const match = text.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/)
      if (match) {
        const [, num1, op, num2] = match
        let result
        switch(op) {
          case '+': result = parseInt(num1) + parseInt(num2); break
          case '-': result = parseInt(num1) - parseInt(num2); break
          case '*': result = parseInt(num1) * parseInt(num2); break
          case '/': result = parseInt(num1) / parseInt(num2); break
        }
        return `計算結果: ${num1} ${op} ${num2} = ${result} 🧮`
      }
    } catch (e) {
      return '抱歉,我無法計算這個表達式。'
    }
    return null
  }

  /**
   * 處理時間查詢
   */
  isTimeQuery(text) {
    const timeKeywords = ['時間', '幾點', '日期', '今天', '現在']
    return timeKeywords.some(k => text.includes(k))
  }

  handleTimeQuery() {
    const now = new Date()
    const time = now.toLocaleTimeString('zh-TW')
    const date = now.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
    return `⏰ 現在時間:\n${date}\n${time}`
  }

  /**
   * 處理情緒
   */
  handleEmotion(text) {
    const hasPositive = this.sentiments.positive.some(w => text.includes(w))
    const hasNegative = this.sentiments.negative.some(w => text.includes(w))

    if (hasPositive) {
      const responses = [
        '太好了!我也為你感到開心!😊',
        '聽起來很棒!保持這個好心情!🎉',
        '真替你高興!繼續加油!💪',
      ]
      return this.randomResponse(responses)
    }

    if (hasNegative) {
      const responses = [
        '別難過,一切都會好起來的!如果需要聊聊,我都在。💙',
        '我理解你的感受。深呼吸,給自己一些時間。🫂',
        '沒事的,明天會更好!相信自己!🌟',
      ]
      return this.randomResponse(responses)
    }

    return null
  }

  /**
   * 閒聊對話
   */
  casualChat(text) {
    const responses = [
      '這是個有趣的話題!能告訴我更多嗎?🤔',
      '嗯嗯,我懂了!還有其他想聊的嗎?',
      '有道理!你的觀點很獨特。',
      '說得好!我正在學習你的表達方式。📝',
      '真有意思!繼續說下去吧。',
    ]
    return this.randomResponse(responses)
  }

  /**
   * 隨機選擇回覆
   */
  randomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)]
  }

  /**
   * 內容審核 (檢測不當內容)
   */
  moderateContent(content) {
    const inappropriateWords = [
      '髒話1', '髒話2', // 實際使用時應該有完整列表
    ]

    const hasInappropriate = inappropriateWords.some(word =>
      content.toLowerCase().includes(word)
    )

    return {
      isAppropriate: !hasInappropriate,
      severity: hasInappropriate ? 'high' : 'low',
      message: hasInappropriate ? '⚠️ 檢測到不當內容,請保持文明用語。' : null,
    }
  }

  /**
   * 取得機器人用戶資訊
   */
  getBotUser() {
    return this.botUser
  }
}

module.exports = new AIBot()
