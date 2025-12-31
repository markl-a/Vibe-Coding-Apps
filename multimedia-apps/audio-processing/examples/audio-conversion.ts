/**
 * Audio Conversion Examples
 * Demonstrates audio format conversion and processing
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

interface ConversionOptions {
  codec?: string;
  bitrate?: string;
  sampleRate?: number;
  channels?: number;
  quality?: number;
}

interface AudioMetadata {
  duration: number;
  codec: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
}

/**
 * Example 1: Convert to MP3
 * Convert any audio format to MP3
 */
export async function convertToMP3(
  inputPath: string,
  outputPath: string,
  bitrate: string = '192k'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to MP3');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 2: Convert to AAC
 * Convert to Advanced Audio Coding format
 */
export async function convertToAAC(
  inputPath: string,
  outputPath: string,
  bitrate: string = '128k'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac')
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to AAC');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 3: Convert to OGG Vorbis
 * Convert to open-source OGG format
 */
export async function convertToOGG(
  inputPath: string,
  outputPath: string,
  quality: number = 5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libvorbis')
      .audioQuality(quality)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to OGG Vorbis');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 4: Convert to WAV
 * Convert to uncompressed WAV format
 */
export async function convertToWAV(
  inputPath: string,
  outputPath: string,
  sampleRate: number = 44100
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(sampleRate)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to WAV');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 5: Convert to FLAC
 * Convert to lossless FLAC format
 */
export async function convertToFLAC(
  inputPath: string,
  outputPath: string,
  compressionLevel: number = 5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('flac')
      .audioQuality(0)
      .outputOptions([`-compression_level ${compressionLevel}`])
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to FLAC');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 6: Convert to Opus
 * Convert to modern Opus codec
 */
export async function convertToOpus(
  inputPath: string,
  outputPath: string,
  bitrate: string = '128k'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libopus')
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to Opus');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 7: Change Sample Rate
 * Resample audio to different sample rate
 */
export async function changeSampleRate(
  inputPath: string,
  outputPath: string,
  sampleRate: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(sampleRate)
      .output(outputPath)
      .on('end', () => {
        console.log(`Sample rate changed to ${sampleRate} Hz`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 8: Convert Stereo to Mono
 * Mix stereo audio to mono
 */
export async function convertToMono(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to mono');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 9: Convert Mono to Stereo
 * Duplicate mono channel to stereo
 */
export async function convertToStereo(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(2)
      .output(outputPath)
      .on('end', () => {
        console.log('Converted to stereo');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 10: Change Bitrate
 * Adjust audio bitrate
 */
export async function changeBitrate(
  inputPath: string,
  outputPath: string,
  bitrate: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => {
        console.log(`Bitrate changed to ${bitrate}`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 11: Batch Convert Audio Files
 * Convert multiple files at once
 */
export async function batchConvert(
  inputDir: string,
  outputDir: string,
  targetFormat: string,
  options: ConversionOptions = {}
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const audioFiles = files.filter((file) =>
    /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(file)
  );

  await fs.mkdir(outputDir, { recursive: true });

  for (const file of audioFiles) {
    const inputPath = path.join(inputDir, file);
    const basename = path.basename(file, path.extname(file));
    const outputPath = path.join(outputDir, `${basename}.${targetFormat}`);

    await convertAudio(inputPath, outputPath, options);
    console.log(`Converted: ${file}`);
  }

  console.log(`Batch conversion completed: ${audioFiles.length} files`);
}

/**
 * Example 12: Universal Audio Converter
 * Convert to any format with custom options
 */
export async function convertAudio(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions = {}
): Promise<void> {
  const {
    codec,
    bitrate = '192k',
    sampleRate = 44100,
    channels,
    quality,
  } = options;

  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath);

    if (codec) {
      cmd = cmd.audioCodec(codec);
    }

    cmd = cmd.audioBitrate(bitrate).audioFrequency(sampleRate);

    if (channels) {
      cmd = cmd.audioChannels(channels);
    }

    if (quality !== undefined) {
      cmd = cmd.audioQuality(quality);
    }

    cmd
      .output(outputPath)
      .on('end', () => {
        console.log('Audio converted');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 13: Get Audio Metadata
 * Extract audio file information
 */
export async function getAudioMetadata(
  inputPath: string
): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');
      if (!audioStream) {
        reject(new Error('No audio stream found'));
        return;
      }

      const info: AudioMetadata = {
        duration: metadata.format.duration || 0,
        codec: audioStream.codec_name || '',
        bitrate: audioStream.bit_rate || metadata.format.bit_rate || 0,
        sampleRate: audioStream.sample_rate || 0,
        channels: audioStream.channels || 0,
        format: metadata.format.format_name || '',
      };

      resolve(info);
    });
  });
}

/**
 * Example 14: Normalize Audio Volume
 * Adjust audio to standard volume level
 */
export async function normalizeVolume(
  inputPath: string,
  outputPath: string,
  targetLevel: number = -23
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters([
        {
          filter: 'loudnorm',
          options: {
            I: targetLevel,
            TP: -1.5,
            LRA: 11,
          },
        },
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('Audio normalized');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 15: Extract Audio from Video
 * Extract audio track from video file
 */
export async function extractAudioFromVideo(
  inputPath: string,
  outputPath: string,
  format: 'mp3' | 'aac' | 'wav' | 'flac' = 'mp3'
): Promise<void> {
  const codecMap = {
    mp3: 'libmp3lame',
    aac: 'aac',
    wav: 'pcm_s16le',
    flac: 'flac',
  };

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec(codecMap[format])
      .output(outputPath)
      .on('end', () => {
        console.log('Audio extracted from video');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 16: Convert to Multiple Formats
 * Generate multiple format versions
 */
export async function convertToMultipleFormats(
  inputPath: string,
  outputDir: string,
  formats: Array<{ format: string; options: ConversionOptions }>
): Promise<{ [format: string]: string }> {
  await fs.mkdir(outputDir, { recursive: true });

  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputs: { [format: string]: string } = {};

  for (const { format, options } of formats) {
    const outputPath = path.join(outputDir, `${basename}.${format}`);
    await convertAudio(inputPath, outputPath, options);
    outputs[format] = outputPath;
    console.log(`Generated ${format} version`);
  }

  return outputs;
}

/**
 * Example 17: Compress Audio
 * Reduce file size with quality settings
 */
export async function compressAudio(
  inputPath: string,
  outputPath: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<void> {
  const qualitySettings = {
    low: { bitrate: '96k', sampleRate: 22050 },
    medium: { bitrate: '128k', sampleRate: 44100 },
    high: { bitrate: '192k', sampleRate: 48000 },
  };

  const settings = qualitySettings[quality];

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(settings.bitrate)
      .audioFrequency(settings.sampleRate)
      .output(outputPath)
      .on('end', () => {
        console.log(`Audio compressed (${quality} quality)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 18: Convert for Podcast
 * Optimize audio for podcast distribution
 */
export async function convertForPodcast(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioFrequency(44100)
      .audioChannels(2)
      .audioFilters('loudnorm')
      .output(outputPath)
      .on('end', () => {
        console.log('Audio optimized for podcast');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 19: Convert for Streaming
 * Optimize for web streaming
 */
export async function convertForStreaming(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac')
      .audioBitrate('128k')
      .audioFrequency(48000)
      .audioChannels(2)
      .output(outputPath)
      .on('end', () => {
        console.log('Audio optimized for streaming');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 20: Convert to Ringtone
 * Create phone ringtone from audio
 */
export async function convertToRingtone(
  inputPath: string,
  outputPath: string,
  startTime: number = 0,
  duration: number = 30
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .duration(duration)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => {
        console.log('Ringtone created');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

// Usage Examples
async function main() {
  const inputAudio = './assets/sample.mp3';
  const inputVideo = './assets/sample.mp4';
  const outputDir = './output/audio';

  await fs.mkdir(outputDir, { recursive: true });

  // Example 1: Convert to different formats
  await convertToMP3(inputAudio, `${outputDir}/audio.mp3`, '192k');
  await convertToAAC(inputAudio, `${outputDir}/audio.aac`, '128k');
  await convertToOGG(inputAudio, `${outputDir}/audio.ogg`, 5);
  await convertToWAV(inputAudio, `${outputDir}/audio.wav`, 44100);
  await convertToFLAC(inputAudio, `${outputDir}/audio.flac`, 5);
  await convertToOpus(inputAudio, `${outputDir}/audio.opus`, '128k');

  // Example 2: Change sample rate
  await changeSampleRate(inputAudio, `${outputDir}/48khz.mp3`, 48000);

  // Example 3: Convert to mono
  await convertToMono(inputAudio, `${outputDir}/mono.mp3`);

  // Example 4: Get metadata
  const metadata = await getAudioMetadata(inputAudio);
  console.log('Audio metadata:', metadata);

  // Example 5: Normalize volume
  await normalizeVolume(inputAudio, `${outputDir}/normalized.mp3`, -23);

  // Example 6: Extract audio from video
  await extractAudioFromVideo(inputVideo, `${outputDir}/extracted.mp3`, 'mp3');

  // Example 7: Compress audio
  await compressAudio(inputAudio, `${outputDir}/compressed.mp3`, 'medium');

  // Example 8: Convert for podcast
  await convertForPodcast(inputAudio, `${outputDir}/podcast.mp3`);

  // Example 9: Create ringtone
  await convertToRingtone(inputAudio, `${outputDir}/ringtone.mp3`, 10, 30);

  // Example 10: Generate multiple formats
  await convertToMultipleFormats(inputAudio, outputDir, [
    { format: 'mp3', options: { bitrate: '320k' } },
    { format: 'aac', options: { bitrate: '256k' } },
    { format: 'ogg', options: { quality: 7 } },
  ]);

  console.log('All audio conversion examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  convertToMP3,
  convertToAAC,
  convertToOGG,
  convertToWAV,
  convertToFLAC,
  convertToOpus,
  changeSampleRate,
  convertToMono,
  convertToStereo,
  changeBitrate,
  batchConvert,
  convertAudio,
  getAudioMetadata,
  normalizeVolume,
  extractAudioFromVideo,
  convertToMultipleFormats,
  compressAudio,
  convertForPodcast,
  convertForStreaming,
  convertToRingtone,
};
