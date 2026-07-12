#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod updater;

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

    let mut cmd = Command::new(&node);
    cmd.arg(&start_script)
        .current_dir(&backend_root)
        .env("KASSIO_BACKEND_ROOT", &backend_root)
        .env("NODE_ENV", "production")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());

    // Keep the bundled Node backend headless — otherwise Windows allocates a
    // console window that flashes up behind the app.
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.spawn()
        .map_err(|e| eprintln!("[kassio] failed to spawn backend: {e}"))
        .ok()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if updater::is_background_update_mode() {
        return updater::run_background_updater();
    }

    if updater::pending_update_requested() {
        if updater::spawn_detached_background_updater().is_ok() {
            std::process::exit(0);
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            updater::begin_background_update,
            updater::schedule_update_on_next_start,
        ])
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
