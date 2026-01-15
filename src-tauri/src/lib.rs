use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

#[cfg(target_os = "macos")]
fn apply_macos_theme(window: &tauri::WebviewWindow, is_dark: bool) {
    use cocoa::appkit::{NSColor, NSWindow};
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSString;
    use objc::{class, msg_send, sel, sel_impl};

    let ns_window = window.ns_window().unwrap() as id;
    unsafe {
        let (r, g, b) = if is_dark {
            (40.0, 44.0, 52.0)     // #282c34
        } else {
            (250.0, 250.0, 250.0)  // #fafafa
        };
        let bg_color = NSColor::colorWithRed_green_blue_alpha_(nil, r / 255.0, g / 255.0, b / 255.0, 1.0);
        ns_window.setBackgroundColor_(bg_color);

        let appearance_name = if is_dark {
            "NSAppearanceNameDarkAqua"
        } else {
            "NSAppearanceNameAqua"
        };
        let appearance_name = cocoa::foundation::NSString::alloc(nil).init_str(appearance_name);
        let appearance: id = msg_send![class!(NSAppearance), appearanceNamed: appearance_name];
        let _: () = msg_send![ns_window, setAppearance: appearance];
    }
}

#[tauri::command]
fn set_titlebar_color(window: tauri::WebviewWindow, theme: &str) {
    #[cfg(target_os = "macos")]
    apply_macos_theme(&window, theme != "light");
    
    #[cfg(not(target_os = "macos"))]
    let _ = (window, theme);
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let win_builder =
              WebviewWindowBuilder::new(app, "jitchat", WebviewUrl::default())
                .title("JitChat")
                .inner_size(800.0, 600.0)
                .disable_drag_drop_handler();

            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

            let window = win_builder.build().unwrap();

            #[cfg(target_os = "macos")]
            apply_macos_theme(&window, true);

            Ok(())
        })
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![set_titlebar_color])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
