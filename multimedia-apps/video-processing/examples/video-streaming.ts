/**
 * Video Streaming Examples
 * Demonstrates HLS and DASH adaptive streaming setup
 */

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface StreamingQuality {
  name: string;
  width: number;
  height: number;
  bitrate: string;
  audioBitrate: string;
}

interface HLSOptions {
  segmentDuration?: number;
  playlistType?: 'vod' | 'event';
  deleteThreshold?: number;
}

interface DASHOptions {
  segmentDuration?: number;
  fragmentDuration?: number;
}

/**
 * Example 1: Generate HLS Stream (Basic)
 * Create HTTP Live Streaming output
 */
export async function generateHLSStream(
  inputPath: string,
  outputDir: string,
  options: HLSOptions = {}
): Promise<void> {
  const {
    segmentDuration = 6,
    playlistType = 'vod',
    deleteThreshold = 1,
  } = options;

  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'stream.m3u8');

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        `-hls_time ${segmentDuration}`,
        `-hls_playlist_type ${playlistType}`,
        '-hls_segment_filename',
        path.join(outputDir, 'segment%03d.ts'),
        '-f hls',
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('HLS stream generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 2: Generate Adaptive HLS Stream
 * Create multiple quality variants for adaptive streaming
 */
export async function generateAdaptiveHLS(
  inputPath: string,
  outputDir: string,
  qualities: StreamingQuality[] = [
    { name: '360p', width: 640, height: 360, bitrate: '800k', audioBitrate: '96k' },
    { name: '480p', width: 854, height: 480, bitrate: '1400k', audioBitrate: '128k' },
    { name: '720p', width: 1280, height: 720, bitrate: '2800k', audioBitrate: '128k' },
    { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', audioBitrate: '192k' },
  ]
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate each quality variant
  for (const quality of qualities) {
    const qualityDir = path.join(outputDir, quality.name);
    await fs.mkdir(qualityDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${quality.width}x${quality.height}`)
        .videoBitrate(quality.bitrate)
        .audioBitrate(quality.audioBitrate)
        .outputOptions([
          '-preset fast',
          '-g 48',
          '-sc_threshold 0',
          '-hls_time 6',
          '-hls_playlist_type vod',
          '-hls_segment_filename',
          path.join(qualityDir, 'segment%03d.ts'),
        ])
        .output(path.join(qualityDir, 'playlist.m3u8'))
        .on('end', () => {
          console.log(`${quality.name} variant generated`);
          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  // Generate master playlist
  await generateMasterPlaylist(outputDir, qualities);

  console.log('Adaptive HLS stream generated');
}

/**
 * Example 3: Generate Master Playlist
 * Create master playlist for adaptive streaming
 */
async function generateMasterPlaylist(
  outputDir: string,
  qualities: StreamingQuality[]
): Promise<void> {
  let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

  for (const quality of qualities) {
    const bandwidth = parseInt(quality.bitrate) * 1000;
    masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
    masterPlaylist += `${quality.name}/playlist.m3u8\n\n`;
  }

  await fs.writeFile(
    path.join(outputDir, 'master.m3u8'),
    masterPlaylist
  );

  console.log('Master playlist generated');
}

/**
 * Example 4: Generate DASH Stream
 * Create MPEG-DASH streaming output
 */
export async function generateDASHStream(
  inputPath: string,
  outputDir: string,
  options: DASHOptions = {}
): Promise<void> {
  const {
    segmentDuration = 6,
    fragmentDuration = 2,
  } = options;

  await fs.mkdir(outputDir, { recursive: true });

  // Using ffmpeg to create DASH manifest
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-keyint_min 48',
        '-g 48',
        '-sc_threshold 0',
        '-b:v 2500k',
        '-maxrate 2675k',
        '-bufsize 3750k',
        '-b:a 128k',
        '-f dash',
        `-seg_duration ${segmentDuration}`,
        `-frag_duration ${fragmentDuration}`,
        '-use_template 1',
        '-use_timeline 1',
        '-init_seg_name init-$RepresentationID$.m4s',
        '-media_seg_name segment-$RepresentationID$-$Number%05d$.m4s',
      ])
      .output(path.join(outputDir, 'manifest.mpd'))
      .on('end', () => {
        console.log('DASH stream generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 5: Generate Adaptive DASH Stream
 * Create multi-bitrate DASH stream
 */
export async function generateAdaptiveDASH(
  inputPath: string,
  outputDir: string,
  qualities: StreamingQuality[]
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Build complex filter for multiple outputs
  const outputOptions: string[] = [
    '-preset fast',
    '-keyint_min 48',
    '-g 48',
    '-sc_threshold 0',
    '-f dash',
    '-seg_duration 6',
    '-use_template 1',
    '-use_timeline 1',
    '-init_seg_name init-stream$RepresentationID$.m4s',
    '-media_seg_name chunk-stream$RepresentationID$-$Number%05d$.m4s',
    '-adaptation_sets "id=0,streams=v id=1,streams=a"',
  ];

  // Add quality variants
  for (let i = 0; i < qualities.length; i++) {
    const quality = qualities[i];
    outputOptions.push(
      `-map 0:v -s:v:${i} ${quality.width}x${quality.height} -b:v:${i} ${quality.bitrate}`
    );
  }

  outputOptions.push('-map 0:a');

  return new Promise((resolve, reject) => {
    const cmd = ffmpeg(inputPath);

    outputOptions.forEach((opt) => cmd.outputOption(opt));

    cmd
      .output(path.join(outputDir, 'manifest.mpd'))
      .on('end', () => {
        console.log('Adaptive DASH stream generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 6: Generate HLS with Encryption
 * Create encrypted HLS stream
 */
export async function generateEncryptedHLS(
  inputPath: string,
  outputDir: string,
  encryptionKey: string
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate key file
  const keyPath = path.join(outputDir, 'encryption.key');
  await fs.writeFile(keyPath, encryptionKey);

  // Generate key info file
  const keyInfoPath = path.join(outputDir, 'keyinfo.txt');
  const keyInfoContent = `${keyPath}\n${keyPath}\n`;
  await fs.writeFile(keyInfoPath, keyInfoContent);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-hls_time 6',
        '-hls_playlist_type vod',
        `-hls_key_info_file ${keyInfoPath}`,
        '-hls_segment_filename',
        path.join(outputDir, 'segment%03d.ts'),
      ])
      .output(path.join(outputDir, 'encrypted.m3u8'))
      .on('end', () => {
        console.log('Encrypted HLS stream generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 7: Generate Low Latency HLS
 * Create LL-HLS (Low Latency HLS) stream
 */
export async function generateLowLatencyHLS(
  inputPath: string,
  outputDir: string
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset ultrafast',
        '-tune zerolatency',
        '-hls_time 2',
        '-hls_list_size 10',
        '-hls_flags delete_segments+append_list',
        '-hls_segment_type fmp4',
        '-hls_fmp4_init_filename init.mp4',
        '-hls_segment_filename',
        path.join(outputDir, 'segment%d.m4s'),
      ])
      .output(path.join(outputDir, 'stream.m3u8'))
      .on('end', () => {
        console.log('Low latency HLS stream generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 8: Generate Progressive Download
 * Optimize MP4 for progressive download
 */
export async function generateProgressiveMP4(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-movflags +faststart', // Move moov atom to beginning
        '-profile:v high',
        '-level 4.0',
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('Progressive MP4 generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 9: Generate Thumbnail Track for HLS
 * Create thumbnail preview track
 */
export async function generateThumbnailTrack(
  inputPath: string,
  outputDir: string,
  interval: number = 10
): Promise<void> {
  const thumbDir = path.join(outputDir, 'thumbnails');
  await fs.mkdir(thumbDir, { recursive: true });

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-vf fps=1/${interval},scale=160:90`,
        '-vsync vfr',
      ])
      .output(path.join(thumbDir, 'thumb%04d.jpg'))
      .on('end', async () => {
        // Generate WebVTT file for thumbnails
        const duration = await getVideoDuration(inputPath);
        await generateThumbnailVTT(
          path.join(outputDir, 'thumbnails.vtt'),
          duration,
          interval
        );
        console.log('Thumbnail track generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 10: Generate WebVTT Thumbnails
 * Create WebVTT file for thumbnail previews
 */
async function generateThumbnailVTT(
  outputPath: string,
  duration: number,
  interval: number
): Promise<void> {
  let vtt = 'WEBVTT\n\n';
  const count = Math.floor(duration / interval);

  for (let i = 0; i < count; i++) {
    const start = formatVTTTime(i * interval);
    const end = formatVTTTime((i + 1) * interval);
    vtt += `${start} --> ${end}\n`;
    vtt += `thumbnails/thumb${String(i + 1).padStart(4, '0')}.jpg\n\n`;
  }

  await fs.writeFile(outputPath, vtt);
}

/**
 * Example 11: Generate Multi-Audio HLS
 * Create HLS with multiple audio tracks
 */
export async function generateMultiAudioHLS(
  inputPath: string,
  outputDir: string,
  audioTracks: Array<{ language: string; name: string }>
): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Generate video variant
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .noAudio()
      .outputOptions([
        '-preset fast',
        '-hls_time 6',
        '-hls_segment_filename',
        path.join(outputDir, 'video/segment%03d.ts'),
      ])
      .output(path.join(outputDir, 'video/playlist.m3u8'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Generate audio variants (placeholder - would need actual multi-audio source)
  for (const track of audioTracks) {
    const audioDir = path.join(outputDir, `audio-${track.language}`);
    await fs.mkdir(audioDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec('aac')
        .outputOptions([
          '-hls_time 6',
          '-hls_segment_filename',
          path.join(audioDir, 'segment%03d.ts'),
        ])
        .output(path.join(audioDir, 'playlist.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  console.log('Multi-audio HLS stream generated');
}

/**
 * Example 12: Generate Subtitle Tracks
 * Add WebVTT subtitle tracks to HLS
 */
export async function generateSubtitleTracks(
  inputPath: string,
  outputDir: string,
  subtitles: Array<{ language: string; file: string }>
): Promise<void> {
  const subtitleDir = path.join(outputDir, 'subtitles');
  await fs.mkdir(subtitleDir, { recursive: true });

  for (const subtitle of subtitles) {
    const outputPath = path.join(
      subtitleDir,
      `${subtitle.language}.m3u8`
    );

    // Copy and segment subtitle file
    const subtitleContent = await fs.readFile(subtitle.file, 'utf-8');
    await fs.writeFile(
      path.join(subtitleDir, `${subtitle.language}.vtt`),
      subtitleContent
    );

    // Create playlist
    const playlist = `#EXTM3U
#EXT-X-TARGETDURATION:10000
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:10000.0,
${subtitle.language}.vtt
#EXT-X-ENDLIST`;

    await fs.writeFile(outputPath, playlist);
  }

  console.log('Subtitle tracks generated');
}

/**
 * Example 13: Generate Streaming Manifest
 * Create comprehensive streaming manifest
 */
export async function generateStreamingManifest(
  inputPath: string,
  outputDir: string,
  formats: Array<'hls' | 'dash' | 'progressive'>
): Promise<void> {
  const manifest: any = {
    title: path.basename(inputPath),
    formats: {},
  };

  for (const format of formats) {
    switch (format) {
      case 'hls':
        const hlsDir = path.join(outputDir, 'hls');
        await generateAdaptiveHLS(inputPath, hlsDir);
        manifest.formats.hls = 'hls/master.m3u8';
        break;

      case 'dash':
        const dashDir = path.join(outputDir, 'dash');
        await generateDASHStream(inputPath, dashDir);
        manifest.formats.dash = 'dash/manifest.mpd';
        break;

      case 'progressive':
        const progressivePath = path.join(outputDir, 'progressive.mp4');
        await generateProgressiveMP4(inputPath, progressivePath);
        manifest.formats.progressive = 'progressive.mp4';
        break;
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('Streaming manifest generated');
}

/**
 * Example 14: Generate Preview Clips
 * Create short preview segments
 */
export async function generatePreviewClips(
  inputPath: string,
  outputDir: string,
  clipDuration: number = 10,
  count: number = 3
): Promise<string[]> {
  await fs.mkdir(outputDir, { recursive: true });

  const duration = await getVideoDuration(inputPath);
  const interval = duration / (count + 1);
  const clips: string[] = [];

  for (let i = 0; i < count; i++) {
    const startTime = (i + 1) * interval;
    const outputPath = path.join(outputDir, `preview-${i + 1}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .duration(clipDuration)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-movflags +faststart'])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    clips.push(outputPath);
  }

  console.log(`Generated ${count} preview clips`);
  return clips;
}

/**
 * Example 15: Batch Generate Streaming Formats
 * Process multiple videos for streaming
 */
export async function batchGenerateStreaming(
  inputDir: string,
  outputBaseDir: string
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const videoFiles = files.filter((file) =>
    /\.(mp4|avi|mov|mkv)$/i.test(file)
  );

  for (const file of videoFiles) {
    const inputPath = path.join(inputDir, file);
    const basename = path.basename(file, path.extname(file));
    const outputDir = path.join(outputBaseDir, basename);

    console.log(`Processing: ${file}`);
    await generateStreamingManifest(inputPath, outputDir, [
      'hls',
      'dash',
      'progressive',
    ]);
  }

  console.log(`Batch processing completed: ${videoFiles.length} videos`);
}

// Helper Functions

async function getVideoDuration(inputPath: string): Promise<number> {
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

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Usage Examples
async function main() {
  const inputVideo = './assets/sample.mp4';
  const outputDir = './output/streaming';

  // Example 1: Basic HLS
  await generateHLSStream(inputVideo, `${outputDir}/basic-hls`);

  // Example 2: Adaptive HLS
  await generateAdaptiveHLS(inputVideo, `${outputDir}/adaptive-hls`);

  // Example 3: DASH stream
  await generateDASHStream(inputVideo, `${outputDir}/dash`);

  // Example 4: Progressive MP4
  await generateProgressiveMP4(inputVideo, `${outputDir}/progressive.mp4`);

  // Example 5: Low latency HLS
  await generateLowLatencyHLS(inputVideo, `${outputDir}/ll-hls`);

  // Example 6: Generate all formats
  await generateStreamingManifest(inputVideo, `${outputDir}/all-formats`, [
    'hls',
    'dash',
    'progressive',
  ]);

  // Example 7: Preview clips
  await generatePreviewClips(inputVideo, `${outputDir}/previews`, 10, 3);

  // Example 8: Thumbnail track
  await generateThumbnailTrack(inputVideo, `${outputDir}/thumbs`, 10);

  console.log('All streaming examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  generateHLSStream,
  generateAdaptiveHLS,
  generateDASHStream,
  generateAdaptiveDASH,
  generateEncryptedHLS,
  generateLowLatencyHLS,
  generateProgressiveMP4,
  generateThumbnailTrack,
  generateMultiAudioHLS,
  generateSubtitleTracks,
  generateStreamingManifest,
  generatePreviewClips,
  batchGenerateStreaming,
};
