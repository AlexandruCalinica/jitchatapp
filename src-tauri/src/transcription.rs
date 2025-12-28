use anyhow::Result;
use std::path::Path;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

pub struct Transcriber {
    context: WhisperContext,
}

impl Transcriber {
    pub fn new() -> Result<Self> {
        // Initialize Whisper with the base model
        let model_path = "models/ggml-base.en.bin";
        println!("Attempting to load model from: {}", model_path);

        let params = WhisperContextParameters::default();
        let context = WhisperContext::new_with_params(model_path, params)
            .map_err(|e| anyhow::anyhow!("Failed to load Whisper model: {}", e))?;

        println!("Successfully loaded Whisper model");
        Ok(Self { context })
    }

    pub fn transcribe_audio(&self, audio_path: &Path) -> Result<String> {
        println!("Loading audio file: {}", audio_path.display());

        // Load the audio file
        let mut reader = hound::WavReader::open(audio_path)
            .map_err(|e| anyhow::anyhow!("Failed to open audio file: {}", e))?;
        let samples: Vec<f32> = reader
            .samples()
            .collect::<Result<Vec<f32>, _>>()
            .map_err(|e| anyhow::anyhow!("Failed to read audio samples: {}", e))?;

        println!("Loaded {} audio samples", samples.len());

        // Configure Whisper parameters
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        println!("Starting transcription...");

        // Create a new state for this transcription
        let mut state = self
            .context
            .create_state()
            .map_err(|e| anyhow::anyhow!("Failed to create Whisper state: {}", e))?;
        state
            .full(params, &samples)
            .map_err(|e| anyhow::anyhow!("Failed to process audio: {}", e))?;

        // Get the transcription
        let num_segments = state
            .full_n_segments()
            .map_err(|e| anyhow::anyhow!("Failed to get number of segments: {}", e))?;
        let mut text = String::new();

        for i in 0..num_segments {
            if let Ok(segment) = state.full_get_segment_text(i) {
                text.push_str(&segment);
                text.push(' ');
            }
        }

        println!("Transcription completed");
        Ok(text.trim().to_string())
    }
}
