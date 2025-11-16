// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::fs;

const SALT_SIZE: usize = 32;
const NONCE_SIZE: usize = 12;
const PBKDF2_ITERATIONS: u32 = 100_000;

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    name: String,
    size: u64,
    path: String,
}

// 從密碼派生加密金鑰
fn derive_key(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, PBKDF2_ITERATIONS, &mut key);
    key
}

// 生成隨機位元組
fn generate_random_bytes(size: usize) -> Vec<u8> {
    let mut bytes = vec![0u8; size];
    OsRng.fill_bytes(&mut bytes);
    bytes
}

#[tauri::command]
fn encrypt_file(file_path: String, password: String, output_path: String) -> Result<String, String> {
    // 驗證密碼強度
    if password.len() < 8 {
        return Err("密碼長度至少需要 8 個字元".to_string());
    }

    // 讀取檔案內容
    let plaintext = fs::read(&file_path)
        .map_err(|e| format!("無法讀取檔案: {}", e))?;

    // 生成隨機鹽值和 nonce
    let salt = generate_random_bytes(SALT_SIZE);
    let nonce_bytes = generate_random_bytes(NONCE_SIZE);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // 從密碼派生金鑰
    let key = derive_key(&password, &salt);

    // 建立 AES-GCM 加密器
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("無法建立加密器: {}", e))?;

    // 加密資料
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|e| format!("加密失敗: {}", e))?;

    // 組合檔案格式: [salt][nonce][ciphertext]
    let mut output = Vec::new();
    output.extend_from_slice(&salt);
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&ciphertext);

    // 寫入加密檔案
    fs::write(&output_path, output)
        .map_err(|e| format!("無法寫入加密檔案: {}", e))?;

    Ok(format!("✅ 檔案加密成功！已儲存至: {}", output_path))
}

#[tauri::command]
fn decrypt_file(file_path: String, password: String, output_path: String) -> Result<String, String> {
    // 讀取加密檔案
    let encrypted_data = fs::read(&file_path)
        .map_err(|e| format!("無法讀取加密檔案: {}", e))?;

    // 檢查檔案大小
    if encrypted_data.len() < SALT_SIZE + NONCE_SIZE {
        return Err("加密檔案格式不正確".to_string());
    }

    // 分離 salt、nonce 和 ciphertext
    let salt = &encrypted_data[0..SALT_SIZE];
    let nonce_bytes = &encrypted_data[SALT_SIZE..SALT_SIZE + NONCE_SIZE];
    let ciphertext = &encrypted_data[SALT_SIZE + NONCE_SIZE..];

    let nonce = Nonce::from_slice(nonce_bytes);

    // 從密碼派生金鑰
    let key = derive_key(&password, salt);

    // 建立 AES-GCM 解密器
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("無法建立解密器: {}", e))?;

    // 解密資料
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "解密失敗：密碼錯誤或檔案已損壞".to_string())?;

    // 寫入解密檔案
    fs::write(&output_path, plaintext)
        .map_err(|e| format!("無法寫入解密檔案: {}", e))?;

    Ok(format!("✅ 檔案解密成功！已儲存至: {}", output_path))
}

#[tauri::command]
fn get_file_info(file_path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("無法讀取檔案資訊: {}", e))?;

    let path_obj = std::path::Path::new(&file_path);
    let file_name = path_obj
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Unknown")
        .to_string();

    Ok(FileInfo {
        name: file_name,
        size: metadata.len(),
        path: file_path,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            encrypt_file,
            decrypt_file,
            get_file_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
