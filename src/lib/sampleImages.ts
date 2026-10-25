/**
 * Generates preset procedural cover images using HTML5 Canvas.
 * Allows instant 1-click testing for academic demonstrations and user evaluation.
 */

export interface SampleImageOption {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  getDataUrl: () => string;
}

export function generateSampleMatrix(width = 640, height = 480): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deep gradient background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0a0f1d');
  bg.addColorStop(0.5, '#12182c');
  bg.addColorStop(1, '#070a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Digital grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Geometric glowing polygons
  const polyGrad = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    20,
    width * 0.5,
    height * 0.45,
    220
  );
  polyGrad.addColorStop(0, 'rgba(139, 92, 246, 0.45)');
  polyGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.25)');
  polyGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = polyGrad;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.45, 220, 0, Math.PI * 2);
  ctx.fill();

  // Fine nodes and connections
  const points = [
    { x: width * 0.3, y: height * 0.3 },
    { x: width * 0.7, y: height * 0.35 },
    { x: width * 0.5, y: height * 0.65 },
    { x: width * 0.25, y: height * 0.7 },
    { x: width * 0.75, y: height * 0.68 }
  ];

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[j].x, points[j].y);
      ctx.stroke();
    }
  }

  for (const pt of points) {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}

export function generateSampleEnclave(width = 800, height = 600): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Gradient
  const grad = ctx.createLinearGradient(0, height, width, 0);
  grad.addColorStop(0, '#060913');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Concentric rings
  ctx.lineWidth = 1;
  for (let r = 50; r <= 300; r += 25) {
    ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 - r * 0.0003})`;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Crosshairs
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.moveTo(width / 2 - 40, height / 2);
  ctx.lineTo(width / 2 + 40, height / 2);
  ctx.moveTo(width / 2, height / 2 - 40);
  ctx.lineTo(width / 2, height / 2 + 40);
  ctx.stroke();

  // Shield motif silhouette
  ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
  ctx.lineWidth = 2;
  const cx = width / 2;
  const cy = height / 2 - 20;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 60);
  ctx.lineTo(cx + 60, cy - 35);
  ctx.lineTo(cx + 60, cy + 30);
  ctx.bezierCurveTo(cx + 60, cy + 80, cx, cy + 110, cx, cy + 120);
  ctx.bezierCurveTo(cx, cy + 110, cx - 60, cy + 80, cx - 60, cy + 30);
  ctx.lineTo(cx - 60, cy - 35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export function generateSampleNebula(width = 600, height = 450): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#090d1a';
  ctx.fillRect(0, 0, width, height);

  // Random stars
  for (let i = 0; i < 120; i++) {
    const sx = Math.sin(i * 997) * width * 0.5 + width * 0.5;
    const sy = Math.cos(i * 353) * height * 0.5 + height * 0.5;
    const sz = (Math.sin(i * 47) + 1) * 1.2 + 0.5;
    ctx.fillStyle = `rgba(248, 250, 252, ${0.3 + (i % 5) * 0.15})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft luminous nebula cloud
  const rad = ctx.createRadialGradient(
    width * 0.6,
    height * 0.4,
    10,
    width * 0.55,
    height * 0.5,
    260
  );
  rad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
  rad.addColorStop(0.4, 'rgba(139, 92, 246, 0.3)');
  rad.addColorStop(0.8, 'rgba(99, 102, 241, 0.1)');
  rad.addColorStop(1, 'rgba(9, 13, 26, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

export const SAMPLE_IMAGES: SampleImageOption[] = [
  {
    id: 'cyber-matrix',
    name: 'Cyber Grid Matrix',
    description: 'High-density 640×480 raster image with structured pixel gradients',
    width: 640,
    height: 480,
    getDataUrl: () => generateSampleMatrix(640, 480)
  },
  {
    id: 'secure-enclave',
    name: 'Cryptographic Enclave',
    description: '800×600 precision canvas with geometric shield coordinates',
    width: 800,
    height: 600,
    getDataUrl: () => generateSampleEnclave(800, 600)
  },
  {
    id: 'nebula-privacy',
    name: 'Deep Nebula',
    description: '600×450 high dynamic range starfield and color channels',
    width: 600,
    height: 450,
    getDataUrl: () => generateSampleNebula(600, 450)
  }
];
