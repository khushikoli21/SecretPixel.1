import React, { useState, useRef, useEffect } from 'react';
import { Sliders, ShieldCheck, Layers, Image as ImageIcon, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { useSecurityContext } from '../../context/SecurityContext';
import { SAMPLE_IMAGES } from '../../lib/sampleImages';
import { getImageRaster, extractBitPlaneRaster } from '../../services/imageService';

export const BitInspectorView: React.FC = () => {
  const [activeBitPlane, setActiveBitPlane] = useState<number>(0);
  const [activeChannel, setActiveChannel] = useState<'all' | 'red' | 'green' | 'blue'>('all');
  const [selectedImageId, setSelectedImageId] = useState<string>('cyber-matrix');
  const [customImageDataUrl, setCustomImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('Cyber Grid Matrix');
  const [tampered, setTampered] = useState(false);
  const [bitDensity, setBitDensity] = useState<number>(50.0);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 640, height: 480 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logActivity, showToast } = useSecurityContext();

  // Load and render bit plane from active image
  useEffect(() => {
    let active = true;

    async function renderBitPlane() {
      try {
        const sourceUrl = customImageDataUrl || (SAMPLE_IMAGES.find((s) => s.id === selectedImageId)?.getDataUrl() ?? SAMPLE_IMAGES[0].getDataUrl());
        const { imageData, width, height } = await getImageRaster(sourceUrl);

        if (!active) return;
        setResolution({ width, height });

        // Optional simulated tamper
        if (tampered && activeBitPlane === 0) {
          const startX = Math.floor(width * 0.4);
          const endX = Math.floor(width * 0.6);
          const startY = Math.floor(height * 0.4);
          const endY = Math.floor(height * 0.6);
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * width + x) * 4;
              imageData.data[idx] ^= 1;     // Flip R LSB
              imageData.data[idx + 1] ^= 1; // Flip G LSB
              imageData.data[idx + 2] ^= 1; // Flip B LSB
            }
          }
        }

        const bitPlaneData = extractBitPlaneRaster(imageData, activeBitPlane, activeChannel);

        // Calculate bit 1 density (entropy proxy)
        let onesCount = 0;
        const totalPixels = width * height;
        for (let i = 0; i < bitPlaneData.data.length; i += 4) {
          if (bitPlaneData.data[i] > 128) onesCount++;
        }
        const density = totalPixels > 0 ? (onesCount / totalPixels) * 100 : 50;
        setBitDensity(Number(density.toFixed(2)));

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.putImageData(bitPlaneData, 0, 0);
          }
        }
      } catch (err) {
        console.error('Failed to decompose bit plane raster', err);
      }
    }

    renderBitPlane();
    return () => {
      active = false;
    };
  }, [activeBitPlane, activeChannel, selectedImageId, customImageDataUrl, tampered]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid raster image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCustomImageDataUrl(dataUrl);
      setImageName(file.name);
      logActivity({
        type: 'image_load',
        title: 'Custom Image Loaded to Bit Inspector',
        detail: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        status: 'info'
      });
      showToast(`Loaded ${file.name} for spatial bit inspection`, 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
              <Sliders className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Bit Inspector &amp; Spatial Decomposer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Deconstruct 24-bit RGB raster pixels into isolated bit planes to observe spatial entropy differences.
          </p>
        </div>
        <div className="text-xs font-mono bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200 text-violet-700 shrink-0 font-semibold">
          Plane {activeBitPlane}: {activeBitPlane === 0 ? 'LSB Carrier (Payload)' : activeBitPlane === 7 ? 'MSB Structure' : 'Intermediate'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Canvas Decomposer */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Spatial Bit Plane Decomposition</h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {resolution.width}×{resolution.height}px
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active Source: <strong className="text-slate-800">{imageName}</strong> · Channel: <strong className="text-violet-700 capitalize">{activeChannel}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-violet-600" />
                <span>Upload Image</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  const nextTampered = !tampered;
                  setTampered(nextTampered);
                  if (nextTampered) {
                    logActivity({
                      type: 'error',
                      title: 'Bit Tamper Injected',
                      detail: 'Simulated 1-bit alteration injected in bit plane 0 spatial raster',
                      status: 'warning'
                    });
                    showToast('Simulated bit tampering in LSB plane', 'info');
                  } else {
                    showToast('Bit tampering reverted', 'info');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  tampered
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tampered ? 'Revert Bit Tamper' : 'Simulate Bit Tamper'}
              </button>
            </div>
          </div>

          {/* Canvas Rendering Area */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#080D19] min-h-[320px] flex items-center justify-center p-2">
            <canvas ref={canvasRef} className="max-w-full max-h-[460px] object-contain rounded-lg shadow-md" />
            
            {/* Overlay watermark stats */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-3">
              <span>Plane: <strong className="text-white">B{activeBitPlane}</strong></span>
              <span>·</span>
              <span>1-Bit Density: <strong className={bitDensity > 45 && bitDensity < 55 ? 'text-emerald-400' : 'text-sky-400'}>{bitDensity}%</strong></span>
              <span>·</span>
              <span>Entropy: <strong className="text-violet-300">{activeBitPlane === 0 ? 'High (Noise)' : 'Low (Structural)'}</strong></span>
            </div>
          </div>

          {/* Controls: Preset Selector & Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Preset Image Carrier:
              </label>
              <select
                value={customImageDataUrl ? 'custom' : selectedImageId}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  setCustomImageDataUrl(null);
                  setSelectedImageId(e.target.value);
                  const preset = SAMPLE_IMAGES.find((s) => s.id === e.target.value);
                  if (preset) setImageName(preset.name);
                }}
                className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-violet-500"
              >
                {SAMPLE_IMAGES.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.name} ({img.width}×{img.height})
                  </option>
                ))}
                {customImageDataUrl && <option value="custom">Custom Uploaded Image</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Channel Filter:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['all', 'red', 'green', 'blue'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setActiveChannel(ch)}
                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer capitalize ${
                      activeChannel === ch
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Plane Selector Tabs */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2">Select Active Bit Plane (Bit 0 LSB &rarr; Bit 7 MSB):</div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setActiveBitPlane(b);
                    logActivity({
                      type: 'verify',
                      title: `Bit Plane ${b} Inspected`,
                      detail: b === 0 ? 'LSB carrier plane (random white noise profile)' : b === 7 ? 'MSB structural contours' : `Intermediate bit plane ${b}`,
                      status: 'info'
                    });
                  }}
                  className={`py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                    activeBitPlane === b
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  B{b} {b === 0 ? '(LSB)' : b === 7 ? '(MSB)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Technical Invariants */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-violet-600" />
              <span>Steganographic Invariants</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <div className="font-bold text-slate-900">Why LSB Works:</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Modifying bit 0 alters an 8-bit channel by only &plusmn;1 out of 255 (0.39%). The human eye cannot detect this minor variance across millions of pixels.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
                <div className="font-bold text-slate-900">Why AES-GCM is Required:</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Steganography conceals data, but cannot prevent alteration. AES-GCM provides an authenticated 128-bit tag, instantly rejecting tampered images.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Steganalysis Resistance
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chi-square statistical tests analyze adjacent pixel pairs. Because SecretPixel embeds high-entropy AES ciphertext uniformly across channels, standard frequency attacks fail to identify the message presence.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-violet-700">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              <span>Lossless 24-bit Carrier Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
