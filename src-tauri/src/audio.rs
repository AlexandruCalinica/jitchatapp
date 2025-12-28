use anyhow::Result;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use hound::{WavSpec, WavWriter};
use std::fs::File;
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AudioSource {
    LocalMicrophone,
    RemoteAudio,
}

// Thread-safe wrapper for the stream
struct StreamWrapper(Arc<Mutex<cpal::Stream>>);
unsafe impl Send for StreamWrapper {}
unsafe impl Sync for StreamWrapper {}

pub struct AudioCapture {
    sample_rate: u32,
    channels: u16,
    streams: Vec<(AudioSource, StreamWrapper)>,
    writers: Vec<(AudioSource, Arc<Mutex<WavWriter<File>>>)>,
}

impl AudioCapture {
    pub fn new(sample_rate: u32, channels: u16) -> Self {
        Self {
            sample_rate,
            channels,
            streams: Vec::new(),
            writers: Vec::new(),
        }
    }

    pub fn start_capture(&mut self, output_path: &Path, source: AudioSource) -> Result<()> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| anyhow::anyhow!("No input device available"))?;

        println!(
            "Starting audio capture for {:?} with device: {}",
            source,
            device.name()?
        );
        println!(
            "Sample rate: {} Hz, Channels: {}",
            self.sample_rate, self.channels
        );

        // Create WAV writer
        let spec = WavSpec {
            channels: self.channels,
            sample_rate: self.sample_rate,
            bits_per_sample: 32,
            sample_format: hound::SampleFormat::Float,
        };
        let file = File::create(output_path)?;
        let writer = WavWriter::new(file, spec)?;
        let writer = Arc::new(Mutex::new(writer));
        let writer_clone = writer.clone();

        let config = cpal::StreamConfig {
            channels: self.channels,
            sample_rate: cpal::SampleRate(self.sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        let stream = device.build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if let Ok(mut writer) = writer_clone.lock() {
                    for &sample in data {
                        if let Err(e) = writer.write_sample(sample) {
                            eprintln!("Error writing sample: {}", e);
                        }
                    }
                }
            },
            move |err| {
                eprintln!("Error in audio stream: {}", err);
            },
            None,
        )?;

        println!("Audio stream created successfully for {:?}", source);
        stream.play()?;
        println!("Audio capture started for {:?}", source);

        // Store the stream and writer in our thread-safe wrapper
        self.streams
            .push((source, StreamWrapper(Arc::new(Mutex::new(stream)))));
        self.writers.push((source, writer));

        Ok(())
    }

    pub fn stop_capture(&mut self, source: AudioSource) -> Result<()> {
        // Find and stop the stream for the given source
        if let Some((idx, _)) = self
            .streams
            .iter()
            .enumerate()
            .find(|(_, (s, _))| *s == source)
        {
            if let Some((_, stream)) = self.streams.get(idx) {
                if let Ok(stream) = stream.0.lock() {
                    stream.pause()?;
                    println!("Audio capture stopped for {:?}", source);
                }
            }
            self.streams.remove(idx);
        }

        // Find and finalize the writer for the given source
        if let Some((idx, _)) = self
            .writers
            .iter()
            .enumerate()
            .find(|(_, (s, _))| *s == source)
        {
            let (_, writer) = self.writers.remove(idx);
            if let Ok(mutex) = Arc::try_unwrap(writer) {
                if let Ok(writer) = mutex.into_inner() {
                    writer.finalize()?;
                }
            }
        }

        Ok(())
    }
}

// Make AudioCapture thread-safe
unsafe impl Send for AudioCapture {}
unsafe impl Sync for AudioCapture {}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_audio_capture() -> Result<()> {
        let mut capture = AudioCapture::new(44100, 2);
        let output_path = PathBuf::from("test_output.wav");

        capture.start_capture(&output_path, AudioSource::LocalMicrophone)?;
        std::thread::sleep(std::time::Duration::from_secs(1));
        capture.stop_capture(AudioSource::LocalMicrophone)?;

        // Verify the file was created
        assert!(output_path.exists());
        Ok(())
    }
}
