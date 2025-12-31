module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type 必須是以下之一
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 錯誤修復
        'docs',     // 文檔變更
        'style',    // 代碼格式(不影響代碼運行的變動)
        'refactor', // 重構(既不是新增功能，也不是修改bug的代碼變動)
        'perf',     // 性能優化
        'test',     // 增加測試
        'build',    // 構建系統或外部依賴的變更
        'ci',       // CI配置文件和腳本的變更
        'chore',    // 其他不修改src或test文件的變更
        'revert',   // 回退先前的提交
      ],
    ],
    // Subject 不能為空
    'subject-empty': [2, 'never'],
    // Subject 不能以句號結尾
    'subject-full-stop': [2, 'never', '.'],
    // Subject 必須小寫開頭
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    // Type 必須小寫
    'type-case': [2, 'always', 'lower-case'],
    // Type 不能為空
    'type-empty': [2, 'never'],
    // Scope 必須小寫
    'scope-case': [2, 'always', 'lower-case'],
    // Header 最大長度
    'header-max-length': [2, 'always', 100],
    // Body 每行最大長度
    'body-max-line-length': [2, 'always', 100],
    // Footer 每行最大長度
    'footer-max-line-length': [2, 'always', 100],
  },
};
