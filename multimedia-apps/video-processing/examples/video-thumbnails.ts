/**
 * Video Thumbnails Examples
 * Demonstrates thumbnail generation from videos
 */

import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  timestamps?: string[] | number[];
  count?: number;
}

interface ThumbnailGridOptions {
  columns: number;
  rows: number;
  width: number;
  height: number;
}

/**
 * Example 1: Generate Single Thumbnail
 * Extract thumbnail at specific timestamp
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp: string = '00:00:01.000'
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
      })
      .on('end', () => {
        console.log(`Thumbnail generated at ${timestamp}`);
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * Example 2: Generate Multiple Thumbnails
 * Extract thumbnails at multiple timestamps
 */
export async function generateMultipleThumbnails(
  inputPath: string,
  outputDir: string,
  timestamps: string[]
): Promise<string[]> {
  const outputPaths: string[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const outputPath = path.join(outputDir, `thumb-${i + 1}.jpg`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamps[i]],
          filename: `thumb-${i + 1}.jpg`,
          folder: outputDir,
        })
        .on('end', resolve)
        .on('error', reject);
    });

    outputPaths.push(outputPath);
  }

  console.log(`Generated ${timestamps.length} thumbnails`);
  return outputPaths;
}

/**
 * Example 3: Generate Thumbnails at Intervals
 * Extract thumbnails every N seconds
 */
export async function generateThumbnailsAtIntervals(
  inputPath: string,
  outputDir: string,
  intervalSeconds: number = 10
): Promise<string[]> {
  const duration = await getVideoDuration(inputPath);
  const count = Math.floor(duration / intervalSeconds);
  const timestamps: string[] = [];

  for (let i = 0; i < count; i++) {
    const seconds = i * intervalSeconds;
    timestamps.push(formatTimestamp(seconds));
  }

  return generateMultipleThumbnails(inputPath, outputDir, timestamps);
}

/**
 * Example 4: Generate N Evenly Spaced Thumbnails
 * Extract specific number of thumbnails evenly distributed
 */
export async function generateEvenlySpacedThumbnails(
  inputPath: string,
  outputDir: string,
  count: number = 5
): Promise<string[]> {
  const duration = await getVideoDuration(inputPath);
  const interval = duration / (count + 1);
  const timestamps: string[] = [];

  for (let i = 1; i <= count; i++) {
    timestamps.push(formatTimestamp(i * interval));
  }

  return generateMultipleThumbnails(inputPath, outputDir, timestamps);
}

/**
 * Example 5: Generate Thumbnail with Custom Size
 * Create thumbnail with specific dimensions
 */
export async function generateCustomSizeThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp: string,
  width: number,
  height: number
): Promise<void> {
  const tempPath = outputPath + '.temp.jpg';

  // Extract frame
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(tempPath),
        folder: path.dirname(tempPath),
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Resize with sharp
  await sharp(tempPath)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 90 })
    .toFile(outputPath);

  // Clean up temp file
  await fs.unlink(tempPath);

  console.log(`Custom size thumbnail created: ${width}x${height}`);
}

/**
 * Example 6: Generate Thumbnail Grid (Preview)
 * Create a grid of thumbnails in one image
 */
export async function generateThumbnailGrid(
  inputPath: string,
  outputPath: string,
  options: ThumbnailGridOptions
): Promise<void> {
  const { columns, rows, width, height } = options;
  const totalThumbs = columns * rows;
  const tempDir = path.join(path.dirname(outputPath), 'temp_thumbs');

  // Create temp directory
  await fs.mkdir(tempDir, { recursive: true });

  // Generate individual thumbnails
  const thumbnails = await generateEvenlySpacedThumbnails(
    inputPath,
    tempDir,
    totalThumbs
  );

  // Resize all thumbnails to same size
  const resizedThumbs: string[] = [];
  for (let i = 0; i < thumbnails.length; i++) {
    const resizedPath = path.join(tempDir, `resized-${i}.jpg`);
    await sharp(thumbnails[i])
      .resize(width, height, { fit: 'cover' })
      .toFile(resizedPath);
    resizedThumbs.push(resizedPath);
  }

  // Create grid
  const canvas = sharp({
    create: {
      width: width * columns,
      height: height * rows,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  const composites = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < resizedThumbs.length) {
        composites.push({
          input: resizedThumbs[index],
          top: row * height,
          left: col * width,
        });
      }
    }
  }

  await canvas.composite(composites).jpeg({ quality: 90 }).toFile(outputPath);

  // Clean up temp directory
  await fs.rm(tempDir, { recursive: true });

  console.log(`Thumbnail grid created: ${columns}x${rows}`);
}

/**
 * Example 7: Generate GIF Preview
 * Create animated GIF from video
 */
export async function generateGifPreview(
  inputPath: string,
  outputPath: string,
  startTime: string = '00:00:00',
  duration: number = 5,
  fps: number = 10,
  width: number = 480
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .duration(duration)
      .fps(fps)
      .size(`${width}x?`)
      .output(outputPath)
      .on('end', () => {
        console.log('GIF preview generated');
        resolve();
      })
      .on('error', reject)
      .run();
  });
}

/**
 * Example 8: Generate First Frame Thumbnail
 * Extract the very first frame
 */
export async function generateFirstFrame(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return generateThumbnail(inputPath, outputPath, '00:00:00.001');
}

/**
 * Example 9: Generate Middle Frame Thumbnail
 * Extract frame from middle of video
 */
export async function generateMiddleFrame(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const duration = await getVideoDuration(inputPath);
  const middleTimestamp = formatTimestamp(duration / 2);
  return generateThumbnail(inputPath, outputPath, middleTimestamp);
}

/**
 * Example 10: Generate Optimized Thumbnails
 * Create thumbnails optimized for web
 */
export async function generateOptimizedThumbnails(
  inputPath: string,
  outputDir: string,
  count: number = 5
): Promise<string[]> {
  const tempDir = path.join(outputDir, 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  // Generate raw thumbnails
  const rawThumbs = await generateEvenlySpacedThumbnails(
    inputPath,
    tempDir,
    count
  );

  const optimizedPaths: string[] = [];

  // Optimize each thumbnail
  for (let i = 0; i < rawThumbs.length; i++) {
    const outputPath = path.join(outputDir, `thumb-${i + 1}.webp`);

    await sharp(rawThumbs[i])
      .resize(640, 360, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    optimizedPaths.push(outputPath);
  }

  // Clean up temp directory
  await fs.rm(tempDir, { recursive: true });

  console.log(`Generated ${count} optimized thumbnails`);
  return optimizedPaths;
}

/**
 * Example 11: Generate Thumbnails with Timestamps
 * Add timestamp overlay to thumbnails
 */
export async function generateThumbnailsWithTimestamps(
  inputPath: string,
  outputDir: string,
  count: number = 5
): Promise<string[]> {
  const duration = await getVideoDuration(inputPath);
  const interval = duration / (count + 1);
  const outputPaths: string[] = [];

  for (let i = 1; i <= count; i++) {
    const timestamp = i * interval;
    const timestampStr = formatTimestamp(timestamp);
    const outputPath = path.join(outputDir, `thumb-${i}.jpg`);
    const tempPath = outputPath + '.temp.jpg';

    // Extract frame
    await generateThumbnail(inputPath, tempPath, timestampStr);

    // Add timestamp text overlay
    const timestampSvg = Buffer.from(
      `<svg width="640" height="360">
        <style>
          .timestamp {
            font: bold 24px Arial;
            fill: white;
            stroke: black;
            stroke-width: 2;
          }
        </style>
        <text x="10" y="340" class="timestamp">${timestampStr}</text>
      </svg>`
    );

    await sharp(tempPath)
      .composite([
        {
          input: timestampSvg,
          blend: 'over',
        },
      ])
      .toFile(outputPath);

    await fs.unlink(tempPath);
    outputPaths.push(outputPath);
  }

  console.log(`Generated ${count} thumbnails with timestamps`);
  return outputPaths;
}

/**
 * Example 12: Generate Sprite Sheet
 * Create sprite sheet for video scrubbing
 */
export async function generateSpriteSheet(
  inputPath: string,
  outputPath: string,
  options: {
    columns: number;
    rows: number;
    thumbnailWidth: number;
    thumbnailHeight: number;
    interval: number;
  }
): Promise<void> {
  const { columns, rows, thumbnailWidth, thumbnailHeight, interval } = options;
  const totalThumbs = columns * rows;
  const tempDir = path.join(path.dirname(outputPath), 'sprite_temp');

  await fs.mkdir(tempDir, { recursive: true });

  // Generate thumbnails at intervals
  const timestamps: string[] = [];
  for (let i = 0; i < totalThumbs; i++) {
    timestamps.push(formatTimestamp(i * interval));
  }

  const thumbnails = await generateMultipleThumbnails(
    inputPath,
    tempDir,
    timestamps
  );

  // Resize all thumbnails
  const resizedThumbs: string[] = [];
  for (let i = 0; i < thumbnails.length; i++) {
    const resizedPath = path.join(tempDir, `resized-${i}.jpg`);
    await sharp(thumbnails[i])
      .resize(thumbnailWidth, thumbnailHeight, { fit: 'cover' })
      .toFile(resizedPath);
    resizedThumbs.push(resizedPath);
  }

  // Create sprite sheet
  const spriteWidth = thumbnailWidth * columns;
  const spriteHeight = thumbnailHeight * rows;

  const canvas = sharp({
    create: {
      width: spriteWidth,
      height: spriteHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  const composites = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < resizedThumbs.length) {
        composites.push({
          input: resizedThumbs[index],
          top: row * thumbnailHeight,
          left: col * thumbnailWidth,
        });
      }
    }
  }

  await canvas.composite(composites).jpeg({ quality: 85 }).toFile(outputPath);

  // Clean up
  await fs.rm(tempDir, { recursive: true });

  console.log(`Sprite sheet created: ${spriteWidth}x${spriteHeight}`);
}

/**
 * Example 13: Generate Responsive Thumbnails
 * Create multiple sizes for responsive design
 */
export async function generateResponsiveThumbnails(
  inputPath: string,
  outputDir: string,
  timestamp: string = '00:00:01.000'
): Promise<{ [size: string]: string }> {
  const sizes = {
    small: { width: 320, height: 180 },
    medium: { width: 640, height: 360 },
    large: { width: 1280, height: 720 },
  };

  const tempPath = path.join(outputDir, 'temp.jpg');
  await generateThumbnail(inputPath, tempPath, timestamp);

  const outputs: { [size: string]: string } = {};

  for (const [name, dimensions] of Object.entries(sizes)) {
    const outputPath = path.join(outputDir, `thumb-${name}.jpg`);

    await sharp(tempPath)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    outputs[name] = outputPath;
  }

  await fs.unlink(tempPath);

  console.log('Responsive thumbnails generated');
  return outputs;
}

/**
 * Example 14: Batch Generate Thumbnails
 * Process multiple videos
 */
export async function batchGenerateThumbnails(
  inputDir: string,
  outputDir: string,
  timestamp: string = '00:00:01.000'
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const videoFiles = files.filter((file) =>
    /\.(mp4|avi|mov|mkv|webm)$/i.test(file)
  );

  for (const file of videoFiles) {
    const inputPath = path.join(inputDir, file);
    const basename = path.basename(file, path.extname(file));
    const outputPath = path.join(outputDir, `${basename}-thumb.jpg`);

    await generateThumbnail(inputPath, outputPath, timestamp);
    console.log(`Thumbnail generated for: ${file}`);
  }

  console.log(`Batch processing completed: ${videoFiles.length} videos`);
}

/**
 * Example 15: Generate Smart Thumbnail
 * Use scene detection to find best frame
 */
export async function generateSmartThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // Extract thumbnail from 25% of the video (often has content)
  const duration = await getVideoDuration(inputPath);
  const smartTimestamp = formatTimestamp(duration * 0.25);

  await generateCustomSizeThumbnail(
    inputPath,
    outputPath,
    smartTimestamp,
    1280,
    720
  );

  console.log('Smart thumbnail generated');
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

function formatTimestamp(seconds: number): string {
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
  const outputDir = './output/thumbnails';

  await fs.mkdir(outputDir, { recursive: true });

  // Example 1: Single thumbnail
  await generateThumbnail(inputVideo, `${outputDir}/single.jpg`, '00:00:05.000');

  // Example 2: Multiple thumbnails
  await generateMultipleThumbnails(inputVideo, outputDir, [
    '00:00:01.000',
    '00:00:05.000',
    '00:00:10.000',
  ]);

  // Example 3: Thumbnails at intervals
  await generateThumbnailsAtIntervals(inputVideo, outputDir, 10);

  // Example 4: Evenly spaced thumbnails
  await generateEvenlySpacedThumbnails(inputVideo, outputDir, 5);

  // Example 5: Custom size thumbnail
  await generateCustomSizeThumbnail(
    inputVideo,
    `${outputDir}/custom.jpg`,
    '00:00:05.000',
    800,
    450
  );

  // Example 6: Thumbnail grid
  await generateThumbnailGrid(inputVideo, `${outputDir}/grid.jpg`, {
    columns: 4,
    rows: 3,
    width: 320,
    height: 180,
  });

  // Example 7: GIF preview
  await generateGifPreview(
    inputVideo,
    `${outputDir}/preview.gif`,
    '00:00:00',
    5,
    10,
    480
  );

  // Example 8: Optimized thumbnails
  await generateOptimizedThumbnails(inputVideo, outputDir, 5);

  // Example 9: Sprite sheet
  await generateSpriteSheet(inputVideo, `${outputDir}/sprite.jpg`, {
    columns: 5,
    rows: 4,
    thumbnailWidth: 160,
    thumbnailHeight: 90,
    interval: 5,
  });

  // Example 10: Responsive thumbnails
  await generateResponsiveThumbnails(inputVideo, outputDir, '00:00:05.000');

  console.log('All thumbnail examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  generateThumbnail,
  generateMultipleThumbnails,
  generateThumbnailsAtIntervals,
  generateEvenlySpacedThumbnails,
  generateCustomSizeThumbnail,
  generateThumbnailGrid,
  generateGifPreview,
  generateFirstFrame,
  generateMiddleFrame,
  generateOptimizedThumbnails,
  generateThumbnailsWithTimestamps,
  generateSpriteSheet,
  generateResponsiveThumbnails,
  batchGenerateThumbnails,
  generateSmartThumbnail,
};
