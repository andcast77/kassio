use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::Command;
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

const BACKGROUND_UPDATE_ARG: &str = "--background-update";
const PENDING_UPDATE_FILE: &str = "pending-update";

pub fn is_background_update_mode() -> bool {
    std::env::args().any(|a| a == BACKGROUND_UPDATE_ARG)
}

fn kassio_state_dir() -> PathBuf {
    #[cfg(windows)]
    {
        let base = std::env::var("ProgramData").unwrap_or_else(|_| "C:\\ProgramData".into());
        PathBuf::from(base).join("Kassio")
    }
    #[cfg(not(windows))]
    {
        PathBuf::from("/var/lib/kassio")
    }
}

fn pending_update_path() -> PathBuf {
    kassio_state_dir().join(PENDING_UPDATE_FILE)
}

pub fn pending_update_requested() -> bool {
    pending_update_path().exists()
}

pub fn clear_pending_update() {
    let _ = fs::remove_file(pending_update_path());
}

pub fn write_pending_update(version: &str) -> io::Result<()> {
    let dir = kassio_state_dir();
    fs::create_dir_all(&dir)?;
    fs::write(pending_update_path(), version)
}

pub fn spawn_detached_background_updater() -> io::Result<()> {
    let exe = std::env::current_exe()?;
    let mut cmd = Command::new(exe);
    cmd.arg(BACKGROUND_UPDATE_ARG);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        const DETACHED_PROCESS: u32 = 0x00000008;
        cmd.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS);
    }

    #[cfg(unix)]
    {
        use std::process::Stdio;
        cmd.stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
    }

    cmd.spawn()?;
    Ok(())
}

pub fn run_background_updater() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = perform_background_update(handle).await {
                    eprintln!("[kassio] background update failed: {e}");
                }
            });
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building background updater")
        .run(|_, _| {});
}

async fn perform_background_update(app: AppHandle) -> tauri_plugin_updater::Result<()> {
    clear_pending_update();

    let Some(update) = app.updater()?.check().await? else {
        return Ok(());
    };

    update
        .download_and_install(|_chunk, _total| {}, || {})
        .await?;

    app.restart();
    #[allow(unreachable_code)]
    Ok(())
}

#[tauri::command]
pub fn begin_background_update(app: AppHandle) -> Result<(), String> {
    clear_pending_update();
    spawn_detached_background_updater().map_err(|e| e.to_string())?;
    app.exit(0);
    Ok(())
}

#[tauri::command]
pub fn schedule_update_on_next_start(version: String) -> Result<(), String> {
    write_pending_update(&version).map_err(|e| e.to_string())
}
