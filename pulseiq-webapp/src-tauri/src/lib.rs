#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init()) // 👈 enable shell plugin
    .setup(|app| {

      // keep your log plugin in debug
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 👇 START YOUR NODE EXE HERE
      use tauri_plugin_shell::ShellExt;

      app.shell()
        .sidecar("pulseiqapi")
        .expect("failed to create sidecar")
        .spawn()
        .expect("failed to spawn sidecar");

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}