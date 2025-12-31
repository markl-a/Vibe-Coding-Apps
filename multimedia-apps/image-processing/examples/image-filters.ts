/**
 * Image Filters and Effects Examples
 * Demonstrates various image filter and effect techniques
 */

import sharp from 'sharp';
import Jimp from 'jimp';
import { createCanvas, loadImage, Canvas, Image } from 'canvas';
import fs from 'fs/promises';

interface FilterOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  sharpen?: boolean;
}

/**
 * Example 1: Basic Filters with Sharp
 * Apply brightness, contrast, and saturation adjustments
 */
export async function applyBasicFilters(
  inputPath: string,
  outputPath: string,
  options: FilterOptions
): Promise<void> {
  let pipeline = sharp(inputPath);

  // Apply modulate for brightness, saturation, and hue
  if (options.brightness || options.saturation) {
    pipeline = pipeline.modulate({
      brightness: options.brightness,
      saturation: options.saturation,
    });
  }

  // Apply blur
  if (options.blur) {
    pipeline = pipeline.blur(options.blur);
  }

  // Apply sharpen
  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }

  await pipeline.toFile(outputPath);
  console.log('Basic filters applied');
}

/**
 * Example 2: Grayscale Conversion
 * Convert image to black and white
 */
export async function convertToGrayscale(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .grayscale()
    .toFile(outputPath);

  console.log('Converted to grayscale');
}

/**
 * Example 3: Sepia Tone Effect
 * Apply vintage sepia tone filter
 */
export async function applySepiaFilter(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const image = await Jimp.read(inputPath);
  image.sepia();
  await image.writeAsync(outputPath);

  console.log('Sepia filter applied');
}

/**
 * Example 4: Vintage Filter
 * Create retro/vintage photo effect
 */
export async function applyVintageFilter(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .modulate({
      brightness: 1.1,
      saturation: 0.8,
    })
    .tint({ r: 255, g: 250, b: 230 })
    .blur(0.3)
    .toFile(outputPath);

  console.log('Vintage filter applied');
}

/**
 * Example 5: HDR Effect
 * High Dynamic Range effect
 */
export async function applyHDREffect(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .modulate({
      brightness: 1.2,
      saturation: 1.5,
    })
    .sharpen({ sigma: 2 })
    .linear(1.3, -(0.3 * 255))
    .toFile(outputPath);

  console.log('HDR effect applied');
}

/**
 * Example 6: Gaussian Blur
 * Apply gaussian blur with custom strength
 */
export async function applyGaussianBlur(
  inputPath: string,
  outputPath: string,
  sigma: number = 3
): Promise<void> {
  await sharp(inputPath)
    .blur(sigma)
    .toFile(outputPath);

  console.log(`Gaussian blur applied (sigma: ${sigma})`);
}

/**
 * Example 7: Edge Detection
 * Detect edges in image (Sobel filter)
 */
export async function detectEdges(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const image = await Jimp.read(inputPath);

  // Apply edge detection convolution matrix
  const edgeMatrix = [
    [-1, -1, -1],
    [-1, 8, -1],
    [-1, -1, -1],
  ];

  image.convolute(edgeMatrix);
  await image.writeAsync(outputPath);

  console.log('Edge detection applied');
}

/**
 * Example 8: Emboss Effect
 * Create embossed 3D effect
 */
export async function applyEmbossEffect(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const image = await Jimp.read(inputPath);

  // Emboss convolution matrix
  const embossMatrix = [
    [-2, -1, 0],
    [-1, 1, 1],
    [0, 1, 2],
  ];

  image.convolute(embossMatrix);
  await image.writeAsync(outputPath);

  console.log('Emboss effect applied');
}

/**
 * Example 9: Posterize Effect
 * Reduce number of colors for poster effect
 */
export async function applyPosterize(
  inputPath: string,
  outputPath: string,
  levels: number = 4
): Promise<void> {
  const image = await Jimp.read(inputPath);
  image.posterize(levels);
  await image.writeAsync(outputPath);

  console.log(`Posterize effect applied (${levels} levels)`);
}

/**
 * Example 10: Invert Colors
 * Invert all colors in image
 */
export async function invertColors(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await sharp(inputPath)
    .negate()
    .toFile(outputPath);

  console.log('Colors inverted');
}

/**
 * Example 11: Pixelate Effect
 * Create pixelated/mosaic effect
 */
export async function applyPixelateEffect(
  inputPath: string,
  outputPath: string,
  pixelSize: number = 10
): Promise<void> {
  const image = await Jimp.read(inputPath);
  image.pixelate(pixelSize);
  await image.writeAsync(outputPath);

  console.log(`Pixelate effect applied (size: ${pixelSize})`);
}

/**
 * Example 12: Vignette Effect
 * Darken edges for focus on center
 */
export async function applyVignetteEffect(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width = 0, height = 0 } = metadata;

  // Create radial gradient for vignette
  const vignetteOverlay = Buffer.from(
    `<svg width="${width}" height="${height}">
      <defs>
        <radialGradient id="vignette">
          <stop offset="50%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.8"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#vignette)"/>
    </svg>`
  );

  await image
    .composite([
      {
        input: vignetteOverlay,
        blend: 'multiply',
      },
    ])
    .toFile(outputPath);

  console.log('Vignette effect applied');
}

/**
 * Example 13: Color Tint
 * Apply color overlay/tint to image
 */
export async function applyColorTint(
  inputPath: string,
  outputPath: string,
  color: { r: number; g: number; b: number },
  opacity: number = 0.3
): Promise<void> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { width = 0, height = 0 } = metadata;

  const tintOverlay = Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect width="${width}" height="${height}"
            fill="rgb(${color.r},${color.g},${color.b})"
            opacity="${opacity}"/>
    </svg>`
  );

  await image
    .composite([
      {
        input: tintOverlay,
        blend: 'multiply',
      },
    ])
    .toFile(outputPath);

  console.log('Color tint applied');
}

/**
 * Example 14: Duotone Effect
 * Create two-color tone effect
 */
export async function applyDuotoneEffect(
  inputPath: string,
  outputPath: string,
  darkColor: string = '#1a1a2e',
  lightColor: string = '#16c5f5'
): Promise<void> {
  // First convert to grayscale
  const grayscaleBuffer = await sharp(inputPath)
    .grayscale()
    .toBuffer();

  // Then apply duotone mapping
  await sharp(grayscaleBuffer)
    .tint({ r: 22, g: 197, b: 245 }) // Light blue tint
    .toFile(outputPath);

  console.log('Duotone effect applied');
}

/**
 * Example 15: Instagram-style Filters
 * Recreate popular Instagram filters
 */
export const instagramFilters = {
  // Nashville: warm, pink tint
  nashville: async (inputPath: string, outputPath: string) => {
    await sharp(inputPath)
      .modulate({
        brightness: 1.2,
        saturation: 1.2,
      })
      .tint({ r: 255, g: 230, b: 220 })
      .toFile(outputPath);
    console.log('Nashville filter applied');
  },

  // Clarendon: high contrast, shadows
  clarendon: async (inputPath: string, outputPath: string) => {
    await sharp(inputPath)
      .modulate({
        brightness: 1.1,
        saturation: 1.3,
      })
      .sharpen()
      .linear(1.2, -(0.1 * 255))
      .toFile(outputPath);
    console.log('Clarendon filter applied');
  },

  // Gingham: cooler tones, soft
  gingham: async (inputPath: string, outputPath: string) => {
    await sharp(inputPath)
      .modulate({
        brightness: 1.05,
        saturation: 0.9,
      })
      .tint({ r: 230, g: 240, b: 255 })
      .toFile(outputPath);
    console.log('Gingham filter applied');
  },

  // Moon: black and white with high contrast
  moon: async (inputPath: string, outputPath: string) => {
    await sharp(inputPath)
      .grayscale()
      .linear(1.4, -(0.2 * 255))
      .toFile(outputPath);
    console.log('Moon filter applied');
  },

  // Lark: bright, desaturated
  lark: async (inputPath: string, outputPath: string) => {
    await sharp(inputPath)
      .modulate({
        brightness: 1.15,
        saturation: 0.8,
      })
      .linear(1.1, 10)
      .toFile(outputPath);
    console.log('Lark filter applied');
  },
};

/**
 * Example 16: Custom Convolution Filter
 * Apply custom matrix convolution
 */
export async function applyCustomConvolution(
  inputPath: string,
  outputPath: string,
  kernel: number[][]
): Promise<void> {
  const image = await Jimp.read(inputPath);
  image.convolute(kernel);
  await image.writeAsync(outputPath);

  console.log('Custom convolution applied');
}

/**
 * Example 17: Adjust Hue
 * Shift color hue
 */
export async function adjustHue(
  inputPath: string,
  outputPath: string,
  hueRotation: number
): Promise<void> {
  const image = await Jimp.read(inputPath);
  image.color([{ apply: 'hue', params: [hueRotation] }]);
  await image.writeAsync(outputPath);

  console.log(`Hue adjusted by ${hueRotation} degrees`);
}

// Usage Examples
async function main() {
  const inputImage = './assets/sample.jpg';
  const outputDir = './output';

  // Example 1: Basic filters
  await applyBasicFilters(inputImage, `${outputDir}/basic-filter.jpg`, {
    brightness: 1.2,
    contrast: 1.1,
    saturation: 1.3,
    sharpen: true,
  });

  // Example 2: Grayscale
  await convertToGrayscale(inputImage, `${outputDir}/grayscale.jpg`);

  // Example 3: Sepia
  await applySepiaFilter(inputImage, `${outputDir}/sepia.jpg`);

  // Example 4: Vintage
  await applyVintageFilter(inputImage, `${outputDir}/vintage.jpg`);

  // Example 5: HDR
  await applyHDREffect(inputImage, `${outputDir}/hdr.jpg`);

  // Example 6: Blur
  await applyGaussianBlur(inputImage, `${outputDir}/blur.jpg`, 5);

  // Example 7: Edge detection
  await detectEdges(inputImage, `${outputDir}/edges.jpg`);

  // Example 8: Emboss
  await applyEmbossEffect(inputImage, `${outputDir}/emboss.jpg`);

  // Example 9: Posterize
  await applyPosterize(inputImage, `${outputDir}/posterize.jpg`, 5);

  // Example 10: Invert
  await invertColors(inputImage, `${outputDir}/invert.jpg`);

  // Example 11: Pixelate
  await applyPixelateEffect(inputImage, `${outputDir}/pixelate.jpg`, 15);

  // Example 12: Vignette
  await applyVignetteEffect(inputImage, `${outputDir}/vignette.jpg`);

  // Example 13: Color tint
  await applyColorTint(
    inputImage,
    `${outputDir}/tint.jpg`,
    { r: 100, g: 150, b: 255 },
    0.4
  );

  // Example 14: Instagram filters
  await instagramFilters.nashville(inputImage, `${outputDir}/nashville.jpg`);
  await instagramFilters.clarendon(inputImage, `${outputDir}/clarendon.jpg`);
  await instagramFilters.moon(inputImage, `${outputDir}/moon.jpg`);

  // Example 15: Adjust hue
  await adjustHue(inputImage, `${outputDir}/hue-shift.jpg`, 90);

  console.log('All filter examples completed!');
}

// Uncomment to run
// main().catch(console.error);

export default {
  applyBasicFilters,
  convertToGrayscale,
  applySepiaFilter,
  applyVintageFilter,
  applyHDREffect,
  applyGaussianBlur,
  detectEdges,
  applyEmbossEffect,
  applyPosterize,
  invertColors,
  applyPixelateEffect,
  applyVignetteEffect,
  applyColorTint,
  applyDuotoneEffect,
  instagramFilters,
  applyCustomConvolution,
  adjustHue,
};
