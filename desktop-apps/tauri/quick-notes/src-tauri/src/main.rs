// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Note {
    id: String,
    title: String,
    content: String,
    created_at: i64,
    updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct NoteMetadata {
    id: String,
    title: String,
    updated_at: i64,
}

// 取得筆記儲存目錄
fn get_notes_dir() -> Result<PathBuf, String> {
    let app_data = dirs::data_dir()
        .ok_or("Failed to get app data directory")?;

    let notes_dir = app_data.join("quick-notes").join("notes");

    // 確保目錄存在
    fs::create_dir_all(&notes_dir)
        .map_err(|e| format!("Failed to create notes directory: {}", e))?;

    Ok(notes_dir)
}

// 取得筆記檔案路徑
fn get_note_path(id: &str) -> Result<PathBuf, String> {
    let notes_dir = get_notes_dir()?;
    Ok(notes_dir.join(format!("{}.json", id)))
}

#[tauri::command]
fn save_note(
    id: String,
    title: String,
    content: String,
    created_at: i64,
    updated_at: i64,
) -> Result<(), String> {
    let note = Note {
        id: id.clone(),
        title,
        content,
        created_at,
        updated_at,
    };

    let note_path = get_note_path(&id)?;
    let json = serde_json::to_string_pretty(&note)
        .map_err(|e| format!("Failed to serialize note: {}", e))?;

    fs::write(&note_path, json)
        .map_err(|e| format!("Failed to write note file: {}", e))?;

    Ok(())
}

#[tauri::command]
fn load_note(id: String) -> Result<Note, String> {
    let note_path = get_note_path(&id)?;

    let json = fs::read_to_string(&note_path)
        .map_err(|e| format!("Failed to read note file: {}", e))?;

    let note: Note = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to deserialize note: {}", e))?;

    Ok(note)
}

#[tauri::command]
fn delete_note(id: String) -> Result<(), String> {
    let note_path = get_note_path(&id)?;

    fs::remove_file(&note_path)
        .map_err(|e| format!("Failed to delete note file: {}", e))?;

    Ok(())
}

#[tauri::command]
fn get_notes_list() -> Result<Vec<NoteMetadata>, String> {
    let notes_dir = get_notes_dir()?;

    let mut notes = Vec::new();

    let entries = fs::read_dir(&notes_dir)
        .map_err(|e| format!("Failed to read notes directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        // 只處理 .json 檔案
        if path.extension().and_then(|s| s.to_str()) != Some("json") {
            continue;
        }

        // 讀取筆記檔案
        match fs::read_to_string(&path) {
            Ok(json) => {
                match serde_json::from_str::<Note>(&json) {
                    Ok(note) => {
                        notes.push(NoteMetadata {
                            id: note.id,
                            title: note.title,
                            updated_at: note.updated_at,
                        });
                    }
                    Err(e) => {
                        eprintln!("Failed to parse note {:?}: {}", path, e);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to read note {:?}: {}", path, e);
            }
        }
    }

    // 按更新時間排序（最新的在前面）
    notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Ok(notes)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            save_note,
            load_note,
            delete_note,
            get_notes_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
