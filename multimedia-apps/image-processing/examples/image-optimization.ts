/**
 * Image Optimization Examples
 * Demonstrates image compression and optimization for web
 */

import sharp from 'sharp';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminWebp from 'imagemin-webp';
import imageminSvgo from 'imagemin-svgo';
import fs from 'fs/promises';
import path from 'path';

interface OptimizationOptions {
  quality?: number;
  progressive?: boolean;
  stripMetadata?: boolean;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
}

interface CompressionStats {
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
}

/**
 * Example 1: Basic JPEG Optimization
 * Optimize JPEG with quality control
 */
export async function optimizeJPEG(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<CompressionStats> {
  const originalStats = await fs.stat(inputPath);

  await sharp(inputPath)
    .jpeg({
      quality,
      progressive: true,
      mozjpeg: true,
    })
    .toFile(outputPath);

  const optimizedStats = await fs.stat(outputPath);
  const saved = originalStats.size - optimizedStats.size;

  const stats: CompressionStats = {
    originalSize: originalStats.size,
    optimizedSize: optimizedStats.size,
    savedBytes: saved,
    savedPercentage: (saved / originalStats.size) * 100,
  };

  console.log(`JPEG optimized: ${stats.savedPercentage.toFixed(2)}% smaller`);
  return stats;
}

/**
 * Example 2: PNG Optimization with Compression
 * Optimize PNG files with lossless compression
 */
export async function optimizePNG(
  inputPath: string,
  outputPath: string,
  compressionLevel: number = 9
): Promise<CompressionStats> {
  const originalStats = await fs.stat(inputPath);

  await sharp(inputPath)
    .png({
      compressionLevel,
      progressive: true,
      palette: true,
    })
    .toFile(outputPath);

  const optimizedStats = await fs.stat(outputPath);
  const saved = originalStats.size - optimizedStats.size;

  const stats: CompressionStats = {
    originalSize: originalStats.size,
    optimizedSize: optimizedStats.size,
    savedBytes: saved,
    savedPercentage: (saved / originalStats.size) * 100,
  };

  console.log(`PNG optimized: ${stats.savedPercentage.toFixed(2)}% smaller`);
  return stats;
}

/**
 * Example 3: WebP Conversion
 * Convert images to modern WebP format
 */
export async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<CompressionStats> {
  const originalStats = await fs.stat(inputPath);

  await sharp(inputPath)
    .webp({
      quality,
      effort: 6,
    })
    .toFile(outputPath);

  const optimizedStats = await fs.stat(outputPath);
  const saved = originalStats.size - optimizedStats.size;

  const stats: CompressionStats = {
    originalSize: originalStats.size,
    optimizedSize: optimizedStats.size,
    savedBytes: saved,
    savedPercentage: (saved / originalStats.size) * 100,
  };

  console.log(`WebP conversion: ${stats.savedPercentage.toFixed(2)}% smaller`);
  return stats;
}

/**
 * Example 4: AVIF Conversion
 * Convert to next-gen AVIF format (best compression)
 */
export async function convertToAVIF(
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<CompressionStats> {
  const originalStats = await fs.stat(inputPath);

  await sharp(inputPath)
    .avif({
      quality,
      effort: 6,
    })
    .toFile(outputPath);

  const optimizedStats = await fs.stat(outputPath);
  const saved = originalStats.size - optimizedStats.size;

  const stats: CompressionStats = {
    originalSize: originalStats.size,
    optimizedSize: optimizedStats.size,
    savedBytes: saved,
    savedPercentage: (saved / originalStats.size) * 100,
  };

  console.log(`AVIF conversion: ${stats.savedPercentage.toFixed(2)}% smaller`);
  return stats;
}

/**
 * Example 5: Strip Metadata
 * Remove EXIF data to reduce file size
 */
export async function stripMetadata(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .withMetadata({
      orientation: undefined,
    })
    .toFile(outputPath);

  console.log('Metadata stripped from image');
}

/**
 * Example 6: Progressive JPEG
 * Create progressive loading JPEG
 */
export async function createProgressiveJPEG(
  inputPath: string,
  outputPath: string,
  quality: number = 85
): Promise<void> {
  await sharp(inputPath)
    .jpeg({
      quality,
      progressive: true,
      optimizeScans: true,
    })
    .toFile(outputPath);

  console.log('Progressive JPEG created');
}

/**
 * Example 7: Multi-Format Output
 * Generate multiple optimized formats
 */
export async function generateMultiFormat(
  inputPath: string,
  outputDir: string,
  quality: number = 85
): Promise<{ [format: string]: string }> {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const outputs: { [format: string]: string } = {};

  // JPEG
  const jpegPath = path.join(outputDir, `${filename}.jpg`);
  await sharp(inputPath)
    .jpeg({ quality, progressive: true })
    .toFile(jpegPath);
  outputs.jpeg = jpegPath;

  // WebP
  const webpPath = path.join(outputDir, `${filename}.webp`);
  await sharp(inputPath)
    .webp({ quality, effort: 6 })
    .toFile(webpPath);
  outputs.webp = webpPath;

  // AVIF
  const avifPath = path.join(outputDir, `${filename}.avif`);
  await sharp(inputPath)
    .avif({ quality, effort: 6 })
    .toFile(avifPath);
  outputs.avif = avifPath;

  console.log('Multi-format images generated');
  return outputs;
}

/**
 * Example 8: Smart Compression
 * Automatically choose best compression settings
 */
export async function smartCompress(
  inputPath: string,
  outputPath: string,
  targetSizeKB: number
): Promise<void> {
  const metadata = await sharp(inputPath).metadata();
  let quality = 90;
  let currentSize = Infinity;

  // Binary search for optimal quality
  while (quality > 10 && currentSize > targetSizeKB * 1024) {
    const tempPath = outputPath + '.tmp';

    await sharp(inputPath)
      .jpeg({ quality, progressive: true })
      .toFile(tempPath);

    const stats = await fs.stat(tempPath);
    currentSize = stats.size;

    if (currentSize <= targetSizeKB * 1024) {
      await fs.rename(tempPath, outputPath);
      console.log(`Smart compression: ${quality}% quality, ${(currentSize / 1024).toFixed(2)} KB`);
      return;
    }

    await fs.unlink(tempPath);
    quality -= 5;
  }

  console.log('Could not reach target size with acceptable quality');
}

/**
 * Example 9: Batch Optimization
 * Optimize all images in a directory
 */
export async function batchOptimize(
  inputDir: string,
  outputDir: string,
  options: OptimizationOptions = {}
): Promise<CompressionStats[]> {
  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  const stats: CompressionStats[] = [];

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const outputPath = path.join(
      outputDir,
      `${basename}.${options.format || 'jpg'}`
    );

    try {
      const fileStats = await optimizeImage(inputPath, outputPath, options);
      stats.push(fileStats);
      console.log(`Optimized: ${file}`);
    } catch (error) {
      console.error(`Error optimizing ${file}:`, error);
    }
  }

  const totalOriginal = stats.reduce((sum, s) => sum + s.originalSize, 0);
  const totalOptimized = stats.reduce((sum, s) => sum + s.optimizedSize, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const totalPercentage = (totalSaved / totalOriginal) * 100;

  console.log(`\nBatch optimization complete:`);
  console.log(`Total saved: ${totalSaved} bytes (${totalPercentage.toFixed(2)}%)`);

  return stats;
}

/**
 * Example 10: Optimize Single Image
 * Universal optimization function
 */
export async function optimizeImage(
  inputPath: string,
  outputPath: string,
  options: OptimizationOptions = {}
): Promise<CompressionStats> {
  const originalStats = await fs.stat(inputPath);
  const {
    quality = 85,
    progressive = true,
    stripMetadata = true,
    format,
  } = options;

  let pipeline = sharp(inputPath);

  if (stripMetadata) {
    pipeline = pipeline.withMetadata({});
  }

  // Determine output format
  const outputFormat = format || path.extname(outputPath).slice(1).toLowerCase();

  switch (outputFormat) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality, progressive, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9, progressive: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality, effort: 6 });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality, effort: 6 });
      break;
    default:
      throw new Error(`Unsupported format: ${outputFormat}`);
  }

  await pipeline.toFile(outputPath);

  const optimizedStats = await fs.stat(outputPath);
  const saved = originalStats.size - optimizedStats.size;

  return {
    originalSize: originalStats.size,
    optimizedSize: optimizedStats.size,
    savedBytes: saved,
    savedPercentage: (saved / originalStats.size) * 100,
  };
}

/**
 * Example 11: Lazy Loading Placeholder
 * Generate tiny placeholder for lazy loading
 */
export async function generatePlaceholder(
  inputPath: string,
  outputPath: string,
  width: number = 20
): Promise<void> {
  await sharp(inputPath)
    .resize(width, null, { fit: 'inside' })
    .blur(5)
    .jpeg({ quality: 50 })
    .toFile(outputPath);

  console.log('Lazy loading placeholder generated');
}

/**
 * Example 12: Generate Responsive Images with Optimization
 * Create optimized responsive image set
 */
export async function generateOptimizedResponsive(
  inputPath: string,
  outputDir: string
): Promise<{ [key: string]: string }> {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const sizes = [
    { name: 'xs', width: 320, quality: 80 },
    { name: 'sm', width: 640, quality: 82 },
    { name: 'md', width: 768, quality: 84 },
    { name: 'lg', width: 1024, quality: 85 },
    { name: 'xl', width: 1280, quality: 87 },
    { name: '2xl', width: 1920, quality: 90 },
  ];

  const outputs: { [key: string]: string } = {};

  for (const size of sizes) {
    // WebP version
    const webpPath = path.join(outputDir, `${filename}-${size.name}.webp`);
    await sharp(inputPath)
      .resize(size.width, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: size.quality, effort: 6 })
      .toFile(webpPath);
    outputs[`${size.name}_webp`] = webpPath;

    // JPEG fallback
    const jpegPath = path.join(outputDir, `${filename}-${size.name}.jpg`);
    await sharp(inputPath)
      .resize(size.width, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: size.quality, progressive: true, mozjpeg: true })
      .toFile(jpegPath);
    outputs[`${size.name}_jpeg`] = jpegPath;
  }

  console.log('Optimized responsive images generated');
  return outputs;
}

/**
 * Example 13: Compress with Imagemin
 * Use imagemin for advanced optimization
 */
export async function compressWithImagemin(
  inputPath: string,
  outputDir: string
): Promise<void> {
  const ext = path.extname(inputPath).toLowerCase();

  const plugins = [];

  if (ext === '.jpg' || ext === '.jpeg') {
    plugins.push(imageminMozjpeg({ quality: 85, progressive: true }));
  } else if (ext === '.png') {
    plugins.push(
      imageminPngquant({
        quality: [0.7, 0.9],
        speed: 1,
      })
    );
  }

  await imagemin([inputPath], {
    destination: outputDir,
    plugins,
  });

  console.log('Image compressed with imagemin');
}

/**
 * Example 14: SVG Optimization
 * Optimize SVG files
 */
export async function optimizeSVG(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await imagemin([inputPath], {
    destination: path.dirname(outputPath),
    plugins: [
      imageminSvgo({
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'cleanupIDs', active: true },
          { name: 'removeEmptyAttrs', active: true },
        ],
      }),
    ],
  });

  console.log('SVG optimized');
}

/**
 * Example 15: Calculate Optimization Report
 * Generate detailed optimization report
 */
export async function generateOptimizationReport(
  inputDir: string,
  outputDir: string
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  const report = {
    totalFiles: imageFiles.length,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
    files: [] as any[],
  };

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);

    const stats = await optimizeImage(inputPath, outputPath);
    report.totalOriginalSize += stats.originalSize;
    report.totalOptimizedSize += stats.optimizedSize;

    report.files.push({
      filename: file,
      originalSize: stats.originalSize,
      optimizedSize: stats.optimizedSize,
      savedBytes: stats.savedBytes,
      savedPercentage: stats.savedPercentage.toFixed(2),
    });
  }

  report.files.sort((a, b) => b.savedBytes - a.savedBytes);

  const reportPath = path.join(outputDir, 'optimization-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('Optimization report generated:', reportPath);
}

// Usage Examples
async function main() {
  const inputImage = './assets/sample.jpg';
  const inputDir = './assets/images';
  const outputDir = './output';

  // Example 1: Basic JPEG optimization
  const jpegStats = await optimizeJPEG(inputImage, `${outputDir}/optimized.jpg`, 85);
  console.log(jpegStats);

  // Example 2: WebP conversion
  await convertToWebP(inputImage, `${outputDir}/image.webp`, 85);

  // Example 3: AVIF conversion (best compression)
  await convertToAVIF(inputImage, `${outputDir}/image.avif`, 80);

  // Example 4: Multi-format output
  await generateMultiFormat(inputImage, outputDir, 85);

  // Example 5: Smart compression to target size
  await smartCompress(inputImage, `${outputDir}/target-size.jpg`, 100); // 100KB target

  // Example 6: Generate placeholder
  await generatePlaceholder(inputImage, `${outputDir}/placeholder.jpg`, 20);

  // Example 7: Optimized responsive images
  await generateOptimizedResponsive(inputImage, outputDir);

  // Example 8: Batch optimization
  await batchOptimize(inputDir, outputDir, {
    quality: 85,
    format: 'webp',
  });

  // Example 9: Generate optimization report
  await generateOptimizationReport(inputDir, outputDir);

  console.log('All optimization examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  optimizeJPEG,
  optimizePNG,
  convertToWebP,
  convertToAVIF,
  stripMetadata,
  createProgressiveJPEG,
  generateMultiFormat,
  smartCompress,
  batchOptimize,
  optimizeImage,
  generatePlaceholder,
  generateOptimizedResponsive,
  compressWithImagemin,
  optimizeSVG,
  generateOptimizationReport,
};
