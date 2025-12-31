/**
 * Audio Effects Examples
 * Demonstrates various audio effects and filters using FFmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';

interface EffectOptions {
  intensity?: number;
  frequency?: number;
  gain?: number;
}

interface EqualizerBand {
  frequency: number;
  width: number;
  gain: number;
}

/**
 * Example 1: Fade In Effect
 * Gradually increase volume at start
 */
export async function applyFadeIn(
  inputPath: string,
  outputPath: string,
  duration: number = 3
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`afade=t=in:d=${duration}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Fade in applied (${duration}s)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 2: Fade Out Effect
 * Gradually decrease volume at end
 */
export async function applyFadeOut(
  inputPath: string,
  outputPath: string,
  duration: number = 3
): Promise<void> {
  const metadata = await getAudioDuration(inputPath);
  const startTime = metadata - duration;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`afade=t=out:st=${startTime}:d=${duration}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Fade out applied (${duration}s)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 3: Volume Adjustment
 * Increase or decrease volume
 */
export async function adjustVolume(
  inputPath: string,
  outputPath: string,
  volumeMultiplier: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`volume=${volumeMultiplier}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Volume adjusted (${volumeMultiplier}x)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 4: Echo Effect
 * Add echo/reverb effect
 */
export async function applyEcho(
  inputPath: string,
  outputPath: string,
  delay: number = 500,
  decay: number = 0.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`aecho=0.8:0.9:${delay}:${decay}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Echo effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 5: Reverb Effect
 * Add reverb/room effect
 */
export async function applyReverb(
  inputPath: string,
  outputPath: string,
  roomSize: number = 50
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`aecho=0.8:0.88:60:0.4,aecho=0.8:0.88:${roomSize * 2}:0.3`)
      .output(outputPath)
      .on('end', () => {
        console.log('Reverb effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 6: Speed Up Audio
 * Increase playback speed
 */
export async function speedUp(
  inputPath: string,
  outputPath: string,
  speed: number = 1.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`atempo=${speed}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Speed increased (${speed}x)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 7: Slow Down Audio
 * Decrease playback speed
 */
export async function slowDown(
  inputPath: string,
  outputPath: string,
  speed: number = 0.75
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`atempo=${speed}`)
      .output(outputPath)
      .on('end', () => {
        console.log(`Speed decreased (${speed}x)`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 8: Pitch Shift
 * Change pitch without affecting speed
 */
export async function pitchShift(
  inputPath: string,
  outputPath: string,
  semitones: number
): Promise<void> {
  const ratio = Math.pow(2, semitones / 12);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters([
        `asetrate=44100*${ratio}`,
        'aresample=44100',
      ])
      .output(outputPath)
      .on('end', () => {
        console.log(`Pitch shifted by ${semitones} semitones`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 9: Bass Boost
 * Enhance low frequencies
 */
export async function bassBoost(
  inputPath: string,
  outputPath: string,
  gain: number = 10
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`bass=g=${gain}:f=110:w=100`)
      .output(outputPath)
      .on('end', () => {
        console.log('Bass boost applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 10: Treble Boost
 * Enhance high frequencies
 */
export async function trebleBoost(
  inputPath: string,
  outputPath: string,
  gain: number = 10
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`treble=g=${gain}:f=3000:w=1000`)
      .output(outputPath)
      .on('end', () => {
        console.log('Treble boost applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 11: Equalizer
 * Apply custom equalizer settings
 */
export async function applyEqualizer(
  inputPath: string,
  outputPath: string,
  bands: EqualizerBand[]
): Promise<void> {
  const filters = bands.map(
    (band) => `equalizer=f=${band.frequency}:width_type=h:width=${band.width}:g=${band.gain}`
  );

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(filters)
      .output(outputPath)
      .on('end', () => {
        console.log('Equalizer applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 12: Noise Reduction
 * Remove background noise
 */
export async function reduceNoise(
  inputPath: string,
  outputPath: string,
  noiseReduction: number = 0.21
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`afftdn=nr=${noiseReduction}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Noise reduction applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 13: Compression (Dynamic Range)
 * Compress dynamic range
 */
export async function applyCompression(
  inputPath: string,
  outputPath: string,
  threshold: number = -20,
  ratio: number = 4
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(
        `acompressor=threshold=${threshold}dB:ratio=${ratio}:attack=20:release=250`
      )
      .output(outputPath)
      .on('end', () => {
        console.log('Compression applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 14: Limiter
 * Prevent audio clipping
 */
export async function applyLimiter(
  inputPath: string,
  outputPath: string,
  limit: number = -1
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`alimiter=limit=${limit}dB:attack=5:release=50`)
      .output(outputPath)
      .on('end', () => {
        console.log('Limiter applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 15: Flanger Effect
 * Add flanger effect
 */
export async function applyFlanger(
  inputPath: string,
  outputPath: string,
  delay: number = 0,
  depth: number = 2
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`flanger=delay=${delay}:depth=${depth}:regen=0:width=71`)
      .output(outputPath)
      .on('end', () => {
        console.log('Flanger effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 16: Chorus Effect
 * Add chorus effect
 */
export async function applyChorus(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters('chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3')
      .output(outputPath)
      .on('end', () => {
        console.log('Chorus effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 17: Distortion Effect
 * Add distortion/overdrive
 */
export async function applyDistortion(
  inputPath: string,
  outputPath: string,
  gain: number = 20
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`volume=${gain}dB,alimiter`)
      .output(outputPath)
      .on('end', () => {
        console.log('Distortion applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 18: Reverse Audio
 * Play audio in reverse
 */
export async function reverseAudio(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters('areverse')
      .output(outputPath)
      .on('end', () => {
        console.log('Audio reversed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 19: Tremolo Effect
 * Add tremolo (volume modulation)
 */
export async function applyTremolo(
  inputPath: string,
  outputPath: string,
  frequency: number = 5,
  depth: number = 0.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`tremolo=f=${frequency}:d=${depth}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Tremolo effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 20: Vibrato Effect
 * Add vibrato (pitch modulation)
 */
export async function applyVibrato(
  inputPath: string,
  outputPath: string,
  frequency: number = 5,
  depth: number = 0.5
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`vibrato=f=${frequency}:d=${depth}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Vibrato effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 21: High Pass Filter
 * Remove low frequencies
 */
export async function applyHighPass(
  inputPath: string,
  outputPath: string,
  cutoffFrequency: number = 200
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`highpass=f=${cutoffFrequency}`)
      .output(outputPath)
      .on('end', () => {
        console.log('High-pass filter applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 22: Low Pass Filter
 * Remove high frequencies
 */
export async function applyLowPass(
  inputPath: string,
  outputPath: string,
  cutoffFrequency: number = 3000
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`lowpass=f=${cutoffFrequency}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Low-pass filter applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 23: Band Pass Filter
 * Keep only specific frequency range
 */
export async function applyBandPass(
  inputPath: string,
  outputPath: string,
  centerFrequency: number = 1000,
  width: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`bandpass=f=${centerFrequency}:width_type=h:w=${width}`)
      .output(outputPath)
      .on('end', () => {
        console.log('Band-pass filter applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 24: Karaoke Effect
 * Remove center vocals
 */
export async function applyKaraoke(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters('stereotools=mlev=0.015625')
      .output(outputPath)
      .on('end', () => {
        console.log('Karaoke effect applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 25: Chain Multiple Effects
 * Apply multiple effects in sequence
 */
export async function applyMultipleEffects(
  inputPath: string,
  outputPath: string,
  effects: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(effects)
      .output(outputPath)
      .on('end', () => {
        console.log('Multiple effects applied');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 26: Radio Effect
 * Make audio sound like it's from a radio
 */
export async function applyRadioEffect(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const effects = [
    'highpass=f=300',
    'lowpass=f=3000',
    'acompressor=threshold=-20dB:ratio=4:attack=20:release=250',
    'equalizer=f=1000:width_type=h:width=100:g=3',
  ];

  return applyMultipleEffects(inputPath, outputPath, effects);
}

/**
 * Example 27: Telephone Effect
 * Make audio sound like phone call
 */
export async function applyTelephoneEffect(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const effects = [
    'highpass=f=400',
    'lowpass=f=3400',
    'volume=2',
  ];

  return applyMultipleEffects(inputPath, outputPath, effects);
}

/**
 * Example 28: Robot Voice Effect
 * Create robotic voice effect
 */
export async function applyRobotVoice(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const effects = [
    'asetrate=44100*0.8',
    'aresample=44100',
    'afftfilt=real=\'hypot(re,im)*cos(0)\':imag=\'hypot(re,im)*sin(0)\'',
  ];

  return applyMultipleEffects(inputPath, outputPath, effects);
}

/**
 * Example 29: Normalize and Enhance
 * Complete audio enhancement chain
 */
export async function enhanceAudio(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const effects = [
    'afftdn=nr=0.21', // Noise reduction
    'highpass=f=80', // Remove rumble
    'lowpass=f=12000', // Remove high-end noise
    'loudnorm=I=-16:TP=-1.5:LRA=11', // Normalize
    'acompressor=threshold=-18dB:ratio=3:attack=20:release=250', // Compression
  ];

  return applyMultipleEffects(inputPath, outputPath, effects);
}

/**
 * Example 30: Batch Apply Effect
 * Apply effect to multiple files
 */
export async function batchApplyEffect(
  inputDir: string,
  outputDir: string,
  effectFunction: (input: string, output: string) => Promise<void>
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const audioFiles = files.filter((file) =>
    /\.(mp3|wav|flac|aac|ogg)$/i.test(file)
  );

  await fs.mkdir(outputDir, { recursive: true });

  for (const file of audioFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    await effectFunction(inputPath, outputPath);
    console.log(`Processed: ${file}`);
  }

  console.log(`Batch processing completed: ${audioFiles.length} files`);
}

// Helper Functions

async function getAudioDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata.format.duration || 0);
    });
  });
}

// Usage Examples
async function main() {
  const inputAudio = './assets/sample.mp3';
  const outputDir = './output/effects';

  await fs.mkdir(outputDir, { recursive: true });

  // Example 1: Basic effects
  await applyFadeIn(inputAudio, `${outputDir}/fade-in.mp3`, 3);
  await applyFadeOut(inputAudio, `${outputDir}/fade-out.mp3`, 3);
  await adjustVolume(inputAudio, `${outputDir}/louder.mp3`, 2);

  // Example 2: Audio effects
  await applyEcho(inputAudio, `${outputDir}/echo.mp3`, 500, 0.5);
  await applyReverb(inputAudio, `${outputDir}/reverb.mp3`, 50);

  // Example 3: Speed effects
  await speedUp(inputAudio, `${outputDir}/fast.mp3`, 1.5);
  await slowDown(inputAudio, `${outputDir}/slow.mp3`, 0.75);

  // Example 4: Pitch shift
  await pitchShift(inputAudio, `${outputDir}/higher-pitch.mp3`, 2);
  await pitchShift(inputAudio, `${outputDir}/lower-pitch.mp3`, -2);

  // Example 5: EQ effects
  await bassBoost(inputAudio, `${outputDir}/bass-boost.mp3`, 10);
  await trebleBoost(inputAudio, `${outputDir}/treble-boost.mp3`, 10);

  // Example 6: Custom equalizer
  await applyEqualizer(inputAudio, `${outputDir}/custom-eq.mp3`, [
    { frequency: 100, width: 100, gain: 5 },
    { frequency: 1000, width: 100, gain: -3 },
    { frequency: 5000, width: 100, gain: 3 },
  ]);

  // Example 7: Filters
  await reduceNoise(inputAudio, `${outputDir}/noise-reduced.mp3`, 0.21);
  await applyCompression(inputAudio, `${outputDir}/compressed.mp3`, -20, 4);
  await applyLimiter(inputAudio, `${outputDir}/limited.mp3`, -1);

  // Example 8: Creative effects
  await applyFlanger(inputAudio, `${outputDir}/flanger.mp3`, 0, 2);
  await applyChorus(inputAudio, `${outputDir}/chorus.mp3`);
  await applyDistortion(inputAudio, `${outputDir}/distortion.mp3`, 20);
  await reverseAudio(inputAudio, `${outputDir}/reversed.mp3`);

  // Example 9: Modulation effects
  await applyTremolo(inputAudio, `${outputDir}/tremolo.mp3`, 5, 0.5);
  await applyVibrato(inputAudio, `${outputDir}/vibrato.mp3`, 5, 0.5);

  // Example 10: Frequency filters
  await applyHighPass(inputAudio, `${outputDir}/high-pass.mp3`, 200);
  await applyLowPass(inputAudio, `${outputDir}/low-pass.mp3`, 3000);
  await applyBandPass(inputAudio, `${outputDir}/band-pass.mp3`, 1000, 100);

  // Example 11: Special effects
  await applyRadioEffect(inputAudio, `${outputDir}/radio.mp3`);
  await applyTelephoneEffect(inputAudio, `${outputDir}/telephone.mp3`);
  await applyRobotVoice(inputAudio, `${outputDir}/robot.mp3`);
  await applyKaraoke(inputAudio, `${outputDir}/karaoke.mp3`);

  // Example 12: Enhancement
  await enhanceAudio(inputAudio, `${outputDir}/enhanced.mp3`);

  console.log('All audio effects examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  applyFadeIn,
  applyFadeOut,
  adjustVolume,
  applyEcho,
  applyReverb,
  speedUp,
  slowDown,
  pitchShift,
  bassBoost,
  trebleBoost,
  applyEqualizer,
  reduceNoise,
  applyCompression,
  applyLimiter,
  applyFlanger,
  applyChorus,
  applyDistortion,
  reverseAudio,
  applyTremolo,
  applyVibrato,
  applyHighPass,
  applyLowPass,
  applyBandPass,
  applyKaraoke,
  applyMultipleEffects,
  applyRadioEffect,
  applyTelephoneEffect,
  applyRobotVoice,
  enhanceAudio,
  batchApplyEffect,
};
