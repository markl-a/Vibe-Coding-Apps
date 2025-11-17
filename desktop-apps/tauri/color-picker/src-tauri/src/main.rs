// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ColorHistory {
    hex: String,
    rgb: (u8, u8, u8),
    hsl: (u16, u8, u8),
    timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ColorPalette {
    name: String,
    colors: Vec<String>,
}

// Convert RGB to HSL
fn rgb_to_hsl(r: u8, g: u8, b: u8) -> (u16, u8, u8) {
    let r = r as f32 / 255.0;
    let g = g as f32 / 255.0;
    let b = b as f32 / 255.0;

    let max = r.max(g).max(b);
    let min = r.min(g).min(b);
    let delta = max - min;

    let l = (max + min) / 2.0;

    if delta == 0.0 {
        return (0, 0, (l * 100.0) as u8);
    }

    let s = if l < 0.5 {
        delta / (max + min)
    } else {
        delta / (2.0 - max - min)
    };

    let h = if max == r {
        ((g - b) / delta + if g < b { 6.0 } else { 0.0 }) * 60.0
    } else if max == g {
        ((b - r) / delta + 2.0) * 60.0
    } else {
        ((r - g) / delta + 4.0) * 60.0
    };

    (h as u16, (s * 100.0) as u8, (l * 100.0) as u8)
}

// Convert HSL to RGB
fn hsl_to_rgb(h: u16, s: u8, l: u8) -> (u8, u8, u8) {
    let h = h as f32 / 360.0;
    let s = s as f32 / 100.0;
    let l = l as f32 / 100.0;

    if s == 0.0 {
        let gray = (l * 255.0) as u8;
        return (gray, gray, gray);
    }

    let q = if l < 0.5 {
        l * (1.0 + s)
    } else {
        l + s - l * s
    };

    let p = 2.0 * l - q;

    let hue_to_rgb = |p: f32, q: f32, mut t: f32| -> f32 {
        if t < 0.0 {
            t += 1.0;
        }
        if t > 1.0 {
            t -= 1.0;
        }
        if t < 1.0 / 6.0 {
            return p + (q - p) * 6.0 * t;
        }
        if t < 1.0 / 2.0 {
            return q;
        }
        if t < 2.0 / 3.0 {
            return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
        }
        p
    };

    let r = (hue_to_rgb(p, q, h + 1.0 / 3.0) * 255.0) as u8;
    let g = (hue_to_rgb(p, q, h) * 255.0) as u8;
    let b = (hue_to_rgb(p, q, h - 1.0 / 3.0) * 255.0) as u8;

    (r, g, b)
}

#[tauri::command]
fn hex_to_rgb(hex: String) -> Result<(u8, u8, u8), String> {
    let hex = hex.trim_start_matches('#');

    if hex.len() != 6 {
        return Err("Invalid hex color".to_string());
    }

    let r = u8::from_str_radix(&hex[0..2], 16).map_err(|e| e.to_string())?;
    let g = u8::from_str_radix(&hex[2..4], 16).map_err(|e| e.to_string())?;
    let b = u8::from_str_radix(&hex[4..6], 16).map_err(|e| e.to_string())?;

    Ok((r, g, b))
}

#[tauri::command]
fn rgb_to_hex(r: u8, g: u8, b: u8) -> String {
    format!("#{:02X}{:02X}{:02X}", r, g, b)
}

#[tauri::command]
fn convert_rgb_to_hsl(r: u8, g: u8, b: u8) -> (u16, u8, u8) {
    rgb_to_hsl(r, g, b)
}

#[tauri::command]
fn convert_hsl_to_rgb(h: u16, s: u8, l: u8) -> (u8, u8, u8) {
    hsl_to_rgb(h, s, l)
}

#[tauri::command]
fn generate_complementary(hex: String) -> Result<String, String> {
    let (r, g, b) = hex_to_rgb(hex)?;
    let complement_r = 255 - r;
    let complement_g = 255 - g;
    let complement_b = 255 - b;
    Ok(rgb_to_hex(complement_r, complement_g, complement_b))
}

#[tauri::command]
fn generate_analogous(hex: String) -> Result<Vec<String>, String> {
    let (r, g, b) = hex_to_rgb(hex)?;
    let (h, s, l) = rgb_to_hsl(r, g, b);

    let mut colors = Vec::new();

    // 生成類似色（相鄰30度）
    for offset in [-30i32, 0i32, 30i32] {
        let new_h = ((h as i32 + offset + 360) % 360) as u16;
        let (new_r, new_g, new_b) = hsl_to_rgb(new_h, s, l);
        colors.push(rgb_to_hex(new_r, new_g, new_b));
    }

    Ok(colors)
}

#[tauri::command]
fn generate_triadic(hex: String) -> Result<Vec<String>, String> {
    let (r, g, b) = hex_to_rgb(hex)?;
    let (h, s, l) = rgb_to_hsl(r, g, b);

    let mut colors = Vec::new();

    // 生成三角色（120度間隔）
    for offset in [0, 120, 240] {
        let new_h = ((h as i32 + offset) % 360) as u16;
        let (new_r, new_g, new_b) = hsl_to_rgb(new_h, s, l);
        colors.push(rgb_to_hex(new_r, new_g, new_b));
    }

    Ok(colors)
}

#[tauri::command]
fn generate_monochromatic(hex: String) -> Result<Vec<String>, String> {
    let (r, g, b) = hex_to_rgb(hex)?;
    let (h, s, _) = rgb_to_hsl(r, g, b);

    let mut colors = Vec::new();

    // 生成單色系（改變亮度）
    for lightness in [20, 40, 60, 80] {
        let (new_r, new_g, new_b) = hsl_to_rgb(h, s, lightness);
        colors.push(rgb_to_hex(new_r, new_g, new_b));
    }

    Ok(colors)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            hex_to_rgb,
            rgb_to_hex,
            convert_rgb_to_hsl,
            convert_hsl_to_rgb,
            generate_complementary,
            generate_analogous,
            generate_triadic,
            generate_monochromatic
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
