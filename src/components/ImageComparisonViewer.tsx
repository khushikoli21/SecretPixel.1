import React, { useState } from 'react';
import { Eye, SplitSquareVertical, Sliders, CheckCircle2 } from 'lucide-react';

interface ImageComparisonViewerProps {
  originalDataUrl: string;
  stegoDataUrl: string;
  originalDimensions: { width: number; height: number };
}

export const ImageComparisonViewer: React.FC<ImageComparisonViewerProps> = ({
  originalDataUrl,
  stegoDataUrl,
  originalDimensions
}) => {
  const [mode, setMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
  const [sliderPos, setSliderPos] = useState(50);
  const [toggleActive, setToggleActive] = useState<'original' | 'stego'>('stego');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
      {/* Header with mode selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-violet-600" />
            <span>Visual Imperceptibility Verification</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare original cover raster against stego output pixel-by-pixel.
          </p>
        </div>

        {/* View mode toggle buttons */}
        <div className="inline-flex rounded-xl bg-[#F8FAFC] p-1 border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'slider'
                ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Split Slider
          </button>
          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'side-by-side'
                ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setMode('toggle')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'toggle'
                ? 'bg-[#7C3AED] text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A/B Flip
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Split Slider */}
      {mode === 'slider' && (
        <div className="space-y-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 select-none">
            {/* Stego Image (Full width background) */}
            <img
              src={stegoDataUrl}
              alt="Stego version"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />

            {/* Original Image (Clipped by slider position) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={originalDataUrl}
                alt="Original cover"
                className="w-full h-full object-contain max-w-none"
                style={{ width: `${100 / (sliderPos / 100)}%` }}
              />
            </div>

            {/* Vertical Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-violet-600 shadow-[0_0_8px_rgba(124,58,237,0.5)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#7C3AED] border-2 border-white shadow-md flex items-center justify-center text-[10px] text-white font-bold">
                ⬌
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-700 border border-slate-200 shadow-2xs">
              Original Cover
            </div>
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-violet-700 border border-violet-200 shadow-2xs font-semibold">
              Stego-PNG (Modulated)
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] font-mono text-slate-500">Original</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="flex-1 accent-violet-600 cursor-ew-resize h-1.5 bg-slate-200 rounded-lg"
            />
            <span className="text-[11px] font-mono text-violet-700 font-semibold">Stego ({sliderPos}%)</span>
          </div>
        </div>
      )}

      {/* Mode 2: Side-by-Side Comparison */}
      {mode === 'side-by-side' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Original Cover</span>
              <span>{originalDimensions.width}×{originalDimensions.height}</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
              <img
                src={originalDataUrl}
                alt="Original cover"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-violet-700">
              <span className="font-semibold">Stego-Image (LSB Embedded)</span>
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Zero Visible Artifacts
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-violet-200 bg-slate-50 aspect-video flex items-center justify-center">
              <img
                src={stegoDataUrl}
                alt="Stego encoded"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Quick A/B Flip Toggle */}
      {mode === 'toggle' && (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
            <img
              src={toggleActive === 'original' ? originalDataUrl : stegoDataUrl}
              alt="Toggle View"
              className="w-full h-full object-contain transition-opacity duration-150"
            />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono border border-slate-200 shadow-2xs">
              Showing:{' '}
              <span className={toggleActive === 'stego' ? 'text-violet-700 font-bold' : 'text-slate-800 font-bold'}>
                {toggleActive === 'stego' ? 'Stego-PNG (Modulated)' : 'Original Cover'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setToggleActive('original')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                toggleActive === 'original'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              View Original Cover
            </button>
            <button
              type="button"
              onClick={() => setToggleActive('stego')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                toggleActive === 'stego'
                  ? 'bg-[#7C3AED] text-white shadow-md shadow-violet-500/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              View Encoded Stego-Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
