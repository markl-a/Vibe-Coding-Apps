/**
 * Video Transcoding Examples
 * Demonstrates video format conversion and transcoding using FFmpeg
 */

import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

interface TranscodeOptions {
  codec?: string;
  bitrate?: string;
  fps?: number;
  resolution?: string;
  preset?: string;
  crf?: number;
}

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  fps: number;
  format: string;
}

/**
 * Example 1: Basic Video Format Conversion
 * Convert video from one format to another
 */
export async function convertVideoFormat(
  inputPath: string,
  outputPath: string,
  format: 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .format(format)
      .on('start', (cmd) => console.log('Started:', cmd))
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log(`Conversion completed: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error('Error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Example 2: H.264 Encoding (MP4)
 * Transcode to H.264/MP4 with quality settings
 */
export async function transcodeToH264(
  inputPath: string,
  outputPath: string,
  options: TranscodeOptions = {}
): Promise<void> {
  const {
    bitrate = '2M',
    preset = 'medium',
    crf = 23,
  } = options;

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        `-preset ${preset}`,
        `-crf ${crf}`,
        '-movflags +faststart', // Enable fast start for web
      ])
      .videoBitrate(bitrate)
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`H.264 encoding: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('H.264 encoding completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 3: H.265/HEVC Encoding
 * Transcode to H.265 for better compression
 */
export async function transcodeToH265(
  inputPath: string,
  outputPath: string,
  crf: number = 28
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx265')
      .audioCodec('aac')
      .audioBitrate('128k')
      .outputOptions([
        `-crf ${crf}`,
        '-preset medium',
        '-tag:v hvc1', // For better compatibility
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`H.265 encoding: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('H.265 encoding completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 4: WebM/VP9 Encoding
 * Transcode to WebM with VP9 codec
 */
export async function transcodeToWebM(
  inputPath: string,
  outputPath: string,
  quality: number = 30
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .audioBitrate('128k')
      .outputOptions([
        `-crf ${quality}`,
        '-b:v 0',
        '-deadline good',
        '-cpu-used 2',
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`WebM encoding: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('WebM encoding completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 5: AV1 Encoding
 * Transcode to next-gen AV1 codec
 */
export async function transcodeToAV1(
  inputPath: string,
  outputPath: string,
  crf: number = 32
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libaom-av1')
      .audioCodec('libopus')
      .outputOptions([
        `-crf ${crf}`,
        '-b:v 0',
        '-cpu-used 4',
        '-row-mt 1',
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`AV1 encoding: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('AV1 encoding completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 6: Change Video Resolution
 * Scale video to different resolution
 */
export async function changeResolution(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .size(`${width}x${height}`)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions(['-preset fast', '-crf 23'])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Resizing: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log(`Resolution changed to ${width}x${height}`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 7: Change Frame Rate
 * Convert video to different FPS
 */
export async function changeFrameRate(
  inputPath: string,
  outputPath: string,
  fps: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .fps(fps)
      .videoCodec('libx264')
      .audioCodec('copy')
      .outputOptions(['-preset fast'])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Changing FPS: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log(`Frame rate changed to ${fps} FPS`);
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 8: Two-Pass Encoding
 * High-quality encoding with two-pass
 */
export async function twoPassEncode(
  inputPath: string,
  outputPath: string,
  bitrate: string = '2M'
): Promise<void> {
  const passlogFile = path.join(
    path.dirname(outputPath),
    'ffmpeg2pass'
  );

  // First pass
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .videoBitrate(bitrate)
      .outputOptions([
        '-preset medium',
        '-pass 1',
        `-passlogfile ${passlogFile}`,
        '-f null',
      ])
      .output('/dev/null')
      .on('end', () => {
        console.log('First pass completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });

  // Second pass
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(bitrate)
      .audioBitrate('128k')
      .outputOptions([
        '-preset medium',
        '-pass 2',
        `-passlogfile ${passlogFile}`,
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Second pass: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('Two-pass encoding completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 9: Batch Transcode
 * Transcode multiple videos
 */
export async function batchTranscode(
  inputDir: string,
  outputDir: string,
  options: TranscodeOptions = {}
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const videoFiles = files.filter((file) =>
    /\.(mp4|avi|mov|mkv|webm)$/i.test(file)
  );

  for (const file of videoFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(
      outputDir,
      file.replace(/\.[^.]+$/, '.mp4')
    );

    console.log(`Processing: ${file}`);
    await transcodeToH264(inputPath, outputPath, options);
  }

  console.log(`Batch transcode completed: ${videoFiles.length} videos`);
}

/**
 * Example 10: Get Video Metadata
 * Extract video information
 */
export async function getVideoMetadata(
  inputPath: string
): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const info: VideoMetadata = {
        duration: metadata.format.duration || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        codec: videoStream.codec_name || '',
        bitrate: metadata.format.bit_rate || 0,
        fps: eval(videoStream.r_frame_rate || '0') || 0,
        format: metadata.format.format_name || '',
      };

      resolve(info);
    });
  });
}

/**
 * Example 11: Compress Video
 * Reduce video file size
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
  targetSizeMB: number
): Promise<void> {
  const metadata = await getVideoMetadata(inputPath);
  const targetBitrate = Math.floor(
    (targetSizeMB * 8192) / metadata.duration
  );

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(`${targetBitrate}k`)
      .audioBitrate('96k')
      .outputOptions(['-preset medium', '-crf 28'])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Compressing: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('Video compression completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 12: Extract Audio from Video
 * Extract audio track only
 */
export async function extractAudio(
  inputPath: string,
  outputPath: string,
  format: 'mp3' | 'aac' | 'wav' | 'flac' = 'mp3'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec(format === 'mp3' ? 'libmp3lame' : format)
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        console.log('Audio extracted');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 13: Transcode for Mobile
 * Optimize video for mobile devices
 */
export async function transcodeForMobile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size('720x?')
      .videoBitrate('1M')
      .audioBitrate('96k')
      .outputOptions([
        '-preset fast',
        '-crf 25',
        '-profile:v baseline',
        '-level 3.0',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Mobile transcode: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('Mobile transcode completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 14: Transcode for Web
 * Optimize for web streaming
 */
export async function transcodeForWeb(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate('2M')
      .audioBitrate('128k')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-profile:v high',
        '-level 4.0',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .output(outputPath)
      .on('progress', (progress) => {
        console.log(`Web transcode: ${progress.percent?.toFixed(2)}%`);
      })
      .on('end', () => {
        console.log('Web transcode completed');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 15: Create Multiple Quality Versions
 * Generate multiple quality levels
 */
export async function createMultiQuality(
  inputPath: string,
  outputDir: string
): Promise<{ [quality: string]: string }> {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const qualities = [
    { name: '360p', height: 360, bitrate: '500k' },
    { name: '480p', height: 480, bitrate: '1M' },
    { name: '720p', height: 720, bitrate: '2M' },
    { name: '1080p', height: 1080, bitrate: '4M' },
  ];

  const outputs: { [quality: string]: string } = {};

  for (const quality of qualities) {
    const outputPath = path.join(
      outputDir,
      `${filename}-${quality.name}.mp4`
    );

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`?x${quality.height}`)
        .videoBitrate(quality.bitrate)
        .audioBitrate('128k')
        .outputOptions(['-preset fast', '-crf 23'])
        .output(outputPath)
        .on('end', () => {
          console.log(`${quality.name} version created`);
          resolve();
        })
        .on('error', reject)
        .run();
    });

    outputs[quality.name] = outputPath;
  }

  return outputs;
}

// Usage Examples
async function main() {
  const inputVideo = './assets/sample.mp4';
  const outputDir = './output';

  // Example 1: Convert to WebM
  await convertVideoFormat(
    inputVideo,
    `${outputDir}/video.webm`,
    'webm'
  );

  // Example 2: H.264 encoding
  await transcodeToH264(inputVideo, `${outputDir}/h264.mp4`, {
    bitrate: '2M',
    preset: 'medium',
    crf: 23,
  });

  // Example 3: H.265 encoding
  await transcodeToH265(inputVideo, `${outputDir}/h265.mp4`, 28);

  // Example 4: Change resolution
  await changeResolution(inputVideo, `${outputDir}/720p.mp4`, 1280, 720);

  // Example 5: Change frame rate
  await changeFrameRate(inputVideo, `${outputDir}/60fps.mp4`, 60);

  // Example 6: Get metadata
  const metadata = await getVideoMetadata(inputVideo);
  console.log('Video metadata:', metadata);

  // Example 7: Compress video
  await compressVideo(inputVideo, `${outputDir}/compressed.mp4`, 50);

  // Example 8: Extract audio
  await extractAudio(inputVideo, `${outputDir}/audio.mp3`, 'mp3');

  // Example 9: Transcode for mobile
  await transcodeForMobile(inputVideo, `${outputDir}/mobile.mp4`);

  // Example 10: Transcode for web
  await transcodeForWeb(inputVideo, `${outputDir}/web.mp4`);

  // Example 11: Create multiple quality versions
  await createMultiQuality(inputVideo, outputDir);

  console.log('All transcoding examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  convertVideoFormat,
  transcodeToH264,
  transcodeToH265,
  transcodeToWebM,
  transcodeToAV1,
  changeResolution,
  changeFrameRate,
  twoPassEncode,
  batchTranscode,
  getVideoMetadata,
  compressVideo,
  extractAudio,
  transcodeForMobile,
  transcodeForWeb,
  createMultiQuality,
};
