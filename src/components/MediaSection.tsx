import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Video, FileAudio, Sliders, Info, Eye } from 'lucide-react';

export const MediaSection: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [activeBitPlane, setActiveBitPlane] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 320;
    const h = 240;
    canvas.width = w;
    canvas.height = h;

    const imgData = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const baseVal = Math.floor((x / w) * 200 + (y / h) * 55);
        const bit = (baseVal >> activeBitPlane) & 1;
        const displayVal = bit ? 255 : 0;

        imgData.data[idx] = displayVal;
        imgData.data[idx + 1] = displayVal;
        imgData.data[idx + 2] = displayVal;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [activeBitPlane]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);
        osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 3.0);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 4.0);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setIsPlayingAudio(true);
        setTimeout(() => {
          setIsPlayingAudio(false);
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
        }, 4000);
      } catch (err) {
        console.error('Audio playback error', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#09132C] px-6 py-5 sm:px-8 sm:py-6 shadow-sm border border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Video className="h-6 w-6 text-blue-400" />
            <span>Interactive Media Walkthrough</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Multimedia exploration featuring HTML5 video demonstrations, audio narration, and real-time bit decomposers.
          </p>
        </div>
        <div className="text-xs font-mono bg-blue-950/80 px-3 py-1.5 rounded-xl border border-blue-800 text-blue-300 shrink-0">
          Interactive Media
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Canvas Bit-Plane Decomposer */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Bit-Plane Decomposer</span>
              </span>
              <span className="text-[11px] font-mono text-blue-600 font-bold">
                Bit {activeBitPlane} ({activeBitPlane === 0 ? 'LSB' : 'MSB'})
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Inspect how bits are distributed across pixels. Bit 0 contains high-entropy noise where ciphertext is embedded.
            </p>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
                <button
                  key={b}
                  onClick={() => setActiveBitPlane(b)}
                  className={`flex-1 py-1 text-[11px] font-mono font-bold rounded-lg transition-colors ${
                    activeBitPlane === b
                      ? 'bg-[#1D64F2] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  B{b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-blue-600" />
            <span>Bit 0 carries SecretPixel ciphertext</span>
          </div>
        </div>

        {/* Card 2: HTML5 Video Element */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                <span>Project Video Walkthrough</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">HTML5 Video</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Technical video player illustrating the sender-to-receiver cryptographic payload pipeline.
            </p>

            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-4/3 flex items-center justify-center">
              <video
                controls
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 480'%3E%3Crect width='640' height='480' fill='%23080B14'/%3E%3Ccircle cx='320' cy='240' r='60' fill='%23111827' stroke='%2338BDF8' stroke-width='2'/%3E%3Cpolygon points='310,215 345,240 310,265' fill='%2338BDF8'/%3E%3Ctext x='320' y='340' fill='%23A5B4C7' font-family='sans-serif' font-size='16' text-anchor='middle'%3ESecretPixel Demonstration Video%3C/text%3E%3C/svg%3E"
                className="w-full h-full object-cover"
              >
                <source src="/assets/demo_walkthrough.mp4" type="video/mp4" />
                Your browser does not support HTML5 video tag.
              </video>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Standard HTML5 Controls Enabled</span>
            <span className="font-mono text-blue-600 font-semibold">1080p Stream Ready</span>
          </div>
        </div>

        {/* Card 3: HTML5 Audio Narration */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileAudio className="h-4 w-4 text-emerald-600" />
                <span>Audio Guide &amp; Narration</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">HTML5 Audio</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Listen to the audio guide explaining the difference between ciphertext entropy and cover image steganography.
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Volume2 className="h-6 w-6" />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-900">Project Narration &amp; Key Sequence</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Synthesized Audio Sample</div>
              </div>

              <audio controls className="w-full h-8">
                <source src="/assets/narration.mp3" type="audio/mpeg" />
                Your browser does not support HTML5 audio.
              </audio>

              <button
                type="button"
                onClick={handleToggleAudio}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Stop Audio Sample</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Play Web Audio Sample</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-emerald-600" />
            <span>Supports standard MP3 and Web Audio API synthesis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
