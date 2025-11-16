import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

interface FileInfo {
  name: string;
  size: number;
  path: string;
}

type OperationMode = 'encrypt' | 'decrypt';

function App() {
  const [mode, setMode] = useState<OperationMode>('encrypt');
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 選擇檔案
  const selectFile = async () => {
    try {
      const filePath = await open({
        multiple: false,
        filters: mode === 'decrypt'
          ? [{ name: 'Encrypted Files', extensions: ['enc'] }]
          : [],
      });

      if (filePath) {
        const info = await invoke<FileInfo>('get_file_info', {
          filePath: filePath as string
        });
        setSelectedFile(info);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Failed to select file:', error);
      setStatusMessage(`選擇檔案失敗: ${error}`);
    }
  };

  // 加密檔案
  const encryptFile = async () => {
    if (!selectedFile || !password) {
      setStatusMessage('請選擇檔案並輸入密碼');
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('正在加密檔案...');

      // 選擇輸出路徑
      const outputPath = await save({
        defaultPath: `${selectedFile.name}.enc`,
        filters: [{ name: 'Encrypted Files', extensions: ['enc'] }],
      });

      if (!outputPath) {
        setStatusMessage('已取消');
        setIsProcessing(false);
        return;
      }

      const result = await invoke<string>('encrypt_file', {
        filePath: selectedFile.path,
        password,
        outputPath,
      });

      setStatusMessage(result);
      setPassword('');
    } catch (error) {
      console.error('Encryption failed:', error);
      setStatusMessage(`加密失敗: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 解密檔案
  const decryptFile = async () => {
    if (!selectedFile || !password) {
      setStatusMessage('請選擇檔案並輸入密碼');
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('正在解密檔案...');

      // 移除 .enc 擴展名作為預設檔名
      const defaultName = selectedFile.name.endsWith('.enc')
        ? selectedFile.name.slice(0, -4)
        : selectedFile.name + '.decrypted';

      // 選擇輸出路徑
      const outputPath = await save({
        defaultPath: defaultName,
      });

      if (!outputPath) {
        setStatusMessage('已取消');
        setIsProcessing(false);
        return;
      }

      const result = await invoke<string>('decrypt_file', {
        filePath: selectedFile.path,
        password,
        outputPath,
      });

      setStatusMessage(result);
      setPassword('');
    } catch (error) {
      console.error('Decryption failed:', error);
      setStatusMessage(`解密失敗: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理檔案拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    // 拖放功能需要額外的 Tauri 配置和處理
    // 這裡僅作為佔位符
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 文件加密工具</h1>
        <p className="subtitle">使用 AES-256 保護您的檔案</p>
      </header>

      <main className="app-main">
        {/* 操作模式選擇 */}
        <div className="mode-selector">
          <button
            className={`mode-btn ${mode === 'encrypt' ? 'active' : ''}`}
            onClick={() => setMode('encrypt')}
          >
            🔒 加密
          </button>
          <button
            className={`mode-btn ${mode === 'decrypt' ? 'active' : ''}`}
            onClick={() => setMode('decrypt')}
          >
            🔓 解密
          </button>
        </div>

        {/* 檔案選擇區域 */}
        <div
          className="file-drop-area"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={selectFile}
        >
          {selectedFile ? (
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
          ) : (
            <div className="file-placeholder">
              <div className="file-icon-large">📁</div>
              <p>點擊選擇檔案</p>
              <p className="hint">
                {mode === 'encrypt' ? '支援所有檔案類型' : '選擇 .enc 加密檔案'}
              </p>
            </div>
          )}
        </div>

        {/* 密碼輸入 */}
        <div className="password-section">
          <label htmlFor="password">
            {mode === 'encrypt' ? '設定加密密碼' : '輸入解密密碼'}
          </label>
          <input
            id="password"
            type="password"
            className="password-input"
            placeholder="請輸入密碼（至少 8 個字元）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isProcessing}
          />
          {mode === 'encrypt' && (
            <p className="password-hint">
              💡 建議使用包含大小寫字母、數字和符號的強密碼
            </p>
          )}
        </div>

        {/* 操作按鈕 */}
        <div className="action-section">
          <button
            className={`btn btn-primary ${isProcessing ? 'disabled' : ''}`}
            onClick={mode === 'encrypt' ? encryptFile : decryptFile}
            disabled={isProcessing || !selectedFile || !password}
          >
            {isProcessing ? (
              <>⏳ 處理中...</>
            ) : mode === 'encrypt' ? (
              <>🔐 加密檔案</>
            ) : (
              <>🔓 解密檔案</>
            )}
          </button>
        </div>

        {/* 狀態訊息 */}
        {statusMessage && (
          <div className={`status-message ${statusMessage.includes('失敗') || statusMessage.includes('錯誤') ? 'error' : 'success'}`}>
            {statusMessage}
          </div>
        )}

        {/* 安全提示 */}
        <div className="security-tips">
          <h3>🛡️ 安全提示</h3>
          <ul>
            <li>使用強密碼保護您的檔案</li>
            <li>請妥善保管密碼，遺失將無法解密</li>
            <li>加密前建議備份原始檔案</li>
            <li>採用 AES-256-GCM 加密演算法</li>
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <p>使用 Tauri + Rust 構建 | AES-256-GCM 加密</p>
      </footer>
    </div>
  );
}

export default App;
