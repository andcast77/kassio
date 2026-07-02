#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct BackendState(Mutex<Option<Child>>);

fn spawn_backend() -> Option<Child> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let repo_root = std::path::Path::new(manifest_dir)
        .join("..")
        .join("..")
        .join("..");

    Command::new("node")
        .arg(repo_root.join("scripts/kassio-start.mjs"))
        .current_dir(&repo_root)
        .spawn()
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(not(debug_assertions)) {
                if let Some(child) = spawn_backend() {
                    app.manage(BackendState(Mutex::new(Some(child))));
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
