/**
 * SecretPixel Image Processing Service
 * 
 * Handles client-side HTML5 canvas raster manipulation, pixel extraction,
 * lossless PNG generation, and spatial bit-plane decomposition.
 */

export interface LoadedImageRaster {
  width: number;
  height: number;
  imageData: ImageData;
  canvas: HTMLCanvasElement;
}

/**
 * Loads an image from a data URL or Object URL into an HTMLImageElement asynchronously.
 */
export async function loadImageElement(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image data into browser memory.'));
    img.src = sourceUrl;
  });
}

/**
 * Renders an image into a fresh offscreen canvas and returns its ImageData raster.
 */
export async function getImageRaster(sourceUrl: string): Promise<LoadedImageRaster> {
  const img = await loadImageElement(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to obtain 2D Canvas rendering context.');
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return {
    width: canvas.width,
    height: canvas.height,
    imageData,
    canvas
  };
}

/**
 * Converts an ImageData raster to a genuine lossless PNG Data URL.
 */
export function imageDataToPngDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context for PNG export.');
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Extracts a specific bit plane (0 to 7) from an ImageData raster across selected channels.
 * Used by the Bit Inspector to visualize spatial entropy and LSB noise.
 */
export function extractBitPlaneRaster(
  imageData: ImageData,
  bitPlane: number,
  channel: 'all' | 'red' | 'green' | 'blue' = 'all'
): ImageData {
  const w = imageData.width;
  const h = imageData.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const output = ctx.createImageData(w, h);

  const src = imageData.data;
  const dst = output.data;
  const safeBit = Math.max(0, Math.min(7, Math.floor(bitPlane)));

  for (let i = 0; i < src.length; i += 4) {
    let bit = 0;
    if (channel === 'red') {
      bit = (src[i] >> safeBit) & 1;
    } else if (channel === 'green') {
      bit = (src[i + 1] >> safeBit) & 1;
    } else if (channel === 'blue') {
      bit = (src[i + 2] >> safeBit) & 1;
    } else {
      // Combined RGB: majority vote or luminance weighting
      const rBit = (src[i] >> safeBit) & 1;
      const gBit = (src[i + 1] >> safeBit) & 1;
      const bBit = (src[i + 2] >> safeBit) & 1;
      bit = (rBit + gBit + bBit) >= 2 ? 1 : 0;
    }

    const val = bit ? 255 : 0;
    dst[i] = val;
    dst[i + 1] = val;
    dst[i + 2] = val;
    dst[i + 3] = 255; // Full alpha for visualization
  }

  return output;
}
