// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks};
use std::sync::Mutex;

// 使用 Mutex 保護 System 實例，使其可以在多執行緒環境中使用
struct AppState {
    sys: Mutex<System>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SystemInfo {
    os: String,
    kernel_version: String,
    hostname: String,
    cpu_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
struct MemoryInfo {
    total: u64,
    used: u64,
    available: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct DiskInfo {
    name: String,
    mount_point: String,
    total: u64,
    used: u64,
    available: u64,
}

#[tauri::command]
fn get_system_info() -> SystemInfo {
    let sys = System::new_all();

    SystemInfo {
        os: System::name().unwrap_or_else(|| "Unknown".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        hostname: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        cpu_count: sys.cpus().len(),
    }
}

#[tauri::command]
fn get_cpu_usage(state: tauri::State<AppState>) -> f32 {
    let mut sys = state.sys.lock().unwrap();

    // 刷新 CPU 資訊
    sys.refresh_cpu();

    // 計算全局 CPU 使用率
    let cpus = sys.cpus();
    if cpus.is_empty() {
        return 0.0;
    }

    let total_usage: f32 = cpus.iter().map(|cpu| cpu.cpu_usage()).sum();
    total_usage / cpus.len() as f32
}

#[tauri::command]
fn get_memory_info(state: tauri::State<AppState>) -> MemoryInfo {
    let mut sys = state.sys.lock().unwrap();

    // 刷新記憶體資訊
    sys.refresh_memory();

    MemoryInfo {
        total: sys.total_memory(),
        used: sys.used_memory(),
        available: sys.available_memory(),
    }
}

#[tauri::command]
fn get_disk_info() -> Vec<DiskInfo> {
    let disks = Disks::new_with_refreshed_list();

    disks
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total - available;

            DiskInfo {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total,
                used,
                available,
            }
        })
        .collect()
}

fn main() {
    // 初始化系統資訊
    let mut sys = System::new_all();
    sys.refresh_all();

    // 等待一段時間以獲取準確的 CPU 使用率
    std::thread::sleep(std::time::Duration::from_millis(200));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            sys: Mutex::new(sys),
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_cpu_usage,
            get_memory_info,
            get_disk_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
