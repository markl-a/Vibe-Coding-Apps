// Tauri Commands, State Management, and Events
//
// This example demonstrates core Tauri patterns including:
// - Commands: Rust functions callable from frontend
// - State Management: Shared application state
// - Event System: Communication between frontend and backend
// - Window Management: Creating and controlling windows
// - File System Operations: Safe file handling
// - Error Handling: Proper Result types and error propagation

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    AppHandle, Manager, State, Window, WindowBuilder, WindowUrl,
    api::dialog, api::notification::Notification,
};

// ============== Type Definitions ==============

#[derive(Debug, Serialize, Deserialize, Clone)]
struct User {
    id: u32,
    name: String,
    email: String,
    role: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct AppSettings {
    theme: String,
    language: String,
    notifications_enabled: bool,
    auto_save: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct Task {
    id: u32,
    title: String,
    description: String,
    completed: bool,
    created_at: i64,
}

// ============== Application State ==============

/// Global application state
/// Wrapped in Mutex for thread-safe access
pub struct AppState {
    user: Mutex<Option<User>>,
    settings: Mutex<AppSettings>,
    tasks: Mutex<Vec<Task>>,
    counter: Mutex<u32>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            user: Mutex::new(None),
            settings: Mutex::new(AppSettings {
                theme: "dark".to_string(),
                language: "en".to_string(),
                notifications_enabled: true,
                auto_save: true,
            }),
            tasks: Mutex::new(Vec::new()),
            counter: Mutex::new(0),
        }
    }
}

// ============== Basic Commands ==============

/// Simple command - no parameters
#[tauri::command]
fn greet() -> String {
    "Hello from Tauri!".to_string()
}

/// Command with parameters
#[tauri::command]
fn greet_user(name: String) -> String {
    format!("Hello, {}!", name)
}

/// Command with multiple parameters
#[tauri::command]
fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}

/// Command returning complex data
#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "family": std::env::consts::FAMILY,
    }))
}

// ============== State Management Commands ==============

/// Get current user from state
#[tauri::command]
fn get_user(state: State<AppState>) -> Result<Option<User>, String> {
    let user = state.user.lock().map_err(|e| e.to_string())?;
    Ok(user.clone())
}

/// Set current user in state
#[tauri::command]
fn set_user(user: User, state: State<AppState>) -> Result<(), String> {
    let mut current_user = state.user.lock().map_err(|e| e.to_string())?;
    *current_user = Some(user);
    Ok(())
}

/// Logout user (clear from state)
#[tauri::command]
fn logout(state: State<AppState>) -> Result<(), String> {
    let mut user = state.user.lock().map_err(|e| e.to_string())?;
    *user = None;
    Ok(())
}

/// Get application settings
#[tauri::command]
fn get_settings(state: State<AppState>) -> Result<AppSettings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

/// Update application settings
#[tauri::command]
fn update_settings(settings: AppSettings, state: State<AppState>) -> Result<(), String> {
    let mut current_settings = state.settings.lock().map_err(|e| e.to_string())?;
    *current_settings = settings;
    Ok(())
}

/// Increment counter (demonstrating state mutation)
#[tauri::command]
fn increment_counter(state: State<AppState>) -> Result<u32, String> {
    let mut counter = state.counter.lock().map_err(|e| e.to_string())?;
    *counter += 1;
    Ok(*counter)
}

/// Get counter value
#[tauri::command]
fn get_counter(state: State<AppState>) -> Result<u32, String> {
    let counter = state.counter.lock().map_err(|e| e.to_string())?;
    Ok(*counter)
}

/// Reset counter
#[tauri::command]
fn reset_counter(state: State<AppState>) -> Result<(), String> {
    let mut counter = state.counter.lock().map_err(|e| e.to_string())?;
    *counter = 0;
    Ok(())
}

// ============== Task Management Commands ==============

/// Get all tasks
#[tauri::command]
fn get_tasks(state: State<AppState>) -> Result<Vec<Task>, String> {
    let tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    Ok(tasks.clone())
}

/// Add new task
#[tauri::command]
fn add_task(title: String, description: String, state: State<AppState>) -> Result<Task, String> {
    let mut tasks = state.tasks.lock().map_err(|e| e.to_string())?;

    let id = tasks.len() as u32 + 1;
    let task = Task {
        id,
        title,
        description,
        completed: false,
        created_at: chrono::Utc::now().timestamp(),
    };

    tasks.push(task.clone());
    Ok(task)
}

/// Toggle task completion
#[tauri::command]
fn toggle_task(task_id: u32, state: State<AppState>) -> Result<(), String> {
    let mut tasks = state.tasks.lock().map_err(|e| e.to_string())?;

    if let Some(task) = tasks.iter_mut().find(|t| t.id == task_id) {
        task.completed = !task.completed;
        Ok(())
    } else {
        Err(format!("Task {} not found", task_id))
    }
}

/// Delete task
#[tauri::command]
fn delete_task(task_id: u32, state: State<AppState>) -> Result<(), String> {
    let mut tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    tasks.retain(|t| t.id != task_id);
    Ok(())
}

/// Clear all completed tasks
#[tauri::command]
fn clear_completed_tasks(state: State<AppState>) -> Result<usize, String> {
    let mut tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    let before_count = tasks.len();
    tasks.retain(|t| !t.completed);
    let removed = before_count - tasks.len();
    Ok(removed)
}

// ============== Event System ==============

/// Emit custom event to frontend
#[tauri::command]
fn emit_custom_event(app: AppHandle, event_name: String, payload: String) -> Result<(), String> {
    app.emit_all(&event_name, payload).map_err(|e| e.to_string())?;
    Ok(())
}

/// Emit event to specific window
#[tauri::command]
fn emit_to_window(
    app: AppHandle,
    window_label: String,
    event_name: String,
    payload: String,
) -> Result<(), String> {
    if let Some(window) = app.get_window(&window_label) {
        window.emit(&event_name, payload).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err(format!("Window '{}' not found", window_label))
    }
}

/// Broadcast message to all windows
#[tauri::command]
fn broadcast_message(app: AppHandle, message: String) -> Result<(), String> {
    app.emit_all("broadcast", message).map_err(|e| e.to_string())?;
    Ok(())
}

// ============== Window Management ==============

/// Create new window
#[tauri::command]
fn create_window(
    app: AppHandle,
    label: String,
    title: String,
    url: String,
) -> Result<(), String> {
    WindowBuilder::new(&app, label, WindowUrl::App(url.into()))
        .title(title)
        .inner_size(800.0, 600.0)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Close window
#[tauri::command]
fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())?;
    Ok(())
}

/// Minimize window
#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())?;
    Ok(())
}

/// Maximize window
#[tauri::command]
fn maximize_window(window: Window) -> Result<(), String> {
    window.maximize().map_err(|e| e.to_string())?;
    Ok(())
}

/// Toggle fullscreen
#[tauri::command]
fn toggle_fullscreen(window: Window) -> Result<(), String> {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    Ok(())
}

/// Set window title
#[tauri::command]
fn set_window_title(window: Window, title: String) -> Result<(), String> {
    window.set_title(&title).map_err(|e| e.to_string())?;
    Ok(())
}

// ============== File System Operations ==============

/// Read file content
#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    use tokio::fs;

    let content = fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    Ok(content)
}

/// Write file content
#[tauri::command]
async fn write_file_content(path: String, content: String) -> Result<(), String> {
    use tokio::fs;

    fs::write(&path, content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

/// Check if file exists
#[tauri::command]
async fn file_exists(path: String) -> Result<bool, String> {
    use tokio::fs;

    Ok(fs::metadata(&path).await.is_ok())
}

// ============== Dialog Commands ==============

/// Show message dialog
#[tauri::command]
async fn show_message_dialog(title: String, message: String) -> Result<(), String> {
    dialog::message(Some(&title), message);
    Ok(())
}

/// Show confirmation dialog
#[tauri::command]
async fn show_confirm_dialog(title: String, message: String) -> Result<bool, String> {
    let result = dialog::ask(Some(&title), message);
    Ok(result)
}

/// Show file open dialog
#[tauri::command]
async fn show_open_dialog() -> Result<Option<String>, String> {
    let result = dialog::FileDialogBuilder::new()
        .pick_file()
        .map(|p| p.to_string_lossy().to_string());

    Ok(result)
}

/// Show file save dialog
#[tauri::command]
async fn show_save_dialog() -> Result<Option<String>, String> {
    let result = dialog::FileDialogBuilder::new()
        .save_file()
        .map(|p| p.to_string_lossy().to_string());

    Ok(result)
}

// ============== Notification Commands ==============

/// Show system notification
#[tauri::command]
fn show_notification(title: String, body: String) -> Result<(), String> {
    Notification::new("com.tauri.app")
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ============== Async Commands ==============

/// Async command with delay (simulating long operation)
#[tauri::command]
async fn async_operation(duration_ms: u64) -> Result<String, String> {
    use tokio::time::{sleep, Duration};

    sleep(Duration::from_millis(duration_ms)).await;

    Ok(format!("Operation completed after {}ms", duration_ms))
}

/// Fetch data from API (example)
#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    Ok(response)
}

// ============== Error Handling Examples ==============

/// Command with custom error type
#[derive(Debug, Serialize)]
struct CustomError {
    code: u32,
    message: String,
}

impl std::fmt::Display for CustomError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

#[tauri::command]
fn risky_operation(input: String) -> Result<String, CustomError> {
    if input.is_empty() {
        return Err(CustomError {
            code: 400,
            message: "Input cannot be empty".to_string(),
        });
    }

    if input.len() > 100 {
        return Err(CustomError {
            code: 413,
            message: "Input too long".to_string(),
        });
    }

    Ok(format!("Processed: {}", input))
}

// ============== Main Function ==============

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

fn main() {
    // Initialize application state
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Basic commands
            greet,
            greet_user,
            add_numbers,
            get_system_info,
            // State management
            get_user,
            set_user,
            logout,
            get_settings,
            update_settings,
            increment_counter,
            get_counter,
            reset_counter,
            // Task management
            get_tasks,
            add_task,
            toggle_task,
            delete_task,
            clear_completed_tasks,
            // Event system
            emit_custom_event,
            emit_to_window,
            broadcast_message,
            // Window management
            create_window,
            close_window,
            minimize_window,
            maximize_window,
            toggle_fullscreen,
            set_window_title,
            // File system
            read_file_content,
            write_file_content,
            file_exists,
            // Dialogs
            show_message_dialog,
            show_confirm_dialog,
            show_open_dialog,
            show_save_dialog,
            // Notifications
            show_notification,
            // Async operations
            async_operation,
            fetch_data,
            // Error handling
            risky_operation,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ============== Frontend Usage Examples ==============

/*
// TypeScript/JavaScript usage examples:

// 1. Basic command invocation
const greeting = await invoke('greet');
const personalGreeting = await invoke('greet_user', { name: 'Alice' });
const sum = await invoke('add_numbers', { a: 5, b: 3 });

// 2. State management
const user = await invoke('get_user');
await invoke('set_user', {
    user: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' }
});
await invoke('logout');

const settings = await invoke('get_settings');
await invoke('update_settings', {
    settings: { theme: 'light', language: 'en', notifications_enabled: true, auto_save: true }
});

// 3. Counter example
const count = await invoke('increment_counter');
const currentCount = await invoke('get_counter');
await invoke('reset_counter');

// 4. Task management
const tasks = await invoke('get_tasks');
const newTask = await invoke('add_task', {
    title: 'New Task',
    description: 'Task description'
});
await invoke('toggle_task', { taskId: 1 });
await invoke('delete_task', { taskId: 1 });

// 5. Event system
import { listen, emit } from '@tauri-apps/api/event';

// Listen to events
await listen('custom-event', (event) => {
    console.log('Received:', event.payload);
});

// Emit events from Rust
await invoke('emit_custom_event', {
    eventName: 'my-event',
    payload: 'Hello!'
});

// 6. Window management
await invoke('create_window', {
    label: 'settings',
    title: 'Settings',
    url: '/settings'
});
await invoke('close_window');
await invoke('toggle_fullscreen');

// 7. File system
const content = await invoke('read_file_content', { path: '/path/to/file.txt' });
await invoke('write_file_content', { path: '/path/to/file.txt', content: 'Hello!' });
const exists = await invoke('file_exists', { path: '/path/to/file.txt' });

// 8. Dialogs
await invoke('show_message_dialog', { title: 'Info', message: 'Hello!' });
const confirmed = await invoke('show_confirm_dialog', {
    title: 'Confirm',
    message: 'Are you sure?'
});
const filePath = await invoke('show_open_dialog');

// 9. Notifications
await invoke('show_notification', { title: 'Update', body: 'New message received' });

// 10. Async operations
const result = await invoke('async_operation', { durationMs: 2000 });
const data = await invoke('fetch_data', { url: 'https://api.example.com/data' });

// 11. Error handling
try {
    const result = await invoke('risky_operation', { input: '' });
} catch (error) {
    console.error('Error:', error);
}
*/
