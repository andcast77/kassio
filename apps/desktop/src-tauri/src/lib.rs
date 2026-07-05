#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Manager, RunEvent};

struct BackendState(Mutex<Option<Child>>);

fn spawn_bundled_backend(app: &tauri::App) -> Option<Child> {
    let resource_dir = app.path().resource_dir().ok()?;
    let backend_root = resource_dir.join("backend");

    let node = if cfg!(target_os = "windows") {
        resource_dir.join("node").join("node.exe")
    } else {
        resource_dir.join("node").join("node")
    };

    let start_script = backend_root.join("start.mjs");
    if !node.exists() || !start_script.exists() {
        eprintln!(
            "[kassio] bundled backend missing (node={:?}, start={:?})",
            node, start_script
        );
        return None;
    }

    Command::new(&node)
        .arg(&start_script)
        .current_dir(&backend_root)
        .env("KASSIO_BACKEND_ROOT", &backend_root)
        .env("NODE_ENV", "production")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| eprintln!("[kassio] failed to spawn backend: {e}"))
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(not(debug_assertions)) {
                if let Some(child) = spawn_bundled_backend(app) {
                    app.manage(BackendState(Mutex::new(Some(child))));
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<BackendState>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
