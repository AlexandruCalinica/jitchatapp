// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod audio;
mod transcription;

use anyhow::Result;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

// Create a wrapper for our AudioCapture
struct AudioCaptureState(Mutex<Option<audio::AudioCapture>>);
struct TranscriberState(Mutex<Option<transcription::Transcriber>>);

#[tauri::command]
async fn start_local_audio(state: State<'_, AudioCaptureState>) -> Result<(), String> {
    let mut capture = audio::AudioCapture::new(44100, 2);
    let output_path = PathBuf::from("local_recording.wav");
    capture
        .start_capture(&output_path, audio::AudioSource::LocalMicrophone)
        .map_err(|e| e.to_string())?;

    // Store the capture instance in our state
    *state.0.lock().unwrap() = Some(capture);
    Ok(())
}

#[tauri::command]
async fn start_remote_audio(state: State<'_, AudioCaptureState>) -> Result<(), String> {
    let mut state_guard = state.0.lock().unwrap();
    let capture = if state_guard.is_none() {
        *state_guard = Some(audio::AudioCapture::new(44100, 2));
        state_guard.as_mut().unwrap()
    } else {
        state_guard.as_mut().unwrap()
    };

    let output_path = PathBuf::from("remote_recording.wav");
    capture
        .start_capture(&output_path, audio::AudioSource::RemoteAudio)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn stop_local_audio(state: State<'_, AudioCaptureState>) -> Result<(), String> {
    if let Some(capture) = state.0.lock().unwrap().as_mut() {
        capture
            .stop_capture(audio::AudioSource::LocalMicrophone)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn stop_remote_audio(state: State<'_, AudioCaptureState>) -> Result<(), String> {
    if let Some(capture) = state.0.lock().unwrap().as_mut() {
        capture
            .stop_capture(audio::AudioSource::RemoteAudio)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn transcribe_audio(
    audio_state: State<'_, AudioCaptureState>,
    transcriber_state: State<'_, TranscriberState>,
    source: String,
) -> Result<String, String> {
    // Stop the appropriate audio capture
    if let Some(capture) = audio_state.0.lock().unwrap().as_mut() {
        let audio_source = if source == "local" {
            audio::AudioSource::LocalMicrophone
        } else {
            audio::AudioSource::RemoteAudio
        };
        capture
            .stop_capture(audio_source)
            .map_err(|e| e.to_string())?;
    }

    // Get the transcriber reference
    let transcriber_guard = transcriber_state.0.lock().unwrap();
    let transcriber = match transcriber_guard.as_ref() {
        Some(t) => t,
        None => {
            return Err(
                "Speech recognition is not available. Please download the Whisper model."
                    .to_string(),
            )
        }
    };

    // Transcribe the appropriate audio file
    let audio_path = if source == "local" {
        PathBuf::from("local_recording.wav")
    } else {
        PathBuf::from("remote_recording.wav")
    };

    let transcription = transcriber
        .transcribe_audio(&audio_path)
        .map_err(|e| e.to_string())?;

    Ok(transcription)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check model file with detailed debugging
    let model_path = PathBuf::from("models/ggml-base.en.bin");
    println!("Checking model file at: {}", model_path.display());

    if model_path.exists() {
        println!("Model file exists");
        if let Ok(metadata) = fs::metadata(&model_path) {
            println!("File size: {} bytes", metadata.len());
            println!("File permissions: {:?}", metadata.permissions());
        }
    } else {
        println!("Model file does not exist");
        // List contents of models directory
        if let Ok(entries) = fs::read_dir("models") {
            println!("Contents of models directory:");
            for entry in entries.flatten() {
                println!("- {}", entry.path().display());
            }
        } else {
            println!("Could not read models directory");
        }
    }

    // Initialize the transcriber if the model exists
    let transcriber = if model_path.exists() {
        match transcription::Transcriber::new() {
            Ok(t) => {
                println!("Successfully initialized transcriber");
                Some(t)
            }
            Err(e) => {
                eprintln!("Warning: Failed to initialize transcriber: {}", e);
                None
            }
        }
    } else {
        eprintln!("Warning: Whisper model not found. Please download it from:");
        eprintln!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin");
        eprintln!("and place it in the 'models' directory.");
        None
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .manage(AudioCaptureState(Mutex::new(None)))
        .manage(TranscriberState(Mutex::new(transcriber)))
        .invoke_handler(tauri::generate_handler![
            start_local_audio,
            start_remote_audio,
            stop_local_audio,
            stop_remote_audio,
            transcribe_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
