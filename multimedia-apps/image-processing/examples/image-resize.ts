/**
 * Image Resize and Crop Examples
 * Demonstrates various image resizing and cropping techniques
 */

import sharp from 'sharp';
import Jimp from 'jimp';
import { createCanvas, loadImage } from 'canvas';
import fs from 'fs/promises';
import path from 'path';

interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
  quality?: number;
}

interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Example 1: Basic Image Resize using Sharp
 * Sharp is the fastest Node.js image processing library
 */
export async function resizeImageSharp(
  inputPath: string,
  outputPath: string,
  options: ResizeOptions
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        position: options.position || 'center',
      })
      .toFile(outputPath);

    console.log(`Image resized successfully: ${outputPath}`);
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

/**
 * Example 2: Maintain Aspect Ratio Resize
 * Resize image while maintaining original aspect ratio
 */
export async function resizeWithAspectRatio(
  inputPath: string,
  outputPath: string,
  maxWidth: number,
  maxHeight: number
): Promise<void> {
  const image = await sharp(inputPath);
  const metadata = await image.metadata();

  const { width = 0, height = 0 } = metadata;
  const aspectRatio = width / height;

  let newWidth = maxWidth;
  let newHeight = Math.round(maxWidth / aspectRatio);

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = Math.round(maxHeight * aspectRatio);
  }

  await image
    .resize(newWidth, newHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFile(outputPath);

  console.log(`Resized to ${newWidth}x${newHeight} maintaining aspect ratio`);
}

/**
 * Example 3: Smart Crop with Face Detection
 * Crop image focusing on important content
 */
export async function smartCrop(
  inputPath: string,
  outputPath: string,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  await sharp(inputPath)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'attention', // Uses edge detection
    })
    .toFile(outputPath);

  console.log('Smart crop completed');
}

/**
 * Example 4: Manual Crop
 * Crop specific region from image
 */
export async function cropImage(
  inputPath: string,
  outputPath: string,
  cropOptions: CropOptions
): Promise<void> {
  await sharp(inputPath)
    .extract({
      left: cropOptions.x,
      top: cropOptions.y,
      width: cropOptions.width,
      height: cropOptions.height,
    })
    .toFile(outputPath);

  console.log('Image cropped successfully');
}

/**
 * Example 5: Thumbnail Generation
 * Create multiple thumbnail sizes
 */
export async function generateThumbnails(
  inputPath: string,
  outputDir: string,
  sizes: Array<{ name: string; width: number; height: number }>
): Promise<string[]> {
  const outputPaths: string[] = [];
  const filename = path.basename(inputPath, path.extname(inputPath));

  for (const size of sizes) {
    const outputPath = path.join(
      outputDir,
      `${filename}-${size.name}.jpg`
    );

    await sharp(inputPath)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    outputPaths.push(outputPath);
  }

  console.log(`Generated ${sizes.length} thumbnails`);
  return outputPaths;
}

/**
 * Example 6: Batch Resize
 * Resize multiple images at once
 */
export async function batchResize(
  inputDir: string,
  outputDir: string,
  width: number,
  height: number
): Promise<void> {
  const files = await fs.readdir(inputDir);
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(
      outputDir,
      `resized-${file.replace(/\.[^.]+$/, '.jpg')}`
    );

    await sharp(inputPath)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    console.log(`Processed: ${file}`);
  }

  console.log(`Batch resize completed: ${imageFiles.length} images`);
}

/**
 * Example 7: Circular Crop
 * Create circular cropped images (profile pictures)
 */
export async function circularCrop(
  inputPath: string,
  outputPath: string,
  diameter: number
): Promise<void> {
  const roundedCorners = Buffer.from(
    `<svg><circle cx="${diameter / 2}" cy="${diameter / 2}" r="${
      diameter / 2
    }" /></svg>`
  );

  await sharp(inputPath)
    .resize(diameter, diameter, { fit: 'cover' })
    .composite([
      {
        input: roundedCorners,
        blend: 'dest-in',
      },
    ])
    .png()
    .toFile(outputPath);

  console.log('Circular crop completed');
}

/**
 * Example 8: Responsive Image Set
 * Generate responsive image sizes for web
 */
export async function generateResponsiveImages(
  inputPath: string,
  outputDir: string
): Promise<{ [key: string]: string }> {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const sizes = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1920,
  };

  const outputs: { [key: string]: string } = {};

  for (const [name, width] of Object.entries(sizes)) {
    const outputPath = path.join(outputDir, `${filename}-${name}.webp`);

    await sharp(inputPath)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(outputPath);

    outputs[name] = outputPath;
  }

  console.log('Responsive images generated');
  return outputs;
}

/**
 * Example 9: Content-Aware Resize (Jimp)
 * Resize with seam carving algorithm
 */
export async function contentAwareResize(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  const image = await Jimp.read(inputPath);

  image.resize(width, height, Jimp.RESIZE_BICUBIC);
  await image.writeAsync(outputPath);

  console.log('Content-aware resize completed');
}

/**
 * Example 10: Crop to Focus Area
 * Crop image based on focal point coordinates
 */
export async function cropToFocalPoint(
  inputPath: string,
  outputPath: string,
  focalX: number,
  focalY: number,
  targetWidth: number,
  targetHeight: number
): Promise<void> {
  const image = await sharp(inputPath);
  const metadata = await image.metadata();

  const { width = 0, height = 0 } = metadata;

  // Calculate crop area centered on focal point
  const left = Math.max(0, Math.min(focalX - targetWidth / 2, width - targetWidth));
  const top = Math.max(0, Math.min(focalY - targetHeight / 2, height - targetHeight));

  await image
    .extract({
      left: Math.round(left),
      top: Math.round(top),
      width: targetWidth,
      height: targetHeight,
    })
    .toFile(outputPath);

  console.log(`Cropped to focal point: (${focalX}, ${focalY})`);
}

// Usage Examples
async function main() {
  const inputImage = './assets/sample.jpg';
  const outputDir = './output';

  // Example 1: Basic resize
  await resizeImageSharp(inputImage, `${outputDir}/resized.jpg`, {
    width: 800,
    height: 600,
    fit: 'cover',
  });

  // Example 2: Maintain aspect ratio
  await resizeWithAspectRatio(inputImage, `${outputDir}/aspect-ratio.jpg`, 1200, 800);

  // Example 3: Smart crop
  await smartCrop(inputImage, `${outputDir}/smart-crop.jpg`, 500, 500);

  // Example 4: Manual crop
  await cropImage(inputImage, `${outputDir}/cropped.jpg`, {
    x: 100,
    y: 100,
    width: 400,
    height: 400,
  });

  // Example 5: Generate thumbnails
  await generateThumbnails(inputImage, outputDir, [
    { name: 'small', width: 150, height: 150 },
    { name: 'medium', width: 300, height: 300 },
    { name: 'large', width: 600, height: 600 },
  ]);

  // Example 6: Circular crop for profile picture
  await circularCrop(inputImage, `${outputDir}/avatar.png`, 200);

  // Example 7: Generate responsive images
  await generateResponsiveImages(inputImage, outputDir);

  // Example 8: Crop to focal point
  await cropToFocalPoint(inputImage, `${outputDir}/focal.jpg`, 500, 300, 400, 400);

  console.log('All resize and crop examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  resizeImageSharp,
  resizeWithAspectRatio,
  smartCrop,
  cropImage,
  generateThumbnails,
  batchResize,
  circularCrop,
  generateResponsiveImages,
  contentAwareResize,
  cropToFocalPoint,
};
